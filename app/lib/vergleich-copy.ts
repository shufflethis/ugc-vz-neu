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
    `Bei UGC VZ entfällt diese Rechnung ganz: Die Nutzung ist ${own.pricing.value}, es fällt ${own.commission.value} Provision an, und was du zahlst, vereinbarst du direkt mit dem Creator. Das ist kein besserer Preis, sondern ein anderer Vorgang — bei Speekly kaufst du ein Ergebnis, bei uns findest du eine Person, mit der du über das Ergebnis verhandelst.`,
  ],
  handling: [
    'Der praktische Unterschied liegt nicht im Preisniveau, sondern in der Frage, wer den Vertrag hält. Einen direkten Creator-Kontakt gibt es bei Speekly laut Anbieterangabe nicht: Die Kommunikation läuft über den Chat der Plattform, und der Auftrag ist ein Auftrag an Speekly. Bei UGC VZ bekommst du die Kontaktdaten der Creator, die du ausgewählt hast, und schließt die Vereinbarung direkt mit ihnen.',
    'Daran hängt der Rest. Wer stellt die Rechnung? Im Direktmodell der Creator — bei fünf Creatorn sind das fünf Rechnungen, fünf Zahlungsvorgänge und fünfmal die Frage, wie die Umsatzsteuer zu behandeln ist. Über eine Plattform ist das üblicherweise ein Vorgang mit einem Beleg. Wie es im Einzelfall geregelt ist, steht in den Vertragsbedingungen des jeweiligen Anbieters; wir geben sie hier nicht wieder, weil wir nur Angaben verwenden, die auf der Anbieterseite selbst stehen.',
    'Der zweite Punkt sind die Nutzungsrechte. Ein UGC-Video ist erst dann für Paid Social brauchbar, wenn geklärt ist, wie lange, auf welchen Kanälen und in welchen Märkten du es schalten darfst. Im Direktkontakt führst du dieses Gespräch selbst und kannst es auf deine Kampagne zuschneiden — inklusive Verlängerung, wenn ein Video überraschend gut läuft. Im Plattformmodell steht die Antwort in der Regel schon in den Bedingungen: bequemer, aber weniger verhandelbar.',
    'Der dritte Punkt ist der unangenehme: Was passiert, wenn nicht geliefert wird? Laut Anbieterangaben liefert Speekly fertig geschnittene Videos inklusive Revisionen bis zur Freigabe, nach etwa sieben Tagen. Dahinter steht ein Unternehmen, an das du dich halten kannst. Im Direktmodell gibt es diese Instanz nicht. Du hast eine Vereinbarung mit einer Person, und wenn die Person nicht liefert, ist das dein Thema. Genau deshalb lohnen sich ein schriftlicher Liefertermin, eine klare Abnahme und die Zahlung nach Abnahme statt vorab.',
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
    'Ein Verzeichnis ist kein Marktplatz, und an einigen Stellen ist das ein echter Nachteil. UGC VZ übernimmt keine Verträge, keine Zahlungsabwicklung und keine Prüfung des gelieferten Materials. Wir stellen den Kontakt her; alles danach liegt bei dir und dem Creator.',
    `Auch der Pool ist deutlich kleiner: ${own.creatorCount.value} stehen bei Speekly ${c.creatorCount.value} Creator gegenüber. Wer eine sehr spezielle Nische besetzt und viele Profile parallel sichten will, hat auf einem großen Marktplatz die besseren Karten.`,
    'Und es gibt bei uns keinen Preis, der schon feststeht. Ein Festpreis pro Video ist eine Dienstleistung: Du weißt vorher, was es kostet. Bei uns verhandelst du selbst. Das kann günstiger ausfallen, kostet aber Zeit und setzt eine Vorstellung von marktüblichen Honoraren voraus. Wenn dir für Briefing, Vertrag und Koordination die Zeit fehlt, kannst du bei UGC VZ optional Unterstützung anfragen — Voraussetzung für die kostenlose Nutzung ist das nicht.',
  ],
  conclusion: [
    'Wer planbare Fixpreise pro Video will und die Abwicklung bewusst abgibt, ist bei Speekly richtig: Der Anbieter ist genau dafür gebaut und veröffentlicht seine Preise nachprüfbar.',
    'Wer Creator selbst auswählen, direkt ansprechen und das Honorar frei verhandeln will — und bereit ist, Briefing, Vertrag und Zahlung selbst in die Hand zu nehmen —, kommt über ein kostenloses Verzeichnis schneller ans Ziel. Das ist ein Kategorieunterschied, keine Rangliste.',
  ],
});

