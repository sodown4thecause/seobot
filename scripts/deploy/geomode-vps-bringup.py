#!/usr/bin/env python3
"""One-shot bring-up for geomode VPS: Elmo stack + companion RAG pipeline."""

from __future__ import annotations

import os
import re
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HOST = "45.76.118.244"
HOSTKEY = "SHA256:EEP274HRhLMDFb7ArSSvDdu0HFPYvMqn5ync1IUSVzI"
PLINK = r"C:\Program Files (x86)\PuTTY\plink.exe"
PSCP = r"C:\Program Files (x86)\PuTTY\pscp.exe"


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"')
    return values


def plink(password: str, command: str, timeout: int = 600) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            PLINK,
            "-batch",
            "-hostkey",
            HOSTKEY,
            "-pw",
            password,
            f"root@{HOST}",
            command,
        ],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )


def pscp(password: str, local: Path, remote: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            PSCP,
            "-batch",
            "-hostkey",
            HOSTKEY,
            "-pw",
            password,
            str(local),
            f"root@{HOST}:{remote}",
        ],
        capture_output=True,
        text=True,
        timeout=300,
        check=False,
    )


def run_step(name: str, password: str, command: str, timeout: int = 600) -> None:
    print(f"\n=== {name} ===")
    result = plink(password, command, timeout=timeout)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"{name} failed (exit {result.returncode})")


