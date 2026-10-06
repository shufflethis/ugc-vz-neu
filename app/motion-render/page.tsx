'use client';

// Zeigt genau einen Frame des Erklaerfilms bildschirmfuellend:
// /motion-render?film=brands&format=16x9&t=7.5
// Der Export-Skript setzt die Zeit danach per window.__setT(t) Frame fuer Frame.
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HowItWorksFilm from '../components/motion/HowItWorksFilm';
import { Film, Format } from '../components/motion/timeline';

function Stage() {
  const params = useSearchParams();
  const film: Film = params.get('film') === 'creator' ? 'creator' : 'brands';
  const format: Format = params.get('format') === '9x16' ? '9x16' : '16x9';
  const [t, setT] = useState(Number(params.get('t') || 0));
  const [vw, setVw] = useState(1920);

  useEffect(() => {
    (window as unknown as { __setT: (n: number) => void }).__setT = setT;
    const resize = () => setVw(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const scale = vw / (format === '9x16' ? 900 : 1600);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#F7F7F5', overflow: 'hidden' }}>
      <div data-frame={t} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <HowItWorksFilm t={t} film={film} format={format} />
      </div>
    </div>
  );
}

export default function MotionRenderPage() {
  return <Suspense><Stage /></Suspense>;
}
