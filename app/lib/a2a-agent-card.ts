import { AGENT_LAYER_VERSION } from '@/app/lib/agent-version';

const baseUrl = 'https://ugc-vz.de';

// A2A v1.0 (April 2026, Linux Foundation). Normativ ist ausschliesslich
// specification/a2a.proto im a2aproject/A2A-Repo (dortiges Spec-Kapitel 1.4).
// Verifiziert am 2026-08-17 gegen genau diese Datei (main-Branch):
//
// - AgentCard hat in v1.0 KEIN eigenes protocolVersion-Feld mehr; die
//   Felder `url`, `preferredTransport` und `additionalInterfaces` aus v0.3.0
//   wurden vollstaendig durch ein geordnetes `supportedInterfaces`-Array
//   ersetzt (erster Eintrag = bevorzugt), dessen Eintraege selbst
//   { url, protocolBinding, protocolVersion, tenant? } tragen.
// - AgentCapabilities kennt in v1.0 nur streaming, pushNotifications,
//   extensions, extendedAgentCard -- kein stateTransitionHistory-Feld.
// - AgentSkill kennt in v1.0 kein inputSchema/outputSchema und keine
//   Schema-URL.
//
// Diese Karte behaelt trotzdem `protocolVersion` (Top-Level) und
// `capabilities.stateTransitionHistory` sowie `url`/`preferredTransport`
// bei -- bewusste, additive Projekterweiterungen ueber den v0.3.0-Vorlauf
// dieser Datei hinaus, kein Versuch strikter Proto-Konformitaet. Ebenso ist
// die MCP-Zeile in `supportedInterfaces` unten eine Erweiterung: das Feld
// ist laut Proto-Kommentar fuer A2A-Protokollbindungen (JSONRPC/GRPC/
// HTTP+JSON) desselben Agenten gedacht, nicht fuer ein komplett anderes
// Protokoll wie MCP. Diese Abweichungen gehoeren in PROTOCOLS.md (spaetere
// Task) dokumentiert, nicht stillschweigend als Spec-Konformitaet verkauft.
export const ugcVzAgentCard = {
  protocolVersion: '1.0',
  name: 'UGC VZ Creator Matching Agent',
  description:
    'Findet passende UGC Creator in Deutschland fuer Brand-, Agentur- und E-Commerce-Kampagnen. Agenten koennen Creator-Vorschlaege abrufen, einzelne Profile nachschlagen und eine kostenlose Brand-Anfrage mit ausgewaehlten Creatorn ausloesen.',
  url: `${baseUrl}/a2a`,
  preferredTransport: 'JSONRPC',
  // Geordnete Liste, erster Eintrag bevorzugt (v1.0-Proto-Konvention).
  // Zweiter Eintrag ist die MCP-Erweiterung, siehe Kommentar oben.
  supportedInterfaces: [
    { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC', protocolVersion: '1.0' },
    // protocolVersion hier ist die MCP-Spezifikationsversion (siehe
    // app/api/mcp/route.ts), nicht die A2A-Version -- das Feld wird fuer
    // diesen Zweck zweckentfremdet.
    { url: `${baseUrl}/api/mcp`, protocolBinding: 'MCP', protocolVersion: '2026-07-28' },
  ],
  provider: {
    organization: 'track by track GmbH / famefact',
    url: baseUrl,
  },
  version: AGENT_LAYER_VERSION,
  documentationUrl: `${baseUrl}/developers`,
  iconUrl: `${baseUrl}/ugc-vz-logo.webp`,
  pricing: {
    currency: 'EUR',
    plans: [
      {
        id: 'starter',
        name: 'Agent Starter',
        price: 29,
        interval: 'month',
        monthlySearchLimit: 10,
        checkoutUrl: `${baseUrl}/api/a2a/checkout?plan=starter`,
      },
      {
        id: 'pro',
        name: 'Agent Pro',
        price: 100,
        interval: 'month',
        monthlySearchLimit: null,
        checkoutUrl: `${baseUrl}/api/a2a/checkout?plan=pro`,
      },
    ],
  },
  capabilities: {
    streaming: false,
    pushNotifications: false,
    // Bleibt false, bis lead_agent_events (§ 7 der Spec) die Historie
    // tatsaechlich liefert -- siehe design-doc §4.2.
    stateTransitionHistory: false,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['application/json'],
  securitySchemes: {
    apiKey: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description:
        'Bezahlter A2A API-Key als Authorization: Bearer <key>. Starter: 29 EUR/Monat mit 10 Suchen. Pro: 100 EUR/Monat unlimited.',
    },
    brandLead: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description:
        'Eine Brand-Anfrage benoetigt Name, E-Mail und bewusste Creator-Auswahl. Creator werden nicht ungeprueft automatisiert angeschrieben.',
    },
  },
  security: [{ apiKey: [] }],
  skills: [
    {
      id: 'creator_search',
      name: 'UGC Creator suchen',
      description:
        'Analysiert eine Kampagnen- oder Creator-Suchanfrage und liefert passende UGC Creator-Vorschlaege ohne private Kontaktinfos. Alter Methodenname ugc.search_creators bleibt als Alias funktionsfaehig.',
      tags: ['ugc', 'creator-search', 'influencer-marketing', 'germany'],
      examples: [
        'Finde maennliche Sport Creator ab 30 fuer TikTok',
        'Beauty UGC Creatorinnen aus Deutschland fuer Reels',
        'Tech UGC Creator fuer SaaS Produktdemo',
      ],
      inputModes: ['text/plain', 'application/json'],
      outputModes: ['application/json'],
      // Von Task 5 bereitgestellt (app/api/agent-schemas/[name]/route.ts).
      // String-Verweis, kein Endpunkt-Existenz-Nachweis dieser Datei hier.
      schema: `${baseUrl}/api/agent-schemas/search_creators.json`,
    },
    {
      id: 'creator_get',
      name: 'UGC Creator-Profil abrufen',
      description:
        'Liefert das oeffentliche Profil eines einzelnen UGC-Creators anhand seiner Creator-ID aus einem vorherigen creator_search-Ergebnis. Enthaelt niemals private Kontaktdaten wie E-Mail oder echten Namen.',
      tags: ['ugc', 'creator-profile', 'influencer-marketing', 'germany'],
      examples: ['Zeig mir das Profil von UGC-AB12CD34EF'],
      inputModes: ['application/json'],
      outputModes: ['application/json'],
      schema: `${baseUrl}/api/agent-schemas/get_creator.json`,
    },
    {
      id: 'outreach_request',
      name: 'Creator-Auswahl anfragen',
      description:
        'Erstellt eine kostenlose Brand-Anfrage fuer bewusst ausgewaehlte Creator. Kontaktinfos werden an die angegebene Brand-E-Mail gesendet, soweit im Profil vorhanden. Alter Methodenname ugc.submit_creator_request bleibt als Alias funktionsfaehig. Status danach ueber tasks/get abrufbar.',
      tags: ['ugc', 'brand-lead', 'creator-contact-request'],
      examples: [
        'Sende eine Anfrage fuer Creator UGC-AB12CD34EF und UGC-11223344FF an marketing@example.com',
      ],
      inputModes: ['application/json'],
      outputModes: ['application/json'],
      schema: `${baseUrl}/api/agent-schemas/request_outreach.json`,
    },
  ],
};
