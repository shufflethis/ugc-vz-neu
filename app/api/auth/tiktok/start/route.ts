import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  createPkcePair,
  getTikTokOAuthScopes,
  isTikTokOAuthConfigured,
  signOAuthState,
  SOCIAL_OAUTH_STATE_COOKIE,
} from '@/app/lib/social-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.redirect(new URL('/konto', request.url), 303);
  }
  if (!isTikTokOAuthConfigured()) {
    return NextResponse.redirect(new URL('/konto?oauth=tiktok_unconfigured#social-verify', request.url), 303);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirectUri = new URL('/api/auth/tiktok/callback', baseUrl).toString();
  const nonce = crypto.randomBytes(16).toString('base64url');
  const { codeVerifier, codeChallenge } = createPkcePair();
  const signedState = signOAuthState({ creatorId, provider: 'tiktok', nonce, codeVerifier });

  const authorizeUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authorizeUrl.searchParams.set('client_key', process.env.TIKTOK_CLIENT_KEY!.trim());
  authorizeUrl.searchParams.set('scope', getTikTokOAuthScopes());
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', signedState);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizeUrl.toString(), 303);
  response.cookies.set(SOCIAL_OAUTH_STATE_COOKIE, signedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });
  return response;
}
