#!/usr/bin/env bash
# Cron-Wrapper fuer die multimodale KI-Kanalanalyse (siehe analyze-creator-socials.mjs).
# Crontab (autoblogger): alle 2 Stunden mit flock, Log unter ~/logs/ugc-vz-ai-analyzer.log.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . .env.local
  set +a
fi

if [ -z "${NODE_BIN:-}" ]; then
  if [ -x "$HOME/.nvm/versions/node/v22.23.4/bin/node" ]; then
    NODE_BIN="$HOME/.nvm/versions/node/v22.23.4/bin/node"
  else
    NVM_NODE="$(ls -1d "$HOME"/.nvm/versions/node/v*/bin/node 2>/dev/null | sort -V | tail -n 1 || true)"
    NODE_BIN="${NVM_NODE:-$(command -v node || echo /usr/bin/node)}"
  fi
fi
exec "$NODE_BIN" --import tsx scripts/analyze-creator-socials.mjs --use-geonode "$@"
