#!/usr/bin/env bash
# =============================================================================
# TEST CASE: Registrasi Aset Baru
# =============================================================================
# Deskripsi:
#   Pendaftaran aset dengan atribut lengkap (kategori, unit pemilik, lokasi)
#   berhasil dicatat pada ledger dengan status active, disertai TxID yang
#   tersinkron ke MongoDB.
#
# Skenario:
#   1. Login sebagai admin → dapatkan JWT token
#   2. POST /api/v1/assets → kirim payload aset lengkap
#   3. Verifikasi response: status sukses
#   4. Verifikasi data di MongoDB via GET /api/v1/assets/:id
#      - Status = "active"
#      - TxID != "" (terisi hasil sinkronisasi ledger)
#   5. Verifikasi data di Fabric ledger via Fabric Gateway
#      - Status = "active" di on-chain state
#
# Prasyarat:
#   - Minato (Backend) berjalan di http://localhost:3001
#   - Sasuke Gateway (Fabric) berjalan di http://localhost:3000
#   - Fabric network UP dan chaincode asset-contract ter-deploy
#   - MongoDB accessible
#
# Penggunaan:
#   chmod +x tc_registrasi_aset_baru.sh
#   ./tc_registrasi_aset_baru.sh
# =============================================================================

set -euo pipefail

# ─── Konfigurasi ─────────────────────────────────────────────────────────────
MINATO_BASE="http://localhost:3001/api/v1"
GATEWAY_BASE="http://localhost:3000"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Penghitung
PASS=0
FAIL=0
TOTAL=0

# ─── Fungsi Helper ────────────────────────────────────────────────────────────
log_section() {
  echo ""
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  $1${NC}"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════════════${NC}"
}

log_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

pass() {
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${GREEN}✔ PASS${NC} - $1"
}

fail() {
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${RED}✘ FAIL${NC} - $1"
  echo -e "  ${RED}       Detail: $2${NC}"
}

assert_eq() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$label → \"$actual\""
  else
    fail "$label" "Expected=\"$expected\", Got=\"$actual\""
  fi
}

assert_not_empty() {
  local label="$1"
  local actual="$2"
  if [ -n "$actual" ] && [ "$actual" != "null" ] && [ "$actual" != "" ]; then
    pass "$label → \"$actual\""
  else
    fail "$label" "Expected non-empty, Got=\"$actual\""
  fi
}

assert_http_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$label → HTTP $actual"
  else
    fail "$label" "Expected HTTP $expected, Got HTTP $actual"
  fi
}

# ─── Cek Dependensi ──────────────────────────────────────────────────────────
log_section "Memeriksa Dependensi"

for cmd in curl jq; do
  if command -v "$cmd" &> /dev/null; then
    pass "Command '$cmd' tersedia"
  else
    echo -e "${RED}✘ Command '$cmd' tidak ditemukan. Install dengan: sudo apt install $cmd${NC}"
    exit 1
  fi
done

# ─── STEP 0: Cek Health Service ───────────────────────────────────────────────
log_section "STEP 0 - Cek Ketersediaan Service"

log_step "Cek Minato backend (port 3001)..."
MINATO_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$MINATO_BASE/health" || echo "000")
assert_http_status "Minato /health" "200" "$MINATO_HEALTH_STATUS"

log_step "Cek Sasuke Gateway (port 3000)..."
GATEWAY_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$GATEWAY_BASE/health" || echo "000")
assert_http_status "Sasuke Gateway /health" "200" "$GATEWAY_HEALTH_STATUS"

if [ "$MINATO_HEALTH_STATUS" != "200" ] || [ "$GATEWAY_HEALTH_STATUS" != "200" ]; then
  echo ""
  echo -e "${RED}${BOLD}⚠  Beberapa service tidak dapat dijangkau. Pastikan semua service berjalan sebelum melanjutkan.${NC}"
  echo -e "${YELLOW}   Jalankan: pm2 status${NC}"
  echo ""
fi

# ─── STEP 1: Login & Dapatkan JWT Token ───────────────────────────────────────
log_section "STEP 1 - Autentikasi Admin"

log_step "Login sebagai admin: $ADMIN_EMAIL"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$MINATO_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

LOGIN_HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

echo "  Response HTTP: $LOGIN_HTTP_STATUS"
assert_http_status "POST /auth/login" "200" "$LOGIN_HTTP_STATUS"

