# Agent-Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MCP-Server, A2A v1.0, UCP-Manifest, Web Bot Auth und AP2-Datenmodell-Vorbereitung als additive Schicht über dem bestehenden Kern (LLM-Suche + Lead-Flow).

**Architecture:** Ein Gateway-Modul (`app/lib/agent-gateway.ts`) kapselt fünf Operationen und ruft intern die bestehenden Endpunkte auf bzw. liest direkt aus Neon. MCP (`/api/mcp`), A2A (`/a2a`) und UCP (`/.well-known/ucp`) sind Transport-Adapter darüber. Kein bestehender Human-Flow wird verändert; `/api/search` und `/api/submit-request` bleiben unangetastet.

**Tech Stack:** Next.js 14.2.35 App Router (Node-Runtime), TypeScript 5, `@modelcontextprotocol/sdk@1.30.0` (bereits installiert, Probe erfolgreich), `mcp-handler` (wird in Task 3 installiert), zod (vorhanden), Neon via `@/app/lib/database`, tsx für Validierungsskripte.

**Spec:** `docs/superpowers/specs/2026-08-15-agent-layer-design.md`

## Global Constraints

- **Additiv:** `/api/search`, `/api/submit-request`, Creator-Registrierung und alle Frontend-Flows werden nicht verändert. Der Agent-Layer konsumiert sie nur.
- **Keine privaten Kontaktdaten:** Kein Gateway-/Transport-Code liest `creator_private_contacts`. `getOutreachStatus` liefert nur Status + Zeitstempel, nie Inhalte.
- **Spec-Versionen fixiert:** MCP `2026-07-28` (via SDK-Versionsverhandlung), A2A `protocolVersion: '1.0'`, UCP `ucp_version: '2026-04-08'`, Web Bot Auth nach RFC 9421 + `Signature-Agent` (IETF-Draft, kein adopted standard — so dokumentieren).
- **Verifikationsstufen nur abgeleitet:** Level 0 `self_reported`, Level 1 `self_reported_with_portfolio` (≥1 Portfolio-Link UND ≥1 Social-Link), Level 2 `identity_verified` wird NICHT vergeben. Keine anderen Werte, keine DB-Spalte dafür.
- **Kein lokaler Build:** `next build`/`tsc` sterben (earlyoom). Verifikation: `npm run validate:agent-layer` (tsx) + Vercel-Preview-Build vor Merge nach main + Live-Checks. Niemals „Build grün" ohne Preview behaupten.
- **Bestehende A2A-Methoden (`ugc.search_creators`, `ugc.submit_creator_request`, `agent.card`) bleiben funktionsfähig** (Aliasse). Bestehende Bezahlpläne/Quota-Logik unverändert.
- **Lead-IDs:** `request_id` = `brand_leads.public_id` (Format `UGC-<hex>`, von `createLeadId` erzeugt). Creator-IDs im Agent-Layer = `creator_profiles.public_id` (Format `UGC-[A-F0-9]{10}`).
- Prosa in Deliverables (PROTOCOLS.md, Descriptions) auf Deutsch bzw. Englisch wie angegeben; Umlaute in deutscher Prosa normal.

## File Structure

| Datei | Verantwortung |
|---|---|
| `db/migrations/005_agent_layer.sql` | `brief_hash`, `agent_request_id` auf `brand_leads`; append-only `lead_agent_events` |
| `app/lib/agent-verification.ts` | Ableitung `human_verification_level` (pure function, testbar) |
| `app/lib/agent-gateway.ts` | Die fünf Operationen; einziger Ort mit Agent-DB-Zugriff |
| `app/lib/web-bot-auth.ts` | RFC-9421-Verifikation, JWKS-Cache, Rate-Limit-Tiers |
| `app/api/mcp/route.ts` | MCP Streamable HTTP, 5 Tools |
| `app/lib/a2a-agent-card.ts` | Upgrade auf v1.0 (modifiziert) |
| `app/a2a/route.ts` | `tasks/get` + neue Skill-Aliasse + WBA-Logging (modifiziert, chirurgisch) |
| `app/.well-known/ucp/route.ts` | UCP-Manifest 2026-04-08 |
| `app/api/agent-schemas/[name]/route.ts` | JSON-Schemas der Operationen (aus zod generiert) |
| `scripts/validate-agent-layer.ts` | Validierung ohne Build: Level-Ableitung, Lifecycle-Mapping, Manifest-Formen, MCP-Tool-Registry |
| `PROTOCOLS.md` | Deliverable laut Spec §8 |
| `app/llms.txt/route.ts` | + Verweis auf PROTOCOLS.md und `/api/mcp` (modifiziert) |
| `docs/a2a-agent-access.md` | Aktualisierung auf v1.0-Stand (modifiziert) |

Reihenfolge: T1 Migration → T2 Gateway → T3 MCP → T4 A2A → T5 UCP+Schemas → T6 Web Bot Auth → T7 Doku → T8 Preview/Merge/Live.

