const baseUrl = 'https://ugc-vz.de';

export const ugcVzAgentCard = {
  protocolVersion: '0.3.0',
  name: 'UGC VZ Creator Matching Agent',
  description:
    'Findet passende UGC Creator in Deutschland fuer Brand-, Agentur- und E-Commerce-Kampagnen. Agenten koennen Creator-Vorschlaege abrufen und eine kostenlose Brand-Anfrage mit ausgewaehlten Creatorn ausloesen.',
  url: `${baseUrl}/a2a`,
  preferredTransport: 'JSONRPC',
  provider: {
    organization: 'track by track GmbH / famefact',
    url: baseUrl,
  },
  version: '1.0.0',
  documentationUrl: `${baseUrl}/llms.txt`,
  iconUrl: `${baseUrl}/ugc-vz-logo.webp`,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['application/json'],
  securitySchemes: {
    publicSearch: {
      type: 'none',
      description: 'Creator-Suche ist oeffentlich nutzbar.',
    },
    brandLead: {
      type: 'none',
      description:
        'Eine Brand-Anfrage benoetigt Name, E-Mail und bewusste Creator-Auswahl. Creator werden nicht ungeprueft automatisiert angeschrieben.',
    },
  },
  security: [{ publicSearch: [] }],
  skills: [
    {
      id: 'ugc.search_creators',
      name: 'UGC Creator suchen',
      description:
        'Analysiert eine Kampagnen- oder Creator-Suchanfrage und liefert passende UGC Creator-Vorschlaege ohne private Kontaktinfos.',
      tags: ['ugc', 'creator-search', 'influencer-marketing', 'germany'],
      examples: [
        'Finde maennliche Sport Creator ab 30 fuer TikTok',
        'Beauty UGC Creatorinnen aus Deutschland fuer Reels',
        'Tech UGC Creator fuer SaaS Produktdemo',
      ],
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natuerliche Suchanfrage fuer Creator-Matching.',
          },
          maxResults: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 6,
          },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          creators: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                reach: { type: 'string' },
                networks: { type: 'array', items: { type: 'string' } },
                priceRange: { type: 'string' },
              },
            },
          },
          nextStep: { type: 'string' },
        },
      },
    },
    {
      id: 'ugc.submit_creator_request',
      name: 'Creator-Auswahl anfragen',
      description:
        'Erstellt eine kostenlose Brand-Anfrage fuer bewusst ausgewaehlte Creator. Kontaktinfos werden an die angegebene Brand-E-Mail gesendet, soweit im Profil vorhanden.',
      tags: ['ugc', 'brand-lead', 'creator-contact-request'],
      examples: [
        'Sende eine Anfrage fuer Creator rec123 und rec456 an marketing@example.com',
      ],
      inputSchema: {
        type: 'object',
        properties: {
          creatorIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
          },
          clientInfo: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              message: { type: 'string' },
              searchQuery: { type: 'string' },
            },
            required: ['name', 'email'],
          },
        },
        required: ['creatorIds', 'clientInfo'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          note: { type: 'string' },
        },
      },
    },
  ],
};
