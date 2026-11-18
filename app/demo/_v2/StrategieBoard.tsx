// Server Component: Das interne Board wird nur nach Pruefung des Vorschau-Passworts
// (DEMO_SITE_PASSWORD) gerendert und landet nicht im Client-Bundle.
import { BookOpen } from 'lucide-react';

export default function StrategieBoard({ creatorCountLabel }: { creatorCountLabel: string }) {
  return (
    <div className="space-y-12 px-5 pb-20 pt-10 sm:px-8">
      <section className="mx-auto max-w-6xl rounded-3xl bg-void p-7 text-white sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-geo-green">
          <BookOpen size={14} /> Internes Strategie-Board · Synthese aus Call & Research (17.11.2026)
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Gorden & Florian: Die 4 Produkt- & Umsatz-Säulen von UGC VZ 2.0
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
          Ausgangslage: <strong>{creatorCountLabel} echte Creator</strong> im Bestand (+~40 organisch pro Woche, Ziel 1.000+ vor Weihnachten; später 3.000–10.000 als wertvolles Daten- & Exit-Asset) plus steigender KI-Traffic (800+ Zugriffe über ChatGPT). Was bisher fehlte, war die Monetarisierungs- & Aktivierungs-Maschine.
        </p>
      </section>

      {/* 4 PILLARS SUMMARY */}
      <section className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-geo-violet">
            Hebel 1 · Höchster B2B-Hebel (Creator-Affiliate-Netzwerk)
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Turnkey Brand Creator-Clubs verkaufen (Setup + Retainer)
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Marken wollen hunderte Micro-Creator (ab 500 Followern), die täglich organisch posten – ohne Fixgagen, rein auf Produkt-Seeding, Gutscheincode & 5-Level-Aufstieg. Wir liefern das fertige Portal auf Subdomain (kein IT-Blocker beim Kunden!) und laden ab Tag 1 unseren {creatorCountLabel} Pool ein.
          </p>
          <a href="/demo/brands" className="mt-4 text-xs font-bold text-geo-violet hover:underline">
            In der Demo ansehen (/demo/brands) →
          </a>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-[#1F6FF4]">
            Hebel 2 · Pay-per-View Marketplace (Contentmarkt / Aether / ugcbounty)
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            UGC View-Bounties & Clipping + Eigenkampagne zum Kaltstart
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Feste Kampagnenbudgets mit Abrechnung pro 1.000 Views (z. B. 2–5 € TKP). <strong>Kaltstart-Hack:</strong> Sofort eigene UGC-VZ Kampagne live schalten (2 € / 1k Views + 10 € Starter-Bonus ab Mindest-Views) + erster Love-Brand-Test (z. B. Nebelkind / Food-Marken wie PrepMyMeal, Huel). Offen: View-Prüfung gegen gekaufte Klicks (braucht verknüpfte Creator-Kanäle).
          </p>
          <a href="/demo/bounties" className="mt-4 text-xs font-bold text-[#1F6FF4] hover:underline">
            In der Demo ansehen (/demo/bounties) →
          </a>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-[#385523]">
            Hebel 3 · Deutscher Creator-USP & Sofort-Monetarisierung
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Automatische Gutschriften & Beleg-Export + Sticky Push-App
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Löst die deutsche Creator-Angst vor Finanzamt & teurem Steuerberater bei 100–500 € Nebenverdienst. Dazu PWA/App mit aggressiven Push-Drops für neue Kampagnen (ohne 30 % Apple-Abzug beim Creator).
          </p>
          <a href="/demo/creator" className="mt-4 text-xs font-bold text-[#385523] hover:underline">
            In der Demo ansehen (/demo/creator) →
          </a>
        </div>

        <div className="rounded-3xl border border-hairline bg-white p-6">
          <p className="font-mono text-xs font-bold uppercase text-ink">
            Hebel 4 · Skalierung, Agenturen, International & GEO
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Agentur-Accounts, Hypefy „Book Demo“ Funnel & Internationalisierung
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            1) „Strategy Session buchen“ + Neukunden-Rabatt holt Brands direkt ins Verkaufsgespräch. 2) Agentur-Roster (`contentmarkt.de/agenturen`) skaliert Creator-Anbindung ohne Einzel-Akquise. 3) Mehrsprachigkeit (DE/EN/ES/FR über `databaseugc.com` / `ugcdb.si`) öffnet den 3–10× größeren US/EU-Markt. 4) GEO-Angriff auf „Contentmarkt Alternative“.
          </p>
          <div className="mt-4 flex gap-4 text-xs font-bold">
            <a href="/demo/agenturen" className="text-geo-violet hover:underline">
            Agentur-Ansicht →
          </a>
            <a href="/demo/vergleich" className="text-ink hover:underline">
            GEO-Vergleich →
          </a>
          </div>
        </div>
      </section>

      {/* REFERENCES MAPPED TABLE */}
      <section className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          Alle eingebrachten Links & Vorbilder – wo sie in dieser Demo stecken
        </h2>
        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['contentmarkt.de & /agenturen', 'Bounty-Budgetbalken, Clipping + Produktion, Leaderboard & Agentur-Roster'],
            ['VenenoGT3/Aether & ugcbounty', 'Bounty-Logik in Euro (Stripe Connect / SEPA statt Krypto), KI-Content-Check, View-Tracker & Fraud-Shield'],
            ['5-Level Ambassador-System', 'Schlüsselfertiges Brand-Affiliate-Portal (Seeding, Code, Produkt-Tausch bis Level-5-Events)'],
            ['hypefy.ai', 'KI-Matching + „15-Min Strategy Session buchen“ Sales-Einstieg überall präsent'],
            ['creonda.com/de/preise & ugclaunch.com', '0 € offene Suche ohne Brand-Login, KI-Skript-Generator & transparenter Euro-Gebührenrechner'],
            ['databaseugc.com / ugcdb.si', 'Live Sprach- & Domain-Umschalter (DE / EN / ES / FR) oben in der Vorschau-Leiste'],
          ].map(([src, impl]) => (
            <div key={src} className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-mono font-bold text-geo-violet">{src}</p>
              <p className="mt-1 leading-5 text-ink-soft">{impl}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