---

### Task 1: Migration 005 (AP2-Vorbereitung)

**Files:**
- Create: `db/migrations/005_agent_layer.sql`

**Interfaces:**
- Consumes: nichts
- Produces: Spalten `brand_leads.brief_hash`, `brand_leads.agent_request_id`; Tabelle `lead_agent_events`

- [ ] **Step 1: Migration schreiben**

```sql
-- 005_agent_layer.sql
-- AP2-Vorbereitung: unveraenderliches Log + Hash-Felder fuer spaetere Mandates.
-- Nur Datenmodell, keine Payment-Logik (Spec 2026-08-15, §4.5).

ALTER TABLE brand_leads
  ADD COLUMN IF NOT EXISTS brief_hash text,
  ADD COLUMN IF NOT EXISTS agent_request_id text;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS brand_leads_agent_request_idx
  ON brand_leads (agent_request_id)
  WHERE agent_request_id IS NOT NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES brand_leads(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_hash text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS lead_agent_events_lead_idx
  ON lead_agent_events (lead_id, occurred_at);
```

- [ ] **Step 2: Migration anwenden**

Run: `npm run db:migrate`
Expected: Migration 005 wird angewendet (das Skript `scripts/migrate-neon.mjs` hat Migration 004 auf demselben Weg angewendet). Falls `DATABASE_URL` fehlt oder das Skript abbricht: **BLOCKED melden**, nicht improvisieren.

- [ ] **Step 3: Anwenden verifizieren**

Run: `node --import tsx -e "import('./app/lib/database').then(async m=>{const sql=m.getDatabase();const r=await sql.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='brand_leads' AND column_name IN ('brief_hash','agent_request_id')\");console.log(r.rows);const t=await sql.query(\"SELECT to_regclass('lead_agent_events') AS t\");console.log(t.rows);})"`
Expected: beide Spalten gelistet, `lead_agent_events` ≠ null. (Exakte Import-/Query-API von `app/lib/database.ts` vor Ausführung lesen und den Aufruf anpassen — die Datei ist die Wahrheit, nicht dieses Beispiel.)

- [ ] **Step 4: Commit**

```bash
git add db/migrations/005_agent_layer.sql
git commit -m "feat: Migration 005 - AP2-Vorbereitung (brief_hash, agent_request_id, lead_agent_events)"
```

---

### Task 2: Verifikationsstufen + Agent-Gateway

**Files:**
- Create: `app/lib/agent-verification.ts`
- Create: `app/lib/agent-gateway.ts`
- Create: `scripts/validate-agent-layer.ts`
- Modify: `package.json` (Script `validate:agent-layer`)

**Interfaces:**
- Consumes: `getDatabase` aus `@/app/lib/database`; intern `POST /api/search` und `POST /api/submit-request` (Payload-Formen exakt wie in `app/a2a/route.ts:225-320` — vor Implementierung dort ablesen und übernehmen)
- Produces (von T3–T5 konsumiert):
  - `deriveVerificationLevel(input: { portfolioCount: number; socialCount: number }): { level: 0 | 1; name: 'self_reported' | 'self_reported_with_portfolio' }`
  - `VERIFICATION_LEVELS` (Vokabular-Objekt inkl. Level 2 als `reserved: true, issued: false`)
  - `searchCreators(params: { query: string; maxResults?: number; humanVerificationLevelMin?: number; city?: string; topics?: string[] }, ctx: { origin: string; requestId: string })`
  - `getCreator(publicId: string)`
  - `requestOutreach(params: { creatorPublicIds: string[]; brand: { name: string; email: string; message?: string; searchQuery?: string } }, ctx: { origin: string; protocol: 'mcp' | 'a2a' })` → `{ requestId: string }`
  - `getOutreachStatus(requestId: string)` → `{ requestId, state: 'submitted' | 'working' | 'completed' | 'failed', submittedAt, updatedAt }`
  - `getVocab()`

- [ ] **Step 1: Validierungsskript zuerst (der Test)**

`scripts/validate-agent-layer.ts` — prüft vor der Implementierung fehlschlagend, danach grün. Muss mindestens abdecken:

