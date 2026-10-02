// Ausfuehrlicher Text der Nischen-Landingpages, getrennt von niches.ts: Die
// Such-Chips (Client) importieren niches.ts und sollen diesen Text nicht
// mitladen. Die Hinweise zu Recht sind allgemeine Orientierung, keine Rechtsberatung.
export type NicheExtras = {
  audience: string;
  mistakes: { title: string; text: string }[];
  legal: string;
  faq: { question: string; answer: string }[];
};

export const NICHE_EXTRAS: Record<string, NicheExtras> = {
  beauty: {
    audience: 'Beauty-UGC läuft vor allem auf Instagram Reels und TikTok. Reels eignen sich für Routinen und Vorher/Nachher, TikTok für schnelle Hooks. Für Paid Ads sollte das Material hochkant (9:16) und ohne eingebrannte Plattform-Logos geliefert werden. Wichtiger als Reichweite ist die passende Haut- und Haarsituation: Ein Creator mit demselben Hauttyp wie die Zielgruppe wirkt glaubwürdiger als der größte Account.',
    mistakes: [
      { title: 'Zu viele Botschaften in einem Video', text: 'Ein Video, ein Versprechen. Wer Duft, Preis, Inhaltsstoffe und Anwendung in 25 Sekunden packt, verliert alle vier.' },
      { title: 'Produkt ohne Vorlauf schicken', text: 'Ohne Zeit für die Anwendung gibt es keine ehrlichen Ergebnisse. Bei Pflegeprodukten ein bis zwei Wochen einplanen.' },
      { title: 'Skript bis ins Detail vorgeben', text: 'Starre Texte wirken wie Werbung. Besser: Kernbotschaft, Pflichtangaben und No-Gos nennen, den Rest dem Creator überlassen.' },
    ],
    legal: 'Bei Kosmetik gelten Regeln für Werbeaussagen: keine Heil- oder Behandlungsversprechen, Vorher/Nachher nur mit realen, unbearbeiteten Ergebnissen. Als Werbung gekennzeichnete Beiträge müssen erkennbar sein, die Kennzeichnung liegt bei Creator und Brand gemeinsam in der Verantwortung.',
    faq: [
      { question: 'Wie lange dauert es bis zum ersten Beauty-Video?', answer: 'Nach der Zusage meist ein bis drei Wochen, je nach Versand und Testzeitraum. Ein Express-Dreh ohne Anwendung ist möglich, wirkt aber weniger glaubwürdig.' },
      { question: 'Welche Rechte brauche ich für Beauty-Videos in Anzeigen?', answer: "Üblich sind Rechte für Meta und TikTok Ads über 3 bis 12 Monate. Bei Beauty zusätzlich festhalten, ob Schnitt, Untertitel, Kürzungen und Hook-Varianten erlaubt sind und ob Vorher/Nachher-Material auch separat genutzt werden darf." },
      { question: 'Kann ich mehrere Hook-Varianten bestellen?', answer: 'Ja. Üblich sind zwei bis drei Einstiege zur selben Botschaft. Das lässt sich als Paket mit dem Creator vereinbaren und ist meist günstiger als Einzelvideos.' },
      { question: 'Was gehört in ein Beauty-Briefing?', answer: 'Produkt und Hauptnutzen, Zielgruppe (Alter, Hauttyp), Tonalität, Pflichtaussagen und No-Gos, Format und Länge, Frist, Vergütung und Nutzungsrechte.' },
    ],
  },
  food: {
    audience: 'Food-Videos funktionieren auf Instagram Reels, TikTok und YouTube Shorts, besonders in den Abendstunden und am Wochenende. Hochkant, mit Hook in den ersten zwei Sekunden und gut sichtbarem Produkt. Sprache und Region zählen: Rezepte für den deutschen Alltag (Zutaten, Mengen, Supermarkt) wirken näher als internationale Food-Trends.',
    mistakes: [
      { title: 'Produkt zu spät oder nicht frisch senden', text: 'Haltbarkeit, Kühlkette und Versandzeit gehören in die Planung, sonst verschiebt sich der Dreh.' },
      { title: 'Aufwand bei „Ware gegen Content“ unterschätzen', text: 'Einkaufen, Kochen, Aufräumen und Schneiden kosten Stunden. Wer nur ein Probierpaket bietet, bekommt oft Absagen.' },
      { title: 'Zutatenangaben vergessen', text: 'Allergene und Zutaten gehören ins Briefing, besonders bei Nahrungsergänzung, Getränken und Babynahrung.' },
    ],
    legal: 'Bei Lebensmitteln sind gesundheitsbezogene Aussagen („stärkt“, „entgiftet“) streng geregelt (Health-Claims-Verordnung). Creator sollten Geschmack und Anwendung beschreiben, keine Wirkung versprechen. Werbung muss gekennzeichnet sein.',
    faq: [
      { question: 'Wie viele Rezeptvideos sollte ich bestellen?', answer: 'Für einen Test reichen zwei bis drei verschiedene Rezepte von zwei Creatorn. So zeigt sich, welcher Einstieg und welches Gericht besser funktioniert.' },
      { question: 'Wie lange darf ich Food-Videos in Anzeigen nutzen?', answer: "Die Laufzeit steht im Vertrag, oft 3 bis 12 Monate. Bei saisonalen Produkten reicht eine Saison. Eine Option zur Verlängerung sowie die Nutzung auf Shop, Produktseite und Marktplätzen lassen sich gleich mitvereinbaren." },
      { question: 'Muss das Produkt im Rezept die Hauptrolle spielen?', answer: 'Für Anzeigen ja, das Produkt sollte in den ersten Sekunden sichtbar sein. Für organische Inhalte darf es Teil des Rezepts sein, solange es klar benannt wird.' },
      { question: 'Wie lange dauert ein Food-UGC-Projekt?', answer: 'Meist ein bis drei Wochen: Versand, Einkauf, Dreh und Schnitt. Bei saisonalen Produkten (Weihnachten, Grillen) früh anfragen.' },
    ],
  },
  'app-demo': {
    audience: 'App-Demos laufen auf TikTok, Instagram Reels und YouTube Shorts, in Anzeigen vor allem auf Meta und TikTok. Wichtig sind eine saubere Bildschirmaufnahme in guter Auflösung und eine klare Stimme. Zielgruppen unterscheiden sich stark nach Alter und Nutzungssituation: eine Budget-App für Studierende braucht andere Gesichter als eine Business-App für Selbstständige.',
    mistakes: [
      { title: 'Feature-Liste statt Nutzen', text: 'Wer fünf Funktionen aufzählt, überzeugt niemanden. Ein konkretes Problem und eine konkrete Lösung in drei Schritten reicht.' },
      { title: 'Kein Testzugang bereitstellen', text: 'Ohne Premium-Zugang oder Beispieldaten kann der Creator die App nicht glaubwürdig zeigen.' },
      { title: 'Keine messbare Handlung vorgeben', text: 'Ohne Promo-Code, Store-Link oder UTM-Parameter lässt sich nicht sehen, welcher Creator Downloads bringt.' },
    ],
    legal: 'Bei Apps zählen Datenschutz und Wahrheitsgehalt: Keine Versprechen, die die App nicht hält (z. B. Verdienst- oder Sparbeträge ohne Beleg). Werbung muss erkennbar sein. Bei Fremdinhalten im Screen-Recording (Marken, Personen) auf Rechte achten.',
    faq: [
      { question: 'Brauche ich ein Skript für App-Demos?', answer: 'Ein Skript oder eine Stichpunktliste hilft sehr. Kernnutzen in den ersten Sekunden, ein Call-to-Action am Ende und eine Liste der Dinge, die nicht gesagt werden dürfen.' },
      { question: 'Dürfen App-Videos auch im Store und auf der Website laufen?', answer: "Nur, wenn es vereinbart ist. Rechte lassen sich nach Orten staffeln: Paid Ads, App-Store-Seite, Website, Social-Kanäle der Brand. Auch festlegen, was nach einem größeren App-Update passiert, wenn das Video nicht mehr zur Oberfläche passt." },
      { question: 'Wie viele Creator für den ersten Test?', answer: 'Drei Creator mit unterschiedlichem Stil und je einem Hook liefern genug Daten, um Gesichter und Einstiege zu vergleichen.' },
      { question: 'Kann ich Screen-Recordings selbst liefern?', answer: 'Ja, das ist oft sinnvoll. Der Creator nimmt Stimme und Gesicht auf, die Brand liefert die Bildschirmaufnahme und Details zum Ablauf.' },
    ],
  },
  'mode-fashion': {
    audience: 'Mode-UGC läuft stark auf Instagram und TikTok, ergänzt durch Pinterest und YouTube. Entscheidend ist, dass Größe, Körpertyp und Stil der Creatorin zur Zielgruppe passen. Für Anzeigen sind Ganzkörper-Aufnahmen bei Tageslicht und ein klar sichtbares Etikett oder Logo hilfreich, ohne dass es nach Katalog aussieht.',
    mistakes: [
      { title: 'Größen und Passform vergessen', text: 'Ohne Größenangabe passt das Teil nicht, und das Video wirkt unglaubwürdig. Maße des Creators und Größentabelle vorab abgleichen.' },
      { title: 'Zu enge Style-Vorgaben', text: 'Wenn jedes Outfit vorgeschrieben ist, geht der persönliche Stil verloren. Besser eine Stilrichtung und zwei Referenzvideos.' },
      { title: 'Rückgabe nicht geklärt', text: 'Ob das Teil zurückgeschickt werden muss oder zur Vergütung gehört, am besten vor dem Versand schriftlich festhalten.' },
    ],
    legal: 'Bei Mode gilt: Werbung kennzeichnen, Materialangaben und Pflegehinweise nicht falsch darstellen. Markennamen Dritter im Bild nur mit Absprache. Nutzungsrechte für Shop und Paid Ads sind getrennt zu vereinbaren.',
    faq: [
      { question: 'Bekommen Creator die Teile zum Behalten?', answer: 'Häufig ja, bei hochwertigen Stücken kann das Teil Teil der Vergütung sein. Das sollte im Briefing stehen, am besten mit Warenwert.' },
      { question: 'Brauche ich für Shop und Produktseite eigene Rechte?', answer: "Ja, Rechte gelten nur für das, was vereinbart wurde. Shop, Produktseite, Newsletter und Paid Ads getrennt aufführen. Wer das Gesicht des Creators zeigt, braucht außerdem dessen Einwilligung für Zweck und Laufzeit." },
      { question: 'Welche Creator passen zu Premium-Mode?', answer: 'Creator mit gepflegtem Bild, ruhigem Schnitt und Erfahrung mit Marken. Portfolio-Videos zeigen schnell, ob der Stil passt.' },
      { question: 'Wie plane ich Mode-UGC saisonal?', answer: 'Vier bis sechs Wochen vor Saisonstart anfragen. Winter- und Weihnachtsmode wird oft schon im Spätsommer gedreht.' },
    ],
  },
  'home-interior': {
    audience: 'Interior-Inhalte laufen auf Instagram, TikTok und Pinterest. Sie leben von Licht und Atmosphäre: Tageslicht für Möbel und Textilien, Abendstimmung für Lampen und Kerzen. Zielgruppe und Wohnsituation (Altbau, Neubau, Mietwohnung) beeinflussen, welche Creator passen, nicht nur der Stil der Marke.',
    mistakes: [
      { title: 'Produktgröße und Aufbau nicht erklärt', text: 'Bei Möbeln und Lampen entscheidet Aufbauaufwand über die Dreh-Zeit. Maße, Gewicht und Aufbauanleitung im Briefing nennen.' },
      { title: 'Versand sperriger Produkte unterschätzen', text: 'Sperrgut kostet Zeit und Geld. Rücksendung oder Behalten vorab klären.' },
      { title: 'Raum passt nicht zur Marke', text: 'Ein skandinavisches Produkt im überladenen Wohnzimmer verliert Wirkung. Wohnstil der Creatorin vorab im Portfolio prüfen.' },
    ],
    legal: 'Bei Elektro-Dekoration (Lampen, Lichterketten) gelten Sicherheitskennzeichnungen. Aussagen zu Material, Herkunft und Nachhaltigkeit müssen belegbar sein. Werbung kennzeichnen.',
    faq: [
      { question: 'Welche Videoformate eignen sich für Interior?', answer: 'Unboxing, Room-Makeover, Abendstimmung und Styling-Tipps. Hochkant, mit ruhiger Kamera und gutem Licht.' },
      { question: 'Darf ich Interior-Videos auch auf Produktseiten und Marktplätzen nutzen?', answer: "Nur mit entsprechender Vereinbarung. Shop, Marktplätze und Paid Ads getrennt festlegen. Auf Fremdmarken im Hintergrund, Personen und persönliche Gegenstände achten, die im Bild sichtbar sind." },
      { question: 'Wie wichtig ist Tageslicht?', answer: 'Sehr. Möbel und Textilien wirken bei Tageslicht natürlicher, Lampen dagegen am Abend. Im Briefing die gewünschte Lichtstimmung nennen.' },
      { question: 'Kann ich Produkte vor dem Dreh testen lassen?', answer: 'Ja, besonders bei größeren Stücken sinnvoll. Ein Testzeitraum von einigen Tagen macht die Darstellung ehrlicher.' },
    ],
  },
  'mama-familie': {
    audience: 'Mama- und Familien-Content läuft vor allem auf Instagram und TikTok, oft in kleinen Gruppen mit hoher Interaktion. Entscheidend sind Alter der Kinder und Anlass: Kita-Start, Einschulung, Babyphase oder Schwangerschaft sprechen unterschiedliche Eltern an. Viele Creatorinnen drehen bewusst ohne Kinder im Bild, was im Briefing früh geklärt werden muss.',
    mistakes: [
      { title: 'Kinder im Bild voraussetzen', text: 'Viele Mama-Creator zeigen ihre Kinder nicht. Wer Kinder im Bild möchte, sollte das ausdrücklich fragen und passende Creator gezielt auswählen.' },
      { title: 'Zu kurze Fristen', text: 'Familienalltag lässt sich schlecht kurzfristig drehen. Mindestens zwei Wochen Vorlauf einplanen.' },
      { title: 'Sicherheitsaussagen ohne Beleg', text: 'Aussagen zu Sicherheit oder Eignung für Babys müssen belegt sein. Besser nur zeigen, wie das Produkt benutzt wird.' },
    ],
    legal: 'Bei Videos mit Kindern sind Persönlichkeitsrechte besonders sensibel: Einwilligung der Sorgeberechtigten und klare Regeln zur Nutzung (Dauer, Plattform) sind wichtig. Produkte für Babys und Kleinkinder unterliegen Sicherheitsvorgaben, Aussagen dazu müssen stimmen.',
    faq: [
      { question: 'Zeigen Mama-Creator ihre Kinder in Videos?', answer: 'Nicht alle. Manche drehen bewusst ohne Kinder. Im Briefing klar sagen, ob Kinder im Bild sein sollen, und passende Creator gezielt anfragen.' },
      { question: 'Wie sind Nutzungsrechte bei Videos mit Kindern geregelt?', answer: "Sorgeberechtigte müssen der Nutzung zustimmen, am besten schriftlich mit Zweck, Plattformen und Laufzeit. Kürzere Laufzeiten und eine klare Löschregel nach Ablauf sind üblich, ebenso das Verbot, das Material für andere Zwecke zu nutzen." },
      { question: 'Wann sollte ich Back-to-School-Videos anfragen?', answer: 'Sechs bis acht Wochen vor Schul- oder Kita-Start. So bleibt Zeit für Versand, Dreh und Schnitt.' },
      { question: 'Welche Reichweite ist bei Mama-Creatorn sinnvoll?', answer: 'Mittlere Reichweiten mit aktiver Community funktionieren oft besser als große Accounts. Entscheidend ist die Glaubwürdigkeit im Familienalltag.' },
    ],
  },
  'finanzen-talking-head': {
    audience: 'Talking-Head-Videos laufen auf TikTok, Instagram Reels und Meta-Anzeigen. Das Gesicht ist das Produkt: Alter, Beruf, Dialekt und Tonalität sollten zur Zielgruppe passen, z. B. Handwerk, Pflege oder Büro bei Versicherungsthemen. Reichweite ist zweitrangig, Verständlichkeit und Ruhe vor der Kamera zählen.',
    mistakes: [
      { title: 'Skript zu spät oder zu lang', text: 'Ein Skript für 30 bis 45 Sekunden bleibt bei etwa 80 bis 110 Wörtern. Längere Texte wirken abgelesen.' },
      { title: 'Pflichtangaben vergessen', text: 'Bei Finanz- und Versicherungsthemen gehören Pflichtangaben und erlaubte Aussagen in die Vorgaben, nicht erst in die Korrekturschleife.' },
      { title: 'Falsche Gesichter für die Zielgruppe', text: 'Eine Kampagne für Auszubildende braucht andere Gesichter als eine für Selbstständige. Alter und Beruf vorab festlegen.' },
    ],
    legal: 'Finanz-, Versicherungs- und Gesundheitsthemen unterliegen strengen Vorgaben zur Werbung. Skript und Aussagen sollte die Brand rechtlich prüfen lassen; Creator sprechen, was vorgegeben ist. Werbung muss gekennzeichnet sein.',
    faq: [
      { question: 'Wie lang sollte ein Talking-Head-Video sein?', answer: 'Meist 30 bis 45 Sekunden. Kürzere Clips (15 bis 20 Sekunden) eignen sich als Hook-Variante für Anzeigen.' },
      { question: 'Welche Rechte und Laufzeit sind bei Talking-Head-Ads üblich?', answer: "Oft 12 Monate für Meta und TikTok. Weil das Gesicht des Creators im Mittelpunkt steht, sollten Laufzeit, Plattformen und Ende der Nutzung genau festgehalten werden. Das Material darf nicht für andere Produkte oder Kampagnen weiterverwendet werden." },
      { question: 'Wer schreibt das Skript?', answer: 'Bei erklärungsbedürftigen Themen meist die Brand, damit Aussagen und Pflichtangaben stimmen. Der Creator passt Sprache und Tonalität an.' },
      { question: 'Wie finde ich glaubwürdige Gesichter?', answer: 'Portfolio-Videos ansehen und auf Sprechweise, Ruhe und Natürlichkeit achten. Berufsnahe Creator können für bestimmte Zielgruppen besonders glaubwürdig wirken.' },
    ],
  },
  'fitness-wellness': {
    audience: 'Fitness-UGC läuft auf TikTok, Instagram Reels und YouTube Shorts. Starke Zeiten sind Jahresanfang, Frühjahr und der Herbst-Neustart. Entscheidend sind Zielgruppe und Trainingsniveau: Anfänger, Heimtraining, Kraftsport und Yoga sprechen unterschiedliche Communities an. Authentische Routinen schlagen perfekt inszenierte Studio-Aufnahmen.',
    mistakes: [
      { title: 'Wirkversprechen im Skript', text: '„Nimmt 5 Kilo in 2 Wochen ab“ ist kein zulässiges Versprechen. Besser Erfahrung und Anwendung beschreiben.' },
      { title: 'Zu kurzer Testzeitraum', text: 'Für glaubwürdige Ergebnisse braucht es Wochen, nicht Tage. Zeitraum im Briefing und Terminplan festhalten.' },
      { title: 'Supplements ohne Einnahmehinweis', text: 'Dosierung, Allergene und Hinweise gehören in die Vorgaben, damit der Creator nichts Falsches sagt.' },
    ],
    legal: 'Gesundheitsbezogene Aussagen und Wirkversprechen bei Supplements und Ernährung sind streng reguliert (Health-Claims-Verordnung). Creator dürfen Erfahrung schildern, keine Heil- oder Abnehmversprechen machen. Werbung muss gekennzeichnet sein.',
    faq: [
      { question: 'Welche Plattform eignet sich für Fitness-UGC?', answer: 'TikTok und Instagram Reels für Reichweite und Hooks, YouTube Shorts für langlebigere Inhalte. Für Anzeigen reicht hochkantes Material.' },
      { question: 'Darf ich Fitness-Videos nach dem Test weiter in Anzeigen nutzen?', answer: "Nur im vereinbarten Rahmen. Ändert sich das Produkt (Rezeptur, Verpackung), stimmen Aussagen im Video eventuell nicht mehr. Deshalb Laufzeit begrenzen und Vorher/Nachher-Material sowie Produktaussagen gesondert regeln." },
      { question: 'Brauche ich Creator mit Fitness-Ausbildung?', answer: 'Nicht zwingend. Für Erfahrungsberichte reicht echte Nutzung. Bei Trainingsanleitungen sind Qualifikation und Sicherheit wichtiger.' },
      { question: 'Wann ist die beste Zeit für Fitness-Kampagnen?', answer: 'Januar bis März und der Herbst-Neustart. Für diese Phasen vier bis sechs Wochen vorher anfragen.' },
    ],
  },
  'maenner-grooming': {
    audience: 'Grooming- und Männer-Content läuft auf TikTok, Instagram Reels und YouTube Shorts. Gefragt sind klare Anwendung, ehrliche Meinung und Alltagsnähe. Wichtig sind äußere Vorgaben: Bartwuchs, Alter, Hauttyp und Sprache sollten vorab stehen, damit die richtigen Creator antworten.',
    mistakes: [
      { title: 'Anforderungen zu spät nennen', text: 'Wer erst nach der Zusage erwähnt, dass „Stoppeln“ nötig sind oder Rasur vor der Kamera, verliert Creator und Zeit.' },
      { title: 'Synchro statt Muttersprache', text: 'Dubbing und Untertitel wirken schnell unglaubwürdig. Wenn Muttersprache nötig ist, vorab festlegen.' },
      { title: 'Zu wenige Creator anfragen', text: 'Männliche Creator sind im Verzeichnis in der Minderheit. Deshalb mehrere anfragen und früh starten.' },
    ],
    legal: 'Bei Pflege- und Rasierprodukten gelten die Regeln für Kosmetik: keine Heilversprechen, nur belegbare Aussagen. Werbung muss gekennzeichnet sein. Rasur und Pflege vor der Kamera gehören ins Briefing, damit der Creator zustimmen kann.',
    faq: [
      { question: 'Gibt es genug männliche Creator für Grooming?', answer: 'Männliche Creator machen einen kleineren Teil der Profile aus. Mit klaren Anforderungen und früher Anfrage steigt die Antwortquote.' },
      { question: 'Wie lange darf ich Grooming-Videos mit dem Gesicht des Creators nutzen?', answer: "Typisch sind 6 bis 12 Monate für Paid Ads, mit Option auf Verlängerung. Persönlichkeitsrechte bleiben beim Creator: keine Nutzung für andere Produkte und keine Weitergabe an Dritte ohne neue Absprache." },
      { question: 'Können Creator vor der Kamera rasieren?', answer: 'Viele ja, wenn es im Briefing steht. Vorbereitungszeit (z. B. Bartwuchs) und mehrere Takes sollten vorab abgestimmt werden.' },
      { question: 'Welche Videolänge ist üblich?', answer: 'Zwischen 20 und 45 Sekunden. Für Anzeigen funktionieren kurze Hooks mit Problem und Lösung gut.' },
    ],
  },
  'reisen-outdoor': {
    audience: 'Outdoor- und Reise-Content läuft auf Instagram Reels, TikTok und YouTube. Er ist stark saisonabhängig: Frühjahr bis Sommer für Camping und Wandern, Winter für Ski und Wärme. Entscheidend ist, dass die Creator tatsächlich draußen unterwegs sind, nicht nur Bildmaterial nachstellen. Länge der Videos reicht von 15 Sekunden bis zu kleinen Vlogs.',
    mistakes: [
      { title: 'Zu spät für die Saison anfragen', text: 'Für Sommerprodukte braucht es mehrere Wochen Vorlauf, damit Wetter und Reisen eingeplant werden können.' },
      { title: 'Posing statt Nutzung', text: 'Videos, in denen das Produkt wirklich benutzt wird, überzeugen mehr als gestellte Szenen. Das Briefing sollte reale Situationen beschreiben.' },
      { title: 'Rechte an Orten und Personen übersehen', text: 'Aufnahmen an Sehenswürdigkeiten, Campingplätzen oder mit fremden Personen können Genehmigungen brauchen.' },
    ],
    legal: 'Bei Outdoor-Aufnahmen sind Drohnen-, Ort- und Personenrechte zu beachten. Sicherheitsaussagen zu Produkten (z. B. Wasserdichtigkeit, Belastbarkeit) müssen belegbar sein. Werbung muss gekennzeichnet sein.',
    faq: [
      { question: 'Wie lange dauert ein Outdoor-Produkttest?', answer: 'Ein bis vier Wochen sind realistisch, je nach Wetter und Anlass. Das sollte im Terminplan stehen.' },
      { question: 'Welche Rechte gelten bei Outdoor- und Reisevideos?', answer: "Neben den Nutzungsrechten am Video zählen Musik, Drohnenaufnahmen, Orte und abgebildete Personen. Eigene oder lizenzfreie Musik verwenden, Genehmigungen für Drohnen und Drehorte klären und Fremde nur mit Einwilligung zeigen." },
      { question: 'Eignen sich Reise-Creator auch für Alltagsprodukte?', answer: 'Ja, etwa für Gepäck, Pflege oder Tech unterwegs, wenn das Produkt in einer Reisesituation sinnvoll vorkommt.' },
      { question: 'Brauchen Creator eigene Ausrüstung?', answer: 'Bei Outdoor-Produkten oft ja, z. B. für Wandern oder Camping. Passende Ausrüstung im Profil oder Portfolio prüfen.' },
    ],
  },
  'hunde-haustiere': {
    audience: 'Haustier-Content läuft auf Instagram, TikTok und YouTube und wird stark geteilt. Wichtig sind Tierart, Größe, Alter und Temperament des Tiers: Ein kleiner Hund braucht andere Produkte als ein Welpe oder eine Katze. Reaktionen des Tiers sind der Beweis, deshalb brauchen Videos Geduld und mehrere Takes.',
    mistakes: [
      { title: 'Tierart und Größe nicht angeben', text: 'Futter, Spielzeug und Zubehör passen nicht für jedes Tier. Alle Anforderungen früh nennen.' },
      { title: 'Keine Zeit für mehrere Takes', text: 'Tiere machen nicht auf Kommando mit. Frist und Budget sollten Wiederholungen einkalkulieren.' },
      { title: 'Unverträglichkeiten übersehen', text: 'Bei Futter und Snacks müssen Allergien und Verträglichkeit vor dem Dreh geklärt sein, um Tiere nicht zu gefährden.' },
    ],
    legal: 'Für Tierfutter und -zubehör gelten Kennzeichnungs- und Sicherheitsvorgaben. Gesundheitsaussagen (z. B. „für gesundes Fell“) müssen belegbar sein, am besten zurückhaltend formulieren. Werbung muss gekennzeichnet sein.',
    faq: [
      { question: 'Brauchen Creator ein eigenes Tier?', answer: 'Ja, glaubwürdige Videos entstehen mit dem eigenen Tier. Art, Größe und Alter sollten zum Produkt passen und im Briefing stehen.' },
      { question: 'Wem gehören die Rechte an Videos mit dem Tier des Creators?', answer: "Die Urheberrechte liegen beim Creator, die Brand erhält ein Nutzungsrecht für Zweck, Plattformen und Laufzeit. Auch das Tier erscheint im Bild: Weiterverwendung für andere Produkte oder Kanäle gesondert vereinbaren." },
      { question: 'Wie lange dauert ein Haustier-Video?', answer: 'Länger als bei Produkten ohne Tier, weil mehrere Takes nötig sind. Das sollte bei Frist und Budget bedacht werden.' },
      { question: 'Welche Produkte eignen sich gut als UGC?', answer: 'Snacks, Spielzeug, Zubehör und Pflegeprodukte, bei denen die Reaktion des Tiers sichtbar ist. Für erklärungsbedürftige Produkte helfen kurze Erklär-Clips.' },
    ],
  },
};
