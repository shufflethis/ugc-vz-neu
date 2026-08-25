#!/usr/bin/env bash
# Cron-Wrapper fuer den Social-Avatar-Fetch (siehe fetch-social-avatars.mjs).
# Crontab (autoblogger): stuendlich mit flock, Log unter ~/logs/.
set -euo pipefail
cd "$(dirname "$0")/.."
exec /usr/bin/node scripts/fetch-social-avatars.mjs "$@"