```ts
import { deriveVerificationLevel, VERIFICATION_LEVELS } from '../app/lib/agent-verification';
import { mapOutreachState } from '../app/lib/agent-gateway';

const errors: string[] = [];
const check = (cond: boolean, msg: string) => { if (!cond) errors.push(msg); };

// Verifikationsstufen: nur belegbare Ableitung
check(deriveVerificationLevel({ portfolioCount: 0, socialCount: 0 }).level === 0, 'ohne Links muss Level 0 sein');
check(deriveVerificationLevel({ portfolioCount: 1, socialCount: 0 }).level === 0, 'nur Portfolio reicht nicht fuer Level 1');
check(deriveVerificationLevel({ portfolioCount: 0, socialCount: 2 }).level === 0, 'nur Social reicht nicht fuer Level 1');
check(deriveVerificationLevel({ portfolioCount: 1, socialCount: 1 }).level === 1, 'Portfolio+Social muss Level 1 sein');
check((VERIFICATION_LEVELS as any)[2]?.issued === false, 'Level 2 darf nicht als vergeben markiert sein');

// Lifecycle-Mapping (pure function ueber Event-Fixtures)
const T0 = '2026-08-15T00:00:00Z';
check(mapOutreachState({ createdAt: T0, brandEvents: [], now: new Date('2026-08-15T01:00:00Z') }) === 'submitted', 'ohne Events: submitted');
check(mapOutreachState({ createdAt: T0, brandEvents: ['email.queued'], now: new Date('2026-08-15T01:00:00Z') }) === 'working', 'Send-Event ohne Zustellung: working');
check(mapOutreachState({ createdAt: T0, brandEvents: ['email.queued', 'email.delivered'], now: new Date('2026-08-15T01:00:00Z') }) === 'completed', 'delivered: completed');
check(mapOutreachState({ createdAt: T0, brandEvents: ['email.bounced'], now: new Date('2026-08-15T01:00:00Z') }) === 'failed', 'bounce: failed');
check(mapOutreachState({ createdAt: T0, brandEvents: [], now: new Date('2026-08-17T01:00:00Z') }) === 'failed', '48h ohne Versand: failed');

if (errors.length) { errors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: agent-layer Basisregeln');
```

(Das Skript wächst in T3/T5 um MCP-Registry- und Manifest-Checks; hier die Basis.)

In `package.json`: `"validate:agent-layer": "node --import tsx scripts/validate-agent-layer.ts"`.

Run: `npm run validate:agent-layer` — Expected: FAIL (Module existieren nicht).

- [ ] **Step 2: `agent-verification.ts` implementieren**

```ts
export type VerificationLevel = 0 | 1;

export const VERIFICATION_LEVELS = {
  0: {
    name: 'self_reported',
    criteria: 'Profil vorhanden; Angaben stammen vom Creator selbst.',
    issued: true,
  },
  1: {
    name: 'self_reported_with_portfolio',
    criteria: 'Mindestens ein Portfolio-Link UND mindestens ein Social-Link am Profil hinterlegt.',
    issued: true,
  },
  2: {
    name: 'identity_verified',
    criteria: 'Reserviert. Es existiert derzeit kein Identitaetspruefprozess; diese Stufe wird nicht vergeben.',
    issued: false,
    reserved: true,
  },
} as const;

export function deriveVerificationLevel(input: { portfolioCount: number; socialCount: number }): {
  level: VerificationLevel;
  name: (typeof VERIFICATION_LEVELS)[0]['name'] | (typeof VERIFICATION_LEVELS)[1]['name'];
} {
  if (input.portfolioCount >= 1 && input.socialCount >= 1) {
    return { level: 1, name: VERIFICATION_LEVELS[1].name };
  }
  return { level: 0, name: VERIFICATION_LEVELS[0].name };
}
```

- [ ] **Step 3: `agent-gateway.ts` implementieren**

Kernpunkte (der Implementer liest vor dem Schreiben `app/a2a/route.ts` und `app/lib/database.ts` und übernimmt die exakten Aufruf-/Query-Muster):

```ts
import crypto from 'node:crypto';
import { getDatabase } from '@/app/lib/database';
import { deriveVerificationLevel, VERIFICATION_LEVELS } from './agent-verification';

// ---------- Lifecycle (pure, testbar) ----------
const FAILURE_EVENTS = new Set(['email.bounced', 'email.failed', 'email.suppressed']);
const COMPLETED_EVENTS = new Set(['email.delivered']);
const STALE_MS = 48 * 60 * 60 * 1000;

export function mapOutreachState(input: { createdAt: string; brandEvents: string[]; now: Date }): 'submitted' | 'working' | 'completed' | 'failed' {
  const { brandEvents } = input;
  if (brandEvents.some((e) => FAILURE_EVENTS.has(e))) return 'failed';
  if (brandEvents.some((e) => COMPLETED_EVENTS.has(e))) return 'completed';
  const age = input.now.getTime() - new Date(input.createdAt).getTime();
  if (brandEvents.length > 0) return 'working';
  return age > STALE_MS ? 'failed' : 'submitted';
}

// ---------- Kanonischer Hash (AP2-Vorbereitung) ----------
export function canonicalHash(value: unknown): string {
  const canonical = JSON.stringify(value, Object.keys(value as object).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
```

Dazu im selben Modul (vollständig implementieren, hier die verbindlichen Verträge):

