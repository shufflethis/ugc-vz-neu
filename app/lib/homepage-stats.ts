import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export interface LiveHeroCampaign {
  isLive: true;
  title: string;
  brandDisplayName: string;
  tkpEurCents: number;
  totalBudgetEur: number;
  remainingPercent: number;
  platforms: string[];
}

export interface HomepageLiveStats {
  /** Live active open TKP campaign with highest rate, or null if none exist. */
  highestTkpEurCents: number | null;
  /** Featured live active view campaign for Hero card, or null -> show Beispielansicht. */
  heroCampaign: LiveHeroCampaign | null;
  /** Live active creator count from DB, or null if DB unavailable. */
  liveCreatorCount: number | null;
}

export async function getHomepageLiveStats(): Promise<HomepageLiveStats> {
  if (!isDatabaseConfigured()) {
    return { highestTkpEurCents: null, heroCampaign: null, liveCreatorCount: null };
  }

  try {
    const sql = getDatabase();

    const [campaignRows, creatorRows] = await Promise.all([
      sql`
        SELECT
          c.title,
          c.brand_display_name,
          c.tkp_eur_cents,
          c.total_budget_eur,
          c.platforms,
          COALESCE((
            SELECT SUM(s.spend_eur_cents)
            FROM brand_campaign_submissions s
            WHERE s.campaign_id = c.id AND s.status = 'approved'
          ), 0)::bigint AS spent_cents
        FROM brand_campaigns c
        WHERE c.status = 'active'
          AND c.visibility = 'open'
          AND c.compensation_model IN ('tkp', 'hybrid')
          AND c.tkp_eur_cents IS NOT NULL
          AND c.tkp_eur_cents > 0
          AND c.total_budget_eur IS NOT NULL
          AND c.total_budget_eur > 0
        ORDER BY c.tkp_eur_cents DESC, c.created_at DESC
        LIMIT 1
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM creator_profiles
        WHERE status = 'active'
      `,
    ]);

    const liveCreatorCount =
      creatorRows[0]?.total && Number(creatorRows[0].total) > 0
        ? Number(creatorRows[0].total)
        : null;

    const top = campaignRows[0];
    if (!top) {
      return { highestTkpEurCents: null, heroCampaign: null, liveCreatorCount };
    }

    const tkpEurCents = Number(top.tkp_eur_cents);
    const totalBudgetEur = Number(top.total_budget_eur);
    const spentCents = Number(top.spent_cents || 0);
    const budgetCents = totalBudgetEur * 100;
    const remainingPercent =
      budgetCents > 0
        ? Math.max(0, Math.min(100, Math.round(((budgetCents - spentCents) / budgetCents) * 100)))
        : 100;

    return {
      highestTkpEurCents: tkpEurCents,
      heroCampaign: {
        isLive: true,
        title: String(top.title || 'Aktive View-Kampagne'),
        brandDisplayName: String(top.brand_display_name || 'Marke auf UGC VZ'),
        tkpEurCents,
        totalBudgetEur,
        remainingPercent,
        platforms: Array.isArray(top.platforms) ? top.platforms.map(String) : ['tiktok', 'instagram'],
      },
      liveCreatorCount,
    };
  } catch {
    return { highestTkpEurCents: null, heroCampaign: null, liveCreatorCount: null };
  }
}

export function formatEurCentsDe(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