const influee: CopyBuilder = (c, own) => ({
  pricingDetail: [
    `Influee weist seine Kosten in mehreren Bausteinen aus. Auf der Preisseite steht: ${c.pricing.value}. Diese Bausteine muss man zusammen betrachten, sonst rechnet man sich das Modell schön.`,
    'Der erste Baustein ist eine laufende Kostenposition. Ein Abo fällt monatlich an, unabhängig davon, wie viele Videos in diesem Monat entstehen. Für die Budgetplanung heißt das: Die Kosten pro Video hängen an der Menge. Wer im Monat zwanzig Videos abruft, verteilt das Abo auf zwanzig Videos. Wer eines abruft, trägt es allein. Ein Abomodell belohnt kontinuierliche Produktion und bestraft Pausen — genau umgekehrt zu einem Preis pro Stück.',
    `Der zweite Baustein ist die Vermittlungsgebühr: ${c.commission.value}. Sie skaliert mit dem, was du an Creator zahlst, nicht mit dem Abo. Der dritte Baustein ist das Creator-Honorar selbst, das im Abo nicht enthalten ist. Die auf der Influee-Startseite beworbenen „ab 76 €" beziffern diesen dritten Baustein — den Creator-Anteil, nicht den Gesamtpreis. Solche Verkürzungen sind der Grund, warum in unserer Tabelle jeder Wert auf die Anbieterseite verlinkt, auf der er steht.`,
    'Ein praktischer Hinweis zur Währung: Die Abopreise sind in US-Dollar ausgewiesen. Wer in Euro budgetiert, plant also zusätzlich mit einem Wechselkurs. Wir rechnen ihn hier bewusst nicht um — der Kurs ändert sich, die Anbieterangabe nicht.',
    `Bei UGC VZ existiert keiner dieser Bausteine: kein Abo, keine Gebühr, nur das Honorar, das du direkt mit dem Creator vereinbarst. Die Nutzung ist ${own.pricing.value}. Das ist kein Qualitätsurteil über Influee, sondern ein anderes Geschäftsmodell: Dort bekommst du laut Anbieterangaben die Abwicklung, einen KI-Videoeditor und einen Pool von ${c.creatorCount.value} — Leistungen, die ein Verzeichnis nicht erbringt.`,
  ],
  handling: [
    `Influee ist auf Volumen und Reichweite gebaut: ${c.creatorCount.value} Creator, ${c.markets.value}, dazu ein KI-Videoeditor mit automatischen Untertiteln in 65 Sprachen. Wer so etwas einsetzt, kauft nicht einzelne Videos, sondern eine Produktionsstrecke. Und die läuft über die Plattform — einen direkten Creator-Kontakt gibt es laut Anbieterangabe nicht.`,
    `Bei UGC VZ endet unsere Rolle beim Kontakt: Du bekommst die Kontaktdaten der Creator, die du ausgewählt hast. Was danach passiert, ist eine Vereinbarung zwischen dir und dem Creator, an der wir nicht beteiligt sind. Am deutlichsten wird der Unterschied bei den Nutzungsrechten. In einem internationalen Setup willst du wissen, in welchen Märkten und wie lange du ein Video schalten darfst. Auf einer Plattform steht die Antwort meist schon in den Bedingungen; im Direktkontakt vereinbarst du sie pro Creator und pro Kampagne.`,
    'Ähnlich bei der Abrechnung: Ein Abo plus Gebühr erzeugt einen Ansprechpartner und eine Kostenstelle. Direktverträge erzeugen so viele Rechnungen, wie du Creator beauftragst. Bei drei Creatorn pro Quartal fällt das nicht auf. Bei dreißig pro Monat ist es ein Prozess, den jemand im Team betreuen muss — und dieser Aufwand gehört ehrlicherweise in jede Kostenrechnung, die eine Plattformgebühr mit „kostenlos" vergleicht.',
    'Und der Fall, den niemand plant: Es wird nicht geliefert, oder das Ergebnis passt nicht zum Briefing. Im Plattformmodell gibt es eine Instanz, an die du dich wendest. Im Direktmodell gibt es sie nicht. Deshalb gehören Liefertermin, Abnahmekriterien und Zahlungszeitpunkt schriftlich in die Vereinbarung, bevor gedreht wird. Das ist kein Misstrauen, sondern die Arbeit, die eine Plattform sonst für dich erledigt.',
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
    `Beim Skalieren kann UGC VZ nicht mithalten. ${own.creatorCount.value} stehen ${c.creatorCount.value} gegenüber, und wir haben weder einen Videoeditor noch automatische Untertitel in 65 Sprachen. Unser Verzeichnis deckt ${own.markets.value} ab, nicht ${c.markets.value}.`,
    'Wir übernehmen außerdem keine Verträge, keine Zahlungsabwicklung und keine Kontrolle des gelieferten Materials. Wenn dein Prozess darauf angewiesen ist, dass eine Plattform Briefing, Auswahl, Rechte und Zahlung bündelt, ist ein Marktplatz die richtige Wahl — nicht ein Verzeichnis.',
    'Wer regelmäßig hohe Stückzahlen in mehreren Ländern produziert, sollte deshalb ehrlich rechnen: Ab einer gewissen Menge ist eine laufende Gebühr billiger als die Arbeitszeit, die Koordination im Direktmodell kostet. Für Briefing, Vertrag und Koordination kannst du bei UGC VZ optional Unterstützung anfragen; Voraussetzung für die kostenlose Nutzung ist das nicht.',
  ],
  conclusion: [
    'Wenn du kontinuierlich viel Content in mehreren Märkten produzierst, die Abwicklung abgeben willst und der größte Pool im Vergleich für dich zählt, ist Influee dafür gemacht. Ein Abomodell rechnet sich, sobald es sich auf genug Videos verteilt.',
    `Wenn du im deutschsprachigen Raum einzelne Kampagnen fährst, keine monatlich wiederkehrenden Kosten tragen willst und lieber direkt mit Creatorn sprichst, passt ein kostenloses Verzeichnis besser. ${own.bestFor}`,
  ],
});

