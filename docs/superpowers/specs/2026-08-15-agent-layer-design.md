# Agent-Layer: Protokoll-Konformität (MCP, A2A v1.0, UCP, Web Bot Auth, AP2-Vorbereitung)

**Datum:** 2026-08-15
**Status:** Entwurf zur Freigabe
**Ziel:** ugc-vz.de als eigenständigen, standardkonformen Player im Agentic-Commerce-Stack aufstellen. Generische Agenten und Bridges Dritter konsumieren das Verzeichnis ohne Sonderbehandlung — über MCP, A2A und REST parallel auf demselben Kern.

## 0. Unverhandelbare Rahmenbedingungen

- **Additiv.** Die Human-Flows (Creator-Anmeldung, Brand-Suche, Kampagnen-Anfrage im Frontend) bleiben unangetastet. Kein Refactoring bestehender User-Flows.
- **Transportoffen, keine proprietären Erweiterungen.** REST, MCP und A2A liegen parallel über demselben Kern. Was ein generischer MCP-Client oder eine A2A-zu-MCP-Bridge nicht versteht, kommt nicht rein.
- **Faktendisziplin.** Der Agent-Layer behauptet nichts, was die Plattform nicht hält. Das betrifft insbesondere die Verifikationsstufen (§ 5) und die Human-Only-Beschreibungen.
- **Kein lokaler Build.** `next build`/`tsc` sterben auf diesem VPS (earlyoom). Verifikation über tsx-Skripte lokal plus Vercel-Preview-Build vor jedem Merge nach main, Live-Prüfung danach — wie bei den Vergleichsseiten.

## 1. Verifizierte Spec-Versionen (Stand 15.08.2026)

| Protokoll | Version | Kernpunkte für uns |
|---|---|---|
| MCP | **2026-07-28** | Stateless Streamable HTTP, `Mcp-Method`-Header pro Request, `ttlMs`/`cacheScope` auf Listen-Antworten, Versionsverhandlung mit älteren Clients |
| A2A | **v1.0** (April 2026, Linux Foundation) | Agent Card v1, Task-Lifecycle (`submitted → working → completed/failed`), JSON-RPC 2.0 Binding; signierte Cards optional |
| UCP | **2026-04-08** | Manifest unter `/.well-known/ucp` mit `ucp_version`, Organisation, `primary_capability`, Capabilities-Array mit JSON-Schema-URLs, Pflicht-Transporte REST/MCP/A2A |
| Web Bot Auth | IETF-WG chartered 2026, **kein adopted draft** | RFC 9421 HTTP Message Signatures, Ed25519, `Signature-Agent`-Header, JWKS-Directory des Agenten |
| AP2 | nur Datenmodell-Vorbereitung | Mandates (Intent/Cart/Payment) brauchen eindeutige IDs, unveränderliche Logs, Hash-Felder |

**ACP wird bewusst nicht implementiert.** Der ACP-„Feed" ist kein gehosteter Discovery-Endpunkt, sondern eine jsonl.gz-Datei zur Einreichung bei OpenAI, gebaut für physische Produkte mit Preis, Verfügbarkeit und Checkout-Flags. Creator-Dienstleistungen ohne Checkout passen nicht durch die Feed-Validierung; die Bedingung „optional, nur wenn Aufwand klein" ist nicht erfüllt. ChatGPT-Discovery läuft für Nicht-Retail über MCP. Begründung wird in PROTOCOLS.md festgehalten.

## 2. Ausgangslage im Repo

Vorhanden und wiederverwendbar:

