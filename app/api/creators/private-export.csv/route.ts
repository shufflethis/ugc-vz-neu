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
  'E-Mail',
  'Telefon',
  'Sonstiger Kontakt',
  'E-Mail verifiziert am',
  'Plattform-Einwilligung',
  'Projekt-E-Mails',
  'Newsletter',
  'Profilstatus',
  'Letzte Aktualisierung',
] as const;

type PrivateCreatorExportRow = {
  public_id: string;
  display_name: string;
  stage_name: string | null;
  birth_year: number | null;
  email: string | null;
  phone: string | null;
  contact_text: string | null;
  email_verified_at: string | null;
  platform_consent: boolean | null;
  project_notifications_enabled: boolean | null;
  newsletter_enabled: boolean | null;
  status: string;
  updated_at: string;
};

const hasValidToken = (providedToken: string | null) => {
  const expectedToken = process.env.SHEET_PRIVATE_EXPORT_TOKEN;
  if (!providedToken || !expectedToken) return false;

  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};

const normalizeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n?/g, '\n').trim();
};

const escapeCsvCell = (value: unknown) => {
  let normalized = normalizeCsvValue(value);

  // IMPORTDATA writes values into cells. Neutralize spreadsheet-formula prefixes
  // so creator-controlled contact text can never execute as a formula.
  if (/^[=+\-@]/.test(normalized)) normalized = `'${normalized}`;

  return `"${normalized.replace(/"/g, '""')}"`;
};

const permissionLabel = (value: boolean | null) => {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  return 'Nicht erfasst';
};

const dateLabel = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};

const toCsv = (rows: PrivateCreatorExportRow[]) => {
  const dataRows = rows.map(row => [
    row.public_id,
    row.display_name,
    row.stage_name,
    row.birth_year,
    row.email,
    row.phone,
    row.contact_text,
    dateLabel(row.email_verified_at),
    permissionLabel(row.platform_consent),
    permissionLabel(row.project_notifications_enabled),
    permissionLabel(row.newsletter_enabled),
    row.status,
    dateLabel(row.updated_at),
  ]);

  return [HEADERS, ...dataRows]
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\r\n');
};

const responseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Content-Type': 'text/csv; charset=utf-8',
  'Content-Disposition': 'inline; filename="ugc-vz-private-contacts.csv"',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(request: Request) {
  if (!process.env.SHEET_PRIVATE_EXPORT_TOKEN) {
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
    const rows = await sql.query(`
      SELECT
        p.public_id,
        p.display_name,
        p.stage_name,
        p.birth_year,
        c.email,
        c.phone,
        c.contact_text,
        c.email_verified_at,
        platform.granted AS platform_consent,
        c.project_notifications_enabled,
        c.newsletter_enabled,
        p.status,
        p.updated_at
      FROM creator_profiles p
      LEFT JOIN creator_private_contacts c ON c.creator_id = p.id
      LEFT JOIN LATERAL (
        SELECT granted
        FROM consent_events
        WHERE creator_id = p.id AND purpose = 'platform'
        ORDER BY occurred_at DESC, created_at DESC
        LIMIT 1
      ) platform ON true
      ORDER BY
        CASE p.status WHEN 'active' THEN 0 WHEN 'pending_review' THEN 1 ELSE 2 END,
        p.display_name ASC
    `) as unknown as PrivateCreatorExportRow[];

    return new Response(`\uFEFF${toCsv(rows)}`, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[private-creator-export] Failed to build internal contact export.', error);
    return new Response('Export temporarily unavailable.', {
      status: 500,
      headers: responseHeaders,
    });
  }
}
