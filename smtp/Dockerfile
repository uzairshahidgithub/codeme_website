# Optional override image. The default docker-compose.yml uses
# ghcr.io/postalserver/postal:3 directly, so this file is unused unless you need
# to bake in extra packages (e.g. tcpdump for debugging) or pin to a specific
# Postal commit not yet tagged.
#
# To use:
#   1. Replace `image: ghcr.io/postalserver/postal:3` in docker-compose.yml with
#      `build: .` for the four Postal services.
#   2. docker compose build && docker compose up -d
#
# Keep this minimal — most operational tweaks belong in postal.yml or compose env.

FROM ghcr.io/postalserver/postal:3

# Add operator tooling (optional)
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

USER postal
