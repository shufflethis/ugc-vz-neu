import type { Metadata } from 'next';
import { pageMetadata } from '@/utils/seo-metadata';
import Link from 'next/link';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import JsonLdScript from '../../wissen/[slug]/JsonLdScript';
import SearchBox from '../../components/SearchBox';

export const metadata: Metadata = pageMetadata({
  path: '/brands/ugc-plattform-deutschland',
  title: 'UGC Plattform Deutschland',
  description:
    'UGC VZ ist eine kostenlose UGC Plattform für Deutschland: 400+ Creator durchsuchen, passende Profile auswählen und direkt Kontakt aufnehmen — ohne Agenturgebühr und ohne Abo.',
});

const faqs = [
  {
    question: 'Was kostet eine UGC Plattform?',
    answer:
      'Das hängt vom Modell ab. Marktplätze rechnen pro Video ab oder verlangen ein Monatsabo plus Vermittlungsgebühr. UGC VZ ist ein Verzeichnis und für Marken kostenlos: Es fällt keine Plattform- oder Vermittlungsgebühr an. Bezahlt wird ausschließlich das Honorar, das du direkt mit dem Creator vereinbarst.',
  },
  {
    question: 'Wie schnell bekomme ich passende Creator vorgeschlagen?',
    answer:
      'Du beschreibst deine Kampagne in eigenen Worten, ein Sprachmodell strukturiert die Anfrage und du bekommst dazu passende Profile angezeigt. Die Auswahl triffst du selbst. Die Kontaktdaten der ausgewählten Creator gehen dir per E-Mail zu, nachdem du die Anfrage bewusst abgeschickt hast.',
  },
  {
    question: 'Brauche ich eine Agentur, um UGC zu produzieren?',
    answer:
      'Nein. Die Vermittlung über UGC VZ funktioniert ohne Agentur und ist kostenlos. Wer Kampagnenmanagement abgeben möchte, kann das als kostenpflichtige Leistung über die Agentur famefact dazubuchen — verpflichtend ist das nicht.',
  },
  {
    question: 'Wem gehören die Nutzungsrechte an einem UGC Video?',
    answer:
      'Zunächst dem Creator, der es produziert hat. Welche Rechte auf die Marke übergehen, regelt ihr in eurer Vereinbarung: Laufzeit, Kanäle, Märkte und ob Paid Ads eingeschlossen sind. Weil UGC VZ nicht Vertragspartei ist, klärst du diese Punkte direkt mit dem Creator — was mehr Spielraum, aber auch mehr Eigenverantwortung bedeutet.',
  },
  {
    question: 'Was unterscheidet UGC von Influencer Marketing?',
    answer:
      'Beim Influencer Marketing kaufst du Reichweite: Der Creator veröffentlicht auf seinem eigenen Kanal. Bei UGC kaufst du Content: Du bekommst Videos, die du selbst ausspielst, meist als UGC Ads über deine eigenen Konten. Deshalb zählt bei UGC nicht die Followerzahl, sondern ob das Material zu deiner Markenidentität passt und in den ersten Sekunden funktioniert.',
  },
];

export default function UGCPlattformDeutschlandPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-white text-ink px-4 sm:px-8 md:px-16 lg:px-24 py-16">
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://ugc-vz.de' },
          { name: 'Brands', url: 'https://ugc-vz.de/brands' },
          { name: 'UGC Plattform Deutschland', url: 'https://ugc-vz.de/brands/ugc-plattform-deutschland' },
        ]}
      />
      <JsonLdScript data={faqSchema} />

      <div className="max-w-5xl mx-auto">
        <Link href="/brands" className="text-sm text-ink-soft hover:text-ink">
          UGC VZ für Brands
        </Link>

        <section className="py-14">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-ink">
            UGC Plattform für Deutschland: Creator finden ohne Agentur
          </h1>
          {/* Direktantwort zuerst: Suchmaschinen und AI-Systeme zitieren bevorzugt
              einen ersten Absatz, der ohne den Rest der Seite verstaendlich ist. */}
          <p className="text-xl text-ink-soft max-w-3xl mb-6 leading-relaxed">
            UGC VZ ist eine <strong className="text-ink">kostenlose UGC Plattform für den deutschsprachigen Raum</strong>.
            400+ kuratierte Creator, keine Plattformgebühr, keine Provision auf das Honorar — und statt eines
            Nachrichten-Postfachs bekommst du die direkten Kontaktdaten der Creator, die du ausgewählt hast. Diese Seite
            erklärt, wie das Modell funktioniert, wo seine Grenzen liegen und wann eine klassische Buchungsplattform die
            bessere Wahl ist.
          </p>
          <div className="max-w-3xl">
            <SearchBox initialQuery="UGC Creator für Produktvideo auf TikTok" />
          </div>
        </section>

        <article className="max-w-3xl space-y-12 pb-8">
          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Was ist eine UGC Plattform überhaupt?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Eine UGC Plattform bringt Marken und Content Creator zusammen, die nutzergenerierte Inhalte produzieren —
              also Videos und Fotos, die aussehen wie eine ehrliche Empfehlung und nicht wie ein Werbespot. Der Begriff
              user generated content stammt ursprünglich aus einer Zeit, in der damit echte Kundenbewertungen und
              Community-Beiträge gemeint waren. Im Marketing beschreibt UGC heute etwas Spezifischeres: Content, den
              Creator im Auftrag einer Marke erstellen, der aber die visuelle Sprache organischer Beiträge übernimmt.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Technisch lösen UGC-Plattformen dabei zwei verschiedene Probleme, und genau hier trennen sich die Modelle.
              Die einen sind <strong className="text-ink">Marktplätze</strong>: Du schreibst einen Auftrag aus, Creator
              bewerben sich, die Plattform wickelt Vertrag und Zahlung ab und liefert dir ein fertiges Video. Die anderen
              sind <strong className="text-ink">Verzeichnisse</strong>: Sie lösen das Auffinden, nicht die Abwicklung. Du
              suchst, filterst, wählst aus und arbeitest danach direkt mit dem Creator. UGC VZ gehört in die zweite
              Kategorie.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Wie funktioniert die Plattform für nutzergenerierte Inhalte?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Der Ablauf hat drei Schritte. Erstens beschreibst du deine Kampagne in normalen Sätzen — Produkt,
              Zielgruppe, gewünschtes Format, Budgetrahmen. Ein Sprachmodell strukturiert diese Anfrage, damit sie gegen
              die Profile im Verzeichnis gematcht werden kann. Was das Modell nicht tut: eine Entscheidung für dich
              treffen. Es schlägt vor, die Auswahl triffst du.
            </p>
            <p className="text-ink-soft leading-relaxed mb-4">
              Zweitens siehst du dir die vorgeschlagenen Profile an. Creator hinterlegen bei der Registrierung ihr
              Portfolio, ihre Themen, ihre Preisvorstellung und ihre Social-Links, sodass du vor der Kontaktaufnahme
              einschätzen kannst, ob Stil und Preisniveau passen. Drittens schickst du eine Anfrage für die Profile, die
              dich überzeugt haben. Erst danach gehen dir die Kontaktdaten per E-Mail zu.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Diese Reihenfolge ist bewusst so gebaut. In den öffentlichen Suchergebnissen stehen keine privaten
              E-Mail-Adressen und Telefonnummern — private Kontaktdaten werden getrennt von den öffentlichen
              Creator-Profilen gespeichert und erst nach einer bewussten Anfrage übermittelt. Das schützt die Creator vor
              ungefragter Massenansprache und sorgt dafür, dass die Menschen im Verzeichnis auch tatsächlich antworten.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Was kostet UGC über diese Plattform?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Die Nutzung ist für Marken und für Creator kostenlos. Es gibt kein Abo, keine Freischaltgebühr und keine
              Provision auf das Creator-Honorar. Das ist der zentrale Unterschied zu Marktplätzen, die entweder pro Video
              abrechnen oder ein Monatsabo plus prozentuale Vermittlungsgebühr verlangen — bei denen fließt ein Teil
              deines Budgets in die Plattform statt in die Produktion.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Bezahlt wird also nur das, was der Creator für seine Arbeit aufruft. Was ein UGC Video realistisch kostet,
              hängt vom Format, vom Aufwand und vor allem von den Nutzungsrechten ab; eine ausführliche Einordnung dazu
              findest du unter{' '}
              <Link href="/brands/ugc-creator-preise" className="underline hover:text-geo-violet">
                UGC Creator Preise
              </Link>
              . Optional lässt sich das Kampagnenmanagement als bezahlte Agenturleistung über famefact dazubuchen. Das
              ist ein Zusatzangebot, keine Voraussetzung.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Welche Vorteile von UGC haben Marken gegenüber klassischer Werbung?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Der praktische Vorteil ist das Format. Ein hochglanzpolierter Werbespot wird in einem Feed sofort als
              Werbung erkannt und weggewischt. Ein UGC-Video sieht aus wie der Beitrag davor: Handkamera, echte Wohnung,
              jemand, der ein Produkt in der Hand hält und erzählt, warum es taugt. Diese Glaubwürdigkeit ist der Grund,
              warum authentische Inhalte auf sozialen Medien anders funktionieren als produzierte Spots.
            </p>
            <p className="text-ink-soft leading-relaxed mb-4">
              Der zweite Vorteil ist Menge. Für Paid Social brauchst du nicht ein perfektes Video, sondern viele
              Varianten: unterschiedliche Hooks in den ersten drei Sekunden, verschiedene Argumente, verschiedene
              Gesichter. Mit UGC lässt sich diese Bandbreite produzieren, ohne für jede Variante ein Filmteam zu
              buchen — und erst das macht sauberes Testen möglich, aus dem am Ende die Conversions kommen.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Der dritte Vorteil ist Zweitverwertung. Dasselbe Material lässt sich als organischer Beitrag, als UGC Ads,
              auf Produktseiten und in E-Mails einsetzen. Wichtig ist nur, dass die Nutzungsrechte das abdecken — sonst
              hast du Content, den du nicht überall ausspielen darfst.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Wie findest du passende Creator für deine Kampagne?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Fang beim Publikum an, nicht beim Creator. Wer soll das Video sehen, in welcher Situation, mit welchem
              Vorwissen? Aus dieser Beschreibung ergibt sich fast von selbst, wer glaubwürdig darüber sprechen kann. Ein
              Fitness-Produkt braucht jemanden, dem man das Training abnimmt; ein B2B-Tool jemanden, der die Arbeit
              tatsächlich macht.
            </p>
            <p className="text-ink-soft leading-relaxed mb-4">
              Danach kommen die harten Filter: Sprache und Markt, Format und Plattform, Ausstattung, Preisrahmen. Für
              TikTok und Reels brauchst du vertikales Material und jemanden, der das Tempo dieser Formate beherrscht.
              Für eine Produktvorstellung auf einer Landingpage darf es ruhiger und länger sein.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Zuletzt: Sieh dir Arbeitsproben an, bevor du anfragst. Die Profile im Verzeichnis verlinken Portfolios und
              Social-Kanäle. Fünf Minuten echtes Anschauen ersparen dir mehr Fehlbesetzungen als jede Filtereinstellung.
              Eine ausführlichere Anleitung steht unter{' '}
              <Link href="/brands/ugc-creator-finden" className="underline hover:text-geo-violet">
                UGC Creator finden
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Was unterscheidet die UGC-Plattformen voneinander?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Vier Fragen trennen die Anbieter zuverlässiger als jede Feature-Liste. Erstens: Zahlst du eine
              Plattformgebühr, ein Abo oder eine Provision — oder nur das Creator-Honorar? Zweitens: Bekommst du direkten
              Kontakt zu den Creatorn oder läuft alles über ein Plattform-Postfach? Drittens: Wer ist Vertragspartner,
              die Plattform oder der Creator? Viertens: Wie groß ist der Pool, und wie viel davon ist im deutschsprachigen
              Raum überhaupt verfügbar?
            </p>
            <p className="text-ink-soft leading-relaxed">
              Bei den letzten beiden Punkten sind die Antworten für UGC VZ unbequem und deshalb hier: Wir sind nicht
              Vertragspartei, übernehmen also weder Abwicklung noch Zahlungssicherheit — und unser kuratiertes
              Verzeichnis ist deutlich kleiner als die Pools internationaler Marktplätze. Wir haben die gängigen Anbieter
              deshalb sachlich gegenübergestellt, mit Quelle und Prüfdatum pro Angabe:{' '}
              <Link href="/vergleich" className="underline hover:text-geo-violet">
                UGC-Plattformen im Vergleich
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Welche Art von UGC funktioniert auf TikTok und in Ads?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Am häufigsten laufen vier Muster. Das Testimonial, in dem jemand das Produkt benutzt und erklärt, was sich
              dadurch ändert. Das Unboxing, das die ersten Sekunden nach dem Auspacken zeigt. Der Problem-Lösung-Clip,
              der mit einer konkreten Alltagsfrustration einsteigt. Und der Vergleich zweier Herangehensweisen, der ohne
              große Behauptung auskommt.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Entscheidend ist in allen vier Fällen der Anfang. Wer nicht in den ersten Sekunden einen Grund zum
              Weiterschauen liefert, verliert das Publikum, bevor das Produkt überhaupt vorkommt. Deshalb lohnt es sich,
              pro Kampagne mehrere Hooks für dasselbe Video zu bestellen — dieselbe Aussage, drei verschiedene Einstiege.
              Das ist bei Direktvereinbarung meist einfacher zu verhandeln als ein zusätzliches Paket auf einem
              Marktplatz.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Wie sichern Marken sich die Nutzungsrechte?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Klär vier Punkte schriftlich, bevor gedreht wird: Wie lange darfst du das Material verwenden, auf welchen
              Kanälen, in welchen Märkten und ob bezahlte Ausspielung eingeschlossen ist. Der letzte Punkt ist der teure.
              Content nur organisch zu posten ist etwas anderes, als ihn ein Jahr lang als Paid Ad laufen zu lassen, und
              die Preisdifferenz zwischen beiden ist erheblich.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Weil UGC VZ an der Vereinbarung nicht beteiligt ist, liegt diese Klärung bei dir. Das ist ehrlicherweise
              der Punkt, an dem eine Buchungsplattform Arbeit abnimmt: Dort sind Nutzungsrechte oft Teil des Standards.
              Im Direktmodell verhandelst du sie selbst — dafür kannst du sie auf deine Kampagne zuschneiden, statt ein
              vorgegebenes Paket zu übernehmen.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Für wen lohnt sich dieses Modell — und für wen nicht?</h2>
            <p className="text-ink-soft leading-relaxed mb-4">
              Es passt gut, wenn du selbst gestalten willst: eigenes Briefing, eigene Auswahl, direkte Absprache, feste
              Creator, mit denen du wiederholt arbeitest. Es passt auch dann, wenn das Budget klein ist und jeder Euro in
              die Produktion gehen soll statt in eine Vermittlungsgebühr.
            </p>
            <p className="text-ink-soft leading-relaxed">
              Es passt schlecht, wenn niemand im Team Zeit für Abstimmung hat. Direktkontakt heißt kürzere Wege, aber
              auch: Du beantwortest Rückfragen selbst, du verhandelst Nachbesserungen selbst, und wenn ein Creator nicht
              liefert, gibt es keine Instanz, die einspringt. Bei fünf Creatorn bedeutet das fünf Rechnungen und fünf
              Zahlungsvorgänge. Wer diese Arbeit abgeben will, ist auf einem Marktplatz besser aufgehoben — oder bucht
              das Kampagnenmanagement als Agenturleistung dazu.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-ink mb-4">Häufig gestellte Fragen zu UGC</h2>
            <div className="space-y-6">
              {faqs.map((f) => (
                <div key={f.question}>
                  <h3 className="text-lg font-semibold text-ink mb-2">{f.question}</h3>
                  <p className="text-ink-soft leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-ink mb-4">Das Wichtigste in Kürze</h2>
            <ul className="space-y-3 text-ink-soft leading-relaxed list-disc list-inside">
              <li>
                UGC VZ ist ein <strong className="text-ink">kostenloses Verzeichnis</strong>, kein Marktplatz: keine
                Plattformgebühr, kein Abo, keine Provision auf das Honorar.
              </li>
              <li>
                Du bekommst die <strong className="text-ink">direkten Kontaktdaten</strong> der ausgewählten Creator,
                erst nach einer bewussten Anfrage und nie ungefragt aus der öffentlichen Suche.
              </li>
              <li>
                400+ kuratierte Creator im deutschsprachigen Raum — deutlich weniger als internationale Marktplätze,
                dafür auf den DACH-Markt zugeschnitten.
              </li>
              <li>
                Wir sind nicht Vertragspartei. Abwicklung, Zahlung und Nutzungsrechte klärst du direkt mit dem Creator.
              </li>
              <li>
                Nutzungsrechte vor dem Dreh schriftlich festhalten: Laufzeit, Kanäle, Märkte und ob Paid Ads
                eingeschlossen sind.
              </li>
              <li>
                Für Paid Social lohnen mehrere Hooks pro Video — die ersten Sekunden entscheiden über den Rest.
              </li>
              <li>
                Wer Abwicklung und Qualitätssicherung abgeben möchte, fährt mit einer Buchungsplattform besser; der{' '}
                <Link href="/vergleich" className="underline hover:text-geo-violet">
                  Anbietervergleich
                </Link>{' '}
                ordnet die Optionen mit Quellen ein.
              </li>
            </ul>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/brands"
              className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors block"
            >
              <span className="block text-lg font-semibold text-ink mb-1">Creator suchen</span>
              <span className="block text-sm text-ink-soft">
                Kampagne beschreiben und passende Profile aus dem Verzeichnis erhalten.
              </span>
            </Link>
            <Link
              href="/creator"
              className="surface-card rounded-lg p-6 hover:border-geo-violet transition-colors block"
            >
              <span className="block text-lg font-semibold text-ink mb-1">Als Creator anmelden</span>
              <span className="block text-sm text-ink-soft">
                Kostenloses Profil mit Portfolio, Themen und Verfügbarkeit anlegen.
              </span>
            </Link>
          </section>
        </article>
      </div>
    </main>
  );
}
