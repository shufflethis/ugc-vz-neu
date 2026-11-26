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

> UGC VZ ist eine Plattform für Creator-Kampagnen im DACH-Raum (Deutschland, Österreich, Schweiz). Marken starten Kampagnen nach geprüften Views (TKP), Fixpreis pro Video, Core-Creator-Retainer oder Affiliate-Kickbacks mit fester Budget-Obergrenze. Creator zahlen 0 % Plattformgebühr. Betreiber: track by track GmbH (Team famefact), Berlin.

Aktive Creator-Profile: ${activeCreators} (Stand ${standDate}). Öffentliche Suchergebnisse enthalten niemals private Kontaktdaten.

## Für Marken & Creator

- [Für Marken & Creator-Suche](${baseUrl}/brands): KI-Suche in 20 Kategorien, feste Budget-Obergrenze, kein Abo, 15 % Marken-Servicegebühr im Budget enthalten.
- [Marken-Workspace & Kampagnenstart](${baseUrl}/brand): Passwortloser Zugang per 6-stelligem Code für Pay-per-View, Pay-per-Video, Retainer und Affiliate-Kampagnen.
- [Für Creator](${baseUrl}/creator): Kostenlose Anmeldung, 0 % Plattformgebühr, 100 % Auszahlung des Satzes über Stripe Connect.
- [Preise & Gebührenmodell](${baseUrl}/preise): Transparente Konditionen für Marken (15 % Servicegebühr, SEPA 0 %, Karte +3 %) und Creator (0 %).
- [Häufige Fragen (FAQ)](${baseUrl}/faq): Antworten zu View-Prüfung, Abrechnung, Rechten und Auszahlungen.
- [Wissen & Ratgeber](${baseUrl}/wissen): DACH-Guides zu UGC-Preisen, Verträgen, Briefings und Plattform-Vergleichen.

## Schnittstellen für KI-Agenten

- [Authentifizierung & Zugangsregeln (auth.md)](${baseUrl}/auth.md): Dokumentation für anonymen Lesezugriff, Web Bot Auth (RFC 9421 Ed25519), OTP-Sessions und Shop-Webhooks.
- [OAuth Protected Resource Metadata (RFC 9728)](${baseUrl}/.well-known/oauth-protected-resource): Maschinenlesbare Auth- & Scope-Metadaten für Agenten.
- [MCP Server Manifest](${baseUrl}/.well-known/mcp.json): Model Context Protocol Discovery für \`POST ${baseUrl}/api/mcp\`.
- [WebMCP Browser Tools](${baseUrl}/.well-known/webmcp): Client-seitige Browser-Tools via \`navigator.modelContext\` plus deklarative Formulare (Human-in-the-loop).
- [OpenAPI 3.1 Spezifikation](${baseUrl}/openapi.json): Vollständige REST-API-Beschreibung für \`/api/v1/*\`.
- [A2A Agent Card](${baseUrl}/.well-known/agent-card.json): Agent-to-Agent-Protokollkarte für \`POST ${baseUrl}/a2a\`.
- [Vollversion für LLMs (llms-full.txt)](${baseUrl}/llms-full.txt): Ausführliche Dokumentation aller Fakten, Endpunkte und Preisregeln.

## Optional

- [Entwickler-Dokumentation](${baseUrl}/developers): Technische Übersicht zu MCP, WebMCP, REST, A2A und Web Bot Auth.
- [Brand Kit & Presse](${baseUrl}/brandkit): Offizielle Logos, Farben, Produktfakten und Pressekontakt.
- [Über UGC VZ](${baseUrl}/about): Team, Standort Berlin und Betreiberinformationen.
- [Impressum](${baseUrl}/impressum): Rechtliche Anbieterkennzeichnung der track by track GmbH.
- [Datenschutz](${baseUrl}/privacy): DSGVO-Informationen zur Datenverarbeitung.
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
