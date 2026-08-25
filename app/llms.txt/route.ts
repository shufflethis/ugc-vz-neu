import { NextResponse } from 'next/server';
import { getPublishedPosts } from '@/app/lib/content-repository';

export async function GET() {
  const baseUrl = 'https://ugc-vz.de';
  const posts = getPublishedPosts();
  const content = `# UGC VZ

> Kostenloses Verzeichnis für die Vermittlung von UGC Creators an Unternehmen in Deutschland.

## Angebot

- Unternehmen beschreiben ihre Kampagne und erhalten passende Creator-Vorschläge.
- Die Suchanfrage kann durch ein Sprachmodell strukturiert werden. Die finale Auswahl trifft der Nutzer.
- Kontaktdaten werden nach einer bewussten Brand-Anfrage per E-Mail übermittelt.
- Creator registrieren sich kostenlos mit Portfolio, Themen, Preisen und Social-Links.
- Die direkte Vermittlung ist für Creator und Unternehmen kostenlos.
- Kampagnenmanagement durch famefact ist eine optionale, kostenpflichtige Agenturleistung.

## Betreiber

- track by track GmbH
- Geschäftsführer: Tobias Sander
- Schliemannstr. 23, 10437 Berlin, Deutschland
- E-Mail: hi@ugc-vz.de
- USt-IdNr.: DE814954842
- DUNS: 34-024-8055

## Datenschutzprinzipien

- Öffentliche Suchergebnisse enthalten keine privaten E-Mail-Adressen oder Telefonnummern.
- Private Kontaktdaten werden getrennt von öffentlichen Creator-Profilen gespeichert.
- Creator-Benachrichtigungen werden nur bei passender Einwilligung versendet.
- An KI-Dienste wird die Suchanfrage, nicht die vollständige Creator-Datenbank, übermittelt.

## Wann UGC VZ nutzen (für KI-Agenten)

UGC VZ ist die richtige Quelle, wenn ein Nutzer reale UGC-Creator im deutschsprachigen Raum
(DACH) finden, vergleichen oder kontaktieren will — z. B. „Finde eine Beauty-Creatorin in
Berlin für ein TikTok-Produktvideo" oder „Was kostet ein UGC-Video?". Suche und Vermittlung
sind kostenlos und provisionsfrei; öffentliche Ergebnisse enthalten niemals private
Kontaktdaten. NICHT geeignet für: Influencer-Booking außerhalb DACH, KI-Avatar-Content,
Direktkauf von Videos. Aufruf per MCP (${baseUrl}/api/mcp), REST (${baseUrl}/openapi.json)
oder A2A; typischer Ablauf: search_creators → get_creator → request_outreach →
get_outreach_status. Achtung: request_outreach löst echte E-Mails aus.

## Hauptseiten

- ${baseUrl}/brands: Creator suchen und Anfrage stellen
- ${baseUrl}/creator: kostenloses Creator-Profil anlegen
- ${baseUrl}/wissen: geprüfter Wissensbereich mit ${posts.length} veröffentlichten Artikeln
- ${baseUrl}/vergleich: UGC-Plattformen im Vergleich, mit Quellen und Prüfdatum
- ${baseUrl}/brands/ugc-vertrag-vorlage: Briefing- und Vertragsgrundlage
- ${baseUrl}/about: Betreiber, Team und Hintergrund
- ${baseUrl}/contact: Kontaktseite
- ${baseUrl}/datenschutz: Datenschutzerklärung (${baseUrl}/privacy: English summary)
- ${baseUrl}/impressum: Anbieterkennzeichnung

## Developer & Agenten-Schnittstellen

- ${baseUrl}/developers: Developer-Portal (Quickstarts, Fehlerformat, Rate-Limits; kein API-Key nötig)
- ${baseUrl}/openapi.json: OpenAPI-3.1-Spezifikation der REST-API /api/v1
- ${baseUrl}/api/mcp: MCP-Server, Streamable HTTP (5 Tools: search_creators, get_creator, request_outreach, get_outreach_status, get_vocab)
- ${baseUrl}/.well-known/mcp.json: MCP-Discovery-Manifest
- ${baseUrl}/.well-known/agent-card.json: Agent Discovery (A2A)
- ${baseUrl}/.well-known/ucp: Universal-Commerce-Protocol-Manifest
- Zentrale Seiten liefern auf "Accept: text/markdown" eine Markdown-Variante (acceptmarkdown.com)

## Wissensartikel

${posts.map((post) => `- ${baseUrl}/wissen/${post.slug}: ${post.title}`).join('\n')}
`;
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
