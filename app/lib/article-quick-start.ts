type ArticleQuickStart = {
  answer: string;
  checklist: string[];
  target: 'creator' | 'brand';
  href: string;
  label: string;
};

const creatorAction = { target: 'creator' as const, href: '/creator#creator-form', label: 'Kostenloses Creator-Profil anlegen' };
const priceAction = {
  target: 'brand' as const,
  href: '/brands#q=' + encodeURIComponent('Ich suche deutschsprachige Creator für Produktvideos. Bitte zeige mir Profile mit Preisvorstellungen und Arbeitsproben.'),
  label: 'Creator mit Preisvorstellung entdecken',
};

const quickStarts: Record<string, ArticleQuickStart> = {
  'ugc-portfolio-so-ueberzeugst-du-brands-in-7-schritten': {
    answer: 'Ein UGC-Portfolio zeigt ausgewählte Arbeitsproben, deinen Content-Stil und dein Angebot. Eine eigene Website oder viele Follower sind dafür nicht nötig.',
    checklist: ['Zeige 3–5 passende Arbeitsproben mit kurzem Kontext.', 'Beschrifte selbst erstellte Übungsarbeiten eindeutig.', 'Prüfe, ob Brands die Links ohne Anmeldung öffnen können.'],
    ...creatorAction, label: 'Dein Portfolio im Creator-Profil zeigen',
  },
  'ugc-verdienst-wie-viel-kann-man-wirklich-verdienen': {
    answer: 'UGC-Einnahmen hängen von Aufträgen, Aufwand und Nutzungsrechten ab. Ein vereinbartes Honorar ist Umsatz; nach Kosten, Abgaben und unbezahlter Akquise bleibt weniger übrig.',
    checklist: ['Kalkuliere Konzept, Dreh, Schnitt und Korrekturen.', 'Trenne Content-Produktion von zusätzlichen Nutzungsrechten.', 'Zeige Portfolio und Preisvorstellung, damit Brands dein Angebot einordnen können.'],
    ...creatorAction,
  },
  'ugc-video-preise-komplette-kosten-uebersicht-2025': {
    answer: 'Ein UGC-Video hat keinen einheitlichen Marktpreis. Vergleiche Angebote anhand von Umfang, Varianten, Korrekturen und Nutzungsrechten; eine einzelne Zahl ist dafür zu wenig.',
    checklist: ['Definiere Anzahl, Länge und Format der Videos.', 'Kläre organische Nutzung und bezahlte Werbung getrennt.', 'Frage nach Gesamtpreis und enthaltenen Leistungen.'],
    ...priceAction,
  },
  'ugc-creator-preise-in-deutschland-realistische-ranges-2024': {
    answer: 'Preisvorstellungen im Creator-Profil sind ein Ausgangspunkt für die Anfrage. Ein verbindliches Angebot braucht ein Briefing mit Lieferumfang und Nutzungsrechten.',
    checklist: ['Vergleiche denselben Leistungsumfang.', 'Berücksichtige zusätzliche Hooks, Versionen und Rohmaterial.', 'Lass dir Dauer und Kanäle der Nutzung bestätigen.'],
    ...priceAction,
  },
  'ugc-creator-pitches-wie-sie-marken-ueberzeugen': {
    answer: 'Ein guter UGC-Pitch verbindet ein konkretes Produkt mit einer passenden Content-Idee und einer relevanten Arbeitsprobe. Er verspricht keine Ergebnisse, die du nicht belegen kannst.',
    checklist: ['Nenne eine konkrete Idee für die Marke.', 'Verlinke eine dazu passende Arbeitsprobe.', 'Schlage einen klaren nächsten Schritt vor.'],
    ...creatorAction,
  },
  'ugc-video-preise-2026-was-kostet-user-generated-content-wirklich': {
    answer: 'Ein einzelnes UGC-Video liegt in Deutschland meist zwischen 150 und 2.500 € – entscheidend sind Format, Zusatz-Hooks und Nutzungsrechte für Paid Ads.',
    checklist: ['Kalkuliere Produktion und Paid-Ads-Rechte getrennt.', 'Plane ab 3 Videos mit Paketpreisen und mehreren Hooks.', 'Vergleiche budgetgedeckelte View-Kampagnen und Direktkontakt gegen Abo-Marktplätze.'],
    target: 'brand',
    href: '/brands/ugc-kosten-rechner',
    label: 'Budget im UGC Kosten Rechner kalkulieren',
  },
  'ugc-vertrag-12-schutz-klauseln-fuer-brands-creator': {
    answer: 'Ein sauberer UGC-Vertrag regelt Deliverables, Nutzungsrechte (§ 31 UrhG), Korrekturen, Lieferfrist und Vergütung schriftlich, bevor gedreht wird.',
    checklist: ['Trenne organische Nutzung, Paid Ads und Whitelisting/Spark Ads.', 'Lege Laufzeit (z. B. 6–12 Monate) und Korrekturrunden fest.', 'Nutze eine strukturierte Vorlage statt loser DM-Absprachen.'],
    target: 'brand',
    href: '/brands/ugc-vertrag-vorlage',
    label: 'UGC-Vertrag & Anfrage-Text kostenlos generieren',
  },
  'ugc-briefing-25-must-haves-vorlage-fuer-perfekten-content': {
    answer: 'Ein klares 1-Seiten-Briefing mit Zielgruppe, Hook-Richtung, Produkt-Claims und Do’s & Don’ts spart 80 % der späteren Korrekturschleifen.',
    checklist: ['Definiere Zielplattform, Länge und gewünschte Hooks.', 'Nenne klare No-Gos und rechtliche Grenzen (z. B. Heilversprechen).', 'Gib Budget und Nutzungsrechte direkt bei der Anfrage an.'],
    target: 'brand',
    href: '/brands/ugc-vertrag-vorlage',
    label: 'Briefing- & Vertrags-Generator öffnen',
  },
  'ugc-brief-das-1-seiten-briefing-fuer-schnelle-produktionen': {
    answer: 'Gute Creator brauchen kein 15-Seiten-PDF, sondern ein präzises 1-Seiten-Briefing mit Kernbotschaft, Format, Timing und Rechteumfang.',
    checklist: ['Ein Ziel pro Video statt fünf verschiedene Botschaften.', '2–3 Hook-Ideen für Paid-Social-Tests vorgeben.', 'Briefing direkt mit passenden Creatorn aus dem DACH-Pool starten.'],
    target: 'brand',
    href: '/brands',
    label: 'Schnell-Briefing starten & Creator finden',
  },
  'ugc-plattformen-vergleich-2024-auswahl-nach-budget-branche': {
    answer: 'Viele Marktplätze binden dich mit Abo oder starren Stückpreisen. UGC VZ kombiniert ohne Monatsabo View-Kampagnen mit Budget-Deckel (15 % im Marken-Budget, 0 % für Creator) und direkten Creator-Kontakt.',
    checklist: ['Vergleiche Gesamtkosten inkl. Abo, Fee und Nutzungsrechten.', 'Prüfe, ob du View-Kampagnen mit Budget-Deckel oder feste Einzelvideos brauchst.', 'Sieh dir alle Konditionen transparent auf ugc-vz.de/preise an.'],
    target: 'brand',
    href: '/vergleich',
    label: 'Aktuellen Plattform-Vergleich 2026 ansehen',
  },
  'ugc-creator-finden-17-wege-ohne-agentur-fuer-erfolgreiches-marketing': {
    answer: 'Statt kalter Instagram-DMs findest du über ein kuratiertes Verzeichnis in wenigen Minuten prüfbare Profile mit Portfolio und Preisvorstellung.',
    checklist: ['Starte mit Branche, Format und Budgetrahmen.', 'Prüfe echte Arbeitsproben statt nur Followerzahlen.', 'Frage 3–5 Favoriten gleichzeitig kostenlos an.'],
    target: 'brand',
    href: '/brands',
    label: 'Creator jetzt kostenlos im Verzeichnis finden',
  },
};

export function getArticleQuickStart(slug: string): ArticleQuickStart | null {
  return quickStarts[slug] || null;
}
