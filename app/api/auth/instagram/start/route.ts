import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  isInstagramOAuthConfigured,
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
  if (!isInstagramOAuthConfigured()) {
    return NextResponse.redirect(new URL('/konto?oauth=instagram_unconfigured#social-verify', request.url), 303);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirectUri = new URL('/api/auth/instagram/callback', baseUrl).toString();
  const nonce = crypto.randomBytes(16).toString('base64url');
  const signedState = signOAuthState({ creatorId, provider: 'instagram', nonce });

  const authorizeUrl = new URL('https://www.instagram.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!.trim());
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'instagram_business_basic');
  authorizeUrl.searchParams.set('state', nonce);

  const response = NextResponse.redirect(authorizeUrl.toString(), 303);
  response.cookies.set(SOCIAL_OAUTH_STATE_COOKIE, signedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
