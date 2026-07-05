#!/usr/bin/env bash
set -euo pipefail
TOKEN="$(grep '^CLOUDFLARE_TUNNEL_TOKEN=' /opt/elmo/.env | cut -d= -f2-)"
if grep -q '^TUNNEL_TOKEN=' /opt/elmo/.env; then
  sed -i "s|^TUNNEL_TOKEN=.*|TUNNEL_TOKEN=${TOKEN}|" /opt/elmo/.env
else
  echo "TUNNEL_TOKEN=${TOKEN}" >> /opt/elmo/.env
fi
python3 <<'PY'
from pathlib import Path
p = Path('/opt/elmo/elmo.yaml')
text = p.read_text()
old = """  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    env_file:
      - .env"""
new = """  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env"""
if 'TUNNEL_TOKEN:' not in text and old in text:
    p.write_text(text.replace(old, new))
    print('patched elmo.yaml')
elif 'TUNNEL_TOKEN:' in text:
    print('elmo.yaml already has TUNNEL_TOKEN')
else:
    print('cloudflared block not found')
PY
cd /opt/elmo
docker compose -f elmo.yaml up -d cloudflared
sleep 4
docker logs elmo-cloudflared-1 --tail 8
