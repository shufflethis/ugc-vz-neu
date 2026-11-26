'use client';

import Link from 'next/link';
import { useState } from 'react';
import ContactPopup from '../../app/components/ContactPopup';

const FOOTER_COLUMNS = [
  {
    label: 'Für Marken',
    links: [
      { label: "So funktioniert's", href: '/#so-funktionierts' },
      { label: 'Preise', href: '/preise' },
      { label: 'Kostenrechner', href: '/brands/ugc-kosten-rechner' },
      { label: 'Vertragsvorlage', href: '/brands/ugc-vertrag-vorlage' },
      { label: 'Creator nach Branche', href: '/alle-seiten#branchen' },
    ],
  },
  {
    label: 'Für Creator',
    links: [
      { label: 'Kampagnen ansehen', href: '/creator' },
      { label: 'So verdienst du', href: '/creator#so-funktionierts' },
      { label: 'UGC Creator werden', href: '/creator/ugc-creator-werden' },
      { label: 'Login', href: '/konto' },
    ],
  },
  {
    label: 'Ressourcen',
    links: [
      { label: 'Wissen', href: '/wissen' },
      { label: 'Vergleiche', href: '/vergleich' },
      { label: 'FAQ', href: '/faq' },
      { label: 'API & KI-Agenten', href: '/developers' },
      { label: 'Alle Seiten', href: '/alle-seiten' },
    ],
  },
] as const;

export default function Footer() {
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);

  return (
    <footer className="mt-20 border-t-[3px] border-[#F2072A] bg-[#062A59] pb-10 pt-16 text-white/80 sm:mt-24 sm:pt-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Oberer Claim- und CTA-Streifen */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-white/15 pb-10 lg:flex-row lg:items-end">
          <div className="max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/ugcvz-logo-white.webp"
              alt="UGC VZ"
              width={180}
              height={61}
              className="h-12 w-auto sm:h-14"
            />
            <p className="mt-5 font-display text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
              Creator-Kampagnen nach Views. Für Marken aus Deutschland, Österreich und der Schweiz.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/brand?tab=signup"
              className="btn-press inline-flex min-h-[48px] items-center rounded-[8px] bg-white px-6 text-sm font-semibold text-[#06458F] hover:bg-[#F5F7FA]"
            >
              Kampagne starten
            </Link>
            <Link
              href="/creator#creator-form"
              className="btn-press inline-flex min-h-[48px] items-center rounded-[8px] border border-white/35 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white/10"
            >
              Als Creator mitmachen
            </Link>
          </div>
        </div>

        {/* 4 Spalten ohne H1 bis H3 (Spec 8.2 global.footer) */}
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.label} aria-label={col.label}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {col.label}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/75 transition-colors duration-150 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Spalte 4: Unternehmen & Kontakt */}
          <nav aria-label="Unternehmen">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              Unternehmen
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-white/75 transition-colors duration-150 hover:text-white">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/75 transition-colors duration-150 hover:text-white">
                  Kontakt
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsContactPopupOpen(true)}
                  className="text-left text-sm text-white/75 transition-colors duration-150 hover:text-white"
                >
                  Direktnachricht schreiben
                </button>
              </li>
              <li>
                <Link href="/brandkit" className="text-sm text-white/75 transition-colors duration-150 hover:text-white">
                  Brand Kit &amp; Presse
                </Link>
              </li>
            </ul>
            <div className="mt-5 space-y-1 text-xs leading-5 text-white/60">
              <p>track by track GmbH</p>
              <p>Schliemannstr. 23, 10437 Berlin</p>
              <p>
                <a className="hover:text-white" href="mailto:hi@ugc-vz.de">
                  hi@ugc-vz.de
                </a>
                {' · '}
                <a className="hover:text-white" href="tel:+4930403665451">
                  +49 30 403 665 451
                </a>
              </p>
            </div>
          </nav>
        </div>

        {/* Eine kompakte Zeile fuer KI-Agenten statt Badge-Wand */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 py-5 sm:flex-row sm:items-center">
          <p className="text-sm text-white/75">
            Auch für KI-Agenten: MCP, REST-API und ChatGPT-App.{' '}
            <Link
              href="/developers"
              className="font-semibold text-white underline decoration-[#F2072A] decoration-2 underline-offset-4 hover:text-white"
            >
              Zur Doku
            </Link>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ugcvz/ugc-vz-mcp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UGC VZ auf GitHub"
              className="text-white/65 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@ugcvz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UGC VZ auf YouTube"
              className="text-white/65 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/UGC_VZ/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UGC VZ auf Instagram"
              className="text-white/65 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 7.7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
              </svg>
            </a>
            <a
              href="https://x.com/UGC_VZ"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UGC VZ auf X"
              className="text-white/65 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Schmale Rechtszeile & Copyright */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/60 md:flex-row md:items-center">
          <nav aria-label="Rechtliches" className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link href="/impressum" className="hover:text-white">
              Impressum
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/datenschutz" className="hover:text-white">
              Datenschutz
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/agb" className="hover:text-white">
              AGB
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
          </nav>

          <p className="leading-5">
            © 2026 UGC VZ ist ein Produkt der track by track GmbH, Berlin. Das Team kommt von der Social-Media-Agentur{' '}
            <a
              href="https://famefact.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              famefact
            </a>
            .
          </p>
        </div>
      </div>

      <ContactPopup
        isOpen={isContactPopupOpen}
        onClose={() => setIsContactPopupOpen(false)}
        title="Kontakt aufnehmen"
        subtitle="Hast du Fragen zu einer Kampagne oder zum Creator-Konto? Schreib uns kurz."
      />
    </footer>
  );
}
