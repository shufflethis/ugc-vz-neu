// Markdown-Varianten zentraler Seiten (Content-Negotiation, acceptmarkdown.com):
// src/middleware.ts rewritet GET-Requests mit "Accept: text/markdown" hierher.
// Wissensartikel werden aus contentHtml konvertiert (turndown, memoisiert),
// Marketing-Seiten sind kompakte, handgepflegte Zusammenfassungen.
// X-Robots-Tag: noindex - die Markdown-Variante darf nicht als Duplicate
// Content neben der HTML-Seite ranken.
import { NextRequest, NextResponse } from 'next/server';
import TurndownService from 'turndown';
import { getContentPost, getPublishedPosts } from '@/app/lib/content-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = 'https://ugc-vz.de';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndown.remove(['script', 'style', 'iframe']);

// Konvertierte Artikel pro Deploy cachen - Inhalte sind build-statisch.
const markdownCache = new Map<string, string>();

const FOOTER = `\n\n---\n\nUGC VZ - kostenloses UGC-Creator-Verzeichnis (DACH) der track by track GmbH.\nKontakt: hi@ugc-vz.de - Uebersicht: ${BASE}/llms.txt - API: ${BASE}/developers`;

const STATIC_PAGES: Record<string, () => string> = {
  '': () => `# UGC VZ - UGC Creator finden

Kostenloses Verzeichnis fuer die Vermittlung realer UGC-Creator an Unternehmen in Deutschland, Oesterreich und der Schweiz.

## So funktioniert es

1. Brand beschreibt die Kampagne unter ${BASE}/brands (Freitext-Suche, KI-gestuetzt strukturiert).
2. UGC VZ zeigt passende Creator-Profile mit Reichweite, Themen, Preisen und Portfolio.
3. Nach bewusster Auswahl erhaelt die Brand die Kontaktdaten per E-Mail. Keine Provision.

## Fuer Creator

Kostenloses Profil mit Portfolio, Themen, Preisen und Social-Links: ${BASE}/creator

## Fuer KI-Agenten

- MCP-Server: ${BASE}/api/mcp (Manifest: ${BASE}/.well-known/mcp.json)
- REST-API: ${BASE}/openapi.json
- A2A: ${BASE}/.well-known/agent-card.json
- Developer-Portal: ${BASE}/developers
- Inhaltsverzeichnis: ${BASE}/llms.txt`,

  developers: () => `# UGC VZ Developer-Portal

Alle Schnittstellen sind oeffentlich und ohne API-Key nutzbar. Details: ${BASE}/developers

- REST-API (OpenAPI 3.1): ${BASE}/openapi.json - Suche, Profile, Kontaktanfragen, Vokabular
- MCP-Server (Streamable HTTP): ${BASE}/api/mcp - Manifest: ${BASE}/.well-known/mcp.json
- A2A Agent Card: ${BASE}/.well-known/agent-card.json
- UCP-Manifest: ${BASE}/.well-known/ucp
- Fehlerformat: RFC 7807 (application/problem+json)
- Rate-Limits: IP-basiert; Web-Bot-Auth-signierte Agenten erhalten hoehere Limits.

Wichtig: POST /api/v1/outreach loest ECHTE E-Mails aus - kein Test-Endpunkt.`,

  brands: () => `# UGC Creator finden und beauftragen

Kampagne in einem Satz beschreiben, passende UGC-Creator aus dem DACH-Raum erhalten, Kontaktdaten nach bewusster Auswahl per E-Mail. Kostenlos, ohne Provision.

Suche starten: ${BASE}/brands
Preisorientierung: ${BASE}/brands/ugc-creator-preise
Vertrags-/Briefing-Vorlage: ${BASE}/brands/ugc-vertrag-vorlage`,

  creator: () => `# Als UGC-Creator anmelden

Kostenloses Profil im UGC-VZ-Verzeichnis: Portfolio, Themen, Preise, Social-Links. Brands finden dich ueber die Suche; Kontakt kommt per E-Mail-Anfrage. Keine Provision, keine Exklusivitaet.

Anmeldung: ${BASE}/creator
Profil bearbeiten: ${BASE}/konto`,

  vergleich: () => `# UGC-Plattformen im Vergleich

Redaktioneller Vergleich von UGC-Plattformen im DACH-Raum mit Quellen und Pruefdatum: ${BASE}/vergleich

Einzelvergleiche u. a.: Speekly, Influee, stylink, Boksi - jeweils unter ${BASE}/vergleich/<slug>.`,

  about: () => `# Ueber UGC VZ

UGC VZ ist ein Produkt der track by track GmbH (Berlin), Schwester der Social-Media-Agentur famefact. Das Verzeichnis vermittelt reale UGC-Creator kostenlos und provisionsfrei an Brands.

Betreiber: track by track GmbH, Schliemannstr. 23, 10437 Berlin - hi@ugc-vz.de
Details: ${BASE}/about - Impressum: ${BASE}/impressum`,

  contact: () => `# Kontakt

- E-Mail: hi@ugc-vz.de
- Telefon: +49 30 403 665 451
- Post: track by track GmbH, Schliemannstr. 23, 10437 Berlin, Deutschland

Fuer Creator-Profilfragen bitte die Profil-ID (UGC-...) angeben. Details: ${BASE}/contact`,

  privacy: () => `# Privacy at UGC VZ (English summary)

The authoritative privacy policy (German, GDPR) lives at ${BASE}/datenschutz.

Key principles: public search results never contain private contact data; creator contact details are only shared after an explicit brand request; AI services receive the search query, never the full creator database. Details: ${BASE}/privacy`,
};

export async function GET(_request: NextRequest, { params }: { params: { path?: string[] } }) {
  const segments = params.path || [];
  const key = segments.join('/');

  let markdown: string | null = null;

  if (key in STATIC_PAGES) {
    markdown = STATIC_PAGES[key]();
  } else if (segments[0] === 'wissen' && segments.length === 2) {
    const slug = segments[1];
    if (markdownCache.has(slug)) {
      markdown = markdownCache.get(slug)!;
    } else {
      const post = getContentPost(slug);
      if (post) {
        const body = turndown.turndown(post.contentHtml || '');
        markdown = `# ${post.title}\n\n${body}`;
        markdownCache.set(slug, markdown);
      }
    }
  } else if (key === 'wissen') {
    const posts = getPublishedPosts();
    markdown = `# UGC VZ Wissen\n\n${posts.map((post) => `- [${post.title}](${BASE}/wissen/${post.slug})`).join('\n')}`;
  }

  if (!markdown) {
    return new NextResponse(
      `# 404 - Seite nicht gefunden\n\nDiese Markdown-Variante existiert nicht.\n\n- Sitemap: ${BASE}/sitemap.xml\n- Inhaltsverzeichnis: ${BASE}/llms.txt\n- API-Uebersicht: ${BASE}/developers${FOOTER}`,
      { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Robots-Tag': 'noindex', Vary: 'Accept' } },
    );
  }

  return new NextResponse(markdown + FOOTER, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
      Vary: 'Accept',
    },
  });
}
