# Entwicklung

Interne Notizen für die Arbeit am UGC-VZ-Repository. Der öffentliche Überblick
steht im [README](../README.md).

## Lokal starten

```bash
npm ci
npx vercel env pull .env.local --environment=development
npm run dev
```

Für reine Content- und UI-Arbeit genügt eine `.env.local` auf Basis von
`.env.example`. Creator-Suche, Registrierung und Exporte benötigen `DATABASE_URL`.
Die WebMCP-Schicht selbst braucht keine Credentials — die Tools registrieren
sich bei jedem Seitenaufruf. Agent-Layer validieren (inkl. WebMCP-Teilmenge):
`npm run validate:agent-layer`.

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
- `app/lib/agent-tools.ts`: **eine** Werkzeug-Registry für MCP, WebMCP, REST und A2A
- `app/api/mcp`: MCP-Server (Streamable HTTP, stateless, Web Bot Auth + Rate-Limits)
- `app/components/WebMcpProvider.tsx`: WebMCP-Site-Tools (`document.modelContext`)
- `content/wissen/`: versionierte Artikelquellen und Content-Manifeste
- `public/wp-content/uploads/`: lokal archivierte Medien mit stabilen Altpfaden
- `app/lib/content-repository.ts`: einzige Lesegrenze für Wissensinhalte
- `app/api/search`: Creator-Suche ausschließlich aus Neon
- `app/api/submit-request`: persistenter Lead, Resend-Versand und Slack-Status
- `app/api/creators/*`: Registrierung, Verifikation und geschützte Sheet-Exporte
- `middleware.ts`: 410 für entfernte Thin-Content-URLs und Alt-Host-Routing

Details stehen in [PROTOCOLS.md](../PROTOCOLS.md),
[docs/content-architecture.md](content-architecture.md),
[docs/brand-lead-automation.md](brand-lead-automation.md) und
[docs/creator-database-migration.md](creator-database-migration.md).

## Continuous Integration

Jeder Push und Pull Request auf `main` läuft durch
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (`tsc --noEmit`).
Das ersetzt den lokalen Typecheck, der auf dem VPS nicht zuverlässig läuft
(earlyoom beendet `tsc` und `next build`).

## Deployment

Das Repository ist mit dem Vercel-Projekt `trackys-projects-6c71603f/ugc-vz`
verknüpft. Änderungen zuerst als Preview prüfen und danach mit `vercel --prod`
veröffentlichen. Secrets bleiben ausschließlich in Vercel und in der
gitignorierten `.env.local`.
