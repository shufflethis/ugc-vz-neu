// Web Bot Auth Verifikation (RFC 9421 "HTTP Message Signatures" +
// draft-meunier-webbotauth-httpsig-protocol) plus ein bewusst simples,
// in-memory Rate-Limit fuer die Agent-Routen (/api/mcp, /a2a).
//
// Zweck laut Spec (docs/superpowers/specs/2026-08-15-agent-layer-design.md
// §4.4): "wo vorhanden" pruefen, DIFFERENZIEREN nie BLOCKIEREN. Ein Bot ohne
// (oder mit kaputter) Signatur ist weiterhin ein normaler, funktionierender
// Client -- er bekommt nur das niedrigere Rate-Limit-Tier statt eines
// hoeheren. Deshalb gilt strikt: aus verifyWebBotAuth() darf NIE eine
// Exception entkommen, jede Fehlerklasse degradiert hoechstens zu 'unsigned'.
//
// Recherche-Quellen (WebFetch waehrend der Implementierung, siehe Report):
// - RFC 9421 (HTTP Message Signatures), https://www.rfc-editor.org/rfc/rfc9421.html
//   -- Signature-Base-Aufbau (§2.5), Serialisierung der Komponenten (§2.1-2.3),
//   @authority-Normalisierung (§2.2.3).
// - RFC 8941 (Structured Field Values), https://www.rfc-editor.org/rfc/rfc8941.html
//   -- Grammatik fuer Dictionary/Inner-List/String/Integer/Byte-Sequence, die
//   Signature-Input/Signature/Signature-Agent tragen.
// - draft-meunier-webbotauth-httpsig-protocol (Nachfolger von
//   draft-meunier-web-bot-auth-architecture, das expired ist),
//   https://datatracker.ietf.org/doc/html/draft-meunier-webbotauth-httpsig-protocol
//   -- tag MUST be "web-bot-auth"; keyid MUST be der base64url JWK-SHA-256-
//   Thumbprint (RFC 7638 §3.2 fuer RSA/EC, RFC 8037 Appendix A.3 fuer
//   Ed25519); JWKS-Directory-Shape (kty/crv/kid/x); mindestens @authority
//   oder @target-uri muss abgedeckt sein.
//
// Dokumentierte Vereinfachung ggue. dem vollen Draft (siehe Report,
// "Concerns"): der Draft behandelt Signature-Agent als Dictionary, das einen
// Origin identifiziert, an dem fuer den Typ "directory" (Default) der
// wohlbekannte Pfad /.well-known/http-message-signatures-directory
// aufgeloest wird. Das Task-Briefing vereinfacht das explizit zu "Signature-
// Agent (URL des JWKS-Directory)" -- wir fetchen daher die im Header
// genannte URL direkt als JWKS-Dokument, OHNE Well-known-Pfad-Aufloesung.
// Das ist die im Briefing verlangte Verhaltensweise; sie ist bewusst enger
// als der volle Draft (dort waere die URL nur ein Origin-Identifier).

import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';

// ============================================================================
// Oeffentliche Typen
// ============================================================================

export type WebBotAuthVerdict = 'verified' | 'invalid' | 'unsigned';

export interface VerifyResult {
  verdict: WebBotAuthVerdict;
  /** Signature-Agent-URL, sofern der Header geparst werden konnte (auch bei invalid/unsigned aus Netz-/Parsing-Gruenden, fuers Logging). */
  agent?: string;
}

/** JWKS-Dokument-Shape nach RFC 7517 §5. */
export interface JwksDocument {
  keys: Array<Record<string, unknown>>;
}

/** Injection-Punkt fuer Tests: ersetzt den echten HTTPS-Fetch der JWKS. */
export type JwksResolver = (url: string) => Promise<JwksDocument | null>;

export interface VerifyWebBotAuthOptions {
  /** Fuer Tests: eigener JWKS-Resolver statt des echten Netz-Fetches. */
  jwksResolver?: JwksResolver;
  /** Fuer Tests: "jetzt" in ms epoch statt Date.now(). */
  now?: number;
}

// ============================================================================
// Minimaler RFC-8941-Parser (Structured Field Values)
// ============================================================================
// Wir brauchen keinen vollstaendigen RFC-8941-Parser -- nur genug, um
// Signature-Input (Dictionary aus Label -> Inner List mit Parametern),
// Signature (Dictionary aus Label -> Byte Sequence) und Signature-Agent
// (bare String Item ODER Dictionary aus Label -> String) zu lesen und die
// geparsten Werte fuer die @signature-params-Zeile wieder kanonisch zu
// serialisieren (RFC 9421 §2.5 verlangt genau das: keine Byte-Kopie des
// Headers, sondern eine Neu-Serialisierung des geparsten Werts).

type SfParamValue = string | number | boolean;
type SfParams = Array<[string, SfParamValue]>;

