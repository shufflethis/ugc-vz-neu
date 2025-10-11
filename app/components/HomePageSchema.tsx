'use client';

/**
 * Homepage Schema.org structured data
 * Includes Organization, WebSite, Service, and BreadcrumbList schemas
 */
export default function HomePageSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "UGC VZ",
    "legalName": "track by track GmbH",
    "url": "https://ugc-vz.de",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ugc-vz.de/ugc-vz-logo.webp",
      "width": 600,
      "height": 60
    },
    "description": "Professionelle Vermittlung von UGC Creators mit Businesses - Finde deinen perfekten UGC Creator kostenlos",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Schliemannstr. 23",
      "addressLocality": "Berlin",
      "postalCode": "10437",
      "addressCountry": "DE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+49-30-403665430",
      "email": "info@famefact.com",
      "contactType": "customer service",
      "areaServed": "DE",
      "availableLanguage": "German"
    },
    "founder": {
      "@type": "Person",
      "name": "Tobias Sander",
      "sameAs": "https://www.linkedin.com/in/tobias-s-32bab365/"
    },
    "sameAs": [
      "https://x.com/Ugc_Vz",
      "https://www.linkedin.com/in/tobias-s-32bab365/"
    ],
    "vatID": "DE814954842",
    "duns": "34-024-8055"
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "UGC VZ",
    "url": "https://ugc-vz.de",
    "description": "Finde deinen perfekten UGC Creator - Kostenlose Vermittlung von UGC Creators für Businesses",
    "publisher": {
      "@type": "Organization",
      "name": "UGC VZ"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://ugc-vz.de/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "UGC Creator Vermittlung",
    "description": "Professionelle und kostenlose Vermittlung von UGC Creators für Businesses. Beschreibe deine Kampagne und wir finden die passenden Creator für dich.",
    "provider": {
      "@type": "Organization",
      "name": "UGC VZ",
      "url": "https://ugc-vz.de"
    },
    "serviceType": "Creator Vermittlung",
    "areaServed": {
      "@type": "Country",
      "name": "Germany"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "UGC Creator Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "UGC Creator Matching",
            "description": "Kostenlose Vermittlung passender UGC Creators für deine Kampagne"
          }
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}
