// Zentrale Werte der fomo-Kampagne (Flos Content-Paket, Stand 14.10.2026).
// Mit "offen" markierte Werte sind noch nicht schriftlich von fomo bestätigt: nur hier ändern.
export const FOMO = {
  fixumRange: '200 $ bis 1.000 $ pro Monat', // offen
  fixumShort: '200 $ bis 1.000 $', // offen
  fixumTest: '100 $ bis 500 $', // offen
  testPosts: '15 Posts in höchstens 21 Tagen',
  postsMonth: 30,
  postRule: '1 Video pro Tag auf TikTok, Instagram und Facebook, dasselbe Video erlaubt, X optional',
  commissionSteps: [[0, 25], [2, 30], [4, 35], [6, 40], [8, 45], [12, 50]] as const, // Monate, Prozent; offen
  commissionKeep: 25, // offen
  payout: 'Fixum alle 30 Tage an deine fomo Wallet, Provision live im Creator Dashboard', // offen
  startTime: '48 Stunden', // offen
  onlyCost: 'optionaler TikTok Account mit 1.000 Followern für 60 $', // offen
  proof: [['💰', '75 Mio. $', 'Series B unter Führung von Index Ventures (Juni 2026)'], ['📱', '3 Mio.', 'Nutzer laut fomo Mitgründer Se Yong Park (Oktober 2026)'], ['🚀', '400.000+', 'Nutzer kamen über die Creator Kampagne'], ['🏆', 'über 400.000 $', 'hat der Top Creator im Programm verdient']],
  feePerUser: [7.5, 11] as const, // $ Gebühren pro geworbener Person, aus zwei Dashboards
  examples: [[100, 25], [500, 25], [1000, 40]] as const, // Geworbene, Satz
  contactMail: '', // Platzhalter: Flos UGC-VZ-Adresse
  discordInvite: '', // Platzhalter: Discord-Einladung fomo Onboarding
  consentCompany: '', // Platzhalter: genaue Firmierung von fomo
  responseTime: '', // Platzhalter: Antwortzeit nach Zusage
  flags: { videoPreview: false, chooserOnFallback: false, erstmalsDe: false, testimonials: false, moduleW1: false, moduleW2: false, moduleM1: false, moduleM2: false },
};

export type Variant = 'w' | 'm' | 'n';
export type VariantSource = 'profile' | 'override' | 'fallback';

const usd = (n: number) => `${n.toLocaleString('de-DE')} $`;
const round5 = (n: number) => Math.round(n / 5) * 5;
// Rechenbeispiel: Geworbene × Gebühren pro Person × Satz, auf 5 $ gerundet.
export const earningsExamples = () => FOMO.examples.map(([people, rate]) => {
  const [lo, hi] = FOMO.feePerUser.map(fee => round5(people * fee * rate / 100));
  return { people, rate, lo, hi, label: `rund ${usd(lo)} bis ${usd(hi)}` };
});

// Variante: ?v= überschreibt (Testlink), sonst Profil-Geschlecht, sonst neutral.
export function resolveVariant(override: unknown, gender: 'male' | 'female' | 'any'): { variant: Variant; source: VariantSource } {
  if (override === 'w' || override === 'm' || override === 'n') return { variant: override, source: 'override' };
  if (gender === 'female') return { variant: 'w', source: 'profile' };
  if (gender === 'male') return { variant: 'm', source: 'profile' };
  return { variant: 'n', source: 'fallback' };
}

// Vermittlungs-ID aus der fortlaufenden Nummer der Teilnahme.
export const referralId = (slug: string, no: number | string | null | undefined) => no == null ? '' : `UGCVZ-${slug.toUpperCase()}-${String(no).padStart(4, '0')}`;
