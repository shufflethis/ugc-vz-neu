#!/usr/bin/env bash
set -euo pipefail

# UGC VZ Go-Live Datenbank-Skript fuer Neon (ausfuehren hier auf dem VPS)
# Fuehrt idempotent aus:
#   1. SQL-Migrationen (inkl. 022 Pricing, 023 Taxonomie/Consent, 024 Payments/Wallets/DAC7, 025 View-Sync)
#   2. Neon Sicherheits- & PII-Audit
#   3. 20er-Kategorien-Klassifizierung fuer bestehende aktive Creator-Profile

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

if [[ ! -f ".env.local" ]]; then
  echo "Fehler: .env.local wurde in ${PROJECT_DIR} nicht gefunden." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ".env.local"
set +a

if [[ -z "${DATABASE_URL_UNPOOLED:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "Fehler: DATABASE_URL oder DATABASE_URL_UNPOOLED fehlt in .env.local." >&2
  exit 1
fi

echo "==> [1/3] Fuehre Neon SQL-Migrationen (001 bis 025) aus..."
npm run db:migrate

echo ""
echo "==> [2/3] Pruefe Datenbank- & PII-Invarianten (db:audit)..."
npm run db:audit

echo ""
echo "==> [3/3] Ordne bestehende aktive Creator den 20 Kategorien zu..."
node --import tsx scripts/migrate-creator-categories.mjs --apply

echo ""
echo "FERTIG: Neon-Migrationen (022-025), Audit und 20er-Kategorien sind live!"
