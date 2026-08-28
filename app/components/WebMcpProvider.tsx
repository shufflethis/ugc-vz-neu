'use client';

// WebMCP-Layer: registriert die Agent-Tools im Browser ueber
// navigator.modelContext.registerTool() (W3C-Proposal; ChatGPT-Browser und
// Chrome mit Flag). Feature-Detection -- in normalen Browsern ist die
// Komponente ein No-op und rendert nichts.
//
// Human-in-the-loop bewusst: request_outreach wird hier NICHT registriert.
// Der Agent sucht und waehlt vor (search_creators, select_creators), die
// finale Kontaktanfrage sendet der Mensch selbst im CreatorSelectionPopup.
// Danach liefert get_last_outreach die request_id fuer get_outreach_status.
//
// Tool-Namen, Beschreibungen und JSON-Schemas der Registry-Tools kommen als
// Props aus app/lib/agent-tools.ts (via WebMcpAgentLayer) -- dieselbe Quelle
// wie MCP, REST v1 und A2A.

import { useEffect } from 'react';

export type WebMcpToolMeta = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

// Events, ueber die der WebMCP-Layer die Such-UI (SearchBox.tsx) steuert.
export const AGENT_UI_EVENTS = {
  search: 'ugcvz:agent-search',
  searchResult: 'ugcvz:agent-search-result',
  select: 'ugcvz:agent-select',
  selectResult: 'ugcvz:agent-select-result',
  outreachSubmitted: 'ugcvz:outreach-submitted',
} as const;

declare global {
  interface Window {
    // Gesetzt von SearchBox.tsx solange die Such-UI gemountet ist.
    __ugcvzAgentUiReady?: boolean;
  }
}

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

const textResult = (value: unknown, isError = false): ToolResult => ({
  content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
  ...(isError ? { isError: true } : {}),
});

// leadId der letzten Anfrage, die der Mensch in dieser Seiten-Session
// abgeschickt hat (Event aus SearchBox.tsx nach erfolgreichem Submit).
let lastOutreachId: string | null = null;

// Duplikat-Guard: registerTool wirft InvalidStateError bei doppeltem Namen
// (React StrictMode mountet Effekte in dev zweimal).
let registered = false;

/** REST-v1-Endpunkt aufrufen und die JSON-Antwort unveraendert durchreichen. */
async function viaApi(path: string, init?: RequestInit): Promise<ToolResult> {
  const res = await fetch(path, init);
  const body = await res.text();
  return { content: [{ type: 'text', text: body }], ...(res.ok ? {} : { isError: true }) };
}

/**
 * UI-Handshake: CustomEvent an die SearchBox schicken und auf das
 * Antwort-Event mit derselben requestId warten.
 */
function askUi(
  eventName: string,
  resultName: string,
  detail: Record<string, unknown>,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).slice(2);
    const onResult = (event: Event) => {
      const d = (event as CustomEvent).detail;
      if (d?.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener(resultName, onResult);
      resolve(d);
    };
    const timer = setTimeout(() => {
      window.removeEventListener(resultName, onResult);
      reject(new Error('Die Such-UI hat nicht geantwortet.'));
    }, timeoutMs);
    window.addEventListener(resultName, onResult);
    window.dispatchEvent(new CustomEvent(eventName, { detail: { ...detail, requestId } }));
  });
}

const SELECT_CREATORS_DESCRIPTION = [
  'Markiert Creator aus dem letzten sichtbaren search_creators-Ergebnis direkt in der Seiten-UI',
  'und oeffnet das Anfrage-Formular mit dieser Vorauswahl. Nur auf der Startseite mit sichtbarer',
  'Suche verfuegbar; zuerst search_creators aufrufen. Die Kontaktanfrage selbst sendet der Mensch',
  'im Formular ab (Name und E-Mail gehoeren der anfragenden Brand) -- ein request_outreach-Tool',
  'gibt es im Browser bewusst nicht. Nach dem Absenden liefert get_last_outreach die request_id.',
].join(' ');

const GET_LAST_OUTREACH_DESCRIPTION = [
  'Liefert request_id und aktuellen Status der Kontaktanfrage, die der Mensch zuletzt in dieser',
  'Browser-Sitzung ueber das Formular abgeschickt hat. Nach select_creators aufrufen, sobald der',
  'Mensch die Anfrage gesendet hat. Gibt keine Kontaktdaten zurueck.',
].join(' ');

type WebMcpToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

type ModelContext = {
  registerTool?: (tool: WebMcpToolDefinition) => void;
  provideContext?: (context: { tools: WebMcpToolDefinition[] }) => void;
};

