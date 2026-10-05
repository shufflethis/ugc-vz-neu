#!/usr/bin/env bash
# Cron-Wrapper: schreibt die beworbene Creator-Zahl woechentlich fort.
# Cron: /etc/cron.d/ugc-vz-creator-count (User badmax, montags 06:10 UTC, flock),
# Log: ~/logs/ugc-vz-creator-count.log. Eingerichtet 05.10.2026.
set -euo pipefail
cd "$(dirname "$0")/.."
exec /usr/bin/node scripts/refresh-creator-count.mjs "$@"
