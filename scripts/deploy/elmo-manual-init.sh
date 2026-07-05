#!/usr/bin/env bash
# Manual non-interactive equivalent of `elmo init` (CLI 0.2.12) for /opt/elmo.
# Replicates writeConfigFiles() output; binds ports to 127.0.0.1 (tunnel-only design).
set -euo pipefail

ELMO_DIR=/opt/elmo
VERSION=0.2.12

command -v docker >/dev/null || { echo "ERROR: docker missing"; exit 1; }
docker compose version >/dev/null || { echo "ERROR: docker compose missing"; exit 1; }

# DataForSEO creds from the secrets file
set -a; . /root/bootstrap-secrets.env; set +a
[ -n "${DATAFORSEO_LOGIN:-}" ] || { echo "ERROR: DATAFORSEO_LOGIN empty"; exit 1; }

DEPLOYMENT_ID=$(cat /proc/sys/kernel/random/uuid)
BETTER_AUTH_SECRET=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')

mkdir -p "$ELMO_DIR"

cat >"$ELMO_DIR/.env" <<EOF
# Rendered manually (non-interactive elmo init equivalent) for elmo ${VERSION}
# WARNING: contains secrets. Do not commit.

DEPLOYMENT_MODE=local
VITE_DEPLOYMENT_MODE=local
DEPLOYMENT_ID=${DEPLOYMENT_ID}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
APP_NAME=Elmo
APP_ICON=/icons/elmo-icon.svg
VITE_APP_NAME=Elmo
VITE_APP_ICON=/icons/elmo-icon.svg
DATABASE_URL=postgres://postgres:postgres@postgres:5432/elmo
DISABLE_TELEMETRY=1

# Scraper: DataForSEO (Google AI Mode). Add BrightData/Olostep later for ChatGPT.
DATAFORSEO_LOGIN=${DATAFORSEO_LOGIN}
DATAFORSEO_PASSWORD=${DATAFORSEO_PASSWORD}
SCRAPE_TARGETS=google-ai-mode:dataforseo:online

# REQUIRED for onboarding analysis + sentiment scoring — fill one in:
OPENROUTER_API_KEY=
EOF
chmod 600 "$ELMO_DIR/.env"

cat >"$ELMO_DIR/elmo.yaml" <<EOF
# Rendered manually (non-interactive elmo init equivalent) for elmo ${VERSION}
# Ports bound to 127.0.0.1 — access is via Cloudflare Tunnel / Tailscale only.

name: elmo

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: elmo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 30s
  db-migrate:
    image: elmohq/elmo-db-migrate:${VERSION}
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/elmo
    depends_on:
      postgres:
        condition: service_healthy
  web:
    image: elmohq/elmo-web:${VERSION}
    env_file:
      - path: .env
        required: true
    ports:
      - "127.0.0.1:1515:3000"
    depends_on:
      db-migrate:
        condition: service_completed_successfully
  worker:
    image: elmohq/elmo-worker:${VERSION}
    env_file:
      - path: .env
        required: true
    depends_on:
      db-migrate:
        condition: service_completed_successfully

volumes:
  postgres_data:
EOF

echo "Config written. Starting stack..."
docker compose -f "$ELMO_DIR/elmo.yaml" --project-directory "$ELMO_DIR" up -d

echo "Waiting for services..."
sleep 20
docker compose -f "$ELMO_DIR/elmo.yaml" --project-directory "$ELMO_DIR" ps
echo "HTTP check:"
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:1515 || true
