import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/utils/seo-metadata';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import FAQSchema from '../../components/FAQSchema';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import { loadNicheRows, nicheStats } from '@/app/lib/niche-data';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  path: '/creator/ugc-creator-werden',
  title: 'UGC Creator werden in Deutschland (Leitfaden 2026)',
  description: `UGC Creator werden ohne große Reichweite: Portfolio aufbauen, realistische Preise setzen, Gewerbe & Nutzungsrechte klären und kostenlos bei UGC VZ (${CREATOR_COUNT_LABEL} Profile) sichtbar werden.`,
});

const faqs = [
  {
    question: 'Brauche ich viele Follower, um UGC Creator zu werden?',
    answer:
      'Nein. Bei User Generated Content bezahlt dich die Marke nicht für deine Reichweite, sondern für die Video-Produktion und die Nutzungsrechte. Ein überzeugendes Portfolio mit 3–6 Arbeitsproben zählt deutlich mehr als Followerzahlen.',
  },
  {
    question: 'Wie viel kann ich als Einsteiger pro UGC-Video verlangen?',
    answer:
      'In Deutschland liegen Einsteiger-Honorare für ein kurzes Social-Video (15–30 Sek.) oft zwischen 120 und 300 € netto. Mit Erfahrung, Zusatz-Hooks, Rohmaterial und Paid-Ads-Nutzungsrechten steigen die Paketpreise deutlich.',
  },
  {
    question: 'Brauche ich als UGC Creator in Deutschland ein Gewerbe?',
    answer:
      'Wer dauerhaft mit Gewinnerzielungsabsicht bezahlte Videos für Marken erstellt, übt in der Regel eine gewerbliche Tätigkeit aus und braucht eine Gewerbeanmeldung (oft zunächst mit Kleinunternehmerregelung nach § 19 UStG). Lass deinen Einzelfall kurz vom Steuerberater oder Gewerbeamt klären.',
  },
  {
    question: 'Was kostet der Eintrag bei UGC VZ für Creator?',
    answer:
      'Für Creator ist UGC VZ dauerhaft kostenlos, ohne Bewerbungshürde, mit 0 % Gebühr auf deine Auszahlungen (bei View-Kampagnen im Workspace wie bei Direkt-Anfragen) und ohne Exklusivität.',
  },
];

