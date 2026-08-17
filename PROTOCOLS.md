# Agent-Protokolle bei UGC VZ

Dieses Dokument beschreibt, wie externe Agenten (LLM-Clients, A2A-Bridges, generische
MCP-Hosts, Commerce-Agenten) programmatisch auf UGC VZ zugreifen können. Es beschreibt
ausschließlich, was tatsächlich implementiert und deployed ist – keine Roadmap, keine
Absichtserklärung.

## 1. Überblick und Kompatibilitätsversprechen

UGC VZ ist ein kostenloses Verzeichnis realer UGC-Creator im deutschsprachigen Raum mit
Portfolio- und Social-Nachweisen – kein KI-generierter Avatar-Content. Der Agent-Layer
macht denselben Kern (Creator-Suche, Profile, Kontaktanfrage), den Menschen im Frontend
nutzen, zusätzlich für Agenten erreichbar – über MCP, A2A und die bestehenden
REST-Endpunkte, parallel, auf demselben Datenmodell.

**Transportoffen, keine proprietären Erweiterungen.** Jedes Protokoll wird so
implementiert, wie ein generischer Client (ein x-beliebiger MCP-Host, eine A2A-zu-MCP-Bridge,
ein UCP-Discovery-Crawler) es versteht. Was ein generischer Client nicht kennt, kommt nicht
rein. Abweichungen von den jeweiligen Spezifikationen werden unten explizit benannt statt
stillschweigend als Konformität verkauft – das ist die Faktendisziplin, unter der dieser
Agent-Layer gebaut wurde.

**Additiv.** Die menschlichen Flows (Creator-Anmeldung, Brand-Suche und -Anfrage im
Frontend) sind durch den Agent-Layer unverändert. Agent-Routen konsumieren dieselben
internen Endpunkte (`/api/search`, `/api/submit-request`) bzw. lesen read-only aus denselben
Tabellen.

## 2. Protokoll-Versionen und Endpunkte

| Protokoll | Implementierte Spec-Version | Endpunkt |
|---|---|---|
| **MCP** | **2026-07-28** (nativ, via `mcp-handler@2.1.1` auf `@modelcontextprotocol/server@2`; automatischer Fallback auf die 2025er-Streamable-HTTP-Ära für ältere Clients wie 2025-11-25/2025-06-18) | `POST /api/mcp`. `GET`/`DELETE` beantworten `405` (Betrieb ist stateless, keine Sessions). |
| **A2A** | **1.0** (Linux Foundation, April 2026) | `POST /a2a` (JSON-RPC 2.0). Agent Card: `GET /a2a` bzw. `GET /.well-known/agent-card.json` (Alias: `/.well-known/agent.json`). |
| **UCP** | **2026-04-08** | `GET /.well-known/ucp` |
| **Web Bot Auth** | RFC 9421 (HTTP Message Signatures) + `draft-meunier-webbotauth-httpsig-protocol` – **kein von der IETF adoptierter Standard**, die zuständige Working Group wurde erst 2026 chartered | greift in `/api/mcp` und `/a2a` (nicht in der globalen Middleware, nicht in den Human-Flows) |
| **AP2** | nur Datenmodell-Vorbereitung (keine eigene Spec-Version im Einsatz) | – (siehe Abschnitt 6) |

### A2A: bewusste Abweichungen von der Card-Struktur der v1.0-Spezifikation

Die Agent Card (`app/lib/a2a-agent-card.ts`) ist gegen `specification/a2a.proto` im
`a2aproject/A2A`-Repo geprüft (die dort einzige normative Quelle). Drei additive
Abweichungen, dokumentiert statt verschwiegen:

- Ein Top-Level-`protocolVersion`-Feld existiert in der v1.0-Card laut Proto **nicht mehr**
  (ersetzt durch das geordnete `supportedInterfaces`-Array, dessen Einträge selbst
  `protocolVersion` tragen). Wir behalten das Top-Level-Feld zusätzlich als eigene,
  additive Erweiterung.
- `capabilities.stateTransitionHistory` ist kein Proto-Feld in v1.0. Bei uns steht es auf
  `false`, bis `lead_agent_events` eine echte Statushistorie liefert.
- `supportedInterfaces` ist laut Proto für verschiedene *A2A*-Protokollbindungen desselben
  Agenten gedacht (JSONRPC/GRPC/HTTP+JSON). Wir tragen dort zusätzlich einen Eintrag für
  `/api/mcp` mit `protocolBinding: 'MCP'` ein – ein anderes Protokoll, kein A2A-Binding.
  Das ist eine bewusste Zweckentfremdung des Feldes, keine Spec-Konformität.

## 3. Copy-Paste-Beispiele

### (a) MCP

