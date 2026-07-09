"""Redeploy companion after migration fix."""
from pathlib import Path
import subprocess
import tempfile
import os

REPO = Path(__file__).resolve().parents[2]
HOST = "45.76.118.244"
HOSTKEY = "SHA256:EEP274HRhLMDFb7ArSSvDdu0HFPYvMqn5ync1IUSVzI"
PLINK = r"C:\Program Files (x86)\PuTTY\plink.exe"
PSCP = r"C:\Program Files (x86)\PuTTY\pscp.exe"
SSH_KEY = Path.home() / ".ssh" / "id_ed25519_hermes_vultr"
PASSWORD = os.environ.get("GEOMODE_VPS_PASSWORD", "")


def ssh_base(use_key: bool = True) -> list[str]:
    if use_key and SSH_KEY.exists():
        return ["ssh", "-i", str(SSH_KEY), "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new"]
    if not PASSWORD:
        raise RuntimeError("Set GEOMODE_VPS_PASSWORD or install SSH key at ~/.ssh/id_ed25519_hermes_vultr")
    return [PLINK, "-batch", "-hostkey", HOSTKEY, "-pw", PASSWORD]


def scp_base(use_key: bool = True) -> list[str]:
    if use_key and SSH_KEY.exists():
        return ["scp", "-i", str(SSH_KEY), "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new"]
    if not PASSWORD:
        raise RuntimeError("Set GEOMODE_VPS_PASSWORD or install SSH key at ~/.ssh/id_ed25519_hermes_vultr")
    return [PSCP, "-batch", "-hostkey", HOSTKEY, "-pw", PASSWORD]


def load_env() -> dict[str, str]:
    for path in [REPO / ".env.local", REPO / ".env"]:
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
    raise RuntimeError("No env file found")


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip())
    if result.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd)}")


def main() -> None:
    if not PASSWORD:
        raise RuntimeError("GEOMODE_VPS_PASSWORD required")

    env = load_env()
    companion_env = "\n".join(
        [
            "DATABASE_URL=postgresql://postgres:postgres@postgres:5432/elmo",
            f"NEON_DATABASE_URL={env['DATABASE_URL']}",
            f"DATAFORSEO_LOGIN={env.get('DATAFORSEO_USERNAME') or env.get('DATAFORSEO_LOGIN')}",
            f"DATAFORSEO_PASSWORD={env['DATAFORSEO_PASSWORD']}",
            "TRACKED_BRAND=FlowIntent",
            "TRACKED_DOMAIN=flowintent.com",
            "TRACKED_KEYWORDS=ai visibility platform,answer engine optimization tool,geo tracking software",
            f"AI_GATEWAY_API_KEY={env.get('AI_GATEWAY_API_KEY', '')}",
            "SUGGESTIONS_MODEL=openai/gpt-5.5",
            "READ_API_PORT=8787",
            "ELMO_DATABASE_SCHEMA=public",
            "JOB_TIMEZONE=UTC",
        ]
    ) + "\n"

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        env_file = tmpdir / "companion.env"
        env_file.write_text(companion_env, encoding="utf-8")
        tar_file = tmpdir / "geomode-companion.tgz"
        import tarfile

        with tarfile.open(tar_file, "w:gz") as tar:
            base = REPO / "services" / "geomode-companion"
            for item in base.rglob("*"):
                if item.is_file() and "node_modules" not in item.parts:
                    tar.add(item, arcname=str(Path("geomode-companion") / item.relative_to(base)))

        run(scp_base() + [str(tar_file), f"root@{HOST}:/root/geomode-companion.tgz"])
        run(scp_base() + [str(env_file), f"root@{HOST}:/root/companion.env"])

    remote = (
        "rm -rf /opt/elmo/services/geomode-companion && "
        "mkdir -p /opt/elmo/services && "
        "tar -xzf /root/geomode-companion.tgz -C /opt/elmo/services && "
        "mv /root/companion.env /opt/elmo/services/geomode-companion/.env && "
        "chmod 600 /opt/elmo/services/geomode-companion/.env && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo build geomode-companion && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo up -d geomode-companion && "
        "sleep 12 && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo ps && "
        "curl -sS http://127.0.0.1:8787/health && echo && "
        "docker compose -f /opt/elmo/elmo.yaml --project-directory /opt/elmo logs --tail=20 geomode-companion"
    )
    run(ssh_base() + [f"root@{HOST}", remote])


if __name__ == "__main__":
    main()
