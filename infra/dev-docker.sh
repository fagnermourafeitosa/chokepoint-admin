#!/bin/sh
# Start the Admin for local development in a container on
# ADMIN_DEV_HOST:ADMIN_DEV_PORT (.env.local). It is the container equivalent
# of dev.sh: it builds the development image (static build served by Nginx,
# /api sent to ADMIN_API_TARGET) and runs it on the host network. A container
# from an earlier run is replaced. The backend must run at ADMIN_API_TARGET
# (backend/dev.sh or backend/infra/dev-docker.sh). Press Ctrl+C to stop.
# The image holds a build: run this script again after a source change.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

image=chokepoint-admin:development
name=chokepoint-admin-development

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }
# value NAME: the process environment wins over .env.local, as in Vite.
value() { eval "v=\${$1:-}"; [ -n "$v" ] || v=$(sed -n "s/^$1=//p" .env.local | tail -n 1); [ -n "$v" ] || fail "$1 is missing in .env.local (see .env.example)."; printf '%s' "$v"; }

for tool in docker nc curl; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required."
done
docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker or OrbStack, then run this script again."
[ -f .env.local ] || fail ".env.local is missing. Create it from .env.example."
host=$(value ADMIN_DEV_HOST)
port=$(value ADMIN_DEV_PORT)
target=$(value ADMIN_API_TARGET)

docker rm -f "$name" >/dev/null 2>&1 || true
! nc -z "$host" "$port" >/dev/null 2>&1 || fail "$host:$port is in use. Stop the process that uses it (for example dev.sh), then run this script again."

docker build -f infra/Dockerfile.development -t "$image" .
curl -s -o /dev/null --max-time 2 "$target" || printf 'Warning: the backend is not running at %s (run backend/dev.sh or backend/infra/dev-docker.sh).\n' "$target" >&2
exec docker run --rm --name "$name" --network host \
  -e ADMIN_DEV_HOST="$host" -e ADMIN_DEV_PORT="$port" -e ADMIN_API_TARGET="$target" \
  "$image"
