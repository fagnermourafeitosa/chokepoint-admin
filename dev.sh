#!/bin/sh
# Start the Admin development server at http://127.0.0.1:5173.
# An Admin already running on that port is stopped first.
# The backend must run at http://127.0.0.1:8081 (backend/dev.sh).
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

for tool in node npm nc lsof; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required."
done
want=$(cat .nvmrc)
[ "$(node -v | sed 's/^v//')" = "$want" ] || printf 'Warning: Node.js %s is expected (.nvmrc), found %s.\n' "$want" "$(node -v)" >&2
stop_listeners 5173
[ -d node_modules ] || npm ci
nc -z 127.0.0.1 8081 >/dev/null 2>&1 || printf 'Warning: the backend is not running at 127.0.0.1:8081 (run backend/dev.sh).\n' >&2
exec npm run dev