interface SfString { type: 'string'; value: string; params: SfParams }
interface SfToken { type: 'token'; value: string; params: SfParams }
interface SfInteger { type: 'integer'; value: number; params: SfParams }
interface SfBoolean { type: 'boolean'; value: boolean; params: SfParams }
interface SfBinary { type: 'binary'; value: Buffer; params: SfParams }
type SfBareItem = SfString | SfToken | SfInteger | SfBoolean | SfBinary;
interface SfInnerList { type: 'inner-list'; items: SfBareItem[]; params: SfParams }
type SfItem = SfBareItem | SfInnerList;
type SfDictionary = Map<string, SfItem>;

class SfSyntaxError extends Error {}

class SfParser {
  private i = 0;
  constructor(private readonly s: string) {}

  private peek(): string | undefined {
    return this.s[this.i];
  }

  private eof(): boolean {
    return this.i >= this.s.length;
  }

  private skipSP(): void {
    while (!this.eof() && this.peek() === ' ') this.i += 1;
  }

  private expect(ch: string): void {
    if (this.peek() !== ch) {
      throw new SfSyntaxError(`expected "${ch}" at offset ${this.i}, got "${this.peek() ?? '<eof>'}"`);
    }
    this.i += 1;
  }

  // key = ( lcalpha / "*" ) *( lcalpha / DIGIT / "_" / "-" / "." / "*" )
  private parseKey(): string {
    const start = this.i;
    if (!/[a-z*]/.test(this.peek() ?? '')) throw new SfSyntaxError(`invalid key start at ${this.i}`);
    this.i += 1;
    while (!this.eof() && /[a-z0-9_.*-]/.test(this.peek()!)) this.i += 1;
    return this.s.slice(start, this.i);
  }

  private parseSfString(): SfString {
    this.expect('"');
    let out = '';
    while (true) {
      if (this.eof()) throw new SfSyntaxError('unterminated string');
      const ch = this.s[this.i];
      this.i += 1;
      if (ch === '"') break;
      if (ch === '\\') {
        const next = this.s[this.i];
        if (next !== '"' && next !== '\\') throw new SfSyntaxError('invalid escape in string');
        out += next;
        this.i += 1;
        continue;
      }
      out += ch;
    }
    return { type: 'string', value: out, params: [] };
  }

