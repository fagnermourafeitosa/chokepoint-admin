#!/bin/sh
# Start the Admin development server at http://127.0.0.1:5173.
# The backend must run at http://127.0.0.1:8081 (backend/dev.sh).
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }

for tool in node npm nc; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required."
done
want=$(cat .nvmrc)
[ "$(node -v | sed 's/^v//')" = "$want" ] || printf 'Warning: Node.js %s is expected (.nvmrc), found %s.\n' "$want" "$(node -v)" >&2
if nc -z 127.0.0.1 5173 >/dev/null 2>&1; then
  fail "Port 5173 is already in use. Stop the running Admin first."
fi
[ -d node_modules ] || npm ci
nc -z 127.0.0.1 8081 >/dev/null 2>&1 || printf 'Warning: the backend is not running at 127.0.0.1:8081 (run backend/dev.sh).\n' >&2
exec npm run dev
