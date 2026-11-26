import { NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';

export const revalidate = 3600;

async function getLiveActiveCreatorCount(): Promise<string> {
  if (!isDatabaseConfigured()) return CREATOR_COUNT_LABEL;
  try {
    const sql = getDatabase();
    const [row] = (await sql.query(
      `SELECT COUNT(*)::int AS count FROM creator_profiles WHERE status = 'active'`,
    )) as unknown as Array<{ count: number }>;
    const count = Number(row?.count || 0);
    return count > 0 ? String(count) : CREATOR_COUNT_LABEL;
  } catch {
    return CREATOR_COUNT_LABEL;
  }
}

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  const activeCreators = await getLiveActiveCreatorCount();
  const standDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date());

  const content = `# UGC VZ

> UGC VZ ist eine Plattform für Creator-Kampagnen in Deutschland, Österreich und der Schweiz.
> Marken legen ein kurzes Briefing, einen Preis pro 1.000 Views und eine feste Budget-Obergrenze fest.
> Creator posten auf TikTok, Instagram Reels oder YouTube Shorts. Bezahlt werden nur geprüfte Views.
> Betreiber: track by track GmbH (Team der Social-Media-Agentur famefact), Berlin.

## Für Marken

- View-Kampagne: Preis pro 1.000 geprüfte Views, feste Budget-Obergrenze, kein Abo.
- Creator-Produktion: Produktvideos und Ad-Creatives direkt bei Creatorn beauftragen.
- Konto kostenlos. Servicegebühr: 15 % fest, schon im Budget enthalten (Creator zahlen 0 %).
- Start: ${baseUrl}/brands

## Für Creator

- Anmeldung kostenlos. 0 % Plattformgebühr für Creator.
- Jede Kampagne zeigt vorher ihren Satz pro 1.000 Views. Der Satz kommt vollständig beim Creator an.
- Start: ${baseUrl}/creator

## Zahlen (live)

- Aktive Creator-Profile: ${activeCreators} (Stand ${standDate})

## Für KI-Agenten

- MCP: ${baseUrl}/api/mcp · REST: ${baseUrl}/openapi.json · Vollversion: ${baseUrl}/llms-full.txt
- Öffentliche Suchergebnisse enthalten niemals private Kontaktdaten (E-Mail, Telefon, Klarname).
- Achtung: request_outreach löst echte E-Mails aus und erfordert ein Brand-Konto.
- WebMCP: ${baseUrl}/.well-known/webmcp

## Wichtige Seiten

- ${baseUrl}/brands
- ${baseUrl}/creator
- ${baseUrl}/preise
- ${baseUrl}/faq
- ${baseUrl}/wissen
- ${baseUrl}/developers
- ${baseUrl}/about
- ${baseUrl}/impressum
- ${baseUrl}/datenschutz
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
