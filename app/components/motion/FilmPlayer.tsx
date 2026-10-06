'use client';

// Website-Player fuer HowItWorksFilm: startet beim Sichtbarwerden, Tabs Brands/Creator,
// Sprungmarken je Beat, Pause. Unter 640 px Breite laeuft die 9:16-Komposition.
// prefers-reduced-motion: kein Autoplay, Standbild des Ergebnis-Zustands, Beats bleiben tippbar.
import { useEffect, useRef, useState } from 'react';
import HowItWorksFilm from './HowItWorksFilm';
import { BEATS, Film, LOOP_END } from './timeline';

const STILL: Record<Film, number> = { brands: 12.6, creator: 12.6 };

export default function FilmPlayer() {
  const wrap = useRef<HTMLDivElement>(null);
  const [film, setFilm] = useState<Film>('brands');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) { setPlaying(false); setT(STILL.brands); }
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    ro.observe(el);
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((prev) => (prev + dt > LOOP_END ? 0 : prev + dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, visible]);

  const vertical = width > 0 && width < 640;
  const stageW = vertical ? 900 : 1600;
  const stageH = vertical ? 1600 : 900;
  const scale = width ? width / stageW : 0;
  const beats = BEATS[film];
  const active = beats.reduce((idx, b, i) => (t >= b.at ? i : idx), 0);

  const switchFilm = (f: Film) => {
    setFilm(f);
    setT(reduced.current ? STILL[f] : 0);
  };

  return (
    <div>
      <div role="tablist" aria-label="Erklärfilm wählen" className="mx-auto mb-6 flex w-fit rounded-full border border-white/15 bg-white/5 p-1">
        {(['brands', 'creator'] as Film[]).map((f) => (
          <button key={f} role="tab" aria-selected={film === f} onClick={() => switchFilm(f)}
            className={`min-h-[44px] rounded-full px-5 text-sm font-semibold transition-colors ${film === f ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`}>
            {f === 'brands' ? 'Für Brands' : 'Für Creator'}
          </button>
        ))}
      </div>

      <div ref={wrap} className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-[0_40px_120px_rgba(91,70,240,0.25)]"
        style={{ height: scale ? stageH * scale : undefined, aspectRatio: scale ? undefined : '16 / 9' }}
        aria-label={film === 'brands' ? 'Animation: So findest du als Brand passende Creator' : 'Animation: So bekommst du als Creator Brand-Anfragen'}
        role="img">
        {scale > 0 && (
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} aria-hidden="true">
            <HowItWorksFilm t={t} film={film} format={vertical ? '9x16' : '16x9'} />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Animation pausieren' : 'Animation abspielen'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink">
          {playing
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${beats.length}, minmax(0, 1fr))` }}>
          {beats.map((b, i) => {
            const end = beats[i + 1]?.at ?? LOOP_END;
            const fill = Math.min(1, Math.max(0, (t - b.at) / (end - b.at)));
            return (
              <button key={b.label} onClick={() => setT(b.at + 0.01)} className="group min-h-[44px] text-left" aria-label={`Zu Schritt ${b.label} springen`}>
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  <span className="block h-full rounded-full bg-white" style={{ width: `${fill * 100}%` }} />
                </span>
                <span className={`mt-2 block truncate text-xs font-medium ${i === active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
