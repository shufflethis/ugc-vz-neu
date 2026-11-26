import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangle, ArrowLeft, CheckSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interner Brand-Entwurf (Rot-Blau / ugcVZ)',
  description:
    'Nicht indexierte interne Vorschau des Gestaltungsentwurfs „ugcVZ / Das Creatorverzeichnis“ (Rot-Blau & Rot-Schwarz) zur internen und markenrechtlichen Prüfung.',
  robots: { index: false, follow: false },
};

const DRAFT_COLORS = [
  { name: 'Creator Red / Akzent', hex: '#F2072A', rgb: '242, 7, 42', cmyk: '0 / 97 / 83 / 5', dark: true },
  { name: 'Directory Blue / Primär', hex: '#06458F', rgb: '6, 69, 143', cmyk: '96 / 52 / 0 / 44', dark: true },
  { name: 'Ink / Text', hex: '#202124', rgb: '32, 33, 36', cmyk: '11 / 8 / 0 / 86', dark: true },
  { name: 'White / Fläche', hex: '#FFFFFF', rgb: '255, 255, 255', cmyk: '0 / 0 / 0 / 0', dark: false },
  { name: 'Cloud / Hintergrund', hex: '#F5F7FA', rgb: '245, 247, 250', cmyk: '2 / 1 / 0 / 2', dark: false },
  { name: 'Border / Linien', hex: '#DCE2EA', rgb: '220, 226, 234', cmyk: '6 / 3 / 0 / 8', dark: false },
];

const DRAFT_CSS_TOKENS = `:root {
  --brand-primary: #06458F;
  --brand-accent: #F2072A;
  --text: #202124;
  --surface: #FFFFFF;
  --background: #F5F7FA;
  --border: #DCE2EA;
}`;

