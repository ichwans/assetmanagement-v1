# Product Requirements Document (PRD)
## Asset Hub — Sistem Manajemen Aset

**Versi:** 1.0
**Tanggal:** 4 September 2026
**Status:** Draft
**Pemilik Produk:** Tim Development Asset Hub

---

## 1. Gambaran Produk

### 1.1 Ringkasan Produk

**Asset Hub** adalah sistem manajemen aset (*Asset Management System/AMS*) berbasis web yang dirancang untuk mengelola seluruh siklus hidup aset secara terpusat. Sistem ini mengintegrasikan pencatatan aset konvensional dengan teknologi blockchain (Hyperledger Fabric) untuk menjamin transparansi, ketidakubahan (*immutability*), dan jejak audit (*audit trail*) yang lengkap pada setiap transaksi aset.

Sistem ini memungkinkan organisasi untuk mencatat, melacak, memindahkan, merawat, dan menghapus aset dengan alur kerja persetujuan yang jelas serta visibilitas penuh melalui QR code dan explorer blockchain.

### 1.2 Latar Belakang & Motivasi

Banyak organisasi menghadapi tantangan dalam:
- Melacak lokasi dan kepemilikan aset secara real-time
- Menjamin keaslian dan ketidakubahan catatan aset
- Mengelola persetujuan transfer dan penghapusan aset secara efisien
- Menyimpan dokumen pendukung aset secara terpusat dan aman

Asset Hub dibangun untuk menjawab tantangan tersebut dengan menggabungkan REST API modern, UI yang intuitif, dan ledger blockchain yang transparan.

### 1.3 Tujuan Produk

| Tujuan | Deskripsi |
|--------|-----------|
| **Sentralisasi** | Mengelola semua data aset dalam satu platform terpadu |
| **Transparansi** | Menyediakan catatan transaksi yang tidak dapat diubah via blockchain |
| **Efisiensi** | Memangkas waktu proses persetujuan dan pencatatan manual |
| **Akuntabilitas** | Menjamin jejak audit lengkap pada setiap perubahan aset |
| **Aksesibilitas** | Memungkinkan lookup aset cepat melalui QR code |
| **Keamanan** | Implementasi autentikasi JWT dan role-based access control |

---

## 2. Arsitektur Sistem

### 2.1 Komponen Utama

| Komponen | Teknologi | Lokasi | Port Default |
|----------|-----------|--------|--------------|
| **Frontend (Orochimaru)** | React 18 + TypeScript + Vite + Tailwind CSS | `/orochimaru` | 5173 (dev) |
| **Backend API (Minato)** | Go 1.22 + Echo v4 + MongoDB | `/minato` | 8080 |
| **Blockchain Network (Sasuke)** | Hyperledger Fabric 2.5 + IPFS | `/sasuke` | 3000 (gateway), 5001 (IPFS) |
| **Blockchain Explorer** | Hyperledger Explorer | - | 8090 |

### 2.2 Arsitektur Data Flow

```
┌─────────────────────┐
│   Frontend (React)  │  ←→  REST API
└────────┬────────────┘
         │                  ┌─────────────────┐
         │                  │  Backend (Go)   │
         │                  │  Echo Server    │
         │                  └────────┬────────┘
         │                           │
         │         ┌─────────────────┼─────────────────┐
         │         │                 │                 │
         │         ▼                 ▼                 ▼
         │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
         │  │   MongoDB   │  │ IPFS Storage│  │ Fabric Gateway  │
         │  │ (Database)  │  │  (Files)    │  │   (Node.js)     │
         │  └─────────────┘  └─────────────┘  └────────┬────────┘
         │                                               │
         │                                               ▼
         │                                    ┌─────────────────────┐
         │                                    │ Hyperledger Fabric  │
         │                                    │  (Blockchain Ledger)│
         │                                    └─────────────────────┘
```

### 2.3 Teknologi Stack

#### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI)
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router DOM 6
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **QR Code:** qrcode.react + html5-qrcode
- **Icons:** Lucide React

#### Backend
- **Bahasa:** Go 1.22
- **Framework:** Echo v4
- **Database:** MongoDB (via Go MongoDB Driver)
- **Authentication:** JWT (golang-jwt/jwt)
- **Validation:** go-playground/validator
- **Logging:** Logrus
- **Configuration:** Viper

