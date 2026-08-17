import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { deriveVerificationLevel, VERIFICATION_LEVELS } from '../app/lib/agent-verification';
import { mapOutreachState } from '../app/lib/agent-gateway';
import { MCP_TOOLS, AGENT_SCHEMAS } from '../app/lib/agent-tools';
import { ugcVzAgentCard } from '../app/lib/a2a-agent-card';
import { verifyWebBotAuth, checkRateLimit, getRateLimitKey, __internals } from '../app/lib/web-bot-auth';
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

// ---------- Web Bot Auth (app/lib/web-bot-auth.ts, Task 6) ----------
// __internals ist bewusst kein Teil der oeffentlichen Modul-API (siehe
// Kommentar dort) -- nur fuer diese Fixture-Tests exportiert.
const wbaErrors: string[] = [];
const checkWba = (cond: boolean, msg: string) => { if (!cond) wbaErrors.push(msg); };

// -- Signature-Input-Parser: gueltige Zeile -> geparste Felder --
const VALID_SIG_INPUT =
  'sig1=("@authority" "content-type");created=1700000000;expires=1700003600;keyid="test-keyid";alg="ed25519";tag="web-bot-auth"';
const NOW_WITHIN_WINDOW_MS = 1700001000 * 1000; // zwischen created und expires

const parsedValid = __internals.evaluateSignatureInput(VALID_SIG_INPUT, NOW_WITHIN_WINDOW_MS);
checkWba(parsedValid.ok === true, 'gueltige Signature-Input muss geparst werden (ok: true)');
if (parsedValid.ok) {
  checkWba(JSON.stringify(parsedValid.entry.components) === JSON.stringify(['@authority', 'content-type']), `Komponentenliste falsch geparst: ${JSON.stringify(parsedValid.entry.components)}`);
  checkWba(parsedValid.entry.keyid === 'test-keyid', `keyid falsch geparst: ${parsedValid.entry.keyid}`);
  checkWba(parsedValid.entry.alg === 'ed25519', `alg falsch geparst: ${parsedValid.entry.alg}`);
  checkWba(parsedValid.entry.created === 1700000000, `created falsch geparst: ${parsedValid.entry.created}`);
  checkWba(parsedValid.entry.expires === 1700003600, `expires falsch geparst: ${parsedValid.entry.expires}`);
}

// -- fehlendes tag -> unsigned --
const MISSING_TAG_SIG_INPUT = 'sig1=("@authority");created=1700000000;expires=1700003600;keyid="test-keyid";alg="ed25519"';
const parsedMissingTag = __internals.evaluateSignatureInput(MISSING_TAG_SIG_INPUT, NOW_WITHIN_WINDOW_MS);
checkWba(
  parsedMissingTag.ok === false && parsedMissingTag.verdict === 'unsigned',
  `fehlendes tag muss unsigned ergeben, ergab ${JSON.stringify(parsedMissingTag)}`,
);

// -- abgelaufenes expires -> invalid --
const EXPIRED_SIG_INPUT =
  'sig1=("@authority");created=1700000000;expires=1700003600;keyid="test-keyid";alg="ed25519";tag="web-bot-auth"';
const NOW_AFTER_EXPIRY_MS = 1700004000 * 1000; // nach expires=1700003600
const parsedExpired = __internals.evaluateSignatureInput(EXPIRED_SIG_INPUT, NOW_AFTER_EXPIRY_MS);
checkWba(
  parsedExpired.ok === false && parsedExpired.verdict === 'invalid',
  `abgelaufenes expires muss invalid ergeben, ergab ${JSON.stringify(parsedExpired)}`,
);

// -- created > 5 min in der Zukunft -> invalid --
const FUTURE_CREATED_SIG_INPUT =
  'sig1=("@authority");created=1700010000;expires=1700020000;keyid="test-keyid";alg="ed25519";tag="web-bot-auth"';
const NOW_BEFORE_CREATED_MS = 1700000000 * 1000; // created liegt 10000s (>5min) in der Zukunft
const parsedFutureCreated = __internals.evaluateSignatureInput(FUTURE_CREATED_SIG_INPUT, NOW_BEFORE_CREATED_MS);
checkWba(
  parsedFutureCreated.ok === false && parsedFutureCreated.verdict === 'invalid',
  `created > 5min in der Zukunft muss invalid ergeben, ergab ${JSON.stringify(parsedFutureCreated)}`,
);

