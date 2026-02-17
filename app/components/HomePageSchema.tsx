

/**
 * Homepage Schema.org structured data
 * Includes Organization, Person, WebSite, and Service schemas
 */
export default function HomePageSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://ugc-vz.de/#organization",
    "name": "Track by Track GmbH",
    "alternateName": "UGC-VZ",
    "url": "https://ugc-vz.de",
    "logo": "https://ugc-vz.de/ugc-vz-logo.webp",
    "description": "Track by Track GmbH ist eine führende Agentur für User Generated Content Marketing und Creator Economy Strategien mit Sitz in Berlin.",
    "foundingDate": "2020",
    "founder": {
      "@type": "Person",
      "@id": "https://ugc-vz.de/#tobias-sander"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Schliemannstr. 23",
      "postalCode": "10437",
      "addressLocality": "Berlin",
      "addressCountry": "DE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+49-30-403665451",
      "contactType": "customer service",
      "email": "hi@ugc-vz.de",
      "availableLanguage": ["German", "English"]
    },
    "sameAs": [
      "https://famefact.com",
      "https://www.linkedin.com/company/track-by-track-gmbh",
      "https://www.linkedin.com/in/tobias-famefact/",
      "https://twitter.com/Ugc_Vz"
    ],
    "taxID": "DE814954842",
    "duns": "34-024-8055",
    "legalName": "Track by Track GmbH",
    "vatID": "DE814954842",
    "areaServed": {
      "@type": "Country",
      "name": "Germany"
    },
    "knowsAbout": [
      "User Generated Content",
      "UGC Marketing",
      "Creator Economy",
      "Video Marketing",
      "Influencer Marketing",
      "Social Media Strategy",
      "TikTok Marketing",
      "Instagram Marketing",
      "Content Creator Management"
    ],
    "slogan": "Authentisches Marketing durch Creator-Content"
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://ugc-vz.de/#tobias-sander",
    "name": "Tobias Sander",
    "givenName": "Tobias",
    "familyName": "Sander",
    "jobTitle": "Geschäftsführer & Gründer",
    "description": "Tobias Sander ist Gründer und Geschäftsführer der Track by Track GmbH und führender Experte für User Generated Content Marketing und Creator Economy Strategien in Deutschland.",
    "url": "https://ugc-vz.de/about",
    "sameAs": [
      "https://www.linkedin.com/in/tobias-famefact/"
    ],
    "worksFor": {
      "@type": "Organization",
      "@id": "https://ugc-vz.de/#organization"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Berlin",
      "addressCountry": "DE"
    },
    "knowsAbout": [
      "User Generated Content",
      "Creator Economy",
      "Video Marketing Strategy",
      "Influencer Marketing",
      "Social Media Marketing",
      "Content Strategy",
      "Brand Building",
      "Digital Marketing",
      "E-Commerce Marketing"
    ],
    "expertise": [
      "UGC-Marketing",
      "Creator-Plattformen",
      "Video-Content-Strategie",
      "Performance Marketing",
      "Social Commerce"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "UGC Marketing Services",
    "description": "Professionelle User Generated Content Marketing Dienstleistungen für authentische Markenkommunikation durch Creator-Content",
    "provider": {
      "@type": "Organization",
      "@id": "https://ugc-vz.de/#organization"
    },
    "serviceType": "Marketing Services",
    "areaServed": {
      "@type": "Country",
      "name": "Germany"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "UGC Marketing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "UGC Creator Matching",
            "description": "Vermittlung passender Content Creator für Ihre Marke"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "UGC Campaign Management",
            "description": "End-to-End Management von User Generated Content Kampagnen"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Creator Strategy Consulting",
            "description": "Strategieberatung für erfolgreiche Creator Economy Integration"
          }
        }
      ]
    }
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://ugc-vz.de/#website",
    "url": "https://ugc-vz.de",
    "name": "UGC-VZ - Track by Track GmbH",
    "description": "Führende Plattform für User Generated Content Marketing und Creator Economy in Deutschland",
    "publisher": {
      "@type": "Organization",
      "@id": "https://ugc-vz.de/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ugc-vz.de/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["de-DE", "en-US"]
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