#### Blockchain
- **Framework:** Hyperledger Fabric 2.5
- **Chaincode:** Go (fabric-contract-api-go)
- **File Storage:** IPFS
- **REST Gateway:** Node.js Express
- **Explorer:** Hyperledger Explorer

---

## 3. Entitas & Model Data

### 3.1 Asset (Aset)

| Field | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `AssetID` | string | ID unik aset | `AST-001` |
| `Name` | string | Nama aset | `Laptop Lenovo ThinkPad X1` |
| `Category` | string | Kategori aset | `laptop`, `proyektor`, `kendaraan`, `furniture`, `elektronik`, `lainnya` |
| `Description` | string | Deskripsi detail | - |
| `SerialNumber` | string | Nomor seri | `SN-2024-001` |
| `Owner` | string | User ID pemilik | - |
| `OwnerName` | string | Nama pemilik | - |
| `Location` | string | ID lokasi | `LOC-001` |
| `LocationDetail` | string | Detail lokasi | `Ruang Server Lantai 3` |
| `Status` | string | Status saat ini | `active`, `borrowed`, `maintenance`, `disposed`, `transfer_pending` |
| `AcquisitionDate` | string | Tanggal perolehan | `2024-01-15` |
| `AcquisitionPrice` | float | Harga perolehan | `15000000` |
| `Vendor` | string | Vendor/supplier | `PT Teknologi Nusantara` |
| `InvoiceNumber` | string | Nomor invoice | `INV-2024-001` |
| `TxID` | string | ID transaksi blockchain | - |
| `BlockNumber` | int | Nomor blok | `42` |
| `CreatedAt` | datetime | Tanggal dibuat | - |
| `UpdatedAt` | datetime | Tanggal diupdate | - |

### 3.2 Asset History (Riwayat Aset)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `ID` | string | ID unik event |
| `AssetID` | string | ID aset terkait |
| `EventType` | string | Tipe event: `create`, `assign`, `transfer`, `maintenance`, `maintenance_complete`, `return`, `dispose` |
| `Date` | string | Tanggal event |
| `Description` | string | Deskripsi event |
| `Details` | map | Detail tambahan |
| `TxID` | string | ID transaksi blockchain |
| `BlockNumber` | int | Nomor blok |

### 3.3 Asset Maintenance (Perawatan Aset)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `ID` | string | ID unik record |
| `AssetID` | string | ID aset |
| `Type` | string | Tipe: `routine`, `repair`, `upgrade`, `calibration` |
| `Date` | string | Tanggal perawatan |
| `Notes` | string | Catatan |
| `Cost` | float | Biaya (Rupiah) |
| `Technician` | string | Teknisi |
| `Vendor` | string | Vendor perawatan |
| `TxID` | string | ID transaksi blockchain |
| `BlockNumber` | int | Nomor blok |

### 3.4 Asset Document (Dokumen Aset)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `ID` | string | ID dokumen (MongoDB ObjectID) |
| `AssetID` | string | ID aset |
| `FileName` | string | Nama file |
| `Type` | string | Tipe: `image`, `invoice`, `warranty`, `berita_acara`, `maintenance_receipt`, `handover_borrow`, `handover_return` |
| `IpfsCID` | string | IPFS Content ID |
| `HashSHA256` | string | Hash SHA-256 file |
| `UploadedBy` | string | User ID pengunggah |
| `CreatedAt` | datetime | Tanggal diupload |

### 3.5 Approval (Persetujuan)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `ID` | string | ID unik approval |
| `Type` | string | Tipe: `transfer`, `dispose` |
| `AssetID` | string | ID aset |
| `AssetName` | string | Nama aset |
| `RequesterID` | string | User ID pemohon |
| `RequesterName` | string | Nama pemohon |
| `ToUnit` | string | Unit tujuan |
| `FromUnit` | string | Unit asal |
| `Reason` | string | Alasan |
| `TransferType` | string | Tipe transfer: `borrow`, `permanent` |
| `ToOwnerID` | string | ID penerima aset |
| `ToLocationID` | string | ID lokasi tujuan |
| `Status` | string | Status: `PENDING`, `APPROVED`, `REJECTED` |
| `Notes` | array | Catatan persetujuan |
| `CreatedAt` | datetime | Tanggal dibuat |

### 3.6 User (Pengguna)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `ID` | ObjectID | ID MongoDB |
| `FullName` | string | Nama lengkap |
| `Email` | string | Email (login) |
| `UserType` | string | Peran pengguna |
| `Status` | string | Status: `active`, `inactive` |
| `CreatedAt` | datetime | Tanggal dibuat |
| `UpdatedAt` | datetime | Tanggal diupdate |

