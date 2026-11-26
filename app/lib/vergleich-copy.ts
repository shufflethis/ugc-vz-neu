import type { Competitor } from './competitors';

/**
 * Fließtext der Vergleichs-Detailseiten, pro Wettbewerber.
 *
 * Regel für diese Datei: Kein Satz darf eine Tatsachenbehauptung über einen
 * Wettbewerber enthalten, die nicht bereits in `competitors.ts` steht (dort mit
 * Quelle und Prüfdatum). Erlaubt sind: Wiedergaben dieser Angaben, Aussagen über
 * UGC VZ und allgemeine Kaufberatung ohne Anbieterbezug.
 */
export interface PageCopy {
  /** „Preisstruktur im Detail" */
  pricingDetail: string[];
  /** „Direktkontakt oder Abwicklung über die Plattform" */
  handling: string[];
  /** Einleitung der Checkliste */
  questionsIntro: string;
  /** Checkliste vor der Buchung */
  questions: string[];
  /** „Wofür UGC VZ nicht die richtige Wahl ist" */
  notFor: string[];
  /** „Fazit" */
  conclusion: string[];
}

type CopyBuilder = (c: Competitor, own: Competitor) => PageCopy;

const speekly: CopyBuilder = (c, own) => ({
  pricingDetail: [
    `Speekly veröffentlicht seine Preise offen. Auf der Preisseite steht: ${c.pricing.value}. Das ist eine für Brands angenehme Form von Preisstruktur, weil sie sich vor dem ersten Auftrag durchrechnen lässt, ohne dass ein Verkaufsgespräch dazwischensteht.`,
    'Für die Budgetplanung ist die Form dieser Struktur wichtiger als die einzelne Zahl: Es ist ein Preis pro Video, gestaffelt nach Länge. Die Kosten steigen also mit der Anzahl der Videos und lassen sich vorher exakt beziffern. Wer wissen will, was zehn 30-Sekunden-Videos nach diesen Listenpreisen kosten, multipliziert 119 € mit zehn und rechnet die Mehrwertsteuer dazu. Ein solcher Preis pro Stück passt gut zu unregelmäßigem Bedarf, weil in einem Monat ohne Auftrag auch keine Kosten entstehen.',
    'Daneben führt die Preisseite ein Rohmaterial-Paket ab 59 €. Der Unterschied zum fertigen Video ist der Bearbeitungsstand: Rohmaterial ist ungeschnitten und geht in deinen eigenen Schnitt oder den deiner Agentur. Wer ohnehin ein Team hat, das je Kanal unterschiedlich schneidet, zahlt die Postproduktion damit nur einmal. Wer kein solches Team hat, ist mit dem fertig geschnittenen Video besser bedient — es ist teurer, aber es ist fertig.',
    `Zur Provision macht Speekly eine klare Angabe: ${c.commission.value}. Videopreis und Vermittlung sind also nicht zwei getrennte Posten, sondern einer. Das hält die Rechnung einfach.`,
    'Bei UGC VZ zahlst du kein Monatsabo und keinen festen Stückpreis pro Video. Stattdessen wählst du je nach Ziel: Im Brand-Workspace startest du View-Kampagnen mit fester Budget-Obergrenze (15 % Servicegebühr sind im Marken-Budget enthalten, 0 % für Creator), oder du fragst Profile aus dem DACH-Pool direkt ohne Vermittlungsprovision für individuelle Videoproduktionen an. Bei Speekly kaufst du ein standardisiertes Video zum Fixpreis; bei UGC VZ steuerst du entweder nach geprüften Views oder direkt mit dem Creator.',
  ],
  handling: [
    'Der praktische Unterschied liegt im Ablauf und in der Vertragsbeziehung. Einen direkten Creator-Kontakt gibt es bei Speekly laut Anbieterangabe nicht: Die Kommunikation läuft über den Chat der Plattform, und der Auftrag ist ein Auftrag an Speekly. Bei UGC VZ kannst du Kampagnen zentral im Brand-Workspace mit Budget-Deckel und Beitragsprüfung abwickeln oder direkt mit ausgewählten Creatorn per E-Mail zusammenarbeiten.',
    'Daran hängt auch die Abrechnung. Bei View-Kampagnen im UGC-VZ-Workspace lädst du dein Kampagnen-Budget zentral per SEPA oder Karte auf und erhältst eine Sammelrechnung, während Creator automatisch ihre Gutschrift bekommen. Im reinen Direktkontakt schreibt dagegen jeder Creator seine eigene Rechnung, was dir maximale Verhandlungsfreiheit gibt, aber bei vielen Einzelaufträgen eigenen Buchhaltungsaufwand bedeutet.',
    'Der zweite Punkt sind die Nutzungsrechte. Ein UGC-Video ist erst dann für Paid Social brauchbar, wenn geklärt ist, wie lange, auf welchen Kanälen und in welchen Märkten du es schalten darfst. Bei Direkt-Produktionen klärst du das individuell pro Creator inklusive Verlängerungsoption, wenn ein Creative im Werbekonto stark performt.',
    'Der dritte Punkt ist die Lieferzuverlässigkeit: Laut Anbieterangaben liefert Speekly fertig geschnittene Videos inklusive Revisionen bis zur Freigabe nach etwa sieben Tagen. Wenn du bei UGC VZ eine View-Kampagne startest, bezahlst du nur für tatsächlich geprüfte Aufrufe innerhalb deines Budget-Deckels. Bei reinen Direkt-Vereinbarungen ohne Workspace sichern ein klarer Liefertermin und Zahlung nach Abnahme dein Projekt ab.',
  ],
  questionsIntro:
    'Die folgenden Punkte gelten unabhängig davon, ob du bei Speekly, bei uns oder bei einem anderen Anbieter buchst. Wer sie vor der Buchung klärt, spart sich die teuren Rückfragen danach.',
  questions: [
    'Nutzungsrechte: Für welche Kanäle, welche Laufzeit und welche Märkte gilt die Freigabe — ist Paid Social eingeschlossen oder nur organische Nutzung?',
    'Lieferform: Bekommst du das fertig geschnittene Video, das Rohmaterial oder beides? Nur mit Rohmaterial kannst du später neue Schnittvarianten bauen.',
    'Korrekturen: Wie viele Feedbackrunden sind eingeschlossen, und was passiert, wenn dir die erste Version nicht gefällt?',
    'Exklusivität: Darf der Creator im selben Zeitraum für ein Wettbewerbsprodukt drehen?',
    'Kennzeichnung: Wer stellt sicher, dass Werbung als Werbung erkennbar ist — du, der Creator oder die Plattform?',
    'Gesamtkosten: Was ist im genannten Preis enthalten, und kommt noch etwas obendrauf — Honorar, Gebühr, Aufschlag für zusätzliche Formate?',
  ],
  notFor: [
    'Wer ein fertig geschnittenes Produktvideo zum starren Stückpreis inklusive fest definierter Revisionsrunden sucht, findet bei einem Festpreis-Marktplatz den geradlinigeren Prozess. UGC VZ setzt statt Stückpreis-Paketen auf View-Kampagnen mit Budget-Deckel und freien Direktkontakt.',
    `Auch der Pool ist kompakter: ${own.creatorCount.value} stehen bei Speekly ${c.creatorCount.value} Creator gegenüber. Wer eine sehr spezielle Nische besetzt und viele Profile parallel außerhalb des DACH-Raums sichten will, hat auf einem größeren internationalen Marktplatz mehr Auswahl.`,
    'Und bei direkten Einzelproduktionen steht vorab kein einheitlicher Listenpreis fest: Du siehst die Richtwerte im Profil und verhandelst Umfang und Rechte selbst. Wenn dir für Briefing, Produktion und Koordination intern die Zeit fehlt, kannst du bei UGC VZ optional Agentur-Support anfragen.',
  ],
  conclusion: [
    'Wer planbare Fixpreise pro fertig geschnittenem Video will und die Abwicklung komplett abgibt, ist bei Speekly richtig: Der Anbieter ist genau dafür gebaut und veröffentlicht seine Preise nachprüfbar.',
    'Wer ohne Monatsabo entweder nach geprüften Views mit fester Budget-Obergrenze abrechnen oder Creator im DACH-Raum direkt für individuelle Ad-Pakete buchen will, hat bei UGC VZ deutlich mehr Spielraum. Das ist ein Modellunterschied, keine Rangliste.',
  ],
});

