export const DEMO_ROOT = '/demo/kooperationen';
export type Campaign = {
  slug: string;
  brand: string;
  monogram: string;
  category: string;
  kind: 'Fixhonorar + Provision' | 'UGC-Auftrag' | 'Laufende Partnerschaft';
  title: string;
  summary: string;
  tone: 'violet' | 'green' | 'blue';
  fictional: boolean;
  reward: string;
  rhythm: string;
  duration: string;
  platforms: string[];
  deliverables: string[];
  requirements: string[];
  terms: { title: string; text: string }[];
  questions: string[];
  value?: {
    title: string;
    intro: string;
    points: { title: string; text: string }[];
    note: string;
  };
  guide: { title: string; text: string; owner: string }[];
  handoff?: { guideUrl: string; contact: string; sourceDate: string };
};
export type Stage = 'Vorgeschlagen' | 'Eingeladen' | 'Einladung angenommen' | 'Start geklärt' | 'Übergabe offen' | 'Bestätigt' | 'Abgesagt';
export type DemoCandidate = {
  id: string; name: string; initials: string; topic: string; campaign: string;
  source: string; stage: Stage; evidence: string; next: string;
};
export type Slide = { label: string; title: string; intro: string; cards: { title: string; text: string }[]; note: string };
