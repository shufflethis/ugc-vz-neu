import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import goneSlugsJson from '@/content/gone-slugs.json';
import publishedSlugsJson from '@/content/published-slugs.json';

const goneSlugs = new Set(goneSlugsJson as string[]);
const publishedSlugs = new Set(publishedSlugsJson as string[]);

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  const analyticsSource = 'https://analytics.polymarkt.de';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} ${analyticsSource}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://p16-sign-va.tiktokcdn.com https://p16-sign.tiktokcdn-us.com https://scontent.cdninstagram.com https://*.fbcdn.net https://yt3.ggpht.com https://yt3.googleusercontent.com https://www.gravatar.com https://i.ytimg.com",
    "font-src 'self'",
    `connect-src 'self' ${analyticsSource}`,
    "media-src 'self'",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
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
  // Vercel may keep the deployment hostname in `Host` while preserving the
  // public custom domain in `x-forwarded-host` or the request URL. Check all
  // authoritative host representations so the retired WordPress subdomain is
  // handled consistently on preview IP tests and on the real HTTPS domain.
  const hostCandidates = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    request.nextUrl.hostname,
  ]
    .flatMap(value => (value || '').split(','))
    .map(value => value.trim().split(':')[0]?.toLowerCase())
    .filter(Boolean);
  const isWordPressHost = hostCandidates.includes('wp.ugc-vz.de');
  const pathname = request.nextUrl.pathname;
  const normalizedSlug = pathname.replace(/^\/+|\/+$/g, '');

  if (isWordPressHost) {
    if (pathname.startsWith('/wp-content/uploads/')) return applySecurityHeaders(NextResponse.next(), request);
    if (!normalizedSlug) return NextResponse.redirect('https://ugc-vz.de', 308);
    if (publishedSlugs.has(normalizedSlug)) return NextResponse.redirect(`https://ugc-vz.de/wissen/${normalizedSlug}`, 308);
    return gone(request);
  }

  const wissenMatch = pathname.match(/^\/wissen\/([^/]+)\/?$/);
  if (wissenMatch && goneSlugs.has(wissenMatch[1])) return gone(request);

  // Markdown-Content-Negotiation (acceptmarkdown.com): GET mit
  // "Accept: text/markdown" auf ausgehandelte Pfade wird auf die
  // Markdown-Variante unter /md/... rewritet (app/md/[[...path]]/route.ts).
  if (
    request.method === 'GET' &&
    !pathname.startsWith('/md') &&
    (request.headers.get('accept') || '').toLowerCase().includes('text/markdown') &&
    isMarkdownNegotiatedPath(pathname)
  ) {
    const target = new URL(`/md${pathname === '/' ? '' : pathname.replace(/\/+$/, '')}`, request.url);
    return NextResponse.rewrite(target);
  }

  // HTML-Variante der ausgehandelten Pfade: Vary muss Accept enthalten, sonst
  // koennen CDNs die Markdown- und die HTML-Antwort im selben Cache-Slot
  // mischen. Nexts eigene Vary-Werte (RSC, ...) explizit mitfuehren statt sie
  // zu ueberschreiben - Client-Caches unterscheiden sonst RSC-Payloads nicht
  // mehr von HTML.
  if (request.method === 'GET' && isMarkdownNegotiatedPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept');
    return response;
  }

  // Security-Header kommen zentral aus next.config.js headers() - hier nicht
  // erneut setzen, sonst antwortet die Seite mit zwei CSP-Headern (Browser
  // erzwingen dann die Schnittmenge).
  return NextResponse.next();
}

// Pfade mit Markdown-Variante; muss zur STATIC_PAGES-Liste in
// app/md/[[...path]]/route.ts passen (plus /wissen und /wissen/<slug>).
function isMarkdownNegotiatedPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (['/', '/developers', '/brands', '/creator', '/vergleich', '/about', '/contact', '/privacy', '/wissen'].includes(normalized)) return true;
  return /^\/wissen\/[^/]+$/.test(normalized);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