const stylink: CopyBuilder = (c, own) => ({
  pricingDetail: [
    'Hier ist die ehrlichste Aussage die kürzeste: stylink UGC veröffentlicht auf der eigenen Website keine Preise für Brands. In unserer Tabelle steht deshalb „nicht öffentlich" — keine Spanne, keine Schätzung, kein erfundener Ab-Preis.',
    'Das ist kein Vorwurf. Individuelle Angebote sind im B2B verbreitet, und sie ergeben Sinn, wenn Umfang, Laufzeit und Rechteumfang stark schwanken. Für die Budgetplanung hat es aber eine konkrete Folge: Du kennst deine Kosten erst nach einem Gespräch. Wer drei Anbieter vergleichen will, führt drei Gespräche, bevor überhaupt eine Zahl auf dem Tisch liegt — und sollte diesen Zeitaufwand in die Planung einrechnen.',
    `Auf der Anbieterseite steht die Creator-Seite der Rechnung: eine Vergütung von „bis zu 200 € pro Video". Das ist der Betrag, mit dem Creator geworben werden, nicht der Preis, den eine Brand zahlt. Was die Plattform darüber hinaus berechnet, ist ${c.commission.value} ausgewiesen.`,
    'In Vergleichsartikeln kursieren konkrete Brand-Preise für stylink UGC. Wir führen sie nicht, weil sie sich auf der Anbieterseite nicht belegen lassen. Eine leere Zelle ist unbequem; ein falscher Wettbewerberpreis wäre schlimmer — für den Anbieter und für uns.',
    `Bei UGC VZ ist die Preisfrage in einem Satz beantwortet: Die Nutzung ist ${own.pricing.value}, es fällt ${own.commission.value} Provision an, und das Honorar verhandelst du direkt mit dem Creator. Was am Ende gezahlt wird, bestimmen also du und der Creator — nicht wir.`,
  ],
  handling: [
    'Der auffälligste Unterschied zwischen stylink UGC und einem Verzeichnis ist die Qualitätssicherung. stylink führt nach eigenen Angaben einen Content-Check durch, bevor das Material an die Brand geht, und nennt eine Durchlaufzeit von neun Tagen vom Auftrag zum Video. Das ist ein handfester Vorteil, wenn dein Team keine Kapazität hat, jedes Video zu sichten und Feedback zu formulieren.',
    'Bei UGC VZ gibt es diese Zwischenstufe nicht. Wir kuratieren das Verzeichnis, aber wir prüfen keine Kampagnenergebnisse. Die Qualitätssicherung liegt bei dir: Du siehst dir vorher Profile und Referenzvideos an, formulierst ein präzises Briefing und gibst danach selbst Feedback. Der Vorteil ist, dass du dieses Feedback ohne Umweg gibst: Du hast die Kontaktdaten des Creators und schreibst direkt.',
    `Der zweite Unterschied ist die Vertragsseite. Bei stylink UGC läuft die Abwicklung laut Anbieterangabe über die Plattform. Damit ist die Plattform der Ansprechpartner für Auftrag, Abnahme und Zahlung. Im Direktmodell bist du selbst die Instanz: Du vereinbarst Liefertermin und Abnahme, du zahlst, und du klärst die Nutzungsrechte. Wie lange darfst du das Video schalten, auf welchen Kanälen, in welchen Märkten? Diese Frage muss beantwortet werden, bevor gedreht wird — auf jeder Plattform und in jedem Direktvertrag.`,
    'Praktisch heißt Direktkontakt vor allem: kürzere Wege und mehr Verantwortung. Rückfragen zum Produkt beantwortest du selbst statt über ein Ticket. Eine Nachbesserung verhandelst du selbst. Und wenn ein Creator nicht liefert, gibt es niemanden, der einspringt. Wer regelmäßig arbeitet, baut sich aus diesen Direktkontakten mit der Zeit einen festen Stamm auf — das ist der eigentliche Gewinn des Modells.',
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
    `Ein Verzeichnis ersetzt keinen Marktplatz. UGC VZ übernimmt keine Verträge, keine Zahlungsabwicklung und keinen Content-Check. Wir sichern auch keine Durchlaufzeit zu — ob ein Creator in neun Tagen oder in drei Wochen liefert, ist Teil eurer Vereinbarung, nicht unserer.`,
    `Der Pool ist ebenfalls kleiner: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei stylink UGC. Wir kuratieren dafür auf den deutschsprachigen Raum, aber wer sehr viele Profile parallel sichten will, findet anderswo mehr Auswahl.`,
    'Für Teams ohne Kapazität für Briefing, Sichtung und Feedback ist ein Anbieter mit vorgeschalteter Prüfung deshalb die realistischere Wahl. Wenn dir nur an einzelnen Stellen Zeit fehlt, kannst du bei UGC VZ optional Unterstützung für Briefing, Vertrag und Koordination anfragen; die Nutzung des Verzeichnisses bleibt davon unberührt.',
  ],
  conclusion: [
    `Die Entscheidung lässt sich auf eine Frage zusammenziehen: Willst du eine vorgeschaltete Prüfung und eine zugesagte Lieferzeit, oder willst du den direkten Draht zum Creator? ${c.bestFor}`,
    `Wer stattdessen selbst auswählt, selbst das Briefing schreibt und selbst verhandelt, braucht keine Plattform dazwischen — sondern eine Liste mit erreichbaren Creatorn. ${own.bestFor}`,
    'Die Kurzfassung: Eine vorgeschaltete Prüfung nimmt dir Arbeit ab, ein Direktkontakt gibt dir Kontrolle über Auswahl, Honorar und Rechteumfang. Welche der beiden Seiten schwerer wiegt, hängt weniger vom Anbieter ab als von der Kapazität in deinem eigenen Team.',
  ],
});

