'use client';

interface ClientBlogPostContentProps {
  content: string;
}

/**
 * Entfernt unerwünschte HTML-Strukturtags aus dem WordPress-Content
 * und repariert kaputte Links.
 */
function sanitizeContent(html: string): string {
  let sanitized = html;

  // Entferne <html>, </html>, <head>, </head>, <body>, </body> Tags
  sanitized = sanitized.replace(/<\/?html[^>]*>/gi, '');
  sanitized = sanitized.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  sanitized = sanitized.replace(/<\/?body[^>]*>/gi, '');

  // Entferne <!DOCTYPE> falls vorhanden
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');

  // Repariere kaputte E-Mail-Links (href="email@domain.de" → href="mailto:email@domain.de")
  sanitized = sanitized.replace(
    /href="([^"@]+@[^"@]+\.[^"]+)"/gi,
    (match, email) => {
      // Nur reparieren wenn es keine URL ist und noch kein mailto: hat
      if (!email.startsWith('mailto:') && !email.includes('://') && !email.includes('/')) {
        return `href="mailto:${email}"`;
      }
      return match;
    }
  );

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