import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Content Security Policy - optimiert für UGC-VZ
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''}
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://ssl.google-analytics.com
      https://cdn.kiprotect.com
      https://analytics.google.com
      https://analytics.polymarkt.de;
    style-src 'self' 'unsafe-inline'
      https://fonts.googleapis.com
      https://cdn.kiprotect.com;
    img-src 'self' data: blob:
      https://wp.ugc-vz.de
      http://wp.ugc-vz.de
      https://p16-sign-va.tiktokcdn.com
      https://p16-sign.tiktokcdn-us.com
      https://scontent.cdninstagram.com
      https://*.fbcdn.net
      https://yt3.ggpht.com
      https://yt3.googleusercontent.com
      https://via.placeholder.com
      https://www.gravatar.com
      https://www.google-analytics.com;
    font-src 'self'
      https://fonts.gstatic.com
      https://cdn.kiprotect.com;
    connect-src 'self'
      https://wp.ugc-vz.de
      http://wp.ugc-vz.de
      https://www.google-analytics.com
      https://analytics.google.com
      https://hooks.slack.com
      https://api.airtable.com
      https://region1.google-analytics.com
      https://region1.analytics.google.com
      https://analytics.polymarkt.de;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  // Set security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')
  
  // HSTS (HTTP Strict Transport Security) - nur für HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match ALL request paths to ensure security headers on every response
     * Including static files, API routes, and internal Next.js routes
     */
    {
      source: '/(.*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
