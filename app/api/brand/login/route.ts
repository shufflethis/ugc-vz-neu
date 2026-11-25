import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { buildBrandLoginEmail } from '@/app/lib/brand-login-email';
import { isTrustedSameOrigin } from '@/app/lib/brand-session';
import { cleanText, createBrandLoginToken, upsertBrandAccount } from '@/app/lib/brand-workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const WINDOW_MS = 60 * 60 * 1000;
const rateLimits = new Map<string, number[]>();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const getIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
const hashKey = (value: string) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);

const consumeLimit = (key: string, limit: number) => {
  const now = Date.now();
  const recent = (rateLimits.get(key) || []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= limit) return false;
  recent.push(now);
  rateLimits.set(key, recent);
  return true;
};

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Der Brand-Login ist gerade nicht verfügbar.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  if (cleanText(body.website, 200)) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const email = cleanText(body.email, 254).toLowerCase();
  if (!emailRegex.test(email)) {
    return NextResponse.json({ success: false, error: 'Bitte gib eine gültige geschäftliche E-Mail-Adresse an.' }, { status: 400 });
  }

  if (!consumeLimit(`ip:${hashKey(getIp(request))}`, 10) || !consumeLimit(`email:${hashKey(email)}`, 4)) {
    return NextResponse.json({ success: false, error: 'Zu viele Anfragen. Bitte versuche es später erneut.' }, { status: 429 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ success: false, error: 'Der E-Mail-Versand ist gerade nicht konfiguriert.' }, { status: 503 });
  }

  try {
    const sql = getDatabase();
    const brand = await upsertBrandAccount(sql, {
      email,
      contactName: cleanText(body.name, 120),
      companyName: cleanText(body.company, 140),
    });
    const redirectTo = cleanText(body.redirectTo, 200);
    const token = await createBrandLoginToken(sql, brand.id, redirectTo);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const loginUrl = new URL('/brand/verify', baseUrl);
    loginUrl.searchParams.set('token', token);

    const emailPayload = buildBrandLoginEmail({
      name: brand.contactName,
      company: brand.companyName,
      loginUrl: loginUrl.toString(),
    });

    const resend = new Resend(resendApiKey);
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM || 'UGC VZ <hi@ugc-vz.de>',
      to: email,
      replyTo: process.env.UGC_INTERNAL_EMAIL || 'hi@ugc-vz.de',
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      tags: [
        { name: 'category', value: 'brand_login' },
        { name: 'audience', value: 'brand' },
      ],
    });

    if (response.error) {
      console.error('Brand login email failed', response.error.name);
      return NextResponse.json({ success: false, error: 'Die E-Mail konnte nicht versendet werden.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'Wir haben dir deinen persönlichen Anmeldelink geschickt. Prüfe bitte dein Postfach (und ggf. Spam).',
    });
  } catch (error) {
    console.error('Brand login failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Anmeldung konnte gerade nicht gestartet werden.' }, { status: 500 });
  }
}