---

## 4. Peran & Hak Akses

### 4.1 Daftar Peran

| Peran | Kode | Deskripsi |
|-------|------|-----------|
| Administrator | `admin` | Akses penuh ke semua fitur |
| Admin Aset | `admin_asset` | Administrator pengelolaan aset |
| Staff | `staff` | Pegawai reguler |
| Pembelian | `purchasing` | Departemen pembelian |
| Kepala Unit | `head_unit` | Persetujuan di tingkat unit |
| Auditor | `auditor` | Akses audit (blockchain explorer) |
| User | `user` | Akses dasar |

### 4.2 Matriks Hak Akses

| Fitur | Admin | Admin Asset | Staff | Purchasing | Head Unit | Auditor | User |
|-------|-------|-------------|-------|------------|-----------|---------|------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat Daftar Aset | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat Detail Aset | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Membuat Aset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Aset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transfer Aset | ✅ | ✅ | ⚠️ (return only) | ❌ | ❌ | ❌ | ❌ |
| Pemeliharaan Aset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Penghapusan Aset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Persetujuan | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Blockchain Explorer | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Laporan | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kelola Pengguna | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Import Data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pengaturan | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Procurement | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| My Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifikasi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scan QR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Fitur-Fitur Utama

### 5.1 Dashboard

**Deskripsi:** Halaman utama setelah login yang menampilkan ringkasan statustik dan aktivitas aset.

**Komponen yang Ditampilkan:**
- **Stat Cards** — Total aset, aset aktif, aset dalam pemeliharaan, aset dipinjam
- **Asset Table** — Tabel aset terbaru dengan filter
- **Charts** — Grafik distribusi aset berdasarkan kategori
- **Quick Actions** — Pintasan ke fitur utama (Tambah Aset, Scan QR, Persetujuan)
- **Attention List** — Aset yang memerlukan perhatian (maintenance overdue, dll.)
- **Recent Activity** — Feed aktivitas terbaru

**Akses:** Semua role terautentikasi

---

### 5.2 Manajemen Aset (CRUD)

**Deskripsi:** Fungsionalitas lengkap untuk mengelola data aset.

**Operasi:**

| Operasi | Endpoint | Metode | Akses |
|---------|----------|--------|-------|
| Daftar Aset | `/api/v1/assets` | GET | Semua role |
| Detail Aset | `/api/v1/assets/:id` | GET | Semua role |
| Riwayat Aset | `/api/v1/assets/:id/history` | GET | Semua role |
| Buat Aset | `/api/v1/assets` | POST | Admin, Admin Asset |
| Update Status | `/api/v1/assets/:id/status` | POST | Admin, Admin Asset |

**Filter & Pencarian:**
- Pencarian berdasarkan nama, ID aset, nomor seri
- Filter berdasarkan kategori
- Filter berdasarkan lokasi
- Filter berdasarkan status

**Data yang Dicatat:**
- Informasi dasar (nama, kategori, deskripsi, nomor seri)
- Informasi kepemilikan (pemilik, lokasi)
- Informasi finansial (tanggal perolehan, harga, vendor, nomor invoice)
- Blockchain hash (TxID, BlockNumber) — immutable

---

### 5.3 Transfer Aset

**Deskripsi:** Memindahkan aset dari satu pengguna/lokasi ke pengguna/lokasi lain.

**Tipe Transfer:**
- **Borrow** — Peminjaman sementara dengan tanggal kembali yang diharapkan
- **Permanent** — Perpindahan kepemilikan permanen

**Alur Kerja:**
1. Requester membuat permintaan transfer via `/api/v1/approvals/transfer`
2. Sistem membuat approval request dengan status `PENDING`
3. Head Unit atau Admin review dan approve/reject via `/api/v1/approvals/:id/decision`
4. Jika disetujui, status aset berubah dan event dicatat di blockchain
5. Staff dapat melakukan return aset

**Akses:**
- Admin & Admin Asset: dapat membuat transfer
- Staff: hanya bisa return aset yang dipinjamnya
- Head Unit: dapat approve/reject dalam unitnya

---

### 5.4 Pemeliharaan Aset

**Deskripsi:** Mencatat aktivitas perawatan dan perbaikan aset.

