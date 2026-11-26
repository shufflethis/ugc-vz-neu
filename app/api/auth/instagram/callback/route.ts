import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  getInstagramFacebookBusinessScopes,
  getInstagramOAuthScopes,
  getMetaGraphApiVersion,
  isInstagramFacebookBusinessLogin,
  isInstagramOAuthConfigured,
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

interface FacebookPageWithInstagram {
  id?: string;
  name?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
    name?: string;
    followers_count?: number;
  };
}

async function handleFacebookBusinessCallback(
  request: NextRequest,
  creatorId: string,
  code: string,
  redirectUri: string,
): Promise<NextResponse> {
  const appId = process.env.INSTAGRAM_APP_ID!.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET!.trim();
  const version = getMetaGraphApiVersion();

  // 1. Exchange authorization code for User Access Token via Meta Graph API.
  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('code', code);

  const tokenRes = await fetch(tokenUrl.toString(), { signal: AbortSignal.timeout(8_000) });
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error('Meta Unified Login token exchange failed', tokenData.error?.message || tokenRes.status);
    return redirectWithStatus(request, 'instagram_error');
  }

  // 2. Exchange short-lived user token for a 60-day long-lived user token for scheduled view syncing.
  let finalAccessToken = tokenData.access_token;
  let expiresInSeconds = typeof tokenData.expires_in === 'number' && tokenData.expires_in > 0
    ? tokenData.expires_in
    : 3600;
  try {
    const exchangeUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
    exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
    exchangeUrl.searchParams.set('client_id', appId);
    exchangeUrl.searchParams.set('client_secret', appSecret);
    exchangeUrl.searchParams.set('fb_exchange_token', tokenData.access_token);
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
    // Graceful fallback to initial token in sandbox/test mode.
  }

  // 3. Resolve linked Facebook Pages -> Instagram Business / Creator Account.
  const accountsUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  accountsUrl.searchParams.set('fields', 'id,name,instagram_business_account{id,username,name,followers_count}');
  accountsUrl.searchParams.set('limit', '50');
  accountsUrl.searchParams.set('access_token', finalAccessToken);

  const accountsRes = await fetch(accountsUrl.toString(), { signal: AbortSignal.timeout(8_000) });
  const accountsJson = (await accountsRes.json()) as {
    data?: FacebookPageWithInstagram[];
    error?: { message?: string };
  };
  if (!accountsRes.ok || accountsJson.error) {
    console.error('Meta /me/accounts lookup failed', accountsJson.error?.message || accountsRes.status);
    return redirectWithStatus(request, 'instagram_error');
  }

  const igAccounts = (Array.isArray(accountsJson.data) ? accountsJson.data : [])
    .map((page) => page.instagram_business_account)
    .filter((ig): ig is NonNullable<FacebookPageWithInstagram['instagram_business_account']> => Boolean(ig?.id));

  if (igAccounts.length === 0) {
    return redirectWithStatus(request, 'instagram_no_business_account');
  }

  // Prefer account with highest follower count when creator manages multiple pages.
  igAccounts.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));
  const selected = igAccounts[0];
  const providerAccountId = String(selected.id);
  const username = (selected.username || '').trim().replace(/^@/, '');

  await upsertVerifiedOAuthSocialAccount(getDatabase(), {
    creatorId,
    platform: 'instagram',
    handle: username || selected.name || providerAccountId,
    url: username ? `https://www.instagram.com/${username}/` : 'https://www.instagram.com/',
    providerAccountId,
    followers: typeof selected.followers_count === 'number' ? selected.followers_count : null,
    scope: `facebook_business:${getInstagramFacebookBusinessScopes()}`,
    accessToken: finalAccessToken,
    expiresInSeconds,
  });

  return redirectWithStatus(request, 'instagram_ok');
}

export async function GET(request: NextRequest) {
  if (!isInstagramOAuthConfigured() || !isDatabaseConfigured()) {
    return redirectWithStatus(request, 'instagram_error');
  }

  const providerError = request.nextUrl.searchParams.get('error') || '';
  if (providerError) {
    const reason = request.nextUrl.searchParams.get('error_reason') || '';
    console.warn('Instagram OAuth returned provider error', providerError, reason);
    return redirectWithStatus(request, providerError === 'access_denied' ? 'instagram_denied' : 'instagram_error');
  }

  const code = request.nextUrl.searchParams.get('code') || '';
  const stateParam = request.nextUrl.searchParams.get('state') || '';
  const sessionCreatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  const state = resolveOAuthCallbackState({
    cookieValue: request.cookies.get(SOCIAL_OAUTH_STATE_COOKIE)?.value,
    stateParam,
    expectedProvider: 'instagram',
    sessionCreatorId,
  });
  if (!code || !state) {
    return redirectWithStatus(request, 'instagram_invalid');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const redirectUri = new URL('/api/auth/instagram/callback', baseUrl).toString();

    if (isInstagramFacebookBusinessLogin()) {
      return await handleFacebookBusinessCallback(request, state.creatorId, code, redirectUri);
    }

    // Legacy Direct Instagram Login path (only used when INSTAGRAM_LOGIN_CONFIG_ID is unset).
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
      // Fallback gracefully to short-lived token in test/sandbox mode.
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
