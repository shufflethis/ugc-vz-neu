# UGC VZ

UGC VZ ist eine kostenlose Creator-Suche und Lead-Plattform für Brands. Das
Frontend, der Wissensbereich und alle produktiven API-Routen laufen auf Vercel.
Neon ist die kanonische Datenbank, Resend übernimmt transaktionale E-Mails.
WordPress, Tally und Airtable sind nicht Teil der produktiven Laufzeit.

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
