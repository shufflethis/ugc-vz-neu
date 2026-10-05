// Brand Kit: visuelle Identitaet von UGC VZ als verlinkbare Seite (Presse,
// Partner, Verzeichnisse). Alles ist aus dem bestehenden Logo abgeleitet:
// Verlaufsfarben direkt aus ugc-vz-logo.png / favicon.svg gemessen, UI-Farben
// aus tailwind.config.js, Schrift aus app/layout.tsx (Geist). Mockups sind
// reines CSS -- keine Bild-Assets, die veralten koennen.
import Link from 'next/link';
import { Metadata } from 'next';
import { CREATOR_COUNT_LABEL } from '../lib/creator-count';

export const metadata: Metadata = {
  title: 'Brand Kit: Logo, Farben & Typografie',
  description:
    'Logo, Farben, Typografie und Anwendungsregeln von UGC VZ, dem kostenlosen Verzeichnis für echte UGC Creator im DACH-Raum. Für Presse, Partner und Verzeichnisse.',
  alternates: { canonical: 'https://ugc-vz.de/brandkit' },
};

const GRADIENT = 'linear-gradient(135deg, #28B1FC 0%, #1E76F4 34%, #5B46F0 68%, #7014EB 100%)';

const logoGradient = [
  { name: 'Signal Cyan', hex: '#28B1FC', rgb: '40 177 252', role: 'Verlaufsstart, Highlights' },
  { name: 'Azure', hex: '#1E76F4', rgb: '30 118 244', role: 'Verlauf, Links auf Dunkel' },
  { name: 'Indigo', hex: '#5B46F0', rgb: '91 70 240', role: 'Verlauf, Flächen' },
  { name: 'Ultra Violet', hex: '#7014EB', rgb: '112 20 235', role: 'Verlaufsende, Glow' },
];

const uiColors = [
  { name: 'Brand Violet', hex: '#8B3FCA', rgb: '139 63 202', role: 'Akzent, Buttons, Links', dark: true },
  { name: 'Fresh Green', hex: '#A8E06A', rgb: '168 224 106', role: 'Bestätigung, „kostenlos“', dark: false },
  { name: 'Void', hex: '#060606', rgb: '6 6 6', role: 'Dunkle Bühne, Footer', dark: true },
  { name: 'Ink', hex: '#171717', rgb: '23 23 23', role: 'Text', dark: true },
  { name: 'Ink Soft', hex: '#5A5A5A', rgb: '90 90 90', role: 'Sekundärtext', dark: true },
  { name: 'Hairline', hex: '#E8E8E4', rgb: '232 232 228', role: 'Linien, Rahmen', dark: false },
  { name: 'Surface', hex: '#F7F7F5', rgb: '247 247 245', role: 'Hintergründe', dark: false },
  { name: 'White', hex: '#FFFFFF', rgb: '255 255 255', role: 'Grundfläche', dark: false },
];

const downloads = [
  { label: 'Wortmarke PNG', file: '/ugc-vz-logo.png', meta: 'Transparent · 205 × 126' },
  { label: 'Wortmarke WebP', file: '/ugc-vz-logo.webp', meta: 'Transparent · Web' },
  { label: 'App-Icon PNG', file: '/apple-touch-icon.png', meta: '180 × 180' },
  { label: 'Icon SVG', file: '/favicon.svg', meta: 'Favicon · skalierbar' },
];

function SectionHead({ no, title, intro }: { no: string; title: string; intro: string }) {
  return (
    <div className="mb-10 grid gap-4 border-t border-ink pt-5 sm:mb-14 lg:grid-cols-[180px_1fr_1fr] lg:gap-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{no}</p>
      <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{title}</h2>
      <p className="max-w-md text-sm leading-6 text-ink-soft">{intro}</p>
    </div>
  );
}

// Der Sprechblasen-Schwung aus der Wortmarke als freistehendes Motiv.
function BubbleTail({ className = '', stroke = 'url(#bk-grad)' }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 200 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bk-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#28B1FC" />
          <stop offset="0.35" stopColor="#1E76F4" />
          <stop offset="0.7" stopColor="#5B46F0" />
          <stop offset="1" stopColor="#7014EB" />
        </linearGradient>
      </defs>
      <path d="M4 15 Q96 2 196 7 L194 16 L150 20 L170 39 L124 21 Q58 24 4 15 Z" fill={stroke} />
    </svg>
  );
}

