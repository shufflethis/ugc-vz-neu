import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { verifySession, CREATOR_SESSION_COOKIE } from '@/app/lib/creator-session';
import {
  diffProfile,
  loadCreatorProfile,
  recordProfileEdits,
  type CreatorProfileView,
} from '@/app/lib/creator-profile';
import {
  calculateReach,
  normalizeImageUrl,
  normalizeWebUrls,
  socialHandle,
  socialPlatform,
} from '@/app/lib/creator-registration';
import { tryUpdateSocialAvatar } from '@/app/lib/social-avatar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY_BYTES = 40_000;

const text = (value: unknown, max: number) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const multiline = (value: unknown, max: number) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\r\n?/g, '\n')
  .trim()
  .slice(0, max);

const isTrustedRequest = (request: NextRequest) => {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsedOrigin = new URL(origin).origin;
    const allowed = new Set([
      request.nextUrl.origin,
      'https://ugc-vz.de',
      'https://www.ugc-vz.de',
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [new URL(process.env.NEXT_PUBLIC_BASE_URL).origin] : []),
    ]);
    return allowed.has(parsedOrigin);
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Speichern ist gerade nicht verfügbar.' }, { status: 503 });
  }

  const creatorId = verifySession(request.cookies.get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.' }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Eingabe ist zu groß.' }, { status: 413 });
    }
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  const now = new Date().getFullYear();
  const birthYearRaw = Number(body.birthYear || 0);
  const birthYear = Number.isInteger(birthYearRaw) && birthYearRaw >= 1930 && birthYearRaw <= now - 16
    ? birthYearRaw
    : null;

  const name = text(body.name, 120);
  const stageName = text(body.stageName, 120);
  const topics = multiline(body.topics, 1_200);
  const preferredContent = multiline(body.preferredContent, 1_200);
  const rateText = multiline(body.rateText, 500);
  const socialLinks = normalizeWebUrls(body.socialLinks, 8);
  const portfolioLinks = normalizeWebUrls(body.portfolioLinks, 15);

  if (!name || !topics || !preferredContent || !rateText || socialLinks.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Bitte fülle Name, Themen, bevorzugte Formate, Preisvorstellung und mindestens einen Social-Link aus.',
    }, { status: 400 });
  }

  const after: CreatorProfileView = {
    publicId: '',
    name,
    stageName,
    email: '',
    birthYear,
    gender: text(body.gender, 80),
    city: text(body.city, 120),
    profileImageUrl: normalizeImageUrl(body.profileImageUrl),
    topics,
    preferredContent,
    industries: multiline(body.industries, 1_200),
    rateText,
    reachText: multiline(body.reachText, 500),
    equipment: multiline(body.equipment, 1_000),
    specialTraits: multiline(body.specialTraits, 1_000),
    childrenContext: multiline(body.childrenContext, 700),
    petContext: multiline(body.petContext, 700),
    socialLinks,
    portfolioLinks,
    newsletterConsent: body.newsletterConsent === true,
  };

  try {
    const sql = getDatabase();
    const before = await loadCreatorProfile(sql, creatorId);
    if (!before) {
      return NextResponse.json({ success: false, error: 'Profil nicht gefunden.' }, { status: 404 });
    }

    const displayName = stageName || name;
    const totalReach = calculateReach(after.reachText);
    const qualityScore = Math.min(100,
      20
      + (after.city ? 5 : 0)
      + (after.topics ? 15 : 0)
      + (after.preferredContent ? 15 : 0)
      + (after.rateText ? 15 : 0)
      + (socialLinks.length ? 15 : 0)
      + (portfolioLinks.length ? 15 : 0));

    await sql.query(
      `
      UPDATE creator_profiles SET
        display_name = $2,
        legal_name = $3,
        stage_name = $4,
        birth_year = $5,
        gender = $6,
        city = $7,
        topics = $8,
        preferred_content = $9,
        industries = $10,
        rate_text = $11,
        reach_text = $12,
        total_reach = $13,
        equipment = $14,
        special_traits = $15,
        children_context = $16,
        pet_context = $17,
        profile_quality_score = $18,
        profile_image_url = $19,
        updated_at = now()
      WHERE id = $1
    `,
      [
        creatorId, displayName, name, stageName || null, birthYear,
        after.gender || null, after.city || null, topics, preferredContent,
        after.industries || null, rateText, after.reachText || null, totalReach,
        after.equipment || null, after.specialTraits || null,
        after.childrenContext || null, after.petContext || null, qualityScore,
        after.profileImageUrl || null,
      ],
    );

    // Social-Links: native Eintraege des Creators vollstaendig ersetzen.
    // Importierte Eintraege (mit Follower-Daten) bleiben unberuehrt.
    await sql.query(`DELETE FROM creator_social_accounts WHERE creator_id = $1 AND source = 'native'`, [creatorId]);
    for (let index = 0; index < socialLinks.length; index += 1) {
      const url = socialLinks[index];
      await sql.query(
        `INSERT INTO creator_social_accounts (creator_id, platform, handle, url, is_primary, source)
         VALUES ($1, $2, $3, $4, $5, 'native')
         ON CONFLICT (creator_id, url) DO UPDATE SET
           platform = EXCLUDED.platform,
           handle = EXCLUDED.handle,
           is_primary = EXCLUDED.is_primary,
           source = 'native'`,
        [creatorId, socialPlatform(url), socialHandle(url), url, index === 0],
      );
    }

    await sql.query(`DELETE FROM creator_portfolio_items WHERE creator_id = $1 AND source = 'native'`, [creatorId]);
    for (let index = 0; index < portfolioLinks.length; index += 1) {
      await sql.query(
        `INSERT INTO creator_portfolio_items (creator_id, kind, url, sort_order, source)
         VALUES ($1, 'portfolio', $2, $3, 'native')
         ON CONFLICT (creator_id, url) DO UPDATE SET
           sort_order = EXCLUDED.sort_order,
           source = 'native'`,
        [creatorId, portfolioLinks[index], index],
      );
    }

    await sql.query(
      `UPDATE creator_private_contacts SET newsletter_enabled = $2, updated_at = now() WHERE creator_id = $1`,
      [creatorId, after.newsletterConsent],
    );

    const edits = diffProfile(before, { ...after, publicId: before.publicId, email: before.email });
    await recordProfileEdits(sql, creatorId, edits);

    // Best-Effort: Social-Profilbild sofort holen (Instagram blockt Vercel-IPs
    // haeufig - dann uebernimmt der VPS-Cron). Darf das Speichern nie verzoegern
    // oder kippen, deshalb hartes 3s-Limit und ohne Fehlerpropagation.
    if (!after.profileImageUrl && socialLinks.length > 0) {
      await tryUpdateSocialAvatar(sql, creatorId, socialLinks, 3000);
    }

    return NextResponse.json({ success: true, message: 'Dein Profil wurde gespeichert.' });
  } catch (error) {
    console.error('Creator profile save failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Speichern konnte nicht abgeschlossen werden.' }, { status: 500 });
  }
}
