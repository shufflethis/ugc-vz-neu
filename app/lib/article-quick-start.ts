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
};

export function getArticleQuickStart(slug: string): ArticleQuickStart | null {
  return quickStarts[slug] || null;
}
