import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Hauptbereich mit Slogan und Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Slogan und Beschreibung */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">
              UGC VZ
            </h3>
            <p className="text-gray-300 mb-4">
              Finde deine UGC Creators gratis. direct mit agentifizeirung
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-emerald-400" />
                <span>+49 30 403 665 451</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-emerald-400" />
                <a href="mailto:hi@ugc-vz.de" className="hover:text-emerald-400 transition-colors">
                  hi@ugc-vz.de
                </a>
              </div>
              <div className="mt-2">
                <p>Schliemannstr. 23</p>
                <p>10437 Berlin</p>
              </div>
            </div>
          </div>

          {/* Schnelllinks */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Schnelllinks</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <Link href="/so-arbeiten-wir" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  So arbeiten wir
                </Link>
              </li>
              <li>
                <Link href="/vorteile" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Vorteile
                </Link>
              </li>
              <li>
                <Link href="/ueber-uns" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/bewerben" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Bewerben
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/impressum" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} track by track GmbH. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}