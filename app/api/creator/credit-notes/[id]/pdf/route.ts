import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';
import { getCreatorTaxProfile } from '@/app/lib/payments-ledger';
import { generateCreditNotePdfWithZugferd } from '@/app/lib/credit-note-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const [note] = await sql.query(
      `SELECT id, number, period, net_cents, small_business, issued_at
       FROM credit_notes
       WHERE id = $1 AND creator_id = $2
       LIMIT 1`,
      [params.id, creatorId],
    );
    if (!note) {
      return NextResponse.json({ success: false, error: 'Gutschrift nicht gefunden.' }, { status: 404 });
    }
    const taxProfile = await getCreatorTaxProfile(sql, creatorId);
    const generated = await generateCreditNotePdfWithZugferd({
      number: String(note.number),
      issuedAtIso: new Date(String(note.issued_at)).toISOString(),
      period: String(note.period),
      creator: {
        legalName: taxProfile?.legalName || 'Creator',
        street: taxProfile?.street || '',
        postalCode: taxProfile?.postalCode || '',
        city: taxProfile?.city || '',
        country: taxProfile?.country || 'DE',
        smallBusiness: Boolean(note.small_business),
        taxNumber: taxProfile?.taxNumber || '',
        vatId: taxProfile?.vatId || '',
      },
      netCents: Number(note.net_cents),
    });

    return new NextResponse(Buffer.from(generated.pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${String(note.number)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Gutschrift-PDF konnte nicht erstellt werden.' }, { status: 500 });
  }
}