def main() -> int:
    password = os.environ.get("GEOMODE_VPS_PASSWORD")
    if not password:
        print("Set GEOMODE_VPS_PASSWORD", file=sys.stderr)
        return 1

    env = load_env_file(REPO_ROOT / ".env.local")
    if not env:
        env = load_env_file(REPO_ROOT / ".env")

    dataforseo_login = env.get("DATAFORSEO_USERNAME") or env.get("DATAFORSEO_LOGIN")
    dataforseo_password = env.get("DATAFORSEO_PASSWORD")
    neon_url = env.get("DATABASE_URL")
    ai_gateway_key = env.get("AI_GATEWAY_API_KEY")

    if not dataforseo_login or not dataforseo_password:
        print("Missing DataForSEO credentials in .env.local", file=sys.stderr)
        return 1
    if not neon_url:
        print("Missing DATABASE_URL (Neon) in .env.local", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        secrets = tmpdir / "bootstrap-secrets.env"
        secrets.write_text(
            "\n".join(
                [
                    f"DATAFORSEO_LOGIN={dataforseo_login}",
                    f"DATAFORSEO_PASSWORD={dataforseo_password}",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

        companion_env = tmpdir / "companion.env"
        companion_env.write_text(
            "\n".join(
                [
                    "DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elmo",
                    f"NEON_DATABASE_URL={neon_url}",
                    f"DATAFORSEO_LOGIN={dataforseo_login}",
                    f"DATAFORSEO_PASSWORD={dataforseo_password}",
                    "TRACKED_BRAND=FlowIntent",
                    "TRACKED_DOMAIN=flowintent.com",
                    "TRACKED_KEYWORDS=ai visibility platform,answer engine optimization tool,geo tracking software",
                    f"AI_GATEWAY_API_KEY={ai_gateway_key or ''}",
                    "SUGGESTIONS_MODEL=openai/gpt-5.5",
                    "READ_API_PORT=8787",
                    "ELMO_DATABASE_SCHEMA=public",
                    "JOB_TIMEZONE=UTC",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

        companion_tar = tmpdir / "geomode-companion.tgz"
        with tarfile.open(companion_tar, "w:gz") as tar:
            base = REPO_ROOT / "services" / "geomode-companion"
            for item in base.rglob("*"):
                if item.is_file() and "node_modules" not in item.parts:
                    tar.add(item, arcname=str(Path("geomode-companion") / item.relative_to(base)))

        elmo_init = REPO_ROOT / "scripts" / "deploy" / "elmo-manual-init.sh"
        compose_override = REPO_ROOT / "scripts" / "deploy" / "geomode-companion-compose.override.yml"

        for local, remote in [
            (secrets, "/root/bootstrap-secrets.env"),
            (elmo_init, "/root/elmo-manual-init.sh"),
            (companion_tar, "/root/geomode-companion.tgz"),
            (companion_env, "/root/companion.env"),
            (compose_override, "/root/companion-compose.override.yml"),
        ]:
            result = pscp(password, local, remote)
            if result.returncode != 0:
                print(result.stderr or result.stdout, file=sys.stderr)
                raise RuntimeError(f"upload failed for {local.name}")

    run_step(
        "Install Docker + prerequisites",
        password,
        "export DEBIAN_FRONTEND=noninteractive && "
        "apt-get update -y && "
        "apt-get install -y ca-certificates curl gnupg jq docker.io docker-compose-v2 && "
        "systemctl enable docker && systemctl start docker && "
        "docker --version && docker compose version",
        timeout=900,
    )

    run_step(
        "Initialize Elmo stack",
        password,
        "chmod +x /root/elmo-manual-init.sh && /root/elmo-manual-init.sh",
        timeout=900,
    )

    run_step(
        "Deploy companion service",
        password,
        "mkdir -p /opt/elmo/services/geomode-companion && "
        "tar -xzf /root/geomode-companion.tgz -C /opt/elmo/services && "
        "mv /root/companion.env /opt/elmo/services/geomode-companion/.env && "
        "chmod 600 /opt/elmo/services/geomode-companion/.env && "
        "python3 - <<'PY'\n"
        "from pathlib import Path\n"
        "elmo = Path('/opt/elmo/elmo.yaml')\n"
        "text = elmo.read_text()\n"
        "if 'geomode-companion' not in text:\n"
        "    extra = '''\\n  geomode-companion:\\n"
        "    build:\\n"
        "      context: ./services/geomode-companion\\n"
        "    env_file:\\n"
        "      - ./services/geomode-companion/.env\\n"
        "    depends_on:\\n"
        "      postgres:\\n"
        "        condition: service_healthy\\n"
        "    restart: unless-stopped\\n"
        "    ports:\\n"
        "      - \"127.0.0.1:8787:8787\"\\n'''\n"
        "    text = text.replace('\\nvolumes:', extra + '\\nvolumes:')\n"
        "    elmo.write_text(text)\n"
        "PY\n"
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo build geomode-companion && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo up -d geomode-companion",
        timeout=1800,
    )

    run_step(
        "Verify services",
        password,
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo ps && "
        "curl -sS -o /dev/null -w 'elmo:%{http_code}\\n' http://127.0.0.1:1515 && "
        "sleep 15 && curl -sS http://127.0.0.1:8787/health",
        timeout=120,
    )

    print("\n=== Apply Neon geo_tracking migration locally ===")
    migration = REPO_ROOT / "drizzle" / "0007_geo_tracking.sql"
    neon_apply = subprocess.run(
        ["npx", "tsx", "-e", f"""
import {{ neon }} from '@neondatabase/serverless';
import {{ readFileSync }} from 'node:fs';
const sql = neon({neon_url!r});
const migration = readFileSync({str(migration)!r}, 'utf8');
const statements = migration.split(';').map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {{
  try {{ await sql.unsafe(stmt + ';'); console.log('ok:', stmt.slice(0, 60)); }}
  catch (e) {{ console.log('skip/exists:', stmt.slice(0, 40), e.message?.slice(0,80)); }}
}}
console.log('migration done');
"""],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=120,
        shell=True,
    )
    print(neon_apply.stdout or neon_apply.stderr)
    if neon_apply.returncode != 0:
        print(f"Neon migration failed: {neon_apply.stderr}")
        return neon_apply.returncode

    run_step(
        "Run RAG pipeline once (collector + digest + Neon sync)",
        password,
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo exec -T geomode-companion "
        "node --import tsx src/cli/run-pipeline-once.ts 2>/dev/null || "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo run --rm geomode-companion "
        "node dist/cli/run-pipeline-once.js",
        timeout=600,
    )

    run_step(
        "Companion health + logs",
        password,
        "curl -sS http://127.0.0.1:8787/health && echo && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo logs --tail=30 geomode-companion",
        timeout=60,
    )

    print("\nBring-up complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
