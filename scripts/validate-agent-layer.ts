import { deriveVerificationLevel, VERIFICATION_LEVELS } from '../app/lib/agent-verification';
import { mapOutreachState } from '../app/lib/agent-gateway';
import { MCP_TOOLS, AGENT_SCHEMAS } from '../app/lib/agent-tools';
import { ugcVzAgentCard } from '../app/lib/a2a-agent-card';
// `manifest` ist bewusst kein Export von route.ts (siehe Kommentar dort) --
// wir rufen stattdessen GET() auf und lesen den echten Response-Body. Das
// prueft zugleich Content-Type und dass die Route ueberhaupt laeuft.
import { GET as getUcpManifest } from '../app/.well-known/ucp/route';

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

// Reale event_type-Werte aus app/api/submit-request/route.ts (Sendezeitpunkt,
// unpraefigiert -- siehe DeliveryResult['status']), nicht nur die
// email.*-Werte des Resend-Webhooks.
check(mapOutreachState({ createdAt: T0, brandEvents: ['queued'], now: new Date('2026-08-15T01:00:00Z') }) === 'working', 'unpraefigiertes Sende-Event "queued" ohne Zustellung: working');
check(mapOutreachState({ createdAt: T0, brandEvents: ['failed'], now: new Date('2026-08-15T01:00:00Z') }) === 'failed', 'unpraefigiertes Sende-Event "failed": failed');
check(mapOutreachState({ createdAt: T0, brandEvents: ['not_configured'], now: new Date('2026-08-15T01:00:00Z') }) === 'failed', 'unpraefigiertes Sende-Event "not_configured": failed');