Client-Konfiguration (funktioniert mit jedem MCP-Host, der Streamable HTTP direkt spricht):

```json
{
  "mcpServers": {
    "ugc-vz": {
      "url": "https://ugc-vz.de/api/mcp"
    }
  }
}
```

Handshake per curl (leer lassen reicht als Verbindungstest – Version-Negotiation läuft
automatisch; ein konformer 2026-07-28-Client baut sein eigenes `_meta`-Envelope und
verhandelt selbstständig):

```bash
curl -s -X POST https://ugc-vz.de/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2026-07-28","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'
```

Von Hand gebaute JSON-RPC-Bodies wie oben bringen kein `_meta`-Envelope mit, das ein
echter 2026-07-28-Client automatisch mitschickt – der Server verhandelt in diesem Fall auf
seinen höchsten Legacy-Wert herunter, die Antwort zeigt daher `"protocolVersion":"2025-11-25"`
statt `2026-07-28`. Das ist erwartetes Negotiation-Verhalten, kein Fehler; reale MCP-Clients
bauen dieses Envelope selbst und sprechen 2026-07-28 nativ.

Werkzeug-Aufruf per curl (`get_vocab` – kein Auth, keine Nebenwirkung, gut zum Testen):

```bash
curl -s -X POST https://ugc-vz.de/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_vocab","arguments":{}}}'
```

Der Endpunkt ist stateless – `tools/call` funktioniert auch ohne vorherigen
`initialize`-Handshake in derselben Verbindung, wie oben gezeigt.

Verfügbare Werkzeuge: `search_creators`, `get_creator`, `request_outreach`,
`get_outreach_status`, `get_vocab` (Definitionen inkl. Zod-Input-Schemas in
`app/lib/agent-tools.ts`). Server-Instructions (der eigentliche Prompt für aufrufende
Sprachmodelle):

> UGC VZ ist ein kostenloses Verzeichnis realer UGC-Creator (DACH) mit Portfolio- und
> Social-Nachweisen - kein KI-Avatar-Content. Brands suchen kostenlos, waehlen bewusst aus
> und erhalten Kontaktdaten per E-Mail; UGC VZ nimmt keine Provision. Typischer Ablauf:
> search_creators -> get_creator -> request_outreach -> get_outreach_status. get_vocab
> liefert Themen, Staedte und die Definition der human_verification-Stufen.

### (b) A2A

`ugc.submit_creator_request` ist Teil des **bezahlten** A2A-Zugangs (Starter 29 €/Monat für
10 Suchen, Pro 100 €/Monat unlimitiert – siehe `docs/a2a-agent-access.md`). Ohne gültigen
API-Key antwortet die Route mit `402`/`PAYMENT_REQUIRED` und den Checkout-URLs. `tasks/get`
dagegen ist frei zugänglich (siehe Datenschutzinvarianten, Abschnitt 7) – der zweite Aufruf
unten läuft ohne Key.

```bash
curl -s -X POST https://ugc-vz.de/a2a \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <A2A_API_KEY>' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"ugc.submit_creator_request",
    "params":{
      "creatorIds":["UGC-AB12CD34EF"],
      "clientInfo":{"name":"Brand Name","email":"marketing@example.com","message":"Kampagnenbriefing"}
    }
  }'
# -> result.task.id ist die taskId (= request_id, ein brand_leads.public_id)
```

```bash
curl -s -X POST https://ugc-vz.de/a2a \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tasks/get","params":{"taskId":"<taskId aus obigem Aufruf>"}}'
```

`ugc.submit_creator_request` legt einen echten Brand-Lead an; ist
`SEND_CREATOR_OUTREACH_EMAILS=true` gesetzt, geht eine echte Anfrage an die angegebenen
Creator. Zum Testen keine echten Creator-IDs/E-Mail-Adressen verwenden.

Methodennamen (JSON-RPC `method`), die die A2A-Route tatsächlich dispatcht – nicht
identisch mit den Skill-IDs der Agent Card:

| Skill-ID (Agent Card) | Dispatchbare Methode(n) |
|---|---|
| `creator_search` | `ugc.search_creators` (Aliase: `message/send`, `tasks/send`) |
| `creator_get` | `ugc.get_creator` **oder** `creator_get` (beide Namen funktionieren) |
| `outreach_request` | `ugc.submit_creator_request` |
| – | `tasks/get` (Alias: `ugc.get_outreach_status`) |
| – | `agent.card` (Alias: `agent/getCard`) |

Die Skill-IDs `creator_search` und `outreach_request` sind selbst **keine** aufrufbaren
Methodennamen – nur die in der Tabelle rechts genannten `method`-Werte werden vom Handler
erkannt.

### (c) UCP

