import Link from 'next/link';
import SearchBox from './components/SearchBox';
import LogoImage from './components/LogoImage';
import TrustElements from './components/TrustElements';
import HomePageSchema from './components/HomePageSchema';
import HeroVisual from './components/home/HeroVisual';
import NotchCard from './components/home/NotchCard';
import FilmPlayer from './components/motion/FilmPlayer';
import { CREATOR_COUNT_LABEL } from './lib/creator-count';
import { getRecentBrandRequestLabel } from './lib/brand-request-count';
import { NICHE_INDEX, nichePath } from './lib/niche-index';

const GRADIENT = 'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}

// Geschwungener Uebergang hell -> dunkel (bzw. umgekehrt) wie in der Referenz.
function NotchEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className={`block h-10 w-full sm:h-16 ${flip ? 'rotate-180' : ''}`} aria-hidden="true">
      <path d="M0 0 H420 C470 0 490 64 560 64 H880 C950 64 970 0 1020 0 H1440 V64 H0 Z" fill="#060606" />
    </svg>
  );
}

const features = [
  {
    title: 'Die Suche versteht dein Briefing',
    text: 'Beschreib Produkt, Zielgruppe und Format in deinen Worten. Die KI-Suche findet passende Profile.',
    ui: (
      <div className="rounded-2xl border border-hairline bg-surface p-4 text-sm">
        <p className="leading-6 text-ink"><mark className="rounded bg-[#F4EDFB] px-1 text-geo-violet">Skincare-Serum</mark>, <mark className="rounded bg-[#E6F0FE] px-1 text-[#1F6FF4]">Reel für Instagram</mark>, <mark className="rounded bg-[#edf5e5] px-1 text-[#385523]">Frau 25–35</mark></p>
        <div className="mt-3 flex justify-end"><span className="rounded-xl bg-geo-violet px-4 py-2 text-xs font-bold text-white">Creator suchen</span></div>
      </div>
    ),
  },
  {
    title: 'Echte Profile mit Arbeitsproben',
    text: 'Reale UGC Creator mit Portfolio- und Social-Nachweisen – keine KI-Avatare.',
    ui: (
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: GRADIENT }}>LE</div>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold">Lea · München</p><p className="truncate text-xs text-ink-soft">Testimonials, Reels, Fotos</p></div>
        <div className="flex gap-1">{[0.5, 0.75, 1].map((o) => <span key={o} className="h-10 w-6 rounded-md" style={{ background: GRADIENT, opacity: o }} />)}</div>
      </div>
    ),
  },
  {
    title: 'Du wählst bewusst aus',
    text: 'Vergleiche Themen, Preisvorstellungen und Arbeitsproben. Kein Algorithmus entscheidet für dich.',
    ui: (
      <div className="space-y-2">
        {[['Mia · Berlin', true], ['Jonas · Köln', false], ['Lea · München', true]].map(([name, on]) => (
          <div key={name as string} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${on ? 'border-geo-violet bg-[#FBF8FE]' : 'border-hairline bg-white'}`}>
            <span className="truncate font-semibold">{name}</span>
            <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${on ? 'bg-[#edf5e5] text-[#385523]' : 'bg-geo-violet text-white'}`}>{on ? '✓ In deiner Auswahl' : '+ Zur Auswahl'}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Kontakte per Mail – ohne Provision',
    text: 'Du erhältst die verfügbaren Kontaktdaten kostenlos per E-Mail. Honorar und Rechte klärt ihr direkt.',
    ui: (
      <div className="rounded-2xl border border-hairline bg-white p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-geo-violet">Dein kostenloses Matching</p>
        <p className="mt-1 text-base font-bold tracking-tight">Deine Creator-Auswahl ist da</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#edf5e5] font-bold text-[#385523]">✓</span>2 Kontakte · 0 € Provision</div>
      </div>
    ),
  },
];

const faqs = [
  ['Ist UGC VZ wirklich kostenlos?', 'Ja. Creator suchen, Profile prüfen, Kontaktdaten anfordern und ein Creator-Profil anlegen ist kostenlos. Content-Produktion und optionale Agenturleistungen werden separat vereinbart.'],
  ['Was passiert nach meiner Kontaktanfrage?', 'Du erhältst deine Auswahl und die verfügbaren Kontaktinformationen per E-Mail. Anschließend kontaktierst du die Creator selbst. Die Anfrage bucht keinen Auftrag.'],
  ['Welche Creator passen zu meinem Produkt?', 'Nenne Produkt, Zielgruppe und gewünschtes Format in deiner Suche. Vergleiche danach Profilangaben, Preisvorstellungen und vorhandene Arbeitsproben. Verfügbarkeit und Details klärst du direkt.'],
];

export default async function Home() {
  const brandRequests = await getRecentBrandRequestLabel();
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

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-surface px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-16" aria-labelledby="home-title">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.12] blur-3xl" style={{ background: GRADIENT }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523] sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#527b33]" aria-hidden="true" />
              {CREATOR_COUNT_LABEL} Creator-Profile · {brandRequests ? `${brandRequests} Brand-Anfragen in 4 Wochen` : 'Kostenlos suchen'}
            </p>
            <h1 id="home-title" className="text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.1rem] xl:text-[4.4rem]">
              Dein Produkt.<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>Passende Creator.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg lg:mx-0">
              Finde echte UGC Creator, prüfe Arbeitsproben und frage deine Favoriten kostenlos an – ohne Provision, ohne Agentur dazwischen.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="#search" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-violet px-6 font-semibold text-white shadow-[0_14px_30px_rgba(139,63,202,0.35)] transition-transform hover:-translate-y-0.5">Creator finden <Arrow /></Link>
              <Link href="#so-funktionierts" className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline bg-white px-6 font-semibold transition-colors hover:border-ink">So funktioniert&apos;s</Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* ---------- Suche (ueberlappt den Hero) ---------- */}
      <section className="relative z-10 -mt-16 px-5 sm:-mt-20 sm:px-8">
        <div id="search" className="home-search-panel mx-auto max-w-6xl scroll-mt-6 rounded-3xl border border-hairline bg-white p-4 shadow-[0_30px_90px_rgba(35,22,47,0.10)] sm:p-8">
          <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Wofür suchst du Creator?</h2>
            <p className="flex items-center gap-1.5 text-xs text-ink-soft"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#527b33" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>Kostenlos · Ohne Brand-Login</p>
          </div>
          <SearchBox showFeatured />
        </div>
        <p className="mx-auto mt-5 max-w-6xl text-center text-xs leading-5 text-ink-soft">Suche und Kontaktanfrage sind kostenlos. Produktion und Nutzungsrechte vereinbart ihr direkt.</p>
      </section>

      <div className="mt-10"><TrustElements compact /></div>

      {/* ---------- Features ---------- */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="home-features-title">
        <div className="mx-auto max-w-6xl">
          <h2 id="home-features-title" className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
            Echte Creator finden.<br className="hidden sm:block" /> <span className="text-ink-soft">In vier klaren Schritten.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-2">
            {features.map((f) => (
              <NotchCard key={f.title} title={<h3 className="text-lg font-semibold tracking-tight sm:text-xl">{f.title}</h3>}>
                <p className="text-sm leading-6 text-ink-soft">{f.text}</p>
                <div className="mt-6">{f.ui}</div>
              </NotchCard>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- So funktioniert's (dunkle Buehne) ---------- */}
      <section id="so-funktionierts" className="scroll-mt-4" aria-labelledby="home-how-title">
        <NotchEdge />
        <div className="relative overflow-hidden bg-void px-5 pb-20 pt-12 text-white sm:px-8 sm:pb-28 sm:pt-16">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 rounded-full border border-white/5" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-[620px] w-[620px] -translate-x-1/2 rounded-full border border-white/5" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-[20%] h-96 w-[60%] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: GRADIENT }} aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl">
            <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-white/50">So funktioniert UGC VZ</p>
            <h2 id="home-how-title" className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">
              Vom Briefing zur Zusammenarbeit.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center leading-7 text-white/60">Du prüfst die Profile. Du wählst aus. Den Rest vereinbart ihr direkt – für Brands und Creator kostenlos.</p>
            <div className="mt-10 sm:mt-12"><FilmPlayer /></div>
          </div>
        </div>
        <NotchEdge flip />
      </section>

      {/* ---------- Branchen ---------- */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="home-niches-title">
        <div className="mx-auto max-w-6xl">
          <h2 id="home-niches-title" className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">UGC Creator für jede Branche</h2>
          <p className="mx-auto mt-4 max-w-xl text-center leading-7 text-ink-soft">Von Beauty-Reels bis App-Demo: Starte mit einer Branche und sieh direkt passende Profile.</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NICHE_INDEX.map((niche) => (
              <li key={niche.slug}>
                <Link href={nichePath(niche)} className="group flex min-h-[56px] items-center justify-between rounded-2xl border border-hairline bg-surface px-5 transition-colors hover:border-geo-violet hover:bg-white">
                  <span className="font-semibold">{niche.chip}</span>
                  <span className="text-ink-soft transition-transform group-hover:translate-x-1 group-hover:text-geo-violet"><Arrow /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Fuer Creator ---------- */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28" aria-labelledby="home-creator-title">
        <div className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-[36px] p-7 text-white sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-16" style={{ background: GRADIENT }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(-78deg, transparent 0 26px, rgba(255,255,255,.4) 26px 27px)' }} aria-hidden="true" />
          <div className="relative">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/70">Für die Menschen hinter dem Content</p>
            <h2 id="home-creator-title" className="text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">Du machst den Content.<br />Mach dich auffindbar.</h2>
            <p className="mt-5 max-w-lg leading-7 text-white/85">Als UGC Creator anmelden, dein Portfolio zeigen und von Brands für passende Projekte gefunden werden. Kostenlos und ohne Provision.</p>
            <Link href="/creator#creator-form" className="mt-8 inline-flex min-h-[48px] items-center gap-3 rounded-full bg-white px-6 font-semibold text-ink transition-transform hover:-translate-y-0.5">Kostenloses Creator-Profil erstellen <Arrow /></Link>
          </div>
          <ul className="relative space-y-3">
            {[
              ['Deine Arbeitsproben im Mittelpunkt', 'Zeige Marken, welche Themen und Formate zu dir passen.'],
              ['Direkte Zusammenarbeit', 'Honorar, Timing und Nutzungsrechte klärst du selbst mit der Brand.'],
              ['Dein Profil, dein Angebot', 'Ergänze Preisvorstellungen und halte deine Angaben aktuell.'],
            ].map(([title, description]) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#385523]" aria-hidden="true">✓</span>
                <div><span className="font-semibold">{title}</span><p className="text-sm leading-6 text-white/80">{description}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24" aria-labelledby="home-faq-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="home-faq-title" className="text-center text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Noch kurz gefragt.</h2>
          <div className="mt-10 space-y-3">
            {faqs.map(([question, answer], i) => (
              <details key={question} open={i === 0} className="group rounded-2xl border border-hairline bg-white px-5 transition-colors open:border-ink/20 sm:px-6">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <span className="text-xl font-normal text-ink-soft transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-ink-soft">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center"><Link href="/faq" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-geo-violet">Alle häufigen Fragen <Arrow /></Link></p>
        </div>
      </section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section className="px-5 sm:px-8" aria-label="Kostenlos starten">
        <div className="relative mx-auto max-w-6xl">
          <div className="relative z-10 mx-auto -mb-8 w-fit rounded-full bg-white p-2">
            <Link href="#search" className="inline-flex min-h-[56px] items-center gap-3 rounded-full px-8 text-base font-semibold text-white shadow-[0_18px_40px_rgba(91,70,240,0.4)] sm:text-lg" style={{ background: GRADIENT }}>Kostenlos Creator finden <Arrow /></Link>
          </div>
          <div className="rounded-[36px] bg-void px-6 pb-12 pt-16 text-center text-white sm:pb-14">
            <p className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{CREATOR_COUNT_LABEL} echte Creator. 0 € Provision.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">Suche, Auswahl und Kontaktdaten sind kostenlos. Du sprichst direkt mit den Creatorn.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
