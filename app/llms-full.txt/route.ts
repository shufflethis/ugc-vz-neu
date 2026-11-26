import { NextResponse } from 'next/server';
import { getDatabase, isDatabaseConfigured } from '@/app/lib/database';
import { getPublishedPosts } from '@/app/lib/content-repository';
import { CREATOR_COUNT_LABEL } from '@/app/lib/creator-count';
import { NICHES, nichePath } from '@/app/lib/niches';

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
  const posts = getPublishedPosts();
  const activeCreators = await getLiveActiveCreatorCount();
  const standDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date());

  const content = `# UGC VZ (Vollständige Dokumentation für KI-Systeme)

> UGC VZ ist eine Plattform für Creator-Kampagnen in Deutschland, Österreich und der Schweiz (DACH).
> Marken legen ein kurzes Briefing, einen Preis pro 1.000 Views und eine verpflichtende Budget-Obergrenze fest.
> Creator posten auf TikTok, Instagram Reels oder YouTube Shorts. Bezahlt werden nur geprüfte Beiträge und geprüfte Views.
> Betreiber: track by track GmbH, Schliemannstr. 23, 10437 Berlin (Team der Social-Media-Agentur famefact).

## Produktmodell & Preise

- Konto für Marken und Creator: kostenlos, kein Abo, keine Einrichtungsgebühr.
- Weg 1 (View-Kampagne): Marke legt Preis pro 1.000 geprüfte Views und eine feste Budget-Obergrenze fest. Gezählt werden nur geprüfte Beiträge, die bis Kampagnenende online sind, in vollen 1.000er-Schritten.
- Weg 2 (Creator-Produktion): Marken beauftragen Creator gezielt für Produktvideos und Ad-Creatives zum Festpreis.
- Servicegebühr Marken: 15 % fest, bereits in der Budget-Obergrenze enthalten (Black Friday bis Cyber Monday vom 27.11.2026 bis 30.11.2026 23:59 Uhr MEZ: 10 % statt 15 %).
- Gebühr für Creator: 0 %. Der angezeigte Satz pro 1.000 Views kommt vollständig beim Creator an.
- Aktive Creator-Profile: ${activeCreators} (Stand ${standDate}).

## Häufige Fragen (FAQ)

### Was kostet mich UGC VZ als Marke?
Das Konto ist kostenlos, es gibt kein Abo. Du zahlst pro 1.000 geprüfte Views den Preis, den du selbst festlegst, höchstens bis zu deiner Budget-Obergrenze. Darin sind 15 % Servicegebühr bereits enthalten.

### Wofür ist die Servicegebühr?
Für die Prüfung jedes Beitrags, die Zahlungsabwicklung, Gutschriften für Creator und deinen Report. Sie ist im Budget enthalten.

### Welche Views werden bezahlt?
Nur Views von Beiträgen, die deinen Brief erfüllen und bis Kampagnenende online sind. Gezählt wird in vollen 1.000er-Schritten.

### Kostet mich UGC VZ als Creator etwas?
Nein. Du bekommst den vollen Satz pro 1.000 Views, den du vor der Teilnahme siehst. Die Plattform bezahlt die Marke.

### Wie verdiene ich als Creator Geld?
Du suchst dir eine Kampagne aus, postest auf deinem Profil und reichst den Link ein. Jede Kampagne zeigt vorher, was sie pro 1.000 Views zahlt.

### Kann ich auch Videos ohne Posting kaufen?
Ja. Neben View-Kampagnen kannst du Creator für Produktvideos und Ad-Creatives direkt beauftragen.

## Datenschutz & Vertrauen

- Öffentliche Suchergebnisse und API-Antworten enthalten niemals private E-Mail-Adressen, Telefonnummern oder Klarnamen.
- Für Creator-Kontakt, Kampagnenstart und request_outreach ist ein Marken-Konto erforderlich.
- Betreiber: track by track GmbH, Geschäftsführer Tobias Sander, Schliemannstr. 23, 10437 Berlin, USt-IdNr. DE814954842, DUNS 34-024-8055, Kontakt hi@ugc-vz.de.

## Schnittstellen für KI-Agenten

- MCP-Server (Streamable HTTP): ${baseUrl}/api/mcp
- OpenAPI 3.1 (REST /api/v1): ${baseUrl}/openapi.json
- MCP-Discovery-Manifest: ${baseUrl}/.well-known/mcp.json
- WebMCP-Manifest: ${baseUrl}/.well-known/webmcp
- A2A Agent Card: ${baseUrl}/.well-known/agent-card.json
- UCP-Manifest: ${baseUrl}/.well-known/ucp
- Developer-Doku: ${baseUrl}/developers
- Hinweis: request_outreach / POST /api/v1/outreach löst echte E-Mails aus und erfordert ein Marken-Konto.

## Hauptseiten

- ${baseUrl}/brands: Creator-Kampagnen für Marken
- ${baseUrl}/preise: Transparente Preise und Budget-Rechner
- ${baseUrl}/creator: Als Creator anmelden und pro 1.000 Views verdienen
- ${baseUrl}/faq: Häufige Fragen für Marken und Creator
- ${baseUrl}/brands/ugc-creator-finden: Creator-Pool als Vorschau
- ${baseUrl}/brands/ugc-creator-preise: Marktpreise für UGC-Videos in Deutschland
- ${baseUrl}/brands/ugc-kosten-rechner: Interaktiver UGC-Kostenrechner
- ${baseUrl}/brands/ugc-vertrag-vorlage: Briefing- und Vertragsvorlage
- ${baseUrl}/vergleich: UGC-Plattformen im Vergleich
- ${baseUrl}/about: Team von famefact und Hintergrund
${NICHES.map((n) => `- ${baseUrl}${nichePath(n)}: UGC Creator ${n.chip}`).join('\n')}

## Wissensartikel (${posts.length})

${posts.map((post) => `- ${baseUrl}/wissen/${post.slug}: ${post.title}`).join('\n')}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
