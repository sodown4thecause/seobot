# Geomode / Elmo VPS bootstrap

Non-interactive bootstrap via `scripts/deploy/geomode-vultr-bootstrap.sh`.

## Required environment (non-interactive)

Set these before running with `ELMO_NONINTERACTIVE=1`:

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Elmo auth secret (auto-generated if omitted) |
| `OPENROUTER_API_KEY` | At least one LLM provider key for captures |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | Optional SERP provider keys for Elmo template |

Optional:

| Variable | Purpose |
|---|---|
| `ELMO_POSTGRES_PASSWORD` | Postgres password (auto-generated if omitted) |
| `GEOMODE_USE_FORK=1` | Clone `GEOMODE_REPO` and run `elmo init --dev` |
| `GEOMODE_REPO` | Fork URL (default: sodown4thecause/geomode) |
| `PUBLIC_APP_PORT` | Local Elmo UI port (default: 1515) |

## Example

```bash
ELMO_NONINTERACTIVE=1 \
  BETTER_AUTH_SECRET="$(openssl rand -hex 32)" \
  OPENROUTER_API_KEY="sk-or-..." \
  ./scripts/deploy/geomode-vultr-bootstrap.sh
```

## After bootstrap

1. Install Cloudflare Tunnel and route `geo.<your-domain>` to `http://127.0.0.1:1515`.
2. Set FlowIntent env: `ELMO_API_URL`, `ELMO_API_KEY` (from Elmo admin keys).

See `docs/specs/2026-06-12-geomode-geo-tracking-design.md` for the full architecture.
