import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Check,
  CreditCard,
  Download,
  FileCheck2,
  Layers,
  Lock,
  Newspaper,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import { CREATOR_COUNT_LABEL } from '../lib/creator-count';

export const metadata: Metadata = {
  title: 'Brand Kit & Presse: ugcVZ Logo, Farben, Typografie & Produkt-Fakten',
  description:
    'Offizielles Brand Kit und Presse-Kit von UGC VZ (ugcVZ Rot-Blau CI, November 2026): Logo-Downloads, Directory Blue #06458F & Creator Red #F2072A Design-Tokens, Inter Typografie, Presse-Faktenblatt und alle aktuellen Plattform-Funktionen.',
  alternates: { canonical: 'https://ugc-vz.de/brandkit' },
  openGraph: {
    title: 'Brand Kit & Presse | UGC VZ',
    description:
      'Offizielle ugcVZ Logos, Farbwelt (#06458F & #F2072A), Inter Typografie, Boilerplates und alle neuen Plattform-Funktionen auf einen Blick.',
    url: 'https://ugc-vz.de/brandkit',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

const CORE_COLORS = [
  {
    name: 'Directory Blue / Primär',
    hex: '#06458F',
    rgb: '6, 69, 143',
    cmyk: '96 / 52 / 0 / 44',
    role: 'Primäre Buttons (mit weißer Schrift), Struktur, Links, Navigation, Fokus',
    dark: true,
  },
  {
    name: 'Creator Red / Akzent',
    hex: '#F2072A',
    rgb: '242, 7, 42',
    cmyk: '0 / 97 / 83 / 5',
    role: 'Markenakzent, Bildmarke, „VZ“, sparsame Highlights (10-%-Regel)',
    dark: true,
  },
  {
    name: 'Ink / Text',
    hex: '#202124',
    rgb: '32, 33, 36',
    cmyk: '11 / 8 / 0 / 86',
    role: 'Headlines, Fließtext und hohe Lesbarkeit',
    dark: true,
  },
  {
    name: 'White / Fläche',
    hex: '#FFFFFF',
    rgb: '255, 255, 255',
    cmyk: '0 / 0 / 0 / 0',
    role: 'Karten, Formulare, Grundfläche (Teil der 70-%-Hellflächen)',
    dark: false,
  },
  {
    name: 'Cloud / Hintergrund',
    hex: '#F5F7FA',
    rgb: '245, 247, 250',
    cmyk: '2 / 1 / 0 / 2',
    role: 'Ruhige Sektions- und App-Hintergründe',
    dark: false,
  },
  {
    name: 'Border / Linien',
    hex: '#DCE2EA',
    rgb: '220, 226, 234',
    cmyk: '6 / 3 / 0 / 8',
    role: '1-px-Kartenrahmen, Tabellen- und Trennlinien',
    dark: false,
  },
];

const STATUS_COLORS = [
  { name: 'Success', hex: '#1F9D55', role: 'Verifiziert, Beitrag zählt, erfolgreich gespeichert (immer mit Symbol/Text)' },
  { name: 'Warning', hex: '#E8A317', role: 'Hinweise und laufende Prüfungen (immer mit Symbol/Text)' },
  { name: 'Error', hex: '#D93025', role: 'Validierungs- und Versandfehler (nie Rot allein als Indikator)' },
];

const DOWNLOADS = [
  {
    label: 'Logo mit Schrift (PNG)',
    file: '/brand/ugcvz-logo-mit-schrift-2400.png',
    meta: '2400 × 840 px · freigestellt · ohne Claim',
    dark: false,
  },
  {
    label: 'Bildmarke ohne Schrift (PNG)',
    file: '/brand/ugcvz-logo-ohne-schrift-2048.png',
    meta: '2048 × 2048 px · freigestellt · nur Stern',
    dark: false,
  },
  {
    label: 'Primärlogo mit Claim (PNG)',
    file: '/brand/ugcvz-logo-mit-schrift-claim-2400.png',
    meta: '2400 × 840 px · freigestellt · High-Res',
    dark: false,
  },
  {
    label: 'LinkedIn & Social Logo (PNG)',
    file: '/brand/ugcvz-linkedin-logo-1080.png',
    meta: '1080 × 1080 px · Weiß · mit Schrift',
    dark: false,
  },
  {
    label: 'Negativ-Logo Weiß / Rot (PNG)',
    file: '/brand/ugcvz-logo-white.png',
    meta: '900 × 296 px · freigestellt · Dunkelblau',
    dark: true,
  },
  {
    label: 'Alternative Rot / Schwarz (PNG)',
    file: '/brand/ugcvz-logo-red-black.png',
    meta: '1633 × 647 px · freigestellt · Business',
    dark: false,
  },
  {
    label: 'Social Avatar Bildmarke (PNG)',
    file: '/brand/ugcvz-social-avatar-1080.png',
    meta: '1080 × 1080 px · Weiß · Profilbild',
    dark: false,
  },
  {
    label: 'Open Graph Card (PNG)',
    file: '/brand/ugcvz-og-1200x630.png',
    meta: '1200 × 630 px · Social Preview',
    dark: false,
  },
];

const NEW_PLATFORM_FEATURES = [
  {
    icon: Sparkles,
    badge: 'Kampagnenmodell',
    title: 'View-Kampagnen mit verbindlicher Budget-Obergrenze',
    summary:
      'Marken legen Preis pro 1.000 geprüfte Views und eine feste Budget-Obergrenze fest. Über den 60-Sekunden-Schnell-Brief auf der Startseite wandern Eingaben nach dem Login automatisch vorausgefüllt in den Kampagnen-Builder.',
    highlights: [
      'Pflichtfelder: Budget-Obergrenze (budget_cap) und mindestens eine Plattform',
      '15 % Servicegebühr regulär im Budget enthalten (Aktionsrate 10 % z. B. Black Friday)',
      '0 % Plattformgebühr für Creator: der gezeigte View-Satz kommt voll an',
    ],
  },
  {
    icon: FileCheck2,
    badge: 'Qualität & Transparenz',
    title: 'Beitragsprüfung & offizieller API-View-Sync',
    summary:
      'Eingereichte TikTok-, Instagram-Reel- und YouTube-Short-Links werden gegen die Kampagnen-Checkliste geprüft und stündlich über die offiziellen Plattform-APIs synchronisiert.',
    highlights: [
      'Gelöschte oder briefwidrige Beiträge fallen automatisch aus der Abrechnung',
      'Live-Budget-Balken wechselt ab 80 % Auslastung auf Creator Red Warnakzent',
      'Teilbarer Live-Report und CSV-Export direkt im Marken-Konto',
    ],
  },
  {
    icon: Search,
    badge: 'KI-Suche & Taxonomie',
    title: '20er-Kategorien-Taxonomie, Filter-Chips & KI-Opt-in',
    summary:
      'Die Creator-Suche klassifiziert Profile in 20 feste Branchenkategorien (max. 3 pro Creator, 1 Hauptkategorie) mit hartem Kategorie-Filter, strukturierter Filterleiste, Begründung und Session-stabiler MMR-Rotation.',
    highlights: [
      'Kein Branchen-Rauschen: Auto-Suchen liefern keine branchenfremden Profile',
      'Explizite Einwilligung (Opt-in) vor jeder KI-Kanalanalyse, sofortiger Widerruf möglich',
      'Ehrlicher Leerzustand mit direktem Kampagnen-Start statt unpassender Auffüll-Treffer',
    ],
  },
  {
    icon: Lock,
    badge: 'Onboarding & Login',
    title: 'Passwortlose 30-Tage-Konten & 2-Feld-Creator-Start',
    summary:
      'Getrennte Tabs „Anmelden“ und „Konto anlegen“ für Marken (/brand) sowie ein schlanker 3-Schritt-Einstieg für Creator (/creator) mit maximal 2 Pflichtfeldern im ersten Schritt und direkter 6-Feld-Code-Bestätigung im Browser.',
    highlights: [
      '6-stelliger E-Mail-Code ohne Passwort, 30-Tage-Session optional aktiv',
      '60-Sekunden-Resend-Timer, klare 429- und 503-Meldungen, automatisches 5xx-Alerting',
      'Offizielle Social-Verbindung via Meta Unified Login & TikTok OAuth mit verschlüsselten Tokens',
    ],
  },
  {
    icon: CreditCard,
    badge: 'Payments, Gutschrift & DAC7',
    title: 'Stripe Connect Wallets, ZUGFeRD-Gutschriften & DAC7',
    summary:
      'Vollständiges Wallet- und Auszahlungssystem über Stripe Connect (Separate Charges & Transfers): kein Kundengeld auf Agenturkonten, Concurrency-sichere Budget-Reservierungen und automatische Gutschriften.',
    highlights: [
      'SEPA-Lastschrift & virtuelle DE-IBAN mit 0 % Aufschlag; Karte / Apple / Google Pay mit ausgewiesener 3-%-Kartengebühr',
      'Stripe-Onboarding für Creator erst vor der ersten Auszahlung, inkl. DAC7-Steuerprofil',
      'Fortlaufende PDF-Gutschriften (GS-YYYY-NNNNNN) mit eingebetteter EN16931/ZUGFeRD-XML für DE (§ 19 & 19 %), AT (Reverse Charge) und CH',
    ],
  },
  {
    icon: Terminal,
    badge: 'KI-Agenten & Schnittstellen',
    title: 'Offener Standard: MCP, WebMCP, REST-API & llms.txt',
    summary:
      'UGC VZ ist vollständig maschinenlesbar für KI-Assistenten und Entwickler-Teams: aktuelle Preis-, Kampagnen- und Kategorien-Daten liegen unter einheitlichen Endpunkten bereit.',
    highlights: [
      '/llms.txt, /llms-full.txt, /openapi.json, /.well-known/mcp.json und /.well-known/webmcp',
      '7 Browser-Site-Tools via WebMCP plus sauberer 20-Kategorien-/api/v1/vocab-Endpunkt',
      'HTML-Sitemap unter /alle-seiten und dynamische XML-Sitemap mit echten Änderungsdaten',
    ],
  },
];

const PRESS_FACTS = [
  ['Schreibweise Logo / Text', 'Logo: ugcVZ · Fließtext: UGC VZ · Claim: Das Creatorverzeichnis'],
  ['Domain', 'https://ugc-vz.de'],
  ['Betreiber', 'track by track GmbH, Schliemannstr. 23, 10437 Berlin'],
  ['Mutteragentur / Team', 'famefact (Social-Media-Agentur, Berlin)'],
  ['Markt & Zielregion', 'Deutschland, Österreich und Schweiz (DACH)'],
  ['Creator-Pool', `${CREATOR_COUNT_LABEL} echte Creator-Profile in 20 Kategorien`],
  ['Preismodell Marken', 'Kein Monatsabo; View-Kampagnen mit fester Budget-Obergrenze (15 % Servicegebühr im Marken-Budget enthalten) oder Direktkontakt'],
  ['Preismodell Creator', 'Kostenlos, 0 % Plattformgebühr (100 % des View-Satzes gehen an den Creator)'],
  ['Zahlungsabwicklung', 'Stripe Connect (SEPA & virtuelle DE-IBAN 0 %, Karte +3 % Kartengebühr)'],
  ['Presse- & Partnerkontakt', 'hi@ugc-vz.de · +49 30 403 665 451'],
];

const CSS_TOKENS_SNIPPET = `:root {
  --brand-primary: #06458F;
  --brand-accent: #F2072A;
  --text: #202124;
  --surface: #FFFFFF;
  --background: #F5F7FA;
  --border: #DCE2EA;
}`;

export default function BrandKitPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Brand Kit & Presse', url: 'https://ugc-vz.de/brandkit' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Cover / Hero in Directory Blue Navy (#062A59) + Creator Red Akzent */}
      <section className="border-b-[3px] border-[#F2072A] bg-[#062A59] px-5 pb-16 pt-14 text-white sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.18em] text-white/70">
            <span>ugcVZ / Brand Guidelines &amp; Pressebereich</span>
            <span>Version 1.0 · November 2026</span>
          </div>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex rounded-[12px] bg-white px-7 py-5 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/ugcvz-logo-red-blue.png"
                  alt="ugcVZ – Das Creatorverzeichnis"
                  className="h-20 w-auto sm:h-28"
                />
              </div>
              <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
                Visuelle Identität, Presse-Fakten und Plattform-Updates.
              </h1>
            </div>

            <div className="space-y-5 text-sm leading-6 text-white/85 sm:text-base lg:col-span-5">
              <p>
                Direkt. Menschlich. Auffindbar. UGC VZ verbindet echte UGC Creator im deutschsprachigen Raum mit Marken und Agenturen – per View-Kampagne mit fester Budget-Obergrenze oder direktem Kontakt. Hier liegen alle offiziellen Logos, Farben, Schriften und Produkt-Fakten.
              </p>
              <nav aria-label="Schnellzugriff Brand Kit" className="flex flex-wrap gap-2 pt-1">
                {[
                  { href: '#presse', label: '01 Presse & Fakten' },
                  { href: '#funktionen', label: '02 Neue Funktionen' },
                  { href: '#farben', label: '03 Farbwelt' },
                  { href: '#logo', label: '04 Logo-System' },
                  { href: '#typografie', label: '05 Typografie & UI' },
                  { href: '#downloads', label: '06 Downloads' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-[8px] border border-white/25 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[#F2072A] hover:bg-white/10"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-24 px-5 py-16 sm:space-y-28 sm:px-8 sm:py-24">
        {/* 01 Presse-Bereich & Faktenblatt */}
        <section id="presse" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              01 / Presse
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Markenidee &amp; Presse-Faktenblatt
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Alle geprüften Fakten, Schreibweisen und freigegebenen Textbausteine für Redaktionen, Verzeichnisse und Partner-Präsentationen.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 sm:p-8 lg:col-span-7">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#06458F]">
                <Newspaper size={15} aria-hidden="true" />
                <span>Faktencheck auf einen Blick</span>
              </div>
              <dl className="mt-5 divide-y divide-[#DCE2EA]">
                {PRESS_FACTS.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-12 sm:gap-4">
                    <dt className="text-xs font-semibold text-[#5C6470] sm:col-span-5">{label}</dt>
                    <dd className="text-sm font-medium text-[#202124] sm:col-span-7">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-6 shadow-card">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">
                  Kurzbeschreibung (ca. 45 Wörter)
                </p>
                <p className="mt-3 text-sm leading-6 text-[#202124]">
                  UGC VZ ist das Creatorverzeichnis und die Kampagnen-Plattform für den deutschsprachigen Raum. Marken legen Preis pro 1.000 geprüfte Views und eine verbindliche Budget-Obergrenze fest oder fragen Profile direkt an. Creator aus DACH erhalten 100 % des View-Satzes bei 0 % Plattformgebühr.
                </p>
              </div>

              <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-6 shadow-card">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">
                  Social Bio &amp; Positionierung
                </p>
                <p className="mt-3 text-sm leading-6 text-[#5C6470]">
                  „Das Creatorverzeichnis für die DACH-Region. Entdecke echte UGC Creator und ihre Portfolios – oder starte View-Kampagnen mit fester Budget-Obergrenze.“
                </p>
              </div>

              <div className="rounded-[12px] bg-[#06458F] p-6 text-white">
                <p className="font-display text-lg font-bold">Presse- und Interviewanfragen</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Ansprechpartner: Tobias Sander (Geschäftsführer) &amp; Florian Runge (Brand Partnerships), Berlin.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a
                    href="mailto:hi@ugc-vz.de?subject=Presseanfrage%20UGC%20VZ"
                    className="btn-press inline-flex min-h-[42px] items-center rounded-[8px] bg-white px-4 text-xs font-bold text-[#06458F] hover:bg-[#F5F7FA]"
                  >
                    hi@ugc-vz.de
                  </a>
                  <Link
                    href="/about"
                    className="inline-flex min-h-[42px] items-center rounded-[8px] border border-white/35 px-4 text-xs font-semibold text-white hover:border-white hover:bg-white/10"
                  >
                    Team ansehen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 Neue Plattform-Funktionen */}
        <section id="funktionen" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              02 / Produkt
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Aktuelle Plattform-Funktionen
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Dokumentation aller aktuellen Kernfunktionen von UGC VZ für Presse, Partner und Marken-Teams (Stand November 2026).
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {NEW_PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="flex flex-col rounded-[12px] border border-[#DCE2EA] bg-white p-6 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#06458F] text-white">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="rounded-[6px] border border-[#DCE2EA] bg-[#F5F7FA] px-2.5 py-1 text-[11px] font-semibold text-[#06458F]">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold leading-snug text-[#202124]">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-[#5C6470]">{feature.summary}</p>
                  <ul className="mt-4 space-y-2 border-t border-[#DCE2EA] pt-4 text-xs leading-5 text-[#202124]">
                    {feature.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0 text-[#1F9D55]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {/* 03 Farbwelt & 70/20/10-Regel */}
        <section id="farben" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              03 / Farbwelt
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Directory Blue, Creator Red &amp; 70/20/10
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Farbverteilung: 70 % Weiß / Cloud-Flächen, 20 % Directory Blue für Struktur, Buttons und Typografie, 10 % Creator Red sparsam für Akzente. Fehler und Erfolg immer zusätzlich mit Text oder Symbol kennzeichnen.
            </p>
          </div>

          {/* 70 / 20 / 10 Balken */}
          <div className="mb-8 overflow-hidden rounded-[12px] border border-[#DCE2EA]">
            <div className="flex h-12 w-full text-xs font-bold">
              <div className="flex w-[70%] items-center justify-center bg-[#F5F7FA] text-[#202124]">
                70 % Weiß &amp; Cloud (#FFFFFF / #F5F7FA)
              </div>
              <div className="flex w-[20%] items-center justify-center bg-[#06458F] text-white">
                20 % Blau
              </div>
              <div className="flex w-[10%] items-center justify-center bg-[#F2072A] text-white">
                10 % Rot
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_COLORS.map((color) => (
              <div key={color.hex} className="overflow-hidden rounded-[12px] border border-[#DCE2EA] bg-white shadow-card">
                <div
                  className={`flex h-24 items-end justify-between border-b border-[#DCE2EA]/40 p-4 ${
                    color.dark ? 'text-white' : 'text-[#202124]'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="font-mono text-xs font-bold">{color.hex}</span>
                </div>
                <div className="p-4">
                  <p className="font-display text-base font-bold text-[#202124]">{color.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#5C6470]">
                    RGB {color.rgb} · CMYK {color.cmyk}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#5C6470]">{color.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6 lg:col-span-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">
                Status-Farben (WCAG)
              </p>
              <div className="mt-4 space-y-3">
                {STATUS_COLORS.map((s) => (
                  <div key={s.hex} className="flex items-center gap-3 rounded-[8px] border border-[#DCE2EA] bg-white p-3">
                    <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: s.hex }} />
                    <div>
                      <p className="text-sm font-semibold text-[#202124]">
                        {s.name} <span className="font-mono text-xs text-[#5C6470]">{s.hex}</span>
                      </p>
                      <p className="text-xs text-[#5C6470]">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] bg-[#062A59] p-6 text-white lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#FDECEF]">
                  Offizielle CSS Design Tokens
                </p>
                <span className="font-mono text-[11px] text-white/60">app/globals.css</span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-[8px] bg-black/35 p-4 font-mono text-xs leading-6 text-white/95">
                <code>{CSS_TOKENS_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* 04 Logo-System */}
        <section id="logo" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              04 / Logo-System
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Primärlogo, Negativ &amp; Bildmarke
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Rote Stern-Bildmarke, blaue Creator-Gruppe, blaue Wortmarke „ugc“, rotes „VZ“. Für neutrale Geschäftskommunikation steht die Rot-Schwarz-Variante bereit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-8 shadow-card">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugcvz-logo-red-blue.png" alt="ugcVZ Primärlogo Rot-Blau" className="max-h-24 w-auto" />
              </div>
              <p className="mt-4 font-bold text-[#202124]">Primärlogo: Rot / Blau</p>
              <p className="mt-1 text-xs leading-5 text-[#5C6470]">Standard auf Weiß und Cloud #F5F7FA für Website, E-Mails und Presse.</p>
            </div>

            <div className="rounded-[12px] border border-[#062A59] bg-[#062A59] p-8 text-white">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugcvz-logo-white.png" alt="ugcVZ Negativ-Logo auf Dunkelblau" className="max-h-24 w-auto" />
              </div>
              <p className="mt-4 font-bold">Negativ auf Dunkelblau</p>
              <p className="mt-1 text-xs leading-5 text-white/75">Für Footer, dunkle Banner und Social-Media-Kacheln.</p>
            </div>

            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-8">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugcvz-logo-red-black.png" alt="ugcVZ Alternative Rot-Schwarz" className="max-h-24 w-auto" />
              </div>
              <p className="mt-4 font-bold text-[#202124]">Alternative: Rot / Schwarz</p>
              <p className="mt-1 text-xs leading-5 text-[#5C6470]">Für neutralere Geschäftskommunikation, Briefköpfe und Belege.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">
                Anwendungsregeln
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5C6470]">
                <li>Schutzzone: mindestens ¼ der Bildmarkenhöhe auf allen Seiten.</li>
                <li>Mindestbreite: 240 px mit Claim, 120 px ohne Claim. Für 16–48 px die vereinfachte Stern-Bildmarke verwenden.</li>
                <li>Im Logo steht <strong className="text-[#202124]">ugcVZ</strong>, im Fließtext einheitlich <strong className="text-[#202124]">UGC VZ</strong>.</li>
              </ul>
            </div>
            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#D10523]">
                Nicht erlaubt
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5C6470]">
                <li>Logo nicht verzerren, drehen, umfärben oder mit harten Schlagschatten versehen.</li>
                <li>Nicht auf unruhigen Fotos platzieren ohne ruhige, kontraststarke Fläche dahinter.</li>
                <li>Keine unbelegten Reichweiten-, Qualitäts- oder Erfolgsgarantien mit dem Logo verbinden.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 05 Typografie, UI-System & Brand Voice */}
        <section id="typografie" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              05 / Typo &amp; UI
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Inter, UI-System &amp; Tonalität
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Schriftfamilie Inter für Website, App und Social Media (DSGVO-konform self-hosted, Fallback Arial, sans-serif). Kartenradius 12 px, Buttonradius 8 px, Abstände im 4/8/12/16/24/32/48-px-Raster.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">Headlines · 700–800</p>
              <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#202124]">Finde echte UGC Creator.</p>
              <p className="mt-3 text-xs leading-5 text-[#5C6470]">H1: 40–48 px · H2: 28–32 px · Inter Bold / ExtraBold.</p>
            </div>

            <div className="rounded-[12px] border border-[#DCE2EA] bg-[#F5F7FA] p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#06458F]">Body &amp; Buttons · 400 / 600</p>
              <p className="mt-4 text-base leading-6 text-[#202124]">
                Entdecke passende Creator für deine nächste Kampagne.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-[8px] bg-[#06458F] px-3.5 py-2 text-xs font-semibold text-white">
                  Primärer Button
                </span>
                <span className="inline-flex rounded-[8px] border border-[#06458F] bg-white px-3.5 py-2 text-xs font-semibold text-[#06458F]">
                  Sekundär
                </span>
              </div>
            </div>

            <div className="rounded-[12px] bg-[#062A59] p-6 text-white">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#FDECEF]">Daten · Tabular</p>
              <p className="mt-4 font-mono text-5xl font-bold tabular-nums">1.000</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#FDECEF]">VERIFIZIERTES PROFIL</p>
              <p className="mt-1 text-xs leading-5 text-white/75">
                Labels 12–14 px, Preise, Views und Gutschriftnummern in Tabular-Ziffern.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F9D55]">So schreiben wir (Du-Form)</p>
              <ul className="mt-3 space-y-2 text-sm font-medium text-[#202124]">
                <li>„Echte Creator. Echte Views. Dein Budget.“</li>
                <li>„Du zahlst nur geprüfte Beiträge und nie mehr als dein Budget.“</li>
                <li>„Der Satz gehört dir. Wir ziehen nichts ab.“</li>
              </ul>
            </div>
            <div className="rounded-[12px] border border-[#DCE2EA] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D10523]">Vermeiden</p>
              <ul className="mt-3 space-y-2 text-sm text-[#5C6470] line-through">
                <li>„Kostenloses Creator-Verzeichnis ohne Provision“</li>
                <li>„Revolutionäre KI-Plattform für garantierte Reichweite“</li>
                <li>„Sehr geehrte Damen und Herren“</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 06 Downloads */}
        <section id="downloads" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t-2 border-[#06458F] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#06458F] lg:col-span-2">
              06 / Assets
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Logo- &amp; Asset-Downloads
            </h2>
            <p className="text-sm leading-6 text-[#5C6470] lg:col-span-5">
              Alle hochskalierten, freigestellten ugcVZ PNG-Logos (mit und ohne Schrift), Social-Formate und die Open-Graph-Card direkt zum Herunterladen.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOWNLOADS.map((d) => (
              <a
                key={d.file}
                href={d.file}
                download
                className="group flex flex-col justify-between rounded-[12px] border border-[#DCE2EA] bg-white p-5 transition-colors hover:border-[#06458F]"
              >
                <div
                  className={`flex h-24 items-center justify-center rounded-[8px] px-4 ${
                    d.dark ? 'bg-[#062A59]' : 'bg-[#F5F7FA]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.file} alt={d.label} className="max-h-16 w-auto" />
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#202124]">{d.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#5C6470]">{d.meta}</p>
                  </div>
                  <Download size={16} className="shrink-0 text-[#5C6470] group-hover:text-[#06458F]" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          {/* Abschluss-Box */}
          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[12px] border-t-[3px] border-[#F2072A] bg-[#062A59] p-8 text-white sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#FDECEF]">
                <Layers size={14} aria-hidden="true" />
                Presse, Partner &amp; Kooperationen
              </p>
              <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Vektor-Sonderformate, Screenshots oder O-Töne gesucht?
              </p>
              <p className="mt-2 text-sm text-white/80">
                UGC VZ ist ein Produkt der track by track GmbH, Berlin. Wir helfen kurzfristig weiter.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hi@ugc-vz.de"
                className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-[8px] bg-white px-6 text-sm font-semibold text-[#06458F] hover:bg-[#F5F7FA]"
              >
                <span>hi@ugc-vz.de</span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="btn-press inline-flex min-h-[48px] items-center rounded-[8px] border border-white/35 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white/10"
              >
                Kontaktseite
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
