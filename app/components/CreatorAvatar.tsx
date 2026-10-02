'use client';

import { useState } from 'react';

// Profilbild mit Initialen-Fallback: Fehlt ein Bild (Platzhalter-Dateien) oder
// laedt es nicht, zeigt die Karte die Initialen statt einer generischen Silhouette.
const isPlaceholder = (src?: string) => !src || /(^|\/)(female-)?placeholder\./.test(src);

export default function CreatorAvatar({ name, image, size = 64, imgClassName }: { name: string; image?: string; size?: number; imgClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (isPlaceholder(image) || failed) {
    return (
      <div
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full bg-geo-violet/10 font-bold text-geo-violet"
        style={{ width: size, height: size, flex: `0 0 ${size}px`, fontSize: size * 0.4 }}
      >
        {(name || '?').trim().charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={name} loading="lazy" width={size} height={size} className={imgClassName} onError={() => setFailed(true)} />
  );
}
