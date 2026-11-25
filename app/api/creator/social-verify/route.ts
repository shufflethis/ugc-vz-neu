import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { cleanText, listCreatorSocialConnections, normalizeSocialHandle } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ALLOWED_PLATFORMS = new Set(['instagram', 'tiktok', 'youtube']);
const ALLOWED_HOSTS = new Set(['www.instagram.com', 'instagram.com', 'www.tiktok.com', 'tiktok.com', 'www.youtube.com', 'youtube.com']);

export async function GET(request: NextRequest) {
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  const accounts = await listCreatorSocialConnections(getDatabase(), creatorId);
  return NextResponse.json({ success: true, accounts }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ success: false, error: 'Datenbank nicht verfügbar.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const sql = getDatabase();
  const action = cleanText(body.action, 20);

  if (action === 'start') {
    const platform = cleanText(body.platform, 20).toLowerCase();
    if (!ALLOWED_PLATFORMS.has(platform)) {
      return NextResponse.json({ success: false, error: 'Unterstützt werden Instagram, TikTok und YouTube.' }, { status: 400 });
    }
    const normalized = normalizeSocialHandle(platform, String(body.handle || ''));
    if (!normalized) {
      return NextResponse.json({ success: false, error: 'Bitte gib einen gültigen Benutzernamen oder Profil-Link ein.' }, { status: 400 });
    }

    const code = `UGCVZ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [existing] = (await sql.query(
      `SELECT id FROM creator_social_accounts
       WHERE creator_id = $1 AND platform = $2 AND (lower(canonical_handle) = $3 OR lower(url) = lower($4))
       LIMIT 1`,
      [creatorId, platform, normalized.handle, normalized.url],
    )) as unknown as Array<any>;

    let accountId: string;
    if (existing) {
      accountId = String(existing.id);
      await sql.query(
        `UPDATE creator_social_accounts
         SET handle = $2, canonical_handle = $3, url = $4, verification_code = $5, verification_method = 'bio_code'
         WHERE id = $1`,
        [accountId, `@${normalized.handle}`, normalized.handle, normalized.url, code],
      );
    } else {
      const [inserted] = (await sql.query(
        `INSERT INTO creator_social_accounts (creator_id, platform, handle, canonical_handle, url, verification_code, verification_method)
         VALUES ($1, $2, $3, $4, $5, $6, 'bio_code')
         RETURNING id`,
        [creatorId, platform, `@${normalized.handle}`, normalized.handle, normalized.url, code],
      )) as unknown as Array<any>;
      accountId = String(inserted.id);
    }

    const accounts = await listCreatorSocialConnections(sql, creatorId);
    return NextResponse.json({ success: true, accountId, code, url: normalized.url, accounts });
  }

  if (action === 'check') {
    const accountId = cleanText(body.accountId, 60);
    const [account] = (await sql.query(
      `SELECT id, platform, url, canonical_handle, verification_code
       FROM creator_social_accounts
       WHERE id = $1 AND creator_id = $2
       LIMIT 1`,
      [accountId, creatorId],
    )) as unknown as Array<any>;

    if (!account || !account.verification_code) {
      return NextResponse.json({ success: false, error: 'Kein offener Verifizierungscode gefunden.' }, { status: 404 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(String(account.url));
      if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Profil-URL nicht zulässig.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Ungültige Profil-URL.' }, { status: 400 });
    }

    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UGC-VZ-Verify/1.0; +https://ugc-vz.de)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(6_000),
      });
      const finalHost = new URL(res.url).hostname.toLowerCase();
      if (!ALLOWED_HOSTS.has(finalHost)) {
        return NextResponse.json({ success: false, error: 'Unerwartete Weiterleitung beim Profilabruf.' }, { status: 400 });
      }
      const html = (await res.text()).slice(0, 350_000);
      const found = html.toUpperCase().includes(String(account.verification_code).toUpperCase());

      if (!found) {
        return NextResponse.json(
          {
            success: false,
            error: `Code „${account.verification_code}“ wurde auf der öffentlichen Profilseite noch nicht gefunden. Bitte prüfe, ob dein Profil öffentlich ist und der Code gespeichert wurde, und versuche es nach 1 Minute erneut.`,
          },
          { status: 422 },
        );
      }

      await sql.query(
        `UPDATE creator_social_accounts
         SET verified_at = now(), verification_method = 'bio_code', last_synced_at = now()
         WHERE id = $1`,
        [account.id],
      );

      const accounts = await listCreatorSocialConnections(sql, creatorId);
      return NextResponse.json({ success: true, verified: true, accounts });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Die öffentliche Profilseite konnte gerade nicht automatisch abgerufen werden (Plattform-Schutz). Dein Code bleibt gespeichert – versuche es gleich erneut oder schreib uns kurz an hi@ugc-vz.de.',
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ success: false, error: 'Unbekannte Aktion.' }, { status: 400 });
}
