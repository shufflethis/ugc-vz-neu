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
  title: 'Brand Kit & Presse: Logo, Farben, Typografie & Produkt-Fakten',
  description:
    'Offizielles Brand Kit und Presse-Kit von UGC VZ (Version 2.0): Logo-Downloads (SVG/PNG), Design-Tokens, Typografie, Presse-Faktenblatt und alle aktuellen Plattform-Funktionen.',
  alternates: { canonical: 'https://ugc-vz.de/brandkit' },
  openGraph: {
    title: 'Brand Kit & Presse | UGC VZ',
    description:
      'Logos, Farben, Typografie, Boilerplates und alle aktuellen Plattform-Funktionen von UGC VZ auf einen Blick.',
    url: 'https://ugc-vz.de/brandkit',
    siteName: 'UGC VZ',
    locale: 'de_DE',
    type: 'website',
  },
};

const CORE_COLORS = [
  { name: 'Ink', hex: '#121212', rgb: '18, 18, 18', cmyk: '0 / 0 / 0 / 93', role: 'Primärtext, Primary-Buttons, dunkle Bühnen, Footer', dark: true },
  { name: 'Paper', hex: '#F7F6F2', rgb: '247, 246, 242', cmyk: '0 / 0 / 2 / 3', role: 'Warme Hero- und Sektionsflächen', dark: false },
  { name: 'Surface', hex: '#FFFFFF', rgb: '255, 255, 255', cmyk: '0 / 0 / 0 / 0', role: 'Karten, Formulare, Grundfläche', dark: false },
  { name: 'Line', hex: '#E4E1D8', rgb: '228, 225, 216', cmyk: '0 / 1 / 5 / 11', role: '1-px-Rahmen, Trennlinien', dark: false },
  { name: 'Muted', hex: '#5C5A55', rgb: '92, 90, 85', cmyk: '0 / 2 / 8 / 64', role: 'Sekundärtext, Metadaten, Bildunterschriften', dark: true },
  { name: 'Accent Violet', hex: '#6C2BD9', rgb: '108, 43, 217', cmyk: '50 / 80 / 0 / 15', role: 'Fokus-Ringe, Eyebrows, aktive Akzente', dark: true },
  { name: 'Accent Soft', hex: '#EFE8FD', rgb: '239, 232, 253', cmyk: '6 / 8 / 0 / 1', role: 'Dezente Hinweisflächen, aktive Filter', dark: false },
  { name: 'Money Lime', hex: '#C8F04B', rgb: '200, 240, 75', cmyk: '17 / 0 / 69 / 6', role: 'Exklusiv für Geld, Views, Status „Zählt“ und Restbudget', dark: false },
];

const STATUS_COLORS = [
  { name: 'Success', hex: '#1F9D55', role: 'Verifiziert, erfolgreich gespeichert' },
  { name: 'Warning', hex: '#E8A317', role: 'Budget-Balken ab 80 % Auslastung, Hinweise' },
  { name: 'Error', hex: '#D93025', role: 'Validierungs- und Versandfehler' },
];

