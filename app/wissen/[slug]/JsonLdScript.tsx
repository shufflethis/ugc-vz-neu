


interface JsonLdScriptProps {
  data: string | object;
}

/**
 * Client-Komponente, die JSON-LD für Rich Snippets rendert
 * Diese Implementierung löst das Problem mit dem Google Rich Results Test,
 * indem sie das JSON-LD in einer separaten Client-Komponente rendert
 */
const JsonLdScript = ({ data }: JsonLdScriptProps) => {
  // Konvertiere das Objekt zu einem String, falls es ein Objekt ist
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

  // Verwende dangerouslySetInnerHTML, um sicherzustellen, dass der String korrekt gerendert wird
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
};

export default JsonLdScript;