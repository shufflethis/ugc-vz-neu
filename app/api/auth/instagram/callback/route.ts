import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import {
  getInstagramOAuthScopes,
  isInstagramOAuthConfigured,
  SOCIAL_OAUTH_STATE_COOKIE,
  upsertVerifiedOAuthSocialAccount,
  verifyOAuthState,
} from '@/app/lib/social-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const redirectWithStatus = (request: NextRequest, status: string) => {
  const url = new URL('/konto', request.url);
  url.searchParams.set('oauth', status);
  url.hash = 'social-verify';
  const res = NextResponse.redirect(url, 303);
  res.cookies.delete(SOCIAL_OAUTH_STATE_COOKIE);
  return res;
};

export async function GET(request: NextRequest) {
  if (!isInstagramOAuthConfigured() || !isDatabaseConfigured()) {
    return redirectWithStatus(request, 'instagram_error');
  }

  const code = request.nextUrl.searchParams.get('code') || '';
  const stateParam = request.nextUrl.searchParams.get('state') || '';
  const state = verifyOAuthState(request.cookies.get(SOCIAL_OAUTH_STATE_COOKIE)?.value, 'instagram');
  if (!code || !state || state.nonce !== stateParam) {
    return redirectWithStatus(request, 'instagram_invalid');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const redirectUri = new URL('/api/auth/instagram/callback', baseUrl).toString();
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!.trim(),
        client_secret: process.env.INSTAGRAM_APP_SECRET!.trim(),
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      user_id?: string | number;
      permissions?: string | string[];
    };
    if (!tokenRes.ok || !tokenData.access_token) {
      return redirectWithStatus(request, 'instagram_error');
    }

    // Exchange short-lived token (1h) for a 60-day long-lived Instagram token for scheduled view syncing.
    let finalAccessToken = tokenData.access_token;
    let expiresInSeconds = 3600;
    try {
      const exchangeUrl = new URL('https://graph.instagram.com/access_token');
      exchangeUrl.searchParams.set('grant_type', 'ig_exchange_token');
      exchangeUrl.searchParams.set('client_secret', process.env.INSTAGRAM_APP_SECRET!.trim());
      exchangeUrl.searchParams.set('access_token', tokenData.access_token);
      const exchangeRes = await fetch(exchangeUrl.toString(), { signal: AbortSignal.timeout(8_000) });
      if (exchangeRes.ok) {
        const longLived = (await exchangeRes.json()) as { access_token?: string; expires_in?: number };
        if (longLived.access_token) {
          finalAccessToken = longLived.access_token;
          expiresInSeconds = typeof longLived.expires_in === 'number' && longLived.expires_in > 0
            ? longLived.expires_in
            : 60 * 24 * 3600;
        }
      }
    } catch {
      // Fallback gracefully to short-lived token if long-lived exchange fails in test/sandbox mode.
    }

    const meUrl = new URL('https://graph.instagram.com/me');
    meUrl.searchParams.set('fields', 'user_id,username,followers_count');
    meUrl.searchParams.set('access_token', finalAccessToken);
    const meRes = await fetch(meUrl.toString(), { signal: AbortSignal.timeout(8_000) });
    const me = (await meRes.json()) as { id?: string; user_id?: string; username?: string; followers_count?: number };

    const username = (me.username || '').trim().replace(/^@/, '');
    const providerAccountId = String(me.user_id || me.id || tokenData.user_id || '');
    if (!providerAccountId) {
      return redirectWithStatus(request, 'instagram_error');
    }

    const grantedScope = Array.isArray(tokenData.permissions)
      ? tokenData.permissions.join(',')
      : typeof tokenData.permissions === 'string' && tokenData.permissions.trim()
        ? tokenData.permissions.trim()
        : getInstagramOAuthScopes();

    await upsertVerifiedOAuthSocialAccount(getDatabase(), {
      creatorId: state.creatorId,
      platform: 'instagram',
      handle: username || providerAccountId,
      url: username ? `https://www.instagram.com/${username}/` : 'https://www.instagram.com/',
      providerAccountId,
      followers: typeof me.followers_count === 'number' ? me.followers_count : null,
      scope: grantedScope,
      accessToken: finalAccessToken,
      expiresInSeconds,
    });

    return redirectWithStatus(request, 'instagram_ok');
  } catch (err) {
    console.error('Instagram OAuth callback failed', err instanceof Error ? err.message : 'unknown');
    return redirectWithStatus(request, 'instagram_error');
  }
}
