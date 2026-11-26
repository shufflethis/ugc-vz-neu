import { NextResponse } from 'next/server';
import { getActivePromo } from '@/app/lib/platform-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liefert den aktuellen Gebuehren- und Aktionsstatus anhand der Serverzeit,
 * damit Countdowns und Aktionssatz (10 % bis Mo 30.11.2026 23:59:59 MEZ)
 * unabhaengig von der Browser-Uhr funktionieren.
 */
export async function GET() {
  const promo = getActivePromo(new Date());
  return NextResponse.json(promo, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
