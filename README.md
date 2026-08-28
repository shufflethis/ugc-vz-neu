# UGC VZ

UGC VZ ist eine kostenlose Creator-Suche und Lead-Plattform für Brands. Das
Frontend, der Wissensbereich und alle produktiven API-Routen laufen auf Vercel.
Neon ist die kanonische Datenbank, Resend übernimmt transaktionale E-Mails.
WordPress, Tally und Airtable sind nicht Teil der produktiven Laufzeit.

## WebMCP — OpenAI WebMCP Challenge submission (English)

UGC VZ is a free directory of real, verified UGC creators in the DACH region.
Brands search for creators, pick the ones that fit, and UGC VZ forwards the
contact request — free of charge, no commission. Live at
**https://ugc-vz.de** (German UI; the agent tools speak German too, but any
agent can use them from an English conversation).

### What the WebMCP layer does

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
protocol binding, not a fork.

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

### Run locally

```bash
npm ci
cp .env.example .env.local   # search needs DATABASE_URL, see below
npm run build && npm start
```

The WebMCP layer itself needs no credentials — tools register on any page
load. Creator search hits the production database; without `DATABASE_URL`
the UI-driven flow still registers and responds, but search returns an
error. Validate the agent layer (including the WebMCP registry subset) with
`npm run validate:agent-layer`.

## Lokal starten

```bash
npm ci
npx vercel env pull .env.local --environment=development
npm run dev
```

Für reine Content- und UI-Arbeit genügt eine `.env.local` auf Basis von
`.env.example`. Creator-Suche, Registrierung und Exporte benötigen `DATABASE_URL`.

## Wichtige Befehle

```bash
npx tsc --noEmit
npm run build
npm run test:lead-email
npm run test:creator-registration
npm run test:creator-export
npm run test:private-creator-export
npm run db:audit
```

`content:export-wordpress` ist nur ein reproduzierbarer Migrationsnachweis. Der
Exporter ist kein Produktions-Sync und wird nach der Abschaltung des alten
Backends normalerweise nicht erneut ausgeführt.

## Architektur

- `app/`: Next.js App Router, statische Seiten und Server-Routen
- `content/wissen/`: versionierte Artikelquellen und Content-Manifeste
- `public/wp-content/uploads/`: lokal archivierte Medien mit stabilen Altpfaden
- `app/lib/content-repository.ts`: einzige Lesegrenze für Wissensinhalte
- `app/api/search`: Creator-Suche ausschließlich aus Neon
- `app/api/submit-request`: persistenter Lead, Resend-Versand und Slack-Status
- `app/api/creators/*`: Registrierung, Verifikation und geschützte Sheet-Exporte
- `middleware.ts`: 410 für entfernte Thin-Content-URLs und Alt-Host-Routing

Details stehen in [docs/content-architecture.md](docs/content-architecture.md),
[docs/brand-lead-automation.md](docs/brand-lead-automation.md) und
[docs/creator-database-migration.md](docs/creator-database-migration.md).

## Deployment

Das Repository ist mit dem Vercel-Projekt `trackys-projects-6c71603f/ugc-vz`
verknüpft. Änderungen zuerst als Preview prüfen und danach mit `vercel --prod`
veröffentlichen. Secrets bleiben ausschließlich in Vercel und in der
gitignorierten `.env.local`.
