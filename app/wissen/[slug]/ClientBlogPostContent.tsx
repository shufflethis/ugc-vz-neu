'use client';

interface ClientBlogPostContentProps {
  content: string;
}

/**
 * Client-Komponente für die Darstellung des Blog-Inhalts
 * Diese Komponente wird verwendet, um den HTML-Content des Blogposts zu rendern,
 * während die Schema.org-Daten bereits serverseitig eingebettet werden.
 */
const ClientBlogPostContent = ({ content }: ClientBlogPostContentProps) => {
  return (
    <div
      className="prose prose-lg prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ClientBlogPostContent;