```bash
curl -s https://ugc-vz.de/.well-known/ucp
```

Liefert ein Manifest mit verschachteltem `ucp.version: "2026-04-08"`, reverse-domain-
verschlüsselten Registries `ucp.services`/`ucp.capabilities`/`ucp.payment_handlers` unter dem
Namensraum `de.ugc-vz.*` (kein eigener `dev.ucp.*`-Namensraum, da wir keine der
UCP-Kern-Capabilities Checkout/Cart/Catalog/Order/Identity-Linking implementieren), sowie
den additiven Feldern `organization` und `commerce`. Checkout wird explizit als nicht
unterstützt deklariert:

```json
"commerce": {
  "checkout": {
    "supported": false,
    "reason": "Vermittlung von Dienstleistungen; Vertrag und Zahlung laufen direkt zwischen Brand und Creator."
  }
}
```

Die Capability-Schemas (`ucp.capabilities.*[].schema`) verweisen auf
`GET /api/agent-schemas/<name>.json` (siehe Abschnitt 4).

## 4. Schema-Endpunkte

`GET /api/agent-schemas/<name>.json` liefert je Operation das JSON-Schema, das direkt aus
dem zugehörigen Zod-Schema in `app/lib/agent-tools.ts` abgeleitet ist (`draft-2020-12`,
Content-Type `application/schema+json`) – dieselbe Quelle, aus der auch die MCP-Tool-
`inputSchema`s beim `tools/list`-Handshake generiert werden. MCP-Inputs und UCP-/Skill-
Schemas können dadurch nicht auseinanderlaufen.

Verfügbare Namen: `search_creators`, `get_creator`, `request_outreach`,
`get_outreach_status`, `get_vocab`.

## 5. `human_verification` – abgeleitet, nicht behauptet

Es gibt keinen Identitätsprüfprozess, und keiner wird behauptet. Die Stufe wird zur
Laufzeit aus vorhandenen Profildaten abgeleitet (`app/lib/agent-verification.ts`,
`VERIFICATION_LEVELS`, wörtlich):

| Level | Name | Kriterium |
|---|---|---|
| 0 | `self_reported` | Profil vorhanden; Angaben stammen vom Creator selbst. |
| 1 | `self_reported_with_portfolio` | Mindestens ein Portfolio-Link UND mindestens ein Social-Link am Profil hinterlegt. |
| 2 | `identity_verified` | Reserviert. Es existiert derzeit kein Identitaetspruefprozess; diese Stufe wird nicht vergeben. |

**Level 2 wird nicht vergeben.** Es gibt keine Migration, kein DB-Feld dafür – ändert sich
die Datenlage eines Profils, ändert sich die abgeleitete Stufe automatisch beim nächsten
Aufruf. `search_creators`/`get_creator` akzeptieren `human_verification_level_min` im
Bereich 0–2, aber ein Filter auf 2 liefert derzeit grundsätzlich keine Treffer. `get_vocab`
gibt dieselbe Definition zurück.

## 6. Rate-Limits und Web Bot Auth

### Web Bot Auth (Trust-Layer, `app/lib/web-bot-auth.ts`)

Geprüft werden, **wo vorhanden**, HTTP Message Signatures nach RFC 9421 in Kombination mit
`draft-meunier-webbotauth-httpsig-protocol`, mit Ed25519 als einzigem unterstützten
Algorithmus. Benötigte Header:

- `Signature-Agent`: HTTPS-URL, die den Agenten identifiziert. Ist die URL ein bare Origin
  (kein eigener Pfad), wird der wohlbekannte Pfad
  `/.well-known/http-message-signatures-directory` an diesem Origin als JWKS-Directory
  gefetcht; hat die URL bereits einen eigenen Pfad, wird sie direkt als JWKS-Dokument-URL
  verwendet.
- `Signature-Input`: RFC-8941-Dictionary mit `tag="web-bot-auth"`, `keyid`
  (base64url-JWK-SHA-256-Thumbprint), `created`/`expires`, mindestens `@authority` oder
  `@target-uri` als abgedeckte Komponente.
- `Signature`: die eigentliche Ed25519-Signatur über die nach RFC 9421 §2.5 aufgebaute
  Signature-Base.

Verdikt ist immer eines von `verified | invalid | unsigned`. **Verifikationsfehler blockieren
niemals eine Anfrage** – fehlende/kaputte Header, abgelaufene/fehlerhafte Signatur, nicht
erreichbares oder ungültiges JWKS, unbekannter Algorithmus, verbotener Host
(IP-Literal/localhost) als `Signature-Agent`, jeder unerwartete Fehler: alles degradiert
höchstens zu `unsigned`. Ein unsignierter Client funktioniert unverändert weiter, nur mit
dem niedrigeren Rate-Limit-Tier.