// -- Signature-Base-Konstruktion: von Hand berechneter Erwartungswert --
// RFC 9421 §2.5: jede covered-component-Zeile "<name>": <wert>, LF-getrennt,
// abschliessend die @signature-params-Zeile OHNE trailing LF. @authority
// wird nach §2.2.3 lowercased mit entferntem Default-Port normalisiert.
if (parsedValid.ok) {
  const fixtureRequest = new Request('https://ugc-vz.de/api/mcp', {
    method: 'POST',
    headers: { host: 'UGC-VZ.de:443', 'content-type': 'application/json' },
  });
  const actualBase = __internals.buildSignatureBase(fixtureRequest, parsedValid.entry);
  const expectedBase = [
    '"@authority": ugc-vz.de',
    '"content-type": application/json',
    '"@signature-params": ("@authority" "content-type");created=1700000000;expires=1700003600;keyid="test-keyid";alg="ed25519";tag="web-bot-auth"',
  ].join('\n');
  checkWba(actualBase === expectedBase, `Signature-Base weicht ab.\n--- actual ---\n${actualBase}\n--- expected ---\n${expectedBase}`);
}

// -- checkRateLimit: unsigned blockiert beim 31. Request im Fenster --
{
  const key = 'validate:rate-limit:unsigned';
  let blockedAt = -1;
  for (let i = 1; i <= 35; i += 1) {
    const result = checkRateLimit(key, 'unsigned');
    if (!result.allowed && blockedAt === -1) blockedAt = i;
  }
  checkWba(blockedAt === 31, `31. unsigned-Request im Fenster muss blockiert werden, war es bei #${blockedAt}`);
}

// -- checkRateLimit: verified erst beim 121. Request blockiert --
{
  const key = 'validate:rate-limit:verified';
  let blockedAt = -1;
  for (let i = 1; i <= 125; i += 1) {
    const result = checkRateLimit(key, 'verified');
    if (!result.allowed && blockedAt === -1) blockedAt = i;
  }
  checkWba(blockedAt === 121, `121. verified-Request muss blockiert werden, war es bei #${blockedAt}`);
}

// -- checkRateLimit: cost=3 (search) zaehlt staerker als cost=1 (read) --
{
  const key = 'validate:rate-limit:cost3';
  let blockedAt = -1;
  let retryAfterSeenAtBlock: number | undefined;
  for (let i = 1; i <= 12; i += 1) {
    const result = checkRateLimit(key, 'unsigned', 3);
    if (!result.allowed && blockedAt === -1) {
      blockedAt = i;
      retryAfterSeenAtBlock = result.retryAfterSeconds;
    }
  }
  checkWba(blockedAt === 11, `11. Request mit cost=3 (33 > Limit 30) muss blockiert werden, war es bei #${blockedAt}`);
  checkWba(typeof retryAfterSeenAtBlock === 'number' && retryAfterSeenAtBlock! > 0, 'retryAfterSeconds muss bei Blockierung gesetzt sein');
}

