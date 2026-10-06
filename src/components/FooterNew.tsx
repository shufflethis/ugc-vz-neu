'use client';

import Link from 'next/link';
import { NICHE_INDEX, nichePath } from '@/app/lib/niche-index';
import Image from 'next/image';
import { useState } from 'react';
import ContactPopup from '../../app/components/ContactPopup';
import PreferredSourceBadge from '../../app/components/PreferredSourceBadge';

// Verzeichnis-Eintraege. Viele Launch-Seiten vergeben dofollow nur, wenn ihr
// Badge hier verlinkt ist: Badge-Bild-URL aus der jeweiligen Einreichung als
// `img` eintragen (img-src erlaubt https:), sonst erscheint der Name als Pille.
const FEATURED_ON: { name: string; href: string; img?: string; width?: number; height?: number }[] = [
  { name: 'MCP Registry', href: 'https://registry.modelcontextprotocol.io/v0/servers?search=ugc-vz' },
  { name: 'Glama', href: 'https://glama.ai/mcp/connectors/de.ugc-vz/creator-search' },
  { name: 'Smithery', href: 'https://smithery.ai/servers/ugc-vz/creator-search' },
  { name: 'MCP Market', href: 'https://mcpmarket.com/server/ugc-vz' },
  { name: 'Twelve Tools', href: 'https://twelve.tools', img: 'https://twelve.tools/badge0-dark.svg', width: 150, height: 40 },
  { name: 'Turbo0', href: 'https://turbo0.com/item/ugc-vz', img: 'https://img.turbo0.com/badge-listed-light.svg', width: 150, height: 40 },
];

