'use client';

import {
  ArrowLeft,
  ArrowRight,
  BadgeEuro,
  Check,
  Coins,
  FileCheck2,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import type { DemoSection } from './data';

const GRADIENT =
  'linear-gradient(152deg, #0396F8 0%, #1F6FF4 25%, #3F58F2 50%, #653AED 75%, #9131EF 100%)';

interface Props {
  creatorCountLabel: string;
  onNavigate: (section: DemoSection) => void;
}

export default function CreatorTkpLandingSection({
  creatorCountLabel,
  onNavigate,
}: Props) {
  return (
    <div className="bg-white px-5 pb-24 pt-8 text-ink sm:px-8 sm:pt-12">
      <article className="mx-auto max-w-4xl space-y-14">
        {/* ZURUECK-LINKS FUER BEIDE ZIELGRUPPEN */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-ink-soft">
          <button
            type="button"
            onClick={() => onNavigate('creator')}
            className="inline-flex items-center gap-1.5 hover:text-geo-violet"
          >
            <ArrowLeft size={14} /> Für Creator
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onNavigate('brands')}
            className="inline-flex items-center gap-1.5 hover:text-geo-violet"
          >
            Für Unternehmen (TKP-Kampagnen)
          </button>
        </div>

        {/* HERO */}
        <header className="space-y-5 border-b border-hairline pb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dce9d1] bg-[#edf5e5] px-3.5 py-1 text-xs font-bold text-[#385523]">
            <Coins size={14} /> Komplett-Guide · TKP-Kampagnen, Clipping &amp; Stripe-Auszahlungen
          </p>
          <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.045em] text-ink sm:text-5xl">
            Mit Kurzvideos &amp; Views Geld verdienen (Pro 1.000 Aufrufe):{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>
              So funktionieren TKP-Kampagnen &amp; Stripe-Payments
            </span>
          </h1>
          <p className="text-base leading-8 text-ink-soft sm:text-lg">
            Tausende talentierte Creator in Deutschland, Österreich und der Schweiz scheitern an den hohen Hürden der plattformeigenen Monetarisierungsprogramme: Auf TikTok braucht man mindestens 10.000 Follower und Videos über einer Minute Länge, bei YouTube Shorts bleiben oft nur wenige Cent pro tausend Aufrufe übrig. Direkte <strong>Marken-TKP-Kampagnen (Pay-per-1.000-Views)</strong> drehen dieses Prinzip um: Unternehmen hinterlegen ein festes Euro-Kampagnenbudget, Creator picken sich passende Briefings in ihrem Login-Bereich – und verdienen schon ab null Followern und mit knackigen 15- bis 45-Sekunden-Clips feste Sätze pro 1.000 echte Aufrufe, sauber ausgezahlt aufs Girokonto via Stripe Connect.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('konto')}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-geo-violet px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(139,63,202,0.3)] hover:bg-[#7531ae]"
            >
              Als Creator offene Kampagnen ansehen <ArrowRight size={16} />
            </button>
            <a
              href="#stripe-creator-brand-flow"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink hover:border-ink"
            >
              Direkt zum Stripe-Payment &amp; Steuer-Ablauf ↓
            </a>
          </div>
        </header>

        {/* INHALTSVERZEICHNIS */}
        <nav
          aria-label="Inhaltsverzeichnis"
          className="rounded-3xl border border-hairline bg-surface p-6 text-sm"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Alle Themen auf einen Blick
          </p>
          <ol className="mt-3 grid gap-2 text-ink-soft sm:grid-cols-2">
            <li>
              <a href="#tiktok-rewards-vs-tkp" className="hover:text-geo-violet hover:underline">
                1. TikTok Creator Rewards vs. direkte Marken-TKP-Kampagnen
              </a>
            </li>
            <li>
              <a href="#produktion-vs-clipping" className="hover:text-geo-violet hover:underline">
                2. Zwei Formate: Eigene UGC-Kurzvideos vs. seriöses Clipping
              </a>
            </li>
            <li>
              <a href="#anti-bot-schutz" className="hover:text-geo-violet hover:underline">
                3. Schutz vor Fake-Views: Wie unsere Prüfung ehrliche Arbeit schützt
              </a>
            </li>
            <li>
              <a href="#vorteil-fuer-brands" className="hover:text-geo-violet hover:underline">
                4. Für Marken &amp; Agenturen: Planbare Sichtbarkeit mit Budget-Deckel
              </a>
            </li>
            <li>
              <a href="#stripe-creator-brand-flow" className="hover:text-geo-violet hover:underline">
                5. Das Payment im Detail: Stripe Connect für Creator &amp; Unternehmen
              </a>
            </li>
            <li>
              <a href="#steuern-deutschland-gutschrift" className="hover:text-geo-violet hover:underline">
                6. Steuern, Kleinunternehmer (§ 19 UStG) &amp; automatische Gutschriften
              </a>
            </li>
            <li>
              <a href="#faq-tkp-payment" className="hover:text-geo-violet hover:underline">
                7. Häufige Fragen zu Views, Mindestauszahlung &amp; Stripe
              </a>
            </li>
          </ol>
        </nav>

        {/* KAPITEL 1 */}
        <section id="tiktok-rewards-vs-tkp" className="scroll-mt-24 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            1. Warum das normale TikTok-Programm kleine Creator ausbremst – und was Marken-TKP anders macht
          </h2>
          <p className="leading-8 text-ink-soft">
            Wer in Deutschland nach <em>„Geld verdienen pro 1.000 Aufrufe“</em> sucht, landet fast immer zuerst beim offiziellen <strong>TikTok Creator Rewards Program</strong> oder der YouTube-Shorts-Monetarisierung. In der Realität erleben 95 Prozent aller aktiven Content-Ersteller dort jedoch eine kalte Dusche: Erstens verlangt TikTok mindestens <strong>10.000 eigene Follower</strong> und 100.000 Aufrufe in den letzten dreißig Tagen, bevor überhaupt der erste Cent gezahlt wird. Zweitens werden ausschließlich Videos vergütet, die <strong>länger als 60 Sekunden</strong> sind – genau jene knackigen 15- bis 35-Sekunden-Videos, die im Alltag am besten funktionieren, gehen komplett leer aus. Und drittens schwankt die Ausschüttung stark und liegt im Unterhaltungsbereich oft nur im niedrigen Cent-Bereich.
          </p>
          <p className="leading-8 text-ink-soft">
            Bei einer <strong>direkten Marken-TKP-Kampagne auf UGC VZ</strong> bezahlt dich nicht der Werbe-Topf eines sozialen Netzwerks, sondern ein konkretes Unternehmen, das für sein Produkt, seine App oder sein Event organische Aufmerksamkeit sucht. Weil der Algorithmus von TikTok, Instagram Reels und YouTube Shorts heute nach Interessen statt nach Followerzahl ausspielt, kann auch ein Account mit 300 Followern problemlos 25.000 oder 80.000 organische Aufrufe mit einem guten Video erzielen. Deshalb gibt es bei unseren TKP-Kampagnen in der Regel <strong>keine künstliche 10.000-Follower-Schranke</strong>, sondern einen glasklaren, vorab garantierten Satz – zum Beispiel <strong>2,00 € bis 5,00 € pro 1.000 verifizierte Views</strong>.
          </p>

          <div className="overflow-x-auto rounded-3xl border border-hairline bg-white p-6">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                  <th className="pb-3 pr-3 font-semibold">Merkmal</th>
                  <th className="pb-3 pr-3 font-semibold">TikTok Creator Rewards</th>
                  <th className="pb-3 pr-3 font-semibold">YouTube Shorts Ads-Share</th>
                  <th className="pb-3 font-extrabold text-geo-violet">UGC VZ · Marken-TKP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Mindest-Follower</td>
                  <td className="py-3 pr-3 text-ink-soft">10.000 Follower Pflicht</td>
                  <td className="py-3 pr-3 text-ink-soft">1.000 Abonnenten + 10 Mio. Views</td>
                  <td className="py-3 font-bold text-[#385523]">Ab 0 Followern (je nach Briefing)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Videolänge</td>
                  <td className="py-3 pr-3 text-ink-soft">Zwingend über 60 Sekunden</td>
                  <td className="py-3 pr-3 text-ink-soft">Bis 60 Sek.</td>
                  <td className="py-3 font-bold text-[#385523]">Frei (ideal 15–45 Sek. Kurzvideos)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Erlaubte Kanäle</td>
                  <td className="py-3 pr-3 text-ink-soft">Nur TikTok</td>
                  <td className="py-3 pr-3 text-ink-soft">Nur YouTube</td>
                  <td className="py-3 font-bold text-[#385523]">TikTok, Instagram Reels &amp; YT Shorts</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Typische Vergütung / 1k Views</td>
                  <td className="py-3 pr-3 text-ink-soft">Stark schwankend (~0,30–0,90 €)</td>
                  <td className="py-3 pr-3 text-ink-soft">Oft ~0,03–0,25 €</td>
                  <td className="py-3 font-bold text-[#385523]">Fester Satz (z. B. 2,00–5,00 € / 1k)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* KAPITEL 2 */}
        <section id="produktion-vs-clipping" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            2. Eigene UGC-Kurzvideos vs. Clipping: Beide Wege im Creator-Login
          </h2>
          <p className="leading-8 text-ink-soft">
            In deinem Creator-Konto findest du je nach Auftraggeber zwei unterschiedliche Kampagnen-Arten, die du ganz nach deinem eigenen Stil auswählen kannst:
          </p>
          <p className="leading-8 text-ink-soft">
            <strong>Weg A · Eigene Kurzvideo-Produktion (Original-UGC):</strong> Du drehst mit deinem Smartphone ein kurzes, ungestelltes Video nach den Eckpunkten des Marken-Briefings – zum Beispiel einen ehrlichen Alltagstest eines Getränks, ein Outfit-Video, ein App-Tutorial am Bildschirm oder eine persönliche Erfahrungsgeschichte. Original-Videos erzielen die höchsten TKP-Raten (häufig 3,00 € bis 5,00 € pro 1.000 Views) und führen oft zusätzlich zu Folgeaufträgen oder dauerhaften Provisions-Partnerschaften mit der Marke.
          </p>
          <p className="leading-8 text-ink-soft">
            <strong>Weg B · Kuratiertes Clipping &amp; Event-Highlights:</strong> Bei Podcast-, Sport-, Show- oder Gründer-Formaten stellt der Auftraggeber offiziell freigegebenes Rohmaterial bereit. Deine Aufgabe besteht darin, die spannendsten Momente herauszuschneiden, dynamische Untertitel für das 9:16-Hochformat zu setzen und durch einen eigenen Einstieg, Kommentar oder Split-Screen echten Mehrwert hinzuzufügen (damit soziale Netzwerke den Clip als originären Beitrag werten und organisch ausspielen).
          </p>

          {/* PRAXIS-BEISPIEL & HOOK-BAUKASTEN FUER HOHE VIEWS */}
          <div className="mt-6 rounded-3xl border border-hairline bg-surface p-6">
            <h3 className="text-lg font-bold text-ink">
              Praxis-Rechnung: Wie auch ein kleiner Kanal in 14 Tagen seine ersten 120 € verdient
            </h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
              Viele Einsteiger unterschätzen, wie schnell sich konsistente Kurzvideos summieren, wenn nicht die Followerzahl, sondern die tatsächliche Wiedergabezeit über die Ausspielung im Feed entscheidet. Ein realistisches Beispiel aus dem Alltag: Du wählst in deinem Creator-Login zwei offene Kampagnen mit einem Vergütungssatz von <strong>3,50 € pro 1.000 Aufrufe</strong> aus und veröffentlichst über zwei Wochen hinweg insgesamt sechs kurze, ehrliche 22-Sekunden-Clips auf TikTok und parallel als Instagram Reel.
            </p>
            <p className="mt-2 text-xs leading-6 text-ink-soft sm:text-sm">
              Drei dieser Videos bleiben bei normalen 1.800 Aufrufen stehen, zwei erreichen solide 6.500 Aufrufe – und ein einziger getroffener Alltags-Hook wird vom Algorithmus aufgegriffen und sammelt 18.000 organische Views. Zusammen ergeben das <strong>36.400 verifizierte Aufrufe</strong>, was bei 3,50 € TKP bereits <strong>127,40 € direkte Vergütung</strong> bedeutet (zuzüglich eventueller Starter-Boni für dein erstes Video). Dein gesamter Zeitaufwand am Smartphone lag bei rund drei Stunden – ohne Preisverhandlung, ohne Akquise-Mails und ohne dass du vorher zehntausend Abonnenten aufbauen musstest.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 text-xs">
                <p className="font-bold text-geo-violet">Sekunde 0–3 · Visueller Bruch</p>
                <p className="mt-1 text-ink-soft">
                  Starte mitten in der Handlung (z. B. Paket öffnen, Eiswürfel ins Glas, Bildschirm-Ergebnis zeigen) statt mit einer langsamen Begrüßung wie „Hallo Leute“.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-xs">
                <p className="font-bold text-[#1F6FF4]">Sekunde 3–15 · Echtes Problem lösen</p>
                <p className="mt-1 text-ink-soft">
                  Sprich in deiner normalen Alltagssprache über genau einen konkreten Nutzen. Natürliches Fensterlicht und klarer Handy-Ton schlagen jedes künstliche Studio-Licht.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-xs">
                <p className="font-bold text-[#385523]">Sekunde 15–25 · Offene Frage</p>
                <p className="mt-1 text-ink-soft">
                  Beende den Clip mit einer ehrlichen Meinungsfrage an die Zuschauer – echte Kommentare steigern die Watchtime und verdoppeln oft die organische Reichweite.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KAPITEL 3 */}
        <section id="anti-bot-schutz" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            3. Fair-Play: Wie Views geprüft werden, bevor Geld fließt
          </h2>
          <p className="leading-8 text-ink-soft">
            Wo pro 1.000 Aufrufe echtes Geld gezahlt wird, taucht schnell die berechtigte Sorge von Marken und ehrlichen Creatorn auf: <em>„Was passiert, wenn jemand für 15 Euro künstliche Klick-Pakete kauft oder Videos per Bot aktualisiert, um den Kampagnen-Topf leerzuräumen?“</em> Genau deshalb durchläuft jeder eingereichte Video-Link auf UGC VZ eine mehrstufige Prüfung, bevor ein einziger Euro aus dem Kampagnenbudget reserviert wird:
          </p>
          <ul className="space-y-2.5 rounded-3xl border border-hairline bg-surface p-6 text-sm leading-6 text-ink-soft">
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#527b33]" />
              <span>
                <strong className="text-ink">Kanal-Verknüpfung:</strong> Eingereicht werden können nur Videos von Kanälen, die du in deinem Konto als deine eigenen bestätigt hast – fremde virale Videos lassen sich nicht beanspruchen.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#527b33]" />
              <span>
                <strong className="text-ink">Briefing- &amp; Kennzeichnungs-Check:</strong> Jede Einreichung wird gegen das Briefing geprüft (automatische Vorprüfung plus manuelle Stichproben): Behandelt das Video das gebuchte Thema, und ist es als Werbung / Anzeige gekennzeichnet?
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-geo-violet" />
              <span>
                <strong className="text-ink">View-Verlauf &amp; Haltefrist:</strong> Views werden über das Abrechnungsfenster mehrfach gemessen. Auffällige Sprünge ohne passende Likes, Kommentare und Shares werden manuell geprüft und im Zweifel nicht vergütet; ausgezahlt wird erst nach Ablauf der Haltefrist. Eine lückenlose Erkennung kann kein System versprechen – deshalb gibt es zusätzlich den Deckel pro Video.
              </span>
            </li>
          </ul>
        </section>

        {/* KAPITEL 4 */}
        <section id="vorteil-fuer-brands" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            4. Für Unternehmen, Mediaagenturen &amp; aufstrebende Markenbotschafter
          </h2>
          <p className="leading-8 text-ink-soft">
            Aus Sicht einer Marke oder Mediaagentur löst das TKP-Modell das größte Planungsproblem im Creator-Marketing: Statt ungewisse Einzelhonorare zu verhandeln, definierst du exakt zwei Zahlen – dein <strong>Maximalbudget</strong> (zum Beispiel 2.500 € oder 10.000 €) und deinen <strong>Tausender-Kontakt-Preis</strong> (zum Beispiel 3,50 € pro 1.000 Aufrufe) sowie eine Obergrenze pro einzelnem Video (damit nicht ein einziger Ausreißer den gesamten Topf allein aufbraucht, sondern eine breite Streuung über viele Creator entsteht). Du zahlst niemals mehr als dein hinterlegtes Budget und erhältst am Ende eine lückenlose Auswertung aller veröffentlichten Links und erreichten Aufrufe.
          </p>
          <p className="leading-8 text-ink-soft">
            Gleichzeitig entsteht ein enormer Karriere-Hebel für engagierte Creator: Wer in einer offenen TKP-Kampagne mit einem überzeugenden Alltags-Clip heraussticht, bleibt für das Marketing-Team der Marke sofort sichtbar. Viele Unternehmen nutzen TKP-Aktionen gezielt als offenes Casting, um die besten Gesichter anschließend für höher dotierte Einzelproduktionen, Paid-Ads-Whitelisting oder ihr dauerhaftes <strong>Markenbotschafter- und Affiliate-Programm</strong> einzuladen. Aus einem ersten 20-Sekunden-Video ohne Mindest-Followerzahl entwickelt sich so regelmäßig eine mehrjährige Partnerschaft mit festen Produktpaketen, eigenem Rabattcode und planbaren monatlichen Zusatzeinnahmen.
          </p>
          <p className="leading-8 text-ink-soft">
            Auch für Creator-Managements und Talent-Agenturen bietet diese Struktur einen klaren Mehrwert: Betreute Talente können Leerlaufzeiten zwischen klassischen Kooperationen sinnvoll füllen, neue Produktkategorien testen und über verifizierte Reichweiten-Kennzahlen handfeste Referenzen für künftige Marken-Verhandlungen sammeln – während die gesamte technische Messung und Belegerstellung im Hintergrund vollautomatisch mitläuft.
          </p>
        </section>

        {/* KAPITEL 5: STRIPE PAYMENT IM DETAIL ERKLÄRT FUER CREATOR UND BRANDS */}
        <section
          id="stripe-creator-brand-flow"
          className="scroll-mt-24 space-y-6 rounded-[36px] bg-void p-7 text-white sm:p-10"
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-bold text-geo-green">
              <BadgeEuro size={14} /> Euro-Zahlungsabwicklung über Stripe Connect erklärt
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              5. Wie Einzahlung und Auszahlung sicher über Stripe funktionieren (für Creator &amp; Brands)
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
              Kein Krypto, keine dubiosen Punkte-Währungen und keine wochenlangen Überweisungs-Ausreden: Unsere gesamte Geldabwicklung setzt auf <strong>Stripe Connect</strong> – den europäischen Industriestandard für Marktplätze und Creator-Plattformen, reguliert für den gesamten SEPA-Raum. Hier siehst du transparent, wie der Ablauf für beide Seiten funktioniert:
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* FUER CREATOR */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-green">
                Für Creator · So kommt dein Geld aufs Konto
              </p>
              <ol className="mt-4 space-y-3.5 text-xs leading-6 text-white/85 sm:text-sm">
                <li>
                  <strong className="text-white">1. Einmalig in 2 Minuten verbinden:</strong> In deinem Creator-Login klickst du auf <em>„Auszahlungskonto einrichten“</em>. Du wirst direkt durch das sichere Formular von <strong>Stripe Connect Express</strong> geführt und hinterlegst dort deine IBAN sowie deine Steuer-ID.
                </li>
                <li>
                  <strong className="text-white">2. Höchster Datenschutz:</strong> Deine Ausweis-Prüfung (gesetzliches KYC) findet ausschließlich verschlüsselt bei Stripe statt – weder Marken noch wir sehen deine Ausweisdokumente.
                </li>
                <li>
                  <strong className="text-white">3. Guthaben sammeln ab dem ersten Tausender-Block:</strong> Jeder verifizierte View-Block wird deinem Euro-Konto gutgeschrieben. Ab einer fairen <strong>Mindestauszahlung von 25,00 €</strong> (damit keine Bank-/Transaktionsgebühren Kleinstbeträge schmälern) kannst du dein Guthaben jederzeit abrufen.
                </li>
                <li>
                  <strong className="text-white">4. 100 % SEPA-Überweisung in Euro:</strong> Der angezeigte TKP-Betrag gehört ohne Creator-Abzug dir und landet innerhalb weniger Bankarbeitstage per SEPA auf deinem normalen Girokonto.
                </li>
              </ol>
            </div>

            {/* FUER BRANDS */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.05] p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#62B4FF]">
                Für Marken · So funktioniert die Budget-Einzahlung
              </p>
              <ol className="mt-4 space-y-3.5 text-xs leading-6 text-white/85 sm:text-sm">
                <li>
                  <strong className="text-white">1. Kampagnenbudget per SEPA oder Karte aufladen:</strong> Unternehmen zahlen ihr gewünschtes Kampagnenbudget über <strong>Stripe Checkout / Stripe Invoicing</strong> ein. Unser Tipp für Budgets ab 1.000 €: Die Zahlung per <strong>Stripe SEPA-Banküberweisung</strong> (dort sind die Transaktionskosten auf wenige Euro gedeckelt). Vom Kampagnenbudget gehen 19,9 % Plattform-Fee ab; aus dem Rest erhalten Creator den angezeigten Satz ohne Abzug.
                </li>
                <li>
                  <strong className="text-white">2. PSD2- &amp; ZAG-konforme Verwahrung:</strong> Das eingezahlte Kampagnenbudget liegt zweckgebunden in der regulierten <em>Stripe Platform Balance</em> („Separate Charges and Transfers“) und wird erst freigegeben, wenn echte, geprüfte Views nachgewiesen sind.
                </li>
                <li>
                  <strong className="text-white">3. Nur 1 ordentliche B2B-Rechnung:</strong> Egal ob am Ende 8 oder 45 verschiedene Creator Videos zu deiner Kampagne beisteuern – deine Buchhaltung erhält genau <strong>eine gesammelte B2B-Rechnung mit ausgewiesener Umsatzsteuer (19 %)</strong>.
                </li>
                <li>
                  <strong className="text-white">4. Fairer Umgang mit Restbudgets:</strong> Wird ein Kampagnen-Topf bis zum Wunschdatum nicht vollständig ausgeschöpft, kann das Restguthaben nahtlos für die nächste Aktion genutzt oder über Stripe zurückerstattet werden.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* KAPITEL 6: STEUERN & GUTSCHRIFTEN FUER CREATOR */}
        <section id="steuern-deutschland-gutschrift" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            6. Keine Angst vor Rechnungen &amp; Finanzamt: Das automatische Gutschriftsverfahren
          </h2>
          <p className="leading-8 text-ink-soft">
            In Deutschland zögern viele Einsteiger bei 100 € bis 500 € Nebenverdienst vor allem aus einem Grund: Sie wissen nicht, wie man eine formal korrekte Rechnung mit fortlaufender Rechnungsnummer schreibt oder welche Umsatzsteuer-Regel gilt. Genau diesen Papierkram nimmt dir unser Abrechnungs-Workflow komplett ab.
          </p>
          <p className="leading-8 text-ink-soft">
            In deinem Creator-Konto wählst du einmalig deine steuerliche Einstufung aus – zum Beispiel <strong>„Kleinunternehmer gemäß § 19 UStG (keine Ausweisung von Umsatzsteuer)“</strong> oder <strong>„Regelbesteuert (+ 19 % Umsatzsteuer mit hinterlegter Steuernummer / USt-IdNr.)“</strong>. Bei jeder Stripe-SEPA-Auszahlung erstellt das System vollautomatisch ein fertiges, buchhalterisch sauberes <strong>PDF-Gutschriftsdokument</strong>. Du musst keine eigenen Word-Rechnungen tippen und kannst sämtliche Belege am Monats- oder Jahresende gesammelt herunterladen oder direkt in gängige Steuer-Apps für Selbstständige importieren.
          </p>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-hairline bg-white p-6">
            <h3 className="text-base font-bold text-ink">
              Vergleich der Abrechnungswege: Warum Stripe Connect Express für Creator und Brands gewinnt
            </h3>
            <table className="mt-4 w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                  <th className="pb-3 pr-3 font-semibold">Kriterium</th>
                  <th className="pb-3 pr-3 font-semibold">Manuelle Einzelrechnung per Mail</th>
                  <th className="pb-3 pr-3 font-semibold">US-Plattformen (Dollar / PayPal)</th>
                  <th className="pb-3 font-extrabold text-geo-violet">UGC VZ via Stripe Connect (SEPA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Währung &amp; Wechselkurs</td>
                  <td className="py-3 pr-3 text-ink-soft">Euro, aber hohes Mahn-/Warterisiko</td>
                  <td className="py-3 pr-3 text-ink-soft">Oft 3–4 % Umrechnungs- &amp; PayPal-Abzug</td>
                  <td className="py-3 font-bold text-[#385523]">100 % Euro (€) direkt aufs Girokonto</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Beleg-Erstellung</td>
                  <td className="py-3 pr-3 text-ink-soft">Creator muss selbst Rechnung schreiben</td>
                  <td className="py-3 pr-3 text-ink-soft">US-Receipts ohne deutsche USt.-Logik</td>
                  <td className="py-3 font-bold text-[#385523]">Automatische PDF-Gutschrift (§ 19 / 19 % USt.)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-semibold text-ink">Aufwand für die Marke</td>
                  <td className="py-3 pr-3 text-ink-soft">Dutzende Einzelüberweisungen prüfen</td>
                  <td className="py-3 pr-3 text-ink-soft">Auslands-Rechnungen ohne Vorsteuerabzug</td>
                  <td className="py-3 font-bold text-[#385523]">1 deutsche B2B-Sammelrechnung mit 19 % USt.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* KAPITEL 7: FAQ */}
        <section id="faq-tkp-payment" className="scroll-mt-24 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            7. Häufig gestellte Fragen zu TKP-Kampagnen &amp; Stripe-Auszahlungen
          </h2>
          <div className="space-y-3">
            {[
              [
                'Ab wie vielen Followern kann ich als Creator an TKP-Kampagnen teilnehmen?',
                'Bei den meisten TKP- und Clipping-Kampagnen gibt es keine Mindest-Followerzahl – entscheidend ist ein öffentliches Profil auf TikTok, Instagram oder YouTube sowie ein sauber produziertes Video nach Briefing. Lediglich bei einzelnen Produkt-Seeding-Kampagnen mit physischem Warenversand kann eine kleine Schwelle (z. B. ab 500 Followern) gelten.',
              ],
              [
                'Wie lange werden die Views meines eingereichten Videos gezählt?',
                'Jede Kampagne besitzt ein transparent angezeigtes Abrechnungsfenster (typischerweise 7 bis 30 Tage ab Einreichung bzw. solange freies Kampagnenbudget im sichtbaren Fortschrittsbalken vorhanden ist) sowie eine faire Maximalvergütung pro einzelnem Clip.',
              ],
              [
                'Kostet mich Stripe Connect als Creator monatliche Grundgebühren?',
                'Nein. Die Einrichtung über Stripe Connect Express ist für dich als Creator kostenlos, und du zahlst keinen monatlichen Mitgliedsbeitrag auf UGC VZ. Ab 25 € Guthaben rufst du deine Auszahlung per SEPA auf dein Bankkonto ab.',
              ],
              [
                'Brauche ich ein angemeldetes Gewerbe, um mit UGC und Views Geld zu verdienen?',
                'Sobald du in Deutschland regelmäßig mit Gewinnerzielungsabsicht Einnahmen erzielst, ist in der Regel eine einfache Gewerbeanmeldung bzw. steuerliche Erfassung (häufig unkompliziert als Kleinunternehmer nach § 19 UStG im Nebenerwerb) erforderlich. Unsere automatischen Gutschriften erleichtern dir die saubere Dokumentation enorm, ersetzen aber keine individuelle Steuerberatung.',
              ],
              [
                'Bleibt mein normales Verzeichnis-Profil für direkte Marken-Anfragen bestehen?',
                'Selbstverständlich! Dein öffentliches Profil im kostenlosen Verzeichnis (über das Marken dich direkt ohne Provision für klassische UGC-Produktionen anfragen) und der Kampagnen-Picker im Login-Bereich ergänzen sich im selben Konto.',
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

        {/* DOPPEL-ABSCHLUSS-CTA FUER CREATOR & BRANDS */}
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-void p-7 text-white">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-green">
              Für Creator
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Jetzt einloggen &amp; erste Kampagne sichern
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/70">
              Leg dein kostenloses Profil an oder wechsle direkt in den Creator-Login, um offene TKP-Budgets und Provisions-Deals zu picken.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('konto')}
              className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-geo-green px-6 text-xs font-extrabold text-void"
            >
              Zum Creator-Login <ArrowRight size={15} />
            </button>
          </div>

          <div className="rounded-3xl border border-hairline bg-surface p-7">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-geo-violet">
              Für Unternehmen
            </p>
            <h2 className="mt-2 text-xl font-bold text-ink">
              Eigene TKP-Kampagne für {creatorCountLabel} Creator starten
            </h2>
            <p className="mt-2 text-xs leading-6 text-ink-soft">
              Kalkuliere dein Wunschbudget pro 1.000 Aufrufe und erreiche sofort aktive Creator in Deutschland, Österreich und der Schweiz.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('brands')}
              className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-void px-6 text-xs font-bold text-white hover:bg-geo-violet"
            >
              Zum TKP-Rechner für Brands <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </article>
    </div>
  );
}
