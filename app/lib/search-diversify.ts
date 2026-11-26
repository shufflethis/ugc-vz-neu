import crypto from 'node:crypto';

export interface DiversifiableCandidate {
  id: string;
  score: number;
  relevanceScore: number;
  primaryCategory: string | null;
  categories: string[];
  city: string;
  topics: string;
  hasCustomImage: boolean;
  totalReach: number;
}

function deterministicUnitHash(seed: string, id: string): number {
  const hex = crypto.createHash('sha256').update(`${seed}:${id}`).digest('hex').slice(0, 8);
  return parseInt(hex, 16) / 0xffffffff;
}

function jaccardTokens(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/[\s,·/]+/).filter((w) => w.length >= 3));
  const setB = new Set(b.toLowerCase().split(/[\s,·/]+/).filter((w) => w.length >= 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function profileSimilarity(a: DiversifiableCandidate, b: DiversifiableCandidate): number {
  let sim = 0;
  if (a.primaryCategory && b.primaryCategory && a.primaryCategory === b.primaryCategory) {
    sim += 0.35;
  }
  const catSetA = new Set(a.categories);
  const catOverlap = b.categories.filter((c) => catSetA.has(c)).length;
  const catUnion = new Set([...a.categories, ...b.categories]).size;
  if (catUnion > 0) sim += 0.3 * (catOverlap / catUnion);
  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) {
    sim += 0.15;
  }
  sim += 0.2 * jaccardTokens(a.topics, b.topics);
  return Math.min(1, sim);
}

/**
 * MMR-Diversifizierung + session-stabile Rotation (Spec 8.6):
 * - Relevanz bleibt klar fuehrend (lambda = 0.82).
 * - Gleich gute Treffer rotieren fair pro Session-Seed, bleiben aber innerhalb
 *   derselben Sitzung 100 % stabil.
 * - Verhindert 10 nahezu identische Profile direkt hintereinander.
 */
export function diversifyAndRotateCandidates<T extends DiversifiableCandidate>(
  items: T[],
  options: { sessionSeed?: string; limit?: number; lambda?: number } = {},
): T[] {
  const limit = options.limit ?? 24;
  if (items.length <= 1) return items.slice(0, limit);

  const seed = (options.sessionSeed || 'default-session').slice(0, 64);
  const lambda = options.lambda ?? 0.82;

  const maxScore = Math.max(...items.map((i) => i.score), 1);
  const minScore = Math.min(...items.map((i) => i.score), 0);
  const span = Math.max(maxScore - minScore, 1);

  // Kleine deterministische Tie-Break-Variation innerhalb enger Relevanz-Baender
  const scored = items.map((item) => {
    const normRel = (item.score - minScore) / span;
    const jitter = (deterministicUnitHash(seed, item.id) - 0.5) * 0.04;
    return { item, baseRel: normRel + jitter };
  });

  scored.sort((a, b) => b.baseRel - a.baseRel);

  const remaining = [...scored];
  const selected: T[] = [];

  while (remaining.length > 0 && selected.length < limit) {
    if (selected.length === 0) {
      selected.push(remaining.shift()!.item);
      continue;
    }

    let bestIdx = 0;
    let bestMmr = -Infinity;

    // Begrenze MMR-Vergleich auf die naechsten 36 Kandidaten (schnell & stabil)
    const windowSize = Math.min(remaining.length, 36);
    for (let i = 0; i < windowSize; i += 1) {
      const candidate = remaining[i];
      let maxSim = 0;
      // Vergleiche mit den letzten 5 ausgewaehlten Profilen fuer lokale Vielfalt
      const recentWindow = selected.slice(-5);
      for (const prev of recentWindow) {
        const s = profileSimilarity(candidate.item, prev);
        if (s > maxSim) maxSim = s;
      }
      const mmr = lambda * candidate.baseRel - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0].item);
  }

  return selected;
}
