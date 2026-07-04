#!/usr/bin/env python3
"""Configure geomode VPS: Elmo APP_URL, API keys, companion env, cloudflared."""

from __future__ import annotations

import secrets
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HOST = "45.76.118.244"
SSH_KEY = Path.home() / ".ssh" / "id_ed25519_hermes_vultr"
GEO_APP_URL = "https://geo.flowintent.com"


def load_env() -> dict[str, str]:
    for path in [REPO_ROOT / ".env.local", REPO_ROOT / ".env"]:
        if not path.exists():
            continue
        values: dict[str, str] = {}
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"')
        return values
    raise RuntimeError("No .env.local or .env found")


def ssh(cmd: str, timeout: int = 300) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        [
            "ssh",
            "-i",
            str(SSH_KEY),
            "-o",
            "BatchMode=yes",
            "-o",
            "ConnectTimeout=15",
            "-o",
            "StrictHostKeyChecking=accept-new",
            f"root@{HOST}",
            cmd,
        ],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    return result


def scp(local: Path, remote: str) -> None:
    result = subprocess.run(
        [
            "scp",
            "-i",
            str(SSH_KEY),
            "-o",
            "BatchMode=yes",
            "-o",
            "StrictHostKeyChecking=accept-new",
            str(local),
            f"root@{HOST}:{remote}",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout)


def env_file_lines(env: dict[str, str], admin_api_key: str) -> list[str]:
    lines = {
        "APP_URL": GEO_APP_URL,
        "VITE_APP_URL": GEO_APP_URL,
        "ADMIN_API_KEYS": admin_api_key,
        "DATAFORSEO_LOGIN": env.get("DATAFORSEO_USERNAME") or env.get("DATAFORSEO_LOGIN", ""),
        "DATAFORSEO_PASSWORD": env.get("DATAFORSEO_PASSWORD", ""),
        "GOOGLE_API_KEY": env.get("GOOGLE_API_KEY", ""),
        "OPENAI_API_KEY": env.get("OPENAI_API_KEY", ""),
        "ANTHROPIC_API_KEY": env.get("ANTHROPIC_API_KEY", ""),
        "PERPLEXITY_API_KEY": env.get("PERPLEXITY_API_KEY", ""),
        "OPENROUTER_API_KEY": env.get("OPENROUTER_API_KEY", ""),
    }
    tunnel = env.get("CLOUDFLARE_TUNNEL_TOKEN", "")
    if tunnel:
        lines["CLOUDFLARE_TUNNEL_TOKEN"] = tunnel
    return [f"{key}={value}" for key, value in lines.items() if value]


def companion_env(env: dict[str, str]) -> str:
    return "\n".join(
        [
            "DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elmo",
            f"NEON_DATABASE_URL={env['DATABASE_URL']}",
            f"DATAFORSEO_LOGIN={env.get('DATAFORSEO_USERNAME') or env.get('DATAFORSEO_LOGIN')}",
            f"DATAFORSEO_PASSWORD={env['DATAFORSEO_PASSWORD']}",
            "TRACKED_BRAND=FlowIntent",
            "TRACKED_DOMAIN=flowintent.com",
            "TRACKED_KEYWORDS=ai visibility platform,answer engine optimization tool,geo tracking software",
            f"AI_GATEWAY_API_KEY={env.get('AI_GATEWAY_API_KEY', '')}",
            "SUGGESTIONS_MODEL=openai/gpt-4o-mini",
            "READ_API_PORT=8787",
            "ELMO_DATABASE_SCHEMA=public",
            "JOB_TIMEZONE=UTC",
        ]
    ) + "\n"


REMOTE_MERGE = r"""
import os
from pathlib import Path

def merge_env(path: Path, updates: dict[str, str]) -> None:
    current: dict[str, str] = {}
    order: list[str] = []
    if path.exists():
        for line in path.read_text().splitlines():
            if not line.strip() or line.strip().startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            current[key] = value
            if key not in order:
                order.append(key)
    for key, value in updates.items():
        current[key] = value
        if key not in order:
            order.append(key)
    path.write_text('\n'.join(f"{k}={current[k]}" for k in order) + '\n')
    os.chmod(path, 0o600)

patch = {}
for line in Path('/root/elmo.patch.env').read_text().splitlines():
    if '=' in line:
        k, v = line.split('=', 1)
        patch[k] = v
merge_env(Path('/opt/elmo/.env'), patch)
Path('/opt/elmo/services/geomode-companion/.env').write_text(Path('/root/companion.env').read_text())
os.chmod('/opt/elmo/services/geomode-companion/.env', 0o600)

elmo = Path('/opt/elmo/elmo.yaml')
text = elmo.read_text()
if 'cloudflared' not in text:
    extra = '''
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - web
      - geomode-companion
'''
    text = text.replace('\nvolumes:', extra + '\nvolumes:')
    elmo.write_text(text)
print('env merged')
"""


def main() -> int:
    env = load_env()
    admin_api_key = env.get("ELMO_API_KEY") or secrets.token_urlsafe(32)

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        patch = tmpdir / "elmo.patch.env"
        patch.write_text("\n".join(env_file_lines(env, admin_api_key)) + "\n", encoding="utf-8")
        companion = tmpdir / "companion.env"
        companion.write_text(companion_env(env), encoding="utf-8")
        merge = tmpdir / "remote_merge.py"
        merge.write_text(REMOTE_MERGE, encoding="utf-8")
        scp(patch, "/root/elmo.patch.env")
        scp(companion, "/root/companion.env")
        scp(merge, "/root/remote_merge.py")

    result = ssh(
        "python3 /root/remote_merge.py && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo up -d --build geomode-companion web worker && "
        "grep -q '^CLOUDFLARE_TUNNEL_TOKEN=.' /opt/elmo/.env && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo up -d cloudflared || true && "
        "sleep 10 && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo ps && "
        "curl -sS -o /dev/null -w 'elmo:%{http_code}\\n' http://127.0.0.1:1515 && "
        "curl -sS http://127.0.0.1:8787/health && echo"
    )
    if result.returncode != 0:
        return result.returncode

    ssh("docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo exec -T geomode-companion node dist/cli/run-pipeline-once.js")

    print("\n--- Set on Vercel (production + preview) ---")
    print(f"ELMO_API_URL={GEO_APP_URL}")
    print(f"ELMO_API_KEY={admin_api_key}")

    if not env.get("CLOUDFLARE_TUNNEL_TOKEN"):
        print("\nAdd CLOUDFLARE_TUNNEL_TOKEN to .env.local (Cloudflare Zero Trust > Tunnels > geomode > Install connector) and re-run this script.")

    # Persist ELMO_API_KEY locally for future runs (don't commit)
    local_env = REPO_ROOT / ".env.local"
    text = local_env.read_text(encoding="utf-8")
    updates = {
        "ELMO_API_KEY": admin_api_key,
        "ELMO_API_URL": GEO_APP_URL,
    }
    for key, value in updates.items():
        if f"{key}=" in text:
            lines = []
            for line in text.splitlines():
                if line.startswith(f"{key}="):
                    lines.append(f"{key}={value}")
                else:
                    lines.append(line)
            text = "\n".join(lines) + ("\n" if text.endswith("\n") else "")
        else:
            text = text.rstrip() + f"\n{key}={value}\n"
    local_env.write_text(text, encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