const influee: CopyBuilder = (c, own) => ({
  pricingDetail: [
    `Influee weist seine Kosten in mehreren Bausteinen aus. Auf der Preisseite steht: ${c.pricing.value}. Diese Bausteine muss man zusammen betrachten, sonst rechnet man sich das Modell schön.`,
    'Der erste Baustein ist eine laufende Kostenposition. Ein Abo fällt monatlich an, unabhängig davon, wie viele Videos in diesem Monat entstehen. Für die Budgetplanung heißt das: Die Kosten pro Video hängen an der Menge. Wer im Monat zwanzig Videos abruft, verteilt das Abo auf zwanzig Videos. Wer eines abruft, trägt es allein. Ein Abomodell belohnt kontinuierliche Produktion und bestraft Pausen — genau umgekehrt zu einem Preis pro Stück.',
    `Der zweite Baustein ist die Vermittlungsgebühr: ${c.commission.value}. Sie skaliert mit dem, was du an Creator zahlst, nicht mit dem Abo. Der dritte Baustein ist das Creator-Honorar selbst, das im Abo nicht enthalten ist. Die auf der Influee-Startseite beworbenen „ab 76 €" beziffern diesen dritten Baustein — den Creator-Anteil, nicht den Gesamtpreis. Solche Verkürzungen sind der Grund, warum in unserer Tabelle jeder Wert auf die Anbieterseite verlinkt, auf der er steht.`,
    'Ein praktischer Hinweis zur Währung: Die Abopreise sind in US-Dollar ausgewiesen. Wer in Euro budgetiert, plant also zusätzlich mit einem Wechselkurs. Wir rechnen ihn hier bewusst nicht um — der Kurs ändert sich, die Anbieterangabe nicht.',
    `Bei UGC VZ entfällt jedes Monatsabo. Für View-Kampagnen im Brand-Workspace setzt du ein festes Budget-Limit, in dem 15 % Servicegebühr bereits enthalten sind (0 % Abzug für Creator, 0 € bei SEPA-Aufladung). Für einzelne Direktproduktionen zahlst du 0 % Plattformgebühr und vereinbarst das Honorar direkt mit dem Creator. Dafür liefert Influee laut Anbieterangaben einen internationalen Pool von ${c.creatorCount.value} und einen KI-Videoeditor mit Untertiteln in 65 Sprachen.`,
  ],
  handling: [
    `Influee ist auf Volumen und Reichweite gebaut: ${c.creatorCount.value} Creator, ${c.markets.value}, dazu ein KI-Videoeditor mit automatischen Untertiteln in 65 Sprachen. Wer so etwas einsetzt, kauft nicht einzelne Videos, sondern eine internationale Produktionsstrecke über die Plattform, ohne direkten Creator-Kontakt.`,
    'Bei UGC VZ entscheidest du je nach Projekt, wie viel Plattform-Steuerung du brauchst: View-Kampagnen laufen strukturiert über den Brand-Workspace inklusive Budget-Deckel, Beitragsprüfung und zentraler Abrechnung. Für maßgeschneiderte Produktvideos holst du dir die direkten Kontaktdaten der ausgewählten DACH-Creator und vereinbarst Skript, Hooks und Nutzungsrechte unmittelbar.',
    'Auch bei der Kostenkontrolle unterscheiden sich beide Wege: Ein monatliches Plattform-Abo erzeugt Fixkosten selbst in ruhigen Monaten. Ein budgetgedeckeltes Kampagnen-Wallet ohne Grundgebühr oder direkte Einzelaufträge kosten dagegen nur dann Geld, wenn wirklich Content oder geprüfte Views entstehen.',
    'Wichtig bei direkten Einzelaufträgen außerhalb des View-Workspaces: Liefertermin, Abnahmekriterien und Zahlungszeitpunkt gehören schriftlich in die Vereinbarung, bevor gedreht wird. Dafür stellt UGC VZ eine kostenlose Vertrags- und Briefing-Vorlage nach deutschem Recht bereit.',
  ],
  questionsIntro:
    'Bevor du dich für ein Modell entscheidest — Abo, Preis pro Video oder Direktkontakt —, klär die folgenden Punkte. Sie entscheiden häufiger über die Gesamtkosten als der beworbene Einstiegspreis.',
  questions: [
    'Rechne die Fixkosten auf die Menge um: Teile alles, was monatlich unabhängig vom Auftrag anfällt, durch die Videos, die du realistisch abrufst — nicht durch die, die du dir vornimmst.',
    'Trenne die Kostenarten: Grundgebühr, Vermittlungsgebühr und Creator-Honorar sind drei Dinge. Ein beworbener Einstiegspreis meint oft nur eines davon.',
    'Nutzungsrechte: Welche Kanäle, welche Laufzeit, welche Länder — und was kostet eine Verlängerung, wenn ein Video gut läuft?',
    'Sprache und Markt: Wird in der Zielsprache produziert oder nachträglich untertitelt? Für den deutschsprachigen Raum ist das ein spürbarer Unterschied in der Wirkung.',
    'Bindung: Zu welchem Zeitpunkt endet eine laufende Vertragsbindung, wenn eine Kampagne pausiert oder das Budget gekürzt wird?',
    'Exklusivität: Darf derselbe Creator parallel für ein Wettbewerbsprodukt drehen?',
  ],
  notFor: [
    `Beim internationalen Skalieren in zwei Dutzend Ländern kann UGC VZ nicht mithalten. ${own.creatorCount.value} stehen ${c.creatorCount.value} gegenüber, und wir bieten weder einen eingebauten KI-Videoeditor noch automatische Untertitel in 65 Sprachen. Unser Fokus bleibt klar ${own.markets.value}, nicht ${c.markets.value}.`,
    'Wenn dein Team jeden Monat dutzende fremdsprachige Video-Varianten in vielen Märkten zentral schneiden und automatisiert lokalisieren will, ist eine internationale Abo-Suite auf diese Produktionsstrecke optimiert.',
    'Bei gelegentlichen oder mittelgroßen DACH-Kampagnen kippt die Rechnung dagegen schnell: Wenn ein hohes Monatsabo nur auf wenige Videos verteilt wird, treibt es die Stückkosten nach oben. Bei UGC VZ zahlst du keine laufende Grundgebühr und kannst optional Kampagnen-Unterstützung anfragen, wenn intern Zeit fehlt.',
  ],
  conclusion: [
    'Wenn du kontinuierlich viel Content in mehreren Märkten produzierst, die Abwicklung abgeben willst und der größte Pool im Vergleich für dich zählt, ist Influee dafür gemacht. Ein Abomodell rechnet sich, sobald es sich auf genug Videos verteilt.',
    `Wenn du im deutschsprachigen Raum ohne monatliche Fixkosten starten willst, bietet UGC VZ die klarere Struktur: budgetgedeckelte View-Kampagnen im Workspace oder direkter Creator-Kontakt für individuelle Produktionen. ${own.bestFor}`,
  ],
});

