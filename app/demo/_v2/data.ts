export type DemoSection =
  | 'home'
  | 'konto'
  | 'bounties'
  | 'brands'
  | 'brand-affiliate-guide'
  | 'creator'
  | 'creator-tkp-guide'
  | 'agenturen'
  | 'vergleich'
  | 'strategie';

export type LocaleCode = 'de' | 'en' | 'es' | 'fr';

export interface LocaleConfig {
  code: LocaleCode;
  flag: string;
  label: string;
  domain: string;
  badge: string;
  heroTitleTop: string;
  heroTitleAccent: string;
  heroSub: string;
  ctaPrimary: string;
  ctaStrategy: string;
  creatorPill: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
}

export const LOCALES: Record<LocaleCode, LocaleConfig> = {
  de: {
    code: 'de',
    flag: '🇩🇪',
    label: 'DE',
    domain: 'ugc-vz.de',
    badge: '730+ geprüfte Creator · +40/Woche · 0 € Grundgebühr',
    heroTitleTop: 'Creator finden. Views kaufen.',
    heroTitleAccent: 'Eigene Clubs bauen.',
    heroSub:
      'Bei UGC VZ durchsuchst du 730+ echte Creator kostenlos, startest Pay-per-View Kampagnen oder baust dein eigenes Creator-Affiliate-Netzwerk auf.',
    ctaPrimary: 'KI-Suche & Skript-Generator testen',
    ctaStrategy: '15-Min Strategy Session buchen',
    creatorPill: 'Creator? Ab 2–5 € / 1.000 Views verdienen (+10 € Starter-Bonus) & Steuern per Autopilot regeln',
    pillar1Title: 'Offene KI-Datenbank (0 % Fee)',
    pillar1Desc: '730+ echte Profile mit Arbeitsproben ohne Login durchsuchen. KI-Briefings inklusive, Kontakt direkt.',
    pillar2Title: 'UGC Bounties (Pay-per-1k-Views)',
    pillar2Desc: 'Gesamtbudget & TKP festlegen (z. B. 3,50 € / 1.000 Views). Creator produzieren oder clippen auf TikTok, Reels & Shorts.',
    pillar3Title: 'Creator-Affiliate-Programm für Brands',
    pillar3Desc: 'Wir bauen deiner Marke ein eigenes Markenbotschafter- & Affiliate-Portal (Codes, Provision, Produkt-Tausch & Level 1–5) – ohne Fixgagen.',
  },
  en: {
    code: 'en',
    flag: '🇬🇧',
    label: 'EN',
    domain: 'databaseugc.com / ugcdb.si',
    badge: '730+ verified creators · +40/week · $0 subscription',
    heroTitleTop: 'Source Creators. Pay per View.',
    heroTitleAccent: 'Launch Brand Clubs.',
    heroSub:
      'Browse 730+ real human creators for free, launch CPM view-bounties in minutes, or deploy your own 5-tier affiliate creator ecosystem.',
    ctaPrimary: 'Try AI Search & Script Builder',
    ctaStrategy: 'Book 15-Min Strategy Session',
    creatorPill: 'Creator? Earn $2–$5 per 1,000 views (+$10 first-video bonus) with automated tax invoicing',
    pillar1Title: 'Open AI Directory (0% Cut)',
    pillar1Desc: 'Search 730+ vetted human UGC portfolios without login walls or monthly SaaS lock-in.',
    pillar2Title: 'UGC View Bounties (CPM)',
    pillar2Desc: 'Fund a campaign pool (e.g. $5,000 at $3.50 CPM). Creators post on TikTok, Reels & Shorts; AI verifies every view.',
    pillar3Title: 'Managed Creator Club (5-Tier)',
    pillar3Desc: 'Turnkey creator seeding & 5-tier affiliate ambassador portal for micro-creators starting at 500 followers.',
  },
  es: {
    code: 'es',
    flag: '🇪🇸',
    label: 'ES',
    domain: 'es.databaseugc.com',
    badge: '730+ creadores reales · +40/semana · 0 € cuota mensual',
    heroTitleTop: 'Encuentra Creadores. Paga por Vistas.',
    heroTitleAccent: 'Crea tu Club UGC.',
    heroSub:
      'Busca más de 730 creadores reales gratis, lanza campañas CPM por cada 1.000 visualizaciones en TikTok/Reels o activa tu propio club de afiliados en 5 niveles.',
    ctaPrimary: 'Probar IA de Briefings y Búsqueda',
    ctaStrategy: 'Reservar Strategy Session (15 min)',
    creatorPill: '¿Eres creador? Gana 2–5 € por cada 1.000 vistas (+10 € bono inicial) sin mínimo de seguidores',
    pillar1Title: 'Base de Datos Abierta (0 %)',
    pillar1Desc: 'Explora portfolios verificados sin registro obligatorio ni comisiones ocultas de agencia.',
    pillar2Title: 'UGC Bounties (Pago por 1k Vistas)',
    pillar2Desc: 'Define tu presupuesto total y CPM. Validación por IA y seguimiento de vistas en tiempo real.',
    pillar3Title: 'Club de Creadores (5 Niveles)',
    pillar3Desc: 'Portal propio de seeding y comisiones para activar cientos de micro-creadores cada día.',
  },
  fr: {
    code: 'fr',
    flag: '🇫🇷',
    label: 'FR',
    domain: 'fr.databaseugc.com',
    badge: '730+ créateurs vérifiés · +40/semaine · 0 € d’abonnement',
    heroTitleTop: 'Trouvez des Créateurs. Payez aux Vues.',
    heroTitleAccent: 'Lancez votre Club.',
    heroSub:
      'Explorez gratuitement 730+ créateurs UGC humains, lancez des campagnes au CPM sur TikTok & Reels ou déployez votre propre programme ambassadeur à 5 niveaux.',
    ctaPrimary: 'Tester la recherche & le brief IA',
    ctaStrategy: 'Réserver une Strategy Session',
    creatorPill: 'Créateur ? Gagnez 2 à 5 € / 1 000 vues (+10 € bonus 1ère vidéo) + facturation auto',
    pillar1Title: 'Annuaire IA Ouvert (0 %)',
    pillar1Desc: 'Accès direct aux portfolios et tarifs sans abonnement.',
    pillar2Title: 'UGC Bounties (Paiement aux 1k vues)',
    pillar2Desc: 'Définissez un budget fixe et un CPM clair. Validation IA et suivi en direct.',
    pillar3Title: 'Club Ambassadeurs (5 Niveaux)',
    pillar3Desc: 'Votre propre portail d’affiliation et de seeding produit clé en main dès 500 abonnés.',
  },
};

