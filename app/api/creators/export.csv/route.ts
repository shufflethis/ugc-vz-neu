import { timingSafeEqual } from 'crypto';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const HEADERS = [
  'UGC-ID',
  'Name',
  'Künstlername',
  'Geburtsjahr',
  'Geschlecht',
  'Stadt / Region',
  'Themen',
  'Branchen',
  'Content-Formate',
  'Preisvorstellung',
  'Reichweite',
  'Netzwerke',
  'Social-Links',
  'Portfolio',
  'Besondere Merkmale',
  'Erfahrung seit',
  'Profilqualität',
] as const;

type PublicCreatorExportRow = {
  public_id: string;
  display_name: string;
  stage_name: string | null;
  birth_year: number | null;
  gender: string | null;
  city: string | null;
  topics: string | null;
  industries: string | null;
  preferred_content: string | null;
  rate_text: string | null;
  reach_text: string | null;
  networks: string[] | null;
  social_links: string | null;
  portfolio_links: string | null;
  special_traits: string | null;
  experience_since: string | null;
  profile_quality_score: number;
};

const hasValidToken = (providedToken: string | null) => {
  const expectedToken = process.env.SHEET_EXPORT_TOKEN;
  if (!providedToken || !expectedToken) return false;

  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};

const normalizeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).join(', ');
  return String(value).replace(/\r\n?/g, '\n').trim();
};

const escapeCsvCell = (value: unknown) => {
  let normalized = normalizeCsvValue(value);

  // IMPORTDATA writes values into cells. Neutralize spreadsheet-formula prefixes
  // so a creator-controlled text field can never execute as a formula.
  if (/^[=+\-@]/.test(normalized)) normalized = `'${normalized}`;

  return `"${normalized.replace(/"/g, '""')}"`;
};

const toCsv = (rows: PublicCreatorExportRow[]) => {
  const dataRows = rows.map(row => [
    row.public_id,
    row.display_name,
    row.stage_name,
    row.birth_year,
    row.gender,
    row.city,
    row.topics,
    row.industries,
    row.preferred_content,
    row.rate_text,
    row.reach_text,
    row.networks,
    row.social_links,
    row.portfolio_links,
    row.special_traits,
    row.experience_since,
    row.profile_quality_score,
  ]);

  return [HEADERS, ...dataRows]
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\r\n');
};

const responseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Type': 'text/csv; charset=utf-8',
  'Content-Disposition': 'inline; filename="ugc-vz-creators.csv"',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(request: Request) {
  if (!process.env.SHEET_EXPORT_TOKEN) {
    return new Response('Export is not configured.', {
      status: 503,
      headers: responseHeaders,
    });
  }

  const token = new URL(request.url).searchParams.get('token');
  if (!hasValidToken(token)) {
    return new Response('Unauthorized.', {
      status: 401,
      headers: responseHeaders,
    });
  }

  if (!isDatabaseConfigured()) {
    return new Response('Database is not configured.', {
      status: 503,
      headers: responseHeaders,
    });
  }

  try {
    const sql = getDatabase();
    const rows = await sql`
      SELECT
        public_id,
        display_name,
        stage_name,
        birth_year,
        gender,
        city,
        topics,
        industries,
        preferred_content,
        rate_text,
        reach_text,
        networks,
        social_links,
        portfolio_links,
        special_traits,
        experience_since,
        profile_quality_score
      FROM creator_search_public
      ORDER BY profile_quality_score DESC, display_name ASC
    ` as PublicCreatorExportRow[];

    // UTF-8 BOM keeps umlauts intact when the CSV is opened outside Sheets.
    return new Response(`\uFEFF${toCsv(rows)}`, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[creator-export] Failed to build public creator export.', error);
    return new Response('Export temporarily unavailable.', {
      status: 500,
      headers: responseHeaders,
    });
  }
}