function Logo({ className = '', variant = 'color' }: { className?: string; variant?: 'color' | 'white' | 'black' }) {
  const filter = variant === 'white' ? 'brightness(0) invert(1)' : variant === 'black' ? 'brightness(0)' : undefined;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/ugc-vz-logo.png" alt="UGC VZ Logo" className={className} style={{ filter }} />;
}

function AppIcon({ size = 'h-16 w-16', rounded = 'rounded-[22%]' }: { size?: string; rounded?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/apple-touch-icon.png" alt="UGC VZ App-Icon" className={`${size} ${rounded} shadow-[0_10px_30px_rgba(112,20,235,0.35)]`} />;
}

const Icon = ({ d }: { d: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const icons = [
  { label: 'Suchen', d: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35' },
  { label: 'Video', d: 'M15 10l5-3v10l-5-3M4 6h11v12H4z' },
  { label: 'Anfrage', d: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z' },
  { label: 'Creator', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
  { label: 'Geprüft', d: 'm5 12 4 4L19 6' },
  { label: 'Weiter', d: 'M5 12h14M12 5l7 7-7 7' },
];

export default function BrandKitPage() {
  return (
    <main className="bg-white text-ink">
      {/* ---------- Cover ---------- */}
      <section className="relative overflow-hidden bg-void px-5 pb-16 pt-14 text-white sm:px-8 sm:pb-24 sm:pt-20">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl" style={{ background: GRADIENT }} aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
            <span>Brand Identity Guidelines</span>
            <span>Version 1.0 · Oktober 2026</span>
          </div>
          <div className="mt-16 grid items-end gap-12 lg:mt-24 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="inline-block rounded-3xl bg-white px-8 py-6 sm:px-10 sm:py-8">
                <Logo className="h-20 w-auto sm:h-28" />
              </div>
              <h1 className="mt-10 text-4xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl">
                Echte Creator.<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>Direkt gefunden.</span>
              </h1>
            </div>
            <div className="space-y-5 text-sm leading-6 text-white/70 lg:pb-3">
              <p>
                UGC VZ ist das kostenlose Verzeichnis für echte UGC Creator im DACH-Raum. Brands suchen,
                prüfen Arbeitsproben und fragen direkt an – ohne Provision, ohne Agentur dazwischen.
              </p>
              <p>Dieses Brand Kit beschreibt, wie die Marke aussieht, klingt und angewendet wird.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Logo', 'Farben', 'Typografie', 'Anwendung', 'Downloads'].map((t) => (
                  <span key={t} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-5 py-20 sm:space-y-32 sm:px-8 sm:py-28">
        {/* ---------- 01 Markenkern ---------- */}
        <section>
          <SectionHead no="01 — Markenkern" title="Was das Logo erzählt" intro="Die Identität ist nicht erfunden, sondern aus der Wortmarke abgeleitet. Jede Regel auf dieser Seite folgt aus diesen vier Beobachtungen." />
          <div className="grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Kursiv & fett', 'Die Buchstaben lehnen sich nach vorn: Tempo, Bewegung, Social-Feed-Energie. UGC VZ ist schnell gefunden und schnell angefragt.'],
              ['Sprechblase', 'Der Schwung unter der Wortmarke ist eine Sprechblase. Es geht um echte Menschen, die über Produkte sprechen – nicht um Avatare.'],
              ['Cyan → Violett', 'Der Verlauf verbindet digitale Kühle mit Creator-Wärme. Plattform-Technik trifft persönliche Empfehlung.'],
              ['Nahbar statt Konzern', 'Abgerundete Kanten, Du-Ansprache, keine Gebühren. Die Marke ist ein Werkzeug auf Augenhöhe für Brands und Creator.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-white p-7">
                <p className="text-lg font-bold tracking-tight">{t}</p>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              ['Sektor', 'Creator-Marketplace / Verzeichnis, DACH'],
              ['Zielgruppe', 'D2C-Brands, Marketing-Teams, Agenturen – und UGC Creator'],
              ['Positionierung', `${CREATOR_COUNT_LABEL} echte Creator · kostenlos · ohne Provision`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{k}</p>
                <p className="mt-2 font-semibold leading-6">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 02 Logo ---------- */}
        <section>
          <SectionHead no="02 — Logo" title="Wortmarke & Icon" intro="Die Wortmarke ist das Hauptlogo. Das U-Icon steht dort, wo der Platz für die Wortmarke fehlt: App, Favicon, Avatar." />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-hairline bg-white p-10">
              <Logo className="h-24 w-auto sm:h-28" />
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-center gap-6 rounded-3xl bg-void p-8">
                <AppIcon size="h-24 w-24" />
                <div className="text-white">
                  <p className="font-semibold">U-Icon</p>
                  <p className="mt-1 text-xs leading-5 text-white/60">App-Icon, Favicon,<br />Social-Avatar</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex h-32 items-center justify-center rounded-3xl p-6" style={{ background: GRADIENT }}>
                  <Logo variant="white" className="h-14 w-auto" />
                </div>
                <div className="flex h-32 items-center justify-center rounded-3xl bg-surface p-6">
                  <Logo variant="black" className="h-14 w-auto" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ['bg-white border border-hairline', 'color', 'Auf Hell', 'Standard. Farbige Wortmarke auf Weiß oder Surface.'],
              ['bg-void', 'color', 'Auf Dunkel', 'Farbige Wortmarke auf Void – der Verlauf leuchtet.'],
              ['bg-geo-violet', 'white', 'Auf Farbe', 'Auf Brand Violet oder dem Verlauf nur in Weiß.'],
            ].map(([bg, v, t, d]) => (
              <div key={t}>
                <div className={`flex h-40 items-center justify-center rounded-3xl ${bg}`}>
                  <Logo variant={v as 'color' | 'white'} className="h-16 w-auto" />
                </div>
                <p className="mt-3 text-sm font-semibold">{t}</p>
                <p className="text-sm leading-6 text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 03 Schutzraum ---------- */}
        <section>
          <SectionHead no="03 — Proportion" title="Schutzraum & Mindestgröße" intro="Das Logo braucht Luft. Maß x ist die Höhe des „U“ – dieser Abstand bleibt rundum frei von Text und Grafik." />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex items-center justify-center rounded-3xl bg-surface p-8 sm:p-14">
              <div className="relative border border-dashed border-geo-violet/60 p-10 sm:p-14">
                {['left-1/2 top-0 -translate-x-1/2', 'left-1/2 bottom-0 -translate-x-1/2', 'top-1/2 left-0 -translate-y-1/2', 'top-1/2 right-0 -translate-y-1/2'].map((pos) => (
                  <span key={pos} className={`absolute ${pos} rounded bg-geo-violet px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white`}>x</span>
                ))}
                <div className="border border-geo-violet/30">
                  <Logo className="h-20 w-auto sm:h-28" />
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-hairline p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Mindestgröße Wortmarke</p>
                <div className="mt-5 flex items-end gap-6">
                  <Logo className="h-12 w-auto" />
                  <Logo className="h-7 w-auto" />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink-soft">Digital mindestens <strong className="text-ink">80 px</strong> breit, im Druck <strong className="text-ink">25 mm</strong>.</p>
              </div>
              <div className="rounded-3xl border border-hairline p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Mindestgröße Icon</p>
                <div className="mt-5 flex items-end gap-5">
                  <AppIcon size="h-12 w-12" />
                  <AppIcon size="h-8 w-8" />
                  <AppIcon size="h-4 w-4" rounded="rounded-[3px]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink-soft">Ab <strong className="text-ink">16 px</strong> (Favicon). Unter 32 px ohne Glow-Schatten.</p>
              </div>
            </div>
          </div>

          <p className="mb-4 mt-12 text-sm font-semibold">Nicht erlaubt</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Verzerren', { transform: 'scaleX(1.45)' }],
              ['Drehen', { transform: 'rotate(-14deg)' }],
              ['Umfärben', { filter: 'hue-rotate(150deg) saturate(1.6)' }],
              ['Effekte', { filter: 'drop-shadow(6px 6px 0 #A8E06A) blur(0.6px)' }],
            ].map(([t, style]) => (
              <div key={t as string}>
                <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-3xl bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ugc-vz-logo.png" alt="" className="h-14 w-auto opacity-80" style={style as React.CSSProperties} />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <line x1="8" y1="92" x2="92" y2="8" stroke="#E5484D" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
                <p className="mt-3 text-sm text-ink-soft"><span className="font-semibold text-[#E5484D]">✕</span> {t as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 04 Farbe ---------- */}
        <section>
          <SectionHead no="04 — Farbe" title="Palette" intro="Der Logo-Verlauf ist die Signatur und bleibt dem Logo, Hero-Flächen und Social Media vorbehalten. Im Interface arbeiten Brand Violet, Fresh Green und ruhige Neutraltöne." />
          <div className="overflow-hidden rounded-3xl">
            <div className="flex h-40 items-end p-6 sm:h-52" style={{ background: GRADIENT }}>
              <p className="font-mono text-xs text-white/90">Logo-Verlauf · 135° · #28B1FC → #1E76F4 → #5B46F0 → #7014EB</p>
            </div>
            <div className="grid grid-cols-2 rounded-b-3xl border border-t-0 border-hairline sm:grid-cols-4">
              {logoGradient.map((c) => (
                <div key={c.hex} className="p-5">
                  <div className="mb-4 h-10 w-10 rounded-full" style={{ background: c.hex }} />
                  <p className="font-semibold">{c.name}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">{c.hex}<br />RGB {c.rgb}</p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">{c.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {uiColors.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-2xl border border-hairline">
                <div className={`flex h-28 items-end p-4 ${c.dark ? 'text-white' : 'text-ink'}`} style={{ background: c.hex }}>
                  <span className="font-mono text-xs">{c.hex}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="font-mono text-[11px] text-ink-soft">RGB {c.rgb}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">{c.role}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mb-3 mt-10 text-sm font-semibold">Gewichtung</p>
          <div className="flex h-12 overflow-hidden rounded-full text-[11px] font-semibold">
            <div className="flex basis-[62%] items-center border border-hairline bg-white pl-4">Weiß & Surface 62 %</div>
            <div className="flex basis-[20%] items-center bg-ink pl-4 text-white">Ink 20 %</div>
            <div className="flex basis-[10%] items-center justify-center bg-geo-violet text-white">10 %</div>
            <div className="basis-[5%]" style={{ background: GRADIENT }} />
            <div className="basis-[3%] bg-geo-green" />
          </div>
        </section>

        {/* ---------- 05 Typografie ---------- */}
        <section>
          <SectionHead no="05 — Typografie" title="Geist" intro="Eine Familie, zwei Schnitte. Geist Sans trägt Headlines und Text, Geist Mono kennzeichnet Daten, Codes und Labels – passend zu einer Plattform mit API und KI-Agenten." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl bg-surface p-8 sm:p-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Geist Sans · Bold · −5,5 % Laufweite</p>
              <p className="mt-6 text-7xl font-bold leading-none tracking-[-0.055em] sm:text-9xl">Aa</p>
              <p className="mt-8 text-base font-medium tracking-tight text-ink-soft [overflow-wrap:anywhere] sm:text-xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 äöüß €&@</p>
            </div>
            <div className="flex flex-col justify-between rounded-3xl bg-void p-8 text-white sm:p-12">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Geist Mono · Regular</p>
                <p className="mt-6 font-mono text-5xl">{'{ }'}</p>
              </div>
              <p className="mt-8 font-mono text-sm leading-7 text-white/70">GET /api/v1/creators<br />UGC-53104FA165<br />#8B3FCA · {CREATOR_COUNT_LABEL}</p>
            </div>
          </div>
          <div className="mt-6 divide-y divide-hairline rounded-3xl border border-hairline">
            {[
              ['Display', 'text-4xl sm:text-6xl font-bold tracking-[-0.055em]', 'Dein Produkt.', '72 / 1.05 · Bold'],
              ['H2', 'text-2xl sm:text-4xl font-bold tracking-[-0.04em]', 'Vom Briefing zur Zusammenarbeit.', '40 / 1.1 · Bold'],
              ['H3', 'text-lg sm:text-xl font-semibold tracking-tight', 'Schau genauer hin.', '20 / 1.4 · Semibold'],
              ['Body', 'text-base leading-7 text-ink-soft', 'Finde UGC Creator, prüfe Arbeitsproben und frage deine Favoriten kostenlos an.', '16 / 1.75 · Regular'],
              ['Label', 'font-mono text-xs uppercase tracking-[0.18em] text-ink-soft', 'Kostenlos · ohne Provision', '12 · Mono · +18 %'],
            ].map(([k, cls, sample, spec]) => (
              <div key={k} className="grid items-baseline gap-2 p-6 sm:grid-cols-[110px_1fr_170px] sm:gap-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{k}</span>
                <span className={cls}>{sample}</span>
                <span className="font-mono text-[11px] text-ink-soft sm:text-right">{spec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 06 Grafische Elemente ---------- */}
        <section>
          <SectionHead no="06 — Elemente" title="Formen, Muster, Icons" intro="Drei Motive aus dem Logo: der Sprechblasen-Schwung, die 12°-Neigung der Wortmarke und das Leuchten des U-Icons. Icons sind Linien-Icons mit 2 px Strich und runden Enden." />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-3xl border border-hairline p-7">
              <BubbleTail className="w-full" />
              <div className="mt-8">
                <p className="font-semibold">Sprechblasen-Schwung</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">Als Unterstreichung für Zitate, Creator-Statements und Testimonials.</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-void p-7 text-white">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(-78deg, transparent 0 22px, #5B46F0 22px 24px)' }} aria-hidden="true" />
              <div className="relative flex h-full flex-col justify-between">
                <p className="text-5xl font-black italic tracking-tight" style={{ transform: 'skewX(-12deg)' }}>12°</p>
                <div className="mt-8">
                  <p className="font-semibold">Vorwärts-Neigung</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">Linienraster und Flächen folgen dem Winkel der Wortmarke.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-3xl bg-void p-7 text-white">
              <div className="flex justify-center py-8">
                <div className="h-16 w-16 rounded-full blur-2xl" style={{ background: GRADIENT, boxShadow: '0 0 60px 20px rgba(91,70,240,0.45)' }} />
              </div>
              <div className="mt-4">
                <p className="font-semibold">Glow</p>
                <p className="mt-1 text-sm leading-6 text-white/60">Weiches Leuchten im Verlauf – nur auf dunklen Flächen, nie auf Weiß.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-6">
            {icons.map((i) => (
              <div key={i.label} className="flex flex-col items-center gap-3 bg-white py-8 text-ink">
                <Icon d={i.d} />
                <span className="text-xs text-ink-soft">{i.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl bg-surface p-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]"><span className="h-1.5 w-1.5 rounded-full bg-[#527b33]" />{CREATOR_COUNT_LABEL} Creator-Profile</span>
            <span className="rounded-full bg-geo-violet px-5 py-2.5 text-sm font-semibold text-white">Creator anfragen</span>
            <span className="rounded-full border border-hairline bg-white px-5 py-2.5 text-sm font-semibold">Als Creator anmelden</span>
            <span className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">Badge · Primär · Sekundär</span>
          </div>
        </section>

        {/* ---------- 07 Anwendung ---------- */}
        <section>
          <SectionHead no="07 — Anwendung" title="Die Marke im Einsatz" intro="So sieht UGC VZ auf den wichtigsten Kontaktpunkten aus: Website, App-Icon, Social Media und Geschäftsausstattung." />
          <div className="grid gap-4 lg:grid-cols-6">
            {/* Browser */}
            <div className="overflow-hidden rounded-3xl border border-hairline bg-surface p-4 sm:p-6 lg:col-span-4">
              <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-[0_24px_60px_rgba(35,22,47,0.10)]">
                <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 rounded-full bg-surface px-3 py-1 font-mono text-[10px] text-ink-soft">ugc-vz.de</span>
                </div>
                <div className="px-6 py-10 text-center sm:py-14">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1 text-[10px] font-semibold text-[#385523]"><span className="h-1.5 w-1.5 rounded-full bg-[#527b33]" />{CREATOR_COUNT_LABEL} Creator-Profile</span>
                  <p className="mt-4 text-3xl font-bold leading-[1.05] tracking-[-0.055em] sm:text-5xl">Dein Produkt.<br /><span className="text-geo-violet">Passende Creator.</span></p>
                  <div className="mx-auto mt-6 flex max-w-sm items-center gap-2 rounded-full border border-hairline p-1.5 pl-4 text-left text-xs text-ink-soft">
                    <span className="flex-1">z. B. Skincare-Video, 30 Sek.</span>
                    <span className="rounded-full bg-geo-violet px-4 py-2 font-semibold text-white">Suchen</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center justify-center rounded-3xl p-6 lg:col-span-2" style={{ background: GRADIENT }}>
              <div className="w-48 rounded-[2.2rem] border-[6px] border-void bg-void p-2 shadow-2xl">
                <div className="rounded-[1.7rem] bg-[#0f0b1a] px-4 pb-6 pt-8">
                  <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((n) =>
                      n === 4 ? (
                        <div key={n} className="flex flex-col items-center gap-1">
                          <AppIcon size="h-11 w-11" />
                          <span className="text-[8px] text-white/80">UGC VZ</span>
                        </div>
                      ) : (
                        <div key={n} className="flex flex-col items-center gap-1">
                          <span className="h-11 w-11 rounded-[22%] bg-white/10" />
                          <span className="h-1.5 w-7 rounded-full bg-white/10" />
                        </div>
                      ),
                    )}
                  </div>
                  <div className="mt-6 rounded-2xl bg-white/5 p-3">
                    <p className="text-[9px] font-semibold text-white">Neue Brand-Anfrage</p>
                    <p className="mt-1 text-[8px] leading-3 text-white/60">Skincare-Brand sucht UGC-Video · 2 Varianten</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Instagram Post */}
            <div className="rounded-3xl border border-hairline p-4 lg:col-span-2">
              <div className="flex items-center gap-2 pb-3">
                <AppIcon size="h-7 w-7" rounded="rounded-full" />
                <span className="text-xs font-semibold">UGC_VZ</span>
              </div>
              <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl bg-void p-5 text-white">
                <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full opacity-60 blur-2xl" style={{ background: GRADIENT }} />
                <span className="relative font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">Für Brands</span>
                <p className="relative text-2xl font-bold leading-[1.05] tracking-[-0.05em]">Echte Creator.<br />Kein KI-Avatar.</p>
                <BubbleTail className="relative w-24" />
              </div>
              <p className="pt-3 text-[11px] text-ink-soft"><strong className="text-ink">UGC_VZ</strong> {CREATOR_COUNT_LABEL} Creator, kostenlos durchsuchen. Link in Bio.</p>
            </div>
            {/* Story */}
            <div className="flex items-center justify-center rounded-3xl bg-surface p-6 lg:col-span-2">
              <div className="relative flex aspect-[9/16] w-40 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-xl" style={{ background: GRADIENT }}>
                <div className="flex gap-1">{[1, 2, 3].map((n) => <span key={n} className={`h-0.5 flex-1 rounded-full ${n === 1 ? 'bg-white' : 'bg-white/40'}`} />)}</div>
                <div>
                  <p className="text-lg font-bold leading-tight tracking-tight">Du drehst UGC?</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/85">Kostenloses Profil, Brand-Anfragen direkt per Mail.</p>
                </div>
                <span className="self-center rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#5B46F0]">ugc-vz.de/creator</span>
              </div>
            </div>
            {/* Business cards */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-[#ecebe7] p-6 lg:col-span-2">
              <div className="flex aspect-[85/55] w-56 items-center justify-center rounded-lg bg-void shadow-[0_18px_40px_rgba(0,0,0,0.25)]" style={{ transform: 'rotate(-4deg)' }}>
                <Logo className="h-12 w-auto" />
              </div>
              <div className="flex aspect-[85/55] w-56 flex-col justify-between rounded-lg bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.15)]" style={{ transform: 'rotate(3deg)' }}>
                <AppIcon size="h-6 w-6" rounded="rounded-md" />
                <div>
                  <p className="text-[11px] font-bold">Team UGC VZ</p>
                  <p className="font-mono text-[8px] leading-3 text-ink-soft">hi@ugc-vz.de<br />ugc-vz.de · +49 30 403 665 451</p>
                </div>
                <div className="h-1 rounded-full" style={{ background: GRADIENT }} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 08 Markenton ---------- */}
        <section>
          <SectionHead no="08 — Stimme" title="So klingt UGC VZ" intro="Direkt, ehrlich, auf Augenhöhe. Wir duzen, versprechen nichts, was wir nicht halten, und sagen klar, was kostenlos ist." />
          <div className="grid gap-4 lg:grid-cols-4">
            {[
              ['Direkt', 'Kurze Sätze. Erst der Nutzen, dann die Details.'],
              ['Ehrlich', 'Echte Zahlen, echte Creator. Keine Reichweiten-Garantien.'],
              ['Nahbar', 'Du statt Sie. Wie ein Kollege, der sich auskennt.'],
              ['Fair', 'Kostenlos heißt kostenlos. Keine Provision, kein Kleingedrucktes.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-3xl bg-surface p-7">
                <p className="text-2xl font-bold tracking-[-0.04em]">{t}</p>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-hairline p-7">
              <p className="mb-4 text-sm font-semibold text-[#527b33]">✓ So schreiben wir</p>
              <ul className="space-y-3 text-lg font-medium tracking-tight">
                <li>„Dein Produkt. Passende Creator.“</li>
                <li>„Kostenlos suchen, direkt anfragen.“</li>
                <li>„Honorar und Nutzungsrechte klärt ihr direkt.“</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-hairline p-7">
              <p className="mb-4 text-sm font-semibold text-[#E5484D]">✕ So nicht</p>
              <ul className="space-y-3 text-lg font-medium tracking-tight text-ink-soft line-through decoration-[#E5484D]/50">
                <li>„Revolutionäre KI-Influencer-Magie“</li>
                <li>„Garantiert viral in 24 Stunden“</li>
                <li>„Sehr geehrte Damen und Herren“</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- 09 System ---------- */}
        <section>
          <SectionHead no="09 — System" title="Raster, Radius, Abstand" intro="Alles baut auf einem 4-px-Raster auf. Runde Formen wiederholen die Rundungen der Wortmarke; Karten sind großzügig, Pillen sind voll gerundet." />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-hairline p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Abstände</p>
              <div className="mt-6 space-y-3">
                {[4, 8, 16, 24, 32, 48].map((n) => (
                  <div key={n} className="flex items-center gap-4">
                    <span className="w-8 font-mono text-[11px] text-ink-soft">{n}</span>
                    <span className="h-3 rounded-sm bg-geo-violet" style={{ width: n * 3 }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-hairline p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Radien</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[['12 px', 'Button', 'rounded-xl'], ['16 px', 'Karte klein', 'rounded-2xl'], ['24 px', 'Karte', 'rounded-3xl'], ['voll', 'Pille', 'rounded-full']].map(([v, l, r]) => (
                  <div key={l}>
                    <div className={`h-16 border-2 border-ink ${r}`} />
                    <p className="mt-2 text-xs"><strong>{v}</strong> <span className="text-ink-soft">{l}</span></p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-hairline p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">Konsistenz</p>
              <ul className="mt-6 space-y-4 text-sm leading-6">
                <li><strong>Eine Akzentfarbe pro Fläche.</strong> <span className="text-ink-soft">Violet oder Verlauf, nie beides.</span></li>
                <li><strong>Grün nur für Positives.</strong> <span className="text-ink-soft">Kostenlos, bestätigt, live.</span></li>
                <li><strong>Viel Weißraum.</strong> <span className="text-ink-soft">Die Creator-Arbeitsproben sind der Star, nicht das Interface.</span></li>
                <li><strong>Echte Zahlen.</strong> <span className="text-ink-soft">Konservativ gerundet, immer belegbar.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- 10 Downloads ---------- */}
        <section>
          <SectionHead no="10 — Downloads" title="Assets & Kontakt" intro="Logo-Dateien für Presse, Partner und Verzeichniseinträge. Für Sonderformate oder Kooperationen schreib uns." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {downloads.map((d) => (
              <a key={d.file} href={d.file} download className="group flex flex-col justify-between rounded-3xl border border-hairline p-6 transition-colors hover:border-ink">
                <div className="flex h-20 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.file} alt="" className="max-h-16 w-auto" />
                </div>
                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-semibold">{d.label}</p>
                    <p className="font-mono text-[11px] text-ink-soft">{d.meta}</p>
                  </div>
                  <span className="text-ink-soft transition-colors group-hover:text-geo-violet"><Icon d="M12 4v12m-5-5 5 5 5-5M5 20h14" /></span>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-3xl bg-void p-8 text-white sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="text-2xl font-bold tracking-[-0.04em]">Presse & Partnerschaften</p>
              <p className="mt-2 text-sm text-white/60">UGC VZ ist ein Service der track by track GmbH, Berlin.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:hi@ugc-vz.de" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">hi@ugc-vz.de</a>
              <Link href="/contact" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold">Kontaktseite</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