export default async function UGCCreatorWerdenPage() {
  let medianPrice: number | null = null;
  let p25Price: number | null = null;
  let p75Price: number | null = null;
  try {
    const stats = nicheStats(await loadNicheRows());
    medianPrice = stats.price?.median ?? null;
    p25Price = stats.price?.p25 ?? null;
    p75Price = stats.price?.p75 ?? null;
  } catch {
    medianPrice = null;
  }

  return (
    <div className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-14">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Für Creator', url: 'https://ugc-vz.de/creator' },
          { name: 'UGC Creator werden', url: 'https://ugc-vz.de/creator/ugc-creator-werden' },
        ]}
      />
      <FAQSchema faqItems={faqs} />

      <div className="max-w-5xl mx-auto">
        <Link href="/creator" className="text-sm text-ink-soft hover:text-ink">
          ← UGC VZ für Creator
        </Link>

        <section className="py-10 sm:py-14">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3 py-1.5 text-xs font-semibold text-[#385523]">
            Ohne Mindest-Follower · 0 % Provision · Keine Exklusivität
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">UGC Creator werden in Deutschland</h1>
          <p className="text-lg sm:text-xl text-ink-soft max-w-3xl leading-relaxed mb-8">
            Du brauchst keine große Community, sondern starke Beispielvideos, klares Licht, guten Ton und ein auffindbares Profil. Hier siehst du die konkreten Schritte vom ersten Übungsvideo bis zur ersten bezahlten Brand-Anfrage.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/creator#creator-form" className="inline-flex min-h-[48px] items-center bg-geo-violet hover:bg-[#053673] text-white font-semibold py-3 px-6 rounded-full">
              Kostenloses Profil bei UGC VZ anlegen →
            </Link>
            <Link href="/brands/ugc-kosten-rechner" className="inline-flex min-h-[48px] items-center border border-hairline bg-white hover:border-geo-violet text-ink font-semibold py-3 px-6 rounded-full">
              Marktpreise im Kostenrechner prüfen
            </Link>
          </div>
        </section>

        {/* Echte Orientierungsdaten aus dem Pool */}
        {medianPrice && p25Price && p75Price && (
          <section className="mb-12 rounded-3xl border border-hairline bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ink mb-2">Orientierung aus dem aktuellen UGC-VZ-Verzeichnis</h2>
            <p className="text-sm leading-6 text-ink-soft">
              Unter den aktiven Profilen mit Preisangabe liegt die typische Einstiegsspanne (mittlere 50 %) aktuell bei{' '}
              <strong className="text-ink">{p25Price.toLocaleString('de-DE')} € bis {p75Price.toLocaleString('de-DE')} €</strong> pro Video
              (Median <strong className="text-ink">{medianPrice.toLocaleString('de-DE')} €</strong>). Paid-Ads-Nutzungsrechte und Zusatz-Hooks werden üblicherweise extra kalkuliert.
            </p>
          </section>
        )}

        {/* 4 Schritte */}
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-6">In 4 Schritten zu deinen ersten Aufträgen</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ['1. 3–6 starke Übungs-Videos drehen', 'Schnapp dir Produkte, die du zu Hause hast (Skincare, Kaffee, App, Haushalt). Dreh verschiedene Formate: Problem-Lösung-Ad, Unboxing, Testimonial und Voiceover – jeweils 20–45 Sekunden im 9:16-Format. Kennzeichne Übungsarbeiten transparent als Beispiel.'],
              ['2. Öffentliches Portfolio erstellen', 'Sammle deine besten Clips auf einer öffentlich erreichbaren Seite (z. B. Canva, Notion oder eigene Domain), die Brands ohne Login öffnen können. Zeig direkt deine Nischen, Sprachen und Kontaktmöglichkeiten.'],
              ['3. Saubere Preise & Rechte festlegen', 'Trenne dein Grundhonorar für die Produktion von Zusatzleistungen wie Paid-Ads-Nutzungsrechten (3/6/12 Monate), Rohmaterial und extra Hooks. So wirkst du professionell und verschenkst keine Rechte.'],
              ['4. Sichtbar werden – ohne Plattform-Lock-in', `Trag dich kostenlos bei UGC VZ (${CREATOR_COUNT_LABEL} Profile) ein, pflege Themen, Stadt, Formate und Preisvorstellung und halte dein Profil über /konto aktuell. Brands kontaktieren dich direkt.`],
            ].map(([title, copy]) => (
              <div key={title} className="surface-card rounded-2xl p-6">
                <h3 className="font-bold text-geo-violet mb-2">{title}</h3>
                <p className="text-sm leading-6 text-ink-soft">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weiterfuehrende Ratgeber */}
        <section className="mb-14 grid gap-4 sm:grid-cols-3">
          <Link href="/wissen/ugc-portfolio-so-ueberzeugst-du-brands-in-7-schritten" className="surface-card rounded-2xl p-5 hover:border-geo-violet transition-colors">
            <h3 className="font-bold text-geo-violet">Portfolio in 7 Schritten</h3>
            <p className="mt-1 text-sm text-ink-soft">Welche Clips Brands wirklich sehen wollen.</p>
          </Link>
          <Link href="/wissen/ugc-verdienst-wie-viel-kann-man-wirklich-verdienen" className="surface-card rounded-2xl p-5 hover:border-geo-violet transition-colors">
            <h3 className="font-bold text-geo-violet">Realistischer UGC-Verdienst</h3>
            <p className="mt-1 text-sm text-ink-soft">Umsatz, Aufwand und Kalkulation ehrlich eingeordnet.</p>
          </Link>
          <Link href="/creator/ugc-creator-jobs" className="surface-card rounded-2xl p-5 hover:border-geo-violet transition-colors">
            <h3 className="font-bold text-geo-violet">UGC Creator Jobs &amp; Aufträge</h3>
            <p className="mt-1 text-sm text-ink-soft">Wie Brands Creator finden und was dein Profil enthalten muss.</p>
          </Link>
        </section>

        <section className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-bold text-ink mb-4">Häufige Fragen zum Start als UGC Creator</h2>
          {faqs.map((item) => (
            <details key={item.question} className="surface-card rounded-2xl p-5">
              <summary className="cursor-pointer font-semibold text-ink">{item.question}</summary>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
