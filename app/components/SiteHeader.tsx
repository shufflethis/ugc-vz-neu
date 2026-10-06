import Link from 'next/link';

// Globaler Header (layout.tsx) nach Brand Kit: Wortmarke als SVG, sticky mit Blur.
// Ersetzt die frueher pro Seite kopierten Header. Mobile-Menue per <details>,
// damit kein Client-JavaScript noetig ist.
const NAV = [
  { href: '/brands', label: 'Für Brands' },
  { href: '/creator', label: 'Für Creator' },
  { href: '/wissen', label: 'Wissen' },
  { href: '/konto', label: 'Login' },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-white/80 px-5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 sm:px-8">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 sm:h-[72px]">
        <Link href="/" aria-label="UGC VZ – Startseite" className="shrink-0 focus-visible:ring-2 focus-visible:ring-geo-violet">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ugc-vz-logo.svg" alt="UGC VZ" width={78} height={48} className="h-9 w-auto sm:h-10" />
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">{item.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/creator#creator-form" className="hidden min-h-[40px] items-center rounded-full border border-hairline px-4 text-sm font-semibold transition-colors hover:border-ink lg:inline-flex">Als Creator anmelden</Link>
          <Link href="/#search" className="inline-flex min-h-[40px] items-center rounded-full bg-geo-violet px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(139,63,202,0.3)] transition-transform hover:-translate-y-0.5">Creator finden</Link>
          <details className="group relative md:hidden">
            <summary aria-label="Menü öffnen" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-hairline [&::-webkit-details-marker]:hidden">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="group-open:hidden"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="hidden group-open:block"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </summary>
            <nav aria-label="Mobile Navigation" className="absolute right-0 top-12 w-64 rounded-3xl border border-hairline bg-white p-2 shadow-[0_24px_60px_rgba(35,22,47,0.15)]">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="flex min-h-[48px] items-center rounded-2xl px-4 font-medium hover:bg-surface">{item.label}</Link>
              ))}
              <Link href="/creator#creator-form" className="mt-1 flex min-h-[48px] items-center justify-center rounded-2xl bg-surface px-4 font-semibold">Als Creator anmelden</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