  private parseSfToken(): SfToken {
    const start = this.i;
    if (!/[a-zA-Z*]/.test(this.peek() ?? '')) throw new SfSyntaxError(`invalid token start at ${this.i}`);
    this.i += 1;
    while (!this.eof() && /[a-zA-Z0-9_.:%*/!#$&'^~+-]/.test(this.peek()!)) this.i += 1;
    return { type: 'token', value: this.s.slice(start, this.i), params: [] };
  }

  private parseSfNumber(): SfInteger {
    const start = this.i;
    if (this.peek() === '-') this.i += 1;
    while (!this.eof() && /[0-9]/.test(this.peek()!)) this.i += 1;
    if (this.peek() === '.') {
      // sf-decimal -- wir brauchen nur Integer (created/expires sind
      // Unix-Sekunden ohne Nachkommastellen), lesen aber die Nachkomma-
      // stellen trotzdem mit, statt still falsch zu parsen.
      this.i += 1;
      while (!this.eof() && /[0-9]/.test(this.peek()!)) this.i += 1;
      return { type: 'integer', value: Number(this.s.slice(start, this.i)), params: [] };
    }
    return { type: 'integer', value: Number(this.s.slice(start, this.i)), params: [] };
  }

  private parseSfBinary(): SfBinary {
    this.expect(':');
    const start = this.i;
    while (!this.eof() && this.peek() !== ':') this.i += 1;
    const b64 = this.s.slice(start, this.i);
    this.expect(':');
    return { type: 'binary', value: Buffer.from(b64, 'base64'), params: [] };
  }

  private parseSfBoolean(): SfBoolean {
    this.expect('?');
    const ch = this.peek();
    if (ch !== '0' && ch !== '1') throw new SfSyntaxError('invalid boolean');
    this.i += 1;
    return { type: 'boolean', value: ch === '1', params: [] };
  }

  private parseBareItem(): SfBareItem {
    const ch = this.peek();
    if (ch === '"') return this.parseSfString();
    if (ch === ':') return this.parseSfBinary();
    if (ch === '?') return this.parseSfBoolean();
    if (ch === '-' || (ch !== undefined && /[0-9]/.test(ch))) return this.parseSfNumber();
    if (ch !== undefined && /[a-zA-Z*]/.test(ch)) return this.parseSfToken();
    throw new SfSyntaxError(`unexpected character "${ch ?? '<eof>'}" at ${this.i}`);
  }

  private parseParams(): SfParams {
    const params: SfParams = [];
    while (this.peek() === ';') {
      this.i += 1;
      this.skipSP();
      const key = this.parseKey();
      let value: SfParamValue = true;
      if (this.peek() === '=') {
        this.i += 1;
        const item = this.parseBareItem();
        value = item.type === 'binary' ? item.value.toString('base64') : item.value;
      }
      params.push([key, value]);
    }
    return params;
  }

  private parseInnerList(): SfInnerList {
    this.expect('(');
    const items: SfBareItem[] = [];
    this.skipSP();
    while (this.peek() !== ')') {
      const item = this.parseBareItem();
      item.params = this.parseParams();
      items.push(item);
      this.skipSP();
      if (this.eof()) throw new SfSyntaxError('unterminated inner list');
    }
    this.expect(')');
    const params = this.parseParams();
    return { type: 'inner-list', items, params };
  }

  private parseItemOrInnerList(): SfItem {
    if (this.peek() === '(') return this.parseInnerList();
    const item = this.parseBareItem();
    item.params = this.parseParams();
    return item;
  }

  /** sh-dictionary = dict-member, *( OWS "," OWS dict-member ) */
  parseDictionary(): SfDictionary {
    const dict: SfDictionary = new Map();
    this.skipSP();
    if (this.eof()) return dict;
    while (true) {
      const key = this.parseKey();
      let value: SfItem;
      if (this.peek() === '=') {
        this.i += 1;
        value = this.parseItemOrInnerList();
      } else {
        // bare key => implicit boolean true with optional params
        value = { type: 'boolean', value: true, params: this.parseParams() };
      }
      dict.set(key, value);
      this.skipSP();
      if (this.peek() !== ',') break;
      this.i += 1;
      this.skipSP();
    }
    return dict;
  }

  parseSingleItem(): SfItem {
    this.skipSP();
    return this.parseItemOrInnerList();
  }
}

function parseSfDictionary(headerValue: string): SfDictionary {
  return new SfParser(headerValue.trim()).parseDictionary();
}

function escapeSfString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function serializeBareItem(item: SfBareItem): string {
  switch (item.type) {
    case 'string':
      return `"${escapeSfString(item.value)}"`;
    case 'token':
      return item.value;
    case 'integer':
      return String(item.value);
    case 'boolean':
      return item.value ? '?1' : '?0';
    case 'binary':
      return `:${item.value.toString('base64')}:`;
  }
}

function serializeParams(params: SfParams): string {
  return params
    .map(([key, value]) => {
      if (typeof value === 'boolean') return value ? `;${key}` : `;${key}=?0`;
      if (typeof value === 'number') return `;${key}=${value}`;
      return `;${key}="${escapeSfString(value)}"`;
    })
    .join('');
}

/**
 * RFC 9421 §2.5 Schritt zur @signature-params-Komponente: "the component
 * value" ist eine Neu-Serialisierung des Inner-List-Werts (Komponenten +
 * dessen Parameter) aus Signature-Input fuer genau diese Signatur -- keine
 * Byte-Kopie des Original-Headers. RFC-8941-Serialisierung ist kanonisch,
 * d. h. ein konformer Signer und wir als Verifier kommen (bei identischer
 * Parameter-Reihenfolge, die wir beim Parsen erhalten) auf denselben String.
 */
function serializeInnerList(item: SfInnerList): string {
  const inner = item.items.map((i) => serializeBareItem(i) + serializeParams(i.params)).join(' ');
  return `(${inner})${serializeParams(item.params)}`;
}

// ============================================================================
// Schritt 2: Signature-Input parsen + tag/created/expires pruefen
// ============================================================================

interface SignatureInputEntry {
  label: string;
  components: string[];
  keyid: string;
  alg: string;
  created: number;
  expires: number;
  raw: SfInnerList;
}

type EvaluateSignatureInputResult =
  | { ok: true; entry: SignatureInputEntry }
  | { ok: false; verdict: 'unsigned' | 'invalid' };

/**
 * Parst Signature-Input (Dictionary aus Label -> Inner List von Komponenten-
 * Identifiern + Parametern created/expires/keyid/alg/tag) und wendet die im
 * Briefing verlangten Regeln an:
 * - tag !== "web-bot-auth" (oder fehlende/kaputte Pflichtparameter) -> das
 *   Dictionary-Mitglied ist nicht fuer uns, naechstes probieren; keins
 *   passt -> unsigned.
 * - expires in der Vergangenheit -> invalid.
 * - created mehr als 5 Minuten in der Zukunft -> invalid.
 *
 * Exportiert (unter evaluateSignatureInput) fuer die Fixture-Tests in
 * scripts/validate-agent-layer.ts.
 */
function evaluateSignatureInputInternal(headerValue: string, nowMs: number): EvaluateSignatureInputResult {
  let dict: SfDictionary;
  try {
    dict = parseSfDictionary(headerValue);
  } catch {
    return { ok: false, verdict: 'unsigned' };
  }

  const nowSec = nowMs / 1000;
  const FIVE_MIN_SEC = 5 * 60;

  for (const [label, item] of dict) {
    if (item.type !== 'inner-list') continue;
    const params = Object.fromEntries(item.params) as Record<string, SfParamValue>;
    if (params.tag !== 'web-bot-auth') continue;

    const { keyid, alg, created, expires } = params;
    if (typeof keyid !== 'string' || typeof alg !== 'string' || typeof created !== 'number' || typeof expires !== 'number') {
      // Getaggt, aber Pflichtparameter fehlen/falscher Typ -- Parsing-Fehler,
      // degradiert wie jeder andere Fehler zu unsigned (Regel 6), nicht zu
      // invalid.
      continue;
    }

    let components: string[];
    try {
      components = item.items.map((i) => {
        if (i.type !== 'string') throw new SfSyntaxError('component identifier must be a string');
        return i.value;
      });
    } catch {
      continue;
    }

    if (expires <= nowSec) return { ok: false, verdict: 'invalid' };
    if (created > nowSec + FIVE_MIN_SEC) return { ok: false, verdict: 'invalid' };

    return { ok: true, entry: { label, components, keyid, alg, created, expires, raw: item } };
  }

  return { ok: false, verdict: 'unsigned' };
}

// ============================================================================
// Signature-Agent parsen (bare String Item oder Dictionary -> URL)
// ============================================================================

function extractSignatureAgentUrl(headerValue: string): string | null {
  try {
    const trimmed = headerValue.trim();
    if (trimmed.startsWith('"')) {
      const item = new SfParser(trimmed).parseSingleItem();
      return item.type === 'string' ? item.value : null;
    }
    const dict = parseSfDictionary(trimmed);
    for (const item of dict.values()) {
      if (item.type === 'string') return item.value;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Schritt 4: Signature-Base nach RFC 9421 §2.5 aufbauen
// ============================================================================

function stripDefaultPort(host: string): string {
  // Vereinfachung: wir kennen das Schema hier nicht zuverlaessig (Proxy),
  // daher entfernen wir sowohl :443 als auch :80 bedingungslos -- der worst
  // case ist ein zu frueh gestripptes Nicht-Default-Port auf :80/:443, was
  // praktisch nicht vorkommt.
  return host.replace(/:443$/, '').replace(/:80$/, '');
}

function getAuthority(request: Request, url: URL): string {
  // RFC 9421 §2.2.3: "the hostname is normalized to lowercase, and the
  // default port is omitted." Host-Header hat Vorrang vor url.host, weil das
  // der Wert ist, den der Client tatsaechlich gesendet (und signiert) hat.
  const host = request.headers.get('host') || url.host;
  return stripDefaultPort(host.toLowerCase());
}

/**
 * Loest den Wert einer einzelnen von Signature-Input genannten Komponente
 * gegen den echten Request auf. Wirft bei jeder nicht unterstuetzten oder
 * nicht vorhandenen Komponente -- der Aufrufer faengt das ab und degradiert
 * zu 'unsigned' (Regel 6: Parsing-/Build-Fehler blockieren nie).
 */
function resolveComponentValue(request: Request, url: URL, name: string): string {
  switch (name) {
    case '@method':
      // RFC 9421 §2.2.1
      return request.method.toUpperCase();
    case '@authority':
      return getAuthority(request, url);
    case '@scheme':
      // RFC 9421 §2.2.4 -- hinter einem Reverse Proxy (Vercel) ist
      // x-forwarded-proto die verlaessliche Quelle, url.protocol faellt auf
      // das intern gesehene Schema zurueck.
      return (request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')).toLowerCase();
    case '@path':
      // RFC 9421 §2.2.5
      return url.pathname || '/';
    case '@query':
      // RFC 9421 §2.2.6: "?" allein, wenn kein Query-String vorhanden ist;
      // sonst der Query-String inkl. fuehrendem "?".
      return url.search || '?';
    case '@target-uri': {
      // RFC 9421 §2.2.2 -- rekonstruiert aus Authority + Pfad + Query, da
      // request.url (Next.js) hinter einem Proxy nicht zwingend die
      // oeffentliche URL ist.
      const scheme = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
      return `${scheme}://${getAuthority(request, url)}${url.pathname}${url.search}`;
    }
    case '@request-target':
      // Nur Origin-Form (path[?query]) -- diese Deployment-Umgebung sieht
      // nie Authority-/Absolute-Form-Request-Zeilen.
      return url.pathname + (url.search || '');
    default: {
      if (name.startsWith('@')) throw new Error(`unsupported derived component: ${name}`);
      // RFC 9421 §2.1: "combined field value" -- Headers.get() liefert bei
      // Fetch API bereits mit ", " zusammengefuegte Werte fuer mehrfach
      // gesendete Feldzeilen; wir trimmen zusaetzlich defensiv.
      const value = request.headers.get(name);
      if (value === null) throw new Error(`missing header for covered component: ${name}`);
      return value.trim();
    }
  }
}

/**
 * RFC 9421 §2.5: "signature-base = *( signature-base-line LF )
 * signature-params-line" -- jede Komponentenzeile gefolgt von LF, die
 * abschliessende @signature-params-Zeile OHNE trailing LF.
 */
function buildSignatureBase(request: Request, entry: SignatureInputEntry): string {
  if (!entry.components.includes('@authority')) {
    // Briefing verlangt mindestens @authority als abgedeckte Komponente.
    throw new Error('signature must cover @authority');
  }

  const url = new URL(request.url);
  const lines = entry.components.map((name) => `"${escapeSfString(name)}": ${resolveComponentValue(request, url, name)}`);
  lines.push(`"@signature-params": ${serializeInnerList(entry.raw)}`);
  return lines.join('\n');
}

// ============================================================================
// Schritt 3: JWKS holen (Cache) + Keyid-Matching per JWK-Thumbprint
// ============================================================================

const JWKS_FETCH_TIMEOUT_MS = 3_000;
const JWKS_POSITIVE_TTL_MS = 60 * 60 * 1000; // 1h
const JWKS_NEGATIVE_TTL_MS = 10 * 60 * 1000; // 10min
const JWKS_CACHE_MAX_ENTRIES = 2_000;

// Fix-Runde (Finding B, SSRF/Fetch-Amplification): wohlbekannter Pfad aus dem
// Draft (draft-meunier-webbotauth-httpsig-protocol, siehe Modul-Kopfkommentar
// und Fix-Report Abschnitt "Finding A") fuer den Default-Discovery-Fall
// "Signature-Agent nennt nur einen Origin, keinen eigenen JWKS-Pfad".
const WELL_KNOWN_JWKS_PATH = '/.well-known/http-message-signatures-directory';

// Fix-Runde: max. gleichzeitig ausstehende echte JWKS-Fetches (nicht: Cache-
// Treffer, nicht: injizierte Test-Resolver). Verhindert, dass ein Angreifer
// durch viele parallele Anfragen mit unterschiedlichen (oder identischen,
// noch nicht gecachten) Signature-Agent-URLs beliebig viele gleichzeitige
// ausgehende HTTPS-Verbindungen von diesem Server ausloest.
const MAX_CONCURRENT_JWKS_FETCHES = 4;
let inFlightJwksFetches = 0;

/**
 * Fix-Runde (Finding B): grobe, aber ausreichende Ablehnung von IP-Literalen
 * (v4/v6) und "localhost" als Signature-Agent-Host, BEVOR ueberhaupt gefetcht
 * wird -- verhindert das offensichtlichste SSRF-Muster (Client zeigt direkt
 * auf 127.0.0.1/interne IP/Metadaten-Endpunkt per IP-Literal).
 *
 * Bewusst NICHT abgedeckt: DNS-Rebinding oder ein oeffentlicher Hostname, der
 * auf eine interne/private IP aufloest (z. B. ein Angreifer-Domain mit A-
 * Record 169.254.169.254). Das wuerde eine eigene DNS-Aufloesung +
 * IP-Pinning vor dem eigentlichen fetch() erfordern (deutlich mehr
 * Komplexitaet als in dieser Phase gerechtfertigt). Vertretbar, weil an
 * dieser Stelle noch KEINE Zugriffs-/Autorisierungsentscheidung am Verdikt
 * haengt (Spec §4.4: "differenzieren, nie blockieren") -- der schlimmste
 * Fall ist ein Server-seitiger HTTPS-GET gegen eine vom Angreifer gewaehlte
 * interne Adresse mit 3s-Timeout, dessen (nicht an den Client
 * zurueckgegebene) Antwort hoechstens beeinflusst, ob spaeter 'verified'
 * oder 'unsigned' geloggt wird. Dokumentiertes Restrisiko fuer eine
 * zukuenftige Phase, in der Web-Bot-Auth echte Zugriffsentscheidungen trifft.
 */
function isForbiddenJwksHost(hostname: string): boolean {
  // Trailing Dot entfernen (FQDN-Notation, "localhost." loest genau wie
  // "localhost" auf Loopback auf; WHATWG URL() normalisiert IPv4-Literale
  // bereits selbst auf Dotted-Quad, aber nicht den trailing dot bei
  // Hostnamen) -- sonst wuerde "localhost." die localhost-Erkennung umgehen.
  const lower = hostname.toLowerCase().replace(/\.$/, '');
  if (lower === 'localhost') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) return true; // IPv4-Literal
  // URL()-Hostnamen von IPv6-Literalen sind bereits Klammer-frei (z. B.
  // "::1"); echte DNS-Namen enthalten laut RFC 1123 keinen Doppelpunkt, ein
  // Doppelpunkt reicht daher als zuverlaessiges IPv6-Signal.
  if (lower.includes(':')) return true;
  return false;
}

/**
 * jwks_uri- vs. Directory-Discovery (Fix-Runde, Finding A): hat die
 * Signature-Agent-URL einen "echten" Pfad, wird sie unveraendert als
 * JWKS-Dokument-URL benutzt (jwks_uri-Stil). Ist der Pfad leer oder "/"
 * (bare origin -- so sendet z. B. ChatGPT laut draft §5.2.1 recherchiertem
 * Verhalten), wird stattdessen der wohlbekannte Pfad an diesem Origin
 * gefetcht (Draft-Default fuer den Discovery-Typ "directory").
 */
function resolveJwksFetchUrl(agentUrl: string, parsed: URL): string {
  const hasMeaningfulPath = parsed.pathname !== '' && parsed.pathname !== '/';
  return hasMeaningfulPath ? agentUrl : `${parsed.origin}${WELL_KNOWN_JWKS_PATH}`;
}

interface JwksCacheEntry {
  expiresAt: number;
  data: JwksDocument | null;
}

const jwksCache = new Map<string, JwksCacheEntry>();

function boundJwksCache(): void {
  if (jwksCache.size <= JWKS_CACHE_MAX_ENTRIES) return;
  // Gegen einen Angreifer, der beliebig viele Signature-Agent-URLs schickt,
  // um den Cache unbegrenzt wachsen zu lassen: aelteste Eintraege zuerst raus.
  const entries = [...jwksCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const removeCount = entries.length - JWKS_CACHE_MAX_ENTRIES + Math.ceil(JWKS_CACHE_MAX_ENTRIES * 0.1);
  for (const [key] of entries.slice(0, removeCount)) jwksCache.delete(key);
}

async function fetchJwksDirect(url: string): Promise<JwksDocument | null> {
  if (!url.startsWith('https://')) return null; // nur https, siehe Briefing

  // Fix-Runde (Finding B): Nebenlaeufigkeitsgrenze fuer echte ausgehende
  // Fetches. Ueber der Grenze wird wie ein normaler Fetch-Fehler behandelt
  // (-> negativer Cache, Verdikt degradiert zu unsigned) statt die Anfrage
  // aufzustauen -- ein voruebergehender Ausreisser bei sehr hoher Last kostet
  // im schlimmsten Fall bis zu 10 Minuten das hoehere Rate-Limit-Tier fuer
  // einen echten Agenten, blockiert aber nie eine Route (Spec §4.4).
  if (inFlightJwksFetches >= MAX_CONCURRENT_JWKS_FETCHES) return null;
  inFlightJwksFetches += 1;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JWKS_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      // Fix-Runde (Finding B): keine Redirects folgen -- verhindert, dass
      // eine zunaechst erlaubte https-URL serverseitig auf eine verbotene
      // (IP-Literal/localhost/internes Ziel) umgeleitet wird und unsere
      // Host-Pruefung (isForbiddenJwksHost) dadurch umgangen wird.
      redirect: 'error',
    });
    if (!response.ok) return null;
    const body = await response.json();
    if (!body || !Array.isArray(body.keys)) return null;
    return body as JwksDocument;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    inFlightJwksFetches -= 1;
  }
}

async function resolveJwks(url: string, resolver: JwksResolver = fetchJwksDirect, nowMs: number): Promise<JwksDocument | null> {
  const cached = jwksCache.get(url);
  if (cached && cached.expiresAt > nowMs) return cached.data;

  const data = await resolver(url).catch(() => null);
  const ttl = data ? JWKS_POSITIVE_TTL_MS : JWKS_NEGATIVE_TTL_MS;
  jwksCache.set(url, { expiresAt: nowMs + ttl, data });
  boundJwksCache();
  return data;
}

/**
 * RFC 7638 §3.2 (RSA/EC) bzw. RFC 8037 Appendix A.3 (OKP/Ed25519):
 * SHA-256 ueber die kanonische JSON-Serialisierung der "required members"
 * in lexikografischer Reihenfolge, ohne Whitespace, base64url ohne Padding.
 * Wir unterstuetzen nur OKP/Ed25519 (einziger von diesem Modul akzeptierter
 * alg-Wert), RSA/EC sind der Vollstaendigkeit halber dokumentiert.
 */
function computeJwkThumbprint(jwk: Record<string, unknown>): string | null {
  let canonical: string;
  if (jwk.kty === 'OKP') {
    canonical = `{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}"}`;
  } else if (jwk.kty === 'EC') {
    canonical = `{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}","y":"${jwk.y}"}`;
  } else if (jwk.kty === 'RSA') {
    canonical = `{"e":"${jwk.e}","kty":"${jwk.kty}","n":"${jwk.n}"}`;
  } else {
    return null;
  }
  return createHash('sha256').update(canonical, 'utf8').digest('base64url');
}

/**
 * Draft (siehe Modul-Kopfkommentar): "keyid MUST be a base64url JWK
 * SHA-256 Thumbprint [...]. Verifiers match the keyid parameter against the
 * JWK kid field (which should be set to the thumbprint), or compute
 * thumbprints if kid is missing." -- genau diese zwei Wege probieren wir.
 */
function findJwkByKeyid(jwks: JwksDocument, keyid: string): Record<string, unknown> | null {
  for (const jwk of jwks.keys) {
    if (jwk.kid === keyid) return jwk;
  }
  for (const jwk of jwks.keys) {
    if (computeJwkThumbprint(jwk) === keyid) return jwk;
  }
  return null;
}

// ============================================================================
// Schritt 1 + Orchestrierung
// ============================================================================

export async function verifyWebBotAuth(request: Request, options: VerifyWebBotAuthOptions = {}): Promise<VerifyResult> {
  try {
    const signatureAgentHeader = request.headers.get('signature-agent');
    const signatureInputHeader = request.headers.get('signature-input');
    const signatureHeader = request.headers.get('signature');
    if (!signatureAgentHeader || !signatureInputHeader || !signatureHeader) {
      return { verdict: 'unsigned' };
    }

    const agentUrl = extractSignatureAgentUrl(signatureAgentHeader);
    if (!agentUrl || !agentUrl.startsWith('https://')) {
      return { verdict: 'unsigned' };
    }
    let agentUrlParsed: URL;
    try {
      agentUrlParsed = new URL(agentUrl);
    } catch {
      return { verdict: 'unsigned' };
    }
    // Fix-Runde (Finding B): IP-Literale/localhost als Signature-Agent-Host
    // ablehnen, BEVOR irgendein Fetch ausgeloest wird -- siehe
    // isForbiddenJwksHost fuer den genauen Umfang/die Grenzen.
    if (isForbiddenJwksHost(agentUrlParsed.hostname)) {
      return { verdict: 'unsigned', agent: agentUrl };
    }

    const nowMs = options.now ?? Date.now();
    const evaluated = evaluateSignatureInputInternal(signatureInputHeader, nowMs);
    if (!evaluated.ok) {
      return { verdict: evaluated.verdict, agent: agentUrl };
    }
    const { entry } = evaluated;

    // Ed25519 ist per Briefing der einzige unterstuetzte Algorithmus --
    // "unbekannter alg" degradiert zu unsigned (Regel 6), nicht invalid.
    if (entry.alg !== 'ed25519') {
      return { verdict: 'unsigned', agent: agentUrl };
    }

    let signatureDict: SfDictionary;
    try {
      signatureDict = parseSfDictionary(signatureHeader);
    } catch {
      return { verdict: 'unsigned', agent: agentUrl };
    }
    const signatureItem = signatureDict.get(entry.label);
    if (!signatureItem || signatureItem.type !== 'binary') {
      return { verdict: 'unsigned', agent: agentUrl };
    }

    // Fix-Runde (Finding A): bare-origin Signature-Agent -> wohlbekannter
    // Pfad; Signature-Agent mit eigenem Pfad -> direkter jwks_uri-Fetch.
    // Der Cache wird unter der tatsaechlich gefetchten URL gefuehrt (nicht
    // unter agentUrl), agentUrl bleibt unveraendert die Identitaet fuer
    // Logging/Rate-Limit-Key (VerifyResult.agent).
    const jwksFetchUrl = resolveJwksFetchUrl(agentUrl, agentUrlParsed);
    const jwks = await resolveJwks(jwksFetchUrl, options.jwksResolver, nowMs);
    if (!jwks) return { verdict: 'unsigned', agent: agentUrl };

    const jwk = findJwkByKeyid(jwks, entry.keyid);
    if (!jwk || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || typeof jwk.x !== 'string') {
      return { verdict: 'unsigned', agent: agentUrl };
    }

    const base = buildSignatureBase(request, entry);
    const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: jwk.x } as any, format: 'jwk' });
    const ok = cryptoVerify(null, Buffer.from(base, 'utf8'), publicKey, signatureItem.value);

    return ok ? { verdict: 'verified', agent: agentUrl } : { verdict: 'invalid', agent: agentUrl };
  } catch {
    // Regel 6: JEDER unerwartete Fehler (Netz, Parsing, Krypto) -> unsigned.
    // Die Route darf durch dieses Modul nie fehlschlagen.
    return { verdict: 'unsigned' };
  }
}