export default function Footer() {
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  return (
    <footer className="relative mt-24 overflow-hidden bg-void pb-10 pt-16 text-white/70 sm:pt-20">
      {/* Logo-Glow nach Brand Kit */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-56 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl" style={{ background: 'var(--grad-logo)' }} />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* CTA-Band */}
        <div className="mb-14 flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-12 lg:flex-row lg:items-end">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ugc-vz-logo-white.svg" alt="UGC VZ" width={130} height={80} className="h-14 w-auto" />
            <p className="mt-6 max-w-md text-2xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-3xl">Echte Creator. Direkt gefunden. Ohne Provision.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/#search" className="inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5">Creator finden</Link>
            <Link href="/creator#creator-form" className="inline-flex min-h-[48px] items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:border-white/50">Als Creator anmelden</Link>
          </div>
        </div>
        {/* Desktop: 5 columns, Tablet: 2 columns, Mobile: 1 column */}
        <div className="footer-container mb-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
          {/* Column 1: Company Info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <p className="text-sm leading-relaxed mb-6 text-white/60">
              Die Plattform, um User Generated Content Creators zu finden und zu beauftragen.
            </p>
            <p lang="en" className="text-sm leading-relaxed mb-6 text-white/60">
              The UGC creator directory for Germany, Austria &amp; Switzerland – free for brands and AI agents.
            </p>
            <p className="text-xs mb-6 text-white/40">track by track GmbH</p>

            {/* Kontaktdaten in der ersten Spalte */}
            <div className="space-y-3 text-sm text-white/60">
              <p>Schliemannstr. 23<br />10437 Berlin</p>
              <p><a className="hover:text-white transition-colors duration-200" href="tel:+4930403665451">+49 30 403 665 451</a></p>
              <p><a className="hover:text-white transition-colors duration-200" href="mailto:hi@ugc-vz.de">hi@ugc-vz.de</a></p>
            </div>
          </div>

          {/* Column 2: Unternehmen */}
          <div>
            <h3 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">Unternehmen</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Über uns</Link></li>
              <li><Link href="/brandkit" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Brand Kit</Link></li>
              <li><Link href="/creator" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Als Creator anmelden</Link></li>
              <li><Link href="/konto" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Login für Creator</Link></li>
              <li><Link href="/brands" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Für Brands</Link></li>
            </ul>
          </div>

          {/* Column 3: Rechtliches */}
          <div>
            <h3 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">Rechtliches</h3>
            <ul className="space-y-3">
              <li><Link href="/impressum" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Impressum</Link></li>
              <li><Link href="/datenschutz" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Datenschutz</Link></li>
              <li><Link href="/agb" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">AGB</Link></li>
              <li><Link href="/cookies" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Cookie-Richtlinie</Link></li>
            </ul>
          </div>

          {/* Column 4: Support & Kontakt */}
          <div>
            <h3 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">Support & Kontakt</h3>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">FAQ</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Kontaktseite</Link></li>
              <li><Link href="/developers" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">API &amp; KI-Agenten</Link></li>
              <li>
                <button
                  onClick={() => setIsContactPopupOpen(true)}
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm text-left"
                >
                  Kontakt
                </button>
              </li>
              <li><Link href="/wissen" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Wissen</Link></li>
            </ul>

            <a
              href="https://chatgpt.com/plugins/plugin_asdk_app_6a90f71483e081919574c5f8578607bc?search=ugc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="UGC VZ Plugin in ChatGPT öffnen (neuer Tab)"
              className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <Image src="/images/chatgpt-logo.svg" width={24} height={24} alt="" aria-hidden="true" className="shrink-0" />
              <span>In ChatGPT öffnen<span className="mt-0.5 block text-xs font-normal text-gray-600">Unser UGC VZ Plugin</span></span>
            </a>

            {/* WebMCP-Badge: die Seite registriert Site-Tools im Browser
                (document.modelContext) - Details auf /developers#webmcp. */}
            <Link
              href="/developers#webmcp"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors duration-200"
              title="Diese Seite registriert 7 Site-Tools für KI-Agenten"
            >
              <span aria-hidden="true">⚡</span>
              WebMCP ready — 7 Site-Tools
            </Link>

            {/* Vertrauenssignale: offener Quellcode des MCP-Servers und der
                eigene Kanal - beides pruefbar, deshalb hier statt im Fliesstext. */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://github.com/ugcvz/ugc-vz-mcp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ MCP-Server auf GitHub"
                title="MCP-Server auf GitHub"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@ugcvz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ auf YouTube"
                title="UGC VZ auf YouTube"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/UGC_VZ/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ auf Instagram"
                title="UGC VZ auf Instagram"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 2c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 7.7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
                </svg>
              </a>
              <a
                href="https://x.com/UGC_VZ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ auf X"
                title="UGC VZ auf X"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 5: Vergleiche */}
          <div>
            <h3 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">Vergleiche</h3>
            <ul className="space-y-3">
              <li><Link href="/vergleich" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Alle Plattformen</Link></li>
              <li><Link href="/vergleich/speekly-alternative" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Speekly Alternative</Link></li>
              <li><Link href="/vergleich/influee-alternative" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Influee Alternative</Link></li>
              <li><Link href="/vergleich/stylink-ugc-alternative" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">stylink UGC Alternative</Link></li>
              <li><Link href="/vergleich/boksi-alternative" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">Boksi Alternative</Link></li>
            </ul>
          </div>
        </div>

        {/* Branchen: sitewide interne Links auf die Nischen-Landingpages */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">UGC Creator nach Branche</h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {NICHE_INDEX.map((niche) => (
              <li key={niche.slug}><Link href={nichePath(niche)} className="text-white/60 hover:text-white transition-colors duration-200 text-sm">{niche.chip}</Link></li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/10 pt-8 mb-8">
          <h3 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white">Featured on</h3>
          <ul className="flex flex-wrap items-center gap-3">
            {FEATURED_ON.map((entry) => (
              <li key={entry.name}>
                <a href={entry.href} target="_blank" rel="noopener" className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors duration-200">
                  {entry.img
                    // eslint-disable-next-line @next/next/no-img-element -- Badge muss von der Verzeichnis-Domain laden (Pruefung)
                    ? <img src={entry.img} alt={`UGC VZ auf ${entry.name}`} width={entry.width ?? 150} height={entry.height ?? 40} loading="lazy" />
                    : entry.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-white/40 mb-4 md:mb-0">
            © {new Date().getFullYear()} UGC-VZ ist ein Produkt der track by track GmbH. Der Berliner Social Media Agentur{' '}
            <a 
              href="https://famefact.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200"
            >
              famefact
            </a>
            . Alle Rechte vorbehalten.
          </p>
          <PreferredSourceBadge variant="light" className="shrink-0" />
        </div>
      </div>

      <ContactPopup
        isOpen={isContactPopupOpen}
        onClose={() => setIsContactPopupOpen(false)}
        title="Kontakt aufnehmen"
        subtitle="Haben Sie Fragen oder benötigen Sie Unterstützung? Schreiben Sie uns!"
      />
    </footer>
  );
}