JWT_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.data.token // .token // empty' 2>/dev/null || echo "")
if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
  echo -e "${RED}✘ GAGAL mendapatkan JWT token. Periksa kredensial admin.${NC}"
  echo "  Response body: $LOGIN_BODY"
  echo ""
  echo -e "${YELLOW}  Tip: Set environment variable ADMIN_EMAIL dan ADMIN_PASSWORD yang benar:${NC}"
  echo -e "${YELLOW}       ADMIN_EMAIL=admin@domain.com ADMIN_PASSWORD=pass ./tc_registrasi_aset_baru.sh${NC}"
  exit 1
fi

pass "JWT Token berhasil didapatkan → ${JWT_TOKEN:0:30}..."

# ─── STEP 2: Ambil Data Referensi (Kategori & Lokasi) ─────────────────────────
log_section "STEP 2 - Ambil Data Referensi"

log_step "Ambil daftar kategori dari /api/v1/meta/categories..."
CATEGORIES_RESP=$(curl -s -w "\n%{http_code}" "$MINATO_BASE/meta/categories" \
  -H "Authorization: Bearer $JWT_TOKEN")
CAT_HTTP=$(echo "$CATEGORIES_RESP" | tail -n1)
CAT_BODY=$(echo "$CATEGORIES_RESP" | sed '$d')
assert_http_status "GET /meta/categories" "200" "$CAT_HTTP"

# Ambil kategori pertama yang tersedia, atau gunakan default
CATEGORY_ID=$(echo "$CAT_BODY" | jq -r '.data[0].id // .data[0].slug // empty' 2>/dev/null || echo "")
if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" = "null" ]; then
  CATEGORY_ID="elektronik"
  echo "  ⚠  Tidak ada kategori di DB, menggunakan default: $CATEGORY_ID"
else
  echo "  Kategori dipilih: $CATEGORY_ID"
fi

log_step "Ambil daftar lokasi dari /api/v1/meta/locations..."
LOCATIONS_RESP=$(curl -s -w "\n%{http_code}" "$MINATO_BASE/meta/locations" \
  -H "Authorization: Bearer $JWT_TOKEN")
LOC_HTTP=$(echo "$LOCATIONS_RESP" | tail -n1)
LOC_BODY=$(echo "$LOCATIONS_RESP" | sed '$d')
assert_http_status "GET /meta/locations" "200" "$LOC_HTTP"