/**
 * Rate-Limit-Key: verifizierter Agent (JWKS-URL) sonst erste IP aus
 * x-forwarded-for.
 *
 * Der linkeste x-forwarded-for-Wert ist clientseitig frei waehlbar (jeder
 * Client kann den Header selbst mitschicken; ohne einen vertrauenswuerdigen
 * Reverse-Proxy, der den Header VOR dem Weiterreichen ueberschreibt statt nur
 * anzuhaengen, ist das Feld nicht faelschungssicher). Das ist hier bewusst
 * akzeptiert: der Key steuert ausschliesslich, in welchen Rate-Limit-Eimer
 * eine Anfrage faellt -- er gewaehrt nie Zugriff und entscheidet nie ueber
 * das Verdikt selbst. Schlimmstenfalls waehlt sich ein Angreifer einen
 * eigenen Eimer (kein Vorteil) oder teilt sich einen Eimer mit einer echten
 * IP (fuehrt hoechstens zu einem frueheren 429 fuer beide, keinem Bypass).
 */
export function getRateLimitKey(result: VerifyResult, request: Request): string {
  if (result.verdict === 'verified' && result.agent) return result.agent;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstIp = forwardedFor ? forwardedFor.split(',')[0]?.trim() : '';
  return firstIp || 'unknown';
}

