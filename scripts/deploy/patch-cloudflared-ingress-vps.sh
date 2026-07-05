#!/usr/bin/env bash
set -euo pipefail

mkdir -p /opt/elmo/cloudflared
cat > /opt/elmo/cloudflared/config.yml <<'EOF'
ingress:
  - hostname: geo.flowintent.com
    service: http://web:3000
  - hostname: geo-api.flowintent.com
    service: http://geomode-companion:8787
  - service: http_status:404
EOF

python3 <<'PY'
from pathlib import Path

p = Path("/opt/elmo/elmo.yaml")
text = p.read_text()

old = """  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - web
      - geomode-companion"""

new = """  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --config /etc/cloudflared/config.yml --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env
    volumes:
      - ./cloudflared/config.yml:/etc/cloudflared/config.yml:ro
    restart: unless-stopped
    depends_on:
      - web
      - geomode-companion"""

if "cloudflared/config.yml" in text:
    print("elmo.yaml already has ingress config mount")
elif old in text:
    p.write_text(text.replace(old, new))
    print("patched elmo.yaml with local ingress config")
else:
    raise SystemExit("cloudflared block not found in elmo.yaml")
PY

cd /opt/elmo
docker compose -f elmo.yaml up -d cloudflared
sleep 4
docker logs elmo-cloudflared-1 --tail 20
