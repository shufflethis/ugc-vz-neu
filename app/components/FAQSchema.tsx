

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqItems: FAQItem[];
}

/**
 * FAQ Schema component for rich snippets in Google Search
 * Generates Schema.org FAQPage structured data
 */
export default function FAQSchema({ faqItems }: FAQSchemaProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