const stylink: CopyBuilder = (c, own) => ({
  pricingDetail: [
    'Hier ist die ehrlichste Aussage die kürzeste: stylink UGC veröffentlicht auf der eigenen Website keine Preise für Brands. In unserer Tabelle steht deshalb „nicht öffentlich" — keine Spanne, keine Schätzung, kein erfundener Ab-Preis.',
    'Das ist kein Vorwurf. Individuelle Angebote sind im B2B verbreitet, und sie ergeben Sinn, wenn Umfang, Laufzeit und Rechteumfang stark schwanken. Für die Budgetplanung hat es aber eine konkrete Folge: Du kennst deine Kosten erst nach einem Gespräch. Wer drei Anbieter vergleichen will, führt drei Gespräche, bevor überhaupt eine Zahl auf dem Tisch liegt — und sollte diesen Zeitaufwand in die Planung einrechnen.',
    `Auf der Anbieterseite steht die Creator-Seite der Rechnung: eine Vergütung von „bis zu 200 € pro Video". Das ist der Betrag, mit dem Creator geworben werden, nicht der Preis, den eine Brand zahlt. Was die Plattform darüber hinaus berechnet, ist ${c.commission.value} ausgewiesen.`,
    'In Vergleichsartikeln kursieren konkrete Brand-Preise für stylink UGC. Wir führen sie nicht, weil sie sich auf der Anbieterseite nicht belegen lassen. Eine leere Zelle ist unbequem; ein falscher Wettbewerberpreis wäre schlimmer — für den Anbieter und für uns.',
    'Bei UGC VZ stehen die Konditionen öffentlich auf der Preisseite, ganz ohne Verkaufsgespräch: kein Monatsabo, 15 % Servicegebühr im Marken-Budget bei View-Kampagnen (0 % Abzug für Creator) und 0 % Vermittlungsprovision, wenn du Creator direkt für Einzelvideos anfragst.',
  ],
  handling: [
    'Der auffälligste Unterschied bei stylink UGC ist die vorgeschaltete Qualitätssicherung. stylink führt nach eigenen Angaben einen redaktionellen Content-Check durch, bevor das Material an die Brand geht, und nennt eine Durchlaufzeit von neun Tagen vom Auftrag zum Video. Das ist hilfreich, wenn dein Team kein eigenes Review machen möchte.',
    'Bei UGC VZ bleibt die Freigabe direkt bei dir: In View-Kampagnen prüfst du eingereichte Beiträge im Brand-Workspace gegen deine Briefing-Checkliste, bevor sie freigegeben werden. Bei direkten Einzelaufträgen sichtest du vorab offene Portfolios, schreibst direkt mit dem Creator und gibst Feedback ohne Zwischeninstanz.',
    'Der zweite Unterschied liegt im Vertrags- und Abrechnungsweg. Bei stylink UGC läuft die Abwicklung laut Anbieterangabe geschlossen über die Plattform. Bei UGC VZ hast du die Wahl zwischen zentraler Budget-Abrechnung im Kampagnen-Workspace (mit fester Obergrenze und Sammelbeleg) oder direkter Vereinbarung mit dem Creator für individuelle Paid-Ads-Rechte.',
    'Praktisch heißt direkter Austausch vor allem: kürzere Wege und feste Stamm-Creator. Rückfragen zum Produkt beantwortest du unmittelbar statt über ein Ticketsystem, und wenn ein Creator stark für deine Marke performt, kannst du sofort Anschluss-Briefings oder View-Kampagnen starten.',
  ],
  questionsIntro:
    'Ob mit Content-Check oder ohne: Diese Punkte solltest du vor der Buchung schriftlich klären, weil sie hinterher am teuersten sind.',
  questions: [
    'Prüfung: Wer sichtet das Material vor der Freigabe — der Anbieter, dein Team oder niemand? Und wer entscheidet, ob eine Nachbesserung nötig ist?',
    'Ablehnung: Was passiert, wenn ein Video das Briefing verfehlt? Gibt es eine Korrekturrunde, einen Ersatz oder eine Rückerstattung?',
    'Zeitplan: Bis wann wird geliefert, und was gilt bei Verzug? Eine zugesagte Durchlaufzeit ist nur dann etwas wert, wenn sie schriftlich vereinbart ist.',
    'Nutzungsrechte: Kanäle, Laufzeit, Märkte — und ist Paid Social eingeschlossen?',
    'Rohmaterial: Bekommst du zusätzlich zum fertigen Video die unbearbeiteten Aufnahmen für spätere Schnittvarianten?',
    'Gesamtkosten: Was steht im Angebot, und was ist ausdrücklich nicht enthalten?',
    'Kommunikationsweg: Läuft die Abstimmung über ein Ticketsystem, einen Chat oder direkt mit dem Creator — und wie viele Rückfragerunden sind realistisch, bevor gedreht wird?',
  ],
  notFor: [
    'UGC VZ führt keine externe redaktionelle Videoprüfung durch und garantiert keine pauschale 9-Tage-Lieferfrist pro Einzelvideo. Wer genau diesen vorgelagerten Content-Check an eine Plattform auslagern will, findet bei stylink UGC das passendere Setup.',
    `Der Pool ist zudem gezielter und kleiner: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei stylink UGC. Wir kuratieren konsequent für den deutschsprachigen Markt, statt maximale internationale Poolgröße anzustreben.`,
    'Für Teams ganz ohne Zeit für eigenes Feedback oder Beitragsfreigaben ist ein Anbieter mit vorgelagerter Abnahme oft bequemer. Wenn du hingegen volle Preistransparenz vor dem ersten Gespräch suchst, kannst du bei UGC VZ sofort ohne Sales-Call starten.',
  ],
  conclusion: [
    `Die Entscheidung lässt sich auf eine Frage zusammenziehen: Willst du eine vorgeschaltete Prüfung und eine zugesagte Lieferzeit, oder willst du offene Konditionen und direkte Kontrolle? ${c.bestFor}`,
    `Wer vor dem Start genau wissen will, was anfällt, und zwischen View-Kampagnen mit Budget-Deckel und direktem Creator-Kontakt wählen möchte, fährt mit UGC VZ klarer. ${own.bestFor}`,
    'Die Kurzfassung: Ein vorgeschalteter Content-Check nimmt dir Review-Arbeit ab, während UGC VZ dir transparente Preise, flexible View-Abrechnung und den direkten Draht zum Creator gibt.',
  ],
});