if (errors.length) { errors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: agent-layer Basisregeln');

// ---------- MCP-Tool-Registry (app/lib/agent-tools.ts) ----------
const registryErrors: string[] = [];
const checkRegistry = (cond: boolean, msg: string) => { if (!cond) registryErrors.push(msg); };

const EXPECTED_TOOL_NAMES = ['search_creators', 'get_creator', 'request_outreach', 'get_outreach_status', 'get_vocab'];

checkRegistry(MCP_TOOLS.length === 5, `MCP_TOOLS muss genau 5 Tools enthalten, hat ${MCP_TOOLS.length}`);
checkRegistry(
  JSON.stringify(MCP_TOOLS.map((t) => t.name)) === JSON.stringify(EXPECTED_TOOL_NAMES),
  `MCP_TOOLS-Namen muessen exakt ${JSON.stringify(EXPECTED_TOOL_NAMES)} sein, sind ${JSON.stringify(MCP_TOOLS.map((t) => t.name))}`,
);
for (const tool of MCP_TOOLS) {
  checkRegistry(
    typeof tool.description === 'string' && tool.description.length >= 200,
    `Description von "${tool.name}" muss mindestens 200 Zeichen haben, hat ${tool.description?.length ?? 0}`,
  );
  checkRegistry(typeof tool.inputSchema === 'object' && tool.inputSchema !== null, `"${tool.name}" braucht ein inputSchema`);
  checkRegistry(typeof tool.handler === 'function', `"${tool.name}" braucht einen Handler`);
}

if (registryErrors.length) { registryErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: mcp tool registry');

// ---------- A2A Agent Card (app/lib/a2a-agent-card.ts) ----------
const cardErrors: string[] = [];
const checkCard = (cond: boolean, msg: string) => { if (!cond) cardErrors.push(msg); };

const EXPECTED_SKILL_IDS = ['creator_search', 'creator_get', 'outreach_request'];

checkCard(ugcVzAgentCard.protocolVersion === '1.0', `protocolVersion muss '1.0' sein, ist ${JSON.stringify(ugcVzAgentCard.protocolVersion)}`);
checkCard(
  Array.isArray(ugcVzAgentCard.skills) && ugcVzAgentCard.skills.length === 3,
  `skills muss genau 3 Eintraege haben, hat ${ugcVzAgentCard.skills?.length ?? 0}`,
);
checkCard(
  JSON.stringify(ugcVzAgentCard.skills.map((s) => s.id)) === JSON.stringify(EXPECTED_SKILL_IDS),
  `skills-IDs muessen exakt ${JSON.stringify(EXPECTED_SKILL_IDS)} sein, sind ${JSON.stringify(ugcVzAgentCard.skills.map((s) => s.id))}`,
);
checkCard(
  ugcVzAgentCard.capabilities.stateTransitionHistory === false,
  'capabilities.stateTransitionHistory muss false sein, bis lead_agent_events die Historie wirklich liefert',
);

if (cardErrors.length) { cardErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: a2a agent card');

// Ab hier async: GET() der UCP-Route liefert eine Response, deren Body wir
// per .json() lesen -- top-level await ist im hier verwendeten cjs-Transform
// (tsx/esbuild ohne "type": "module") nicht erlaubt, deshalb eine
// IIFE statt eines top-level await.
void (async () => {

// ---------- UCP-Manifest (app/.well-known/ucp/route.ts) ----------
// Prueft die tatsaechliche, gegen die UCP-Spec (2026-04-08) verifizierte
// Struktur -- siehe Kommentar in app/.well-known/ucp/route.ts fuer die
// vollstaendige Abweichungsliste vom urspruenglichen Briefing-Entwurf
// (kein ucp_version, kein primary_capability, ucp.services/capabilities
// sind reverse-domain-keyed Maps statt Arrays mit name-Feld).
const manifestErrors: string[] = [];
const checkManifest = (cond: boolean, msg: string) => { if (!cond) manifestErrors.push(msg); };

const KNOWN_SCHEMA_NAMES = EXPECTED_TOOL_NAMES.map((name) => `${name}.json`);

const ucpManifestResponse = await getUcpManifest();
checkManifest(ucpManifestResponse.status === 200, `GET /.well-known/ucp muss 200 liefern, war ${ucpManifestResponse.status}`);
checkManifest(
  (ucpManifestResponse.headers.get('content-type') ?? '').includes('application/json'),
  `GET /.well-known/ucp muss application/json liefern, war ${ucpManifestResponse.headers.get('content-type')}`,
);
const ucpManifest = await ucpManifestResponse.json();

checkManifest(
  ucpManifest.ucp.version === '2026-04-08',
  `ucp.version muss exakt '2026-04-08' sein, ist ${JSON.stringify(ucpManifest.ucp.version)}`,
);

const capabilityDeclarations = Object.values(ucpManifest.ucp.capabilities).flat();
checkManifest(
  capabilityDeclarations.length === 5,
  `ucp.capabilities muss genau 5 Capability-Deklarationen enthalten (ueber alle reverse-domain-Keys hinweg), hat ${capabilityDeclarations.length}`,
);
checkManifest(
  Object.keys(ucpManifest.ucp.capabilities).length === 5,
  `ucp.capabilities muss genau 5 reverse-domain-Keys haben (je Tool einer), hat ${Object.keys(ucpManifest.ucp.capabilities).length}`,
);
for (const [key, declarations] of Object.entries(ucpManifest.ucp.capabilities)) {
  for (const decl of declarations) {
    const schemaUrl = (decl as { schema: string }).schema;
    const matchesKnownName = KNOWN_SCHEMA_NAMES.some((name) => schemaUrl.endsWith(`/${name}`));
    checkManifest(matchesKnownName, `Schema-URL von "${key}" endet nicht auf einen bekannten Tool-Namen: ${schemaUrl}`);
  }
}

// dev.ucp.shopping.checkout bewusst NICHT in ucp.capabilities gelistet
// (spec-konformes Signal fuer "nicht unterstuetzt": Abwesenheit statt eines
// dedizierten Feldes) -- das Briefing wollte zusaetzlich einen expliziten,
// von Menschen und Agenten lesbaren Hinweis samt Begruendung; der lebt in
// der additiven commerce-Sektion, siehe Kommentar in route.ts.
checkManifest(
  !('dev.ucp.shopping.checkout' in ucpManifest.ucp.capabilities),
  'dev.ucp.shopping.checkout darf nicht in ucp.capabilities gelistet sein (wir bieten keinen Checkout an)',
);
checkManifest(ucpManifest.commerce.checkout.supported === false, 'commerce.checkout.supported muss false sein');
checkManifest(
  typeof ucpManifest.commerce.checkout.reason === 'string' && ucpManifest.commerce.checkout.reason.length > 0,
  'commerce.checkout.reason muss eine nicht-leere Begruendung sein',
);

if (manifestErrors.length) { manifestErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: ucp manifest');

// ---------- AGENT_SCHEMAS <-> zod-Feldgleichheit (app/lib/agent-tools.ts) ----------
// AGENT_SCHEMAS wird aus MCP_TOOLS[*].inputSchema abgeleitet (siehe Kommentar
// dort); dieser Check ist trotzdem kein Tautologie-Test, sondern eine
// Regressionssicherung: er faellt, wenn sich zod- oder Standard-Schema-
// Verhalten (z. B. .strict()/.passthrough(), umbenannte Felder) so aendert,
// dass Feldnamen zwischen inputSchema.shape und dem abgeleiteten JSON-Schema
// auseinanderlaufen -- exakt die Garantie, die Task 5 fordert.
const schemaFieldErrors: string[] = [];
const checkSchemaFields = (cond: boolean, msg: string) => { if (!cond) schemaFieldErrors.push(msg); };

for (const tool of MCP_TOOLS) {
  const zodFieldNames = Object.keys(tool.inputSchema.shape).sort();
  const jsonSchema = AGENT_SCHEMAS[tool.name] as { properties?: Record<string, unknown> } | undefined;
  checkSchemaFields(jsonSchema !== undefined, `AGENT_SCHEMAS["${tool.name}"] fehlt`);
  // get_vocab hat ein leeres Objekt-Schema (z.object({})) -- properties kann
  // dafuer fehlen oder {} sein, beides zaehlt als "keine Felder".
  const jsonFieldNames = Object.keys(jsonSchema?.properties ?? {}).sort();
  checkSchemaFields(
    JSON.stringify(zodFieldNames) === JSON.stringify(jsonFieldNames),
    `Feldnamen von "${tool.name}" weichen ab: zod ${JSON.stringify(zodFieldNames)} vs. JSON-Schema ${JSON.stringify(jsonFieldNames)}`,
  );
}

if (schemaFieldErrors.length) { schemaFieldErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: agent-schemas <-> zod Feldgleichheit');

})().catch((error) => {
  console.error('Unerwarteter Fehler in den UCP-/Schema-Checks:', error);
  process.exit(1);
});