**Tipe Pemeliharaan:**
- `routine` — Perawatan rutin terjadwal
- `repair` — Perbaikan
- `upgrade` — Peningkatan/upgrade
- `calibration` — Kalibrasi

**Data yang Dicatat:**
- Tanggal pemeliharaan
- Tipe pemeliharaan
- Catatan technician
- Biaya pemeliharaan (dalam Rupiah)
- Vendor техники
- Teknisi

**Status Aset:** Saat pemeliharaan, status aset berubah menjadi `maintenance`

**Endpoint:**
| Operasi | Endpoint | Metode |
|---------|----------|--------|
| Lihat Riwayat | `/api/v1/assets/:id/maintenance` | GET |
| Tambah Record | `/api/v1/assets/:id/maintenance` | POST |
| Selesaikan | `/api/v1/assets/:id/maintenance/complete` | POST |

---

### 5.5 Penghapusan Aset (Disposal)

**Deskripsi:** Proses penghapusan aset dari daftar aset aktif.

**Alur Kerja:**
1. Admin/Admin Asset membuat permintaan penghapusan via `/api/v1/approvals/dispose`
2. Approval request dengan status `PENDING`
3. Head Unit atau Admin mereview dan approve/reject
4. Jika disetujui, status aset berubah menjadi `disposed`
5. Asset tidak lagi计入 dalam statistik aktif

---

### 5.6 Persetujuan (Approvals)

**Deskripsi:** Sistem persetujuan multi-level untuk transfer dan penghapusan aset.

**Tipe Approval:**
- `transfer` — Persetujuan perpindahan aset
- `dispose` — Persetujuan penghapusan aset

**Alur Persetujuan:**
```
Request Created → PENDING → Approved/Rejected
```

**Endpoint:**
| Operasi | Endpoint | Metode |
|---------|----------|--------|
| Daftar Approvals | `/api/v1/approvals` | GET |
| Detail Approval | `/api/v1/approvals/:id` | GET |
| Keputusan | `/api/v1/approvals/:id/decision` | POST |

**Akses:** Admin, Admin Asset, Head Unit

---

### 5.7 QR Code & Scanner

**Deskripsi:** Generate dan scan QR code untuk identifikasi aset cepat.

**Generate QR Code:**
- QR code dihasilkan per aset berisi informasi ID aset
- Ditampilkan di halaman detail aset dan halaman publik aset

**Scan QR Code:**
- Halaman publik: `/scan` — dapat diakses tanpa login
- Lookup aset berdasarkan QR code
- Redirect ke halaman publik detail aset: `/asset/:assetId/public`

**Akses:** Semua role terautentikasi + publik (scan/read only)

---

### 5.8 Dokumen Aset

**Deskripsi:** Mengunggah dan mengelola dokumen pendukung aset dengan penyimpanan IPFS.

**Tipe Dokumen:**
| Tipe | Deskripsi |
|------|-----------|
| `image` | Foto aset |
| `invoice` | Faktur pembelian |
| `warranty` | Kartu garansi |
| `berita_acara` | Berita acara |
| `maintenance_receipt` | Kwitansi pemeliharaan |
| `handover_borrow` | Serah terima pinjam |
| `handover_return` | Serah terima kembali |

**Spesifikasi Upload:**
- Format: JPG, PNG, WEBP, PDF
- Maksimum ukuran: 5MB

**Alur Upload:**
1. Frontend kirim file via `multipart/form-data`
2. Backend upload ke IPFS, terima IPFS CID
3. Backend compute SHA-256 hash
4. Metadata disimpan di MongoDB
5. File dapat diakses via IPFS gateway

**Endpoint:**
| Operasi | Endpoint | Metode |
|---------|----------|--------|
| Lihat Dokumen | `/api/v1/assets/:id/documents` | GET |
| Tambah Metadata | `/api/v1/assets/:id/documents` | POST |
| Upload File | `/api/v1/assets/:id/documents/upload` | POST |

---

### 5.9 Blockchain Explorer

**Deskripsi:** Antarmuka untuk menjelajahi data blockchain (Hyperledger Fabric).

**Fitur:**
- **Network Summary** — Ringkasan jaringan blockchain
- **Chain Info** — Informasi blockchain (jumlah blok, hash rate, dll.)
- **Block Details** — Lihat detail blok berdasarkan nomor
- **Transaction Details** — Lihat detail transaksi berdasarkan TxID
- **Asset Lookup by Tx** — Cari blok berdasarkan TxID