function buildToolDefinitions(tools: WebMcpToolMeta[]): WebMcpToolDefinition[] {
  const definitions: WebMcpToolDefinition[] = [];
  const register = (
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    execute: (args: Record<string, unknown>) => Promise<ToolResult>,
  ) => {
    definitions.push({
      name,
      description,
      inputSchema,
      async execute(args: Record<string, unknown>) {
        try {
          return await execute(args ?? {});
        } catch (error) {
          return textResult(
            `Fehler bei ${name}: ${error instanceof Error ? error.message : String(error)}`,
            true,
          );
        }
      },
    });
  };

  const meta = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
    const registryTool = (name: string) => {
      const tool = meta[name];
      if (!tool) throw new Error(`WebMCP: Tool-Metadaten fuer ${name} fehlen`);
      return tool;
    };

    // search_creators: auf der Startseite laeuft die Suche sichtbar durch die
    // echte Such-UI (gleiche Pipeline wie fuer menschliche Besucher, IDs sind
    // creator_public_ids). Ohne gemountete SearchBox: Fallback auf REST v1.
    const search = registryTool('search_creators');
    register(search.name, search.description, search.inputSchema, async (args) => {
      if (window.__ugcvzAgentUiReady) {
        const result = await askUi(AGENT_UI_EVENTS.search, AGENT_UI_EVENTS.searchResult, { query: args.query }, 60_000);
        return textResult({
          source: 'ui',
          hinweis: 'Ergebnis wird dem Menschen auf der Seite angezeigt. Auswahl per select_creators vorschlagen.',
          ...result,
        });
      }
      return viaApi('/api/v1/creators/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
    });

    const getCreator = registryTool('get_creator');
    register(getCreator.name, getCreator.description, getCreator.inputSchema, (args) =>
      viaApi(`/api/v1/creators/${encodeURIComponent(String(args.creator_public_id))}`),
    );

    const outreachStatus = registryTool('get_outreach_status');
    register(outreachStatus.name, outreachStatus.description, outreachStatus.inputSchema, (args) =>
      viaApi(`/api/v1/outreach/${encodeURIComponent(String(args.request_id))}`),
    );

    const vocab = registryTool('get_vocab');
    register(vocab.name, vocab.description, vocab.inputSchema, () => viaApi('/api/v1/vocab'));

    register(
      'select_creators',
      SELECT_CREATORS_DESCRIPTION,
      {
        type: 'object',
        properties: {
          creator_ids: {
            type: 'array',
            items: { type: 'string', pattern: '^UGC-[A-F0-9]{10}$' },
            minItems: 1,
            maxItems: 10,
            description: 'creator_public_ids aus dem letzten search_creators-Ergebnis dieser Seite',
          },
        },
        required: ['creator_ids'],
      },
      async (args) => {
        if (!window.__ugcvzAgentUiReady) {
          return textResult(
            'select_creators ist nur auf der Startseite mit sichtbarer Suche verfuegbar. Zuerst dorthin navigieren und search_creators aufrufen.',
            true,
          );
        }
        const result = await askUi(AGENT_UI_EVENTS.select, AGENT_UI_EVENTS.selectResult, { creator_ids: args.creator_ids }, 5_000);
        return textResult({
          hinweis: 'Das Anfrage-Formular ist geoeffnet. Der Mensch prueft die Auswahl und sendet selbst ab. Danach get_last_outreach aufrufen.',
          ...result,
        });
      },
    );

    register('get_last_outreach', GET_LAST_OUTREACH_DESCRIPTION, { type: 'object', properties: {} }, async () => {
      if (!lastOutreachId) {
        return textResult('In dieser Browser-Sitzung wurde noch keine Kontaktanfrage abgeschickt.');
      }
      const status = await viaApi(`/api/v1/outreach/${encodeURIComponent(lastOutreachId)}`);
      return textResult({ request_id: lastOutreachId, status: status.content[0]?.text });
    });

  return definitions;
}

export default function WebMcpProvider({ tools }: { tools: WebMcpToolMeta[] }) {
  useEffect(() => {
    window.addEventListener(AGENT_UI_EVENTS.outreachSubmitted, ((event: Event) => {
      const leadId = (event as CustomEvent).detail?.leadId;
      if (typeof leadId === 'string' && leadId) lastOutreachId = leadId;
    }) as EventListener);

    // Beide API-Formen des W3C-Proposals unterstuetzen: registerTool
    // (inkrementell, Chromium-Prototyp) und provideContext (deklarativ).
    const tryRegister = (): boolean => {
      if (registered) return true;
      const modelContext = (navigator as { modelContext?: ModelContext }).modelContext;
      if (!modelContext) return false;
      const definitions = buildToolDefinitions(tools);
      if (typeof modelContext.registerTool === 'function') {
        registered = true;
        for (const definition of definitions) {
          try {
            modelContext.registerTool(definition);
          } catch (error) {
            console.error(`[webmcp] registerTool ${definition.name} fehlgeschlagen`, error);
          }
        }
        return true;
      }
      if (typeof modelContext.provideContext === 'function') {
        registered = true;
        try {
          modelContext.provideContext({ tools: definitions });
        } catch (error) {
          console.error('[webmcp] provideContext fehlgeschlagen', error);
        }
        return true;
      }
      return false;
    };

    if (tryRegister()) return;

    // Manche Agent-Browser injizieren navigator.modelContext erst NACH dem
    // Seiten-Load -- bis zu 30s nachfassen, dann aufgeben (normaler Browser).
    const interval = setInterval(() => {
      if (tryRegister()) clearInterval(interval);
    }, 500);
    const giveUp = setTimeout(() => clearInterval(interval), 30_000);
    return () => {
      clearInterval(interval);
      clearTimeout(giveUp);
    };
  }, [tools]);

  return null;
}
