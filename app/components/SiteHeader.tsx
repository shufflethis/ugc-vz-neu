'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';

// Globaler Header in der ugcVZ Brand Kit CI (Directory Blue #06458F + Creator Red #F2072A):
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
    <header className="sticky top-0 z-40 border-b border-[#DCE2EA]/90 bg-white/95 px-5 shadow-[0_1px_2px_rgba(6,69,143,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:px-8">
      <div className="mx-auto flex h-[66px] max-w-[1200px] items-center justify-between gap-2 sm:h-[74px] sm:gap-4">
        <Link
          href="/"
          aria-label="UGC VZ Startseite"
          className="inline-flex shrink-0 items-center rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F] focus-visible:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/ugcvz-logo-header.webp"
            alt="UGC VZ"
            width={142}
            height={46}
            className="block h-9 w-auto sm:h-10"
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
                className={`text-sm font-semibold transition-colors duration-150 ${
                  active
                    ? 'text-[#06458F] underline decoration-[#F2072A] decoration-2 underline-offset-8'
                    : 'text-[#5C6470] hover:text-[#06458F]'
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
              className="inline-flex min-h-[40px] items-center gap-1 rounded-[8px] border border-[#DCE2EA] bg-white px-3.5 text-sm font-semibold text-[#06458F] transition-colors hover:border-[#06458F] hover:bg-[#F5F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F] focus-visible:ring-offset-2"
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
                className="absolute right-0 top-12 w-56 rounded-[12px] border border-[#DCE2EA] bg-white p-1.5 shadow-[0_1px_2px_rgba(6,69,143,.06),0_10px_28px_rgba(32,33,36,.12)]"
              >
                <Link
                  role="menuitem"
                  href="/brand/login"
                  onClick={() => setLoginOpen(false)}
                  className="flex flex-col rounded-[8px] px-3.5 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
                >
                  <span className="text-sm font-semibold text-[#06458F]">Als Marke</span>
                  <span className="text-xs text-[#5C6470]">Kampagnen und Reports</span>
                </Link>
                <Link
                  role="menuitem"
                  href="/konto"
                  onClick={() => setLoginOpen(false)}
                  className="flex flex-col rounded-[8px] px-3.5 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
                >
                  <span className="text-sm font-semibold text-[#06458F]">Als Creator</span>
                  <span className="text-xs text-[#5C6470]">Profil und Kampagnen</span>
                </Link>
              </div>
            )}
          </div>

          {/* Primary Button: Directory Blue (#06458F) mit weisser Schrift */}
          <Link
            href={primaryCta.href}
            className="btn-press inline-flex min-h-[40px] items-center whitespace-nowrap rounded-[8px] bg-[#06458F] px-4 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(6,69,143,0.22)] hover:-translate-y-[0.5px] hover:bg-[#053673] hover:shadow-[0_6px_18px_rgba(6,69,143,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F] focus-visible:ring-offset-2 sm:min-h-[44px] sm:px-5 sm:text-sm"
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
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#DCE2EA] bg-white text-[#06458F] transition-colors hover:bg-[#F5F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06458F]"
            >
              {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>

            {mobileOpen && (
              <nav
                aria-label="Mobile Navigation"
                className="absolute right-0 top-12 w-64 rounded-[12px] border border-[#DCE2EA] bg-white p-2 shadow-[0_1px_2px_rgba(6,69,143,.06),0_12px_32px_rgba(32,33,36,.14)]"
              >
                <div className="space-y-0.5">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-[44px] items-center rounded-[8px] px-3.5 text-sm font-semibold text-[#202124] hover:bg-[#F5F7FA] hover:text-[#06458F]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="my-2 border-t border-[#DCE2EA]" />
                <p className="px-3.5 pb-1 pt-1 text-xs font-semibold text-[#5C6470]">Anmelden</p>
                <div className="space-y-0.5">
                  <Link
                    href="/brand/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-[8px] px-3.5 text-sm font-semibold text-[#06458F] hover:bg-[#F5F7FA]"
                  >
                    Als Marke anmelden
                  </Link>
                  <Link
                    href="/konto"
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-[8px] px-3.5 text-sm font-semibold text-[#06458F] hover:bg-[#F5F7FA]"
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