### Rate-Limits

In-Memory pro Server-Instanz, **nicht billing-grade** – setzt sich bei jedem Vercel-Deploy
und Cold-Start zurück. Fenster: 10 Minuten.

| Verdikt | Limit pro 10-Minuten-Fenster |
|---|---|
| `unsigned` | 30 |
| `invalid` | 30 (wird wie `unsigned` behandelt) |
| `verified` | 120 |

Such-Operationen kosten 3 (MCP: `search_creators`; A2A: `ugc.search_creators` und dessen
Aliase `message/send`/`tasks/send`), alle anderen Operationen kosten 1. Bei Überschreitung
antwortet die Route mit HTTP `429` und einem JSON-RPC-förmigen Fehlerkörper (`code: -32029`)
inkl. `Retry-After`.

`/api/mcp` ist für alle Aufrufer frei zugänglich – hier bestimmt ausschließlich das
Web-Bot-Auth-Verdikt das Rate-Limit-Tier. `/a2a` hat zusätzlich eine eigene, unabhängige
Zugangskontrolle: `ugc.search_creators` und `ugc.submit_creator_request` erfordern einen
bezahlten API-Key (Starter/Pro, siehe `docs/a2a-agent-access.md`); bezahlte Keys haben ihre
eigene monatliche Quota und werden vom Web-Bot-Auth-Rate-Limit **nicht** zusätzlich
gedrosselt (nur ein rein lesender Vor-Check gegen den unsigned-Tier läuft für jede Anfrage,
als SSRF-Schutz vor einem möglichen JWKS-Fetch – kein zusätzliches Limit für bezahlte Keys).
`tasks/get`, `ugc.get_creator`/`creator_get` und `agent.card` benötigen keinen API-Key.

## 7. Bewusst nicht implementiert

- **ACP-Feed.** Der ACP-„Feed" ist kein gehosteter Discovery-Endpunkt, sondern eine
  `jsonl.gz`-Datei zur Einreichung bei OpenAI, gebaut für physische Produkte mit Preis,
  Verfügbarkeit und Checkout-Flags. Creator-Dienstleistungen ohne Checkout passen nicht
  durch die Feed-Validierung; die Bedingung „optional, nur wenn Aufwand klein" ist damit
  nicht erfüllt. ChatGPT-Discovery für Nicht-Retail-Angebote wie dieses läuft stattdessen
  über MCP.
- **AP2-Mandates – nur Datenmodell.** `brand_leads` trägt zusätzlich `brief_hash` (SHA-256
  über die kanonische JSON-Repräsentation von Brief und Creator-Auswahl) und
  `agent_request_id` (protokoll-präfigiert, z. B. `mcp_…`/`a2a_…`). Die neue,
  append-only Tabelle `lead_agent_events` protokolliert Brief und beobachtete
  Statusübergänge unveränderlich (kein UPDATE-/DELETE-Pfad im Code). Es gibt **keine**
  Payment-Integration und **keine** Mandate-Implementierung – die Felder machen ein
  späteres Anhängen von AP2-Mandates möglich, mehr nicht.
- **Signierte Agent Cards.** In A2A v1.0 optional; hier nicht implementiert. Die Card unter
  `/.well-known/agent-card.json` wird unsigniert ausgeliefert.

## 8. Datenschutz-Invarianten

1. **Keine privaten Kontaktdaten in Agent-Antworten.** Die Tabelle `creator_private_contacts`
   wird von keiner Gateway-Operation (`searchCreators`, `getCreator`, `requestOutreach`,
   `getOutreachStatus`, `getVocab`) gelesen. Kontaktdaten fließen ausschließlich über den
   bestehenden Outreach-E-Mail-Flow nach einer bewussten Anfrage.
2. **Outreach bleibt gated.** `request_outreach`/`ugc.submit_creator_request` laufen intern
   über denselben `/api/submit-request`-Endpunkt und dieselbe
   `SEND_CREATOR_OUTREACH_EMAILS`-Schranke wie der Human-Flow im Frontend – der Agent-Layer
   öffnet keinen zweiten Versandpfad.
3. **`get_outreach_status`/`tasks/get` geben keine Inhalte zurück** – nur Statuswert
   (`submitted`/`working`/`completed`/`failed`) und Zeitstempel. Ein fremder Agent mit
   erratener `request_id` erfährt nichts über Brand oder Creator. `request_id`s sind die
   bestehenden, nicht-sequenziellen `brand_leads.public_id`s.
4. Web-Bot-Auth-Fehler (kaputtes JWKS, Timeout, ungültige Signatur) degradieren immer zu
   `unsigned`, nie zu einem Ausfall der Route (siehe Abschnitt 6).