// ============================================================================
// Rate-Limit: In-Memory, pro Instanz, NICHT billing-grade
// ============================================================================
// Gleiches bewusst einfaches Muster wie die bestehende A2A-Quota
// (app/a2a/route.ts, usageCounters): ein Map<key, Fenster>, das bei
// Deploys/Cold-Starts zurueckgesetzt wird. Fuer echte Abrechnung waere ein
// persistenter Store (Vercel KV, Supabase, ...) noetig -- hier geht es nur
// darum, verifizierte Agenten von unsignierten zu differenzieren, nicht
// darum, harten Missbrauch abzurechnen.

export type RateLimitVerdict = WebBotAuthVerdict;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMITS: Record<RateLimitVerdict, number> = {
  unsigned: 30,
  invalid: 30, // invalid wird wie unsigned behandelt (Spec §4.4)
  verified: 120,
};
const RATE_LIMIT_MAX_KEYS = 10_000;

interface RateLimitWindow {
  windowStart: number;
  count: number;
}

const rateLimitStore = new Map<string, RateLimitWindow>();

function boundRateLimitStore(): void {
  if (rateLimitStore.size <= RATE_LIMIT_MAX_KEYS) return;
  const entries = [...rateLimitStore.entries()].sort((a, b) => a[1].windowStart - b[1].windowStart);
  const removeCount = entries.length - RATE_LIMIT_MAX_KEYS + Math.ceil(RATE_LIMIT_MAX_KEYS * 0.1);
  for (const [key] of entries.slice(0, removeCount)) rateLimitStore.delete(key);
}