**Endpoint:**
| Endpoint | Deskripsi |
|----------|-----------|
| `/api/v1/explorer/summary` | Ringkasan jaringan |
| `/api/v1/explorer/chaininfo` | Info blockchain |
| `/api/v1/explorer/block/:num` | Detail blok |
| `/api/v1/explorer/tx/:txId` | Detail transaksi |
| `/api/v1/explorer/blockByTx/:txId` | Blok by TxID |

**Akses:** Admin, Admin Asset, Auditor

---

### 5.10 Kategori & Lokasi

**Deskripsi:** Master data kategori dan lokasi aset.

**Kategori Default:**
| Kode | Nama |
|------|------|
| `laptop` | Laptop/Komputer |
| `proyektor` | Proyektor |
| `kendaraan` | Kendaraan |
| `furniture` | Furnitur |
| `elektronik` | Elektronik |
| `lainnya` | Lainnya |

**Endpoint:**
| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/v1/meta/categories` | Daftar kategori |
| `GET /api/v1/meta/locations` | Daftar lokasi |

---

### 5.11 Notifikasi

**Deskripsi:** Sistem notifikasi untuk mengingatkan pengguna tentang aktivitas aset.

**Fitur:**
- Daftar notifikasi dengan status read/unread
- Tandai satu notifikasi sebagai dibaca
- Tandai semua notifikasi sebagai dibaca
- Admin dapat membuat notifikasi baru

**Endpoint:**
| Endpoint | Metode | Deskripsi |
|----------|--------|-----------|
| `/api/v1/notifications` | GET | Daftar notifikasi |
| `/api/v1/notifications/mark-read` | POST | Tandai dibaca |
| `/api/v1/notifications/mark-all-read` | POST | Tandai semua dibaca |
| `/api/v1/notifications` | POST | Buat notifikasi (Admin) |

---

### 5.12 Kelola Pengguna

**Deskripsi:** Manajemen user oleh administrator.

**Fitur:**
- Create user baru
- Daftar semua pengguna
- Lihat detail pengguna
- Update data pengguna
- Ubah status pengguna (active/inactive)

**Endpoint:**
| Endpoint | Metode | Akses |
|----------|--------|-------|
| `/api/v1/users` | GET, POST | Admin |
| `/api/v1/users/:id` | GET, PATCH | Admin |
| `/api/v1/users/:id/status` | POST | Admin |

---

### 5.13 Autentikasi & Otorisasi

**Deskripsi:** Sistem login dan manajemen sesi.

**Fitur:**
- Login dengan email & password
- Forgot password (request reset)
- Reset password dengan token
- Change password sendiri
- JWT-based authentication

**Endpoint:**
| Endpoint | Metode | Akses |
|----------|--------|-------|
| `/api/v1/auth/login` | POST | Publik |
| `/api/v1/auth/forgot-password` | POST | Publik |
| `/api/v1/auth/reset-password` | POST | Publik |
| `/api/v1/me` | GET | Authenticated |
| `/api/v1/me/password` | POST | Authenticated |

---

### 5.14 Laporan & Import

**Deskripsi:** Fitur pelaporan dan impor data.

**Laporan:**
- Generate laporan aset
- Filter berdasarkan berbagai kriteria
- Ekspor laporan

**Import:**
- Import aset dari file CSV
- Bulk import data aset

**Akses Laporan:** Admin only
**Akses Import:** Admin only

---

### 5.15 Procurement

**Deskripsi:** Modul pengelolaan pengadaan aset.

**Akses:** Admin, Admin Asset, Purchasing

**Halaman:**
- `/procurements` — Daftar pengadaan
- `/procurements/:id` — Detail pengadaan

---

## 6. API Specification

### 6.1 Response Format

Semua response API mengikuti format envelope berikut:

```json
{
  "status": "AP00000",
  "message": "Success",
  "data": { ... },
  "errors": []
}
```

### 6.2 Status Code

| Code | Arti |
|------|------|
| `AP00000` | Success |
| `AP00400` | Bad Request |
| `AP00401` | Unauthorized |
| `AP00403` | Forbidden |
| `AP00404` | Not Found |
| `AP00409` | Conflict |
| `AP00422` | Unprocessable Entity |
| `AP00500` | Internal Server Error |
| `AP99999` | Unknown Error |

### 6.3 Daftar Endpoint Lengkap

#### Health & Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/forgot-password` | Request reset password |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/me` | Get current user profile |
| POST | `/api/v1/me/password` | Change password |

#### Users
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/users/:id` | Get user detail |
| PATCH | `/api/v1/users/:id` | Update user |
| POST | `/api/v1/users/:id/status` | Change user status |