const boksi: CopyBuilder = (c, own) => ({
  pricingDetail: [
    'Boksi veröffentlicht keine Preisliste für Brands. Die Website führt stattdessen zu einer kostenlosen Demo; ein individuelles Angebot wird laut Anbieter innerhalb eines Werktags erstellt. In unserer Tabelle steht deshalb „nicht öffentlich" — wir tragen dort keine Schätzung ein.',
    'Ein Angebotsmodell ist typisch, wenn nicht ein einzelnes Video verkauft wird, sondern eine Leistung mit variablem Umfang. Für die Budgetplanung heißt das: Am Anfang steht ein Briefing, nicht ein Preis. Du brauchst also zuerst eine belastbare Vorstellung von Kampagnenumfang, Laufzeit und gewünschtem Rechteumfang — sonst vergleichst du Angebote, die unterschiedliche Dinge enthalten.',
    `Was in ein solches Angebot einfließt, ist erkennbar mehr als eine Videodatei. Boksi nennt First-Party-Daten von Instagram und TikTok mit Performance-Tracking (Engagement, CPM, Conversion) und persönlichen Support mit Büros in Helsinki und Hamburg, dazu ${c.creatorCount.value} Creator und mehr als 3.500 umgesetzte Kampagnen. Solche Managed-Leistungen kosten Geld, weshalb ein Vergleich rein über die Gebühr zu kurz greift: Self-Service-Plattform und betreuter Managed Service verkaufen unterschiedliche Leistungstiefen.`,
    'Wer Angebote vergleichen will, sollte deshalb vor der ersten Anfrage eine eigene Vergleichsgröße festlegen: dieselbe Anzahl Videos, dieselbe Länge, derselbe Rechteumfang, derselbe Zeitraum. Sonst vergleicht man am Ende ein Paket mit Betreuung gegen eine reine Lieferung, und der Unterschied fällt erst auf, wenn die Kampagne schon läuft. Dieselbe Vergleichsgröße hilft übrigens auch im Gespräch mit einzelnen Creatorn: Wer sagen kann, wie viele Videos in welcher Länge zu welchen Rechten gebraucht werden, bekommt schneller ein belastbares Honorarangebot.',
    `Auch die Gebührenseite ist bei Boksi ${c.commission.value}, sodass du erst im Angebot erfährst, welcher Anteil an die Plattform geht. Bei UGC VZ ist die Kostenlogik öffentlich dokumentiert: kein Abo, 15 % Servicegebühr im Marken-Budget bei View-Kampagnen (0 % Abzug für Creator) und 0 % Provision bei direkten Creator-Vereinbarungen.`,
  ],
  handling: [
    `Boksi bündelt Kampagnen inklusive Reporting und Betreuung. Entsprechend läuft die Zusammenarbeit über die Plattform, ohne direkten Creator-Kontakt. Für die Brand heißt das, dass Auswahl, Abstimmung, Vertrag und Zahlung an einer Stelle zusammenlaufen und es ein festes Account-Team gibt.`,
    'UGC VZ ist bewusst als Self-Service-Plattform gebaut: Im Brand-Workspace legst du Kampagnen mit Budget-Deckel, Briefing-Checkliste und Live-Reporting in wenigen Minuten selbst an, oder du fragst kuratierte Creator direkt für einzelne Produktvideos an. Optional kannst du für größere Projekte Unterstützung über unser Team anfragen, ohne dass das Pflicht wäre.',
    'Vier Fragen helfen im Alltag bei der Wahl: Willst du ein externes Account-Team, das jede Rückfrage übernimmt, oder steuerst du Briefings lieber direkt im eigenen Team? Bei großen internationalen Multi-Channel-Setups spart ein Managed Service interne Zeit. Bei agilen DACH-Kampagnen sind direkte Wege und klare Budget-Deckel deutlich schneller.',
    'Auch beim Reporting unterscheiden sich die Schwerpunkte: Boksi richtet sich an Enterprise-Teams mit breitem Influencer- und Conversion-Reporting. UGC VZ fokussiert sich im Workspace auf nachvollziehbare View-Zählung, Auszahlungs-Deckel pro Kampagne und saubere Export-Belege für Buchhaltung und Steuer.',
  ],
  questionsIntro:
    'Bei Angebotsmodellen entscheidet der Leistungsumfang über den Preis. Diese Fragen sollten vor der Unterschrift beantwortet sein — bei jedem Anbieter, auch bei einer Zusammenarbeit ohne Plattform.',
  questions: [
    'Leistungsumfang: Wie viele Videos, in welcher Länge, in welchen Formaten — und was zählt als Nachbesserung statt als neues Video?',
    'Rechte: Für welche Kanäle, welche Laufzeit und welche Märkte gilt die Freigabe, und was kostet eine Verlängerung?',
    'Auswertung: Welche Kennzahlen werden berichtet, aus welcher Quelle stammen sie, und bekommst du die Rohdaten?',
    'Mindestumfang: Gibt es eine Mindestlaufzeit oder ein Mindestbudget, und wie kommst du wieder heraus?',
    'Ansprechpartner: Wer schreibt das Briefing, wer gibt Feedback, und wie schnell ist die Rückmeldung zugesagt?',
    'Gesamtkosten: Welche Positionen stehen im Angebot, und welche kommen erfahrungsgemäß später dazu?',
    'Daten: Wem gehören die erhobenen Kampagnendaten, und kannst du sie exportieren, wenn die Zusammenarbeit endet?',
  ],
  notFor: [
    'UGC VZ ist kein klassischer Full-Service-Account-Betreuer mit festen Projektmanagern in mehreren europäischen Büros. Unsere Stärke ist der schnelle Self-Service ohne Demo-Zwang und ohne Mindestlaufzeit.',
    `Der Pool ist außerdem fokussierter: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei Boksi. Und wir decken ${own.markets.value} ab, nicht ${c.markets.value}.`,
    'Wer ein komplettes Influencer- und UGC-Programm über mehrere Länder vollständig an ein externes Team delegieren möchte, kauft bei einem Managed Service genau diese Betreuung mit ein.',
    'Für Brands im DACH-Raum, die ohne Mindestbudget sofort starten, eigene Budget-Obergrenzen setzen oder direkt mit Creatorn arbeiten wollen, bietet UGC VZ den schnelleren Einstieg. Bei Bedarf lässt sich Beratung punktuell ergänzen.',
  ],
  conclusion: [
    `Die Entscheidung ist keine Preisfrage, weil Boksi keine Preise veröffentlicht, mit denen sich rechnen ließe. Sie ist eine Frage der Betreuungstiefe. ${c.bestFor}`,
    `Wenn du dagegen ohne Verkaufsgespräch sofort im DACH-Raum starten, feste Budget-Deckel im Self-Service steuern oder Creator direkt kontaktieren willst, passt UGC VZ besser. ${own.bestFor}`,
  ],
});