const boksi: CopyBuilder = (c, own) => ({
  pricingDetail: [
    'Boksi veröffentlicht keine Preisliste für Brands. Die Website führt stattdessen zu einer kostenlosen Demo; ein individuelles Angebot wird laut Anbieter innerhalb eines Werktags erstellt. In unserer Tabelle steht deshalb „nicht öffentlich" — wir tragen dort keine Schätzung ein.',
    'Ein Angebotsmodell ist typisch, wenn nicht ein einzelnes Video verkauft wird, sondern eine Leistung mit variablem Umfang. Für die Budgetplanung heißt das: Am Anfang steht ein Briefing, nicht ein Preis. Du brauchst also zuerst eine belastbare Vorstellung von Kampagnenumfang, Laufzeit und gewünschtem Rechteumfang — sonst vergleichst du Angebote, die unterschiedliche Dinge enthalten.',
    `Was in ein solches Angebot einfließt, ist erkennbar mehr als eine Videodatei. Boksi nennt First-Party-Daten von Instagram und TikTok mit Performance-Tracking (Engagement, CPM, Conversion) und persönlichen Support mit Büros in Helsinki und Hamburg, dazu ${c.creatorCount.value} Creator und mehr als 3.500 umgesetzte Kampagnen. Solche Leistungen kosten Geld, und genau deshalb funktioniert ein Vergleich auf der reinen Preisebene hier nicht: Ein kostenloses Verzeichnis und ein betreuter Service verkaufen nicht dasselbe.`,
    'Wer Angebote vergleichen will, sollte deshalb vor der ersten Anfrage eine eigene Vergleichsgröße festlegen: dieselbe Anzahl Videos, dieselbe Länge, derselbe Rechteumfang, derselbe Zeitraum. Sonst vergleicht man am Ende ein Paket mit Betreuung gegen eine reine Lieferung, und der Unterschied fällt erst auf, wenn die Kampagne schon läuft. Dieselbe Vergleichsgröße hilft übrigens auch im Gespräch mit einzelnen Creatorn: Wer sagen kann, wie viele Videos in welcher Länge zu welchen Rechten gebraucht werden, bekommt schneller ein belastbares Honorarangebot.',
    `Auch die Gebührenseite ist bei Boksi ${c.commission.value} — was an Provision oder Servicegebühr anfällt, erfährst du im Angebot. Bei UGC VZ ist die Antwort öffentlich und kurz: Die Nutzung ist ${own.pricing.value}, es fällt ${own.commission.value} Provision an. Was du zahlst, ist das Honorar, das du mit dem Creator vereinbarst.`,
  ],
  handling: [
    `Boksi bündelt Kampagnen inklusive Reporting und Betreuung. Entsprechend läuft die Zusammenarbeit über die Plattform — einen direkten Creator-Kontakt gibt es laut Anbieterangabe nicht. Für die Brand heißt das, dass Auswahl, Abstimmung, Vertrag und Zahlung an einer Stelle zusammenlaufen und es einen Ansprechpartner gibt, wenn etwas klemmt.`,
    `UGC VZ arbeitet umgekehrt: Du bekommst die Kontaktdaten der ausgewählten Creator und sprichst selbst mit ihnen. Wir sind an der Transaktion nicht beteiligt. Das bedeutet vor allem Kontrolle — du wählst aus, du briefst, du verhandelst das Honorar, du bestimmst den Rechteumfang. Und es bedeutet Arbeit, denn all diese Schritte macht sonst niemand.`,
    'Vier Fragen entscheiden im Alltag, welches Modell besser passt. Wer hält den Vertrag? Im Direktmodell du selbst, mit jedem Creator einzeln. Wer zahlt den Creator? Ebenfalls du, direkt, mit so vielen Rechnungen, wie du Creator beauftragst. Wer klärt die Nutzungsrechte? Du, pro Video und pro Kanal. Und wer greift ein, wenn eine Lieferung ausbleibt? Im Direktmodell niemand — deshalb gehören Liefertermin, Abnahme und Zahlungszeitpunkt in eine schriftliche Vereinbarung, bevor gedreht wird.',
    'Der Unterschied wird beim Reporting am größten. Ein betreuter Service liefert Kennzahlen zur Kampagne mit. Im Direktmodell entstehen diese Zahlen in deinem eigenen Werbekonto — du hast sie, aber niemand bereitet sie für dich auf. Wer ohnehin mit eigenem Media-Buying arbeitet, verliert dadurch wenig. Wer die Auswertung mitkaufen will, verliert dadurch viel.',
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
    `Alles, was einen betreuten Service ausmacht, macht UGC VZ nicht: kein Kampagnenmanagement, kein Reporting, keine Performance-Daten, keine Verträge, keine Zahlungsabwicklung. Wir sind ein Verzeichnis — der Kontakt ist das Produkt, nicht die Kampagne.`,
    `Der Pool ist außerdem kleiner: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei Boksi. Und wir decken ${own.markets.value} ab, nicht ${c.markets.value}.`,
    'Auch die Auswahl bleibt bei uns Handarbeit. Du beschreibst, was du suchst, und bekommst passende Profile — die Entscheidung, wer wirklich zum Produkt passt, triffst am Ende aber du. Wer diese Entscheidungen delegieren möchte, kauft bei einem betreuten Service nicht in erster Linie Videos, sondern genau diese Vorarbeit.',
    'Für größere Brands, die Influencer-Marketing und UGC gebündelt mit Auswertung und fester Betreuung einkaufen wollen, ist ein Managed Service deshalb die passendere Bauform. Wenn dir nur punktuell Kapazität fehlt, kannst du bei UGC VZ optional Unterstützung für Briefing, Vertrag und Kampagnen-Setup anfragen — die Suche und die Kontaktanfrage bleiben kostenlos.',
  ],
  conclusion: [
    `Die Entscheidung ist keine Preisfrage, weil Boksi keine Preise veröffentlicht, mit denen sich rechnen ließe. Sie ist eine Frage des Umfangs. ${c.bestFor}`,
    `Wenn du dagegen weißt, welche Art von Creator du suchst, und die Zusammenarbeit selbst steuern willst, brauchst du keinen Service, sondern Kontaktdaten. ${own.bestFor}`,
  ],
});

