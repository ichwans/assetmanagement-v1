#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/logs/cli"
mkdir -p "$LOG_DIR"

CHAINCODE_DIR="$ROOT/sasuke/chaincode/asset-contract"
GATEWAY_DIR="$ROOT/sasuke/gateway"
BACKEND_DIR="$ROOT/minato"
PEER_BIN="$ROOT/sasuke/bin/peer"
ENV_DIR="$ROOT/sasuke"
ENV_FILE="$ENV_DIR/.env"
if [ -f "$ENV_DIR/.env.fabric" ]; then
  ENV_FILE="$ENV_DIR/.env.fabric"
fi

load_env() {
  if [ -f "$ENV_FILE" ]; then
    echo "Loading env from $ENV_FILE"
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

run_capture() {
  local name="$1"
  shift
  local file="$LOG_DIR/${name}.log"
  echo "===== $name captured at $(date -u +'%Y-%m-%dT%H:%M:%SZ') =====" > "$file"
  echo "Running: $*" >> "$file"
  echo "" >> "$file"
  set +e
  "$@" >> "$file" 2>&1
  local rc=$?
  if [ $rc -ne 0 ]; then
    echo "" >> "$file"
    echo "COMMAND FAILED with exit code $rc" >> "$file"
  fi
  set -e
  printf "Captured %s -> %s\n" "$name" "$file"
}

capture_chaincode() {
  echo "[CHAINCODE] Running asset contract unit tests"
  run_capture "chaincode_test" bash -lc "cd '$CHAINCODE_DIR' && go test -v"
}

capture_gateway() {
  echo "[GATEWAY] Running gateway API unit tests"
  run_capture "gateway_api_test" bash -lc "cd '$GATEWAY_DIR' && if [ ! -d node_modules ]; then npm install; fi && npm test"
}

capture_backend() {
  echo "[BACKEND] Running backend Go tests"
  run_capture "backend_go_test" bash -lc "cd '$BACKEND_DIR' && go test ./..."
}

capture_ledger() {
  echo "[LEDGER] Running Fabric peer CLI capture"
  load_env
  if [ ! -x "$PEER_BIN" ]; then
    echo "Fabric peer binary not found or not executable: $PEER_BIN"
    return 1
  fi
  local peer_log="$LOG_DIR/fabric_ledger.log"
  echo "===== ledger CLI captured at $(date -u +'%Y-%m-%dT%H:%M:%SZ') =====" > "$peer_log"
  echo "Using environment file: $ENV_FILE" >> "$peer_log"
  echo "Peer binary: $PEER_BIN" >> "$peer_log"
  echo "" >> "$peer_log"

  set +e
  {
    echo "--- peer version ---"
    "$PEER_BIN" version
    echo ""
    echo "--- peer channel list ---"
    CORE_PEER_TLS_ENABLED=true
    CORE_PEER_LOCALMSPID="${CORE_PEER_LOCALMSPID:-Org1MSP}"
    CORE_PEER_TLS_ROOTCERT_FILE="${CORE_PEER_TLS_ROOTCERT_FILE:-$ROOT/sasuke/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt}"
    CORE_PEER_MSPCONFIGPATH="${CORE_PEER_MSPCONFIGPATH:-$ROOT/sasuke/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp}"
    CORE_PEER_ADDRESS="${CORE_PEER_ADDRESS:-localhost:7051}"
    ORDERER_CA="${ORDERER_CA:-$ROOT/sasuke/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem}"

    export CORE_PEER_TLS_ENABLED CORE_PEER_LOCALMSPID CORE_PEER_TLS_ROOTCERT_FILE CORE_PEER_MSPCONFIGPATH CORE_PEER_ADDRESS ORDERER_CA

    "$PEER_BIN" channel list || true
    echo ""
    if [ -n "${CHANNEL_NAME:-}" ]; then
      echo "--- peer channel getinfo -c $CHANNEL_NAME ---"
      "$PEER_BIN" channel getinfo -c "$CHANNEL_NAME" || true
      echo ""
      echo "--- peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME ---"
      "$PEER_BIN" lifecycle chaincode querycommitted --channelID "$CHANNEL_NAME" || true
      echo ""
    else
      echo "CHANNEL_NAME not set, skipping querycommitted and getinfo"
    fi
    echo "--- peer lifecycle chaincode queryinstalled ---"
    "$PEER_BIN" lifecycle chaincode queryinstalled || true
  } >> "$peer_log" 2>&1
  set -e
  printf "Captured ledger CLI -> %s\n" "$peer_log"
}

print_help() {
  cat <<'EOF'
Usage: capture_cli.sh [all|chaincode|gateway|backend|ledger]

Options:
  all        Run all capture phases
  chaincode  Run chaincode unit tests and capture output
  gateway    Run gateway API tests and capture output
  backend    Run backend Go tests and capture output
  ledger     Run Hyperledger Fabric peer CLI commands and capture output

Logs are written to logs/cli/ under the repository root.
EOF
}

MODE=${1:-all}
case "$MODE" in
  all)
    capture_chaincode
    capture_gateway
    capture_backend
    capture_ledger
    ;;
  chaincode)
    capture_chaincode
    ;;
  gateway)
    capture_gateway
    ;;
  backend)
    capture_backend
    ;;
  ledger)
    capture_ledger
    ;;
  help|-h|--help)
    print_help
    ;;
  *)
    echo "Unknown mode: $MODE"
    print_help
    exit 1
    ;;
esac

cat <<EOF
Capture complete. Logs available in:
  $LOG_DIR
EOF