export default function BrandKitDraftPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] px-5 py-12 text-[#202124] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-[1120px] space-y-10">
        {/* Interner Warnhinweis */}
        <div
          role="alert"
          className="rounded-[20px] border-2 border-[#E8A317] bg-amber-50 p-5 text-[#121212] sm:p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-[#E8A317]" aria-hidden="true" />
            <div className="space-y-1.5 text-sm leading-6">
              <p className="font-bold">
                Interner Gestaltungsentwurf (noindex, nicht öffentlich verlinkt)
              </p>
              <p>
                Status laut Originaldokument: <strong>Gestaltungsentwurf / interne Freigabe erforderlich.</strong> Die Rot-Blau-Variante, Typografie und Design-Tokens sind noch nicht als bestehende Website-CI verifiziert. Marken- und Urheberrechte an StudiVZ sowie Verwechslungsgefahr müssen vor einem Rollout rechtlich geprüft werden. Die Abschaltung eines Dienstes ist kein Nachweis erloschener Schutzrechte.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/brandkit"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#06458F] hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Zurück zum offiziellen Live Brand Kit (/brandkit)</span>
          </Link>
          <span className="rounded-full border border-[#DCE2EA] bg-white px-3.5 py-1 font-mono text-xs text-[#5C5A55]">
            Entwurf · Version 1.0 · Nov 2026
          </span>
        </div>

        {/* Cover */}
        <header className="rounded-[20px] border border-[#DCE2EA] bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#06458F]">
            ugcVZ / Brand Guidelines (Entwurf)
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] text-[#202124] sm:text-5xl">
            ugcVZ: Das Creatorverzeichnis
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#5C5A55]">
            Dokumentation des alternativen Rot-Blau-Entwurfs aus dem internen Brand-Kit-Dokument zur Abstimmung im Team und juristischen Prüfung vor einer möglichen Übernahme.
          </p>
        </header>

        {/* 01 Markenidee */}
        <section className="rounded-[20px] border border-[#DCE2EA] bg-white p-7">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#06458F]">01 / Markenidee</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Positionierung im Entwurf</h2>
          <p className="mt-3 text-sm leading-7 text-[#5C5A55]">
            Das Verzeichnis verbindet echte UGC Creator mit Marken und Agenturen im deutschsprachigen Raum. Die visuelle Identität verbindet die vertraute VZ-Ästhetik mit einem zeitgemäßen, menschenzentrierten Auftritt. Positionierung: Direkt. Menschlich. Auffindbar.
          </p>
          <p className="mt-3 font-mono text-xs text-[#202124]">
            Schreibweise im Logo: ugcVZ · Domain: ugc-vz.de · Claim: Das Creatorverzeichnis
          </p>
        </section>

        {/* 02 Farbwelt */}
        <section className="rounded-[20px] border border-[#DCE2EA] bg-white p-7">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#06458F]">02 / Farbwelt</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Rot-Blau-Hauptidentität (Vorschlag)</h2>
          <p className="mt-2 text-sm leading-6 text-[#5C5A55]">
            70 % Weiß / helle Flächen, 20 % Blau / Struktur und Typografie, 10 % Rot / Akzente. Primäre Buttons: Blau mit weißer Schrift. Sekundäre Buttons: weiße Fläche, blauer Rahmen. CMYK rechnerisch angenähert und vor Druck zu prüfen.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DRAFT_COLORS.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-[12px] border border-[#DCE2EA]">
                <div
                  className={`flex h-20 items-end p-3.5 ${c.dark ? 'text-white' : 'text-[#202124]'}`}
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="font-mono text-xs font-bold">{c.hex}</span>
                </div>
                <div className="p-4 text-xs">
                  <p className="font-bold text-[#202124]">{c.name}</p>
                  <p className="mt-1 font-mono text-[#5C5A55]">RGB: {c.rgb}</p>
                  <p className="font-mono text-[#5C5A55]">CMYK %: {c.cmyk}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 Logo-System mit beiden Entwurfs-Logos */}
        <section className="rounded-[20px] border border-[#DCE2EA] bg-white p-7">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#06458F]">03 / Logo-System</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Primärlogo &amp; Alternative</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <figure className="rounded-[12px] border border-[#DCE2EA] bg-white p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/drafts/ugcvz-draft-red-blue.png"
                alt="Entwurf Primärlogo ugcVZ Rot-Blau"
                className="mx-auto max-h-48 w-auto object-contain"
              />
              <figcaption className="mt-4 text-xs leading-5 text-[#5C5A55]">
                <strong className="text-[#202124]">Primärlogo (Entwurf):</strong> rote Bildmarke, blaue Creator-Gruppe, blaue Wortmarke „ugc“, rotes „VZ“.
              </figcaption>
            </figure>

            <figure className="rounded-[12px] border border-[#DCE2EA] bg-white p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/drafts/ugcvz-draft-red-black.png"
                alt="Entwurf Alternativlogo ugcVZ Rot-Schwarz"
                className="mx-auto max-h-48 w-auto object-contain"
              />
              <figcaption className="mt-4 text-xs leading-5 text-[#5C5A55]">
                <strong className="text-[#202124]">Alternative (Entwurf):</strong> Rot / Schwarz, geeignet für neutralere Geschäftskommunikation.
              </figcaption>
            </figure>
          </div>

          <div className="mt-5 rounded-[12px] bg-[#F5F7FA] p-4 text-xs leading-6 text-[#5C5A55]">
            <strong className="text-[#202124]">Anwendungsregeln im Entwurf:</strong> Schutzzone mindestens 1/4 der Bildmarkenhöhe auf allen Seiten. Mindestbreite 240 px mit Claim, 120 px ohne Claim. Für 16 bis 48 px eine vereinfachte Bildmarke verwenden. Die eingebetteten Dateien sind Rasterbilder (PNG), keine finalen SVG-Master.
          </div>
        </section>

        {/* 04 Typografie & CSS Tokens */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-[#DCE2EA] bg-white p-7">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#06458F]">04 / Typografie &amp; UI</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Inter &amp; Raster</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#5C5A55]">
              <li><strong className="text-[#202124]">Schriftfamilie:</strong> Inter (Headlines 700 bis 800, Body 400, Labels/Buttons 600).</li>
              <li><strong className="text-[#202124]">Skala:</strong> H1 40 bis 48 px, H2 28 bis 32 px, Body 16 px, Label 12 bis 14 px.</li>
              <li><strong className="text-[#202124]">UI-System:</strong> Abstände 4, 8, 12, 16, 24, 32, 48 px; Kartenradius 12 px; Buttonradius 8 px.</li>
            </ul>
          </div>

          <div className="rounded-[20px] border border-[#DCE2EA] bg-[#202124] p-7 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/60">
              Vorgeschlagene CSS Tokens (Entwurf)
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/30 p-4 font-mono text-xs leading-6 text-white/90">
              <code>{DRAFT_CSS_TOKENS}</code>
            </pre>
          </div>
        </section>

        {/* 05 Vor dem Rollout Checkliste */}
        <section className="rounded-[20px] border border-[#DCE2EA] bg-white p-7">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#F2072A]">05 / Vor einem Rollout</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Offene Aufgaben vor einer Freigabe</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#202124]">
            {[
              'Marken- und Urheberrechte an StudiVZ sowie Verwechslungsgefahr anwaltlich prüfen lassen.',
              'Logo sauber als SVG-Master vektorisieren (positive, negative, einfarbige Versionen und ohne Claim).',
              'Vereinfachtes Favicon-Symbol (SVG, 16/32/48 px PNG), Social-Avatar (1080 × 1080 px) und Open Graph (1200 × 630 px) anlegen.',
              'Kontraste nach WCAG prüfen und mit dem neuen View-Kampagnen-Positioning abstimmen.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckSquare size={17} className="mt-1 shrink-0 text-[#06458F]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
