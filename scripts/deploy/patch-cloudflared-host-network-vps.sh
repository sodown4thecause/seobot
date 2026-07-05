#!/usr/bin/env bash
set -euo pipefail

python3 <<'PY'
from pathlib import Path
import re

p = Path("/opt/elmo/elmo.yaml")
text = p.read_text()

new_block = """  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    network_mode: host
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - web
      - geomode-companion"""

text2, n = re.subn(
    r"  cloudflared:\n(?:    .+\n)+?(?=\nvolumes:)",
    new_block + "\n",
    text,
    count=1,
    flags=re.M,
)
if n != 1:
    raise SystemExit(f"cloudflared block replace failed (n={n})")

p.write_text(text2)
print("patched cloudflared -> host network + remote tunnel config")
PY

cd /opt/elmo
docker compose -f elmo.yaml up -d cloudflared
sleep 3
docker inspect elmo-cloudflared-1 --format 'network={{.HostConfig.NetworkMode}}'
docker logs elmo-cloudflared-1 --tail 5
