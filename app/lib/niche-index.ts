// Kleiner Index der Nischen (Slug, Chip, Beispiel-Briefing): wird von Client-Komponenten
// geladen (Such-Chips, Footer) und enthaelt bewusst keinen Seitentext.
export type NicheIndexEntry = { slug: string; /** Abweichender Pfad fuer bereits bestehende Seiten (Beauty). */ path?: string; chip: string; /** Vorbelegung der Suche, zugleich das Beispiel-Briefing am Chip. */ query: string };

export const NICHE_INDEX: NicheIndexEntry[] = [
  { slug: 'beauty', path: '/brands/ugc-creator-beauty', chip: 'Beauty-Reels', query: 'Ich suche Creator für eine Produktdemo einer Hautpflege-Marke auf Instagram Reels.' },
  { slug: 'food', chip: 'Food-Videos', query: 'Ich suche Food-Creator für kurze deutschsprachige Rezept- und Produktvideos.' },
  { slug: 'app-demo', chip: 'App-Demo', query: 'Ich suche Creator für eine deutschsprachige App-Demo als TikTok-Video.' },
  { slug: 'mode-fashion', chip: 'Mode & Fashion', query: 'Ich suche Creator für kurze TikTok-Videos zu einer Mode-Marke (z. B. Poloshirts), gegen Vergütung.' },
  { slug: 'home-interior', chip: 'Home & Interior', query: 'Ich suche Creator zwischen 18 und 35 für Unboxing- und Anwendungsvideos zu Lampen und Wohn-Deko in gemütlicher Wohnumgebung.' },
  { slug: 'mama-familie', chip: 'Mama & Familie', query: 'Ich suche Mamas zwischen 30 und 45 mit Kindern (2 bis 8 Jahre) für authentische Alltagsvideos zu einem Familienprodukt.' },
  { slug: 'finanzen-talking-head', chip: 'Finanzen & Talking-Head', query: 'Ich suche glaubwürdige deutschsprachige Creator zwischen 20 und 35 für kurze Talking-Head-Videos (hochkant, Skript wird gestellt) für Meta- und TikTok-Anzeigen.' },
  { slug: 'fitness-wellness', chip: 'Fitness & Wellness', query: 'Ich suche Fitness-Creatorinnen für ein TikTok-Produktvideo zu einer Wellness-Marke.' },
  { slug: 'maenner-grooming', chip: 'Männer & Grooming', query: 'Ich suche männliche Creator zwischen 28 und 45 für Produktvideos zu Pflege- und Rasierprodukten.' },
  { slug: 'reisen-outdoor', chip: 'Reisen & Outdoor', query: 'Ich suche Creator aus den Bereichen Camping, Outdoor und Reisen für ehrliche Alltagsvideos zu einem Outdoor-Produkt.' },
  { slug: 'hunde-haustiere', chip: 'Hunde & Haustiere', query: 'Ich suche Creator mit Hund oder Katze für authentische Alltagsvideos zu einem Haustier-Produkt (z. B. Futter, Spielzeug oder Zubehör).' },
];

export const nichePath = (niche: { slug: string; path?: string }) => niche.path || `/brands/ugc-creator/${niche.slug}`;
