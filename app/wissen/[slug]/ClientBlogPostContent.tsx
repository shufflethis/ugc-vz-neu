'use client';

interface ClientBlogPostContentProps {
  content: string;
}

/**
 * Entfernt unerwünschte HTML-Strukturtags aus dem WordPress-Content.
 * WordPress liefert manchmal Content mit <html>, <head>, <body>-Tags,
 * die zu SEO-Problemen führen (multiple head elements).
 */
function sanitizeContent(html: string): string {
  let sanitized = html;

  // Entferne <html>, </html>, <head>, </head>, <body>, </body> Tags
  sanitized = sanitized.replace(/<\/?html[^>]*>/gi, '');
  sanitized = sanitized.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  sanitized = sanitized.replace(/<\/?body[^>]*>/gi, '');

  // Entferne <!DOCTYPE> falls vorhanden
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');

  return sanitized.trim();
}

/**
 * Client-Komponente für die Darstellung des Blog-Inhalts
 * Diese Komponente wird verwendet, um den HTML-Content des Blogposts zu rendern,
 * während die Schema.org-Daten bereits serverseitig eingebettet werden.
 */
const ClientBlogPostContent = ({ content }: ClientBlogPostContentProps) => {
  const sanitizedContent = sanitizeContent(content);

  return (
    <div
      className="prose prose-lg prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default ClientBlogPostContent;