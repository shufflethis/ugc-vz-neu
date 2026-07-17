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

## Hauptseiten

- ${baseUrl}/brands: Creator suchen und Anfrage stellen
- ${baseUrl}/creator: kostenloses Creator-Profil anlegen
- ${baseUrl}/wissen: geprüfter Wissensbereich mit ${posts.length} veröffentlichten Artikeln
- ${baseUrl}/brands/ugc-vertrag-vorlage: Briefing- und Vertragsgrundlage
- ${baseUrl}/about: Betreiber, Team und Hintergrund
- ${baseUrl}/datenschutz: Datenschutzerklärung
- ${baseUrl}/impressum: Anbieterkennzeichnung
- ${baseUrl}/.well-known/agent-card.json: Agent Discovery

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
