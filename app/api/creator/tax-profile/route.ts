import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import {
  getCreatorTaxProfile,
  upsertCreatorTaxProfile,
  validateCreatorTaxProfileForPayout,
  type TaxCountry,
} from '@/app/lib/payments-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const profile = await getCreatorTaxProfile(sql, creatorId);
    const validation = validateCreatorTaxProfileForPayout(profile);
    return NextResponse.json({
      success: true,
      taxProfile: profile,
      validation,
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({
        success: true,
        migrationPending: true,
        taxProfile: null,
        validation: validateCreatorTaxProfileForPayout(null),
      });
    }
    return NextResponse.json({ success: false, error: 'Steuerprofil konnte nicht geladen werden.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const countryRaw = String(body.country || 'DE').toUpperCase();
  const country: TaxCountry = ['DE', 'AT', 'CH'].includes(countryRaw)
    ? (countryRaw as TaxCountry)
    : 'DE';

  const dateOfBirthRaw = String(body.dateOfBirth || '').trim();
  const dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthRaw) ? dateOfBirthRaw : null;

  try {
    const sql = getDatabase();
    const saved = await upsertCreatorTaxProfile(sql, {
      creatorId,
      legalName: String(body.legalName || ''),
      country,
      smallBusiness: Boolean(body.smallBusiness),
      taxNumber: String(body.taxNumber || ''),
      vatId: String(body.vatId || ''),
      taxId: String(body.taxId || ''),
      dateOfBirth,
      street: String(body.street || ''),
      postalCode: String(body.postalCode || ''),
      city: String(body.city || ''),
      agreeSelfBilling: Boolean(body.agreeSelfBilling),
    });

    const validation = validateCreatorTaxProfileForPayout(saved);
    return NextResponse.json({
      success: true,
      taxProfile: saved,
      validation,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Steuerprofil konnte nicht gespeichert werden.' },
      { status: 500 },
    );
  }
}