LOCATION_ID=$(echo "$LOC_BODY" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")
if [ -z "$LOCATION_ID" ] || [ "$LOCATION_ID" = "null" ]; then
  LOCATION_ID="LOC-001"
  echo "  ⚠  Tidak ada lokasi di DB, menggunakan default: $LOCATION_ID"
else
  echo "  Lokasi dipilih: $LOCATION_ID"
fi

# Dapatkan user ID admin (owner unit)
log_step "Ambil profil admin (owner unit ID)..."
ME_RESP=$(curl -s "$MINATO_BASE/me" -H "Authorization: Bearer $JWT_TOKEN")
OWNER_ID=$(echo "$ME_RESP" | jq -r '.data.id // .data.userId // empty' 2>/dev/null || echo "")
if [ -z "$OWNER_ID" ] || [ "$OWNER_ID" = "null" ]; then
  OWNER_ID="user-admin-001"
  echo "  ⚠  Tidak dapat mendapatkan user ID, menggunakan default: $OWNER_ID"
else
  echo "  Owner (Unit Pemilik) ID: $OWNER_ID"
fi

# ─── STEP 3: Registrasi Aset Baru ─────────────────────────────────────────────
log_section "STEP 3 - Registrasi Aset Baru (via Minato)"

TIMESTAMP=$(date +%s)
ASSET_NAME="Laptop Test TC-${TIMESTAMP}"
ASSET_SERIAL="SN-TC-${TIMESTAMP}"
ACQUISITION_DATE=$(date +"%Y-%m-%d")

PAYLOAD=$(jq -n \
  --arg name "$ASSET_NAME" \
  --arg category "$CATEGORY_ID" \
  --arg desc "Aset uji coba test case registrasi - dibuat $(date '+%Y-%m-%d %H:%M:%S')" \
  --arg serial "$ASSET_SERIAL" \
  --arg acqDate "$ACQUISITION_DATE" \
  --argjson price 15000000 \
  --arg vendor "Vendor Test Corp" \
  --arg invoice "INV-TC-${TIMESTAMP}" \
  --arg location "$LOCATION_ID" \
  --arg owner "$OWNER_ID" \
  '{
    name: $name,
    category: $category,
    description: $desc,
    serialNumber: $serial,
    acquisitionDate: $acqDate,
    acquisitionPrice: $price,
    vendor: $vendor,
    invoiceNumber: $invoice,
    location: $location,
    owner: $owner
  }')

echo ""
echo "  Payload yang dikirim:"
echo "$PAYLOAD" | jq .
echo ""

log_step "POST $MINATO_BASE/assets ..."
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$MINATO_BASE/assets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$PAYLOAD")

CREATE_HTTP=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

echo ""
echo "  HTTP Status: $CREATE_HTTP"
echo "  Response Body:"
echo "$CREATE_BODY" | jq . 2>/dev/null || echo "$CREATE_BODY"
echo ""

# ── Verifikasi 3.1: HTTP status sukses
assert_http_status "POST /assets → HTTP 200" "200" "$CREATE_HTTP"

# ── Verifikasi 3.2: Field 'status' di response = success
RESP_STATUS=$(echo "$CREATE_BODY" | jq -r '.status // empty' 2>/dev/null || echo "")
assert_not_empty "Response memiliki field 'status'" "$RESP_STATUS"

# Ambil asset ID yang dibuat
CREATED_ASSET_ID=$(echo "$CREATE_BODY" | jq -r '.data.assetId // empty' 2>/dev/null || echo "")
if [ -z "$CREATED_ASSET_ID" ] || [ "$CREATED_ASSET_ID" = "null" ]; then
  echo -e "${RED}✘ Tidak dapat mengekstrak assetId dari response. Test tidak bisa dilanjutkan.${NC}"
  echo "  Response: $CREATE_BODY"
  exit 1
fi

pass "Asset ID berhasil digenerate → $CREATED_ASSET_ID"

# ── Verifikasi 3.3: Status aset = "active"
CREATED_STATUS=$(echo "$CREATE_BODY" | jq -r '.data.status // empty' 2>/dev/null || echo "")
assert_eq "Status aset = 'active'" "active" "$CREATED_STATUS"

# ─── STEP 4: Tunggu Sinkronisasi Ledger ───────────────────────────────────────
log_section "STEP 4 - Menunggu Sinkronisasi ke Ledger Fabric"

echo -e "  ${YELLOW}Menunggu 5 detik untuk sinkronisasi blockchain...${NC}"
sleep 5

# ─── STEP 5: Verifikasi Data di MongoDB (via Minato GET) ──────────────────────
log_section "STEP 5 - Verifikasi Data di MongoDB (GET /assets/:id)"

log_step "GET $MINATO_BASE/assets/$CREATED_ASSET_ID ..."
GET_RESPONSE=$(curl -s -w "\n%{http_code}" "$MINATO_BASE/assets/$CREATED_ASSET_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

GET_HTTP=$(echo "$GET_RESPONSE" | tail -n1)
GET_BODY=$(echo "$GET_RESPONSE" | sed '$d')

echo ""
echo "  HTTP Status: $GET_HTTP"
echo "  Response Body:"
echo "$GET_BODY" | jq . 2>/dev/null || echo "$GET_BODY"
echo ""

# ── Verifikasi 5.1: Aset ditemukan di MongoDB
assert_http_status "GET /assets/:id → HTTP 200" "200" "$GET_HTTP"

MONGO_ASSET_ID=$(echo "$GET_BODY" | jq -r '.data.assetId // empty' 2>/dev/null || echo "")
assert_eq "assetId cocok di MongoDB" "$CREATED_ASSET_ID" "$MONGO_ASSET_ID"

# ── Verifikasi 5.2: Status di MongoDB = "active"
MONGO_STATUS=$(echo "$GET_BODY" | jq -r '.data.status // empty' 2>/dev/null || echo "")
assert_eq "Status 'active' tersimpan di MongoDB" "active" "$MONGO_STATUS"

# ── Verifikasi 5.3: TxID tersinkron ke MongoDB
MONGO_TX_ID=$(echo "$GET_BODY" | jq -r '.data.txId // empty' 2>/dev/null || echo "")
assert_not_empty "TxID tersinkron ke MongoDB (tidak kosong)" "$MONGO_TX_ID"

# ── Verifikasi 5.4: Atribut kategori tersimpan
MONGO_CATEGORY=$(echo "$GET_BODY" | jq -r '.data.category // empty' 2>/dev/null || echo "")
assert_not_empty "Kategori tersimpan di MongoDB" "$MONGO_CATEGORY"

# ── Verifikasi 5.5: Atribut lokasi tersimpan
MONGO_LOCATION=$(echo "$GET_BODY" | jq -r '.data.location // empty' 2>/dev/null || echo "")
assert_not_empty "Lokasi tersimpan di MongoDB" "$MONGO_LOCATION"

# ── Verifikasi 5.6: Atribut owner (unit pemilik) tersimpan
MONGO_OWNER=$(echo "$GET_BODY" | jq -r '.data.owner // empty' 2>/dev/null || echo "")
assert_not_empty "Owner (unit pemilik) tersimpan di MongoDB" "$MONGO_OWNER"

# ── Verifikasi 5.7: Name sesuai
MONGO_NAME=$(echo "$GET_BODY" | jq -r '.data.name // empty' 2>/dev/null || echo "")
assert_eq "Nama aset tersimpan dengan benar" "$ASSET_NAME" "$MONGO_NAME"

# ─── STEP 6: Verifikasi Data di Fabric Ledger ─────────────────────────────────
log_section "STEP 6 - Verifikasi Data di Fabric Ledger (via Gateway)"

if [ "$GATEWAY_HEALTH_STATUS" = "200" ]; then
  log_step "Query on-chain state via POST $GATEWAY_BASE/api/evaluate ..."
  LEDGER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$GATEWAY_BASE/api/evaluate" \
    -H "Content-Type: application/json" \
    -H "x-fabric-role: admin" \
    -d "{\"function\":\"GetAsset\",\"args\":[\"$CREATED_ASSET_ID\"]}")

  LEDGER_HTTP=$(echo "$LEDGER_RESPONSE" | tail -n1)
  LEDGER_BODY=$(echo "$LEDGER_RESPONSE" | sed '$d')

  echo ""
  echo "  HTTP Status: $LEDGER_HTTP"
  echo "  Response Body:"
  echo "$LEDGER_BODY" | jq . 2>/dev/null || echo "$LEDGER_BODY"
  echo ""

  assert_http_status "Gateway /api/evaluate → HTTP 200" "200" "$LEDGER_HTTP"

  # ── Verifikasi 6.1: Aset ditemukan di ledger
  LEDGER_OK=$(echo "$LEDGER_BODY" | jq -r '.ok // false' 2>/dev/null || echo "false")
  assert_eq "Ledger evaluateTransaction berhasil (ok=true)" "true" "$LEDGER_OK"

  # ── Verifikasi 6.2: assetId di ledger cocok
  LEDGER_ASSET_ID=$(echo "$LEDGER_BODY" | jq -r '.result.assetId // empty' 2>/dev/null || echo "")
  assert_eq "assetId cocok di Fabric ledger" "$CREATED_ASSET_ID" "$LEDGER_ASSET_ID"

  # ── Verifikasi 6.3: Status di ledger = "active"
  LEDGER_STATUS=$(echo "$LEDGER_BODY" | jq -r '.result.status // empty' 2>/dev/null || echo "")
  assert_eq "Status 'active' di Fabric ledger" "active" "$LEDGER_STATUS"

  # ── Verifikasi 6.4: categoryId di ledger
  LEDGER_CATEGORY=$(echo "$LEDGER_BODY" | jq -r '.result.categoryId // empty' 2>/dev/null || echo "")
  assert_not_empty "categoryId tercatat di Fabric ledger" "$LEDGER_CATEGORY"

  # ── Verifikasi 6.5: ownerUnitId di ledger
  LEDGER_OWNER=$(echo "$LEDGER_BODY" | jq -r '.result.ownerUnitId // empty' 2>/dev/null || echo "")
  assert_not_empty "ownerUnitId tercatat di Fabric ledger" "$LEDGER_OWNER"

  # ── Verifikasi 6.6: locationId di ledger
  LEDGER_LOCATION=$(echo "$LEDGER_BODY" | jq -r '.result.locationId // empty' 2>/dev/null || echo "")
  assert_not_empty "locationId tercatat di Fabric ledger" "$LEDGER_LOCATION"

  # ── Verifikasi 6.7: createdAt tidak kosong
  LEDGER_CREATED_AT=$(echo "$LEDGER_BODY" | jq -r '.result.createdAt // empty' 2>/dev/null || echo "")
  assert_not_empty "createdAt (timestamp RFC3339) tercatat di ledger" "$LEDGER_CREATED_AT"

else
  echo -e "  ${YELLOW}⚠  Fabric Gateway tidak dapat dijangkau (port 3000). Verifikasi ledger dilewati.${NC}"
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
fi

# ─── STEP 7: Verifikasi TxID di Ledger (Block Explorer) ──────────────────────
log_section "STEP 7 - Verifikasi TxID Tersinkron ke MongoDB"

if [ -n "$MONGO_TX_ID" ] && [ "$MONGO_TX_ID" != "null" ] && [ "$GATEWAY_HEALTH_STATUS" = "200" ]; then
  log_step "Verifikasi TxID '$MONGO_TX_ID' di blockchain via Gateway..."
  TX_RESP=$(curl -s -w "\n%{http_code}" "$GATEWAY_BASE/api/network/tx/$MONGO_TX_ID" \
    -H "x-fabric-role: admin")

  TX_HTTP=$(echo "$TX_RESP" | tail -n1)
  TX_BODY=$(echo "$TX_RESP" | sed '$d')

  echo ""
  echo "  HTTP Status: $TX_HTTP"
  echo "  Response Body:"
  echo "$TX_BODY" | jq . 2>/dev/null || echo "$TX_BODY"
  echo ""

  assert_http_status "GET /network/tx/:txId → HTTP 200" "200" "$TX_HTTP"

  TX_OK=$(echo "$TX_BODY" | jq -r '.ok // false' 2>/dev/null || echo "false")
  assert_eq "TxID valid di blockchain (ok=true)" "true" "$TX_OK"

  CHAIN_TX_ID=$(echo "$TX_BODY" | jq -r '.tx.txId // empty' 2>/dev/null || echo "")
  assert_eq "TxID di blockchain cocok dengan yang tersimpan di MongoDB" "$MONGO_TX_ID" "$CHAIN_TX_ID"

  VALIDATION_CODE=$(echo "$TX_BODY" | jq -r '.tx.validationCode // empty' 2>/dev/null || echo "")
  assert_eq "Validation code = 0 (VALID)" "0" "$VALIDATION_CODE"
else
  echo -e "  ${YELLOW}⚠  TxID tidak tersedia atau Gateway tidak berjalan. Verifikasi TxID dilewati.${NC}"
fi

# ─── STEP 8: Verifikasi Riwayat Aset ─────────────────────────────────────────
log_section "STEP 8 - Verifikasi Riwayat Aset"

log_step "GET $MINATO_BASE/assets/$CREATED_ASSET_ID/history ..."
HIST_RESPONSE=$(curl -s -w "\n%{http_code}" "$MINATO_BASE/assets/$CREATED_ASSET_ID/history" \
  -H "Authorization: Bearer $JWT_TOKEN")

HIST_HTTP=$(echo "$HIST_RESPONSE" | tail -n1)
HIST_BODY=$(echo "$HIST_RESPONSE" | sed '$d')

echo "  HTTP Status: $HIST_HTTP"
assert_http_status "GET /assets/:id/history → HTTP 200" "200" "$HIST_HTTP"

HIST_COUNT=$(echo "$HIST_BODY" | jq -r '.data | length // 0' 2>/dev/null || echo "0")
if [ "$HIST_COUNT" -gt 0 ]; then
  pass "Riwayat aset tersedia ($HIST_COUNT event)"
else
  fail "Riwayat aset" "Expected > 0 events, Got 0"
fi

# ─── RINGKASAN HASIL ──────────────────────────────────────────────────────────
log_section "RINGKASAN HASIL TEST CASE"

echo ""
echo -e "  Test Case  : ${BOLD}Registrasi Aset Baru${NC}"
echo -e "  Asset ID   : ${BOLD}$CREATED_ASSET_ID${NC}"
echo -e "  Asset Name : ${BOLD}$ASSET_NAME${NC}"
echo -e "  TxID       : ${BOLD}${MONGO_TX_ID:-N/A}${NC}"
echo -e "  Status     : ${BOLD}${MONGO_STATUS:-N/A}${NC}"
echo ""
echo -e "  ┌────────────────────────────────────────┐"
echo -e "  │  ${GREEN}PASS${NC}: ${BOLD}$PASS${NC} / $TOTAL checks"
echo -e "  │  ${RED}FAIL${NC}: ${BOLD}$FAIL${NC} / $TOTAL checks"
echo -e "  └────────────────────────────────────────┘"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✔✔ SEMUA TEST BERHASIL ✔✔${NC}"
  echo -e "  ${GREEN}   Aset berhasil didaftarkan dengan status 'active' pada Fabric ledger${NC}"
  echo -e "  ${GREEN}   dan TxID tersinkron ke MongoDB.${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}${BOLD}✘✘ ADA $FAIL TEST GAGAL ✘✘${NC}"
  echo -e "  ${YELLOW}   Periksa log di atas untuk detail kegagalan.${NC}"
  echo ""
  exit 1
fi
