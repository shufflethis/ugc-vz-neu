import type { NeonQueryFunction } from '@neondatabase/serverless';

export type CreatorProfileView = {
  publicId: string;
  name: string;
  stageName: string;
  email: string;
  birthYear: number | null;
  gender: string;
  city: string;
  profileImageUrl: string | null;
  topics: string;
  preferredContent: string;
  industries: string;
  rateText: string;
  reachText: string;
  equipment: string;
  specialTraits: string;
  childrenContext: string;
  petContext: string;
  socialLinks: string[];
  portfolioLinks: string[];
  newsletterConsent: boolean;
};

type ProfileRow = {
  public_id: string;
  legal_name: string | null;
  stage_name: string | null;
  birth_year: number | null;
  gender: string | null;
  city: string | null;
  profile_image_url: string | null;
  topics: string | null;
  preferred_content: string | null;
  industries: string | null;
  rate_text: string | null;
  reach_text: string | null;
  equipment: string | null;
  special_traits: string | null;
  children_context: string | null;
  pet_context: string | null;
  email: string | null;
  newsletter_enabled: boolean | null;
  social_links: string | null;
  portfolio_links: string | null;
};

const str = (value: string | null | undefined) => (value ?? '').trim();

const lines = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
};

export const loadCreatorProfile = async (
  sql: NeonQueryFunction<false, false>,
  creatorId: string,
): Promise<CreatorProfileView | null> => {
  const rows = (await sql.query(
    `
    SELECT
      p.public_id,
      p.legal_name,
      p.stage_name,
      p.birth_year,
      p.gender,
      p.city,
      p.profile_image_url,
      p.topics,
      p.preferred_content,
      p.industries,
      p.rate_text,
      p.reach_text,
      p.equipment,
      p.special_traits,
      p.children_context,
      p.pet_context,
      c.email,
      c.newsletter_enabled,
      s.social_links,
      f.portfolio_links
    FROM creator_profiles p
    LEFT JOIN creator_private_contacts c ON c.creator_id = p.id
    LEFT JOIN LATERAL (
      SELECT string_agg(url, E'\\n' ORDER BY is_primary DESC, created_at) AS social_links
      FROM creator_social_accounts
      WHERE creator_id = p.id
    ) s ON true
    LEFT JOIN LATERAL (
      SELECT string_agg(url, E'\\n' ORDER BY sort_order, created_at) AS portfolio_links
      FROM creator_portfolio_items
      WHERE creator_id = p.id
    ) f ON true
    WHERE p.id = $1
    LIMIT 1
  `,
    [creatorId],
  )) as unknown as ProfileRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    publicId: str(row.public_id),
    name: str(row.legal_name),
    stageName: str(row.stage_name),
    email: str(row.email),
    birthYear: row.birth_year ?? null,
    gender: str(row.gender),
    city: str(row.city),
    profileImageUrl: row.profile_image_url ?? null,
    topics: str(row.topics),
    preferredContent: str(row.preferred_content),
    industries: str(row.industries),
    rateText: str(row.rate_text),
    reachText: str(row.reach_text),
    equipment: str(row.equipment),
    specialTraits: str(row.special_traits),
    childrenContext: str(row.children_context),
    petContext: str(row.pet_context),
    socialLinks: lines(row.social_links),
    portfolioLinks: lines(row.portfolio_links),
    newsletterConsent: row.newsletter_enabled === true,
  };
};

export type ProfileEdit = {
  field_name: string;
  old_value: string | null;
  new_value: string | null;
};

const asText = (value: string | number | boolean | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

/**
 * Vergleicht den Vorher-/Nachher-Zustand und liefert nur tatsaechlich
 * geaenderte Felder als Edit-Liste. Links werden als sortierte, newline-gebundene
 * Strings verglichen, damit die Reihenfolge-Aenderung nicht als Inhalt laeuft.
 */
type ScalarField =
  | 'name'
  | 'stageName'
  | 'birthYear'
  | 'gender'
  | 'city'
  | 'profileImageUrl'
  | 'topics'
  | 'preferredContent'
  | 'industries'
  | 'rateText'
  | 'reachText'
  | 'equipment'
  | 'specialTraits'
  | 'childrenContext'
  | 'petContext';

export const diffProfile = (
  before: CreatorProfileView,
  after: CreatorProfileView,
): ProfileEdit[] => {
  const textFields: Array<[ScalarField, string]> = [
    ['name', 'legal_name'],
    ['stageName', 'stage_name'],
    ['birthYear', 'birth_year'],
    ['gender', 'gender'],
    ['city', 'city'],
    ['profileImageUrl', 'profile_image_url'],
    ['topics', 'topics'],
    ['preferredContent', 'preferred_content'],
    ['industries', 'industries'],
    ['rateText', 'rate_text'],
    ['reachText', 'reach_text'],
    ['equipment', 'equipment'],
    ['specialTraits', 'special_traits'],
    ['childrenContext', 'children_context'],
    ['petContext', 'pet_context'],
  ];

  const edits: ProfileEdit[] = [];

  for (const [key, fieldName] of textFields) {
    const beforeValue = asText(before[key]);
    const afterValue = asText(after[key]);
    if (beforeValue !== afterValue) {
      edits.push({ field_name: fieldName, old_value: beforeValue, new_value: afterValue });
    }
  }

  const beforeSocial = [...before.socialLinks].sort().join('\n');
  const afterSocial = [...after.socialLinks].sort().join('\n');
  if (beforeSocial !== afterSocial) {
    edits.push({
      field_name: 'social_links',
      old_value: before.socialLinks.join('\n') || null,
      new_value: after.socialLinks.join('\n') || null,
    });
  }

  const beforePortfolio = [...before.portfolioLinks].sort().join('\n');
  const afterPortfolio = [...after.portfolioLinks].sort().join('\n');
  if (beforePortfolio !== afterPortfolio) {
    edits.push({
      field_name: 'portfolio_links',
      old_value: before.portfolioLinks.join('\n') || null,
      new_value: after.portfolioLinks.join('\n') || null,
    });
  }

  if (before.newsletterConsent !== after.newsletterConsent) {
    edits.push({
      field_name: 'newsletter_enabled',
      old_value: asText(before.newsletterConsent),
      new_value: asText(after.newsletterConsent),
    });
  }

  return edits;
};

export const recordProfileEdits = async (
  sql: NeonQueryFunction<false, false>,
  creatorId: string,
  edits: ProfileEdit[],
): Promise<void> => {
  for (const edit of edits) {
    await sql.query(
      `INSERT INTO creator_profile_edits (creator_id, field_name, old_value, new_value)
       VALUES ($1, $2, $3, $4)`,
      [creatorId, edit.field_name, edit.old_value, edit.new_value],
    );
  }
};