/**
 * Fix-Runde (Finding B, Fetch-Amplification): gemeinsame Implementierung fuer
 * checkRateLimit (mutierend) und peekRateLimit (rein lesend). `mutate: false`
 * simuliert exakt dieselbe Grenzwert-Pruefung, schreibt aber nichts in den
 * Store -- damit lassen sich Anfragen VOR einer teuren/riskanten Operation
 * (hier: der JWKS-Fetch in verifyWebBotAuth) ablehnen, ohne den eigentlichen
 * Verbrauch schon zu verbuchen, bevor klar ist, gegen welchen Tier/Key final
 * abgerechnet werden muss (siehe Zwei-Phasen-Gate in app/api/mcp/route.ts
 * und app/a2a/route.ts: Phase A peekt gegen den IP-Key/unsigned-Tier, Phase C
 * belastet erst nach dem Verdikt den tatsaechlich zutreffenden Key/Tier --
 * "check-only dann einmal abrechnen", eine der zwei im Review vorgeschlagenen
 * Optionen, siehe Fix-Report Abschnitt "Finding B").
 */
function evaluateRateLimitWindow(
  key: string,
  verdict: RateLimitVerdict,
  cost: number,
  mutate: boolean,
): { allowed: boolean; retryAfterSeconds?: number; limit: number; remaining: number } {
  const limit = RATE_LIMITS[verdict] ?? RATE_LIMITS.unsigned;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  const windowFresh = !existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS;
  const entry: RateLimitWindow = windowFresh ? { windowStart: now, count: 0 } : existing;

  if (entry.count + cost > limit) {
    if (mutate) {
      rateLimitStore.set(key, entry);
      boundRateLimitStore();
    }
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds, limit, remaining: Math.max(0, limit - entry.count) };
  }

  if (mutate) {
    entry.count += cost;
    rateLimitStore.set(key, entry);
    boundRateLimitStore();
  }
  return { allowed: true, limit, remaining: Math.max(0, limit - entry.count) };
}

