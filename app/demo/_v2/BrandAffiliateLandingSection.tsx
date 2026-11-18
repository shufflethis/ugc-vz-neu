'use client';

import {
  ArrowLeft,
  ArrowRight,
  BadgeEuro,
  Calendar,
  Check,
  Coins,
  FileCheck2,
  Layers,
  Lock,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { DemoSection } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  creatorCountLabel: string;
  onNavigate: (section: DemoSection) => void;
  onOpenStrategyModal: (defaultTopic?: string) => void;
}

export default function BrandAffiliateLandingSection({
  creatorCountLabel,
  onNavigate,
  onOpenStrategyModal,
}: Props) {
  return (
    <div className="bg-white px-5 pb-24 pt-8 text-ink sm:px-8 sm:pt-12">
      <article className="mx-auto max-w-4xl space-y-14">
        {/* ZURUECK-NAVIGATION */}
        <div>
          <button
            type="button"
            onClick={() => onNavigate('brands')}
            className="inline-flex items-center gap-2 text-xs font-bold text-ink-soft hover:text-geo-violet"
          >
            <ArrowLeft size={14} /> Zurück zur Übersicht „Für Brands“
          </button>
        </div>

        {/* HERO DER PILLAR-LANDINGPAGE */}
        <header className="space-y-5 border-b border-hairline pb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3.5 py-1 text-xs font-bold text-[#385523]">
            <Layers size={14} /> Leitfaden &amp; Komplett-Lösung für D2C, E-Commerce &amp; SaaS
          </p>
          <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-ink sm:text-5xl">
            Eigenes Creator-Affiliate-Programm &amp; Markenbotschafter-Netzwerk aufbauen:{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
              Skalierbarer Alltags-Content auf Provisionsbasis
            </span>
          </h1>
          <p className="text-base leading-8 text-ink-soft sm:text-lg">
            Einmalige Influencer-Fixgagen werden immer teurer, während bezahlte Werbeanzeigen auf Meta und TikTok unter steigenden Klickpreisen leiden. Die profitabelsten Konsumgüter-, Food-, Beauty- und Software-Marken im deutschsprachigen Raum setzen deshalb auf eine völlig andere Architektur: Sie bauen sich ein eigenes, mehrstufiges <strong>Creator-Affiliate- und Markenbotschafter-Ökosystem</strong> auf, in dem hunderte Micro-Creator ab 500 Followern täglich authentischen Content produzieren – ohne Fixhonorar, rein vergütet über Produkt-Seeding, persönliche Rabattcodes und erfolgsabhängige Umsatzprovisionen.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(
                  'Eigenes Creator-Affiliate- & Markenbotschafter-Programm aufbauen',
                )
              }
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(139,63,202,0.3)] hover:bg-[#7531ae]"
            >
              <Calendar size={16} /> Strategie-Call für euer Partnerprogramm vereinbaren
            </button>
            <a
              href="#stripe-payment-brands"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink hover:border-ink"
            >
              Direkt zur Zahlungs- &amp; Stripe-Abwicklung ↓
            </a>
          </div>
        </header>

        {/* KEYWORD-CLUSTER & SUCHINTENTION (SEO / GEO STRATEGIE-BOX) */}
        <aside className="rounded-3xl border border-geo-violet/25 bg-[#FBF8FE] p-6 sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-geo-violet">
            SEO- &amp; Keyword-Architektur dieser Seite (DACH Suchintention)
          </p>
          <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
            Entscheider in Marketing, E-Commerce und Geschäftsführung suchen selten nach Markennamen fremder Wettbewerber, sondern nach konkreten Lösungsbegriffen. Diese Landingpage bündelt die vier kaufkräftigsten B2B-Suchcluster im deutschsprachigen Raum:
          </p>
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-bold text-ink">1 · Provisions- &amp; Affiliate-Fokus (Transaktional)</p>
              <p className="mt-1 text-ink-soft">
                <em>„Influencer auf Provisionsbasis“</em>, <em>„eigenes Affiliate Programm aufbauen“</em>, <em>„Partnerprogramm für Online-Shop erstellen“</em> (~1.000–2.400 Suchen/Monat im Cluster)
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-bold text-ink">2 · Markenbotschafter &amp; Community</p>
              <p className="mt-1 text-ink-soft">
                <em>„Markenbotschafter Programm aufbauen“</em> (~1.000–1.500/Monat), <em>„Brand Ambassador Programm Deutschland“</em> (~300–600/Monat), <em>„Creator Community aufbauen“</em>
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-bold text-ink">3 · Creator Seeding &amp; Micro-Influencer</p>
              <p className="mt-1 text-ink-soft">
                <em>„Creator Seeding Agentur“</em>, <em>„Micro Influencer Programm skalieren“</em>, <em>„Produkt Seeding E-Commerce“</em>
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <p className="font-bold text-ink">4 · KI-Suche / GEO-Fragen (ChatGPT &amp; Perplexity)</p>
              <p className="mt-1 text-ink-soft">
                <em>„Wie baue ich ein Influencer-Programm ohne Fixgagen auf?“</em>, <em>„Wie rechne ich hunderte Creator steuer- und BaFin-konform über Stripe ab?“</em>
              </p>
            </div>
          </div>
        </aside>

        {/* INHALTSVERZEICHNIS */}
        <nav
          aria-label="Inhaltsverzeichnis"
          className="rounded-3xl border border-hairline bg-surface p-6 text-sm"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Inhalt dieses Leitfadens
          </p>
          <ol className="mt-3 grid gap-2 text-ink-soft sm:grid-cols-2">
            <li>
              <a href="#warum-fixgagen-scheitern" className="hover:text-geo-violet hover:underline">
                1. Warum klassische Influencer-Fixgagen im Mittelstand verbrennen
              </a>
            </li>
            <li>
              <a href="#vier-saeulen-architektur" className="hover:text-geo-violet hover:underline">
                2. Die 4 Bausteine: Seeding, Codes, Produkt-Tausch &amp; 5-Stufen-System
              </a>
            </li>
            <li>
              <a href="#wirtschaftlichkeit-rechner" className="hover:text-geo-violet hover:underline">
                3. Rechenbeispiel: Wareneinsatz vs. Einzelvideo-Einkauf (Shop &amp; SaaS)
              </a>
            </li>
            <li>
              <a href="#technik-ohne-it" className="hover:text-geo-violet hover:underline">
                4. Technische Umsetzung ohne IT-Blockade (Subdomain &amp; Shop-Sync)
              </a>
            </li>
            <li>
              <a href="#stripe-payment-brands" className="hover:text-geo-violet hover:underline">
                5. Zahlungsabwicklung, Gutschriften &amp; Steuern via Stripe Connect
              </a>
            </li>
            <li>
              <a href="#recht-uwg-sparkads" className="hover:text-geo-violet hover:underline">
                6. Deutsches Werberecht (UWG), Kennzeichnung &amp; Spark-Ads-Rechte
              </a>
            </li>
            <li>
              <a href="#kaltstart-vorteil" className="hover:text-geo-violet hover:underline">
                7. Der Kaltstart-Hebel: Sofortiger Zugriff auf {creatorCountLabel} Creator
              </a>
            </li>
            <li>
              <a href="#faq-affiliate-programm" className="hover:text-geo-violet hover:underline">
                8. Häufige Fragen von Marketing- &amp; Finanzteams
              </a>
            </li>
          </ol>
        </nav>

        {/* KAPITEL 1 */}
        <section id="warum-fixgagen-scheitern" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            1. Warum klassische Influencer-Fixgagen und Einzelbuchungen nicht mehr skalieren
          </h2>
          <p className="leading-8 text-ink-soft">
            Wer heute im deutschen Markt auf herkömmlichem Weg Influencer bucht oder einzelne Werbevideos über geschlossene Paket-Plattformen einkauft, stößt schnell an eine mathematische Grenze. Ein einzelnes gesponsertes Posting bei einem mittelgroßen Account kostet schnell zwischen 1.500 € und 5.000 € Fixhonorar – unabhängig davon, ob am Ende drei Bestellungen oder dreihundert Bestellungen im eigenen Online-Shop eingehen. Das gesamte wirtschaftliche Risiko liegt zu hundert Prozent vorab beim Unternehmen.
          </p>
          <p className="leading-8 text-ink-soft">
            Selbst beim Einkauf reiner UGC-Einzelvideos zu Stückpreisen von 120 € bis 250 € entsteht kein organisches Marken-Ökosystem: Du erhältst zwar eine Videodatei für dein Werbekonto, musst aber jeden einzelnen Aufruf anschließend teuer bei Meta oder TikTok einkaufen. Gleichzeitig haben Konsumenten gelernt, glattpolierte Einmal-Werbung innerhalb von Sekundenbruchteilen wegzuswipen. Vertrauen entsteht in sozialen Netzwerken nicht dadurch, dass eine Person ein Produkt einmalig in die Kamera hält, sondern dadurch, dass echte Menschen ein Produkt über Wochen und Monate hinweg ganz selbstverständlich in ihrer eigenen Küche, im Arbeitsalltag, beim Sport oder auf Reisen verwenden.
          </p>
          <p className="leading-8 text-ink-soft">
            Genau hier setzt ein strukturiertes <strong>Creator-Affiliate- und Markenbotschafter-Programm</strong> an. Statt fünf großen Gesichtern hohe Fixsummen zu überweisen, öffnest du deine Marke für hundert, dreihundert oder tausend kleinere Alltags-Creator (oft schon ab 500 bis 5.000 Followern). Diese Micro- und Nano-Creator besitzen in ihrer Nische eine außergewöhnlich hohe Glaubwürdigkeit, verlangen keine starren Agentur-Tagessätze und freuen sich ehrlich über kostenlose Produktpakete, einen eigenen Community-Rabattcode und die faire Chance, sich über echte Verkäufe Schritt für Schritt nach oben zu arbeiten.
          </p>
        </section>

        {/* KAPITEL 2 */}
        <section id="vier-saeulen-architektur" className="scroll-mt-24 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            2. Die 4 Bausteine eines erfolgreichen Creator-Affiliate-Ökosystems
          </h2>
          <p className="leading-8 text-ink-soft">
            Ein klassisches Affiliate-Netzwerk aus den 2010er-Jahren (reine Gutschein-Seiten, Cashback-Portale und Banner-Links) erzeugt keine emotionale Markenbindung und keinen Video-Content. Ein modernes Creator-Partnerprogramm verbindet dagegen vier präzise aufeinander abgestimmte Elemente:
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-surface p-6">
              <span className="font-mono text-xs font-bold text-geo-violet">BAUSTEIN 01</span>
              <h3 className="mt-2 text-lg font-bold text-ink">
                Kuratierter Bewerbungs-Funnel &amp; Creator Seeding
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Creator bewerben sich über eine markeneigene Einstiegsseite (oder werden aus unserem {creatorCountLabel} Verzeichnis eingeladen). Geprüft wird nicht die bloße Followerzahl, sondern der echte Fit zur Marke. Aufgenommene Starter erhalten ein kuratiertes Produktpaket zum Testen im eigenen Alltag – ohne unnatürliches Wort-für-Wort-Werbeskript.
              </p>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-6">
              <span className="font-mono text-xs font-bold text-geo-violet">BAUSTEIN 02</span>
              <h3 className="mt-2 text-lg font-bold text-ink">
                Persönliche Rabattcodes &amp; Dual-Attribution
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Auf TikTok und Instagram Reels klicken Nutzer selten auf externe Links – sie merken sich kurze Codes im Video (z. B. <code className="font-bold text-ink">ANNA10</code>). Unser System kombiniert deshalb individuelle Shop-Gutscheincodes UND trackbare Empfehlungslinks. Egal ob der Kunde sofort klickt oder drei Tage später den Code am Handy eintippt: Der Verkauf wird sauber zugeordnet.
              </p>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-6">
              <span className="font-mono text-xs font-bold text-geo-violet">BAUSTEIN 03</span>
              <h3 className="mt-2 text-lg font-bold text-ink">
                Der Produkt-Guthaben-Kreislauf (Wareneinsatz-Hebel)
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Der wirtschaftlich stärkste Mechanismus für Konsumgüter-Marken: Creator sehen ihr verdientes Provisionsguthaben live im Portal und können wählen, ob sie sich z. B. 150 € in Euro auszahlen lassen – oder mit +20 % Aufschlag in einen 180-€-Warengutschein für deinen Shop umwandeln. Jede eingelöste Produktbestellung liefert gleichzeitig neuen Gesprächsstoff für das nächste Unboxing-Video!
              </p>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-6">
              <span className="font-mono text-xs font-bold text-geo-violet">BAUSTEIN 04</span>
              <h3 className="mt-2 text-lg font-bold text-ink">
                Mehrstufiges Level-System (Stufe 1 bis Stufe 5)
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Menschen lieben sichtbaren Fortschritt. Statt alle Partner gleich zu behandeln, steigen aktive Creator transparent über Monatsumsätze und Content-Konstanz auf – von der Einstiegsstufe bis in den engsten Markenbotschafter-Kreis mit Sonder-Boni, Vorab-Produkten, Paid-Ads-Support und gemeinsamen Produktionstagen.
              </p>
            </div>
          </div>

          {/* Detaillierte 5-Stufen-Uebersicht */}
          <div className="overflow-x-auto rounded-3xl border border-hairline bg-white p-6">
            <h3 className="text-lg font-bold text-ink">
              Beispielhafte Stufen-Architektur (individuell anpassbar auf eure Marge)
            </h3>
            <table className="mt-4 w-full min-w-[680px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                  <th className="pb-3 pr-3 font-semibold">Stufe</th>
                  <th className="pb-3 pr-3 font-semibold">Zielgruppe &amp; Einstieg</th>
                  <th className="pb-3 pr-3 font-semibold">Creator-Vorteile</th>
                  <th className="pb-3 font-semibold">Kostenrisiko für die Marke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 pr-3 font-bold text-ink">Level 1 · Starter</td>
                  <td className="py-3 pr-3 text-ink-soft">Ab ~500 Followern + Marken-Fit</td>
                  <td className="py-3 pr-3 text-ink-soft">Starter-Box, 10-%-Code, Basis-Provision (oft &lt; 500 €/Monat), Produkt-Tausch</td>
                  <td className="py-3 font-semibold text-[#385523]">0 € Fixgage (nur Wareneinsatz + CPS)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-ink">Level 2 · Rising</td>
                  <td className="py-3 pr-3 text-ink-soft">Ab 10 Code-Bestellungen/Monat</td>
                  <td className="py-3 pr-3 text-ink-soft">Höhere Provisionsstufe + unangekündigte Produktneuheiten vorab</td>
                  <td className="py-3 font-semibold text-[#385523]">100 % umsatzgedeckt</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-ink">Level 3 · Core</td>
                  <td className="py-3 pr-3 text-ink-soft">Konstanter Umsatz über 3 Monate</td>
                  <td className="py-3 pr-3 text-ink-soft">Festes monatliches Produkt-Freikontingent + Launch-Staffelboni</td>
                  <td className="py-3 font-semibold text-[#385523]">Planbarer Top-ROAS</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-ink">Level 4 · Ads-Partner</td>
                  <td className="py-3 pr-3 text-ink-soft">Stärkste organische Conversion-Clips</td>
                  <td className="py-3 pr-3 text-ink-soft">Paid-Ads-Verstärkung (Spark Ads / Whitelisting) + Werbebudget-Beteiligung</td>
                  <td className="py-3 font-semibold text-[#385523]">Nur bereits bewiesene Gewinner-Videos</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-ink">Level 5 · Elite</td>
                  <td className="py-3 pr-3 text-ink-soft">Umsatzstärkste Langzeit-Gesichter</td>
                  <td className="py-3 pr-3 text-ink-soft">Eigene Landingpage im Shop, Jahres-Boni, Events, Reisen &amp; Co-Creation</td>
                  <td className="py-3 font-semibold text-[#385523]">Starke Sogwirkung auf das gesamte Netzwerk</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* KAPITEL 3 */}
        <section id="wirtschaftlichkeit-rechner" className="scroll-mt-24 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            3. Konkrete Wirtschaftlichkeit: E-Commerce-Marken vs. Software &amp; SaaS
          </h2>
          <p className="leading-8 text-ink-soft">
            Warum schlägt dieses Modell sowohl klassische Influencer-Kampagnen als auch reine Performance-Agenturen? Ein Blick auf die reale Deckungsbeitragsrechnung zeigt den Unterschied zwischen physischen Produkten und digitalen Abonnements:
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-white p-6">
              <h3 className="text-lg font-bold text-ink">Rechenbeispiel A · D2C / Online-Shop</h3>
              <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
                Angenommen, 100 aktive Micro-Creator posten pro Woche je 3 kurze Alltags-Sequenzen (Storys, TikToks, Reels). Das erzeugt <strong>1.200 authentische Marken-Videos pro Monat</strong>. Würdest du diese 1.200 Clips regulär zu je 150 € einkaufen, lägen deine Produktionskosten bei unbezahlbaren <strong>180.000 € pro Monat</strong>.
              </p>
              <p className="mt-3 text-xs leading-6 text-ink-soft sm:text-sm">
                Im Provisions-Modell zahlst du <strong>0 € Vorab-Honorar</strong>. Erzielt jeder Creator über seinen Code durchschnittlich nur 8 Bestellungen à 50 € Warenkorb, entstehen <strong>40.000 € Monatsumsatz</strong>. Bei 12 % Provision (4.800 €) und 50 % Umtauschquote in eigene Shop-Produkte (bei 25 % Wareneinsatz) liegen deine realen Auszahlungs- und Warenkosten bei rund <strong>3.100 €</strong> – erst <em>nachdem</em> die 40.000 € Umsatz bereits auf deinem Konto eingegangen sind.
              </p>
            </div>

            <div className="rounded-3xl border border-hairline bg-white p-6">
              <h3 className="text-lg font-bold text-ink">Rechenbeispiel B · SaaS, KI-Tools &amp; Apps</h3>
              <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
                Noch extremer wirkt der Hebel bei digitalen Produkten, Buchhaltungs-Apps, Lernplattformen oder B2B-Software: Hier liegt dein physischer Wareneinsatz für einen zusätzlichen Kunden bei nahezu <strong>0 €</strong>.
              </p>
              <p className="mt-3 text-xs leading-6 text-ink-soft sm:text-sm">
                Statt teure Google-Search-Klicks für 8 € bis 25 € pro Klick einzukaufen, gibst du Nischen-Creatorn (z. B. aus Freelancing, Finanzen, Produktivität oder Handwerk) einen kostenlosen Pro-Account plus <strong>20 % bis 30 % wiederkehrende Affiliate-Provision</strong> auf jedes vermittelte Monats- oder Jahresabo. Du teilst ausschließlich bereits realisierten Deckungsbeitrag und baust gleichzeitig organische Video-Tutorials auf YouTube, TikTok und LinkedIn auf.
              </p>
            </div>
          </div>
        </section>

        {/* KAPITEL 4 */}
        <section id="technik-ohne-it" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            4. Technische Umsetzung ohne monatelange IT-Projekte
          </h2>
          <p className="leading-8 text-ink-soft">
            Viele Marketing-Teams schrecken vor einem eigenen Partnerprogramm zurück, weil sie fürchten, ihre interne IT-Abteilung monatelang mit Schnittstellen, Login-Systemen und Gutschein-Logiken zu blockieren. Genau diese Hürde nehmen wir komplett heraus: Wir stellen deiner Marke das gesamte Bewerbungs-, Creator- und Tracking-Portal schlüsselfertig auf einer eigenen Subdomain bereit (zum Beispiel unter <code className="rounded bg-surface px-1.5 py-0.5 text-ink">creator.deinemarke.de</code> oder <code className="rounded bg-surface px-1.5 py-0.5 text-ink">partner.deinemarke.de</code>) – vollständig in deinem Marken-Design.
          </p>
          <p className="leading-8 text-ink-soft">
            Die Anbindung an gängige Shopsysteme wie <strong>Shopify, Shopware 6, WooCommerce</strong> oder eigene Stripe-/SaaS-Checkouts erfolgt über leichtgewichtige Standard-Webhooks für Rabattcodes und Bestell-Bestätigungen (inklusive automatischer Berücksichtigung von Retouren und Stornos nach Ablauf der Widerrufsfrist, damit niemals Provisionen auf zurückgeschickte Bestellungen ausgezahlt werden). Auf Wunsch ergänzen wir das System sogar um moderne KI-Briefing-Assistenten und offene Schnittstellen (MCP / ChatGPT-Anbindung).
          </p>
        </section>

        {/* KAPITEL 5: STRIPE CONNECT & PAYMENT ERKLÄRT FUER BRANDS & CREATOR */}
        <section
          id="stripe-payment-brands"
          className="scroll-mt-24 space-y-6 rounded-[36px] bg-void p-7 text-white sm:p-10"
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-geo-green">
              <BadgeEuro size={14} /> Zahlungsabwicklung, Steuern &amp; Compliance in Deutschland
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              5. Wie Zahlungen, Provisions-Ausschüttungen und Belege sauber über Stripe Connect laufen
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
              Sobald ein Unternehmen in Deutschland nicht mehr fünf, sondern hundertfünfzig Creator im Monat vergütet, tauchen sofort zwei kritische Fragen in der Buchhaltung auf: <em>„Wer prüft hundertfünfzig Einzelrechnungen auf korrekte Umsatzsteuer?“</em> und <em>„Wie zahlen wir Gelder rechtssicher nach PSD2 / Zahlungsdiensteaufsichtsgesetz (ZAG) aus, ohne selbst Bank oder Treuhänder zu spielen?“</em> So lösen wir den gesamten Prozess in Euro (€):
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="font-mono text-xs font-bold text-geo-green">SCHRITT 1 · UNTERNEHMEN</p>
              <h3 className="mt-2 text-base font-bold">1 Sammelrechnung &amp; 5-€-SEPA-Deckel</h3>
              <p className="mt-2 text-xs leading-6 text-white/75">
                Deine Buchhaltung muss nicht 150 einzelne Creator als Kreditoren anlegen. Du begleichst freigegebene Provisions- oder Kampagnenbudgets gesammelt per <strong>SEPA-Banküberweisung über Stripe</strong> (Gebühr bei Stripe Bank Transfer auf wenige Euro gedeckelt, statt hoher Kreditkarten-Prozente!) oder per B2B-Rechnung mit ausgewiesenen 19 % USt.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="font-mono text-xs font-bold text-[#62B4FF]">SCHRITT 2 · REGULIERUNG</p>
              <h3 className="mt-2 text-base font-bold">Stripe Connect (Separate Charges &amp; Transfers)</h3>
              <p className="mt-2 text-xs leading-6 text-white/75">
                Die Mittelverteilung läuft über die lizenzierte Zahlungsinfrastruktur von <strong>Stripe Connect</strong>. Jeder Creator durchläuft einmalig in 2 Minuten das offizielle <em>Stripe Connect Express</em> Onboarding (Identitätsprüfung/KYC, IBAN-Verifizierung &amp; Steuer-ID/DAC7 direkt bei Stripe). Weder du noch wir müssen Ausweiskopien speichern.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <p className="font-mono text-xs font-bold text-geo-violet-soft">SCHRITT 3 · CREATOR &amp; BELEG</p>
              <h3 className="mt-2 text-base font-bold">SEPA-Auszahlung + Auto-Gutschrift (§ 19 / 19 %)</h3>
              <p className="mt-2 text-xs leading-6 text-white/75">
                Entscheidet sich der Creator gegen einen Warengutschein und für die Euro-Auszahlung (z. B. ab 25 € Mindestbetrag), überweist Stripe per SEPA direkt aufs Girokonto. Das System erzeugt automatisch eine steuerlich korrekte <strong>PDF-Gutschrift</strong> – je nach hinterlegtem Creator-Status ohne Umsatzsteuer (§ 19 UStG Kleinunternehmer) oder inklusive 19 % USt.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-geo-green/30 bg-geo-green/10 p-4 text-xs leading-6 text-white/90">
            <strong className="text-geo-green">Wichtig für den Finanzvorstand / Steuerberater:</strong> Bei einem reinen Produkt-Tausch (Creator wandelt Provision in einen 100-%-Produktgutschein deines Shops um) fließt überhaupt kein Bankgeld über Zahlungsdienstleister – das Portal generiert lediglich einen einmaligen Personal-Gutschein im Shopsystem und dokumentiert den Sachwert sauber für beide Seiten.
          </div>
        </section>

        {/* KAPITEL 6 */}
        <section id="recht-uwg-sparkads" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            6. Rechtlicher Rahmen in Deutschland: Werbekennzeichnung &amp; Spark-Ads-Rechte
          </h2>
          <p className="leading-8 text-ink-soft">
            Gerade bei großen Micro-Creator-Programmen passieren ohne feste Leitplanken schnell Abmahnfehler nach dem deutschen Gesetz gegen den unlauteren Wettbewerb (UWG). Sobald ein Creator kostenlose Produkte zum Testen erhält (geldwerter Vorteil) oder einen Rabattcode mit Umsatzbeteiligung teilt, handelt es sich rechtlich um kommerzielle Kommunikation. In unserem Onboarding- und Briefing-Flow wird deshalb jeder teilnehmende Creator verbindlich auf die klare Kennzeichnung (zum Beispiel <em>„Anzeige“</em> oder <em>„Werbung“</em> zu Beginn der Beschreibung bzw. über das plattformeigene Label) verpflichtet.
          </p>
          <p className="leading-8 text-ink-soft">
            Ebenso sauber regeln die Teilnahmebedingungen im Portal das Thema <strong>Zweitverwertung und Paid-Ads-Whitelisting</strong>: Wenn eines der tausend organischen Alltags-Videos auf TikTok oder Instagram plötzlich viral geht und eine außergewöhnliche Kaufquote erzielt, kann sich dein Performance-Marketing-Team mit 1 Klick den Freigabe-Code (Spark-Ads-Code / Partnership-Ad-Freigabe) direkt im Portal vom Creator anfordern und genau dieses authentische Video mit Werbebudget skalieren.
          </p>
        </section>

        {/* KAPITEL 7 */}
        <section id="kaltstart-vorteil" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            7. Warum Software allein nicht reicht: Unser Kaltstart über {creatorCountLabel} aktive Creator
          </h2>
          <p className="leading-8 text-ink-soft">
            Der häufigste Grund, warum selbstgebaute Partnerprogramme oder teure US-Affiliate-Tools in den ersten sechs Monaten scheitern, ist das Henne-Ei-Problem: Das technische Portal ist online, aber kein Creator weiß davon. Genau hier liegt der entscheidende Unterschied einer Umsetzung gemeinsam mit <strong>UGC VZ</strong>.
          </p>
          <p className="leading-8 text-ink-soft">
            Auf unserer Plattform sind bereits <strong>{creatorCountLabel} deutschsprachige UGC Creator</strong> mit echten Arbeitsproben, Nischen-Angaben und direkter Erreichbarkeit registriert – und jede Woche kommen Dutzende neue Profile organisch hinzu. Sobald dein Markenbotschafter- und Affiliate-Programm startklar ist, erscheint es direkt im Login-Bereich unserer Creator, wo passende Talente sich mit einem Klick auf deine Partnerschaft bewerben und sofort die ersten Videos produzieren können.
          </p>

          {/* SYSTEMVERGLEICH: KLASSISCHE AGENTUR VS AFFILIATE-NETZWERK VS EIGENES CREATOR-PORTAL */}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-hairline bg-surface p-6">
            <h3 className="text-lg font-bold text-ink">
              Systemvergleich: Warum klassische Affiliate-Netzwerke (Awin &amp; Co.) keine Creator aktivieren
            </h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
              Viele E-Commerce-Leiter fragen im ersten Gespräch: <em>„Wir sind doch schon bei einem klassischen Affiliate-Netzwerk gelistet – warum posten darüber keine TikTok- oder Instagram-Creator für uns?“</em> Die Antwort liegt in der völlig unterschiedlichen Zielgruppe und Nutzerführung: Klassische Netzwerke wurden für Gutschein-Webseiten, Preisvergleiche und Cashback-Browser-Extensions gebaut – nicht für junge Video-Creator am Smartphone.
            </p>
            <table className="mt-4 w-full min-w-[680px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                  <th className="pb-3 pr-3 font-semibold">Kriterium</th>
                  <th className="pb-3 pr-3 font-semibold">Klassische Influencer-Agentur</th>
                  <th className="pb-3 pr-3 font-semibold">Traditionelles Affiliate-Netzwerk</th>
                  <th className="pb-3 font-extrabold text-geo-violet">Eigenes Creator-Portal (UGC VZ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Haupt-Partner</td>
                  <td className="py-3 pr-3 text-ink-soft">Wenige teure Macro-Influencer</td>
                  <td className="py-3 pr-3 text-ink-soft">Gutschein-Seiten &amp; Cashback-Portale</td>
                  <td className="py-3 font-bold text-[#385523]">Echte Video- &amp; Alltags-Creator (ab 500 Followern)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Entstehender Content</td>
                  <td className="py-3 pr-3 text-ink-soft">1–2 abgestimmte Werbe-Postings</td>
                  <td className="py-3 pr-3 text-ink-soft">Keiner (reiner Link-/Code-Abgriff am Checkout)</td>
                  <td className="py-3 font-bold text-[#385523]">Hunderte organische TikToks, Reels &amp; Storys</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Produkt-Guthaben-Tausch</td>
                  <td className="py-3 pr-3 text-ink-soft">Nein (reine Honorar-Rechnung)</td>
                  <td className="py-3 pr-3 text-ink-soft">Nein (nur Banküberweisung + Netzwerkgebühr)</td>
                  <td className="py-3 font-bold text-[#385523]">Ja (Provision mit Bonus gegen Ware tauschen)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Beziehung zur Marke</td>
                  <td className="py-3 pr-3 text-ink-soft">Über Agentur-Projektmanager gefiltert</td>
                  <td className="py-3 pr-3 text-ink-soft">Anonymes Publisher-Verzeichnis</td>
                  <td className="py-3 font-bold text-[#385523]">100 % eigenes Marken-Ökosystem &amp; Community</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4-WOCHEN ROLLOUT ROADMAP */}
          <div className="mt-6 rounded-3xl border border-hairline bg-white p-6">
            <h3 className="text-lg font-bold text-ink">
              In 4 Wochen live: So läuft der gemeinsame Aufbau Schritt für Schritt ab
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface p-4 text-xs leading-6 text-ink-soft">
                <p className="font-bold text-ink">Woche 1 · Strategie, Margen-Check &amp; Stufen-Design</p>
                <p className="mt-1">
                  Gemeinsame Festlegung der Rabattcode-Höhe (z. B. 10 %), der Provisionsstaffeln von Level 1 bis Level 5 sowie der optimalen Starter-Produktbox auf Basis eures realen Wareneinsatzes.
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4 text-xs leading-6 text-ink-soft">
                <p className="font-bold text-ink">Woche 2 · Subdomain-Portal &amp; Shop-/Stripe-Anbindung</p>
                <p className="mt-1">
                  Bereitstellung eures gebrandeten Bewerbungs- und Creator-Dashboards inklusive automatischer Code-Generierung, Retouren-Sperrfrist und Stripe-Connect-Auszahlungsstrecke.
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4 text-xs leading-6 text-ink-soft">
                <p className="font-bold text-ink">Woche 3 · Kaltstart-Einladung an {creatorCountLabel} Creator</p>
                <p className="mt-1">
                  Freischaltung eures Partnerprogramms direkt im Login-Bereich unserer vorqualifizierten DACH-Creator sowie Versand der ersten 30 bis 50 Seeding-Pakete an handverlesene Profile.
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-4 text-xs leading-6 text-ink-soft">
                <p className="font-bold text-ink">Woche 4 · Erste Welle Alltags-Videos &amp; Spark-Ads-Auswahl</p>
                <p className="mt-1">
                  Auswertung der ersten veröffentlichten Reels und TikToks, Messung der Code-Einlösungen, automatische Stufen-Aufstiege und Identifikation der besten Clips für euer Performance-Ad-Konto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KAPITEL 8: GROSSE SEO/GEO FAQ */}
        <section id="faq-affiliate-programm" className="scroll-mt-24 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            8. Häufig gestellte Fragen zum Aufbau eines Creator-Affiliate-Programms
          </h2>
          <div className="space-y-3">
            {[
              [
                'Ab welcher Unternehmensgröße lohnt sich ein eigenes Creator-Affiliate-Netzwerk?',
                'Sobald du ein wiederkehrend kaufbares Produkt (E-Commerce ab ca. 35 € Warenkorb und gesunder Handelsmarge) oder ein digitales Abo-Produkt (SaaS / App) anbietest und bereit bist, statt einmaliger Werbeschüsse ein dauerhaftes System über mindestens 3 bis 6 Monate aufzubauen.',
              ],
              [
                'Machen gute Creator überhaupt ohne feste Vorab-Gage mit?',
                'Reine Werbe-Schauspieler für Studio-Ads verlangen Fixpreise – echte Marken-Fans und wachsende Micro-Creator (500 bis 15.000 Follower) lieben dagegen faire Partnerprogramme, wenn drei Dinge stimmen: ein starkes Produkt zum kostenlosen Testen, ein attraktiver Code für ihre Zuschauer und eine transparente Aufstiegsperspektive bis hin zu festen Monats-Paketen und Paid-Ads-Boni.',
              ],
              [
                'Wie verhindern wir, dass Rabattcodes auf Gutschein-Portalen landen?',
                'Jeder Code ist personalisiert an einen konkreten Creator gebunden, kann im Shop auf Neukunden oder bestimmte Warenkörbe begrenzt werden und lässt sich bei Missbrauch auf externen Deal-Seiten mit einem einzigen Klick deaktivieren und neu vergeben.',
              ],
              [
                'Was passiert bei Retouren oder Widerrufen im Online-Shop?',
                'Provisionen werden im Portal zunächst als „vorgemerkt“ verbucht und erst nach Ablauf deiner individuellen Rückgabefrist (z. B. 14 oder 30 Tage) automatisch zur Einlösung gegen Produkte oder zur Stripe-SEPA-Auszahlung freigegeben.',
              ],
              [
                'Können wir TKP-Kampagnen (Pay-per-View) und das Provisions-Programm kombinieren?',
                'Ja – genau diese Kombination funktioniert bei Produkt-Launches extrem stark: Du startest mit einer zeitlich begrenzten TKP-Kampagne (z. B. 3,00 € pro 1.000 Views) für sofortige Aufmerksamkeit und lädst die besten Creator daraus nahtlos in dein dauerhaftes Provisions-Programm ein.',
              ],
            ].map(([q, a], idx) => (
              <details
                key={q}
                open={idx === 0}
                className="group rounded-2xl border border-hairline bg-surface/60 px-5 open:bg-white sm:px-6"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden sm:text-base">
                  <span>{q}</span>
                  <span className="text-xl font-normal text-ink-soft transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ABSCHLUSS-CTA -> STRATEGIE-CALL */}
        <section className="rounded-[36px] bg-void p-8 text-center text-white sm:p-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-geo-green">
            Nächster Schritt für eure Marke
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">
            Lass uns prüfen, wie euer eigenes Creator-Affiliate-Netzwerk aussieht.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/70">
            In 15 Minuten gehen wir eure Produktmarge, die Shop-/SaaS-Anbindung und das passende Stufenmodell durch – inklusive Kaltstart über unsere {creatorCountLabel} Creator.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                onOpenStrategyModal(
                  'Strategie-Call: Eigenes Creator-Affiliate- & Markenbotschafter-Programm',
                )
              }
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-geo-green px-8 text-sm font-extrabold text-void transition-transform hover:-translate-y-0.5"
            >
              <Calendar size={17} /> Unverbindlichen Strategie-Call buchen <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
}
