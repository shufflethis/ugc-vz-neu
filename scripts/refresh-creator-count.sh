#!/usr/bin/env bash
# Cron-Wrapper: schreibt die beworbene Creator-Zahl woechentlich fort.
# Crontab (autoblogger): montags 06:10 mit flock, Log unter ~/logs/.
set -euo pipefail
cd "$(dirname "$0")/.."
exec /usr/bin/node scripts/refresh-creator-count.mjs "$@"