export interface AiPreset {
  id: string;
  chip: string;
  prompt: string;
  recommendedMode: 'club' | 'bounty' | 'direct';
  recommendedModeLabel: string;
  script: {
    hook: string;
    body: string;
    cta: string;
  };
  creators: {
    id: string;
    initials: string;
    name: string;
    city: string;
    followers: string;
    niche: string;
    fitScore: number;
    avgViews: string;
    modeTag: string;
  }[];
}

export const AI_PRESETS: AiPreset[] = [
  {
    id: 'protein-coffee',
    chip: 'Iced Protein Coffee (Creator-Seeding)',
    prompt: 'Protein-Eiskaffee für tägliche Morgenroutine, authentische Micro-Creator ab 800 Followern auf TikTok & Reels mit eigenem Rabattcode.',
    recommendedMode: 'club',
    recommendedModeLabel: 'Empfohlen: Eigenes 5-Level Creator-Club-Programm + Seeding',
    script: {
      hook: '0–3s Hook: „Ehrlich: Ich hab 4 € Starbucks-Eiskaffee komplett gestrichen – hier ist mein 20-Sekunden-Morgen-Hack mit 25 g Protein.“',
      body: '3–14s Alltagsszene: Eiswürfel ins Glas, Espresso + 1 Scoop direkt in der eigenen Küche schütteln (kein Hochglanz-Studio, 100 % nahbar). Kurzer Geschmackstest + Makro-Einblendung.',
      cta: '14–20s CTA: „Mit meinem Code spart ihr aktuell 10 % – Link & Sorte stehen unten in der Beschreibung.“ (Pflicht: Anzeige-Kennzeichnung)',
    },
    creators: [
      { id: 'UGC-MN01', initials: 'LA', name: 'Lara · Köln', city: 'Köln', followers: '1.850 Follower', niche: 'Abnehmen, Alltag & Rezepte', fitScore: 98, avgViews: '6.400 Ø Views', modeTag: 'Produkt-Seeding + Code' },
      { id: 'UGC-MN02', initials: 'SA', name: 'Sina · Hannover', city: 'Hannover', followers: '3.200 Follower', niche: 'Fitness-Reise & Morning Vlogs', fitScore: 96, avgViews: '11.200 Ø Views', modeTag: 'Level-Club Ready' },
      { id: 'UGC-MN03', initials: 'ME', name: 'Melina · Leipzig', city: 'Leipzig', followers: '940 Follower', niche: 'Food-Tests & Mealprep', fitScore: 94, avgViews: '4.100 Ø Views', modeTag: 'Tägliche Reels' },
    ],
  },
  {
    id: 'streetwear-drop',
    chip: 'Streetwear Love-Brand (Typ Nebelkind)',
    prompt: 'Limitierter Cap- & Hoodie-Drop einer deutschen Streetwear Love-Brand. Produktpaket + 3,50 € pro 1.000 Views Bounty auf TikTok.',
    recommendedMode: 'bounty',
    recommendedModeLabel: 'Empfohlen: Hybrid aus Produkt-Seeding + 3,50 € TKP Bounty',
    script: {
      hook: '0–3s Hook: „Warum trägt gefühlt halb Berlin plötzlich genau diesen Hoodie-Schnitt?“',
      body: '3–13s Fit-Check: Schneller Übergang vom ungestylten Basic zum kompletten Streetwear-Fit vor dem Spiegel / draußen. Detail-Shot auf Stickerei & schweren Stoff.',
      cta: '13–18s CTA: „Drop ist noch online – sagt ehrlich in den Kommentaren: Schwarz oder Washed Olive?“',
    },
    creators: [
      { id: 'UGC-ST01', initials: 'NO', name: 'Noah · Berlin', city: 'Berlin', followers: '8.400 Follower', niche: 'Streetwear, Fit-Checks & Sneaker', fitScore: 97, avgViews: '19.500 Ø Views', modeTag: 'Bounty + Seeding' },
      { id: 'UGC-ST02', initials: 'KI', name: 'Kira · Hamburg', city: 'Hamburg', followers: '4.100 Follower', niche: 'Urban Lifestyle & Thrift/Caps', fitScore: 95, avgViews: '14.000 Ø Views', modeTag: 'TikTok Native' },
      { id: 'UGC-ST03', initials: 'DA', name: 'David · München', city: 'München', followers: '2.600 Follower', niche: 'Menswear & Reels Transitions', fitScore: 92, avgViews: '7.800 Ø Views', modeTag: 'Sofort verfügbar' },
    ],
  },
  {
    id: 'creator-tax',
    chip: 'Steuer-App für Selbstständige',
    prompt: 'Ehrliche Storytime-Videos für eine Steuer-App: Wie Creator & Freelancer ohne teuren Steuerberater ihre Nebeneinnahmen in 5 Minuten versteuern.',
    recommendedMode: 'bounty',
    recommendedModeLabel: 'Empfohlen: 5,00 € TKP Bounty + Affiliate-Kickback pro Signup',
    script: {
      hook: '0–3s Hook: „Niemand redet darüber, wie hart das Finanzamt zuschlägt, wenn du deine ersten 300 € mit UGC verdienst…“',
      body: '3–15s Pain -> Lösung: Kurz zeigen, warum ein klassischer Steuerberater bei kleinen Gagen alles auffrisst – Screen-Recording der App: Beleg scannen, Live-Steuerrücklage sehen, fertig.',
      cta: '15–22s CTA: „Testet es kostenlos über den Link im Profil, bevor die nächste Vorauszahlung reinknallt.“',
    },
    creators: [
      { id: 'UGC-TX01', initials: 'JU', name: 'Julian · Frankfurt', city: 'Frankfurt', followers: '12.100 Follower', niche: 'Side-Hustle, Freelancing & Tech', fitScore: 99, avgViews: '24.000 Ø Views', modeTag: '5,00 € TKP + Lead' },
      { id: 'UGC-TX02', initials: 'MI', name: 'Miriam · Köln', city: 'Köln', followers: '5.300 Follower', niche: 'UGC Behind-the-Scenes & Business', fitScore: 96, avgViews: '9.600 Ø Views', modeTag: 'Creator-Zielgruppe' },
      { id: 'UGC-TX03', initials: 'TO', name: 'Tom · Wien', city: 'Wien', followers: '3.900 Follower', niche: 'App-Reviews & Produktivität', fitScore: 91, avgViews: '8.200 Ø Views', modeTag: 'DACH Fokus' },
    ],
  },
  {
    id: 'food-delivery',
    chip: 'Mealprep / Food-Box (Huel / PrepMyMeal)',
    prompt: 'Schnelle POV-Lunch-Videos im Homeoffice für fertige High-Protein-Meals. 20 Creator gleichzeitig zum Testen mit Rabatt-Incentive.',
    recommendedMode: 'direct',
    recommendedModeLabel: 'Empfohlen: Kostenlose KI-Auswahl + Managed Kampagnen-Paket',
    script: {
      hook: '0–3s Hook: „12:30 Uhr zwischen zwei Calls – null Zeit zum Kochen, aber keinen Bock mehr auf labbrige Liefer-Burger.“',
      body: '3–13s Produktbeweis: Deckel abziehen, 4 Minuten Pfanne/Mikrowelle, echter Dampf-Shot + Nährwerte-Check (48 g Protein, unter 600 kcal).',
      cta: '13–19s CTA: „Probierbox aktuell mit Neukunden-Rabatt – welches Gericht würdet ihr zuerst testen?“',
    },
    creators: [
      { id: 'UGC-FD01', initials: 'LE', name: 'Lea · München', city: 'München', followers: '6.700 Follower', niche: 'Homeoffice, Tech & High-Protein', fitScore: 97, avgViews: '13.400 Ø Views', modeTag: 'Paid Ads + Organic' },
      { id: 'UGC-FD02', initials: 'MA', name: 'Marco · Düsseldorf', city: 'Düsseldorf', followers: '2.900 Follower', niche: 'Gym, Ernährung & Alltag', fitScore: 95, avgViews: '8.900 Ø Views', modeTag: '0 % Provision' },
      { id: 'UGC-FD03', initials: 'EL', name: 'Elena · Stuttgart', city: 'Stuttgart', followers: '4.500 Follower', niche: 'Food-Unboxing & Paar-Alltag', fitScore: 93, avgViews: '10.100 Ø Views', modeTag: 'Raw + Cutdowns' },
    ],
  },
];