const noovid: CopyBuilder = (c, own) => ({
  pricingDetail: [
    `Noovid arbeitet mit öffentlich einsehbaren Stückpreisen nach Videolänge: ${c.pricing.value}. Für kleinere Budgets und erste Creatives-Tests ist das leicht greifbar, weil vor dem Start klar ist, was ein einzelner Clip kostet.`,
    `Eine laufende Grundgebühr gibt es laut Anbieterseite nicht; ${c.commission.value}. Damit ähnelt die Preislogik anderen Festpreis-Marktplätzen: Du zahlst pro Video einen Komplettpreis inklusive Plattform-Abwicklung statt getrennter Posten aus Abo und Provision.`,
    'Wichtig beim Vergleichen ist der Leistungsumfang hinter dem Einstiegspreis. Ein standardisiertes Kurzvideo zum Festpreis deckt typische Ad-Grundformen ab. Sobald du mehrere alternative Hooks, unbearbeitetes Rohmaterial für eigenes Performance-Editing oder feste monatliche Retainer mit demselben Gesicht brauchst, stößt ein starres Stückpreis-Raster schneller an Grenzen als eine direkte Absprache.',
    'Bei UGC VZ zahlst du kein Monatsabo und bist nicht an feste Stückpreise gebunden: Im Brand-Workspace legst du für View-Kampagnen ein festes Maximalbudget fest (15 % Servicegebühr im Marken-Budget enthalten, 0 % für Creator), und für klassische Einzelvideos fragst du DACH-Creator ohne Vermittlungsprovision direkt an.',
  ],
  handling: [
    'Der Hauptunterschied liegt im Grad der Standardisierung. Bei Noovid läuft der gesamte Prozess laut Anbieterseite über die Plattform: Online-Briefing anlegen, Produktmuster versenden, Lieferung meist innerhalb von bis zu zehn Tagen inklusive Korrekturrunden und kommerzieller Nutzungsrechte. Du gibst damit Organisation und Vertragsvorlage weitgehend ab.',
    'Bei UGC VZ verbindest du beide Arbeitsweisen unter einem Dach: Für schnelle Reichweiten-Kampagnen nutzt du den Brand-Workspace mit Briefing-Checkliste, Beitragsprüfung und Live-Reporting. Für maßgeschneiderte Ad-Creatives sichtest du offene Portfolios, forderst direkte Kontaktdaten an und verhandelst Skript, Hooks und Retainer unmittelbar mit dem Creator.',
    'Auch bei der regionalen Ausrichtung unterscheiden sich die Schwerpunkte: Noovid deckt laut eigener Angabe Europa inklusive Deutschland ab, während UGC VZ konsequent auf den deutschsprachigen DACH-Raum fokussiert ist.',
  ],
  questionsIntro:
    'Bevor du zwischen einem Festpreis-Marktplatz wie Noovid und UGC VZ wählst, helfen diese Prüfpunkte:',
  questions: [
    'Paketumfang: Sind zusätzliche Hooks für die ersten drei Sekunden und unbearbeitetes Rohmaterial im genannten Preis enthalten oder kosten sie extra?',
    'Rechteumfang: Gelten die enthaltenen kommerziellen Nutzungsrechte unbefristet für Paid Ads, und ist Whitelisting bzw. Spark Ads eingeschlossen?',
    'Stamm-Creator: Kannst du denselben Creator unkompliziert erneut buchen, wenn ein Creative im Werbekonto stark performt?',
    'Sprachqualität: Spricht der ausgewählte Creator akzentfrei und authentisch für deine deutsche Zielgruppe?',
    'Abnahme & Nachbesserung: Was gilt als inkludierte Korrekturrunde und wie schnell erfolgt eine Nachlieferung?',
  ],
  notFor: [
    'UGC VZ bietet keinen starren Einzelvideo-Checkout mit fixen Paketpreisen pro 15- oder 60-Sekunden-Clip und integriertem Paketversand-Tracker. Wenn du genau diese schlüsselfertige Einzelvideo-Bestellung suchst, nimmt dir eine Festpreis-Plattform wie Noovid Koordinationsarbeit ab.',
    `Zudem veröffentlicht Noovid keine Gesamtzahl an Creatorn (${c.creatorCount.value}), arbeitet aber europaweit in mehreren Sprachen. Wenn du mehrsprachige Einzelvideo-Bestellungen außerhalb des DACH-Raums zentral aus einer Oberfläche steuern willst, stößt unser klar auf ${own.markets.value} ausgerichtetes Angebot an seine Grenzen.`,
  ],
  conclusion: [
    `Wer ohne Monatsabo möglichst schnell und mit geringem eigenem Abstimmungsaufwand einzelne Kurzvideos zum festen Stückpreis bestellen will, findet bei Noovid ein klares Angebot. ${c.bestFor}`,
    `Wer dagegen im DACH-Raum View-Kampagnen mit Budget-Deckel und direkte Creator-Beziehungen für individuelle Ad-Pakete kombinieren will, fährt mit UGC VZ flexibler. ${own.bestFor}`,
  ],
});