const DOWNLOADS = [
  { label: 'Wortmarke SVG', file: '/brand/ugc-vz-logo.svg', meta: 'Vektor · Farbe · Standard', dark: false },
  { label: 'Wortmarke PNG', file: '/brand/ugc-vz-logo-2400.png', meta: 'Transparent · 2400 px', dark: false },
  { label: 'Wortmarke Weiß SVG', file: '/brand/ugc-vz-logo-white.svg', meta: 'Vektor · auf Ink #121212', dark: true },
  { label: 'Wortmarke Weiß PNG', file: '/brand/ugc-vz-logo-white-2400.png', meta: 'Transparent · 2400 px', dark: true },
  { label: 'Wortmarke Schwarz SVG', file: '/brand/ugc-vz-logo-black.svg', meta: 'Vektor · einfarbig', dark: false },
  { label: 'Wortmarke Schwarz PNG', file: '/brand/ugc-vz-logo-black-2400.png', meta: 'Transparent · 2400 px', dark: false },
  { label: 'App-Icon PNG', file: '/apple-touch-icon.png', meta: '180 × 180 px', dark: false },
  { label: 'Favicon SVG', file: '/favicon.svg', meta: 'Skalierbar · Browser-Icon', dark: false },
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
    title: 'Beitragsprüfung („Zählt“ vs. „Zählt nicht“)',
    summary:
      'Jeder eingereichte TikTok-, Instagram-Reel- oder YouTube-Short-Link wird gegen die Kampagnen-Checkliste geprüft. Abgerechnet werden ausschließlich geprüfte Beiträge in vollen 1.000er-Schritten.',
    highlights: [
      'Gelöschte oder briefwidrige Beiträge fallen automatisch aus der Abrechnung',
      'Live-Budget-Balken (scaleX) wechselt ab 80 % Auslastung auf Warnfarbe',
      'Teilbarer Live-Report und CSV-Export direkt im Marken-Konto',
    ],
  },
  {
    icon: Search,
    badge: 'KI-Suche & Taxonomie',
    title: '20er-Kategorien-Taxonomie, Filter-Chips & KI-Opt-in',
    summary:
      'Die Creator-Suche klassifiziert Profile in 20 feste Branchenkategorien (max. 3 pro Creator, 1 Hauptkategorie) mit hartem Kategorie-Filter, strukturierter Filterleiste, „Warum passt das?“-Begründung und Session-stabiler MMR-Rotation.',
    highlights: [
      'Kein Branchen-Rauschen: Auto-Suchen liefern keine branchenfremden Beauty-Profile',
      'Explizite Einwilligung (Opt-in) vor jeder KI-Kanalanalyse, sofortiger Widerruf löscht Text, Embedding und Rohdaten',
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
      'Bestehende Marken-E-Mails im Registrieren-Tab wechseln automatisch zum Login',
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
  ['Produktname (verbindliche Schreibweise)', 'UGC VZ'],
  ['Betreiber', 'track by track GmbH, Schliemannstr. 23, 10437 Berlin'],
  ['Mutteragentur / Team', 'famefact (Social-Media-Agentur, Berlin)'],
  ['Markt & Zielregion', 'Deutschland, Österreich und Schweiz (DACH)'],
  ['Creator-Pool', `${CREATOR_COUNT_LABEL} echte Creator-Profile in 20 Kategorien`],
  ['Preismodell Marken', 'Kostenloses Konto, kein Abo, regulär 15 % Servicegebühr im Kampagnenbudget enthalten'],
  ['Preismodell Creator', 'Kostenlos, 0 % Plattformgebühr (100 % des View-Satzes gehen an den Creator)'],
  ['Zahlungsabwicklung', 'Stripe Connect (SEPA & virtuelle DE-IBAN 0 %, Karte +3 % Kartengebühr)'],
  ['Website & API-Doku', 'https://ugc-vz.de · https://ugc-vz.de/developers'],
  ['Presse- & Partnerkontakt', 'hi@ugc-vz.de · +49 30 403 665 451'],
];

const CSS_TOKENS_SNIPPET = `:root {
  --color-ink: #121212;
  --color-paper: #F7F6F2;
  --color-surface: #FFFFFF;
  --color-line: #E4E1D8;
  --color-muted: #5C5A55;
  --color-accent: #6C2BD9;
  --color-accent-soft: #EFE8FD;
  --color-money: #C8F04B;
  --color-success: #1F9D55;
  --color-warning: #E8A317;
  --color-error: #D93025;
}`;

export default function BrandKitPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://ugc-vz.de' },
    { name: 'Brand Kit & Presse', url: 'https://ugc-vz.de/brandkit' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Cover / Hero auf Ink #121212 ohne Gradient-Blob */}
      <section className="bg-[#121212] px-5 pb-16 pt-14 text-[#F7F6F2] sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.18em] text-[#F7F6F2]/60">
            <span>Brand Kit &amp; Pressebereich</span>
            <span>Version 2.0 · November 2026</span>
          </div>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex rounded-[20px] bg-white px-7 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ Logo" className="h-16 w-auto sm:h-24" />
              </div>
              <h1 className="mt-8 font-display text-4xl font-bold leading-[1.06] tracking-[-0.02em] sm:text-6xl">
                Brand Kit, Presse-Fakten und Plattform-Updates.
              </h1>
            </div>

            <div className="space-y-5 text-sm leading-6 text-[#F7F6F2]/80 sm:text-base lg:col-span-5">
              <p>
                UGC VZ ist die DACH-Plattform für Creator-Kampagnen nach geprüften Views mit fester Budget-Obergrenze. Hier finden Presse, Partner und Teams alle offiziellen Logos, Farben, Schriften, Boilerplates und eine vollständige Übersicht der aktuellen Plattform-Funktionen.
              </p>
              <nav aria-label="Schnellzugriff Brand Kit" className="flex flex-wrap gap-2 pt-1">
                {[
                  { href: '#presse', label: 'Presse & Fakten' },
                  { href: '#funktionen', label: 'Neue Funktionen' },
                  { href: '#logo', label: 'Logo-System' },
                  { href: '#farben', label: 'Farben & Tokens' },
                  { href: '#typografie', label: 'Typografie' },
                  { href: '#downloads', label: 'Downloads' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-medium text-[#F7F6F2] transition-colors hover:border-[#C8F04B] hover:text-[#C8F04B]"
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
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              01 / Presse
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Presse-Kit &amp; Faktenblatt
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Alle geprüften Fakten, Schreibweisen und freigegebenen Textbausteine für Redaktionen, Verzeichnisse und Partner-Präsentationen.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Fakten-Tabelle */}
            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6 sm:p-8 lg:col-span-7">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6C2BD9]">
                <Newspaper size={15} aria-hidden="true" />
                <span>Faktencheck auf einen Blick</span>
              </div>
              <dl className="mt-5 divide-y divide-[#E4E1D8]">
                {PRESS_FACTS.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-12 sm:gap-4">
                    <dt className="text-xs font-semibold text-[#5C5A55] sm:col-span-5">{label}</dt>
                    <dd className="text-sm font-medium text-[#121212] sm:col-span-7">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Boilerplates + Pressekontakt */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">
                  Kurzbeschreibung (ca. 45 Wörter)
                </p>
                <p className="mt-3 text-sm leading-6 text-[#121212]">
                  UGC VZ ist eine Plattform für Creator-Kampagnen im deutschsprachigen Raum. Marken legen Preis pro 1.000 geprüfte Views und eine verbindliche Budget-Obergrenze fest. Creator aus Deutschland, Österreich und der Schweiz posten auf TikTok, Instagram und YouTube und erhalten 100 % des View-Satzes ohne Plattformgebühr.
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6 shadow-card">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">
                  Hintergrund / Über den Betreiber
                </p>
                <p className="mt-3 text-sm leading-6 text-[#5C5A55]">
                  UGC VZ ist ein Produkt der track by track GmbH in Berlin. Das Team hinter der Social-Media-Agentur famefact hat die Plattform aufgebaut, um Briefings, Creator-Auswahl, Beitragsprüfung und Abrechnung in einem klaren, messbaren Ablauf ohne Pflicht-Abo zusammenzuführen.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#121212] p-6 text-[#F7F6F2]">
                <p className="font-display text-lg font-bold">Presse- und Interviewanfragen</p>
                <p className="mt-2 text-sm leading-6 text-[#F7F6F2]/75">
                  Ansprechpartner: Tobias Sander (Geschäftsführer) &amp; Florian Runge (Brand Partnerships), Berlin.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a
                    href="mailto:hi@ugc-vz.de?subject=Presseanfrage%20UGC%20VZ"
                    className="btn-press inline-flex min-h-[42px] items-center rounded-full bg-[#C8F04B] px-4 text-xs font-bold text-[#121212]"
                  >
                    hi@ugc-vz.de
                  </a>
                  <Link
                    href="/about"
                    className="inline-flex min-h-[42px] items-center rounded-full border border-white/25 px-4 text-xs font-semibold text-[#F7F6F2] hover:border-white/60"
                  >
                    Team ansehen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 Neue Plattform-Funktionen (detailliert dokumentiert) */}
        <section id="funktionen" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              02 / Produkt
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Aktuelle Plattform-Funktionen
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Dokumentation der wichtigsten neuen Funktionen von UGC VZ für Presse, Partner und Marken-Teams (Stand November 2026).
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {NEW_PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="flex flex-col rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] text-[#C8F04B]">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-[#E4E1D8] bg-white px-3 py-1 text-[11px] font-semibold text-[#5C5A55]">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold leading-snug text-[#121212]">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-[#5C5A55]">{feature.summary}</p>
                  <ul className="mt-4 space-y-2 border-t border-[#E4E1D8] pt-4 text-xs leading-5 text-[#121212]">
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

        {/* 03 Logo-System */}
        <section id="logo" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              03 / Logo
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Wortmarke, Icon &amp; Schutzraum
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Die offizielle Wortmarke „UGC VZ“ ist das Hauptlogo. Das U-Icon wird für App-Icons, Favicons und quadratische Social-Avatare genutzt.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-8">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ Wortmarke Farbe" className="h-16 w-auto" />
              </div>
              <p className="mt-4 font-semibold text-[#121212]">Auf Weiß &amp; Paper</p>
              <p className="mt-1 text-xs leading-5 text-[#5C5A55]">Standard für Website, Präsentationen und Presse.</p>
            </div>

            <div className="rounded-[20px] border border-[#121212] bg-[#121212] p-8 text-[#F7F6F2]">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugc-vz-logo-white.svg" alt="UGC VZ Wortmarke Weiß" className="h-16 w-auto" />
              </div>
              <p className="mt-4 font-semibold">Auf Ink #121212</p>
              <p className="mt-1 text-xs leading-5 text-[#F7F6F2]/70">Für dunkle Bühnen, Footer und Social-Grafiken.</p>
            </div>

            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-8">
              <div className="flex h-36 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ugc-vz-logo-black.svg" alt="UGC VZ Wortmarke Schwarz" className="h-16 w-auto" />
              </div>
              <p className="mt-4 font-semibold text-[#121212]">Einfarbig Schwarz</p>
              <p className="mt-1 text-xs leading-5 text-[#5C5A55]">Für Druck, Rechnungen, Gutschriften und Fax/Briefkopf.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">Regeln</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5C5A55]">
                <li>Schutzraum: mindestens Höhe des „U“ rundum frei von Text oder Rahmen.</li>
                <li>Mindestbreite digital: 80 px (Wortmarke) bzw. 16 px (Favicon/App-Icon).</li>
                <li>Markenname im Fließtext immer einheitlich als <strong className="text-[#121212]">UGC VZ</strong> schreiben.</li>
              </ul>
            </div>
            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">Nicht erlaubt</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5C5A55]">
                <li>Wortmarke nicht verzerren, drehen, umfärben oder mit harten Schlagschatten versehen.</li>
                <li>Keine unruhigen Foto-Hintergründe ohne kontraststarke Fläche hinter dem Logo.</li>
                <li>Keine falschen Produkt-Claims wie „alles kostenlos“ oder „garantierte Viralität“ kombinieren.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 04 Farbsystem & Design Tokens */}
        <section id="farben" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              04 / Farben
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Farbsystem &amp; CSS Tokens
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Ruhige Flächen aus Weiß und warmem Paper #F7F6F2, klarer Kontrast durch Ink #121212, Akzente in Accent Violet #6C2BD9 und Money Lime #C8F04B ausschließlich für Geld, Views und geprüfte Ergebnisse.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_COLORS.map((color) => (
              <div key={color.hex} className="overflow-hidden rounded-[20px] border border-[#E4E1D8] bg-white shadow-card">
                <div
                  className={`flex h-24 items-end justify-between p-4 ${color.dark ? 'text-[#F7F6F2]' : 'text-[#121212]'}`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="font-mono text-xs font-bold">{color.hex}</span>
                </div>
                <div className="p-4">
                  <p className="font-display text-base font-bold text-[#121212]">{color.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#5C5A55]">
                    RGB {color.rgb} · CMYK {color.cmyk}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#5C5A55]">{color.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6 lg:col-span-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">Status-Farben</p>
              <div className="mt-4 space-y-3">
                {STATUS_COLORS.map((s) => (
                  <div key={s.hex} className="flex items-center gap-3 rounded-xl bg-white p-3">
                    <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: s.hex }} />
                    <div>
                      <p className="text-sm font-semibold text-[#121212]">
                        {s.name} <span className="font-mono text-xs text-[#5C5A55]">{s.hex}</span>
                      </p>
                      <p className="text-xs text-[#5C5A55]">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-[#121212] p-6 text-[#F7F6F2] lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#C8F04B]">
                  Live CSS Design Tokens
                </p>
                <span className="font-mono text-[11px] text-[#F7F6F2]/60">app/globals.css</span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-6 text-[#F7F6F2]/90">
                <code>{CSS_TOKENS_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* 05 Typografie & Tonalitaet */}
        <section id="typografie" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              05 / Typografie
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Bricolage Grotesque, Inter &amp; Geist Mono
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Alle Schriften werden DSGVO-konform selbst über ugc-vz.de gehostet (kein externer Google-Fonts-Aufruf). Zahlen nutzen tabular-nums gegen Layout-Springen.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">Display · 600 bis 700</p>
              <p className="mt-4 font-display text-5xl font-bold text-[#121212]">Aa</p>
              <p className="mt-3 font-display text-lg font-bold text-[#121212]">Bricolage Grotesque</p>
              <p className="mt-1 text-xs leading-5 text-[#5C5A55]">
                Headlines H1 bis H3, prägnant mit leichtem Tracking (-0.02em).
              </p>
            </div>

            <div className="rounded-[20px] border border-[#E4E1D8] bg-[#F7F6F2] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#5C5A55]">Body · 400 bis 700</p>
              <p className="mt-4 text-5xl font-semibold text-[#121212]">Aa</p>
              <p className="mt-3 text-lg font-bold text-[#121212]">Inter</p>
              <p className="mt-1 text-xs leading-5 text-[#5C5A55]">
                Fließtext, Formulare, Navigation und UI-Elemente (16 bis 18 px).
              </p>
            </div>

            <div className="rounded-[20px] bg-[#121212] p-6 text-[#F7F6F2]">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#C8F04B]">Daten · Tabular</p>
              <p className="mt-4 font-mono text-5xl font-bold tabular-nums">1.000</p>
              <p className="mt-3 font-mono text-lg font-bold">Geist Mono</p>
              <p className="mt-1 text-xs leading-5 text-[#F7F6F2]/70">
                Preise, Views, Budget-Balken, Gutschriftnummern und API-Endpunkte.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F9D55]">So schreiben wir</p>
              <ul className="mt-3 space-y-2 text-sm font-medium text-[#121212]">
                <li>„Echte Creator. Echte Views. Dein Budget.“</li>
                <li>„Du zahlst nur geprüfte Beiträge und nie mehr als dein Budget.“</li>
                <li>„Der Satz gehört dir. Wir ziehen nichts ab.“</li>
              </ul>
            </div>
            <div className="rounded-[20px] border border-[#E4E1D8] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D93025]">Vermeiden</p>
              <ul className="mt-3 space-y-2 text-sm text-[#5C5A55] line-through">
                <li>„Kostenloses Creator-Verzeichnis ohne Provision“</li>
                <li>„Revolutionäre KI-Plattform für garantierte Reichweite“</li>
                <li>„Sehr geehrte Damen und Herren“</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 06 Downloads */}
        <section id="downloads" className="scroll-mt-24">
          <div className="mb-10 grid gap-4 border-t border-[#121212] pt-5 lg:grid-cols-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5C5A55] lg:col-span-2">
              06 / Assets
            </p>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl lg:col-span-5">
              Logo-Downloads für Presse &amp; Partner
            </h2>
            <p className="text-sm leading-6 text-[#5C5A55] lg:col-span-5">
              Alle offiziellen SVG- und hochauflösenden PNG-Dateien direkt zum Herunterladen.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOWNLOADS.map((d) => (
              <a
                key={d.file}
                href={d.file}
                download
                className="group flex flex-col justify-between rounded-[20px] border border-[#E4E1D8] bg-white p-5 transition-colors hover:border-[#121212]"
              >
                <div
                  className={`flex h-20 items-center justify-center rounded-2xl px-4 ${
                    d.dark ? 'bg-[#121212]' : 'bg-[#F7F6F2]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.file} alt={d.label} className="max-h-14 w-auto" />
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#121212]">{d.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#5C5A55]">{d.meta}</p>
                  </div>
                  <Download size={16} className="shrink-0 text-[#5C5A55] group-hover:text-[#6C2BD9]" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          {/* Abschluss-Box */}
          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-[#121212] p-8 text-[#F7F6F2] sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#C8F04B]">
                <Layers size={14} aria-hidden="true" />
                Presse, Partner &amp; Kooperationen
              </p>
              <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Sonderformate, Screenshots oder O-Töne gesucht?
              </p>
              <p className="mt-2 text-sm text-[#F7F6F2]/75">
                UGC VZ ist ein Produkt der track by track GmbH, Berlin. Wir helfen kurzfristig weiter.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hi@ugc-vz.de"
                className="btn-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#F7F6F2] px-6 text-sm font-semibold text-[#121212]"
              >
                <span>hi@ugc-vz.de</span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <Link
                href="/contact"
                className="btn-press inline-flex min-h-[48px] items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-[#F7F6F2] hover:border-white/60"
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
