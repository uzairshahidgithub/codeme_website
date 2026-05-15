#!/usr/bin/env bash
# Copy Earth textures from local Codemo Assets into public/textures/earth/.
# Replaces the old NASA download script. Idempotent — safe to run anytime.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SRC="${REPO_ROOT}/Codemo Assets/59-earth/textures"
DEST="${REPO_ROOT}/frontend/public/textures/earth"

if [[ ! -d "${SRC}" ]]; then
  echo "Source folder missing: ${SRC}" >&2
  exit 1
fi

mkdir -p "${DEST}"

cp -f "${SRC}/earth albedo.jpg"            "${DEST}/earth_daymap.jpg"
cp -f "${SRC}/earth bump.jpg"              "${DEST}/earth_normal_map.jpg"
cp -f "${SRC}/earth land ocean mask.png"   "${DEST}/earth_specular_map.png"
cp -f "${SRC}/clouds earth.png"            "${DEST}/earth_clouds.png"
cp -f "${SRC}/earth night_lights_modified.png" "${DEST}/earth_night.png"

echo "Earth textures copied to ${DEST}"
ls -la "${DEST}"
