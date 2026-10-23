#!/usr/bin/env bash
#
# Builds the simva-front image and verifies that the service can be launched on
# its own.
#
# The full cross-service stack (front + API + trace-allocator, plus their
# dependencies) is exercised together by simva-infra, so this check only covers
# this repository's own service.
#
set -euo pipefail

TARGET="${TARGET:-prod}"
IMAGE="simva-front:ci-${TARGET}"
CONTAINER="ci-simva-front"

cache_args=()
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  cache_args=(
    --cache-from "type=gha,scope=simva-front-${TARGET}"
    --cache-to "type=gha,mode=max,scope=simva-front-${TARGET}"
  )
fi

echo "::group::Building simva-front"
docker buildx build \
  --load \
  --target "${TARGET}" \
  --tag "${IMAGE}" \
  "${cache_args[@]}" \
  .
echo "::endgroup::"

container_running() {
  docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null | grep -qx true
}

cleanup() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# The health probe starts the HTTP server directly instead of going through
# `npm start` (PM2), so it does not depend on a PM2 ecosystem config.
# prod runs the compiled/served app directly. dev runs the image's own CMD
# (`npm run dev`) with the checked-out repo mounted over /app, keeping the
# image's node_modules through an anonymous volume, as docker-compose does.
run_args=()
cmd=(node bin/www)
if [[ "${TARGET}" == "dev" ]]; then
  run_args=(-v "$(pwd):/app" -v /app/node_modules)
  cmd=()
fi

docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
docker run -d --name "${CONTAINER}" \
  -e SIMVA_PORT=3050 \
  -e LOG_FOLDER=/tmp \
  "${run_args[@]}" "${IMAGE}" "${cmd[@]}" >/dev/null

# The probe runs inside the container through Node's built-in fetch so that the
# check does not depend on host ports or on curl being installed in the image.
url="http://localhost:3050/users/login"
probe="fetch('${url}').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"
for _ in $(seq 1 40); do
  if docker exec "${CONTAINER}" node -e "${probe}" >/dev/null 2>&1; then
    echo "OK: simva-front is healthy (HTTP 200 at ${url})"
    exit 0
  fi
  if ! container_running "${CONTAINER}"; then
    break
  fi
  sleep 3
done
echo "::error::simva-front health check failed (no HTTP 200 at ${url})"
docker logs "${CONTAINER}" 2>&1 | tail -n 50 || true
exit 1