- `app/a2a/route.ts` (387 Z.): JSON-RPC-Endpunkt mit `ugc.search_creators` und `ugc.submit_creator_request`; ruft intern `POST /api/search` und `POST /api/submit-request` per Fetch auf; In-Memory-Quota (dokumentiert als „nicht billing-grade").
- `app/lib/a2a-agent-card.ts` (151 Z.): Agent Card `protocolVersion: '0.3.0'` mit Preisplänen (Starter 29 €/10 Suchen, Pro 100 €/unlimitiert), ausgeliefert unter `/.well-known/agent-card.json` und `/.well-known/agent.json`.
- `brand_leads` (Migration 001) mit `status text NOT NULL DEFAULT 'submitted'`, `lead_creator_matches` mit `creator_snapshot jsonb`, `email_events` mit `audience`/`event_type` pro Lead.
- `docs/a2a-agent-access.md` als bestehende Doku.

Entscheidung dazu (Nutzer-Antworten vom 15.08.): Der Agent-Layer baut **auf dem bestehenden Kern** auf (LLM-Suche + Lead-Flow), keine vorgelagerte strukturierte Filter-API. Die neuen MCP-Tools sind **erstmal frei mit Rate-Limit**; die vorbereiteten Bezahlpläne bleiben unverändert bestehen und gelten weiter für den bestehenden A2A-Bezahlpfad.

## 3. Architektur: gemeinsamer Kern, dünne Transporte

```
            MCP (/api/mcp)      A2A (/a2a)        REST (bestehend)
                 \                  |                  /
                  \                 |                 /
                   +--- app/lib/agent-gateway.ts ---+
                        searchCreators()
                        getCreator()
                        requestOutreach()
                        getOutreachStatus()
                        getVocab()
                                |
              bestehende Flows: /api/search, /api/submit-request,
              Neon-Tabellen (creator_profiles, brand_leads, ...)
```

`agent-gateway.ts` formalisiert das Muster, das die A2A-Route heute schon lebt: interne Aufrufe der bestehenden Endpunkte bzw. direkte, rein lesende DB-Zugriffe. Die Transporte serialisieren nur noch. Ein Fehler im Gateway kann die Human-Flows nicht brechen, weil er sie nur konsumiert.

### 3.1 Die fünf Operationen

| Operation | Quelle | Anmerkungen |
|---|---|---|
| `searchCreators({ query, maxResults?, humanVerificationLevelMin?, city?, topics? })` | intern `POST /api/search` | Freitext-Query ist der Hauptpfad (LLM-Suche). `city`/`topics` filtern das Ergebnis nach; `humanVerificationLevelMin` filtert über die abgeleitete Stufe (§ 5). Keine privaten Kontaktdaten im Ergebnis. |
| `getCreator(publicId)` | direkte Lese-Query auf `creator_profiles` + `creator_social_accounts` + `creator_portfolio_items` | Voller öffentlicher Datensatz; private Kontakte (`creator_private_contacts`) sind strukturell ausgeschlossen — die Tabelle wird nicht angefasst. |
| `requestOutreach({ creatorPublicIds, brand: { name, email, message, searchQuery } })` | intern `POST /api/submit-request` | Gibt `request_id` (= `brand_leads.public_id`) zurück. Gleiche Pflichtfelder wie der Human-Flow: bewusste Auswahl, Name, E-Mail. |
| `getOutreachStatus(requestId)` | Lese-Query auf `brand_leads` + `email_events` | Lifecycle-Mapping siehe § 6. |
| `getVocab()` | Lese-Query (distinct `topics`, `industries`, `city`) + statisches Vokabular | Enthält auch die Definition der Verifikationsstufen. `ttlMs`-Caching (MCP) bzw. Cache-Header (REST). |

## 4. Die Transporte

### 4.1 MCP-Server (Priorität 1)

- **Endpunkt:** `POST /api/mcp` (Streamable HTTP), Node-Runtime, Spec **2026-07-28** via offizielles `@modelcontextprotocol/sdk` (aktuelle Version zum Implementierungszeitpunkt prüfen). Versionsverhandlung des SDK deckt ältere Clients (2025-06-18, 2025-03-26) ab.
- **Tools:** `search_creators`, `get_creator`, `request_outreach`, `get_outreach_status`, `get_vocab` — 1:1 auf die Gateway-Operationen, Zod-Schemas für Inputs.
- **Descriptions sind der Prompt.** Jede Tool-Description erklärt: was das Tool liefert, was es nicht liefert (keine privaten Kontaktdaten vor bewusster Anfrage), wann welches Tool zu wählen ist, und Beispielaufrufe. Die Server-Description trägt den Human-Only-USP in der belegbaren Form: „Verzeichnis realer Creator-Profile mit Portfolio- und Social-Nachweisen; kein KI-generierter Avatar-Content" — nicht mehr.
- **Fehlerbild:** Tool-Errors als MCP-Fehlerobjekte mit klaren, agentenlesbaren Meldungen (z. B. Rate-Limit mit `retryAfter`).

### 4.2 A2A v1.0 (Priorität 2)

- **Card-Upgrade** auf `protocolVersion: '1.0'` in `a2a-agent-card.ts`; Skills neu geschnitten: `creator_search`, `creator_get`, `outreach_request` (die bestehenden `ugc.*`-Methodennamen bleiben als Aliasse im Handler — kein Bruch für bestehende Konsumenten).
- **Task-Lifecycle:** `outreach_request` legt einen Task an, dessen `taskId` = `request_id`. Neue Methode `tasks/get` liefert den Status nach Mapping § 6. Die Card annonciert `stateTransitionHistory: true` erst, wenn `lead_agent_events` (§ 7) die Historie wirklich liefert — bis dahin bleibt sie `false`.
- **Kein Signing in Phase 1:** signierte Agent Cards sind in v1.0 optional; wir dokumentieren das in PROTOCOLS.md als bewusst offen.

### 4.3 UCP (Priorität 2)

- **Endpunkt:** `GET /.well-known/ucp` (Route Handler wie die bestehenden well-known-Routen), `ucp_version: '2026-04-08'`.
- **Modellierung:** Wir verkaufen keine Produkte. `primary_capability` ist Service-Discovery/Vermittlung; Creator-Vermittlung als Service-Angebot mit `price_range` („kostenlos für Brands; Creator-Honorare individuell, Richtwerte aus `rate_text`"). **Checkout-Capabilities explizit als nicht unterstützt deklariert**, mit Verweis auf den Outreach-Flow (REST/MCP/A2A). Transporte: alle drei, mit URLs.
- Capabilities-Einträge mit Name, Version und JSON-Schema-URL; die Schemas liegen unter `/api/agent-schemas/<name>.json` (statisch generiert aus den Zod-Schemas, damit MCP-Inputs und UCP-Schemas nicht divergieren).

### 4.4 Web Bot Auth / Trust Layer

- Modul `app/lib/web-bot-auth.ts`: prüft, **wo vorhanden**, RFC-9421-Signaturen (`Signature-Agent`, `Signature-Input`, `Signature`; Ed25519 über `node:crypto`), holt das JWKS des Agenten mit In-Memory-Cache (TTL ~1 h), verifiziert `created`/`expires`/`tag="web-bot-auth"`.
- Ergebnis ist ein Verdikt `verified | invalid | unsigned`, das geloggt wird (`agent_request_log`-Eintrag in `lead_agent_events`-Manier oder Console-Log + Vercel-Logs in Phase 1 — Entscheidung im Plan).
- **Differenzieren, nie blockieren:** verifizierte Agenten bekommen das höhere Rate-Limit-Tier, `invalid` wird wie `unsigned` behandelt (plus Log). Angewendet in den Agent-Routen (`/api/mcp`, `/a2a`), nicht in der globalen Middleware — die Human-Flows bleiben unberührt.
- Rate-Limits: In-Memory pro Instanz (gleiches bewusst einfaches Muster wie die bestehende A2A-Quota, gleiche Ehrlichkeit in der Doku: nicht billing-grade). Vorschlag: unsigned 30 Requests/10 min, verified 120/10 min; `search` zählt stärker als Lese-Operationen.

### 4.5 AP2-Vorbereitung (nur Datenmodell)

Migration `005_agent_layer.sql`:

- `brand_leads` + `brief_hash text` (SHA-256 über die kanonische JSON-Repräsentation von Brief + Creator-Auswahl, beim Anlegen berechnet) und `agent_request_id text` (gesetzt, wenn der Lead über den Agent-Layer kam; trägt Protokoll-Präfix, z. B. `mcp_…`/`a2a_…`).
- Neue append-only Tabelle `lead_agent_events (id uuid, lead_id uuid FK, event_type text, payload jsonb, payload_hash text, occurred_at timestamptz)` — unveränderliches Log von Brief und Statusübergängen. Kein UPDATE/DELETE-Pfad im Code.
- Keine Payment-Integration, keine Mandate-Implementierung. Die Felder machen späteres Anhängen von AP2-Mandates möglich, mehr nicht.

## 5. `human_verification_level` — abgeleitet, nicht behauptet

Es gibt keinen Identitätsprüfprozess, und wir erfinden keinen. Die Stufe wird zur Laufzeit aus vorhandenen Daten abgeleitet:

| Level | Name | Kriterium (belegbar) |
|---|---|---|
| 0 | `self_reported` | Profil vorhanden |
| 1 | `self_reported_with_portfolio` | ≥ 1 Portfolio-Link **und** ≥ 1 Social-Link am Profil |
| 2 | `identity_verified` | **wird derzeit nicht vergeben** — im Vokabular als „reserved, not yet issued" dokumentiert |

`human_verification_level_min` filtert auf diese Ableitung. `getVocab()` und PROTOCOLS.md dokumentieren die Kriterien wörtlich, damit kein Agent aus Level 1 mehr liest, als es bedeutet. Kein DB-Feld, keine Migration — ändert sich die Datenlage, ändert sich die Stufe automatisch.

## 6. Outreach-Task-Lifecycle

Mapping auf vorhandene Persistenz (kein neuer Zustandsautomat):

| A2A/MCP-Status | Quelle |
|---|---|
| `submitted` | `brand_leads`-Zeile existiert (Status-Spalte `'submitted'`) |
| `working` | `email_events` mit `lead_id` vorhanden, aber Brand-Dossier-Zustellung noch nicht bestätigt |
| `completed` | `email_events` enthält das Zustell-/Versandereignis der Brand-Mail (`audience='brand'`, Send/Delivery-Event) |
| `failed` | `email_events` enthält Bounce/Reject für die Brand-Mail, oder Lead älter als 48 h ohne Versandereignis |

Die exakten `event_type`-Werte werden im Plan gegen den Resend-Webhook-Code (`app/api/webhooks/resend/route.ts`) verifiziert — die Spec legt nur fest: **Status wird abgeleitet, nicht dupliziert.** Jeder Statuswechsel, den der Agent-Layer beobachtet, wird zusätzlich als `lead_agent_events`-Eintrag festgehalten (§ 4.5), womit `stateTransitionHistory` später ehrlich wird.

## 7. Sicherheits- und Datenschutzinvarianten

Unverändert aus der Plattform übernommen, hier explizit, weil der Reviewer sie prüfen soll:

1. **Keine privaten Kontaktdaten in Agent-Antworten.** `creator_private_contacts` wird von keiner Gateway-Operation gelesen. Kontaktdaten fließen ausschließlich über den bestehenden Outreach-E-Mail-Flow nach bewusster Anfrage.
2. **Outreach bleibt gated:** gleiche Pflichtfelder und gleiche `SEND_CREATOR_OUTREACH_EMAILS`-Schranke wie im Human-Flow; der Agent-Layer öffnet keinen zweiten Versandpfad.
3. **`getOutreachStatus` gibt keine Inhalte zurück**, nur Statuswerte und Zeitstempel — ein fremder Agent mit erratener `request_id` erfährt nichts über Brand oder Creator. `request_id`s sind die bestehenden nicht-sequenziellen `public_id`s.
4. Web-Bot-Auth-Fehler (kaputtes JWKS, Timeout) degradieren zu `unsigned`, nie zu einem Ausfall der Route.

## 8. PROTOCOLS.md (Deliverable)

Im Repo-Root: je Protokoll die implementierte Spec-Version, Endpunkt-Übersicht, ein Copy-Paste-Beispiel (MCP-Client-Konfig für Claude/generische Clients, A2A-Task per curl, UCP-Manifest-Abruf), die ACP-Nichtimplementierung mit Begründung, die Web-Bot-Auth-Tiers und die Verifikationsstufen-Definition. `llms.txt` erhält einen Verweis auf PROTOCOLS.md und `/api/mcp`.

## 9. Verifikation (VPS-Realität)

- Lokal: tsx-Skript `scripts/validate-agent-layer.ts` — MCP `initialize`/`tools/list`/`tools/call` gegen den lokalen Handler (ohne next build, direkte Handler-Aufrufe), UCP-Manifest gegen JSON-Schema, Lifecycle-Mapping mit Fixture-Daten, Vocab-Ableitung der Verifikationsstufen.
- Vercel-Preview-Build vor jedem Merge nach main (Typecheck-Ersatz).
- Live nach Deploy: `initialize`-Handshake gegen `https://ugc-vz.de/api/mcp` per curl, `/.well-known/ucp` und `agent-card.json` abrufen, ein `tasks/get` gegen einen Test-Lead.

## 10. Nicht in diesem Vorhaben

- ACP-Feed (Begründung § 1)
- AP2-Mandates-Implementierung, jegliche Payment-Logik
- Signierte A2A-Agent-Cards
- Persistentes, billing-fähiges Rate-Limiting (bleibt In-Memory wie bisher, ehrlich dokumentiert)
- Refactoring von `/api/search` oder `/api/submit-request`
- Monetarisierungs-Änderungen an den bestehenden A2A-Plänen
