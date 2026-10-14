import type { CampaignContent } from './model';
import { FOMO } from './fomo-config';
// Creator-sichtbare Kampagnentexte. Zahlen aus FOMO; vor der Freigabe mit fomo bestätigen.
export const fomoDraft:CampaignContent={
  brand:'fomo',title:'Dein Content. Die Chance auf laufende Einnahmen.',
  summary:'UGC VZ lädt dich zur Creator Partnerschaft mit fomo ein, einer Social Trading App. Ein Video pro Tag, dafür ein festes Fixum und eine lebenslange Provision auf alle, die über dich zur App kommen.',
  benefit:'Schluss mit Einmal-Jobs: ein festes Fixum jeden Monat und eine Provision, die weiterläuft, solange deine Geworbenen traden.',
  task:`Ein Video pro Tag auf TikTok, Instagram und Facebook, dasselbe Video ist erlaubt. ${FOMO.postsMonth} Videos im Monat, zum Start eine Testphase mit ${FOMO.testPosts}.`,
  requirements:'Mindestens 18 Jahre, Erfahrung mit Kurzvideos, Gesicht vor der Kamera. Dein UGC VZ Profil und deine Arbeitsproben musst du nicht erneut einreichen.',
  reward:'Fixum + Provision',
  terms:`Fixum: ${FOMO.fixumRange}, fest vereinbart vor dem Start, ausgezahlt alle 30 Tage an deine fomo Wallet.\n\nTestphase: ${FOMO.testPosts}, dafür 50 % deines Fixums (${FOMO.fixumTest}).\n\nProvision: 25 % der Trading Gebühren deiner Geworbenen, mit der Zeit bis 50 %. Wenn du aufhörst, behältst du lebenslang ${FOMO.commissionKeep} % auf alle bisherigen Geworbenen.\n\nKosten: keine Gebühren, kein Abo. Optional ein TikTok Account mit 1.000 Followern für 60 $.\n\nDie endgültigen Konditionen bestätigt das fomo Team im Gespräch. Einnahmen sind nicht garantiert.`,
  guideUrl:'https://stealth-harmonica-74d.notion.site/fomo-Kommandozentrale-3f8bac0068ef8104a1c9e542d1303e23',
  contactName:'Florian Runge',contactEmail:'florian.runge@ugc-vz.de',
};
