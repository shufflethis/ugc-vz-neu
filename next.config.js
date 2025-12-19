/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for problematic pages during build
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  // Disable static generation to fix React context issues
  output: 'standalone',
  trailingSlash: false,

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

  // Redirects für alte/nicht existierende URLs (SEO fix für Seobility 404s)
  async redirects() {
    return [
      // Thematisch passende Redirects
      { source: '/wissen/was-ist-ugc', destination: '/wissen/ugc-faqs-fuer-brands', permanent: true },
      { source: '/wissen/ugc-creator-werden', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/creator-werden', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/ugc-creator-werden-anleitung', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/ugc-creator-finden', destination: '/wissen/ugc-creator-finden-17-wege-ohne-agentur-fuer-erfolgreiches-marketing', permanent: true },
      { source: '/wissen/creator-finden', destination: '/wissen/ugc-creator-finden-17-wege-ohne-agentur-fuer-erfolgreiches-marketing', permanent: true },
      { source: '/wissen/ugc-agentur', destination: '/wissen/ugc-agentur-vs-plattform-was-ist-besser', permanent: true },
      { source: '/wissen/preise', destination: '/wissen/ugc-preise-was-kostet-ugc', permanent: true },
      { source: '/wissen/ugc-creator-kosten', destination: '/wissen/ugc-preise-was-kostet-ugc', permanent: true },
      { source: '/wissen/trends', destination: '/wissen/ugc-trends-2025', permanent: true },
      { source: '/wissen/ugc-trends', destination: '/wissen/ugc-trends-2025', permanent: true },
      { source: '/wissen/ugc-entwicklung-trends-2023', destination: '/wissen/ugc-trends-2025', permanent: true },
      { source: '/wissen/rechtliches-ugc', destination: '/wissen/ugc-recht-was-ist-zu-beachten', permanent: true },
      { source: '/wissen/ugc-marketing-definition-vorteile-best-practices', destination: '/wissen/ugc-faqs-fuer-brands', permanent: true },
      { source: '/wissen/ugc-marketing-strategie-aufbauen', destination: '/wissen/ugc-content-strategie-entwickeln', permanent: true },
      { source: '/wissen/ugc-strategie-aufbauen', destination: '/wissen/ugc-content-strategie-entwickeln', permanent: true },
      { source: '/wissen/ugc-vs-influencer-marketing-unterschiede-und-gemeinsamkeiten', destination: '/wissen/warum-ugc-guenstiger-als-influencer-marketing-ist', permanent: true },
      { source: '/wissen/warum-micro-influencer-die-zukunft-des-influencer-marketings-sind', destination: '/wissen/warum-ugc-guenstiger-als-influencer-marketing-ist', permanent: true },
      { source: '/wissen/warum-ugc-das-vertrauen-in-marken-staerkt', destination: '/wissen/ugc-und-social-proof', permanent: true },
      { source: '/wissen/nano-influencer', destination: '/wissen/warum-ugc-guenstiger-als-influencer-marketing-ist', permanent: true },
      { source: '/wissen/erfolgreiche-ugc-kampagnen', destination: '/wissen/ugc-success-stories', permanent: true },
      { source: '/wissen/erfolgsgeschichten', destination: '/wissen/ugc-success-stories', permanent: true },
      { source: '/wissen/case-studies', destination: '/wissen/ugc-success-stories', permanent: true },
      { source: '/wissen/erfolgsgeheimnisse-top-ugc-creator', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/erfolgsmetriken-fuer-content-creators', destination: '/wissen/wie-messe-ich-ugc-roi', permanent: true },
      { source: '/wissen/creator-erfolgsstatistiken-2023', destination: '/wissen/wie-messe-ich-ugc-roi', permanent: true },
      { source: '/wissen/creator-portfolio', destination: '/wissen/ugc-creator-portfolio-so-baust-du-es-auf', permanent: true },
      { source: '/wissen/creator-profil-erstellen', destination: '/wissen/ugc-creator-portfolio-so-baust-du-es-auf', permanent: true },
      { source: '/wissen/ugc-creator-ressourcen', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/ressourcen-fuer-creator', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/user-generated-content-erstellen-lassen', destination: '/wissen/ugc-briefing-so-briefest-du-creator-richtig', permanent: true },
      { source: '/wissen/ugc-academy', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/ugc-creator-academy', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/creator-academy', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/creator-guide', destination: '/wissen/ugc-faqs-fuer-creator', permanent: true },
      { source: '/wissen/lifestyle', destination: '/wissen/ugc-content-strategie-entwickeln', permanent: true },
      { source: '/wissen/podcaster', destination: '/wissen/ugc-content-repurposing', permanent: true },
      { source: '/wissen/plattform-vergleich', destination: '/wissen/ugc-plattformen-im-vergleich', permanent: true },
      { source: '/wissen/ugc-monetarisierung', destination: '/wissen/ugc-preise-was-kostet-ugc', permanent: true },
      { source: '/wissen/erfolgreiche-ugc-strategien', destination: '/wissen/ugc-content-strategie-entwickeln', permanent: true },

      // Allgemeine Redirects zur Hauptseite /wissen
      { source: '/wissen/anmeldung', destination: '/wissen', permanent: true },
      { source: '/wissen/arten-von-user-generated-content', destination: '/wissen', permanent: true },
      { source: '/wissen/blog', destination: '/wissen', permanent: true },
      { source: '/wissen/community', destination: '/wissen', permanent: true },
      { source: '/wissen/community-events', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-kategorien', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-ranking', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-services', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-typen', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-verifizierung', destination: '/wissen', permanent: true },
      { source: '/wissen/creator-verzeichnis', destination: '/wissen', permanent: true },
      { source: '/wissen/creators', destination: '/wissen', permanent: true },
      { source: '/wissen/events', destination: '/wissen', permanent: true },
      { source: '/wissen/formate', destination: '/wissen', permanent: true },
      { source: '/wissen/formats', destination: '/wissen', permanent: true },
      { source: '/wissen/fuer-creator', destination: '/wissen', permanent: true },
      { source: '/wissen/fuer-creator-registrieren', destination: '/wissen', permanent: true },
      { source: '/wissen/fuer-unternehmen', destination: '/wissen', permanent: true },
      { source: '/wissen/kategorien', destination: '/wissen', permanent: true },
      { source: '/wissen/leistungen', destination: '/wissen', permanent: true },
      { source: '/wissen/marken', destination: '/wissen', permanent: true },
      { source: '/wissen/marken-ressourcen', destination: '/wissen', permanent: true },
      { source: '/wissen/premium-profil-vorteile', destination: '/wissen', permanent: true },
      { source: '/wissen/ratgeber', destination: '/wissen', permanent: true },
      { source: '/wissen/registration', destination: '/wissen', permanent: true },
      { source: '/wissen/registrierung', destination: '/wissen', permanent: true },
      { source: '/wissen/ueber-uns', destination: '/wissen', permanent: true },
      { source: '/wissen/unternehmen', destination: '/wissen', permanent: true },
      { source: '/wissen/verifizierung', destination: '/wissen', permanent: true },
      { source: '/wissen/verzeichnis', destination: '/wissen', permanent: true },
      { source: '/wissen/workshops', destination: '/wissen', permanent: true },
      { source: '/wissen/ugc-vz.de', destination: '/wissen', permanent: true },
    ];
  },

  // Sicherheits-Header für alle Routen
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
      {
        // Statische Assets (_next/static/*)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Favicon und andere Root-Assets
        source: '/(favicon.ico|robots.txt|sitemap.xml|manifest.json)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // CSS Assets
        source: '/:path*.css',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // JavaScript Assets
        source: '/:path*.js',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Image Assets
        source: '/:path*.(png|jpg|jpeg|gif|svg|ico|webp)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Font Assets
        source: '/:path*.(woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig