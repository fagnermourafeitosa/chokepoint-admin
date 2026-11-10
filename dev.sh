#!/bin/sh
# Start the Admin development server on ADMIN_DEV_HOST:ADMIN_DEV_PORT (.env.local).
# An Admin already running on that port is stopped first. Open it at ADMIN_PUBLIC_ORIGIN:
# the local Envoy (dev-infra/up.sh) serves it there and routes /api/v1/ to the backend
# (backend/dev.sh).
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }

# stop_listeners PORT...: stop whatever listens on these ports, so a rerun replaces it.
stop_listeners() {
  for port in "$@"; do
    pids=$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)
    [ -n "$pids" ] || continue
    printf 'Port %s is in use. Stopping pid %s.\n' "$port" "$(echo $pids)"
    kill $pids >/dev/null 2>&1 || true
    i=0
    while nc -z 127.0.0.1 "$port" >/dev/null 2>&1; do
      i=$((i + 1))
      [ "$i" -le 10 ] || { kill -9 $pids >/dev/null 2>&1 || true; sleep 1; break; }
      sleep 1
    done
    ! nc -z 127.0.0.1 "$port" >/dev/null 2>&1 || fail "Could not free port $port."
  done
}

for tool in node npm nc lsof curl; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required."
done
want=$(cat .nvmrc)
[ "$(node -v | sed 's/^v//')" = "$want" ] || printf 'Warning: Node.js %s is expected (.nvmrc), found %s.\n' "$want" "$(node -v)" >&2
[ -f .env.local ] || fail ".env.local is missing. Create it from .env.example."
# The process environment wins over .env.local, as in Vite.
value() { eval "v=\${$1:-}"; [ -n "$v" ] || v=$(sed -n "s/^$1=//p" .env.local | tail -n 1); [ -n "$v" ] || fail "$1 is missing in .env.local (see .env.example)."; printf '%s' "$v"; }
port=$(value ADMIN_DEV_PORT)
origin=$(value ADMIN_PUBLIC_ORIGIN)
stop_listeners "$port"
[ -d node_modules ] || npm ci
curl -s -o /dev/null --max-time 2 "$origin/api/v1/public/feature-flags/healthcheck" || printf 'Warning: %s does not answer (run dev-infra/up.sh and backend/dev.sh).\n' "$origin" >&2
exec npm run dev
