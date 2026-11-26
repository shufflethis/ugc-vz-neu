/**
 * Homepage Schema.org structured data
 * Includes Organization, Person, WebSite, and Service schemas (DE, AT, CH)
 */
export default function HomePageSchema() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://ugc-vz.de/#organization',
    name: 'UGC VZ',
    legalName: 'track by track GmbH',
    parentOrganization: {
      '@type': 'Organization',
      name: 'famefact',
      url: 'https://famefact.com',
    },
    url: 'https://ugc-vz.de',
    logo: 'https://ugc-vz.de/ugc-vz-logo.webp',
    description:
      'UGC VZ ist eine Plattform für Creator-Kampagnen in Deutschland, Österreich und der Schweiz. Marken zahlen nach geprüften Views mit fester Budget-Obergrenze.',
    foundingDate: '2020',
    founder: {
      '@type': 'Person',
      '@id': 'https://ugc-vz.de/#tobias-sander',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Schliemannstr. 23',
      postalCode: '10437',
      addressLocality: 'Berlin',
      addressCountry: 'DE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+49-30-403665451',
      contactType: 'customer service',
      email: 'hi@ugc-vz.de',
      availableLanguage: ['German', 'English'],
    },
    sameAs: [
      'https://famefact.com',
      'https://www.linkedin.com/company/track-by-track-gmbh',
      'https://www.linkedin.com/in/tobias-famefact/',
      'https://x.com/UGC_VZ',
      'https://www.instagram.com/UGC_VZ/',
      'https://www.youtube.com/@ugcvz',
      'https://github.com/ugcvz',
    ],
    taxID: 'DE814954842',
    duns: '34-024-8055',
    vatID: 'DE814954842',
    areaServed: ['DE', 'AT', 'CH'],
    knowsAbout: [
      'User Generated Content',
      'UGC Marketing',
      'Creator Economy',
      'Video Marketing',
      'Influencer Marketing',
      'Social Media Strategy',
      'TikTok Marketing',
      'Instagram Marketing',
      'View-Kampagnen',
    ],
    slogan: 'Echte Creator. Echte Views. Dein Budget.',
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://ugc-vz.de/#tobias-sander',
    name: 'Tobias Sander',
    givenName: 'Tobias',
    familyName: 'Sander',
    jobTitle: 'Geschäftsführer & Gründer',
    description:
      'Tobias Sander ist Gründer und Geschäftsführer der track by track GmbH (famefact) und Experte für Creator-Kampagnen und Social Media Marketing im DACH-Raum.',
    url: 'https://ugc-vz.de/about',
    sameAs: ['https://www.linkedin.com/in/tobias-famefact/'],
    worksFor: {
      '@type': 'Organization',
      '@id': 'https://ugc-vz.de/#organization',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Berlin',
      addressCountry: 'DE',
    },
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'UGC VZ Creator-Kampagnen',
    description:
      'Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze sowie direkte Creator-Produktionen für Marken in Deutschland, Österreich und der Schweiz.',
    provider: {
      '@type': 'Organization',
      '@id': 'https://ugc-vz.de/#organization',
    },
    serviceType: 'Creator Campaign Platform',
    areaServed: ['DE', 'AT', 'CH'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'UGC VZ Kampagnenmodelle',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'View-Kampagne',
            description:
              'Creator posten auf TikTok, Instagram Reels oder YouTube Shorts. Marken zahlen pro 1.000 geprüfte Views mit fester Budget-Obergrenze. 15 % Servicegebühr im Budget enthalten, 0 % für Creator.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Creator-Produktion',
            description:
              'Produktvideos und Ad-Creatives direkt bei passenden Creatorn im DACH-Raum beauftragen, mit klaren Nutzungsrechten.',
          },
        },
      ],
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://ugc-vz.de/#website',
    url: 'https://ugc-vz.de',
    name: 'UGC VZ',
    description:
      'Plattform für Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze für Marken und Creator in Deutschland, Österreich und der Schweiz.',
    publisher: {
      '@type': 'Organization',
      '@id': 'https://ugc-vz.de/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://ugc-vz.de/brands/ugc-creator-finden?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'de-DE',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}
