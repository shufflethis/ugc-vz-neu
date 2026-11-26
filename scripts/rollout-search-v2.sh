#!/usr/bin/env bash
# Einmaliges Rollout-Skript fuer Search v2 + KI-Social-Profiler (Phasen 1-3).
#
# Fuehrt der Reihe nach aus:
#   1. .env.local laden & Pflicht-Variablen pruefen
#   2. Neon-Migrationen (020 + 021) ausfuehren + DB-Audit pruefen
#   3. Hybrid-Suchindex (German tsvector + Embeddings) fuer alle aktiven Creator befuellen
#   4. Ersten Test-Lauf der KI-Kanalanalyse (5 Profile) ausfuehren
#   5. Idempotenten VPS-Cron (alle 2 Std., flock, ~/logs/ugc-vz-ai-analyzer.log) einrichten
#   6. Optional mit --push: lokale Commits auf origin/main pushen (loest Vercel-Deploy aus)
#   7. Abschluss-Status aus der DB anzeigen
#
# Aufruf:
#   ./scripts/rollout-search-v2.sh
#   ./scripts/rollout-search-v2.sh --push
#   ./scripts/rollout-search-v2.sh --analyze-limit=10 --no-cron
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

DO_PUSH=false
INSTALL_CRON=true
ANALYZE_LIMIT=5
BACKFILL_LIMIT=1500
BATCH_SIZE=25

for arg in "$@"; do
  case "$arg" in
    --push) DO_PUSH=true ;;
    --no-cron) INSTALL_CRON=false ;;
    --analyze-limit=*) ANALYZE_LIMIT="${arg#*=}" ;;
    --backfill-limit=*) BACKFILL_LIMIT="${arg#*=}" ;;
    --batch-size=*) BATCH_SIZE="${arg#*=}" ;;
    -h|--help)
      sed -n '2,17p' "$0"
      exit 0
      ;;
    *)
      echo "Unbekannte Option: $arg" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$HOME/logs"
LOG_FILE="$HOME/logs/ugc-vz-rollout-search-v2-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "================================================================"
echo "UGC VZ Rollout: Search v2 + Hybrid-Index + KI-Social-Profiler"
echo "Start: $(date -Iseconds)"
echo "Log:   $LOG_FILE"
echo "================================================================"

echo ""
echo "[1/6] Lade .env.local & pruefe Umgebung..."
if [ ! -f .env.local ]; then
  echo "FEHLER: .env.local nicht gefunden in $REPO_DIR" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
. .env.local
set +a

: "${DATABASE_URL:?FEHLER: DATABASE_URL fehlt in .env.local}"
: "${OPENROUTER_API_KEY:?FEHLER: OPENROUTER_API_KEY fehlt in .env.local}"
NODE_BIN="$(command -v node)"
echo "  OK: Node $($NODE_BIN -v), DATABASE_URL und OPENROUTER_API_KEY gesetzt."

echo ""
echo "[2/6] Fuehre Neon-Migrationen (020 + 021) und DB-Audit aus..."
npm run db:migrate
npm run db:audit

echo ""
echo "[3/6] Befuelle Hybrid-Suchindex (tsvector + Embeddings, limit=$BACKFILL_LIMIT, batch=$BATCH_SIZE)..."
npm run db:backfill-embeddings -- --limit="$BACKFILL_LIMIT" --batch-size="$BATCH_SIZE"

echo ""
echo "[4/6] Starte ersten Smoke-Lauf des KI-Social-Profilers (limit=$ANALYZE_LIMIT)..."
if [ "$ANALYZE_LIMIT" -gt 0 ]; then
  # Setze eventuelle alte 401/429-Fehlversuche auf pending zurueck, damit sie direkt neu laufen.
  "$NODE_BIN" -e '
const { neon } = require("@neondatabase/serverless");
(async () => {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  await sql.query("UPDATE creator_ai_profiles SET status = '\''pending'\'', fail_count = 0, last_error = NULL WHERE status = '\''failed'\'' AND (last_error LIKE '\''%401%'\'' OR last_error LIKE '\''%429%'\'')");
})();
'
  "$REPO_DIR/scripts/analyze-creator-socials.sh" --limit="$ANALYZE_LIMIT"
else
  echo "  Uebersprungen (--analyze-limit=0)."
fi

echo ""
echo "[5/6] Richte VPS-Cron fuer scripts/analyze-creator-socials.sh ein..."
if [ "$INSTALL_CRON" = true ]; then
  CRON_MARKER="# ugc-vz-ai-analyzer"
  CRON_CMD="0 */2 * * * /usr/bin/flock -n /tmp/ugc-vz-ai-analyzer.lock $REPO_DIR/scripts/analyze-creator-socials.sh --limit=20 >> $HOME/logs/ugc-vz-ai-analyzer.log 2>&1 $CRON_MARKER"
  EXISTING_CRON="$(crontab -l 2>/dev/null || true)"
  if echo "$EXISTING_CRON" | grep -qF "$CRON_MARKER"; then
    echo "  Cron-Eintrag bereits vorhanden (unveraendert)."
  else
    {
      [ -n "$EXISTING_CRON" ] && printf '%s\n' "$EXISTING_CRON"
      printf '%s\n' "$CRON_CMD"
    } | crontab -
    echo "  OK: Cron installiert (alle 2 Std., max. 20 Profile/Lauf, Log: $HOME/logs/ugc-vz-ai-analyzer.log)."
  fi
else
  echo "  Uebersprungen (--no-cron)."
fi

echo ""
echo "[6/6] Pruefe Live-Datenbankstand..."
"$NODE_BIN" -e '
const { neon } = require("@neondatabase/serverless");
(async () => {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  const [stats] = await sql.query(`
    SELECT
      (SELECT count(*)::int FROM creator_profiles WHERE status = '\''active'\'') AS active_creators,
      (SELECT count(*)::int FROM creator_search_index) AS indexed_creators,
      (SELECT count(*)::int FROM creator_search_index WHERE embedding_values IS NOT NULL) AS embedded_creators,
      (SELECT count(*)::int FROM creator_ai_profiles WHERE status = '\''draft_ready'\'') AS ai_draft_ready,
      (SELECT count(*)::int FROM creator_ai_profiles WHERE status = '\''approved'\'') AS ai_approved,
      (SELECT count(*)::int FROM creator_ai_profiles WHERE status = '\''failed'\'') AS ai_failed
  `);
  console.log(JSON.stringify(stats, null, 2));
})();
'

if [ "$DO_PUSH" = true ]; then
  echo ""
  echo "[Push] Pushe lokale Commits auf origin/main..."
  git push origin main
else
  echo ""
  echo "Hinweis: Code wurde noch NICHT gepusht. Zum Deployen einfach ausfuehren:"
  echo "  git push origin main"
fi

echo ""
echo "================================================================"
echo "FERTIG! ($(date -Iseconds))"
echo "Log gespeichert unter: $LOG_FILE"
echo "================================================================"