const contentmarkt: CopyBuilder = (c, own) => ({
  pricingDetail: [
    `Contentmarkt setzt auf erfolgsabhängige Reichweite statt auf feste Stückpreise pro Videodatei: ${c.pricing.value}. Marken definieren vorab ein Gesamtbudget als harte Obergrenze; bezahlt wird nach verifizierten Aufrufen auf TikTok und Instagram.`,
    `Welche Servicegebühr oder Marge Contentmarkt dabei einbehält, ist auf der Website ${c.commission.value}. Für die Budgetplanung ist klar erkennbar, worin der Reiz des Pay-per-View-Modells liegt: Du kaufst nicht blind Reichweite per Fixgage ein, sondern koppelst die Auszahlung an messbare Views innerhalb deines Budgetdeckels.`,
    'UGC VZ bietet exakt diese budgetgedeckelte View-Mechanik ebenfalls im Brand-Workspace an, legt die Gebühr dabei aber vollständig offen: kein Monatsabo, 15 % Servicegebühr im Marken-Budget enthalten, 85 % gehen 1:1 an die Creator (0 % Abzug für Creator) und 0 € Aufladegebühr per SEPA.',
    'Zusätzlich kannst du auf UGC VZ denselben kuratierten DACH-Pool auch direkt ohne Vermittlungsprovision anfragen, wenn du neben organischen Views lizenzierte Produktvideos, Rohmaterial und Hook-Varianten für dein eigenes Meta- oder TikTok-Werbekonto einkaufen willst.',
  ],
  handling: [
    'Bei Contentmarkt laufen Kampagnen-Setup, Materialbereitstellung (z. B. für Clipping), Einreichung über eine eigene Creator-App, automatisierte Briefing- und View-Prüfung sowie die Abrechnung geschlossen über die Plattform. Für größere Teams nennt der Anbieter eigene Agentur-Zugänge.',
    'Bei UGC VZ startest du Kampagnen direkt im Browser-Workspace ohne App-Zwang: Du legst Budget-Deckel, Zielplattformen (TikTok, Instagram, YouTube) und Briefing-Checkliste fest, prüfst eingereichte Links, verfolgst geprüfte Views im Live-Report und rechnest zentral über dein Wallet ab. Parallel bleiben direkte Creator-Kontakte für klassische Paid-Ads-Produktionen möglich.',
    'In der Praxis lohnt sich der Blick auf die Kombination: Viele Marken testen zunächst mit einem festen View-Budget, welche Creator-Gesichter und Hooks organisch zünden, und buchen die stärksten Creator anschließend direkt für skalierbare Paid-Social-Creatives.',
  ],
  questionsIntro:
    'Wenn du Pay-per-View-Plattformen wie Contentmarkt und UGC VZ vergleichst, helfen diese konkreten Prüffragen:',
  questions: [
    'Gebührentransparenz: Wie viel Prozent deines Budgets kommen real beim Creator an, und fallen versteckte Auflade- oder Servicegebühren an?',
    'Plattform-Abdeckung: Brauchst du neben TikTok und Instagram auch YouTube Shorts oder direkte Videodateien für dein eigenes Werbekonto?',
    'Nutzungsrechte: Darfst du erfolgreiche Clips aus einer View-Kampagne anschließend auch als bezahlte Werbeanzeige auf Meta oder TikTok schalten?',
    'Budget-Kontrolle: Greift der Budget-Deckel technisch hart, und wie werden gelöschte oder nicht öffentliche Beiträge behandelt?',
    'Direktzugang: Kannst du leistungsstarke Creator nach einer Kampagne direkt für Folgeproduktionen oder Retainer kontaktieren?',
  ],
  notFor: [
    'UGC VZ setzt im Gegensatz zu Contentmarkt nicht auf eine native Smartphone-App für Massen-Clipping-Communities, sondern auf eine schlanke Web-Plattform für DACH-Creator und Marken. Wer gezielt große Clipping-Netzwerke über eine dedizierte App und externe Agentur-Sitze steuern will, sollte sich Contentmarkt genau ansehen.',
    'Auch wenn du hunderte anonyme Clip-Reposter aus bestehendem Podcast- oder Streaming-Rohmaterial suchst, ist ein spezialisiertes Clipping-Netzwerk stärker darauf zugeschnitten als unser kuratierter Pool aus echten DACH-UGC-Creatorn.',
  ],
  conclusion: [
    `Contentmarkt ist eine starke Option, wenn dein Fokus auf App-gestützten Clipping-Kampagnen und hoher organischer Verbreitung auf TikTok und Instagram liegt. ${c.bestFor}`,
    `UGC VZ ist die richtige Wahl, wenn du im DACH-Raum volle Gebührentransparenz (15 % im Marken-Budget, 0 % für Creator, kein Abo) für View-Kampagnen suchst und zusätzlich direkten Zugang zu echten Creatorn für deine eigenen Performance-Ads möchtest. ${own.bestFor}`,
  ],
});