#### Assets
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/assets` | List assets (filterable) |
| GET | `/api/v1/assets/:id` | Get asset detail |
| GET | `/api/v1/assets/:id/history` | Get asset history |
| GET | `/api/v1/assets/:id/maintenance` | Get maintenance records |
| GET | `/api/v1/assets/:id/documents` | Get documents |
| POST | `/api/v1/assets/:id/documents` | Add document metadata |
| POST | `/api/v1/assets/:id/documents/upload` | Upload file |
| POST | `/api/v1/assets/:id/status` | Change asset status |
| POST | `/api/v1/assets` | Create asset |
| POST | `/api/v1/assets/:id/maintenance` | Add maintenance record |
| POST | `/api/v1/assets/:id/maintenance/complete` | Complete maintenance |

#### Meta
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/meta/categories` | List categories |
| GET | `/api/v1/meta/locations` | List locations |

#### Approvals
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/approvals` | List approvals |
| GET | `/api/v1/approvals/:id` | Get approval detail |
| POST | `/api/v1/approvals/:id/decision` | Approve/reject |
| POST | `/api/v1/approvals/transfer` | Create transfer approval |
| POST | `/api/v1/approvals/dispose` | Create dispose approval |

#### Notifications
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/notifications` | List notifications |
| POST | `/api/v1/notifications/mark-read` | Mark as read |
| POST | `/api/v1/notifications/mark-all-read` | Mark all as read |
| POST | `/api/v1/notifications` | Create notification |

#### Dashboard
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| GET | `/api/v1/dashboard/assets-by-category` | Assets by category |
| GET | `/api/v1/dashboard/recent-activity` | Recent activity |

#### Explorer
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/explorer/summary` | Network summary |
| GET | `/api/v1/explorer/chaininfo` | Blockchain info |
| GET | `/api/v1/explorer/block/:num` | Block details |
| GET | `/api/v1/explorer/tx/:txId` | Transaction details |
| GET | `/api/v1/explorer/blockByTx/:txId` | Block by TxID |

#### Files
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/files/:cid` | Get file by IPFS CID |
| GET | `/api/v1/files/signed` | Get signed URL |

#### Seed (Development)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/seed/categories` | Seed categories |
| POST | `/api/v1/seed/locations` | Seed locations |
| POST | `/api/v1/seed/assets` | Seed assets |
| POST | `/api/v1/seed/assets/history` | Seed asset history |
| POST | `/api/v1/seed/assets/maintenance` | Seed maintenance |
| POST | `/api/v1/seed/assets/documents` | Seed documents |
| POST | `/api/v1/seed/approvals` | Seed approvals |
| POST | `/api/v1/seed/notifications` | Seed notifications |

#### Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/admin/reset/assets` | Reset all assets |
| POST | `/api/v1/admin/reset/meta` | Reset meta data |

---

## 7. Rute Frontend

| Route | Komponen | Akses |
|-------|----------|-------|
| `/login` | Login | Publik |
| `/forgot-password` | ForgotPassword | Publik |
| `/reset-password` | ResetPassword | Publik |
| `/scan` | ScanQR | Publik |
| `/asset/:assetId/public` | PublicAssetView | Publik (read only) |
| `/` | Dashboard | Authenticated |
| `/profile` | Profile | Authenticated |
| `/assets` | Assets | Authenticated |
| `/assets/:assetId` | AssetDetail | Authenticated |
| `/assets/:assetId/history` | AssetHistory | Authenticated |
| `/assets/create` | AssetCreate | Admin only |
| `/assets/:assetId/transfer` | AssetTransfer | Admin only |
| `/assets/:assetId/maintenance` | AssetMaintenance | Admin only |
| `/assets/:assetId/dispose` | AssetDispose | Admin only |
| `/assets/:assetId/return` | AssetTransfer (return) | Staff |
| `/approvals` | Approvals | Admin, Admin Asset, Head Unit |
| `/approvals/:id` | ApprovalDetail | Admin, Admin Asset, Head Unit |
| `/explorer` | Explorer | Admin, Admin Asset, Auditor |
| `/reports` | Reports | Admin only |
| `/users` | Users | Admin only |
| `/import` | Import | Admin only |
| `/settings` | Settings | Admin only |
| `/notifications` | Notifications | Authenticated |
| `/my-assets` | MyAssets | Staff, Purchasing, User |
| `/procurements` | Procurements | Purchasing, Admin, Admin Asset |

