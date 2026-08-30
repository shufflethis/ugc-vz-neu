# UGC VZ — Agent-Native UGC Creator Directory (DACH): MCP, WebMCP, REST & A2A

[![MCP Registry](https://img.shields.io/badge/MCP_Registry-listed-6f2fa9)](https://registry.modelcontextprotocol.io/v0/servers?search=ugc-vz)
[![Transport](https://img.shields.io/badge/Transport-Streamable_HTTP-blue)](https://ugc-vz.de/developers)
[![WebMCP](https://img.shields.io/badge/WebMCP-6_site_tools-ff6d00)](https://ugc-vz.de/developers#webmcp)
[![npm](https://img.shields.io/badge/npm-ugc--vz--mcp-cb3837)](https://www.npmjs.com/package/ugc-vz-mcp)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen)](#status)
[![CI](https://github.com/shufflethis/ugc-vz-neu/actions/workflows/ci.yml/badge.svg)](https://github.com/shufflethis/ugc-vz-neu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[UGC VZ](https://ugc-vz.de)** is a free directory of **real, verified UGC
creators** in the German-speaking region (DACH) — portfolio and social proof,
no AI-avatar content. Brands search for free, review public profiles, and
deliberately request contact; UGC VZ delivers the creators' contact details by
e-mail and takes **no commission**. The entire directory is machine-readable:
agents like **Claude, ChatGPT, and Cursor** get the same data and logic through
four protocol bindings of one registry — MCP, WebMCP site tools, REST/OpenAPI,
and A2A. Free, no API key, no registration.

- **MCP endpoint:** `https://ugc-vz.de/api/mcp` (Streamable HTTP)
- **MCP registry:** [`de.ugc-vz/creator-search`](https://registry.modelcontextprotocol.io/v0/servers?search=ugc-vz) — also on [Glama](https://glama.ai/mcp/connectors/de.ugc-vz/creator-search) and [Smithery](https://smithery.ai/servers/ugc-vz/creator-search)
- **npm bridge:** [`ugc-vz-mcp`](https://www.npmjs.com/package/ugc-vz-mcp) (stdio ⇄ Streamable HTTP)
- **Web app:** [ugc-vz.de](https://ugc-vz.de) · **Developer portal:** [/developers](https://ugc-vz.de/developers)
- **Discovery:** [`/.well-known/mcp.json`](https://ugc-vz.de/.well-known/mcp.json) · [`/openapi.json`](https://ugc-vz.de/openapi.json) · [`/.well-known/agent-card.json`](https://ugc-vz.de/.well-known/agent-card.json) · [`/llms.txt`](https://ugc-vz.de/llms.txt)
- **Demo video (WebMCP):** [youtu.be/EtSpIT2LQn0](https://youtu.be/EtSpIT2LQn0)

> Search results and profiles **never contain private contact details**. A
> brand receives contact data by e-mail only after a deliberate outreach
> request — and in the browser, sending that request is reserved for a human
> click by design.

## Status

**Live.** The endpoint is up and serving all five tools:

```bash
curl -s https://ugc-vz.de/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Same registry (`app/lib/agent-tools.ts`), same pipeline as the
[web app](https://ugc-vz.de) — no separate implementation.

## Connect

**Claude Code** (one line):

```bash
claude mcp add --transport http ugc-vz https://ugc-vz.de/api/mcp
```

**Any client with an `mcpServers` block** (Cursor, Windsurf, VS Code, …):

```json
{
  "mcpServers": {
    "ugc-vz": {
      "type": "streamable-http",
      "url": "https://ugc-vz.de/api/mcp"
    }
  }
}
```

**stdio-only clients** (e.g. Claude Desktop) via the npm bridge:

```json
{
  "mcpServers": {
    "ugc-vz": {
      "command": "npx",
      "args": ["-y", "ugc-vz-mcp"]
    }
  }
}
```

**ChatGPT / OpenAI:** plain Streamable HTTP — works as a connector and inside
the Apps SDK (`https://ugc-vz.de/api/mcp`, no authentication).

## Tools (MCP server)

| Tool | What it does |
| --- | --- |
| `search_creators` | Free-text search over the directory (query, city, topics, verification level). A language model structures the query server-side. Read-only, never returns private contact data. |
| `get_creator` | Public profile by `creator_public_id`: topics, industries, equipment, portfolio links, social accounts, verification level. Read-only. |
| `request_outreach` | Triggers a **deliberate brand request** — UGC VZ e-mails the selected creators' contact details to the brand. Requires name, e-mail, creator IDs. Returns a `request_id`. Real e-mail, no test calls ([terms, §10](https://ugc-vz.de/agb)). |
| `get_outreach_status` | Lifecycle status of a request: `submitted` → `working` → `completed` / `failed`. Read-only. |
| `get_vocab` | Current vocabulary: topics, industries, cities, verification-level definitions, pricing note. Read-only. |

Typical flow: `search_creators` → `get_creator` → `request_outreach` →
`get_outreach_status`. All tools declare explicit
`readOnlyHint` / `openWorldHint` / `destructiveHint` annotations; per-tool JSON
schemas at `/api/agent-schemas/<tool>.json`.

## WebMCP — site tools in the browser

The homepage registers **6 tools** via `modelContext` (both
`document.modelContext` — used by ChatGPT site tools — and
`navigator.modelContext` — used by the Chromium prototype — are supported,
via `registerTool` or `provideContext`, including APIs injected after page
load):

| Tool | What it does |
| --- | --- |
| `search_creators` | Runs the search **through the real page UI**: the agent's query goes through the same pipeline a human uses, and the result cards appear on screen for both to see. Falls back to the REST API if the search UI is not mounted. |
| `select_creators` | Marks creators from the visible result in the page UI and opens the contact form pre-filled with that selection. |
| `get_creator` | Detail lookup by public creator ID (read-only). |
| `get_vocab` | Topics, cities, price bands, human-verification levels (read-only). |
| `get_outreach_status` | Status of a contact request by ID (read-only). |
| `get_last_outreach` | Returns the request ID of the contact request **the human** last submitted in this browser session (read-only). |

**Human-in-the-loop by design:** there is deliberately **no**
`request_outreach` tool in the browser. The agent searches and shortlists;
the final send — which triggers a real e-mail to real creators — stays a
human click in the form. After the human submits, `get_last_outreach` hands
the request ID back to the agent so it can track status. Read-only tools
carry `annotations.readOnlyHint` for the browser's safety review.

Tool names, descriptions and JSON schemas come from the same single source
(`app/lib/agent-tools.ts`) that already powers the site's MCP server
(`/api/mcp`), REST API (`/api/v1`) and A2A endpoint — WebMCP is a fourth
protocol binding, not a fork. A validation script asserts the WebMCP tool set
stays a strict subset of the registry — and that `request_outreach` is never
registered in the browser.

### How to test (judges)

1. Open **https://ugc-vz.de** in the ChatGPT desktop app's built-in browser
   (use GPT-5.6 Sol or Terra; site tools are disabled on Luna), or in Chrome
   149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Check the **Site tools** entry in the address bar — 6 tools should be
   listed.
3. Ask the agent e.g. *"Find me three beauty creators for TikTok product
   videos"* — the result cards appear on the page while the agent gets the
   structured result.
4. Ask it to select one or two — the cards get marked and the contact form
   opens. The agent cannot send it; that click is yours. (Submitting sends a
   real e-mail, so only submit if you mean it.)
5. No login, no credentials needed. The site is free to use.

Demo video: **[youtu.be/EtSpIT2LQn0](https://youtu.be/EtSpIT2LQn0)**

### Prior work vs. challenge work

UGC VZ existed before the submission period. Everything WebMCP was built
during the submission period — timestamped commit history:

- `15f4414` (2026-08-27) — WebMCP layer: 6 tools, UI-driven search/select,
  human-in-the-loop design (`app/components/WebMcpProvider.tsx`,
  `app/components/WebMcpAgentLayer.tsx`, event wiring in
  `app/components/SearchBox.tsx`, validation in
  `scripts/validate-agent-layer.ts`)
- `890e4fb` (2026-08-28) — `provideContext` fallback, retry for late-injected
  APIs, docs in `llms.txt`/`PROTOCOLS.md`
- `dbe83c9` (2026-08-28) — `document.modelContext` support (the object
  ChatGPT site tools actually provides), `readOnlyHint` annotations

Everything else in this repository (the directory itself, its MCP server,
REST API, A2A endpoint, content) is prior work and not part of the
challenge submission.

## FAQ

**Do I need an API key?**
No. All endpoints are public and rate-limited per IP.
[Web Bot Auth](https://web-bot-auth.org)-signed agents get higher limits.

**What does it cost?**
Nothing. Search, profiles, and outreach are free; UGC VZ takes no commission.

**Are the creators real people?**
Yes — real, verified creators with portfolio and social proof; no AI-avatar
content. Verification levels are documented in `get_vocab`.

**Can an agent get creator e-mail addresses?**
No endpoint ever returns private contact data. Contact details go to the
brand by e-mail, only after a deliberate `request_outreach` — and terms of
use apply ([AGB, §10](https://ugc-vz.de/agb)).

**Who runs this?**
[track by track GmbH](https://ugc-vz.de/impressum), Berlin — the team behind
the social media agency [famefact](https://famefact.com).
Privacy: [Datenschutzerklärung](https://ugc-vz.de/datenschutz) ·
[English summary](https://ugc-vz.de/privacy).

---

## Deutsch: UGC-Creator per KI-Agent finden und anfragen

**[UGC VZ](https://ugc-vz.de)** ist ein kostenloses Verzeichnis realer,
verifizierter UGC-Creator im deutschsprachigen Raum — mit Portfolio- und
Social-Nachweisen, ohne KI-Avatare, ohne Provision. Brands suchen kostenlos,
wählen bewusst aus und erhalten Kontaktdaten per E-Mail. Das komplette
Verzeichnis ist maschinenlesbar: MCP-Server, WebMCP-Site-Tools, REST-API und
A2A greifen auf dieselbe Registry zu.

**Status: live.** Endpunkt: `https://ugc-vz.de/api/mcp`

```bash
claude mcp add --transport http ugc-vz https://ugc-vz.de/api/mcp
```

Typischer Ablauf: `search_creators` → `get_creator` → `request_outreach` →
`get_outreach_status`. `request_outreach` löst einen **echten E-Mail-Versand**
aus — keine Testaufrufe; es gelten die [AGB (Ziffer 10)](https://ugc-vz.de/agb).
Alle Details im [Developer-Portal](https://ugc-vz.de/developers).

## Entwicklung

Setup, Befehle, Architektur und Deployment stehen in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Sicherheitslücken bitte gemäß
[SECURITY.md](SECURITY.md) an **hi@ugc-vz.de** melden — nicht über
öffentliche Issues.

---

**License:** MIT — see [LICENSE](LICENSE). Operated by track by track GmbH,
Berlin ([Impressum](https://ugc-vz.de/impressum)).
