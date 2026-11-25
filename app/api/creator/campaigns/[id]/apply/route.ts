import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { cleanMultiline, cleanText, toPositiveIntOrNull } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
  const publicId = cleanText(params.id, 30);
  const [campaign] = (await sql.query(
    `SELECT id, visibility, status, requires_product_choice FROM brand_campaigns WHERE public_id = $1 LIMIT 1`,
    [publicId],
  )) as unknown as Array<any>;
  if (!campaign || campaign.status !== 'active') {
    return NextResponse.json({ success: false, error: 'Kampagne ist nicht mehr aktiv.' }, { status: 404 });
  }

  const [existing] = (await sql.query(
    `SELECT id, status FROM brand_campaign_applications WHERE campaign_id = $1 AND creator_id = $2 LIMIT 1`,
    [campaign.id, creatorId],
  )) as unknown as Array<any>;

  if (!existing && campaign.visibility !== 'open') {
    return NextResponse.json({ success: false, error: 'Diese Kampagne ist nur auf Einladung zugänglich.' }, { status: 403 });
  }

  const action = cleanText(body.action, 20);
  const pitch = cleanMultiline(body.pitch, 1500);
  const proposedFeeEur = toPositiveIntOrNull(body.proposedFeeEur, 50_000);
  const availabilityNote = cleanText(body.availabilityNote, 200);
  const allowedTargetPlatforms = new Set(['tiktok', 'instagram', 'youtube', 'tiktok_shop', 'files_only']);
  const targetPlatforms = Array.isArray(body.targetPlatforms)
    ? [...new Set(body.targetPlatforms.map((p) => cleanText(p, 30).toLowerCase()).filter((p) => allowedTargetPlatforms.has(p)))]
    : [];
  const productChoice = cleanText(body.productChoice, 300);

  if (action !== 'decline' && Array.isArray(body.targetPlatforms) && targetPlatforms.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Bitte wähle mindestens eine Plattform aus, auf der du posten möchtest.' },
      { status: 400 },
    );
  }
  if (action !== 'decline' && campaign.requires_product_choice && !productChoice) {
    return NextResponse.json(
      { success: false, error: 'Bitte gib deine gewünschte Produkt-/Varianten-Auswahl für diese Kampagne an.' },
      { status: 400 },
    );
  }

  if (existing) {
    const nextStatus = action === 'decline'
      ? 'declined'
      : existing.status === 'invited' || existing.status === 'declined'
        ? 'applied'
        : existing.status;
    await sql.query(
      `UPDATE brand_campaign_applications
       SET status = $2, creator_pitch = $3, proposed_fee_eur = $4,
           availability_note = $5, target_platforms = $6, product_choice = $7,
           responded_at = now(), updated_at = now()
       WHERE id = $1`,
      [existing.id, nextStatus, pitch, proposedFeeEur, availabilityNote, targetPlatforms, productChoice],
    );
    return NextResponse.json({ success: true, applicationId: existing.id, status: nextStatus });
  }

  const [created] = (await sql.query(
    `INSERT INTO brand_campaign_applications (
       campaign_id, creator_id, source, status, creator_pitch, proposed_fee_eur,
       availability_note, target_platforms, product_choice, responded_at
     ) VALUES ($1, $2, 'applied', 'applied', $3, $4, $5, $6, $7, now())
     RETURNING id, status`,
    [campaign.id, creatorId, pitch, proposedFeeEur, availabilityNote, targetPlatforms, productChoice],
  )) as unknown as Array<any>;

  return NextResponse.json({ success: true, applicationId: created.id, status: created.status }, { status: 201 });
}