export interface BountyCampaign {
  id: string;
  brand: string;
  monogram: string;
  badge: string;
  isOwnCampaign?: boolean;
  type: 'Eigene Produktion' | 'Clipping / Repost' | 'Seeding + Views';
  title: string;
  summary: string;
  cpmEuro: number;
  totalBudget: number;
  spentBudget: number;
  maxPayoutPerVideo: number;
  starterBonus?: string;
  starterBonusFootnote?: string;
  platforms: ('TikTok' | 'IG Reels' | 'YT Shorts')[];
  activeCreators: number;
  minFollowers: string;
  requirements: string[];
  tracks?: { label: string; angle: string }[];
}

export const BOUNTY_CAMPAIGNS: BountyCampaign[] = [
  {
    id: 'ugcvz-launch',
    brand: 'UGC VZ (Eigenkampagne)',
    monogram: 'VZ',
    badge: 'LIVE START-BOUNTY · SOFORT OFFEN',
    isOwnCampaign: true,
    type: 'Eigene Produktion',
    title: 'Mach ein ehrliches TikTok oder Reel über UGC VZ',
    summary:
      'Statt Meta-Ads zu verbrennen, zahlen wir das Budget direkt an unsere eigenen Creator aus: Zeig aus Creator- oder Agentur-Sicht, wie man auf UGC VZ kostenlos Aufträge & Bounties findet.',
    cpmEuro: 2.0,
    totalBudget: 1000,
    spentBudget: 340,
    maxPayoutPerVideo: 200,
    starterBonus: '+10 € Starter-Bonus aufs 1. Video*',
    starterBonusFootnote:
      '*Starter-Bonus wird freigeschaltet, sobald dein erstes eingereichtes Video mindestens 2.500 geprüfte Views erreicht und 7 Tage online bleibt.',
    platforms: ['TikTok', 'IG Reels', 'YT Shorts'],
    activeCreators: 19,
    minFollowers: 'Keine Mindest-Follower',
    requirements: [
      'Öffentliches Profil + korrekte Werbekennzeichnung („Anzeige“)',
      'ugc-vz.de sichtbar im Screen-Recording oder klar im Voiceover genannt',
      'Nur organische Reichweite – auffällige View-Verläufe werden geprüft und nicht vergütet',
    ],
    tracks: [
      {
        label: 'Track A · Creator-Perspektive',
        angle: '„3 Seiten, auf denen du 2026 in Deutschland als kleiner UGC Creator direkt mit Marken Geld verdienst“',
      },
      {
        label: 'Track B · Brand- & Agentur-Perspektive',
        angle: '„So finden Brands 730+ DACH-Creator frei durchsuchbar und ohne Vermittlungsprovision“',
      },
    ],
  },
  {
    id: 'streetwear-seeding',
    brand: 'Urban Drop (Pilot-Slot)',
    monogram: 'UD',
    badge: 'PRODUKT-PAKET + TKP',
    type: 'Seeding + Views',
    title: 'Fit-Check & Unboxing für Winter-Hoodie-Kollektion',
    summary:
      'Love-Brand Referenzkampagne: Du erhältst kostenlos ein Produktpaket (Warenwert 89 €) und verdienst zusätzlich 3,50 € pro 1.000 organische Views auf dein Fit-Check-Video.',
    cpmEuro: 3.5,
    totalBudget: 5000,
    spentBudget: 1450,
    maxPayoutPerVideo: 500,
    platforms: ['TikTok', 'IG Reels'],
    activeCreators: 28,
    minFollowers: 'Ab 500 Followern',
    requirements: [
      '15–35 Sek. ehrlicher Fit-Check bei Tageslicht oder Street-Setting',
      'Kein abgelesenes Werbeskript – eigener Stil ausdrücklich erwünscht',
      'Markierung des Brand-Accounts + Anzeige-Hinweis',
    ],
  },
  {
    id: 'iced-protein',
    brand: 'DailyFuel Nutrition (Beispiel)',
    monogram: 'DF',
    badge: 'HOHES GESAMTBUDGET',
    type: 'Eigene Produktion',
    title: '20-Sekunden Morning Iced-Coffee Routine in deiner Küche',
    summary:
      'Zeig ungestellt deinen morgendlichen Protein-Eiskaffee im Alltag. Top-Performer erhalten automatisch eine Einladung in den dauerhaften Level-1-bis-5 Creator-Club.',
    cpmEuro: 4.0,
    totalBudget: 10000,
    spentBudget: 6120,
    maxPayoutPerVideo: 800,
    platforms: ['TikTok', 'IG Reels', 'YT Shorts'],
    activeCreators: 64,
    minFollowers: 'Keine Mindest-Follower',
    requirements: [
      'Zubereitung in den ersten 3 Sekunden sichtbar (Hook)',
      'Echte Alltagsküche statt Studio-Hintergrund',
      'Optional kombinierbar mit persönlichem 10 %-Creator-Code',
    ],
  },
  {
    id: 'creator-tax-bounty',
    brand: 'TaxPilot × Creator Deal (Beispiel)',
    monogram: 'TP',
    badge: '5,00 € PRO 1.000 VIEWS',
    type: 'Eigene Produktion',
    title: 'Storytime: Nebeneinnahmen als Creator stressfrei versteuern',
    summary:
      'Erkläre anderen Creatorn oder Selbstständigen, wie man Belege, Rechnungen und Finanzamt-Vorauszahlungen ohne 1.200 € Steuerberater-Rechnung im Griff behält.',
    cpmEuro: 5.0,
    totalBudget: 6000,
    spentBudget: 2100,
    maxPayoutPerVideo: 1000,
    platforms: ['TikTok', 'IG Reels', 'YT Shorts'],
    activeCreators: 22,
    minFollowers: 'Keine Mindest-Follower',
    requirements: [
      'Keine individuelle Steuerberatung versprechen – Fokus auf eigenes Workflow-Tool',
      'Screen-View des Rücklagen-Rechners kurz einblenden',
      'DACH-Zielgruppe (Sprache: Deutsch)',
    ],
  },
  {
    id: 'podcast-clipping',
    brand: 'Arena & Podcast Highlights (Beispiel)',
    monogram: 'AP',
    badge: 'CLIPPING · ROHMATERIAL INKLUSIVE',
    type: 'Clipping / Repost',
    title: 'Freigegebene Event- & Interview-Momente schneiden und posten',
    summary:
      'Kein eigener Dreh nötig: Lade das freigegebene Rohmaterial herunter, füge knackige Untertitel & eigenen Kommentar-Einstieg hinzu (YouTube/TikTok Originalitäts-konform!) und kassiere pro 1.000 Views.',
    cpmEuro: 2.2,
    totalBudget: 8000,
    spentBudget: 4890,
    maxPayoutPerVideo: 600,
    platforms: ['TikTok', 'IG Reels', 'YT Shorts'],
    activeCreators: 47,
    minFollowers: 'Keine Mindest-Follower',
    requirements: [
      'Eigener Hook / Split-Screen oder Kommentar-Mehrwert (kein stumpfer 1:1-Reupload wegen Plattform-Richtlinien)',
      'Untertitel im 9:16-Format + Nennung der Originalshow',
      'Mindestens 1.000 geprüfte Views für erste Auszahlung',
    ],
  },
];

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  niche: string;
  clips: number;
  verifiedViews: string;
  earnedEuro: string;
  platform: string;
}

