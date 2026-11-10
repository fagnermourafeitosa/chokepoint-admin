#!/bin/sh
# Deploy the Admin (Backend 072). It builds the production image from
# this checkout on the host, tagged with the commit, and replaces the Admin
# container through Terraform, first in the local VM, then in production:
#   infra/deploy.sh               local, then production
#   infra/deploy.sh local         the local VM only
#   infra/deploy.sh production    production only
# The checkout must be clean and equal to origin/main. The Admin has its own
# Terraform root and state (Backend 072, decision 5), so the plan holds only the
# Admin image and container: Envoy, Keycloak, PostgreSQL, OpenFGA, the backend and
# the site are never planned or changed here. The new container is healthy before
# the old one stops. Each environment shows its plan and asks
# before it applies, runs the header check, and
# keeps only the newest two Admin images and at most 3 GB of build cache on the
# host. A rollback is a revert commit on main, deployed the same way.
# Needs the sibling checkouts backend and dev-infra (or BACKEND_DIR and
# DEV_INFRA_DIR) and the environment's age key (dev-infra/terraform/README).
set -eu
admin="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
root="$(dirname -- "$admin")"
BACKEND_DIR="${BACKEND_DIR:-$root/backend}"
DEV_INFRA_DIR="${DEV_INFRA_DIR:-$root/dev-infra}"
export BACKEND_DIR TF_VAR_admin_build_context="$admin"

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }
# running_tag: the tag of the image of the running admin container, empty when there is none.
running_tag() {
  name="$(docker ps --filter 'name=^chokepoint-admin-' --format '{{.Names}}' 2>/dev/null | head -n 1)"
  [ -n "$name" ] || return 0
  id="$(docker inspect -f '{{.Image}}' "$name")"
  docker image ls chokepoint/admin --no-trunc --format '{{.ID}} {{.Tag}}' | awk -v id="$id" '$1 == id { print $2; exit }'
}

case "${1:-all}" in
  all) envs="local production" ;;
  local|production) envs="$1" ;;
  *) fail "usage: infra/deploy.sh [local|production]" ;;
esac

for tool in git terraform sops docker; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required."
done
[ -x "$DEV_INFRA_DIR/terraform/tf.sh" ] || fail "dev-infra not found at $DEV_INFRA_DIR (set DEV_INFRA_DIR)."
[ -d "$BACKEND_DIR/infra/terraform" ] || fail "backend not found at $BACKEND_DIR (set BACKEND_DIR)."

# Only reviewed, merged code goes out (Backend 071, decision 12).
cd "$admin"
[ -z "$(git status --porcelain)" ] || fail "the Admin checkout has uncommitted changes."
git fetch --quiet origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || fail "HEAD is not origin/main: check out main and pull."
TF_VAR_admin_image_tag="$(git rev-parse --short=12 HEAD)"
export TF_VAR_admin_image_tag
printf 'Deploying Admin %s\n' "$(git log -1 --format='%h %s')"

for env in $envs; do
  printf '\n== %s ==\n' "$env"
  "$DEV_INFRA_DIR/terraform/tf.sh" "$env" admin init -input=false >/dev/null
  # The tag of the image the running container uses: it stays on the host for a rollback.
  DOCKER_HOST="$("$DEV_INFRA_DIR/terraform/tf.sh" "$env" admin output -raw docker_host 2>/dev/null || true)"
  export DOCKER_HOST
  previous="$(running_tag)"
  unset DOCKER_HOST
  "$DEV_INFRA_DIR/terraform/tf.sh" "$env" admin plan -out=tfplan
  printf 'Apply this plan to %s? [y/N] ' "$env"
  read -r answer
  [ "$answer" = y ] || fail "not applied to $env."
  "$DEV_INFRA_DIR/terraform/tf.sh" "$env" admin apply tfplan
  "$DEV_INFRA_DIR/terraform/state-backup.sh" "$env" >/dev/null
  "$DEV_INFRA_DIR/envoy/check-headers.sh" "$env"

  # Disk: the deployed image and the one it replaced stay, by tag. The build is reproducible, so
  # every image has the same creation date and cannot be ordered by it. Older images and stale
  # build cache go; a failed removal never stops the deploy.
  DOCKER_HOST="$("$DEV_INFRA_DIR/terraform/tf.sh" "$env" admin output -raw docker_host)"
  export DOCKER_HOST
  docker image ls chokepoint/admin --format '{{.Tag}}' | while read -r tag; do
    if [ "$tag" = "$TF_VAR_admin_image_tag" ] || [ "$tag" = "$previous" ]; then continue; fi
    docker image rm "chokepoint/admin:$tag" >/dev/null 2>&1 && printf 'removed %s\n' "$tag" || true
  done
  docker image prune -f >/dev/null
  docker builder prune -f --max-used-space 3GB >/dev/null
  unset DOCKER_HOST
done
printf '\nDone: %s\n' "$envs"
