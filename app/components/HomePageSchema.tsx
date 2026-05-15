

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
    "description": "UGC-VZ ist eine kostenlose UGC Plattform der track by track GmbH fuer Creator Matching, Creator Registrierung und User Generated Content in Deutschland.",
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
    "name": "UGC Creator Matching",
    "description": "Kostenlose Vermittlung und Suche von UGC Creators fuer Unternehmen in Deutschland sowie kostenlose Registrierung fuer Creator.",
    "provider": {
      "@type": "Organization",
      "@id": "https://ugc-vz.de/#organization"
    },
    "serviceType": "Creator Matching Platform",
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
            "name": "UGC Creator finden",
            "description": "Kostenlose Suche nach passenden Content Creators fuer Marken, Kampagnen und Produktvideos"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "UGC Creator Anmeldung",
            "description": "Kostenlose Profil- und Portfolio-Anmeldung fuer UGC Creators"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Optionaler Agentur-Support",
            "description": "Optionale strategische Unterstuetzung fuer groessere UGC Kampagnen"
          }
        }
      ]
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://ugc-vz.de/#website",
    "url": "https://ugc-vz.de",
    "name": "UGC-VZ - Track by Track GmbH",
    "description": "Kostenlose UGC Plattform fuer Creator-Suche, Creator-Anmeldung und User Generated Content Wissen in Deutschland",
    "publisher": {
      "@type": "Organization",
      "@id": "https://ugc-vz.de/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ugc-vz.de/brands?query={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "de-DE"
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
