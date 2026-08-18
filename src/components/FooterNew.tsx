'use client';

import Link from 'next/link';
import { useState } from 'react';
import ContactPopup from '../../app/components/ContactPopup';
import LogoImage from '../../app/components/LogoImage';

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
