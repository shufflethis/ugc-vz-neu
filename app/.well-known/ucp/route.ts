import { NextResponse } from 'next/server';

// UCP-Manifest (Universal Commerce Protocol) unter /.well-known/ucp,
// design-doc.md §4.3. Feldnamen sind am 2026-08-17 per WebFetch UND per
// direktem `curl` auf den JSON-Schema-Quellen (kein Zusammenfassungsmodell
// dazwischen, siehe unten) gegen die normative Spec verifiziert:
// github.com/Universal-Commerce-Protocol/ucp, main-Branch,
// source/schemas/{profile,ucp,capability,service}.json sowie das
// Business-Profile-Beispiel in docs/specification/overview.md
// ("Profile Structure" -> "Business Profile"). v2026-04-08 ist ein echter
// Release-Tag dieses Repos (git tag v2026-04-08, neuester der drei
// vorhandenen Tags).
//
// ABWEICHUNG vom Task-5-Briefing-Entwurf (dort nur als Ausgangspunkt
// gedacht, "an die Spec anpassen statt zu erfinden" -- Ergebnis dieser
// Anpassung):
//
// 1. Kein `ucp_version`-Feld. Die Spec kennt nur ein verschachteltes
//    `ucp.version` (string, Pattern YYYY-MM-DD) innerhalb eines
//    Pflicht-Wrapper-Objekts `ucp`.
// 2. `ucp.services` und `ucp.payment_handlers` sind laut Spec PFLICHT
//    (auch wenn leer) -- nicht `ucp.capabilities` (optional) und keine
//    eigene `transports`-Sektion. Beide Registries sind KEY-BY-
//    Reverse-Domain-Name (Muster wie "dev.ucp.shopping.checkout"), nicht
//    Arrays mit `name`-Feld. Wir haben keinen `dev.ucp.*`-Namensraum
//    (das ist ucp.dev-Governance fuer die Kern-Capabilities Checkout/Cart/
//    Catalog/Order/Identity-Linking) -- eigene Capabilities/Services laufen
//    unter unserem eigenen Reverse-Domain-Namensraum `de.ugc-vz.*`.
// 3. Service-Eintraege brauchen `transport` (Enum rest|mcp|a2a|embedded) +
//    `endpoint`; `schema` ist dort nur fuer rest/mcp/embedded vorgesehen,
//    nicht fuer a2a. Wir bieten aktuell nur MCP (app/api/mcp) und A2A
//    (app/a2a) echt an -- der Briefing-Entwurf haette fuer "rest" dieselbe
//    A2A-JSON-RPC-URL zweckentfremdet; das haetten wir nicht erfunden,
//    also gibt es hier keinen rest-Eintrag, bis ein echter REST-Transport
//    existiert.
// 4. Jede Capability-Deklaration braucht `schema` (Pflicht in der
//    Business-Schema-Variante); `spec` ist optional. `version` ist auch
//    hier YYYY-MM-DD, kein Semver -- "1.0" aus dem Briefing-Entwurf waere
//    gegen das Schema invalid gewesen.
// 5. Kein `primary_capability`-Feld und keine `organization`/`commerce`-
//    Sektion in der Spec. `keys` (nicht "signing_keys") ist der einzige
//    weitere reservierte Top-Level-Schluessel (JWK-Set fuer Signaturen);
//    bleibt hier leer, da Signing wie in §4.4 dokumentiert erst spaeter
//    kommt (kein Signing in Phase 1, siehe a2a-agent-card.ts).
//
// `organization` und `commerce` (inkl. checkout.supported === false mit
// Begruendung sowie der Service-/Preis-Eintrag aus dem Briefing) bleiben
// unten als zusaetzliche, additive Top-Level-Felder erhalten -- die
// Wrapper-Schemas (profile.json#/$defs/base) sind additionalProperties:
// true, solche Erweiterungen sind also nicht spec-widrig, nur nicht
// Teil des reservierten `ucp`-Objekts. Gleiches additive Vorgehen wie in
// app/lib/a2a-agent-card.ts (dort ausfuehrlicher begruendet).
const UCP_VERSION = '2026-04-08';
const baseUrl = 'https://ugc-vz.de';

