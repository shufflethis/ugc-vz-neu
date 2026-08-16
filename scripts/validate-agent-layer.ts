import { deriveVerificationLevel, VERIFICATION_LEVELS } from '../app/lib/agent-verification';
import { mapOutreachState } from '../app/lib/agent-gateway';
import { MCP_TOOLS } from '../app/lib/agent-tools';
import { ugcVzAgentCard } from '../app/lib/a2a-agent-card';

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
