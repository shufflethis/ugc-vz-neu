#!/usr/bin/env bash
# Fragt interaktiv (verdeckt) deinen OpenRouter-Key ab, prueft ihn direkt gegen
# OpenRouter, traegt ihn sauber in .env.local ein und startet das volle Rollout + Push.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

if [ ! -f .env.local ]; then
  echo "FEHLER: .env.local nicht gefunden in $REPO_DIR" >&2
  exit 1
fi

read -rsp "OpenRouter API Key (sk-or-v1-...): " NEW_KEY
echo ""

NEW_KEY="$(printf '%s' "$NEW_KEY" | tr -d '\r\n ')"
if [[ "$NEW_KEY" != sk-or-* ]]; then
  echo "FEHLER: Key muss mit 'sk-or-' beginnen." >&2
  exit 1
fi

echo "Pruefe Key gegen OpenRouter..."
HTTP_CODE="$(curl -s -o /tmp/or-key-check.json -w '%{http_code}' \
  -H "Authorization: Bearer $NEW_KEY" \
  https://openrouter.ai/api/v1/auth/key)"
if [ "$HTTP_CODE" != "200" ]; then
  echo "FEHLER: OpenRouter lehnt Key ab (HTTP $HTTP_CODE):" >&2
  cat /tmp/or-key-check.json >&2
  rm -f /tmp/or-key-check.json
  exit 1
fi
rm -f /tmp/or-key-check.json
echo "OK: OpenRouter-Key ist gueltig!"

NEW_KEY="$NEW_KEY" python3 - <<'PY'
import os, re
path = ".env.local"
key = os.environ["NEW_KEY"].strip()
content = open(path, "r", encoding="utf-8").read()
if re.search(r"^OPENROUTER_API_KEY=", content, flags=re.M):
    content = re.sub(r"^OPENROUTER_API_KEY=.*$", f'OPENROUTER_API_KEY="{key}"', content, flags=re.M)
else:
    content = content.rstrip("\n") + f'\nOPENROUTER_API_KEY="{key}"\n'
open(path, "w", encoding="utf-8").write(content)
print(f"OK: OPENROUTER_API_KEY in .env.local gespeichert ({key[:10]}...)")
PY
unset NEW_KEY

exec "$REPO_DIR/scripts/rollout-search-v2.sh" --push "$@"
