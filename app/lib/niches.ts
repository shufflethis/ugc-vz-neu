// Inhalte der Nischen-Landingpages /brands/ugc-creator/[nische]. Eine Quelle
// fuer Seiten, Sitemap und die Beispiel-Chips der Suche (SearchBox). Die Zahlen
// auf den Seiten kommen live aus den Profilen (app/lib/niche-data.ts); hier
// steht nur redaktioneller Text. Die Tipps stammen aus echten Brand-Anfragen.
import type { NicheMatch } from '@/app/lib/niche-data';
import { NICHE_INDEX, nichePath, type NicheIndexEntry } from '@/app/lib/niche-index';

export type Niche = NicheIndexEntry & {
  h1: string;
  title: string;
  description: string;
  intro: string;
  match: NicheMatch;
  ideas: { title: string; text: string }[];
  tips: string[];
  faq: { question: string; answer: string }[];
  related: string[];
};

type NicheDetails = Omit<Niche, 'path' | 'chip' | 'query'>;

const DETAILS: NicheDetails[] = [
  {
    slug: 'beauty',
    h1: 'UGC Creator für Beauty & Hautpflege finden',
    title: 'UGC Creator für Beauty Brands finden',
    description: 'Beauty UGC Creator finden: Produktdemo, Routine, Testimonial oder Social Ad für Kosmetik-, Pflege- und Beauty-Marken. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Beauty-UGC überzeugt, wenn Anwendung, Hautgefühl und Ergebnis glaubwürdig gezeigt werden – ohne Studio-Look. Entscheidend sind Hauttyp, Routine und ehrliche Details.',
    match: { text: /beauty|kosmetik|skincare|hautpflege|pflege|make-?up|schmink|haare|haircare|nagel|parf/ },
    ideas: [
      { title: 'Routine statt Werbespot', text: 'Morgen- oder Abendroutine, in der das Produkt natürlich vorkommt („Get ready with me“).' },
      { title: 'Vorher/Nachher & Zeitraum-Test', text: '14 oder 30 Tage Anwendung, Fortschritt in kurzen Clips, ehrliches Fazit.' },
      { title: 'Unboxing mit erster Anwendung', text: 'Verpackung, Konsistenz, Duft und erster Eindruck – gut als Hook für Paid Ads.' },
      { title: 'Testimonial: Warum ich gewechselt habe', text: 'Problem, bisherige Lösung, Wechselgrund. Starke Einwandbehandlung (Preis, empfindliche Haut).' },
      { title: 'Hook-Varianten parallel testen', text: 'Gleiche Botschaft, drei Einstiege, mehrere Creator – schnell sehen, was performt.' },
    ],
    tips: [
      'Hauttyp, Alter und Zielgruppe der gewünschten Creator nennen.',
      'Muster früh versenden und Versandzeit einplanen.',
      'Nutzungsrechte und Laufzeit für Paid Ads vorab klären.',
      'Keine Heilversprechen im Skript – Kosmetik darf nicht heilen oder behandeln.',
    ],
    faq: [
      { question: 'Brauchen Beauty-Creator Produktmuster?', answer: 'Ja. Für glaubwürdige Anwendungsvideos sollte das Produkt vor dem Dreh beim Creator sein. Versandzeit und Größe der Muster gehören ins Briefing.' },
      { question: 'Wie viele Creator sollte ich für einen ersten Test anfragen?', answer: 'Drei bis fünf Creator mit je zwei Hook-Varianten liefern genug Vergleichsmaterial für den ersten Paid-Test.' },
    ],
    related: ['mode-fashion', 'maenner-grooming', 'fitness-wellness'],
  },
  {
    slug: 'food',
    h1: 'UGC Creator für Food-Videos & Rezepte finden',
    title: 'UGC Creator für Food-Videos finden',
    description: 'Food UGC Creator finden: Rezeptvideos, Taste Tests und Produktvideos für Lebensmittel- und Getränkemarken. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Food-UGC verkauft über Appetit und Alltagstauglichkeit: ein Rezept, ein Moment, ein erster Biss. Creator zeigen, wie ein Produkt wirklich verwendet wird.',
    match: { text: /food|essen|koch|rezept|backen|ernährung|trinken|getränk|kulinar|restaurant|café|cafe/ },
    ideas: [
      { title: 'Rezeptvideo mit Produkt', text: 'Ein einfaches Rezept, in dem das Produkt die Hauptrolle spielt – 20 bis 40 Sekunden.' },
      { title: 'Taste Test & erste Reaktion', text: 'Unverstellte Reaktion beim ersten Probieren, ideal als Hook.' },
      { title: '„3 Wege, X zu verwenden“', text: 'Drei schnelle Ideen aus dem Alltag, gut teilbar und speicherbar.' },
      { title: 'Probierbox / Unboxing', text: 'Mehrere Sorten oder ein Set, Geschmack und Verpackung im Überblick.' },
      { title: 'Alltag & Meal-Prep', text: 'Das Produkt als fester Teil von Frühstück, Lunchbox oder Wochenplanung.' },
    ],
    tips: [
      'Zutaten und Allergene angeben, besonders bei Nahrungsergänzung und Getränken.',
      'Produkt frisch und rechtzeitig senden, Haltbarkeit beachten.',
      'Bei Ware gegen Content den Aufwand fürs Kochen und Filmen bedenken – Menge oder Budget entsprechend wählen.',
      'Gesundheitsbezogene Aussagen vorab prüfen (Health-Claims-Verordnung).',
    ],
    faq: [
      { question: 'Arbeiten Food-Creator gegen Ware?', answer: 'Manche ja, viele wollen aber ein Honorar, weil Einkauf, Kochen und Dreh Zeit kosten. Vergütungsart im Briefing offen nennen, das beschleunigt Antworten.' },
      { question: 'Welche Formate funktionieren bei Food am besten?', answer: 'Kurze Rezeptvideos, Taste Tests und „3 Wege“-Clips. Hochkant, mit Hook in den ersten Sekunden.' },
    ],
    related: ['mama-familie', 'fitness-wellness', 'home-interior'],
  },
  {
    slug: 'app-demo',
    h1: 'UGC Creator für App-Demos & Tech-Produkte finden',
    title: 'UGC Creator für App-Demos finden',
    description: 'UGC Creator für App-Demos und Tech-Produkte finden: Screen-Recording, Erklärvideo und Testimonial für TikTok und Reels. Kostenlos, mit Preisen.',
    intro: 'App-UGC zeigt in Sekunden, welches Problem gelöst wird. Gute Videos kombinieren Screen-Recording, Stimme und einen klaren Nutzen – nicht den Feature-Katalog.',
    match: { text: /\bapps?\b|software|tech|saas|gadget|digital|gaming|\btools?\b/ },
    ideas: [
      { title: 'Screen-Recording mit Voiceover', text: 'Drei Schritte vom Problem zur Lösung, der Creator erklärt, was er tut.' },
      { title: '„So nutze ich X“', text: 'Alltagsnutzung in einer konkreten Situation statt Funktionsliste.' },
      { title: 'Problem-Lösung-Hook', text: 'Ein bekanntes Ärgernis in der ersten Sekunde, dann die App als Antwort.' },
      { title: 'First-Impression-Reaction', text: 'Erster Eindruck beim Ausprobieren, authentisch und ungeschönt.' },
      { title: 'Testimonial mit Ergebnis', text: 'Was hat sich nach einer Woche geändert? Konkrete Zahl oder Zeitersparnis.' },
    ],
    tips: [
      'Testzugang oder Premium-Account bereitstellen, bevor gedreht wird.',
      'Skript oder Stichpunkte mitgeben, den Nutzen in den ersten drei Sekunden nennen.',
      'Promo-Code oder Store-Link angeben, damit der Effekt messbar wird.',
      'Gewünschte Plattform nennen (TikTok, Reels, Shorts) und Länge festlegen.',
    ],
    faq: [
      { question: 'Brauchen App-Creator ein Skript?', answer: 'Eine Stichpunktliste reicht meist. Wichtig sind der Kernnutzen, ein Call-to-Action und was nicht gesagt werden darf.' },
      { question: 'Wie lange dauert ein App-Demo-Video?', answer: 'Meist 20 bis 45 Sekunden. Für Paid Ads vorab Varianten mit verschiedenen Hooks vereinbaren.' },
    ],
    related: ['finanzen-talking-head', 'fitness-wellness', 'reisen-outdoor'],
  },
  {
    slug: 'mode-fashion',
    h1: 'UGC Creator für Mode & Fashion finden',
    title: 'UGC Creator für Mode & Fashion finden',
    description: 'Mode UGC Creator finden: Outfit-Videos, Try-on und Styling für Fashion-, Schmuck- und Accessoire-Marken. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Mode-UGC lebt von Passform, Styling und Alltagstauglichkeit. Creator zeigen ein Teil in mehreren Looks und beantworten die Fragen, die Käufer wirklich haben.',
    match: { text: /mode|fashion|outfit|kleidung|schmuck|accessoire|streetwear|styling|(?<!life)style\b/ },
    ideas: [
      { title: 'Ein Teil, drei Looks', text: 'Dasselbe Stück in drei Kombinationen – zeigt Vielseitigkeit.' },
      { title: 'Try-on & Passform', text: 'Größe, Schnitt und Material am Körper, ehrliche Einschätzung.' },
      { title: 'Unboxing & erster Eindruck', text: 'Verpackung, Qualität, erster Wow-Moment.' },
      { title: 'Outfit-Check für Anlässe', text: 'Büro, Wochenende, Event – ein Produkt, mehrere Situationen.' },
      { title: 'Geschenkidee', text: 'Das Teil als Gift-Guide-Content, saisonal planbar.' },
    ],
    tips: [
      'Größen, Maße und gewünschte Körpertypen der Creator nennen.',
      'Rückgabe oder Behalten der Teile vorab klären.',
      'Stil der Marke mit Beispielen zeigen (Moodboard oder zwei Referenzvideos).',
      'Nutzungsrechte für Shop und Paid Ads gleich mit anfragen.',
    ],
    faq: [
      { question: 'Bekommen Mode-Creator die Teile zum Behalten?', answer: 'Meist ja, bei hochwertigen Stücken kann das Teil Teil der Vergütung sein. Das sollte im Briefing stehen.' },
      { question: 'Wie viele Varianten braucht ein Mode-Test?', answer: 'Zwei bis drei Creator mit unterschiedlichem Stil und je zwei Looks reichen für einen ersten Vergleich.' },
    ],
    related: ['beauty', 'maenner-grooming', 'home-interior'],
  },
  {
    slug: 'home-interior',
    h1: 'UGC Creator für Home & Interior finden',
    title: 'UGC Creator für Home & Interior finden',
    description: 'Interior UGC Creator finden: Unboxing, Room-Makeover und Wohnstyling für Möbel-, Deko- und Haushaltsmarken. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Interior-UGC verkauft Atmosphäre. Entscheidend ist, wie das Produkt im echten Zuhause wirkt – Licht, Größe, Stimmung und Aufbau.',
    match: { text: /interior|wohn|deko|einricht|möbel|haushalt|garten|living|\bhome\b/ },
    ideas: [
      { title: 'Unboxing & Aufbau', text: 'Auspacken, Aufbau, erster Platz im Raum – inklusive ehrlicher Details.' },
      { title: 'Room-Makeover', text: 'Vorher/Nachher mit dem Produkt als Veränderung des Raums.' },
      { title: 'Abendstimmung', text: 'Licht, Lampen und Textilien in Szene gesetzt, ideal für Herbst und Winter.' },
      { title: 'Alltagsnutzung', text: 'Das Produkt im täglichen Gebrauch statt nur als Deko.' },
      { title: 'Styling-Tipps', text: '„So kombiniere ich X“ – nützlich und speicherbar.' },
    ],
    tips: [
      'Größe, Gewicht und Aufbauaufwand des Produkts nennen, besonders bei Möbeln.',
      'Wohnumfeld beschreiben, das zur Marke passt (modern, skandinavisch, gemütlich).',
      'Bei sperrigen Produkten Versand und Rücksendung klären.',
      'Lichtstimmung für Videos abstimmen, bei Lampen am besten Abendaufnahmen.',
    ],
    faq: [
      { question: 'Welche Creator eignen sich für Interior-Produkte?', answer: 'Creator mit Fokus auf Wohnen und Deko, die ein passendes Zuhause zeigen. Der Stil des Raums sollte zur Marke passen.' },
      { question: 'Wer trägt die Kosten für sperrige Produkte?', answer: 'Üblicherweise sendet die Brand das Produkt kostenlos. Rücksendung oder Behalten sollte vorab geklärt sein.' },
    ],
    related: ['mama-familie', 'food', 'beauty'],
  },
  {
    slug: 'mama-familie',
    h1: 'UGC Creator für Mama & Familie finden',
    title: 'UGC Creator für Mama & Familie finden',
    description: 'Mama-Creator und Familien-UGC finden: Alltagsvideos, Back-to-School und Baby-Produkte. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Familien-UGC wirkt, wenn Eltern aus dem Alltag sprechen: Morgenroutine, Kita-Start, Handhabung. „Von Mama zu Mama“ schlägt klassische Werbung.',
    match: { text: /mama|\bmom\b|mutter|familie|family|baby|kinder|kids|eltern|schwanger/ },
    ideas: [
      { title: 'Morgenroutine mit Produkt', text: 'Das Produkt als selbstverständlicher Teil des Familienalltags.' },
      { title: 'Mama-zu-Mama-Empfehlung', text: 'Direkte, persönliche Ansprache mit ehrlicher Meinung.' },
      { title: 'Back-to-School & Kita', text: 'Saisonale Videos zu Schule, Kindergarten und neuen Routinen.' },
      { title: 'Baby- und Schwangerschaftsprodukte', text: 'Handhabung zeigen, Fragen beantworten, Sicherheit erklären.' },
      { title: 'Test über mehrere Tage', text: 'Erfahrungsbericht, wie sich das Produkt im Alltag bewährt.' },
    ],
    tips: [
      'Kinder nur nach Absprache im Bild: Viele Creator zeigen ihre Kinder bewusst nicht.',
      'Alter der Kinder und Familiensituation der gesuchten Creator nennen.',
      'Bei Aufnahmen mit Kindern Einwilligung und Nutzungsrechte besonders sorgfältig klären.',
      'Genug Vorlauf einplanen, Familienalltag lässt sich schlecht kurzfristig drehen.',
    ],
    faq: [
      { question: 'Zeigen Mama-Creator ihre Kinder im Video?', answer: 'Nicht alle. Manche drehen bewusst ohne Kinder. Im Briefing deshalb klar sagen, ob Kinder im Bild sein sollen, und passende Creator gezielt anfragen.' },
      { question: 'Welche Zielgruppe erreichen Mama-Creator?', answer: 'Eltern kleiner und schulpflichtiger Kinder. Alter der Kinder und Anlass (Kita, Schule, Alltag) im Briefing nennen.' },
    ],
    related: ['food', 'home-interior', 'hunde-haustiere'],
  },
  {
    slug: 'finanzen-talking-head',
    h1: 'UGC Creator für Finanzen & Talking-Head-Videos finden',
    title: 'UGC Creator für Finanzen & Talking-Head finden',
    description: 'Creator für Talking-Head-Videos zu Finanzen, Versicherung und Beruf finden: Skriptvideos für Meta- und TikTok-Ads. Kostenlos, mit Preisen.',
    intro: 'Bei erklärungsbedürftigen Themen zählt Glaubwürdigkeit. Talking-Head-Videos mit gestelltem Skript wirken, wenn Gesicht und Tonalität zur Zielgruppe passen.',
    match: { text: /finanz|versicher|business|b2b|karriere|bildung|beruf|geld|invest|steuer|immobil|coaching/ },
    ideas: [
      { title: 'Talking-Head, 30 bis 45 Sekunden', text: 'Ein Gesicht, ein Gedanke, klarer Call-to-Action – nach vorgegebenem Skript.' },
      { title: '„3 Fehler bei X“', text: 'Kurzer Erklär-Hook mit Nutzen, gut für Anzeigen.' },
      { title: 'Frage-Antwort-Format', text: 'Häufige Kundenfrage beantworten, in der Tonalität der Zielgruppe.' },
      { title: 'Erfahrungsbericht', text: 'Persönliche Geschichte mit klarer Einordnung, ohne Heilsversprechen.' },
      { title: 'Berufsbezogene Gesichter', text: 'Handwerk, Pflege, Büro: Creator, die die Zielgruppe glaubhaft repräsentieren.' },
    ],
    tips: [
      'Skript und Pflichtangaben von der Brand stellen lassen, Werbe- und Finanzrecht beachten.',
      'Alter, Beruf und Tonalität der gewünschten Gesichter beschreiben.',
      'Reichweite ist hier zweitrangig – Glaubwürdigkeit und Sprechweise entscheiden.',
      'Nutzungsrechte für Paid Ads (z. B. 12 Monate Meta und TikTok) von Anfang an nennen.',
    ],
    faq: [
      { question: 'Dürfen Creator Finanzprodukte bewerben?', answer: 'Ja, aber Aussagen und Pflichtangaben liegen in der Verantwortung der Brand. Ein geprüftes Skript schützt beide Seiten.' },
      { question: 'Welche Creator eignen sich für Talking-Head-Ads?', answer: 'Creator mit klarer Sprechweise und Erfahrung im Video, nicht zwingend große Reichweite. Portfolio-Beispiele helfen bei der Auswahl.' },
    ],
    related: ['app-demo', 'fitness-wellness', 'maenner-grooming'],
  },
  {
    slug: 'fitness-wellness',
    h1: 'UGC Creator für Fitness & Wellness finden',
    title: 'UGC Creator für Fitness & Wellness finden',
    description: 'Fitness UGC Creator finden: Workout-Videos, Supplements und Wellness-Produkte für TikTok und Reels. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Fitness- und Wellness-UGC lebt von Routine und Ergebnis. Authentische Workouts, Ernährung und Alltag zeigen, wie ein Produkt in den Alltag passt.',
    match: { text: /fitness|sport|gesundheit|health|wellness|yoga|training|workout|supplement|nahrungsergänzung/ },
    ideas: [
      { title: 'Workout mit Produkt', text: 'Das Produkt im Training, ob Equipment, Kleidung oder Shake.' },
      { title: '30-Tage-Challenge', text: 'Serie mit Zwischenstand und Fazit statt Einzelvideo.' },
      { title: 'Ernährung & Supplements', text: 'Einnahme im Alltag, Geschmack, Handhabung – ohne Wirkversprechen.' },
      { title: 'Morning- und Wellness-Routine', text: 'Das Produkt als fester Teil eines gesunden Alltags.' },
      { title: 'Equipment-Test', text: 'Ehrliche Einschätzung zu Qualität, Komfort und Preis.' },
    ],
    tips: [
      'Gesundheitsbezogene Aussagen und Wirkversprechen vorab prüfen (Health-Claims).',
      'Bei Supplements Einnahmehinweise und Allergene angeben.',
      'Equipment oder Produkt früh senden, damit ein Testzeitraum möglich ist.',
      'Saison berücksichtigen (Jahresanfang, Sommerfigur) und früh anfragen.',
    ],
    faq: [
      { question: 'Dürfen Creator Wirkung von Supplements versprechen?', answer: 'Nein. Gesundheitsbezogene Aussagen sind streng reguliert. Creator sollten Erfahrung und Anwendung schildern, nicht Heilung oder Wirkung zusichern.' },
      { question: 'Wie lange sollte ein Testzeitraum sein?', answer: 'Für glaubwürdige Ergebnisse oft zwei bis vier Wochen. Das muss im Briefing und in der Terminplanung stehen.' },
    ],
    related: ['food', 'maenner-grooming', 'reisen-outdoor'],
  },
  {
    slug: 'maenner-grooming',
    h1: 'Männliche UGC Creator für Grooming & Pflege finden',
    title: 'Männliche UGC Creator & Grooming finden',
    description: 'Männliche UGC Creator finden: Grooming, Rasur, Pflege und Lifestyle. Talking-Head und Produktvideos, kostenlos mit Preisen und Portfolio.',
    intro: 'Männliche Creator sind im Verzeichnis in der Minderheit. Für Grooming-Produkte zählen Glaubwürdigkeit, echte Anwendung und klare äußere Anforderungen.',
    match: { male: true },
    ideas: [
      { title: 'Rasur- und Pflegeroutine', text: 'Das Produkt in der echten Routine, im eigenen Bad gefilmt.' },
      { title: 'Ehrliches Review', text: 'Problem benennen, Produkt testen, ehrlich bewerten.' },
      { title: 'Problem-Lösung-Hook', text: 'Reizhaut, Rasur-Frust oder Zeitmangel als Einstieg.' },
      { title: 'Vergleich zum bisherigen Produkt', text: 'Warum der Wechsel, was ist besser, was nicht.' },
      { title: 'Geschenkset', text: 'Pflegeset als Geschenkidee, saisonal planbar.' },
    ],
    tips: [
      'Äußere Anforderungen früh nennen: Bartwuchs, Alter, Hauttyp, Sprachniveau.',
      'Muttersprache und Akzent festlegen, wenn Synchro oder Untertitel nicht möglich sind.',
      'Dreh im eigenen Bad abstimmen: Licht, Hintergrund, Rasur vor der Kamera.',
      'Bei mehreren Videos Paketpreis und Nutzungsrechte direkt vereinbaren.',
    ],
    faq: [
      { question: 'Gibt es genug männliche Creator?', answer: 'Männliche Creator machen nur einen kleinen Teil der Profile aus. Frühzeitig und mit klaren Anforderungen anfragen erhöht die Antwortquote.' },
      { question: 'Können Creator vor der Kamera rasieren?', answer: 'Viele können das, wenn es im Briefing steht. Vorbereitungszeit (z. B. Bartwuchs) und Wiederholungen sollten vorab abgestimmt sein.' },
    ],
    related: ['beauty', 'fitness-wellness', 'finanzen-talking-head'],
  },
  {
    slug: 'reisen-outdoor',
    h1: 'UGC Creator für Reisen & Outdoor finden',
    title: 'UGC Creator für Reisen & Outdoor finden',
    description: 'Reise- und Outdoor-Creator finden: Camping, Wandern, Vanlife und Travel-Produkte als UGC. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Outdoor-UGC zeigt Produkte unter echten Bedingungen: im Zelt, am Berg, unterwegs. Haltbarkeit und Handhabung zählen mehr als Hochglanz.',
    match: { text: /reise|travel|outdoor|camping|wander|urlaub|natur|vanlife|abenteuer|adventure/ },
    ideas: [
      { title: 'Packliste & Gear-Test', text: 'Das Produkt im Rucksack und im Einsatz, mit ehrlicher Einschätzung.' },
      { title: 'Camping-Setup am Morgen', text: 'Kaffee, Zelt, Sonnenaufgang – das Produkt als Teil der Szene.' },
      { title: 'Wetter- und Haltbarkeitstest', text: 'Wie hält sich das Produkt bei Regen, Kälte, Dreck?' },
      { title: 'Unterwegs-Hack', text: 'Ein nützlicher Trick mit dem Produkt, kurz und speicherbar.' },
      { title: 'Reise-Vlog mit Integration', text: 'Produkt natürlich in einen Reisetag eingebettet.' },
    ],
    tips: [
      'Jahreszeit und Wetter einplanen: Outdoor-Dreh braucht Vorlauf.',
      'Produkt langfristig testen lassen statt für einen einzelnen Clip.',
      'Rechte an Orten und abgebildeten Personen im Blick behalten.',
      'Echte Nutzung statt Posing: Szenen aus dem Alltag glaubwürdig briefen.',
    ],
    faq: [
      { question: 'Wann sollte ich Outdoor-Creator anfragen?', answer: 'Mehrere Wochen vor der Saison. Für Dreh und Test unter echten Bedingungen sollte Zeit sein.' },
      { question: 'Eignen sich Reise-Creator auch für Produkte ohne Outdoor-Bezug?', answer: 'Ja, etwa für Gepäck, Pflege oder Tech unterwegs. Das Produkt muss in einer Reisesituation sinnvoll vorkommen.' },
    ],
    related: ['fitness-wellness', 'app-demo', 'hunde-haustiere'],
  },
  {
    slug: 'hunde-haustiere',
    h1: 'UGC Creator mit Hund & Haustier finden',
    title: 'UGC Creator für Hunde & Haustiere finden',
    description: 'Creator mit Hund oder Katze finden: Futter, Spielzeug und Zubehör als UGC für Haustier-Marken. Kostenlos, mit Preisen und Portfolio.',
    intro: 'Haustier-UGC funktioniert, wenn das Tier wirklich mitmacht: Futterroutine, Spielzeug, Zubehör im Alltag. Die Reaktion des Tiers ist der Beweis.',
    match: { text: /haustier|hund|katze|\btiere?\b|\bpets?\b|\bcats?\b|\bdogs?\b/, pets: true },
    ideas: [
      { title: 'Unboxing mit Hund oder Katze', text: 'Das Tier entdeckt das Produkt, natürliche Reaktion als Hook.' },
      { title: 'Futter- und Snack-Test', text: 'Geschmackstest, Verträglichkeit und Handhabung im Alltag.' },
      { title: 'Spielzeug im Einsatz', text: 'Haltbarkeit, Spaßfaktor und Beschäftigung in einem kurzen Clip.' },
      { title: 'Zubehör im Alltag', text: 'Leine, Napf, Transportbox: Nutzen im echten Tagesablauf.' },
      { title: 'Tier-Routine', text: 'Morgen- oder Abendroutine mit dem Produkt als festem Bestandteil.' },
    ],
    tips: [
      'Tierart, Größe und Alter der Tiere nennen, bei Futter auch Unverträglichkeiten.',
      'Zeit einplanen: Tiere machen nicht auf Kommando mit, mehrere Takes sind normal.',
      'Produktsicherheit und Verträglichkeit vorab prüfen, besonders bei Futter und Spielzeug.',
      'Aussagen zu Gesundheit und Wirkung zurückhaltend halten.',
    ],
    faq: [
      { question: 'Brauchen Haustier-Creator ein eigenes Tier?', answer: 'Ja, glaubwürdige Videos entstehen mit dem eigenen Tier. Tierart und Größe sollten zum Produkt passen und im Briefing stehen.' },
      { question: 'Wie lange dauert ein Haustier-Video?', answer: 'Mehr als bei Produkten ohne Tier, da mehrere Takes nötig sind. Das sollte bei Frist und Budget bedacht werden.' },
    ],
    related: ['mama-familie', 'food', 'reisen-outdoor'],
  },
];

export const NICHES: Niche[] = DETAILS.map((details) => {
  const entry = NICHE_INDEX.find((item) => item.slug === details.slug);
  if (!entry) throw new Error(`Nische ohne Index-Eintrag: ${details.slug}`);
  return { ...entry, ...details };
});

export const nicheBySlug = (slug: string) => NICHES.find((niche) => niche.slug === slug);
export { nichePath };
