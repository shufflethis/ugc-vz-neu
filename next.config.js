/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // WordPress Backend (HTTPS bevorzugt)
      {
        protocol: 'https',
        hostname: 'wp.ugc-vz.de',
      },
      // Fallback für WordPress Backend (falls HTTPS nicht verfügbar)
      {
        protocol: 'http',
        hostname: 'wp.ugc-vz.de',
      },
      // TikTok Profile Images
      {
        protocol: 'https',
        hostname: 'p16-sign-va.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign.tiktokcdn-us.com',
      },
      // Instagram Profile Images
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'instagram.*.fbcdn.net',
      },
      // YouTube Profile Images
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
      // Placeholder Images
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Gravatar (falls verwendet)
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
    ],
  },

  // Sicherheits-Header für API-Routen
  async headers() {
    return [
      {
        // API-Routen
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig