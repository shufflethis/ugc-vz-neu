import Link from 'next/link';
import SearchBox from './components/SearchBox';
import LogoImage from './components/LogoImage';
import TrustElements from './components/TrustElements';
import CreatorWorkflow from './components/CreatorWorkflow';
import HomePageSchema from './components/HomePageSchema';
import { CREATOR_COUNT_LABEL } from './lib/creator-count';

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}

export default function Home() {
  return (
    <div className="home-page min-h-screen bg-white text-ink">
      <HomePageSchema />
      <header className="border-b border-hairline bg-white px-5 sm:px-8">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 sm:h-20">
          <Link href="/" aria-label="UGC VZ – Startseite" className="flex shrink-0 items-center gap-2 font-bold tracking-tight focus-visible:ring-2 focus-visible:ring-geo-violet">
            <LogoImage width={32} height={32} priority />
            <span className="text-xl">UGC VZ<span className="text-geo-violet">.</span></span>
          </Link>
          <nav aria-label="Hauptnavigation" className="flex items-center gap-4 sm:gap-7">
            <Link href="/brands" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">Für Brands</Link>
            <Link href="/konto" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">Login</Link>
            <Link href="/creator#creator-form" className="whitespace-nowrap rounded-full border border-hairline px-3 py-2.5 text-xs font-semibold transition-colors hover:border-ink sm:px-4 sm:text-sm"><span className="hidden sm:inline">Als </span>Creator anmelden</Link>
          </nav>
        </div>
      </header>

      <section className="home-hero px-5 pb-10 pt-6 sm:px-8 sm:pb-16 sm:pt-12" aria-labelledby="home-title">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523] sm:mb-5 sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#527b33]" aria-hidden="true" />
              {CREATOR_COUNT_LABEL} Creator-Profile · Kostenlos suchen
            </p>
            <h1 id="home-title" className="text-[2rem] font-bold leading-[1.08] tracking-[-0.055em] min-[375px]:text-[2.25rem] sm:text-6xl lg:text-[4.5rem]">
              Dein Produkt.<br />
              <span className="text-geo-violet">Passende Creator.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft sm:mt-5 sm:text-lg sm:leading-7">
              Finde UGC Creator, prüfe Arbeitsproben und frage deine Favoriten kostenlos an.
            </p>
          </div>

          <div id="search" className="home-search-panel mt-6 scroll-mt-6 rounded-2xl border border-hairline bg-white p-4 sm:mt-8 sm:rounded-3xl sm:p-8 lg:p-8">
            <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Wofür suchst du Creator?</h2>
              <p className="flex items-center gap-1.5 text-xs text-ink-soft"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#527b33" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>Kostenlos · Ohne Brand-Login</p>
            </div>
            <SearchBox showFeatured />
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-ink-soft">Suche und Kontaktanfrage sind kostenlos. Produktion und Nutzungsrechte vereinbart ihr direkt.</p>
        </div>
      </section>

      <TrustElements compact />
      <CreatorWorkflow />

      <section className="px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="home-proof-title">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Einmal anschauen. Direkt loslegen.</p>
            <h2 id="home-proof-title" className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Von deiner Idee<br />zur Creator-Auswahl.</h2>
            <p className="mt-4 max-w-md leading-7 text-ink-soft">So formulierst du dein Briefing, vergleichst Profile und erhältst die verfügbaren Kontaktdaten deiner Favoriten per E-Mail.</p>
            <Link href="#search" className="mt-6 inline-flex items-center gap-2 font-semibold text-geo-violet hover:underline">Deine Creator finden <Arrow /></Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <video className="aspect-video w-full" controls preload="none" poster="/ugc-creator-finden-poster.webp" width={1280} height={720} playsInline controlsList="nodownload" aria-label="So funktioniert die Creator-Suche bei UGC VZ">
              <source src="/ugc-creator-finden.mp4" type="video/mp4" />
              Dein Browser unterstützt keine Videos.
            </video>
          </div>
        </div>
      </section>

      <section className="px-5 pb-14 sm:px-8 sm:pb-20" aria-labelledby="home-creator-title">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-[#f0ece6] p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Für die Menschen hinter dem Content</p>
            <h2 id="home-creator-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">Du machst den Content.<br />Mach dich auffindbar.</h2>
            <p className="mt-4 max-w-lg leading-7 text-ink-soft">Als UGC Creator anmelden, dein Portfolio zeigen und von Brands für passende Projekte gefunden werden. Kostenlos und ohne Provision.</p>
            <Link href="/creator#creator-form" className="mt-6 inline-flex items-center justify-center gap-3 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#333333]">Kostenloses Creator-Profil erstellen <Arrow /></Link>
          </div>
          <ul className="space-y-4 text-sm leading-6 text-ink-soft">
            {[
              ['Deine Arbeitsproben im Mittelpunkt', 'Zeige Marken, welche Themen und Formate zu dir passen.'],
              ['Direkte Zusammenarbeit', 'Honorar, Timing und Nutzungsrechte klärst du selbst mit der Brand.'],
              ['Dein Profil, dein Angebot', 'Ergänze Preisvorstellungen und halte deine Angaben aktuell.'],
            ].map(([title, description]) => <li key={title} className="flex gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#527b33]" aria-hidden="true">✓</span><div><span className="font-semibold text-ink">{title}</span><p>{description}</p></div></li>)}
          </ul>
        </div>
      </section>

      <section className="border-t border-hairline px-5 py-12 sm:px-8" aria-labelledby="home-faq-title">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><h2 id="home-faq-title" className="text-2xl font-semibold tracking-tight">Noch kurz gefragt.</h2><Link href="/faq" className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-geo-violet">Alle häufigen Fragen <Arrow /></Link></div>
          <div className="divide-y divide-hairline">
            {[
              ['Ist UGC VZ wirklich kostenlos?', 'Ja. Creator suchen, Profile prüfen, Kontaktdaten anfordern und ein Creator-Profil anlegen ist kostenlos. Content-Produktion und optionale Agenturleistungen werden separat vereinbart.'],
              ['Was passiert nach meiner Kontaktanfrage?', 'Du erhältst deine Auswahl und die verfügbaren Kontaktinformationen per E-Mail. Anschließend kontaktierst du die Creator selbst. Die Anfrage bucht keinen Auftrag.'],
              ['Welche Creator passen zu meinem Produkt?', 'Nenne Produkt, Zielgruppe und gewünschtes Format in deiner Suche. Vergleiche danach Profilangaben, Preisvorstellungen und vorhandene Arbeitsproben. Verfügbarkeit und Details klärst du direkt.'],
            ].map(([question, answer]) => <details key={question} className="group py-4 first:pt-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2 font-medium [&::-webkit-details-marker]:hidden"><span>{question}</span><span className="text-xl font-normal text-ink-soft group-open:rotate-45" aria-hidden="true">+</span></summary><p className="max-w-xl pb-2 pt-2 text-sm leading-7 text-ink-soft">{answer}</p></details>)}
          </div>
        </div>
      </section>
    </div>
  );
}
