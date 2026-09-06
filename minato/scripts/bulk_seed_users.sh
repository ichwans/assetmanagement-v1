#!/usr/bin/env bash
set -euo pipefail

# Bulk seed users via API
# Requirements: curl, (optional) jq for robust JSON parsing
# Usage:
#  SERVER_URL=http://localhost:8080 \
#  ADMIN_EMAIL=admin@assethub.com \
#  ADMIN_PASSWORD=Secret123 \
#  CSV_PATH=server/scripts/users.csv \
#  ./server/scripts/bulk_seed_users.sh

: "${SERVER_URL:=http://localhost:8080}"
: "${CSV_PATH:?CSV_PATH is required}"
DRY_RUN=${DRY_RUN:-0}
if [[ "$DRY_RUN" != "1" ]]; then
  : "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
  : "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"
fi

login_payload() {
  cat <<JSON
{"email":"${ADMIN_EMAIL}","password":"${ADMIN_PASSWORD}"}
JSON
}

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 -> Skipping login. Will print actions only."
else
  echo "Logging in to ${SERVER_URL} as ${ADMIN_EMAIL} ..."
LOGIN_RESP=$(curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d "$(login_payload)" \
  "${SERVER_URL}/api/v1/auth/login")

if command -v jq >/dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.token // empty')
else
  # naive extraction if jq not present
  TOKEN=$(echo "$LOGIN_RESP" | sed -n 's/.*"token"\s*:\s*"\([^"]\+\)".*/\1/p')
fi

if [[ -z "${TOKEN}" ]]; then
  echo "Failed to obtain token. Response: ${LOGIN_RESP}" >&2
  exit 1
fi

echo "Token acquired. Seeding users from ${CSV_PATH} ..."
fi

COUNT_TOTAL=0
COUNT_OK=0
COUNT_FAIL=0
TOKEN=${TOKEN:-}

# Skip header; CSV columns: fullName,email,password,userType
tail -n +2 "$CSV_PATH" | while IFS=, read -r FULLNAME EMAIL PASSWORD USERTYPE; do
  FULLNAME=${FULLNAME-}
  EMAIL=${EMAIL-}
  PASSWORD=${PASSWORD-}
  USERTYPE=${USERTYPE-}
  COUNT_TOTAL=$((COUNT_TOTAL+1))
  FULLNAME_TRIM=$(echo "$FULLNAME" | xargs)
  EMAIL_TRIM=$(echo "$EMAIL" | xargs)
  PASSWORD_TRIM=$(echo "$PASSWORD" | xargs)
  USERTYPE_TRIM=$(echo "$USERTYPE" | xargs)

  if [[ -z "$FULLNAME_TRIM" || -z "$EMAIL_TRIM" || -z "$PASSWORD_TRIM" || -z "$USERTYPE_TRIM" ]]; then
    echo "[${COUNT_TOTAL}] Skipped (incomplete row): $FULLNAME,$EMAIL,$USERTYPE" >&2
    COUNT_FAIL=$((COUNT_FAIL+1))
    continue
  fi

  CREATE_PAYLOAD=$(printf '{"fullName":"%s","email":"%s","password":"%s","userType":"%s"}' \
    "$FULLNAME_TRIM" "$EMAIL_TRIM" "$PASSWORD_TRIM" "$USERTYPE_TRIM")

  # Call API or dry-run
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[${COUNT_TOTAL}] DRY -> Would create ${EMAIL_TRIM} (${USERTYPE_TRIM})"
    COUNT_OK=$((COUNT_OK+1))
  else
    RESP=$(curl -s -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H 'Content-Type: application/json' \
      -d "$CREATE_PAYLOAD" \
      "${SERVER_URL}/api/v1/users")

    if command -v jq >/dev/null 2>&1; then
      STATUS=$(echo "$RESP" | jq -r '.status // empty')
      MSG=$(echo "$RESP" | jq -r '.message // empty')
    else
      STATUS=$(echo "$RESP" | sed -n 's/.*"status"\s*:\s*"\([^"]\+\)".*/\1/p')
      MSG=$(echo "$RESP" | sed -n 's/.*"message"\s*:\s*"\([^"]\+\)".*/\1/p')
    fi

    if [[ "$STATUS" == "AP00000" ]]; then
      echo "[${COUNT_TOTAL}] OK  -> ${EMAIL_TRIM} (${USERTYPE_TRIM})"
      COUNT_OK=$((COUNT_OK+1))
    else
      echo "[${COUNT_TOTAL}] ERR -> ${EMAIL_TRIM} (${USERTYPE_TRIM}) :: ${STATUS} ${MSG}" >&2
      COUNT_FAIL=$((COUNT_FAIL+1))
    fi
  fi

done

echo "Seed complete. Total: ${COUNT_TOTAL}, OK: ${COUNT_OK}, Fail: ${COUNT_FAIL}"
echo "Seed complete. Total: ${COUNT_TOTAL}, OK: ${COUNT_OK}, Fail: ${COUNT_FAIL}"