- `searchCreators(params, ctx)`: interner `fetch(ctx.origin + '/api/search', { method:'POST', body: JSON.stringify({ query: params.query }) })` — identisch zur A2A-Route. Danach Nachfilter: `city` (case-insensitive Substring auf Creator-City, sofern im Suchergebnis vorhanden — sonst über eine Zusatz-Query `SELECT public_id, city, topics FROM creator_profiles WHERE public_id = ANY($1)` anreichern), `topics` (mindestens ein Begriff enthalten), `humanVerificationLevelMin` (Anreicherung: `SELECT creator_id-Zaehlung` aus `creator_portfolio_items`/`creator_social_accounts` per `public_id`-Join, dann `deriveVerificationLevel`). Ergebnisobjekte: `{ id, name, reach, totalReach, networks, priceRange, city, humanVerification: { level, name } }`. Niemals andere Felder aus der Such-API durchreichen.
- `getCreator(publicId)`: eine Lese-Query über `creator_profiles` (nur Status `active`) + `creator_social_accounts` + `creator_portfolio_items`. Öffentliche Felder: `public_id, display_name, stage_name, city, country_code, gender, topics, industries, preferred_content, equipment, special_traits, experience_since, rate_text, reach_text, total_reach, profile_image_url, profile_quality_score` plus `socials: [{platform, handle, url}]`, `portfolio: [url]`, `humanVerification` (abgeleitet). **Ausdrücklich nicht:** `legal_name`, `birth_year` (stattdessen nichts — kein Altersfeld), `import_key`, alles aus `creator_private_contacts`.
- `requestOutreach(params, ctx)`: Validierung `creatorPublicIds` gegen `/^UGC-[A-F0-9]{10}$/`, dann interner `fetch(ctx.origin + '/api/submit-request', …)` mit exakt dem Payload-Aufbau der A2A-Route (inkl. `x-api-key` aus `SUBMIT_REQUEST_API_KEY`, `sourcePath: '/api/mcp'` bzw. `'/a2a'` je `ctx.protocol`). Antwort liefert `leadId`. Danach additiv: `UPDATE brand_leads SET agent_request_id=$2, brief_hash=$3 WHERE public_id=$1` und Insert in `lead_agent_events` (`event_type: 'outreach.submitted'`, `payload` = kanonisches Brief-Objekt ohne E-Mail-Adresse im Klartext — E-Mail als sha256-Hash ablegen, `payload_hash` = `canonicalHash(payload)`). `agent_request_id` = `${ctx.protocol}_${leadId}`.
- `getOutreachStatus(requestId)`: `SELECT id, created_at, updated_at FROM brand_leads WHERE public_id=$1` + `SELECT event_type FROM email_events WHERE lead_id=$1 AND audience='brand'`; `mapOutreachState` darüber; zusätzlich Insert in `lead_agent_events` NUR bei beobachtetem Zustandswechsel gegenüber dem letzten geloggten (`event_type: 'status.observed'`); Rückgabe ausschließlich `{ requestId, state, submittedAt, updatedAt }`. Unbekannte `requestId` → definierter Fehler `not_found` (kein Unterschied zwischen „nie existiert" und „nicht deins" — es gibt keine Mandanten).
- `getVocab()`: `SELECT DISTINCT`-Queries (topics/industries kommen als Freitext — aufsplitten an Kommas, trimmen, deduplizieren, Top-N nach Häufigkeit), Städte-Liste, plus `VERIFICATION_LEVELS` wörtlich, plus Preismodell-Hinweis („kostenlos für Brands, Honorar direkt mit Creator"). Ergebnis cachebar; Modul-Level-Cache mit 1 h TTL.

- [ ] **Step 4: Validierung grün**

Run: `npm run validate:agent-layer` — Expected: `OK: agent-layer Basisregeln`.

- [ ] **Step 5: Commit**

```bash
git add app/lib/agent-verification.ts app/lib/agent-gateway.ts scripts/validate-agent-layer.ts package.json
git commit -m "feat: Agent-Gateway mit abgeleiteten Verifikationsstufen und Outreach-Lifecycle"
```

---

### Task 3: MCP-Server `/api/mcp`

**Files:**
- Create: `app/api/mcp/route.ts`
- Modify: `package.json`/`package-lock.json` (mcp-handler)
- Modify: `scripts/validate-agent-layer.ts` (Registry-Check)

**Interfaces:**
- Consumes: alle fünf Gateway-Operationen; `zod`
- Produces: MCP-Endpunkt `POST /api/mcp` (Streamable HTTP, stateless)

- [ ] **Step 1: `mcp-handler` installieren**

Run: `npm install mcp-handler --no-audit --no-fund` (Peer-Deps `@modelcontextprotocol/sdk` und `zod` sind vorhanden).
Expected: Install ok in Sekunden. Danach die tatsächliche API prüfen: `ls node_modules/mcp-handler/dist` und README lesen. **Wenn die API wesentlich von `createMcpHandler(initFn, serverOptions, config)` abweicht, BLOCKED melden mit dem echten API-Auszug** — nicht raten.

- [ ] **Step 2: Route implementieren**

```ts
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  searchCreators, getCreator, requestOutreach, getOutreachStatus, getVocab,
} from '@/app/lib/agent-gateway';

export const runtime = 'nodejs';
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'search_creators',
      [
        'Durchsucht das UGC-VZ-Verzeichnis realer UGC-Creator im deutschsprachigen Raum.',
        'query ist Freitext und der Hauptpfad (z. B. "Fitness-Creatorin ab 30 fuer TikTok-Produktvideo");',
        'ein Sprachmodell strukturiert die Anfrage serverseitig. Optional: city (Substring),',
        'topics (mind. ein Treffer), human_verification_level_min (0 = self_reported,',
        '1 = self_reported_with_portfolio; Stufen sind aus Profildaten abgeleitet, siehe get_vocab).',
        'Ergebnis enthaelt NIEMALS private Kontaktdaten. Fuer Details zu einem Treffer get_creator',
        'verwenden; fuer eine Kontaktanfrage request_outreach.',
      ].join(' '),
      {
        query: z.string().min(3).max(500),
        maxResults: z.number().int().min(1).max(10).optional(),
        city: z.string().max(80).optional(),
        topics: z.array(z.string().max(60)).max(10).optional(),
        human_verification_level_min: z.number().int().min(0).max(2).optional(),
      },
      async (args, extra) => {
        const result = await searchCreators(
          {
            query: args.query,
            maxResults: args.maxResults,
            city: args.city,
            topics: args.topics,
            humanVerificationLevelMin: args.human_verification_level_min,
          },
          requestCtx(extra),
        );
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      },
    );
    // get_creator, request_outreach, get_outreach_status, get_vocab analog:
    // ausfuehrliche Description (die Description IST der Prompt), zod-Schema, Gateway-Aufruf,
    // JSON als text-Content. request_outreach-Description nennt ausdruecklich:
    // "Loest eine bewusste Brand-Anfrage aus. UGC VZ gibt daraufhin die Kontaktdaten der
    //  ausgewaehlten Creator per E-Mail an die Brand weiter. Pflicht: name, email,
    //  creator_public_ids aus vorheriger Suche. Gibt request_id fuer get_outreach_status zurueck."
  },
  {
    serverInfo: { name: 'ugc-vz', version: '1.0.0' },
    instructions: [
      'UGC VZ ist ein kostenloses Verzeichnis realer UGC-Creator (DACH) mit Portfolio- und',
      'Social-Nachweisen - kein KI-Avatar-Content. Brands suchen kostenlos, waehlen bewusst aus',
      'und erhalten Kontaktdaten per E-Mail; UGC VZ nimmt keine Provision.',
      'Typischer Ablauf: search_creators -> get_creator -> request_outreach -> get_outreach_status.',
      'get_vocab liefert Themen, Staedte und die Definition der human_verification-Stufen.',
    ].join(' '),
  },
  { basePath: '/api', maxDuration: 60, verboseLogs: false },
);

export { handler as GET, handler as POST, handler as DELETE };
```

(`requestCtx(extra)` liefert `{ origin, requestId, protocol: 'mcp' }` aus den Request-Headern; Implementierung im selben File. Exakte Handler-Signatur an die installierte mcp-handler-Version anpassen — Abweichungen dokumentieren, nicht verschweigen.)

- [ ] **Step 3: Handshake lokal testen (ohne Build)**

tsx-Testskript oder direkter curl gegen `next dev` ist auf dem VPS nicht verlässlich — stattdessen prüft `validate-agent-layer.ts` die Tool-Registry statisch: Import der Tool-Definitionsliste (dafür die Tool-Specs als exportiertes Array `MCP_TOOLS` neben dem Handler definieren und im Handler daraus registrieren), Check: genau 5 Tools, Namen exakt `search_creators|get_creator|request_outreach|get_outreach_status|get_vocab`, jede Description ≥ 200 Zeichen.

Run: `npm run validate:agent-layer` — Expected: OK inkl. `OK: mcp tool registry`.

- [ ] **Step 4: Commit**

```bash
git add app/api/mcp/route.ts scripts/validate-agent-layer.ts package.json package-lock.json
git commit -m "feat: MCP-Server /api/mcp (Streamable HTTP, 5 Tools) auf Agent-Gateway"
```

---

### Task 4: A2A v1.0

**Files:**
- Modify: `app/lib/a2a-agent-card.ts`
- Modify: `app/a2a/route.ts`

**Interfaces:**
- Consumes: `requestOutreach`, `getOutreachStatus`, `searchCreators`, `getCreator` aus dem Gateway
- Produces: Card `protocolVersion: '1.0'` mit Skills `creator_search`, `creator_get`, `outreach_request`; JSON-RPC-Methoden `tasks/get` und `ugc.get_creator`; bestehende Methoden unverändert

- [ ] **Step 1: Card upgraden**

In `a2a-agent-card.ts`: `protocolVersion: '1.0'`; `skills`-Array (id, name, description, inputModes/outputModes) für die drei Skills, jeweils mit Verweis auf JSON-Schema-URL unter `/api/agent-schemas/…`; `capabilities.stateTransitionHistory` bleibt `false`; Pricing-Block unverändert; zusätzlich `additionalInterfaces: [{ transport: 'mcp', url: 'https://ugc-vz.de/api/mcp' }, { transport: 'rest', url: 'https://ugc-vz.de/a2a' }]` (Feldnamen gegen A2A-v1.0-Card-Schema prüfen; wenn v1.0 ein anderes Feld für Mehrfach-Transporte definiert, das der Spec nehmen).

- [ ] **Step 2: Route erweitern (chirurgisch)**

In `app/a2a/route.ts`, im Methoden-Dispatch:

```ts
if (method === 'tasks/get' || method === 'ugc.get_outreach_status') {
  const requestId = String(params?.taskId || params?.requestId || '');
  const status = await getOutreachStatus(requestId); // wirft not_found -> JSON-RPC error -32001
  return jsonRpcResult(id, {
    id: status.requestId,
    status: { state: status.state, timestamp: status.updatedAt },
    kind: 'task',
  });
}
if (method === 'ugc.get_creator' || method === 'creator_get') {
  return jsonRpcResult(id, await getCreator(String(params?.publicId || params?.id || '')));
}
```

`ugc.submit_creator_request` bekommt EINE additive Änderung: Der Rückgabewert enthält zusätzlich `taskId` (= `leadId` aus der Submit-Antwort) und `note` verweist auf `tasks/get`. Der Outreach-Aufruf selbst wird auf `requestOutreach(…, { protocol: 'a2a' })` umgestellt, damit `agent_request_id`/`brief_hash`/`lead_agent_events` auch für A2A geschrieben werden — die bestehende Quota-/Auth-Logik davor bleibt exakt stehen. Alte Methodennamen (`ugc.search_creators`, `message/send`, `tasks/send`, `agent.card`) bleiben unverändert funktionsfähig.

- [ ] **Step 3: Verifizieren**

`validate-agent-layer.ts` erweitern: Import der Card, Checks `protocolVersion === '1.0'`, drei Skills vorhanden, `stateTransitionHistory === false`.
Run: `npm run validate:agent-layer` — Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add app/lib/a2a-agent-card.ts app/a2a/route.ts scripts/validate-agent-layer.ts
git commit -m "feat: A2A v1.0 - Card-Upgrade, tasks/get, get_creator; Aliasse bleiben"
```

---

### Task 5: UCP-Manifest + Schema-Endpunkt

**Files:**
- Create: `app/.well-known/ucp/route.ts`
- Create: `app/api/agent-schemas/[name]/route.ts`

**Interfaces:**
- Consumes: zod-Schemas der Tools (aus T3 als `MCP_TOOLS` exportiert; `zod-to-json-schema` NICHT installieren — Schemas von Hand als statische JSON-Objekte in einem `AGENT_SCHEMAS`-Record neben `MCP_TOOLS` pflegen und in T3s Validierungsskript gegen die zod-Definitionen auf Feldgleichheit prüfen)
- Produces: `GET /.well-known/ucp`, `GET /api/agent-schemas/<name>.json`

- [ ] **Step 1: Manifest-Route**

```ts
import { NextResponse } from 'next/server';

const manifest = {
  ucp_version: '2026-04-08',
  organization: {
    name: 'UGC VZ - track by track GmbH',
    url: 'https://ugc-vz.de',
    logo: 'https://ugc-vz.de/ugc-vz-logo.webp',
    description:
      'Kostenloses Verzeichnis realer UGC-Creator im deutschsprachigen Raum. Vermittlung von Creator-Dienstleistungen mit direktem Kontakt; keine Provision, kein Checkout.',
  },
  primary_capability: 'service_discovery',
  capabilities: [
    { name: 'creator_search', version: '1.0', schema: 'https://ugc-vz.de/api/agent-schemas/search_creators.json' },
    { name: 'creator_get', version: '1.0', schema: 'https://ugc-vz.de/api/agent-schemas/get_creator.json' },
    { name: 'outreach_request', version: '1.0', schema: 'https://ugc-vz.de/api/agent-schemas/request_outreach.json' },
    { name: 'outreach_status', version: '1.0', schema: 'https://ugc-vz.de/api/agent-schemas/get_outreach_status.json' },
    { name: 'vocab', version: '1.0', schema: 'https://ugc-vz.de/api/agent-schemas/get_vocab.json' },
  ],
  transports: {
    rest: { url: 'https://ugc-vz.de/a2a' },
    mcp: { url: 'https://ugc-vz.de/api/mcp' },
    a2a: { url: 'https://ugc-vz.de/a2a', agent_card: 'https://ugc-vz.de/.well-known/agent-card.json' },
  },
  commerce: {
    checkout: { supported: false, reason: 'Vermittlung von Dienstleistungen; Vertrag und Zahlung laufen direkt zwischen Brand und Creator.' },
    services: [
      {
        name: 'UGC-Creator-Vermittlung',
        price_range: { for_brands: 'kostenlos', creator_fees: 'individuell, Richtwerte im Creator-Profil (rate_text)', currency: 'EUR' },
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
```

**Vor dem Festschreiben:** die Feldnamen gegen die Spec `ucp.dev/2026-04-08` per WebFetch verifizieren (Pflichtfelder `ucp_version`, Organisation, `primary_capability`, `capabilities[]` mit Schema-URLs sind aus der Recherche belegt; alles Weitere an die Spec anpassen statt zu erfinden). Abweichungen im Report dokumentieren.

- [ ] **Step 2: Schema-Endpunkt**

`app/api/agent-schemas/[name]/route.ts`: `generateStaticParams` über die fünf Namen (`<name>.json`), liefert das jeweilige JSON-Schema aus `AGENT_SCHEMAS` mit `Content-Type: application/schema+json` und Cache-Headern; unbekannter Name → 404.

- [ ] **Step 3: Verifizieren + Commit**

`validate-agent-layer.ts`: Manifest importieren, Checks (ucp_version exakt, 5 Capabilities, checkout.supported === false, jede Schema-URL endet auf einen bekannten Namen). Run grün, dann:

```bash
git add app/.well-known/ucp/route.ts app/api/agent-schemas scripts/validate-agent-layer.ts
git commit -m "feat: UCP-Manifest 2026-04-08 (Service-Discovery, Checkout explizit nicht unterstuetzt)"
```

---

### Task 6: Web Bot Auth + Rate-Limits

**Files:**
- Create: `app/lib/web-bot-auth.ts`
- Modify: `app/api/mcp/route.ts` (Verdikt + Limit vor Handler)
- Modify: `app/a2a/route.ts` (Verdikt-Logging; bestehende Quota bleibt)

**Interfaces:**
- Consumes: Request-Header
- Produces: `verifyWebBotAuth(request: Request): Promise<{ verdict: 'verified' | 'invalid' | 'unsigned'; agent?: string }>`; `checkRateLimit(key: string, verdict: string): { allowed: boolean; retryAfterSeconds?: number }`

- [ ] **Step 1: Modul implementieren**

Verbindliche Eckpunkte (RFC 9421 + draft-meunier-web-bot-auth):

```ts
// Kernablauf verifyWebBotAuth:
// 1. Header lesen: Signature-Agent (URL des JWKS-Directory), Signature-Input, Signature.
//    Fehlt einer -> 'unsigned'.
// 2. Signature-Input parsen (structured field): Komponentenliste, keyid, alg, created, expires,
//    tag. tag !== 'web-bot-auth' -> 'unsigned'. expires in der Vergangenheit oder created
//    mehr als 5 min in der Zukunft -> 'invalid'.
// 3. JWKS von der Signature-Agent-URL holen (nur https, Timeout 3 s, In-Memory-Cache 1 h,
//    negativer Cache 10 min). keyid im JWKS suchen; Ed25519 (OKP/Ed25519) erwartet.
// 4. Signature base nach RFC 9421 aus den signierten Komponenten dieses Requests aufbauen
//    (mindestens '@authority' verlangen; nur die Komponenten verwenden, die Signature-Input nennt).
// 5. crypto.verify(null, base, publicKeyFromJwk, signatureBytes) -> 'verified' | 'invalid'.
// JEDER Fehler auf dem Weg (Netz, Parsing, unbekannter alg) -> 'invalid' hoechstens loggen,
// Verhalten wie 'unsigned'. Die Route darf dadurch NIE fehlschlagen.
```

Rate-Limit: In-Memory-Map `key -> { windowStart, count }`, Fenster 10 min, Limits `unsigned: 30`, `verified: 120`; `search`-Operationen zählen 3, Lese-Operationen 1. Key = verifizierter Agent (JWKS-URL) oder IP (`x-forwarded-for` erste Adresse). Kommentar im Code: nicht billing-grade, Reset bei Deploy — gleiche Ehrlichkeit wie die A2A-Quota.

- [ ] **Step 2: Einhängen**

`/api/mcp`: vor der Handler-Ausführung Verdikt + Limit; bei Überschreitung MCP-konformer Fehler mit `retryAfterSeconds`. `/a2a`: nur Verdikt-Logging (ein `console.log` mit Verdikt + Agent) und das höhere Limit für die bestehende freie Nutzung — die Bezahl-Quota-Logik bleibt exakt unverändert.

- [ ] **Step 3: Verifizieren**

`validate-agent-layer.ts`: Fixture-Test für den Signature-Input-Parser (gültige Zeile → geparst; fehlendes tag → unsigned; abgelaufenes expires → invalid) und für `checkRateLimit` (31. unsigned-Request im Fenster → blocked, verified erst beim 121.). Run grün, Commit:

```bash
git add app/lib/web-bot-auth.ts app/api/mcp/route.ts app/a2a/route.ts scripts/validate-agent-layer.ts
git commit -m "feat: Web Bot Auth (RFC 9421) - differenzierte Rate-Limits, nie blockierend fuer Menschen-Flows"
```

---

### Task 7: PROTOCOLS.md + Doku

**Files:**
- Create: `PROTOCOLS.md`
- Modify: `app/llms.txt/route.ts` (eine Zeile: `- ${baseUrl}/api/mcp: MCP-Server fuer Agenten; Details in PROTOCOLS.md` unter Hauptseiten; plus PROTOCOLS-Verweis)
- Modify: `docs/a2a-agent-access.md` (v1.0-Stand, tasks/get, Verweis auf PROTOCOLS.md)

- [ ] **Step 1: PROTOCOLS.md schreiben** — Struktur verbindlich:

1. Überblick + Kompatibilitätsversprechen (transportoffen, keine proprietären Erweiterungen)
2. Tabelle: Protokoll / implementierte Spec-Version / Endpunkt (MCP 2026-07-28 · `/api/mcp`; A2A 1.0 · `/a2a` + Card; UCP 2026-04-08 · `/.well-known/ucp`; Web Bot Auth draft · alle Agent-Routen)
3. Copy-Paste-Beispiele: (a) MCP-Client-Konfig `{"mcpServers":{"ugc-vz":{"url":"https://ugc-vz.de/api/mcp"}}}` + ein `tools/call`-curl, (b) A2A-Task per curl (`ugc.submit_creator_request` → `tasks/get` mit der zurückgegebenen taskId), (c) `curl https://ugc-vz.de/.well-known/ucp`
4. `human_verification`-Stufen wörtlich aus `VERIFICATION_LEVELS` inkl. „Level 2 wird nicht vergeben"
5. Rate-Limits + Web-Bot-Auth-Anleitung (welche Header, Verhalten bei invalid)
6. Bewusst nicht implementiert: ACP-Feed (Begründung aus der Spec §1), AP2-Mandates (nur Datenmodell vorbereitet), signierte Agent-Cards
7. Datenschutz-Invarianten (keine privaten Kontaktdaten; Outreach nur mit bewusster Auswahl)

- [ ] **Step 2: Verifizieren + Commit**

Grep-Checks: PROTOCOLS.md enthält alle vier Spec-Versionen wörtlich; llms.txt-Route enthält `/api/mcp`. `npm run validate:agent-layer` weiter grün. Commit:

```bash
git add PROTOCOLS.md app/llms.txt/route.ts docs/a2a-agent-access.md
git commit -m "docs: PROTOCOLS.md - Spec-Versionen, Endpunkte, Beispiele; llms.txt-Verweis"
```

---

### Task 8: Preview, Merge, Live-Verifikation

**Files:** keine

- [ ] **Step 1:** `npm run validate:agent-layer` und `npm run validate:competitors` grün.
- [ ] **Step 2:** Branch pushen, Vercel-Preview-Build abwarten (`vercel ls`). Bei Error: Logs holen, Fix-Schleife — NICHT nach main mergen.
- [ ] **Step 3:** Nach grünem Preview: ff-Merge nach main, Push, Production-Deploy abwarten.
- [ ] **Step 4: Live-Checks** (alle müssen bestehen):

```bash
# MCP-Handshake
curl -s -X POST https://ugc-vz.de/api/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2026-07-28","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' | head -c 400
# tools/list liefert exakt 5 Tools
# UCP-Manifest
curl -s https://ugc-vz.de/.well-known/ucp | head -c 300   # ucp_version 2026-04-08
# A2A-Card
curl -s https://ugc-vz.de/.well-known/agent-card.json | grep -o '"protocolVersion":"1.0"'
# Bestehende Methode unverändert (Alias-Check)
curl -s -X POST https://ugc-vz.de/a2a -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"agent.card"}' | head -c 200
# Human-Flows unberuehrt
for p in / /brands /vergleich; do curl -s -o /dev/null -w "$p %{http_code}\n" https://ugc-vz.de$p; done
```

- [ ] **Step 5:** Suche über MCP einmal end-to-end (`tools/call search_creators` mit echter Query) — Ergebnis enthält Creator-Objekte und **keine** E-Mail-Adressen/Telefonnummern (Grep auf `@` im Ergebnis-JSON außer in URLs).

---

## Nach dem Livegang

- `tasks/get` mit einem echten Test-Lead prüfen (Outreach über MCP mit interner Test-Mail-Adresse, Status bis `completed` verfolgen).
- Vercel-Logs auf `web-bot-auth`-Verdikte beobachten; erste verifizierte Agenten (Claude, ChatGPT, Perplexity signieren bereits) sollten als `verified` auftauchen.
- PROTOCOLS.md-URL bei den einschlägigen Agent-Verzeichnissen einreichen (manuell, nicht Teil dieses Plans).

## Bewusste Abweichungen von der Spec-Vorlage des Nutzers

- ACP entfällt (Spec §1, vom Nutzer freigegeben).
- `human_verification_level_min` akzeptiert 0–2, aber Level 2 matcht derzeit nie (ehrliche Ableitung statt Behauptung).