---

## 8. Konfigurasi Environment

### 8.1 Frontend (.env)

| Variable | Deskripsi |
|----------|-----------|
| `VITE_API_BASE` | Backend URL ( kosong untuk proxy) |
| `VITE_PROXY_TARGET` | Dev proxy target |
| `VITE_IPFS_GATEWAY` | IPFS gateway URL |
| `VITE_EXPLORER_URL` | Blockchain explorer URL |

### 8.2 Backend (.env)

| Variable | Deskripsi |
|----------|-----------|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB connection string |
| `FABRIC_GATEWAY_URL` | Fabric gateway URL |
| `IPFS_API` | IPFS API URL |
| `JWT_SECRET` | JWT signing secret |

### 8.3 Fabric Gateway (.env)

| Variable | Deskripsi |
|----------|-----------|
| `FABRIC_MSP_ID` | MSP ID (e.g., Org1MSP) |
| `FABRIC_CCP_PATH` | Connection profile path |
| `FABRIC_WALLET_PATH` | Wallet path |
| `FABRIC_CHANNEL` | Channel name |
| `FABRIC_CHAINCODE` | Chaincode name |

---

## 9. Siklus Hidup Aset

```
┌─────────────┐
│  PROCUREMENT │ (Purchasing membuat permintaan)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   CREATE    │ (Admin/Admin Asset mendaftarkan aset)
└──────┬──────┘
       │  ─────────────────────────────────────────
       │       TxID + BlockNumber dicatat di blockchain
       ▼
┌─────────────┐
│   ACTIVE    │ (Aset digunakan oleh pemilik)
└──────┬──────┘
       │
       ├────────────────────────────────────────┐
       │                                        │
       ▼                                        ▼
┌─────────────┐                         ┌─────────────┐
│  BORROWED   │                         │ MAINTENANCE │
│(Pinjam oleh│                         │(Dalam proses│
│  staff lain)│                         │ pemeliharaan)│
└──────┬──────┘                         └──────┬──────┘
       │                                        │
       │ (Return)                               │ (Complete)
       ▼                                        ▼
┌─────────────┐                         ┌─────────────┐
│   ACTIVE    │                         │   ACTIVE    │
└─────────────┘                         └─────────────┘

       │
       ▼
┌─────────────────────┐
│  TRANSFER_PENDING   │ (Pengajuan transfer)
└──────┬──────────────┘
       │
       ├──────────────────┐
       │ Disetujui        │ Ditolak
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   ACTIVE     │    │   ACTIVE    │
│(Pemilik baru)│    │(Tetap di    │
│              │    │ pemililk asli│
└─────────────┘    └─────────────┘

       │
       ▼
┌─────────────────────┐
│    DISPOSE_PENDING   │ (Pengajuan hapus)
└──────┬──────────────┘
       │
       ├──────────────────┐
       │ Disetujui        │ Ditolak
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   DISPOSED  │    │   ACTIVE    │
│(Dihapus dari│    │(Tetap aktif)│
│  inventaris)│    └─────────────┘
└─────────────┘
```

---

## 10. Integrasi Blockchain

### 10.1 Apa yang Dicatat di Blockchain

Setiap event berikut dicatat ke Hyperledger Fabric:

| Event | Chaincode Function | Data |
|-------|-------------------|------|
| Pembuatan Aset | `CreateAsset` | ID, nama, pemilik, lokasi, harga |
| Perpindahan Aset | `TransferAsset` | ID, dari, ke, tanggal |
| Pemeliharaan | `UpdateMaintenance` | ID, tipe, biaya, teknisi |
| Penghapusan | `DisposeAsset` | ID, alasan, tanggal |

### 10.2 Chaincode (Asset Contract)

**Lokasi:** `/sasuke/chaincode/asset-contract/`
**Bahasa:** Go (fabric-contract-api-go)
**Fungsi Utama:**
- `CreateAsset` — Membuat catatan aset baru di ledger
- `GetAssetHistory` — Mengambil riwayat transaksi aset
- `UpdateMaintenance` — Memperbarui record pemeliharaan

### 10.3 Fabric Gateway