export const vergleichCopy: Record<string, CopyBuilder> = {
  speekly,
  influee,
  'stylink-ugc': stylink,
  boksi,
  noovid,
  contentmarkt,
};

export function hasPageCopy(slug: string): boolean {
  return slug in vergleichCopy;
}

/**
 * Fallback für Wettbewerber ohne eigenen Text. Enthält ausschließlich Angaben,
 * die bereits in `competitors.ts` mit Quelle hinterlegt sind.
 * `scripts/validate-competitors.ts` erzwingt, dass keine Seite hier landet.
 */
function fallbackCopy(c: Competitor, own: Competitor): PageCopy {
  const pricing = c.pricing.isPublic
    ? `Laut Anbieterseite gilt: ${c.pricing.value}.`
    : `${c.name} veröffentlicht auf der eigenen Website keine Preise für Brands. In unserer Tabelle steht deshalb „nicht öffentlich" statt einer Schätzung.`;
  return {
    pricingDetail: [
      pricing,
      `Bei UGC VZ gilt: ${own.pricing.value} (${own.commission.value}).`,
    ],
    handling: [
      `Bei ${c.name} gilt zum Creator-Kontakt: ${c.directContact.value}. Bei UGC VZ dagegen: ${own.directContact.value}.`,
      'So wählst du je nach Kampagne zwischen budgetgedeckelter Workspace-Abwicklung und direkter Zusammenarbeit mit dem Creator.',
    ],
    questionsIntro: 'Unabhängig vom Anbieter solltest du vor der Buchung klären:',
    questions: [
      'Nutzungsrechte: Kanäle, Laufzeit, Märkte und ob Paid Social eingeschlossen ist.',
      'Lieferform: fertiges Video, Rohmaterial oder beides.',
      'Korrekturen: wie viele Feedbackrunden eingeschlossen sind.',
      'Zeitplan und Zahlung: Liefertermin, Abnahme und was bei Verzug gilt.',
    ],
    notFor: [
      `Der Pool ist fokussierter: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei ${c.name}.`,
      'UGC VZ bietet kein internationales Enterprise-Account-Management über dutzende Länder, sondern einen schlanken Self-Service für den DACH-Raum.',
    ],
    conclusion: [c.bestFor, own.bestFor],
  };
}

export function getPageCopy(c: Competitor, own: Competitor): PageCopy {
  const builder = vergleichCopy[c.slug];
  return builder ? builder(c, own) : fallbackCopy(c, own);
}