// Menschlich lesbare Spec-Referenz fuer unsere eigenen Services/Capabilities
// (optionales `spec`-Feld) -- verweist bewusst auf ein bereits existierendes,
// echtes Dokument statt eine noch nicht existierende PROTOCOLS.md zu
// erfinden (kommt laut design-doc.md §5 erst in einer spaeteren Task).
const specUrl = `${baseUrl}/llms.txt`;

// Bewusst NICHT exportiert: Next 14 App Router prueft route.ts-Exporte beim
// Build gegen eine feste Liste (GET/POST/.../dynamic/generateStaticParams/...);
// ein zusaetzlicher Export wie `manifest` waere dort "not a valid Route export
// field" -- lokal nicht pruefbar (kein next build moeglich, siehe
// vps-kein-lokaler-build-moeglich). scripts/validate-agent-layer.ts ruft
// stattdessen GET() auf und liest den tatsaechlich ausgelieferten JSON-Body
// (staerkerer Test: prueft das echte Response-Artefakt, nicht nur das
// Modul-interne Objekt). Gleiches Muster wie app/lib/a2a-agent-card.ts, das
// diesen Export deshalb konsequent in app/lib/ haelt statt im Route-File.
const manifest = {
  ucp: {
    version: UCP_VERSION,
    services: {
      'de.ugc-vz.creator_matching': [
        { version: UCP_VERSION, spec: specUrl, transport: 'mcp', endpoint: `${baseUrl}/api/mcp` },
        { version: UCP_VERSION, spec: specUrl, transport: 'a2a', endpoint: `${baseUrl}/a2a` },
      ],
    },
    capabilities: {
      'de.ugc-vz.creator_search': [
        { version: UCP_VERSION, spec: specUrl, schema: `${baseUrl}/api/agent-schemas/search_creators.json` },
      ],
      'de.ugc-vz.creator_get': [
        { version: UCP_VERSION, spec: specUrl, schema: `${baseUrl}/api/agent-schemas/get_creator.json` },
      ],
      'de.ugc-vz.outreach_request': [
        { version: UCP_VERSION, spec: specUrl, schema: `${baseUrl}/api/agent-schemas/request_outreach.json` },
      ],
      'de.ugc-vz.outreach_status': [
        { version: UCP_VERSION, spec: specUrl, schema: `${baseUrl}/api/agent-schemas/get_outreach_status.json` },
      ],
      'de.ugc-vz.vocab': [
        { version: UCP_VERSION, spec: specUrl, schema: `${baseUrl}/api/agent-schemas/get_vocab.json` },
      ],
    },
    // Pflichtfeld laut Spec, auch wenn leer -- wir vermitteln keine Zahlungen.
    payment_handlers: {},
  },
  // Kanonisches Spec-Feld fuer JWK-Signaturschluessel (RFC 7517 JWK-Set).
  // Leer, bis Web-Bot-Auth/HTTP-Message-Signatures existiert (§4.4).
  keys: [] as const,

  // ---- Additive Felder ueber die UCP-Spec hinaus (siehe Kommentar oben) ----
  organization: {
    name: 'UGC VZ - track by track GmbH',
    url: baseUrl,
    logo: `${baseUrl}/ugc-vz-logo.webp`,
    description:
      'Kostenloses Verzeichnis realer UGC-Creator im deutschsprachigen Raum. Vermittlung von Creator-Dienstleistungen mit direktem Kontakt; keine Provision, kein Checkout.',
  },
  commerce: {
    checkout: {
      supported: false,
      reason: 'Vermittlung von Dienstleistungen; Vertrag und Zahlung laufen direkt zwischen Brand und Creator.',
    },
    services: [
      {
        name: 'UGC-Creator-Vermittlung',
        price_range: {
          for_brands: 'kostenlos',
          creator_fees: 'individuell, Richtwerte im Creator-Profil (rate_text)',
          currency: 'EUR',
        },
        fulfillment: 'outreach_request -> Kontaktdaten per E-Mail an die Brand',
      },
    ],
  },
} as const;

export async function GET() {
  return NextResponse.json(manifest, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600', 'X-Robots-Tag': 'index, follow' },
  });
}
