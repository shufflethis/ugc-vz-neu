import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import goneSlugsJson from '@/content/gone-slugs.json';
import publishedSlugsJson from '@/content/published-slugs.json';

const goneSlugs = new Set(goneSlugsJson as string[]);
const publishedSlugs = new Set(publishedSlugsJson as string[]);

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  const analyticsSources = 'https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://region1.analytics.google.com';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} ${analyticsSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://p16-sign-va.tiktokcdn.com https://p16-sign.tiktokcdn-us.com https://scontent.cdninstagram.com https://*.fbcdn.net https://yt3.ggpht.com https://yt3.googleusercontent.com https://www.gravatar.com https://www.google-analytics.com",
    "font-src 'self'",
    `connect-src 'self' ${analyticsSources}`,
    "media-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  if (request.nextUrl.protocol === 'https:') response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

function gone(request: NextRequest) {
  return applySecurityHeaders(new NextResponse('Dieser frühere WordPress-Inhalt ist dauerhaft entfernt.\n', {
    status: 410,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, follow' },
  }), request);
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase() || '';
  const pathname = request.nextUrl.pathname;
  const normalizedSlug = pathname.replace(/^\/+|\/+$/g, '');

  if (hostname === 'wp.ugc-vz.de') {
    if (pathname.startsWith('/wp-content/uploads/')) return applySecurityHeaders(NextResponse.next(), request);
    if (!normalizedSlug) return NextResponse.redirect('https://ugc-vz.de', 308);
    if (publishedSlugs.has(normalizedSlug)) return NextResponse.redirect(`https://ugc-vz.de/wissen/${normalizedSlug}`, 308);
    return gone(request);
  }

  const wissenMatch = pathname.match(/^\/wissen\/([^/]+)\/?$/);
  if (wissenMatch && goneSlugs.has(wissenMatch[1])) return gone(request);
  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
