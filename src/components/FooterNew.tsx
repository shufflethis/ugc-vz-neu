'use client';

import Link from 'next/link';
import { useState } from 'react';
import ContactPopup from '../../app/components/ContactPopup';
import LogoImage from '../../app/components/LogoImage';
import PreferredSourceBadge from '../../app/components/PreferredSourceBadge';

export default function Footer() {
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  return (
    <footer className="bg-void text-gray-300 py-16 border-t border-gray-800 mt-16 font-['Inter',sans-serif]">
      <div className="container mx-auto px-6 md:px-16 lg:px-24">
        {/* Desktop: 5 columns, Tablet: 2 columns, Mobile: 1 column */}
        <div className="footer-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 footer-grid-5 gap-8 lg:gap-12 mb-12">
          {/* Column 1: Company Info/Logo */}
          <div>
            <div className="flex items-center mb-6">
              <LogoImage
                width={40}
                height={40}
                className="mr-3"
                alt="UGC VZ Logo"
              />
              <span className="text-2xl font-bold gradient-text">UGC VZ</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-400">
              Die Plattform, um User Generated Content Creators zu finden und zu beauftragen.
            </p>
            <p className="text-xs mb-6 text-gray-500">track by track GmbH</p>

            {/* Kontaktdaten in der ersten Spalte */}
            <div className="space-y-3 text-sm text-gray-400">
              <p>Schliemannstr. 23<br />10437 Berlin</p>
              <p><a className="hover:text-white transition-colors duration-200" href="tel:+4930403665451">+49 30 403 665 451</a></p>
              <p><a className="hover:text-white transition-colors duration-200" href="mailto:hi@ugc-vz.de">hi@ugc-vz.de</a></p>
            </div>
          </div>

          {/* Column 2: Unternehmen */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Unternehmen</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Über uns</Link></li>
              <li><Link href="/creator" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Als Creator anmelden</Link></li>
              <li><Link href="/konto" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Login für Creator</Link></li>
              <li><Link href="/brands" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Für Brands</Link></li>
            </ul>
          </div>

          {/* Column 3: Rechtliches */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Rechtliches</h3>
            <ul className="space-y-3">
              <li><Link href="/impressum" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Impressum</Link></li>
              <li><Link href="/datenschutz" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Datenschutz</Link></li>
              <li><Link href="/agb" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">AGB</Link></li>
              <li><Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Cookie-Richtlinie</Link></li>
            </ul>
          </div>

          {/* Column 4: Support & Kontakt */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Support & Kontakt</h3>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">FAQ</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Kontaktseite</Link></li>
              <li><Link href="/developers" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">API &amp; KI-Agenten</Link></li>
              <li>
                <button
                  onClick={() => setIsContactPopupOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm text-left"
                >
                  Kontakt
                </button>
              </li>
              <li><Link href="/wissen" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Wissen</Link></li>
            </ul>

            {/* Vertrauenssignale: offener Quellcode des MCP-Servers und der
                eigene Kanal - beides pruefbar, deshalb hier statt im Fliesstext. */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://github.com/ugcvz/ugc-vz-mcp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ MCP-Server auf GitHub"
                title="MCP-Server auf GitHub"
                className="text-gray-400 hover:text-white transition-colors duration-200"
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
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                </svg>
              </a>
              <a
                href="https://x.com/UGC_VZ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UGC VZ auf X"
                title="UGC VZ auf X"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 5: Vergleiche */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Vergleiche</h3>
            <ul className="space-y-3">
              <li><Link href="/vergleich" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Alle Plattformen</Link></li>
              <li><Link href="/vergleich/speekly-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Speekly Alternative</Link></li>
              <li><Link href="/vergleich/influee-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Influee Alternative</Link></li>
              <li><Link href="/vergleich/stylink-ugc-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">stylink UGC Alternative</Link></li>
              <li><Link href="/vergleich/boksi-alternative" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Boksi Alternative</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
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
