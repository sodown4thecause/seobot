#!/usr/bin/env bash
# Register a local SSH public key with Vultr and optionally reinstall the geomode instance with it.
#
# Requires: curl, jq (optional but recommended)
# Env:
#   VULTR_API_KEY          (required)
#   VULTR_GEOMODE_INSTANCE_ID  default: c69492ff-272a-4d42-8925-94899edb2f10
#   VULTR_SSH_KEY_PATH     default: ~/.ssh/id_ed25519_hermes_vultr
#   VULTR_SSH_KEY_NAME     default: hermes-vultr-sydney
#   VULTR_ALLOW_REINSTALL  set to 1 to reinstall instance with the SSH key (DESTRUCTIVE)
#
# Note: Vultr cannot attach a new SSH key to a running instance without reinstall.
# Default mode only registers the key in your account and prints next steps.

set -euo pipefail

INSTANCE_ID="${VULTR_GEOMODE_INSTANCE_ID:-c69492ff-272a-4d42-8925-94899edb2f10}"
SSH_KEY_PRIV="${VULTR_SSH_KEY_PATH:-$HOME/.ssh/id_ed25519_hermes_vultr}"
SSH_KEY_PUB="${SSH_KEY_PRIV}.pub"
SSH_KEY_NAME="${VULTR_SSH_KEY_NAME:-hermes-vultr-sydney}"
API="https://api.vultr.com/v2"

log() { printf '[vultr-ssh] %s\n' "$*"; }
die() { printf '[vultr-ssh] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ -z "${VULTR_API_KEY:-}" ]]; then
  die "Set VULTR_API_KEY (see scripts/deploy/geomode-vultr.env.example)"
fi

if [[ ! -f "$SSH_KEY_PUB" ]]; then
  die "Public key not found: $SSH_KEY_PUB"
fi

PUB_KEY="$(tr -d '\r' < "$SSH_KEY_PUB")"

auth_header() {
  printf 'Authorization: Bearer %s' "$VULTR_API_KEY"
}

json_get() {
  local expr="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r "$expr"
  else
    die "jq is required for parsing Vultr API responses"
  fi
}

log "Fetching instance ${INSTANCE_ID}..."
INSTANCE_JSON="$(curl -sS -H "$(auth_header)" "${API}/instances/${INSTANCE_ID}")"
INSTANCE_IP="$(printf '%s' "$INSTANCE_JSON" | json_get '.instance.main_ip // empty')"
INSTANCE_LABEL="$(printf '%s' "$INSTANCE_JSON" | json_get '.instance.label // empty')"

if [[ -z "$INSTANCE_IP" ]]; then
  die "Could not read instance IP — check VULTR_GEOMODE_INSTANCE_ID and API token scope"
fi

log "Instance: ${INSTANCE_LABEL:-unknown} @ ${INSTANCE_IP}"

log "Listing account SSH keys..."
KEYS_JSON="$(curl -sS -H "$(auth_header)" "${API}/ssh-keys")"
EXISTING_ID="$(printf '%s' "$KEYS_JSON" | jq -r --arg pub "$PUB_KEY" '.ssh_keys[] | select(.ssh_key == $pub) | .id' | head -n1)"

if [[ -n "$EXISTING_ID" && "$EXISTING_ID" != "null" ]]; then
  SSH_KEY_ID="$EXISTING_ID"
  log "SSH key already registered: ${SSH_KEY_ID}"
else
  log "Registering SSH key ${SSH_KEY_NAME}..."
  CREATE_JSON="$(curl -sS -X POST -H "$(auth_header)" -H 'Content-Type: application/json' \
    -d "$(jq -n --arg name "$SSH_KEY_NAME" --arg key "$PUB_KEY" '{name:$name, ssh_key:$key}')" \
    "${API}/ssh-keys")"
  SSH_KEY_ID="$(printf '%s' "$CREATE_JSON" | json_get '.ssh_key.id // empty')"
  if [[ -z "$SSH_KEY_ID" ]]; then
    printf '%s\n' "$CREATE_JSON" >&2
    die "Failed to create SSH key in Vultr account"
  fi
  log "Created SSH key: ${SSH_KEY_ID}"
fi

if [[ "${VULTR_ALLOW_REINSTALL:-}" == "1" ]]; then
  log "Reinstalling instance ${INSTANCE_ID} with SSH key (disk will be wiped)..."
  curl -sS -X POST -H "$(auth_header)" -H 'Content-Type: application/json' \
    -d "$(jq -n --arg id "$SSH_KEY_ID" '{sshkey_id: [$id]}')" \
    "${API}/instances/${INSTANCE_ID}/reinstall" | json_get '.' >/dev/null
  log "Reinstall requested. Wait ~2 minutes, then: ssh -i ${SSH_KEY_PRIV} root@${INSTANCE_IP}"
  exit 0
fi

cat <<EOF

SSH key registered in Vultr account: ${SSH_KEY_ID}
Instance still running without this key authorized.

Choose one non-destructive path:
  1. Vultr portal → ${INSTANCE_IP} → View Console → append key to /root/.ssh/authorized_keys
  2. Re-run with destructive reinstall:
       VULTR_ALLOW_REINSTALL=1 $0

Then test:
  ssh -i ${SSH_KEY_PRIV} root@${INSTANCE_IP}
  ssh -i ${SSH_KEY_PRIV} ubuntu@${INSTANCE_IP}

Deploy:
  ./scripts/deploy/geomode-vultr-remote.ps1
EOF
