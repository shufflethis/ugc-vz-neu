export const QUICK_BRIEF_STORAGE_KEY = 'ugcvz_quick_brief_v1';

export type QuickBriefPlatform = 'tiktok' | 'instagram' | 'youtube' | 'tiktok_shop';

export interface QuickBriefDraft {
  goal: string;
  platforms: QuickBriefPlatform[];
  pricePerThousandEur: number;
  budgetCapEur: number;
  savedAt: string;
}

export const QUICK_BRIEF_PLATFORMS: Array<{
  id: QuickBriefPlatform;
  label: string;
}> = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram Reels' },
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'tiktok_shop', label: 'TikTok Shop' },
];

export function saveQuickBriefDraft(draft: Omit<QuickBriefDraft, 'savedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const payload: QuickBriefDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(QUICK_BRIEF_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadQuickBriefDraft(): QuickBriefDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(QUICK_BRIEF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuickBriefDraft>;
    if (!parsed || typeof parsed.goal !== 'string') return null;
    const allowed = new Set<QuickBriefPlatform>(['tiktok', 'instagram', 'youtube', 'tiktok_shop']);
    const platforms = Array.isArray(parsed.platforms)
      ? parsed.platforms.filter((p): p is QuickBriefPlatform => allowed.has(p as QuickBriefPlatform))
      : [];
    const price = Number(parsed.pricePerThousandEur);
    const budget = Number(parsed.budgetCapEur);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(budget) || budget <= 0) {
      return null;
    }
    return {
      goal: parsed.goal.trim().slice(0, 500),
      platforms: platforms.length > 0 ? platforms : ['tiktok', 'instagram'],
      pricePerThousandEur: price,
      budgetCapEur: Math.round(budget),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearQuickBriefDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(QUICK_BRIEF_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
