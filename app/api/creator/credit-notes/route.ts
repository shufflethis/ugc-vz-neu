import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_SESSION_COOKIE, verifySession } from '@/app/lib/creator-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const creatorId = verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value);
  if (!creatorId) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Datenbank nicht konfiguriert.' }, { status: 503 });
  }

  const format = request.nextUrl.searchParams.get('format') || 'json';

  try {
    const sql = getDatabase();
    const rows = await sql.query(
      `SELECT id, number, period, net_cents, vat_rate_type, vat_cents, gross_cents, small_business, issued_at
       FROM credit_notes
       WHERE creator_id = $1
       ORDER BY issued_at DESC`,
      [creatorId],
    );

    if (format === 'csv') {
      const header = ['Nummer', 'Datum', 'Zeitraum', 'Netto (EUR)', 'USt-Typ', 'USt (EUR)', 'Brutto (EUR)', 'Kleinunternehmer'];
      const lines = [
        header.join(';'),
        ...rows.map((r) =>
          [
            csvEscape(String(r.number)),
            csvEscape(new Date(String(r.issued_at)).toISOString().slice(0, 10)),
            csvEscape(String(r.period)),
            csvEscape((Number(r.net_cents) / 100).toFixed(2).replace('.', ',')),
            csvEscape(String(r.vat_rate_type)),
            csvEscape((Number(r.vat_cents) / 100).toFixed(2).replace('.', ',')),
            csvEscape((Number(r.gross_cents) / 100).toFixed(2).replace('.', ',')),
            csvEscape(r.small_business ? 'Ja' : 'Nein'),
          ].join(';'),
        ),
      ];
      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ugc-vz-gutschriften.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      creditNotes: rows.map((r) => ({
        id: String(r.id),
        number: String(r.number),
        period: String(r.period),
        netCents: Number(r.net_cents),
        vatRateType: String(r.vat_rate_type),
        vatCents: Number(r.vat_cents),
        grossCents: Number(r.gross_cents),
        smallBusiness: Boolean(r.small_business),
        issuedAt: new Date(String(r.issued_at)).toISOString(),
      })),
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ success: true, creditNotes: [] });
    }
    return NextResponse.json({ success: false, error: 'Gutschriften konnten nicht geladen werden.' }, { status: 500 });
  }
}
