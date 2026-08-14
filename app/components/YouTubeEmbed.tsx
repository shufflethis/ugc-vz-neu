'use client';

import { useState } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
}

/**
 * Click-to-load YouTube-Embed.
 * Laedt das iframe erst nach Klick auf das Thumbnail (LCP- und DSGVO-schonend).
 */
export default function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`${title} abspielen`}
      className="absolute inset-0 w-full h-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-geo-violet"
    >
      {/* YouTube-Thumbnail (oeffentlich erreichbar, kein Tracking bis Klick) */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dunkler Overlay + Play-Button */}
      <span className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/30 transition-colors" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