export const LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, handle: 'lara.alltag', niche: 'Food & Routinen', clips: 14, verifiedViews: '412.800', earnedEuro: '1.580 €', platform: 'TikTok + Reels' },
  { rank: 2, handle: 'julian.sidehustle', niche: 'Tech & Finanzen', clips: 8, verifiedViews: '289.400', earnedEuro: '1.290 €', platform: 'TikTok' },
  { rank: 3, handle: 'noahfits.bln', niche: 'Streetwear', clips: 11, verifiedViews: '244.100', earnedEuro: '895 €', platform: 'TikTok + Shorts' },
  { rank: 4, handle: 'sina.moves', niche: 'Fitness & Vlogs', clips: 9, verifiedViews: '176.500', earnedEuro: '680 €', platform: 'IG Reels' },
  { rank: 5, handle: 'clipwerk.dach', niche: 'Event-Clipping', clips: 19, verifiedViews: '231.000', earnedEuro: '508 €', platform: 'TikTok + Shorts' },
];

export interface ClubLevel {
  level: number;
  name: string;
  subtitle: string;
  entryRule: string;
  monthlyEarning: string;
  creatorPerks: string[];
  brandEconomics: string;
}

export const CLUB_LEVELS: ClubLevel[] = [
  {
    level: 1,
    name: 'Level 1 · Starter & Seeding',
    subtitle: 'Massen-Aktivierung ab 500 Followern',
    entryRule: 'Ab 500 Followern · Kurzer Brand-Fit-Check ohne Agentur-Hürde',
    monthlyEarning: 'Basis-Provision + Produkt-Guthaben',
    creatorPerks: [
      'Kostenloses Starter-Produktpaket zum echten Testen im Alltag',
      'Eigener 10 %-Community-Code ab Tag 1',
      'Cleverer Tausch: Gesammelte Provision (z. B. 150 €) mit Bonus direkt in neue Produkte umwandeln',
      'Tägliche 20-Sekunden-Rezeptideen & Hook-Vorlagen per Push',
    ],
    brandEconomics: '0 € Fixgage! Du zahlst nur deinen reinen Wareneinsatz + Provision bei echten Verkäufen.',
  },
  {
    level: 2,
    name: 'Level 2 · Rising Creator',
    subtitle: 'Konstante organische Präsenz (3–5 Clips/Woche)',
    entryRule: 'Ab 10 verifizierten Bestellungen/Monat oder 15 Alltags-Clips',
    monthlyEarning: 'Erhöhte Provision je Code-Bestellung',
    creatorPerks: [
      'Erhöhte Umsatzprovision auf jede Code-Bestellung',
      'Vorab-Versand unveröffentlichter Sorten & Drops (FOMO-Content)',
      'Zugang zum privaten Creator-Discord / Telegram-Channel',
    ],
    brandEconomics: 'Planbarer Strom an authentischem Alltags-Content genau aus der echten Käufer-Zielgruppe.',
  },
  {
    level: 3,
    name: 'Level 3 · Core Ambassador',
    subtitle: 'Bewährte Umsatzbringer mit Stamm-Community',
    entryRule: 'Konstanter Monatsumsatz über 3 Monate',
    monthlyEarning: 'Höhere Provisionsstufe + festes Produktbudget',
    creatorPerks: [
      'Monatliches festes Gratis-Bestellbudget im Shop',
      'Staffel-Boni bei Launch-Tagen & Restocks',
      'Automatische Gutschriften & Beleg-Export für deine Buchhaltung',
    ],
    brandEconomics: 'Niedriger CAC als Meta-Ads, da die Community dem Creator über Monate beim echten Nutzen zusieht.',
  },
  {
    level: 4,
    name: 'Level 4 · Performance & Whitelisting',
    subtitle: 'Organische Gewinner-Clips werden zu Paid Ads',
    entryRule: 'Top 10 % Conversion-Rate im Programm',
    monthlyEarning: 'Provision + Beteiligung am Ad-Budget (individuell)',
    creatorPerks: [
      'Paid-Ads-Support & Spark-Ads-Budget auf deine besten Videos',
      'Zusätzliche Ad-Spend-Beteiligung auf skalierte Creatives',
      'Persönlicher Ansprechpartner für Launch-Kampagnen',
    ],
    brandEconomics: 'Du bewirbst mit Paid-Budget nur noch Videos, die organisch bereits bewiesen haben, dass sie verkaufen.',
  },
  {
    level: 5,
    name: 'Level 5 · Markenbotschafter',
    subtitle: 'Feste, langfristige Zusammenarbeit mit wenigen ausgewählten Creatorn',
    entryRule: 'Auf Einladung der Marke – nach nachweislich guter Zusammenarbeit über mehrere Monate',
    monthlyEarning: 'Individuell vereinbart (Provision, Boni & Events)',
    creatorPerks: [
      'Eigene Co-Branded Landingpage auf der Marken-Domain',
      'Einladungen zu Produktionstagen & Marken-Events',
      'Mitsprache bei neuen Produkten & eigene Produkt-Bundles',
      'Individuell vereinbarte Boni statt pauschaler Versprechen',
    ],
    brandEconomics: 'Ein kleiner Kreis verlässlicher Gesichter für Launches, Ads und Events – die Stufen darunter bleiben freiwillig und ohne Postingpflicht.',
  },
];

