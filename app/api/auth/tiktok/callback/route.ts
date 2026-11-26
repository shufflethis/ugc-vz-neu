import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  isTikTokOAuthConfigured,
  resolveOAuthCallbackState,
  SOCIAL_OAUTH_STATE_COOKIE,
  upsertVerifiedOAuthSocialAccount,
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
  if (!isTikTokOAuthConfigured() || !isDatabaseConfigured()) {
    return redirectWithStatus(request, 'tiktok_error');
  }

  const providerError = request.nextUrl.searchParams.get('error') || '';
  if (providerError) {
    return redirectWithStatus(request, providerError === 'access_denied' ? 'tiktok_denied' : 'tiktok_error');
  }

  const code = request.nextUrl.searchParams.get('code') || '';
  const stateParam = request.nextUrl.searchParams.get('state') || '';
  const sessionCreatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  const state = resolveOAuthCallbackState({
    cookieValue: request.cookies.get(SOCIAL_OAUTH_STATE_COOKIE)?.value,
    stateParam,
    expectedProvider: 'tiktok',
    sessionCreatorId,
  });
  if (!code || !state || !state.codeVerifier) {
    return redirectWithStatus(request, 'tiktok_invalid');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const redirectUri = new URL('/api/auth/tiktok/callback', baseUrl).toString();
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!.trim(),
        client_secret: process.env.TIKTOK_CLIENT_SECRET!.trim(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: state.codeVerifier,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      open_id?: string;
      scope?: string;
    };
    if (!tokenRes.ok || !tokenData.access_token || !tokenData.open_id) {
      return redirectWithStatus(request, 'tiktok_error');
    }

    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,profile_deep_link,follower_count',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        signal: AbortSignal.timeout(8_000),
      },
    );
    const userJson = (await userRes.json()) as {
      data?: { user?: { open_id?: string; username?: string; display_name?: string; follower_count?: number } };
    };
    const user = userJson.data?.user;
    const username = (user?.username || user?.display_name || '').trim().replace(/^@/, '');
    const profileUrl = username ? `https://www.tiktok.com/@${username}` : 'https://www.tiktok.com/';

    await upsertVerifiedOAuthSocialAccount(getDatabase(), {
      creatorId: state.creatorId,
      platform: 'tiktok',
      handle: username || tokenData.open_id,
      url: profileUrl,
      providerAccountId: String(user?.open_id || tokenData.open_id),
      followers: typeof user?.follower_count === 'number' ? user.follower_count : null,
      scope: tokenData.scope || 'user.info.basic,video.list',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresInSeconds: typeof tokenData.expires_in === 'number' ? tokenData.expires_in : 86400,
    });

    return redirectWithStatus(request, 'tiktok_ok');
  } catch (err) {
    console.error('TikTok OAuth callback failed', err instanceof Error ? err.message : 'unknown');
    return redirectWithStatus(request, 'tiktok_error');
  }
}