export const vergleichCopy: Record<string, CopyBuilder> = {
  speekly,
  influee,
  'stylink-ugc': stylink,
  boksi,
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
      `Bei UGC VZ ist die Nutzung ${own.pricing.value}, es fällt ${own.commission.value} Provision an, und das Honorar verhandelst du direkt mit dem Creator.`,
    ],
    handling: [
      `Bei ${c.name} gilt zum Creator-Kontakt: ${c.directContact.value}. Bei UGC VZ dagegen: ${own.directContact.value}.`,
      'Daran hängt, wer den Vertrag hält, wer den Creator bezahlt und wer die Nutzungsrechte klärt. Im Direktmodell bist das jeweils du.',
    ],
    questionsIntro: 'Unabhängig vom Anbieter solltest du vor der Buchung klären:',
    questions: [
      'Nutzungsrechte: Kanäle, Laufzeit, Märkte — und ob Paid Social eingeschlossen ist.',
      'Lieferform: fertiges Video, Rohmaterial oder beides.',
      'Korrekturen: wie viele Feedbackrunden eingeschlossen sind.',
      'Zeitplan und Zahlung: Liefertermin, Abnahme und was bei Verzug gilt.',
    ],
    notFor: [
      'UGC VZ übernimmt keine Verträge, keine Zahlungsabwicklung und keine Prüfung des gelieferten Materials. Wir stellen den Kontakt her; alles danach liegt bei dir und dem Creator.',
      `Der Pool ist kleiner: ${own.creatorCount.value} gegenüber ${c.creatorCount.value} bei ${c.name}.`,
    ],
    conclusion: [c.bestFor, own.bestFor],
  };
}

export function getPageCopy(c: Competitor, own: Competitor): PageCopy {
  const builder = vergleichCopy[c.slug];
  return builder ? builder(c, own) : fallbackCopy(c, own);
}