export interface AgencyCreatorRow {
  name: string;
  handle: string;
  followers: string;
  activeBounties: number;
  clipsSubmitted: number;
  verifiedViews: string;
  grossEarned: number;
  agencySharePercent: number;
  status: 'Aktiv · Trackt live' | 'Clip in KI-Prüfung' | 'Auszahlungsbereit';
}

export const AGENCY_ROSTER: AgencyCreatorRow[] = [
  { name: 'Lara König', handle: '@lara.alltag', followers: '18.4k', activeBounties: 3, clipsSubmitted: 14, verifiedViews: '412.800', grossEarned: 1580, agencySharePercent: 20, status: 'Auszahlungsbereit' },
  { name: 'Noah Becker', handle: '@noahfits.bln', followers: '8.4k', activeBounties: 2, clipsSubmitted: 11, verifiedViews: '244.100', grossEarned: 895, agencySharePercent: 20, status: 'Aktiv · Trackt live' },
  { name: 'Sina Hartmann', handle: '@sina.moves', followers: '3.2k', activeBounties: 2, clipsSubmitted: 9, verifiedViews: '176.500', grossEarned: 680, agencySharePercent: 15, status: 'Aktiv · Trackt live' },
  { name: 'Miriam Vogt', handle: '@miri.creates', followers: '5.3k', activeBounties: 1, clipsSubmitted: 4, verifiedViews: '64.200', grossEarned: 321, agencySharePercent: 20, status: 'Clip in KI-Prüfung' },
];