export function checkRateLimit(
  key: string,
  verdict: RateLimitVerdict,
  cost = 1,
): { allowed: boolean; retryAfterSeconds?: number; limit: number; remaining: number } {
  return evaluateRateLimitWindow(key, verdict, cost, true);
}

/**
 * Rein lesende Variante von checkRateLimit -- siehe Kommentar an
 * evaluateRateLimitWindow. Verbraucht kein Kontingent, nur zum Vorab-Pruefen
 * "wuerde diese Anfrage sowieso geblockt?", bevor eine potenziell teure
 * Operation ausgeloest wird.
 */
export function peekRateLimit(
  key: string,
  verdict: RateLimitVerdict,
  cost = 1,
): { allowed: boolean; retryAfterSeconds?: number } {
  return evaluateRateLimitWindow(key, verdict, cost, false);
}

// ============================================================================
// Test-only Exports (scripts/validate-agent-layer.ts)
// ============================================================================
// Bewusst als eigener Namensraum statt der internen Funktionen direkt, damit
// klar ist, dass dies Test-Infrastruktur ist, keine oeffentliche API des
// Moduls. Reine Funktionen (kein I/O), daher unproblematisch zu exportieren.

export const __internals = {
  parseSfDictionary,
  evaluateSignatureInput: evaluateSignatureInputInternal,
  buildSignatureBase,
  computeJwkThumbprint,
  resolveJwksFetchUrl,
  isForbiddenJwksHost,
  WELL_KNOWN_JWKS_PATH,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMITS,
};
