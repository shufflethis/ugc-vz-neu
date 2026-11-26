'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';

// Globaler Header nach Spec 8.2 (global.header):
// Logo links, max. 4 Nav-Links mittig, rechts 1 Anmelden-Dropdown + 1 kontextabhaengiger Primary-Button.
const NAV_ITEMS = [
  { href: '/brands', label: 'Für Marken' },
  { href: '/creator', label: 'Für Creator' },
  { href: '/preise', label: 'Preise' },
  { href: '/wissen', label: 'Wissen' },
] as const;

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const isCreatorPath = pathname === '/creator' || pathname.startsWith('/creator/');
  const primaryCta = isCreatorPath
    ? { href: '/creator#creator-form', label: 'Kostenlos mitmachen' }
    : { href: '/brand?tab=signup', label: 'Kampagne starten' };

  useEffect(() => {
    setLoginOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLoginOpen(false);
        setMobileOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (loginRef.current && !loginRef.current.contains(target)) {
        setLoginOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E1D8] bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:gap-4 sm:px-8">
        <Link
          href="/"
          aria-label="UGC VZ Startseite"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9] focus-visible:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/ugc-vz-logo.svg"
            alt="UGC VZ"
            width={78}
            height={48}
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        {/* Desktop Navigation: exakt 4 Links */}
        <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-medium transition-colors duration-150 ${
                  active ? 'text-[#121212]' : 'text-[#5C5A55] hover:text-[#121212]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Rechts: Anmelden-Dropdown + kontextabhaengiger Primary-Button + Mobile-Menu */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Desktop Anmelden Dropdown */}
          <div ref={loginRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setLoginOpen((open) => !open)}
              aria-expanded={loginOpen}
              aria-haspopup="menu"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full px-3 text-sm font-medium text-[#121212] transition-colors hover:bg-[#F7F6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9] focus-visible:ring-offset-2"
            >
              <span>Anmelden</span>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={`transition-transform duration-150 ${loginOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {loginOpen && (
              <div
                role="menu"
                aria-label="Anmeldebereich wählen"
                className="absolute right-0 top-12 w-52 rounded-[16px] border border-[#E4E1D8] bg-white p-1.5 shadow-[0_1px_2px_rgba(18,18,18,.06),0_8px_24px_rgba(18,18,18,.12)]"
              >
                <Link
                  role="menuitem"
                  href="/brand/login"
                  onClick={() => setLoginOpen(false)}
                  className="flex flex-col rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-[#F7F6F2]"
                >
                  <span className="text-sm font-semibold text-[#121212]">Als Marke</span>
                  <span className="text-xs text-[#5C5A55]">Kampagnen und Reports</span>
                </Link>
                <Link
                  role="menuitem"
                  href="/konto"
                  onClick={() => setLoginOpen(false)}
                  className="flex flex-col rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-[#F7F6F2]"
                >
                  <span className="text-sm font-semibold text-[#121212]">Als Creator</span>
                  <span className="text-xs text-[#5C5A55]">Profil und Kampagnen</span>
                </Link>
              </div>
            )}
          </div>

          {/* Primary Button: immer sichtbar (Desktop + Mobile 390px ohne Umbruch) */}
          <Link
            href={primaryCta.href}
            className="btn-press inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full bg-[#121212] px-3.5 text-xs font-semibold text-[#F7F6F2] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9] focus-visible:ring-offset-2 sm:min-h-[44px] sm:px-5 sm:text-sm"
          >
            {primaryCta.label}
          </Link>

          {/* Mobile Burger Menu */}
          <div ref={mobileRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E1D8] bg-white text-[#121212] transition-colors hover:bg-[#F7F6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C2BD9]"
            >
              {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>

            {mobileOpen && (
              <nav
                aria-label="Mobile Navigation"
                className="absolute right-0 top-12 w-64 rounded-[20px] border border-[#E4E1D8] bg-white p-2 shadow-[0_1px_2px_rgba(18,18,18,.06),0_12px_32px_rgba(18,18,18,.14)]"
              >
                <div className="space-y-0.5">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl px-3.5 text-sm font-medium text-[#121212] hover:bg-[#F7F6F2]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="my-2 border-t border-[#E4E1D8]" />
                <p className="px-3.5 pb-1 pt-1 text-xs font-medium text-[#5C5A55]">Anmelden</p>
                <div className="space-y-0.5">
                  <Link
                    href="/brand/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3.5 text-sm font-medium text-[#121212] hover:bg-[#F7F6F2]"
                  >
                    Als Marke anmelden
                  </Link>
                  <Link
                    href="/konto"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3.5 text-sm font-medium text-[#121212] hover:bg-[#F7F6F2]"
                  >
                    Als Creator anmelden
                  </Link>
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