export interface ComparisonRow {
  feature: string;
  ugcvz: string;
  contentmarkt: string;
  creonda: string;
  speekly: string;
  hypefy: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: 'Offene Creator-Suche ohne Login & ohne Abo',
    ugcvz: '✓ Ja (730+ DACH-Profile gratis)',
    contentmarkt: '✕ Geschlossen / Kampagnen-basiert',
    creonda: '✓ 500+ Profile durchsuchbar',
    speekly: '✕ Registrierung & Paketpreise',
    hypefy: '✕ Geschlossene SaaS-Plattform',
  },
  {
    feature: 'Plattform-Gebühr bei Direkt-Matching',
    ugcvz: '0 % (Direktkontakt kostenlos)',
    contentmarkt: 'Plattformanteil im TKP enthalten',
    creonda: '20 % auf Buchungen',
    speekly: 'Feste Paketpreise pro Video',
    hypefy: 'Monatliches Enterprise-/SaaS-Abo',
  },
  {
    feature: 'Gebühr für Creator',
    ugcvz: '0 % Abzug vom angezeigten Satz',
    contentmarkt: 'Anteil im TKP eingepreist',
    creonda: '0 % für Creator',
    speekly: 'Feste Vergütungsstufen',
    hypefy: '0 %',
  },
  {
    feature: 'Pay-per-1.000-Views (UGC Bounties & Clipping)',
    ugcvz: '✓ Ja (Budget-Deckel, 19,9 % Plattform-Fee, View-Prüfung)',
    contentmarkt: '✓ Ja (Kernmodell)',
    creonda: '✕ Nur Einzelvideo-Buchung',
    speekly: '✕ Nur Asset-Kauf pro Video',
    hypefy: '✕ Kampagnen-Workflow ohne TKP-Pool',
  },
  {
    feature: 'Eigenes Brand-Affiliate- & Markenbotschafter-Portal',
    ugcvz: '✓ Schlüsselfertig (Level 1–5 + Produkt-Seeding)',
    contentmarkt: '✕ Nein',
    creonda: '✕ Nein',
    speekly: '✕ Nein',
    hypefy: 'Teilweise Kampagnen-CRM, kein Club-Portal',
  },
  {
    feature: 'Automatische Gutschriften & Beleg-Export für Creator',
    ugcvz: '✓ Automatische Gutschriften (§ 19 / 19 % USt.) + Beleg-Export',
    contentmarkt: 'Nicht bekannt',
    creonda: 'Nur Gutschrift/Treuhand',
    speekly: 'Nur Abrechnung',
    hypefy: 'Nicht bekannt',
  },
  {
    feature: 'Agentur-Konten & Multi-Creator Revenue-Share',
    ugcvz: '✓ Ja + White-Label Media-Report',
    contentmarkt: '✓ Ja (Agentur-Dashboard)',
    creonda: 'Agenturen buchen wie Brands',
    speekly: 'Agentur-Pakete',
    hypefy: '✓ Multi-Brand Workspace',
  },
  {
    feature: 'KI-Briefings + Native Agent-Schnittstellen (MCP / A2A / ChatGPT)',
    ugcvz: '✓ Live (MCP, A2A 1.0, WebMCP & KI-Skripte)',
    contentmarkt: '✕ Nein',
    creonda: 'KI-Briefing, kein offenes MCP/A2A',
    speekly: '✕ Nein',
    hypefy: 'KI-Matching intern, kein offenes MCP',
  },
];