**Lokasi:** `/sasuke/gateway/`
**Teknologi:** Node.js Express
**Port:** 3000

**Endpoints:**
- `POST /api/evaluate` — Query ke chaincode (read-only)
- `POST /api/submit` — Submit transaksi (write)
- `GET /api/network/chaininfo` — Info blockchain (QSCC)
- `GET /api/network/block/:num` — Data blok
- `GET /api/network/tx/:txId` — Data transaksi

### 10.4 IPFS Integration

**Fungsi:** Menyimpan file/dokumen secara terdesentralisasi
**Konfigurasi:**
- API Port: 5001
- Gateway Port: 8080
- Web UI: 5001/webui
- Cluster API: 9094

**Alur Upload:**
1. Backend terima multipart file
2. Upload ke IPFS node
3. Dapat CID (Content Identifier)
4. Hash SHA-256 dihitung untuk integritas
5. File di-mirror ke IPFS MFS (Mutable File System)
6. Metadata + CID disimpan di MongoDB

---

## 11. Roadmap Pengembangan

### Fase 1 — Foundation (Selesai)
- [x] Arsitektur sistem 3-tier (Frontend, Backend, Blockchain)
- [x] Autentikasi & otorisasi berbasis JWT
- [x] CRUD aset lengkap
- [x] Sistem kategori & lokasi
- [x] Dashboard dengan statistik

### Fase 2 — Lifecycle Management (Selesai)
- [x] Transfer aset (borrow/return/permanent)
- [x] Sistem persetujuan multi-level
- [x] Pemeliharaan aset
- [x] Penghapusan aset (disposal)
- [x] Riwayat aset lengkap

### Fase 3 — Blockchain Integration (Selesai)
- [x] Hyperledger Fabric network setup
- [x] Chaincode untuk asset contract
- [x] Fabric Gateway REST API
- [x] Pencatatan transaksi di blockchain
- [x] Blockchain Explorer
- [x] IPFS untuk penyimpanan dokumen

### Fase 4 — Mobile & UX (Planned)
- [ ] Aplikasi mobile (React Native)
- [ ] Push notifications
- [ ] Offline mode dengan sync
- [ ] Barcode scanner native

### Fase 5 — Advanced Features (Planned)
- [ ] Analitik prediktif (maintenance prediction)
- [ ] Integrasi ERP
- [ ] Audit trail berbasis AI
- [ ] Multi-organization support
- [ ] API untuk third-party integration

---

## 12. Requirement Non-Fungsional

| Aspek | Requirement |
|-------|-----------|
| **Ketersediaan** | Sistem uptime 99.5% |
| **Skalabilitas** | Mendukung minimal 10,000 aset |
| **Responsif** | Frontend load < 2 detik |
| **Keamanan** | HTTPS only, JWT dengan expiry, password hashing bcrypt |
| **Kompatibilitas** | Chrome, Firefox, Safari, Edge versi terbaru |
| **Audit** | Semua perubahan aset tercatat di blockchain |
| **Backup** | MongoDB backup harian, IPFS pinning |

---

## 13. Glossary

| Istilah | Definisi |
|---------|----------|
| **AMS** | Asset Management System — Sistem Manajemen Aset |
| **Blockchain** | Teknologi ledger terdistribusi yang tidak dapat diubah |
| **Chaincode** | Smart contract di Hyperledger Fabric |
| **CID** | Content Identifier — Alamat unik file di IPFS |
| **Hyperledger Fabric** | Framework blockchain enterprise oleh Linux Foundation |
| **IPFS** | InterPlanetary File System — Sistem file terdesentralisasi |
| **JWT** | JSON Web Token — Standar untuk autentikasi berbasis token |
| **MFS** | Mutable File System — Sistem file di IPFS yang bisa diubah |
| **RBAC** | Role-Based Access Control — Kontrol akses berbasis peran |
| **TxID** | Transaction ID — ID unik transaksi di blockchain |

---

## 14. Kontributor

| Komponen | Teknologi | Deskripsi Singkat |
|----------|-----------|-------------------|
| **Orochimaru** | React + TypeScript | Frontend web application |
| **Minato** | Go + Echo | Backend REST API server |
| **Sasuke** | Hyperledger Fabric + IPFS | Blockchain network & storage |

---

*Document ini merupakan Product Requirements Document untuk sistem Asset Hub. Dokumen ini akan diperbarui seiring dengan perkembangan produk.*
