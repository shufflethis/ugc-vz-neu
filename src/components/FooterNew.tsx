import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-gray-300 py-16 border-t border-gray-800 mt-16 font-['Inter',sans-serif]">
      <div className="container mx-auto px-6 md:px-16 lg:px-24">
        {/* Desktop: 4 columns, Tablet: 2 columns, Mobile: 1 column */}
        <div className="footer-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 footer-grid-4 gap-8 lg:gap-12 mb-12">
          {/* Column 1: Company Info/Logo */}
          <div>
            <div className="flex items-center mb-6">
              <Image
                src="/ugc-vz-logo.webp"
                alt="UGC VZ Logo"
                width={40}
                height={40}
                className="mr-3"
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
              <li><Link href="/bewerben" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Mitmachen</Link></li>
              <li><Link href="/presse" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Presse</Link></li>
              <li><Link href="/karriere" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Karriere</Link></li>
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
              <li><Link href="/kontakt" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Kontakt</Link></li>
              <li><Link href="/wissen" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">Wissen</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} UGC-VZ ist ein Produkt der track by track GmbH. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
