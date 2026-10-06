// Deterministische Zeit-Helfer fuer die Erklaerfilme. Jede Funktion ist eine reine
// Funktion von t (Sekunden): kein Date.now, kein Zufall, keine CSS-Transitions.
// Dadurch ist jeder Frame direkt renderbar (Website-Player, Video-Export, Tests).

export type Film = 'brands' | 'creator';
export type Format = '16x9' | '9x16';

export const FILM_DURATION = 16;
/** Website-Loop springt vor dem Abspann zurueck auf 0. */
export const LOOP_END = 13.5;

export const BEATS: Record<Film, { at: number; label: string }[]> = {
  brands: [
    { at: 0, label: 'Briefing' },
    { at: 3, label: 'Creator' },
    { at: 6, label: 'Auswahl' },
    { at: 8.5, label: 'Anfrage' },
    { at: 11, label: 'Kontakte' },
  ],
  creator: [
    { at: 0, label: 'Anmelden' },
    { at: 2.5, label: 'Bestätigen' },
    { at: 6.5, label: 'Live' },
    { at: 9.5, label: 'Anfrage' },
  ],
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Fortschritt 0..1 zwischen den Zeitpunkten a und b. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** Gedaempfte Feder in geschlossener Form: leichtes Ueberschwingen, endet exakt bei 1. */
export const spring = (x: number, bounce = 1) => {
  const c = clamp(x);
  if (c >= 1) return 1;
  return 1 - Math.exp(-6 * c) * Math.cos(9 * c * bounce);
};

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Tipp-Effekt: Anteil eines Texts, der zum Zeitpunkt t sichtbar ist. */
export const typed = (text: string, t: number, a: number, b: number) =>
  text.slice(0, Math.round(text.length * seg(t, a, b)));

/** Klick-Druck: 1 -> 0.92 -> 1 rund um den Klickzeitpunkt. */
export const press = (t: number, at: number) => {
  const d = Math.abs(t - at);
  return d > 0.12 ? 1 : 1 - 0.08 * (1 - d / 0.12);
};

/** Blinkender Cursor, deterministisch aus t. */
export const caretOn = (t: number) => Math.floor(t * 2.2) % 2 === 0;

/** Position entlang mehrerer Wegpunkte [t, x, y]; zwischen Punkten weich interpoliert. */
export const path = (t: number, points: [number, number, number][]) => {
  if (t <= points[0][0]) return { x: points[0][1], y: points[0][2] };
  for (let i = 1; i < points.length; i += 1) {
    const [t1, x1, y1] = points[i];
    const [t0, x0, y0] = points[i - 1];
    if (t <= t1) {
      const p = easeInOut(seg(t, t0, t1));
      return { x: lerp(x0, x1, p), y: lerp(y0, y1, p) };
    }
  }
  const last = points[points.length - 1];
  return { x: last[1], y: last[2] };
};