// -- getRateLimitKey: verified -> Agent-URL, sonst erste x-forwarded-for-IP --
checkWba(
  getRateLimitKey({ verdict: 'verified', agent: 'https://agent.example.test/jwks' }, new Request('https://ugc-vz.de/api/mcp')) === 'https://agent.example.test/jwks',
  'getRateLimitKey muss bei verified die Agent-URL als Key liefern',
);
checkWba(
  getRateLimitKey(
    { verdict: 'unsigned' },
    new Request('https://ugc-vz.de/api/mcp', { headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' } }),
  ) === '203.0.113.5',
  'getRateLimitKey muss bei unsigned die erste x-forwarded-for-IP als Key liefern',
);

if (wbaErrors.length) { wbaErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
console.log('OK: web-bot-auth Fixture-Tests (Parser, Signature-Base, Rate-Limit)');

// ---------- Web Bot Auth: voller Round-Trip (echtes Ed25519-Keypaar) ----------
// Erzeugt ein echtes Schluesselpaar, signiert einen synthetischen Request
// exakt so, wie es ein Agent taete (Signature-Base ueber denselben
// buildSignatureBase-Pfad, den auch der Verifier nutzt), und verifiziert
// ihn ueber die volle verifyWebBotAuth()-Pipeline -- Header-Parsing,
// JWKS-Keyid-Matching per Thumbprint (RFC 7638/8037), Cache, Ed25519-Crypto.
// Der JWKS-Fetch wird ueber den injizierten jwksResolver gestubbt (kein
// Netzzugriff, siehe Options-Parameter von verifyWebBotAuth).
const wbaRoundtripErrors: string[] = [];
const checkRoundtrip = (cond: boolean, msg: string) => { if (!cond) wbaRoundtripErrors.push(msg); };

const { publicKey: rtPublicKey, privateKey: rtPrivateKey } = generateKeyPairSync('ed25519');
const rtJwk = rtPublicKey.export({ format: 'jwk' }) as { kty: string; crv: string; x: string };
const rtKeyid = __internals.computeJwkThumbprint(rtJwk);
checkRoundtrip(typeof rtKeyid === 'string' && rtKeyid.length > 0, 'JWK-Thumbprint (keyid) muss berechenbar sein');

const rtNowSec = Math.floor(Date.now() / 1000);
const rtSigInput = `sig1=("@authority");created=${rtNowSec};expires=${rtNowSec + 300};keyid="${rtKeyid}";alg="ed25519";tag="web-bot-auth"`;
const RT_AGENT_URL = 'https://agent.example.test/jwks';

// Basis nur ueber Host-Header berechnen (die drei WBA-Header selbst sind
// nicht Teil der signierten Komponenten -- components ist nur @authority).
const rtBaseRequest = new Request('https://ugc-vz.de/api/mcp', { method: 'POST', headers: { host: 'ugc-vz.de' } });
const rtEvaluated = __internals.evaluateSignatureInput(rtSigInput, Date.now());
if (rtEvaluated.ok) {
  const rtBase = __internals.buildSignatureBase(rtBaseRequest, rtEvaluated.entry);
  const rtSignatureBytes = cryptoSign(null, Buffer.from(rtBase, 'utf8'), rtPrivateKey);
  const rtSignatureHeader = `sig1=:${rtSignatureBytes.toString('base64')}:`;

  let jwksFetchCount = 0;
  const stubResolver = async (url: string) => {
    jwksFetchCount += 1;
    return url === RT_AGENT_URL ? { keys: [rtJwk] } : null;
  };

  const rtVerifyRequest = new Request('https://ugc-vz.de/api/mcp', {
    method: 'POST',
    headers: {
      host: 'ugc-vz.de',
      'signature-agent': `"${RT_AGENT_URL}"`,
      'signature-input': rtSigInput,
      signature: rtSignatureHeader,
    },
  });

  const rtResult = await verifyWebBotAuth(rtVerifyRequest, { jwksResolver: stubResolver });
  checkRoundtrip(rtResult.verdict === 'verified', `Runde-Trip-Signatur muss verified ergeben, war ${rtResult.verdict}`);
  checkRoundtrip(rtResult.agent === RT_AGENT_URL, `agent im Ergebnis muss die Signature-Agent-URL sein, war ${rtResult.agent}`);

  // Negativtest: letztes Byte der Signatur geflippt -> invalid (nicht
  // verified, nicht unsigned -- die Signatur ist wohlgeformt, aber falsch).
  const tamperedBytes = Buffer.from(rtSignatureBytes);
  tamperedBytes[tamperedBytes.length - 1] ^= 0xff;
  const rtTamperedRequest = new Request('https://ugc-vz.de/api/mcp', {
    method: 'POST',
    headers: {
      host: 'ugc-vz.de',
      'signature-agent': `"${RT_AGENT_URL}"`,
      'signature-input': rtSigInput,
      signature: `sig1=:${tamperedBytes.toString('base64')}:`,
    },
  });
  const rtTamperedResult = await verifyWebBotAuth(rtTamperedRequest, { jwksResolver: stubResolver });
  checkRoundtrip(rtTamperedResult.verdict === 'invalid', `Manipulierte Signatur muss invalid ergeben, war ${rtTamperedResult.verdict}`);

  // JWKS-Cache: ueber beide Aufrufe hinweg (gleiche Signature-Agent-URL)
  // darf der Resolver nur einmal aufgerufen worden sein.
  checkRoundtrip(jwksFetchCount === 1, `JWKS-Resolver haette genau 1x aufgerufen werden muessen (Cache), war ${jwksFetchCount}x`);

  if (wbaRoundtripErrors.length) { wbaRoundtripErrors.forEach((e) => console.error(' -', e)); process.exit(1); }
  console.log('OK: web-bot-auth Round-Trip (echtes Ed25519-Keypaar, verified + invalid + JWKS-Cache)');
} else {
  console.error('Unerwarteter Fehler: Round-Trip-Signature-Input konnte nicht geparst werden', rtEvaluated);
  process.exit(1);
}

})().catch((error) => {
  console.error('Unerwarteter Fehler in den UCP-/Schema-Checks:', error);
  process.exit(1);
});
