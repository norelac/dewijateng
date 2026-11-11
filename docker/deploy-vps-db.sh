#!/usr/bin/env bash
# ==============================================================================
# DEWI JATENG - Single-File VPS Docker Database Deployer
# Berisi: Skema PostgreSQL 16 + PostGIS 3.4, 868+ Desa Wisata, 1.061 HSD 2026,
#         Akun Demo, Aduan/Proof-of-Fix, & Monitoring Keuangan.
#
# Cara pakai di VPS (cukup salin 1 file ini, tidak perlu git clone):
#   bash deploy-vps-db.sh
#
# Opsi env / flag:
#   --port 5433          Port publik PostgreSQL (default: 5433)
#   --password PASS      Password DB (default: auto-generate acak & aman)
#   --no-ssl             Nonaktifkan SSL/TLS
#   --reset              Hapus volume lama dan init + seed ulang dari nol
# ==============================================================================
set -e

if [ -z "${DB_DIR:-}" ]; then
  if [ "$(id -u)" -eq 0 ]; then
    DB_DIR="/opt/dewijateng-db"
  else
    DB_DIR="$HOME/dewijateng-db"
  fi
fi
CONTAINER_NAME="${CONTAINER_NAME:-dewijateng_db}"
VOLUME_NAME="${VOLUME_NAME:-dewijateng_pgdata}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-dewijateng}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
ENABLE_SSL="${ENABLE_SSL:-true}"
RESET_DATA="${RESET_DATA:-false}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --port) POSTGRES_PORT="$2"; shift 2 ;;
    --password) POSTGRES_PASSWORD="$2"; shift 2 ;;
    --no-ssl) ENABLE_SSL="false"; shift ;;
    --reset) RESET_DATA="true"; shift ;;
    --dir) DB_DIR="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *)
      echo "Argumen tidak dikenal: $1"
      exit 1
      ;;
  esac
done

rand_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

echo "=== [1/5] Memeriksa Docker di VPS ==="
if ! command -v docker >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ]; then
    echo "Docker belum terpasang. Menginstall Docker..."
    curl -fsSL https://get.docker.com | sh
  else
    echo "ERROR: Docker belum terpasang. Jalankan: curl -fsSL https://get.docker.com | sudo sh"
    exit 1
  fi
fi

mkdir -p "$DB_DIR"

if [ "$RESET_DATA" = "true" ]; then
  echo "Mode --reset aktif: menghapus container & volume lama ($VOLUME_NAME)..."
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker volume rm "$VOLUME_NAME" >/dev/null 2>&1 || true
  rm -f "$DB_DIR/.credentials"
fi

if [ -z "$POSTGRES_PASSWORD" ] && [ -f "$DB_DIR/.credentials" ]; then
  SAVED_PASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "$DB_DIR/.credentials" | head -n1 | cut -d= -f2-)"
  if [ -n "$SAVED_PASSWORD" ]; then
    POSTGRES_PASSWORD="$SAVED_PASSWORD"
  fi
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD="$(rand_hex 16)"
fi

cat <<EOF > "$DB_DIR/.credentials"
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
POSTGRES_PORT=$POSTGRES_PORT
EOF
chmod 600 "$DB_DIR/.credentials"

echo "=== [2/5] Menulis 1 file SQL gabungan ($DB_DIR/init-all.sql) ==="
cat <<'__DEWI_JATENG_SQL_EOF__' > "$DB_DIR/init-all.sql"

-- >>> BEGIN init-db.sql <<<
-- ==============================================================================
-- DEWI JATENG - Database Schema & Initial Seeder (PostgreSQL 16 + PostGIS 3.4)
-- Repositori: /Users/ilham/Documents/development/matics/dewijateng
-- ==============================================================================

-- 1. Mengaktifkan ekstensi geospasial & UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing tables jika migrasi ulang
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS village_opening_balances CASCADE;
DROP TABLE IF EXISTS village_transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS report_resolutions CASCADE;
DROP TABLE IF EXISTS incident_reports CASCADE;
DROP TABLE IF EXISTS grant_expenses CASCADE;
DROP TABLE IF EXISTS village_grants CASCADE;
DROP TABLE IF EXISTS official_tariffs CASCADE;
DROP TABLE IF EXISTS ssh_reference_rates CASCADE;
DROP TABLE IF EXISTS tourist_villages CASCADE;

-- ==============================================================================
-- TABEL 1: tourist_villages (Data Induk Desa Wisata 35 Kab/Kota Jateng)
-- ==============================================================================
CREATE TABLE tourist_villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    regency VARCHAR(100) NOT NULL, -- 35 Kabupaten/Kota di Jawa Tengah
    district VARCHAR(100) NOT NULL, -- Kecamatan
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    category VARCHAR(20) CHECK (category IN ('RINTISAN', 'BERKEMBANG', 'MAJU', 'MANDIRI')) NOT NULL,
    pokdarwis_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    trust_score DECIMAL(5, 2) DEFAULT 80.00, -- 0.00 - 100.00 (Kepatuhan LPJ & Selesai Aduan)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_villages_regency ON tourist_villages(regency);
CREATE INDEX idx_villages_geom ON tourist_villages USING GIST(geom);
CREATE INDEX idx_villages_trust_score ON tourist_villages(trust_score);

-- ==============================================================================
-- TABEL 2: village_grants (Dokumen LPJ Bantuan Keuangan Pemprov / APBDes)
-- ==============================================================================
CREATE TABLE village_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL, -- 2024, 2025, 2026
    funding_source VARCHAR(150) NOT NULL, -- Bantuan Keuangan Pemprov Jateng / APBDes
    apbdes_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Rincian sumber dana APBDes
    banprov_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Rincian sumber dana Bantuan Provinsi
    pades_amount DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Rincian sumber dana PADes Wisata
    total_allocated DECIMAL(15, 2) NOT NULL, -- Pagu Bantuan Diterima (jumlah tiga sumber)
    total_realized DECIMAL(15, 2) DEFAULT 0.00, -- Total Realisasi Belanja Modal
    remaining_balance DECIMAL(15, 2) DEFAULT 0.00, -- Sisa Saldo Kas
    lpj_document_url VARCHAR(255) NULL, -- Tautan berkas asli LPJ (PDF)
    lpj_status VARCHAR(20) CHECK (lpj_status IN ('PENDING_UPLOAD', 'SUBMITTED', 'VERIFIED', 'REVISION')) DEFAULT 'PENDING_UPLOAD',
    lpj_review_notes TEXT NULL, -- Catatan verifikator Disbudparekraf saat revisi / verifikasi
    uploaded_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_village_grants_village_year UNIQUE (village_id, fiscal_year)
);

CREATE INDEX idx_grants_village ON village_grants(village_id);
CREATE INDEX idx_grants_status ON village_grants(lpj_status);

-- ==============================================================================
-- TABEL 4: grant_expenses (Penjabaran Pos Belanja LPJ Hasil Ekstraksi AI)
-- ==============================================================================
CREATE TABLE grant_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_id UUID NOT NULL REFERENCES village_grants(id) ON DELETE CASCADE,
    activity_name VARCHAR(200) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('MATERIAL_FISIK', 'UPAH_TENAGA', 'KESELAMATAN_K3', 'OPERASIONAL')) NOT NULL,
    volume DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(30) NOT NULL DEFAULT 'Paket',
    claimed_unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    budget_allocated DECIMAL(15, 2) NOT NULL,
    amount_realized DECIMAL(15, 2) NOT NULL,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    ai_anomaly_flag BOOLEAN DEFAULT FALSE, -- True jika deviasi harga vs SSH > +40%
    anomaly_note VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_grant ON grant_expenses(grant_id);

-- ==============================================================================
-- TABEL 5: ssh_reference_rates (Standar Satuan Harga Acuan Pemprov Jawa Tengah)
-- ==============================================================================
CREATE TABLE ssh_reference_rates (
    id BIGSERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    standard_price DECIMAL(15, 2) NOT NULL,
    regency VARCHAR(100) DEFAULT 'PROVINSI_JATENG',
    effective_year INT NOT NULL DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ssh_item_code ON ssh_reference_rates(item_code);
CREATE INDEX idx_ssh_category ON ssh_reference_rates(category);

-- ==============================================================================
-- TABEL 6: incident_reports (Aduan Fasilitas Publik, Pungli, K3 oleh Warga)
-- ==============================================================================
CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_code VARCHAR(30) UNIQUE NOT NULL, -- e.g. 'LP-JTG-2026-0012'
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    category VARCHAR(30) CHECK (category IN ('FASILITAS_RUSAK', 'PUNGLI', 'BAHAYA_K3', 'KEBERSIHAN')) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    photo_before_url VARCHAR(255) NOT NULL,
    photo_before_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- seluruh lampiran foto (maks 3)
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    is_anonymous BOOLEAN DEFAULT TRUE,
    reporter_contact_hash VARCHAR(64) NULL, -- SHA-256 hash nomor kontak pelapor
    status VARCHAR(20) CHECK (status IN ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'SUBMITTED',
    deadline_at TIMESTAMP WITH TIME ZONE NULL, -- tenggat SLA: PUNGLI 24 jam, lain 168 jam
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_code ON incident_reports(report_code);
CREATE INDEX idx_reports_village ON incident_reports(village_id);
CREATE INDEX idx_reports_status ON incident_reports(status);
CREATE INDEX idx_reports_geom ON incident_reports USING GIST(geom);

-- Sequence untuk nomor urut tiket laporan aduan thread-safe per tahun anggaran
CREATE SEQUENCE IF NOT EXISTS seq_report_code_2026 START 100;

-- ==============================================================================
-- TABEL 7: report_resolutions (Bukti Fisik Hasil Perbaikan / Proof-of-Fix)
-- ==============================================================================
CREATE TABLE report_resolutions (
    id BIGSERIAL PRIMARY KEY,
    report_id UUID UNIQUE NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    action_summary TEXT NOT NULL, -- Catatan teknis pekerjaan perbaikan
    photo_after_url VARCHAR(255) NOT NULL, -- Foto fisik sesudah diperbaiki
    officer_name VARCHAR(100) NOT NULL, -- Nama teknisi Pokdarwis / penanggung jawab
    exif_timestamp_verified BOOLEAN DEFAULT TRUE, -- Validasi waktu pemotretan asli
    exif_photo_date TIMESTAMP WITH TIME ZONE NULL,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resolutions_report ON report_resolutions(report_id);

-- ==============================================================================
-- TABEL 8: users (Akun Pengguna Sistem - Disbudparekraf & Pengelola Desa)
-- ==============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(60) UNIQUE NOT NULL,
    email VARCHAR(150) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('desa', 'disbudparekraf')) NOT NULL,
    village_id UUID NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    nip VARCHAR(30) NULL,
    institution VARCHAR(150) NULL,
    regency VARCHAR(100) NULL,
    status VARCHAR(20) CHECK (status IN ('AKTIF', 'NONAKTIF')) DEFAULT 'AKTIF',
    approval_status VARCHAR(20) CHECK (approval_status IN ('MENUNGGU', 'DISETUJUI', 'DITOLAK')) DEFAULT 'DISETUJUI',
    email_verified_at TIMESTAMP WITH TIME ZONE NULL,
    activated_at TIMESTAMP WITH TIME ZONE NULL,
    deactivated_at TIMESTAMP WITH TIME ZONE NULL,
    must_change_password BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_village CHECK (
        (role = 'desa' AND village_id IS NOT NULL) OR
        (role = 'disbudparekraf' AND village_id IS NULL)
    )
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_village ON users(village_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- ==============================================================================
-- TABEL 9: auth_tokens (Token verifikasi email, undangan aktivasi, reset sandi)
-- Hanya hash token yang disimpan; token asli hanya ada pada tautan yang dikirim.
-- ==============================================================================
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) CHECK (type IN ('VERIFIKASI_EMAIL', 'UNDANGAN_AKTIVASI', 'RESET_SANDI')) NOT NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_hash ON auth_tokens(token_hash);

-- ==============================================================================
-- TABEL 10: village_transactions (Transaksi keuangan desa wisata)
-- Satu tabel untuk pemasukan dan pengeluaran; `type` yang membedakan.
-- Dipakai layar "Monitoring keuangan" (Fase 4) dengan akses baca saja.
-- ==============================================================================
CREATE TABLE village_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    type VARCHAR(12) CHECK (type IN ('PEMASUKAN', 'PENGELUARAN')) NOT NULL,
    reference_code VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    transaction_date DATE NOT NULL,
    amount BIGINT NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(120),
    counterparty VARCHAR(200),
    note TEXT,
    -- NULL = transaksi belum dilengkapi bukti (status "Perlu bukti").
    proof_file_name VARCHAR(200),
    proof_file_size_kb INTEGER,
    proof_uploaded_by VARCHAR(120),
    recorded_by VARCHAR(120) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_village_transactions_village ON village_transactions(village_id, transaction_date);
CREATE INDEX idx_village_transactions_period ON village_transactions(transaction_date);

-- ==============================================================================
-- TABEL 11: village_opening_balances (Saldo awal per periode per desa)
-- ==============================================================================
CREATE TABLE village_opening_balances (
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    amount BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (village_id, period)
);



-- ==============================================================================
-- TRIGGER GEOSPASIAL OTOMATIS: Update kolom 'geom' dari lat & long
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_geom_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_villages_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON tourist_villages
FOR EACH ROW EXECUTE FUNCTION update_geom_point();

CREATE TRIGGER trg_reports_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON incident_reports
FOR EACH ROW EXECUTE FUNCTION update_geom_point();


-- ==============================================================================
-- SEED DATA AWAL: Desa Wisata Pilihan Jawa Tengah (Buku Profil 2023 & JADESTA)
-- ==============================================================================
INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score) VALUES
('a0000000-0000-0000-0000-000000000001', 'getas-semarang', 'Desa Wisata Getas (Curug Kembar)', 'Kabupaten Semarang', 'Kecamatan Getasan', -7.3698000, 110.4285000, 'BERKEMBANG', 'Pokdarwis Getas Indah', '081234567801', 88.50),
('a0000000-0000-0000-0000-000000000002', 'candirejo-magelang', 'Desa Wisata Candirejo', 'Kabupaten Magelang', 'Kecamatan Borobudur', -7.6189000, 110.2294000, 'MANDIRI', 'Pokdarwis Candirejo Makmur', '081234567802', 96.00),
('a0000000-0000-0000-0000-000000000003', 'limbasari-purbalingga', 'Desa Wisata Limbasari', 'Kabupaten Purbalingga', 'Kecamatan Bobotsari', -7.2891000, 109.3482000, 'RINTISAN', 'Pokdarwis Watu Mujur', '081234567803', 45.00),
('a0000000-0000-0000-0000-000000000004', 'dieng-kulon-banjarnegara', 'Desa Wisata Dieng Kulon', 'Kabupaten Banjarnegara', 'Kecamatan Batur', -7.2052000, 109.9048000, 'MANDIRI', 'Pokdarwis Dieng Pandawa', '081234567804', 94.20),
('a0000000-0000-0000-0000-000000000005', 'karangbanjar-purbalingga', 'Desa Wisata Karangbanjar', 'Kabupaten Purbalingga', 'Kecamatan Bojongsari', -7.3487000, 109.3512000, 'MAJU', 'Pokdarwis Karang Tirta', '081234567805', 82.00),
('a0000000-0000-0000-0000-000000000006', 'samiran-boyolali', 'Desa Wisata Samiran (Selo)', 'Kabupaten Boyolali', 'Kecamatan Selo', -7.5023000, 110.4631000, 'BERKEMBANG', 'Pokdarwis Samiran Merapi', '081234567806', 78.40),
('a0000000-0000-0000-0000-000000000007', 'lerep-semarang', 'Desa Wisata Lerep', 'Kabupaten Semarang', 'Kecamatan Ungaran Barat', -7.1352000, 110.3789000, 'MANDIRI', 'Pokdarwis Tirta Sejahtera', '081234567807', 91.50);

-- Trigger otomatis membuat geometri PostGIS
UPDATE tourist_villages SET updated_at = CURRENT_TIMESTAMP;


-- ==============================================================================
-- SEED DATA: Standar Satuan Harga (SSH) Acuan Pemprov Jawa Tengah 2026
-- ==============================================================================
INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year) VALUES
('SSH-MTL-001', 'Pipa Besi Galvanis 2 Inci Tebal 2.0mm', 'MATERIAL_LOGAM', 'Batang (6m)', 350000.00, 'PROVINSI_JATENG', 2026),
('SSH-MTL-002', 'Pipa Besi Hollow 40x40 Tebal 1.6mm', 'MATERIAL_LOGAM', 'Batang (6m)', 185000.00, 'PROVINSI_JATENG', 2026),
('SSH-SMN-001', 'Semen PC Portland Tipe 1 (50 Kg)', 'MATERIAL_SEMEN', 'Sak', 72000.00, 'PROVINSI_JATENG', 2026),
('SSH-PSR-001', 'Pasir Pasang Kali Progo/Muntilan', 'MATERIAL_AGREGAT', 'M3', 275000.00, 'PROVINSI_JATENG', 2026),
('SSH-SPL-001', 'Batu Pecah / Split 2/3', 'MATERIAL_AGREGAT', 'M3', 310000.00, 'PROVINSI_JATENG', 2026),
('SSH-CAT-001', 'Cat Besi Anti Karat (Zinc Chromate 5 Kg)', 'BAHAN_KIMIA', 'Pail', 285000.00, 'PROVINSI_JATENG', 2026),
('SSH-UPH-001', 'Upah Tukang Las Bersertifikat Konstruksi', 'UPAH_TENAGA', 'Orang/Hari', 145000.00, 'PROVINSI_JATENG', 2026),
('SSH-UPH-002', 'Upah Pekerja / Pembantu Tukang', 'UPAH_TENAGA', 'Orang/Hari', 105000.00, 'PROVINSI_JATENG', 2026),
('SSH-K3-001', 'Papan Rambu Peringatan Bahaya Plat Alumunium 60x60cm', 'KESELAMATAN_K3', 'Unit', 240000.00, 'PROVINSI_JATENG', 2026),
('SSH-CAT-002', 'Cat Tembok Interior Emulsi 5 Kg', 'BAHAN_KIMIA', 'Pail', 95000.00, 'PROVINSI_JATENG', 2026),
('SSH-MTL-003', 'Kawat Ikat Bendrat BWG 22', 'MATERIAL_LOGAM', 'Kg', 18000.00, 'PROVINSI_JATENG', 2026),
('SSH-KYU-001', 'Kayu Balok Kamper 8/12 Kelas II', 'MATERIAL_KAYU', 'M3', 5500000.00, 'PROVINSI_JATENG', 2026),
('SSH-BTU-001', 'Bata Merah Ukuran Standar Press', 'MATERIAL_AGREGAT', 'Buah', 900.00, 'PROVINSI_JATENG', 2026),
('SSH-GNT-001', 'Genteng Beton Press Flat', 'MATERIAL_AGREGAT', 'Buah', 8500.00, 'PROVINSI_JATENG', 2026),
('SSH-BSI-001', 'Besi Beton Polos D10mm SNI', 'MATERIAL_LOGAM', 'Batang (12m)', 92000.00, 'PROVINSI_JATENG', 2026),
('SSH-PLN-001', 'Paku Biasa 2-5 Inci', 'MATERIAL_LOGAM', 'Kg', 20000.00, 'PROVINSI_JATENG', 2026),
('SSH-PPA-001', 'Pipa PVC AW Dia 4 Inci', 'MATERIAL_PIPA', 'Batang (4m)', 115000.00, 'PROVINSI_JATENG', 2026),
('SSH-UPH-003', 'Upah Mandor Konstruksi', 'UPAH_TENAGA', 'Orang/Hari', 165000.00, 'PROVINSI_JATENG', 2026),
('SSH-UPH-004', 'Upah Tukang Batu Bersertifikat', 'UPAH_TENAGA', 'Orang/Hari', 130000.00, 'PROVINSI_JATENG', 2026);


-- ==============================================================================
-- SEED DATA: Dokumen LPJ Bantuan Keuangan (Studi Kasus Desa Getas)
-- ==============================================================================
INSERT INTO village_grants (id, village_id, fiscal_year, funding_source, total_allocated, total_realized, remaining_balance, lpj_document_url, lpj_status, uploaded_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 70500000.00, 29500000.00, '/documents/lpj-getas-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 2026, 'Bantuan Keuangan Pemprov Jateng TA 2026', 150000000.00, 142000000.00, 8000000.00, '/documents/lpj-candirejo-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 2026, 'Bantuan Keuangan Sarpras Rintisan Wisata', 100000000.00, 0.00, 100000000.00, NULL, 'PENDING_UPLOAD', NULL);


-- ==============================================================================
-- SEED DATA: Rincian Pos Belanja Modal LPJ (Hasil AI Document Extractor Desa Getas)
-- ==============================================================================
INSERT INTO grant_expenses (grant_id, activity_name, category, volume, unit, claimed_unit_price, budget_allocated, amount_realized, remaining_amount, ai_anomaly_flag, anomaly_note) VALUES
('b0000000-0000-0000-0000-000000000001', 'Pengadaan Pipa Besi Galvanis 2 Inci Pagar Curug (25 Batang)', 'MATERIAL_FISIK', 25.00, 'Batang', 310000.00, 8750000.00, 7750000.00, 1000000.00, false, 'Harga sesuai standar wajar SSH Jateng (Di bawah batas Rp 350.000)'),
('b0000000-0000-0000-0000-000000000001', 'Semen PC Portland Tipe 1 Pondasi Tiang (80 Sak)', 'MATERIAL_FISIK', 80.00, 'Sak', 70000.00, 6000000.00, 5600000.00, 400000.00, false, 'Sesuai SSH Rp 72.000/sak'),
('b0000000-0000-0000-0000-000000000001', 'Pasir Pasang Muntilan (12 M3)', 'MATERIAL_FISIK', 12.00, 'M3', 260000.00, 3500000.00, 3120000.00, 380000.00, false, 'Sesuai SSH Rp 275.000/M3'),
('b0000000-0000-0000-0000-000000000001', 'Papan Rambu Peringatan K3 Tepi Tebing (10 Unit)', 'KESELAMATAN_K3', 10.00, 'Unit', 360000.00, 4000000.00, 3600000.00, 400000.00, true, 'Indikasi deviasi harga klaim +50% vs batas wajar SSH Jateng (Rp 240.000)'),
('b0000000-0000-0000-0000-000000000001', 'Upah Kerja Tukang Las & Pekerja Lapangan (14 Hari)', 'UPAH_TENAGA', 14.00, 'Hari', 2500000.00, 40000000.00, 35000000.00, 5000000.00, false, 'Realisasi upah kerja fisik sesuai HOK');


-- ==============================================================================
-- SEED DATA: Incident Reports (Laporan Aduan Warga Berbasis Foto & Leaflet GPS)
-- ==============================================================================
INSERT INTO incident_reports (id, report_code, village_id, category, title, description, photo_before_url, latitude, longitude, is_anonymous, status, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'LP-JTG-2026-0012', 'a0000000-0000-0000-0000-000000000001', 'FASILITAS_RUSAK', 'Pagar Pengaman Bambu Rapuh di Dekat Air Terjun Curug Kembar', 'Pagar pembatas dari bambu di tebing curug patah dan lapuk tergerus air. Bahaya bagi pengunjung terutama anak-anak saat foto di dekat air terjun.', '/img/figma/aduan-curug-sebelum.png', -7.3698200, 110.4285400, false, 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('c0000000-0000-0000-0000-000000000002', 'LP-JTG-2026-0042', 'a0000000-0000-0000-0000-000000000001', 'KEBERSIHAN', 'Tumpukan Sampah Plastik di Jalur Setapak Pos 2', 'Banyak sampah botol plastik ditinggalkan di sekitar bebatuan pos 2 karena tempat sampah penuh dan tidak diangkut.', '/img/figma/aduan-sampah.png', -7.3697100, 110.4283100, true, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('c0000000-0000-0000-0000-000000000003', 'LP-JTG-2026-0088', 'a0000000-0000-0000-0000-000000000003', 'FASILITAS_RUSAK', 'Kran Air Toilet Umum Mati & Pintu Rusak', 'Fasilitas MCK di pintu masuk tidak mengalirkan air dan slot kunci pintu patah.', '/img/figma/toilet-sebelum.png', -7.2891500, 109.3482500, true, 'SUBMITTED', CURRENT_TIMESTAMP - INTERVAL '1 days');

UPDATE incident_reports SET updated_at = CURRENT_TIMESTAMP;

-- Isi tenggat SLA untuk data seed: PUNGLI 24 jam, kategori lain 168 jam.
UPDATE incident_reports
SET deadline_at = created_at + (CASE WHEN category = 'PUNGLI' THEN INTERVAL '24 hours' ELSE INTERVAL '168 hours' END),
    photo_before_urls = jsonb_build_array(photo_before_url);


-- ==============================================================================
-- SEED DATA: Report Resolutions (Bukti Foto Perbaikan / Proof-of-Fix Nyata)
-- ==============================================================================
INSERT INTO report_resolutions (report_id, action_summary, photo_after_url, officer_name, exif_timestamp_verified, exif_photo_date, resolved_at) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'Pagar bambu lama telah dibongkar dan diganti dengan 12 meter konstruksi pipa besi galvanis 2 inci baru. Tiang dipasang dengan pondasi cor beton sedalam 40 cm dan dilapisi cat anti-karat.',
    '/img/figma/aduan-curug-sesudah.png',
    'Slamet Riyadi (Koordinator Sarpras Pokdarwis Getas Indah)',
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Supabase memakai role bawaan "authenticated" / "service_role" dan helper
-- auth.role(). Di PostgreSQL lokal role tersebut tidak ada, sehingga seluruh
-- blok policy di bawah gagal dan seed data ikut terhenti. Buat stub-nya lebih
-- dulu agar skrip aman dijalankan di Docker lokal.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE AS $$ SELECT current_setting('role', true) $$;

ALTER TABLE tourist_villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssh_reference_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_resolutions ENABLE ROW LEVEL SECURITY;

-- 1. tourist_villages
CREATE POLICY "tourist_villages_select_public" ON tourist_villages FOR SELECT TO public USING (true);
CREATE POLICY "tourist_villages_insert_auth" ON tourist_villages FOR INSERT TO authenticated, service_role WITH CHECK (true);
CREATE POLICY "tourist_villages_update_auth" ON tourist_villages FOR UPDATE TO authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "tourist_villages_delete_auth" ON tourist_villages FOR DELETE TO authenticated, service_role USING (true);

-- 2. village_grants
CREATE POLICY "village_grants_select_public" ON village_grants FOR SELECT TO public USING (true);
CREATE POLICY "village_grants_all_auth" ON village_grants FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- 4. grant_expenses
CREATE POLICY "grant_expenses_select_public" ON grant_expenses FOR SELECT TO public USING (true);
CREATE POLICY "grant_expenses_all_auth" ON grant_expenses FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- 5. ssh_reference_rates
CREATE POLICY "ssh_reference_rates_select_public" ON ssh_reference_rates FOR SELECT TO public USING (true);
CREATE POLICY "ssh_reference_rates_all_auth" ON ssh_reference_rates FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- 6. incident_reports
CREATE POLICY "incident_reports_select_public" ON incident_reports FOR SELECT TO public USING (true);
CREATE POLICY "incident_reports_insert_civic" ON incident_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "incident_reports_update_auth" ON incident_reports FOR UPDATE TO authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "incident_reports_delete_auth" ON incident_reports FOR DELETE TO authenticated, service_role USING (true);

-- 7. report_resolutions
CREATE POLICY "report_resolutions_select_public" ON report_resolutions FOR SELECT TO public USING (true);
CREATE POLICY "report_resolutions_all_auth" ON report_resolutions FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- SELESAI: Skema & Seed Data DEWI JATENG Siap Digunakan
-- ==============================================================================

-- <<< END init-db.sql >>>

-- >>> BEGIN seed-villages-867.sql <<<
-- ==============================================================================
-- DEWI JATENG - SEED 867 DESA WISATA & 119 BANKEU PENERIMA (DATA RIIL JATENG)
-- ==============================================================================

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('b96f52d0-9dd4-582d-a65c-f321537755d2', 'babadan-banjarnegara', 'Desa Wisata Babadan', 'Kabupaten Banjarnegara', 'Kecamatan Babadan', -7.3001, 109.8108, 'BERKEMBANG', 'Pokdarwis Babadan Maju', '081200000001', 78.5),
('09573ed3-7dc9-588e-9ae2-07fd864603f5', 'bakal-banjarnegara', 'Desa Wisata Bakal', 'Kabupaten Banjarnegara', 'Kecamatan Bakal', -7.2212, 109.8773, 'BERKEMBANG', 'Pokdarwis Bakal Maju', '081200000002', 78.5),
('d73580be-5ebd-5763-a2ec-98ff60bc68ac', 'blambangan-banjarnegara', 'Desa Wisata Blambangan', 'Kabupaten Banjarnegara', 'Kecamatan Blambangan', -7.3931, 109.6428, 'BERKEMBANG', 'Pokdarwis Blambangan Maju', '081200000003', 78.5),
('e992f74c-326f-5e87-b3e2-dc437a2b6f7d', 'dawuhan-banjarnegara', 'Desa Wisata Dawuhan', 'Kabupaten Banjarnegara', 'Wanayasa', -7.4626, 109.633, 'MANDIRI', 'Pokdarwis Dawuhan Maju', '081200000004', 92.5),
('c35197f7-3ce6-583b-ac7e-b53b405db611', 'depok-banjarnegara', 'Desa Wisata Depok', 'Kabupaten Banjarnegara', 'Kecamatan Depok', -7.4272, 109.6281, 'BERKEMBANG', 'Pokdarwis Depok Maju', '081200000005', 78.5),
('a0000000-0000-0000-0000-000000000004', 'dieng-kulon-banjarnegara', 'Desa Wisata Dieng Kulon', 'Kabupaten Banjarnegara', 'Batur', -7.4546, 109.721, 'MANDIRI', 'Pokdarwis Dieng Kulon Maju', '081200000006', 92.5),
('3c4b0ad4-f8dc-52bb-aade-c04ec85a6ece', 'gentasari-banjarnegara', 'Desa Wisata Gentasari', 'Kabupaten Banjarnegara', 'Kecamatan Gentasari', -7.4506, 109.765, 'BERKEMBANG', 'Pokdarwis Gentasari Maju', '081200000007', 78.5),
('6e2e30b6-9f1d-5853-bfd8-8afe58ab4bd7', 'giritirta-banjarnegara', 'Desa Wisata Giritirta', 'Kabupaten Banjarnegara', 'Pejawaran', -7.4466, 109.649, 'MAJU', 'Pokdarwis Giritirta Maju', '081200000008', 85.0),
('23717fb9-edf3-5d1f-b854-810bdbda7dfc', 'glempang-banjarnegara', 'Desa Wisata Glempang', 'Kabupaten Banjarnegara', 'Mandiraja', -7.3535, 109.0947, 'MAJU', 'Pokdarwis Glempang Maju', '081200000009', 85.0),
('45fb54e3-edd3-5bcd-861d-13850e00ea7e', 'gumelem-kulon-banjarnegara', 'Desa Wisata Gumelem Kulon', 'Kabupaten Banjarnegara', 'Kecamatan Gumelem Kulon', -7.5013, 109.4085, 'BERKEMBANG', 'Pokdarwis Gumelem Kulon Maju', '081200000010', 78.5),
('ed0a5435-66cd-5dde-b191-443d757b2613', 'gumelem-wetan-banjarnegara', 'Desa Wisata Gumelem Wetan', 'Kabupaten Banjarnegara', 'Kecamatan Gumelem Wetan', -7.5017, 109.4094, 'BERKEMBANG', 'Pokdarwis Gumelem Wetan Maju', '081200000011', 78.5),
('22d7cf6a-2bb6-5ecf-867a-1660943ea23a', 'gumiwang-banjarnegara', 'Desa Wisata Gumiwang', 'Kabupaten Banjarnegara', 'Kecamatan Gumiwang', -7.4306, 109.665, 'BERKEMBANG', 'Pokdarwis Gumiwang Maju', '081200000012', 78.5),
('0a24b213-581f-5f46-ade7-3124c328e34f', 'kalilunjar-banjarnegara', 'Desa Wisata Kalilunjar', 'Kabupaten Banjarnegara', 'Banjarmangu', -7.4266, 109.709, 'MANDIRI', 'Pokdarwis Kalilunjar Maju', '081200000013', 92.5),
('d02f21c8-7307-5b4e-976b-88f0390a0a1c', 'karangtengah-banjarnegara', 'Desa Wisata Karangtengah', 'Kabupaten Banjarnegara', 'Kecamatan Karangtengah', -7.2047, 109.8862, 'BERKEMBANG', 'Pokdarwis Karangtengah Maju', '081200000014', 78.5),
('f2879501-f8d9-504a-94a9-4e8b6e2f201f', 'kasmaran-banjarnegara', 'Desa Wisata Kasmaran', 'Kabupaten Banjarnegara', 'Pagentan', -7.4186, 109.637, 'MAJU', 'Pokdarwis Kasmaran Maju', '081200000015', 85.0),
('63df1392-3940-5cb3-a551-4e8a43d3d4be', 'kepakisan-banjarnegara', 'Desa Wisata Kepakisan', 'Kabupaten Banjarnegara', 'Kecamatan Kepakisan', -7.1987, 109.8778, 'BERKEMBANG', 'Pokdarwis Kepakisan Maju', '081200000016', 78.5),
('dceae5aa-c77f-5e3a-90a2-c698c317b0de', 'majalengka-banjarnegara', 'Desa Wisata Majalengka', 'Kabupaten Banjarnegara', 'Kecamatan Majalengka', -7.4405, 109.6217, 'BERKEMBANG', 'Pokdarwis Majalengka Maju', '081200000017', 78.5),
('9d539070-039f-5354-a9b8-77e62b6d2241', 'pagak-banjarnegara', 'Desa Wisata Pagak', 'Kabupaten Banjarnegara', 'Purwareja Klampok', -7.4066, 109.769, 'MANDIRI', 'Pokdarwis Pagak Maju', '081200000018', 92.5),
('a2aacf10-5cfd-5ce9-b1eb-838235250ea4', 'pekandangan-banjarnegara', 'Desa Wisata Pekandangan', 'Kabupaten Banjarnegara', 'Kecamatan Pekandangan', -7.4026, 109.653, 'BERKEMBANG', 'Pokdarwis Pekandangan Maju', '081200000019', 78.5),
('590f7138-acca-5713-9ef9-b3883ea4f1c9', 'pekasiran-banjarnegara', 'Desa Wisata Pekasiran', 'Kabupaten Banjarnegara', 'Kecamatan Pekasiran', -7.1974, 109.8553, 'BERKEMBANG', 'Pokdarwis Pekasiran Maju', '081200000020', 78.5),
('b7b8bf25-5d0c-5969-ba94-ba92cea05840', 'pesangkalan-banjarnegara', 'Desa Wisata Pesangkalan', 'Kabupaten Banjarnegara', 'Pagedongan', -7.3946, 109.741, 'MAJU', 'Pokdarwis Pesangkalan Maju', '081200000021', 85.0),
('713505b6-6d5d-53ef-8922-1f20f03ef766', 'rakitan-banjarnegara', 'Desa Wisata Rakitan', 'Kabupaten Banjarnegara', 'Kecamatan Rakitan', -7.3906, 109.625, 'BERKEMBANG', 'Pokdarwis Rakitan Maju', '081200000022', 78.5),
('7a1f5025-5d3b-572e-bdc2-3f5b228249ee', 'salamerta-banjarnegara', 'Desa Wisata Salamerta', 'Kabupaten Banjarnegara', 'Kecamatan Salamerta', -7.4927, 109.4706, 'BERKEMBANG', 'Pokdarwis Salamerta Maju', '081200000023', 78.5),
('8cf7479a-cfcd-5a8b-9280-228a9be71356', 'wanadadi-banjarnegara', 'Desa Wisata Wanadadi', 'Kabupaten Banjarnegara', 'Kecamatan Wanadadi', -7.3826, 109.713, 'BERKEMBANG', 'Pokdarwis Wanadadi Maju', '081200000024', 78.5),
('e827b641-1d63-5834-84ad-9ed8e22b01f5', 'wanayasa-banjarnegara', 'Desa Wisata Wanayasa', 'Kabupaten Banjarnegara', 'Kecamatan Wanayasa', -7.3786, 109.757, 'BERKEMBANG', 'Pokdarwis Wanayasa Maju', '081200000025', 78.5),
('33bd6eb2-1783-5c0f-8c93-9301bb0799be', 'winong-banjarnegara', 'Desa Wisata Winong', 'Kabupaten Banjarnegara', 'Kecamatan Winong', -7.4137, 109.6228, 'BERKEMBANG', 'Pokdarwis Winong Maju', '081200000026', 78.5),
('f908b352-6b01-57f3-9747-eb99bb6c8b0c', 'banjarpanepen-banyumas', 'Desa Wisata Banjarpanepen', 'Kabupaten Banyumas', 'Kecamatan Banjarpanepen', -7.422, 109.155, 'BERKEMBANG', 'Pokdarwis Banjarpanepen Maju', '081200000027', 78.5),
('722b14e5-818b-5f35-a7bb-1824b06be8e5', 'cikakak-banyumas', 'Desa Wisata Cikakak', 'Kabupaten Banyumas', 'Kecamatan Cikakak', -7.418, 109.199, 'BERKEMBANG', 'Pokdarwis Cikakak Maju', '081200000028', 78.5),
('11855779-09fa-5963-bef0-97edab5d25fc', 'cirahab-banyumas', 'Desa Wisata Cirahab', 'Kabupaten Banyumas', 'Kecamatan Cirahab', -7.414, 109.243, 'BERKEMBANG', 'Pokdarwis Cirahab Maju', '081200000029', 78.5),
('0b15e886-e673-5d80-85ff-0e9014045ca2', 'gerduren-banyumas', 'Desa Wisata Gerduren', 'Kabupaten Banyumas', 'Kecamatan Gerduren', -7.41, 109.127, 'BERKEMBANG', 'Pokdarwis Gerduren Maju', '081200000030', 78.5),
('d30c6ca6-bebc-5e5c-8f33-740134c3cccb', 'glempang-banyumas', 'Desa Wisata Glempang', 'Kabupaten Banyumas', 'Kecamatan Glempang', -7.3535, 109.0947, 'BERKEMBANG', 'Pokdarwis Glempang Maju', '081200000031', 78.5),
('335aec42-3a49-53ba-8d72-ecb1e89124fb', 'kalibagor-banyumas', 'Desa Wisata Kalibagor', 'Kabupaten Banyumas', 'Kecamatan Kalibagor', -7.402, 109.215, 'BERKEMBANG', 'Pokdarwis Kalibagor Maju', '081200000032', 78.5),
('5676b503-fa1e-5165-99e3-4bb001c2e938', 'kalisalak-banyumas', 'Desa Wisata Kalisalak', 'Kabupaten Banyumas', 'Kecamatan Kalisalak', -7.0108, 109.9131, 'BERKEMBANG', 'Pokdarwis Kalisalak Maju', '081200000033', 78.5),
('bd829159-6e3b-5264-91fc-32f599640cb2', 'karanggintung-banyumas', 'Desa Wisata Karanggintung', 'Kabupaten Banyumas', 'Kecamatan Karanggintung', -7.394, 109.143, 'BERKEMBANG', 'Pokdarwis Karanggintung Maju', '081200000034', 78.5),
('07fdff86-dbb4-5a96-a2b3-d6c9cfd1170b', 'karangkemiri-banyumas', 'Desa Wisata Karangkemiri', 'Kabupaten Banyumas', 'Kecamatan Karangkemiri', -7.39, 109.187, 'BERKEMBANG', 'Pokdarwis Karangkemiri Maju', '081200000035', 78.5),
('2fa36165-ebaf-53fd-a738-f0068697f79b', 'karangsalam-banyumas', 'Desa Wisata Karangsalam', 'Kabupaten Banyumas', 'Kecamatan Karangsalam', -7.386, 109.231, 'BERKEMBANG', 'Pokdarwis Karangsalam Maju', '081200000036', 78.5),
('01dba78b-1af3-5d93-9e93-e23e085ffcce', 'karangtengah-banyumas', 'Desa Wisata Karangtengah', 'Kabupaten Banyumas', 'Kecamatan Karangtengah', -7.2047, 109.8862, 'BERKEMBANG', 'Pokdarwis Karangtengah Maju', '081200000037', 78.5),
('7d7e24e2-b08b-50f3-b483-e893ada95173', 'kejawar-banyumas', 'Desa Wisata Kejawar', 'Kabupaten Banyumas', 'Kecamatan Kejawar', -7.378, 109.159, 'BERKEMBANG', 'Pokdarwis Kejawar Maju', '081200000038', 78.5),
('add1ff92-2648-5e03-8af7-31bfa6d1f39b', 'kemutug-lor-banyumas', 'Desa Wisata Kemutug Lor', 'Kabupaten Banyumas', 'Kecamatan Kemutug Lor', -7.374, 109.203, 'BERKEMBANG', 'Pokdarwis Kemutug Lor Maju', '081200000039', 78.5),
('f911d4d2-9778-5e6b-b7dc-9dbd7818d098', 'melung-banyumas', 'Desa Wisata Melung', 'Kabupaten Banyumas', 'Kecamatan Melung', -7.53, 109.087, 'BERKEMBANG', 'Pokdarwis Melung Maju', '081200000040', 78.5),
('23b9dca5-eb6f-5b7b-8845-9dae27a7ef7c', 'pekuncen-banyumas', 'Desa Wisata Pekuncen', 'Kabupaten Banyumas', 'Kecamatan Pekuncen', -7.5603, 109.1187, 'BERKEMBANG', 'Pokdarwis Pekuncen Maju', '081200000041', 78.5),
('14a7132b-e995-529e-887a-19e306389c65', 'pekunden-banyumas', 'Desa Wisata Pekunden', 'Kabupaten Banyumas', 'Kecamatan Pekunden', -7.5134, 109.289, 'BERKEMBANG', 'Pokdarwis Pekunden Maju', '081200000042', 78.5),
('47ee20d1-b22b-5257-bd22-90dbaa5b4fcd', 'petahunan-banyumas', 'Desa Wisata Petahunan', 'Kabupaten Banyumas', 'Kecamatan Petahunan', -7.518, 109.219, 'BERKEMBANG', 'Pokdarwis Petahunan Maju', '081200000043', 78.5),
('9c4c6912-01cc-5fb4-9350-af93b3848211', 'samudra-banyumas', 'Desa Wisata Samudra', 'Kabupaten Banyumas', 'Kecamatan Samudra', -7.514, 109.103, 'BERKEMBANG', 'Pokdarwis Samudra Maju', '081200000044', 78.5),
('88bd88c5-e715-556b-ae14-ffb102832a16', 'tamansari-banyumas', 'Desa Wisata Tamansari', 'Kabupaten Banyumas', 'Kecamatan Tamansari', -7.4339, 109.1899, 'BERKEMBANG', 'Pokdarwis Tamansari Maju', '081200000045', 78.5),
('f915808b-42a6-57a8-b7c4-740ae32f9a63', 'tambaknegara-banyumas', 'Desa Wisata Tambaknegara', 'Kabupaten Banyumas', 'Kecamatan Tambaknegara', -7.5257, 109.1975, 'BERKEMBANG', 'Pokdarwis Tambaknegara Maju', '081200000046', 78.5),
('a3013416-c141-5d1c-92b9-ae523e0bdd3c', 'batik-rifaiyah-batang', 'Desa Wisata Batik Rifaiyah', 'Kabupaten Batang', 'Kecamatan Batik Rifaiyah', -6.96, 109.802, 'BERKEMBANG', 'Pokdarwis Batik Rifaiyah Maju', '081200000047', 78.5),
('7eeb0b78-a20e-5f6f-9658-3cabb3cb374d', 'bawang-batang', 'Desa Wisata Bawang', 'Kabupaten Batang', 'Kecamatan Bawang', -6.956, 109.686, 'BERKEMBANG', 'Pokdarwis Bawang Maju', '081200000048', 78.5),
('9b29d3ef-1d02-5bbf-ac6a-4a827ab9a2aa', 'besani-batang', 'Desa Wisata Besani', 'Kabupaten Batang', 'Kecamatan Besani', -7.0896, 109.8508, 'BERKEMBANG', 'Pokdarwis Besani Maju', '081200000049', 78.5),
('535c0b54-d442-5c09-a94f-626656ef9a9e', 'candigugur-batang', 'Desa Wisata Candigugur', 'Kabupaten Batang', 'Kecamatan Candigugur', -6.948, 109.774, 'BERKEMBANG', 'Pokdarwis Candigugur Maju', '081200000050', 78.5),
('9e24b694-b1be-5d49-9e81-f5957bcc1235', 'cemoro-asri-batang', 'Desa Wisata Cemoro Asri', 'Kabupaten Batang', 'Kecamatan Cemoro Asri', -6.944, 109.658, 'BERKEMBANG', 'Pokdarwis Cemoro Asri Maju', '081200000051', 78.5),
('e2996027-945e-5fdc-abf6-032982a552ad', 'deles-batang', 'Desa Wisata Deles', 'Kabupaten Batang', 'Kecamatan Deles', -6.94, 109.702, 'BERKEMBANG', 'Pokdarwis Deles Maju', '081200000052', 78.5),
('c708ee12-d54b-5e26-a9bd-f015b0d0f5f1', 'kalisalak-batang', 'Desa Wisata Kalisalak', 'Kabupaten Batang', 'Kecamatan Kalisalak', -7.0108, 109.9131, 'BERKEMBANG', 'Pokdarwis Kalisalak Maju', '081200000053', 78.5),
('3deb8867-fa21-5722-a769-34453b5914f2', 'kalisari-batang', 'Desa Wisata Kalisari', 'Kabupaten Batang', 'Kecamatan Kalisari', -6.932, 109.79, 'BERKEMBANG', 'Pokdarwis Kalisari Maju', '081200000054', 78.5),
('44855960-e825-5175-9776-39d0083c699c', 'kanoman-batang', 'Desa Wisata Kanoman', 'Kabupaten Batang', 'Kecamatan Kanoman', -6.928, 109.674, 'BERKEMBANG', 'Pokdarwis Kanoman Maju', '081200000055', 78.5),
('92324d26-22f3-5fbd-ab4f-09d364155a31', 'kebaturan-batang', 'Desa Wisata Kebaturan', 'Kabupaten Batang', 'Kecamatan Kebaturan', -6.924, 109.718, 'BERKEMBANG', 'Pokdarwis Kebaturan Maju', '081200000056', 78.5),
('3759451a-56f3-50f0-92f5-9aeff69828c6', 'kedawung-batang', 'Desa Wisata Kedawung', 'Kabupaten Batang', 'Banyuputih', -6.92, 109.762, 'MAJU', 'Pokdarwis Kedawung Maju', '081200000057', 85.0),
('77bbc8a0-5a79-50cc-8dff-6246fb769aa3', 'kembanglangit-batang', 'Desa Wisata Kembanglangit', 'Kabupaten Batang', 'Kecamatan Kembanglangit', -6.916, 109.806, 'BERKEMBANG', 'Pokdarwis Kembanglangit Maju', '081200000058', 78.5),
('b0a5beae-9075-56bc-ac91-e2dc58f34fd1', 'kemiri-barat-batang', 'Desa Wisata Kemiri Barat', 'Kabupaten Batang', 'Subah', -6.912, 109.69, 'MAJU', 'Pokdarwis Kemiri Barat Maju', '081200000059', 85.0),
('db76b211-3712-59c3-9930-aaf52137b701', 'keteleng-batang', 'Desa Wisata Keteleng', 'Kabupaten Batang', 'Kecamatan Keteleng', -6.908, 109.734, 'BERKEMBANG', 'Pokdarwis Keteleng Maju', '081200000060', 78.5),
('501e7852-e0c2-555c-bf48-d8904e085fc9', 'mentosari-batang', 'Desa Wisata Mentosari', 'Kabupaten Batang', 'Kecamatan Mentosari', -6.904, 109.778, 'BERKEMBANG', 'Pokdarwis Mentosari Maju', '081200000061', 78.5),
('7fc5ef9f-a673-5fda-ace0-d65fd19b570e', 'pacet-batang', 'Desa Wisata Pacet', 'Kabupaten Batang', 'Reban', -6.9, 109.662, 'MAJU', 'Pokdarwis Pacet Maju', '081200000062', 85.0),
('4174ba2a-954d-5953-9ef2-a7429353440a', 'pandan-sari-batang', 'Desa Wisata Pandan Sari', 'Kabupaten Batang', 'Kecamatan Pandan Sari', -6.896, 109.706, 'BERKEMBANG', 'Pokdarwis Pandan Sari Maju', '081200000063', 78.5),
('2380bc6e-b7f8-5484-b368-f85befee2796', 'pasusukan-batang', 'Desa Wisata Pasusukan', 'Kabupaten Batang', 'Kecamatan Pasusukan', -6.892, 109.75, 'BERKEMBANG', 'Pokdarwis Pasusukan Maju', '081200000064', 78.5),
('b372d060-2557-57f9-b9f9-28cf65650118', 'pesantren-batang', 'Desa Wisata Pesantren', 'Kabupaten Batang', 'Kecamatan Pesantren', -6.888, 109.794, 'BERKEMBANG', 'Pokdarwis Pesantren Maju', '081200000065', 78.5),
('6695c20d-e31f-5e13-a58e-a51a1e1b2e61', 'pesona-indah-batang', 'Desa Wisata Pesona Indah', 'Kabupaten Batang', 'Kecamatan Pesona Indah', -6.884, 109.678, 'BERKEMBANG', 'Pokdarwis Pesona Indah Maju', '081200000066', 78.5),
('59f8e280-7b2e-5c15-ae8a-2455af482ff1', 'polowono-batang', 'Desa Wisata Polowono', 'Kabupaten Batang', 'Kecamatan Polowono', -6.88, 109.722, 'BERKEMBANG', 'Pokdarwis Polowono Maju', '081200000067', 78.5),
('cc6b3685-3afa-5bf6-a65e-e137dff22465', 'pranten-batang', 'Desa Wisata Pranten', 'Kabupaten Batang', 'Bawang', -6.876, 109.766, 'MAJU', 'Pokdarwis Pranten Maju', '081200000068', 85.0),
('4d0ca9d3-4d5e-577d-a2c4-da0d8abbfa93', 'pungangan-batang', 'Desa Wisata Pungangan', 'Kabupaten Batang', 'Kecamatan Pungangan', -6.872, 109.81, 'BERKEMBANG', 'Pokdarwis Pungangan Maju', '081200000069', 78.5),
('087fa22b-130a-5daf-9674-5d2a12b0d746', 'purbo-batang', 'Desa Wisata Purbo', 'Kabupaten Batang', 'Kecamatan Purbo', -6.868, 109.694, 'BERKEMBANG', 'Pokdarwis Purbo Maju', '081200000070', 78.5),
('865f2f12-6584-5c7d-a7c0-3af997f6bb33', 'rejosari-timur-batang', 'Desa Wisata Rejosari Timur', 'Kabupaten Batang', 'Kecamatan Rejosari Timur', -7.034, 109.9618, 'BERKEMBANG', 'Pokdarwis Rejosari Timur Maju', '081200000071', 78.5),
('874add72-d951-5cee-b5aa-9325482722fa', 'sangubanyu-batang', 'Desa Wisata Sangubanyu', 'Kabupaten Batang', 'Bawang', -6.86, 109.782, 'MAJU', 'Pokdarwis Sangubanyu Maju', '081200000072', 85.0),
('1503db2a-5917-5702-ad7a-dca0d3ff2dcf', 'sariglagah-batang', 'Desa Wisata Sariglagah', 'Kabupaten Batang', 'Kecamatan Sariglagah', -6.856, 109.666, 'BERKEMBANG', 'Pokdarwis Sariglagah Maju', '081200000073', 78.5),
('2d612c18-ea95-5bfd-9877-b2827fd4c8b8', 'sidorejo-batang', 'Desa Wisata Sidorejo', 'Kabupaten Batang', 'Kecamatan Sidorejo', -6.852, 109.71, 'BERKEMBANG', 'Pokdarwis Sidorejo Maju', '081200000074', 78.5),
('1096ef0a-6515-5c2d-b367-4941b7515d55', 'silurah-batang', 'Desa Wisata Silurah', 'Kabupaten Batang', 'Kecamatan Silurah', -6.848, 109.754, 'BERKEMBANG', 'Pokdarwis Silurah Maju', '081200000075', 78.5),
('8000ea7f-9980-5b61-a926-1b7be982d0bc', 'sodong-batang', 'Desa Wisata Sodong', 'Kabupaten Batang', 'Kecamatan Sodong', -6.844, 109.798, 'BERKEMBANG', 'Pokdarwis Sodong Maju', '081200000076', 78.5),
('905dd33a-7e5c-5ee4-8803-53d485245ffa', 'sojomerto-batang', 'Desa Wisata Sojomerto', 'Kabupaten Batang', 'Kecamatan Sojomerto', -6.84, 109.682, 'BERKEMBANG', 'Pokdarwis Sojomerto Maju', '081200000077', 78.5),
('7ade7bd6-5781-572d-b811-2aac68a5ea6d', 'tombo-batang', 'Desa Wisata Tombo', 'Kabupaten Batang', 'Kecamatan Tombo', -6.836, 109.726, 'BERKEMBANG', 'Pokdarwis Tombo Maju', '081200000078', 78.5),
('abb351a3-9c4f-5dad-8b4e-f8a84738b3d5', 'balong-blora', 'Desa Wisata Balong', 'Kabupaten Blora', 'Jepon', -6.894, 111.454, 'MAJU', 'Pokdarwis Balong Maju', '081200000079', 85.0),
('1441dee9-6e91-51df-9495-ef0984f455c1', 'bangowan-blora', 'Desa Wisata Bangowan', 'Kabupaten Blora', 'Jiken', -7.05, 111.338, 'MAJU', 'Pokdarwis Bangowan Maju', '081200000080', 85.0),
('74bd8426-7d4a-5aee-98a4-19fa88ca9954', 'bangsri-blora', 'Desa Wisata Bangsri', 'Kabupaten Blora', 'Kecamatan Bangsri', -7.0005, 111.4627, 'BERKEMBANG', 'Pokdarwis Bangsri Maju', '081200000081', 78.5),
('c8730a9b-b542-5b03-8bc6-6adfb58d4f5a', 'janjang-blora', 'Desa Wisata Janjang', 'Kabupaten Blora', 'Kecamatan Janjang', -7.042, 111.426, 'BERKEMBANG', 'Pokdarwis Janjang Maju', '081200000082', 78.5),
('aa845b6b-514d-57e5-abb8-722ac621a2cb', 'karangjong-blora', 'Desa Wisata Karangjong', 'Kabupaten Blora', 'Ngawen', -7.038, 111.47, 'MAJU', 'Pokdarwis Karangjong Maju', '081200000083', 85.0),
('1385ef87-5955-57f3-ba0f-4c5c336fb5c5', 'klopoduwur-blora', 'Desa Wisata Klopoduwur', 'Kabupaten Blora', 'Banjarejo', -7.034, 111.354, 'MAJU', 'Pokdarwis Klopoduwur Maju', '081200000084', 85.0),
('17664162-adce-5404-a2bc-e10b34faf8c3', 'ledok-blora', 'Desa Wisata Ledok', 'Kabupaten Blora', 'Sambong', -7.03, 111.398, 'MAJU', 'Pokdarwis Ledok Maju', '081200000085', 85.0),
('6a07e80e-2bb9-5aa0-8c2c-59ca9a74fcb3', 'mendenrejo-blora', 'Desa Wisata Mendenrejo', 'Kabupaten Blora', 'Kecamatan Mendenrejo', -7.026, 111.442, 'BERKEMBANG', 'Pokdarwis Mendenrejo Maju', '081200000086', 78.5),
('d2f399b1-235e-56c2-8486-a8babee8eae4', 'nglobo-blora', 'Desa Wisata Nglobo', 'Kabupaten Blora', 'Kecamatan Nglobo', -7.041, 111.4992, 'BERKEMBANG', 'Pokdarwis Nglobo Maju', '081200000087', 78.5),
('e73b316d-3898-50a0-85ee-f2e53c113a35', 'palon-blora', 'Desa Wisata Palon', 'Kabupaten Blora', 'Kecamatan Palon', -7.018, 111.37, 'BERKEMBANG', 'Pokdarwis Palon Maju', '081200000088', 78.5),
('ba977a35-1c92-5821-845c-9d986e8176bc', 'pengkoljagong-blora', 'Desa Wisata Pengkoljagong', 'Kabupaten Blora', 'Kecamatan Pengkoljagong', -7.17, 111.3212, 'BERKEMBANG', 'Pokdarwis Pengkoljagong Maju', '081200000089', 78.5),
('83fa9107-fd74-5188-a40c-4cd041249a5c', 'sambongrejo-blora', 'Desa Wisata Sambongrejo', 'Kabupaten Blora', 'Sambong', -7.01, 111.458, 'MAJU', 'Pokdarwis Sambongrejo Maju', '081200000090', 85.0),
('f535308c-44de-506a-bdd2-c4aa864d7329', 'singonegoro-blora', 'Desa Wisata Singonegoro', 'Kabupaten Blora', 'Jiken', -7.006, 111.342, 'MAJU', 'Pokdarwis Singonegoro Maju', '081200000091', 85.0),
('2a6a96c5-5d5e-5761-8902-a545fb3afba5', 'tempellemahbang-blora', 'Desa Wisata Tempellemahbang', 'Kabupaten Blora', 'Kecamatan Tempellemahbang', -7.002, 111.386, 'BERKEMBANG', 'Pokdarwis Tempellemahbang Maju', '081200000092', 78.5),
('1f0499e4-264d-536e-b99d-c4b0d405a682', 'tempuran-blora', 'Desa Wisata Tempuran', 'Kabupaten Blora', 'Blora', -6.998, 111.43, 'MAJU', 'Pokdarwis Tempuran Maju', '081200000093', 85.0),
('bbb6b28d-afb0-54b3-afce-e99da947659e', 'tinapan-blora', 'Desa Wisata Tinapan', 'Kabupaten Blora', 'Todanan', -6.994, 111.474, 'MAJU', 'Pokdarwis Tinapan Maju', '081200000094', 85.0),
('3a5983da-4c5a-5bc5-b1d5-5a2815a59ba7', 'tunjungan-blora', 'Desa Wisata Tunjungan', 'Kabupaten Blora', 'Kecamatan Tunjungan', -6.9207, 111.3688, 'BERKEMBANG', 'Pokdarwis Tunjungan Maju', '081200000095', 78.5),
('6178e206-47db-5474-b548-2da1125c068e', 'waru-blora', 'Desa Wisata Waru', 'Kabupaten Blora', 'Kecamatan Waru', -6.8891, 111.492, 'BERKEMBANG', 'Pokdarwis Waru Maju', '081200000096', 78.5),
('6f8895d6-1dd4-59b4-b01e-f4c956f33c40', 'air-terjun-kedunggoro-boyolali', 'Desa Wisata Air Terjun Kedunggoro', 'Kabupaten Boyolali', 'Kecamatan Air Terjun Kedunggoro', -7.545, 110.624, 'BERKEMBANG', 'Pokdarwis Air Terjun Kedunggoro Maju', '081200000097', 78.5),
('8dcaaa1b-30ad-5522-9e93-0c68275e0369', 'arga-makmur-boyolali', 'Desa Wisata Arga Makmur', 'Kabupaten Boyolali', 'Kecamatan Arga Makmur', -7.541, 110.668, 'BERKEMBANG', 'Pokdarwis Arga Makmur Maju', '081200000098', 78.5),
('233392a4-d7d8-5fb3-8d22-85408f67ec00', 'argo-merapi-boyolali', 'Desa Wisata Argo Merapi', 'Kabupaten Boyolali', 'Kecamatan Argo Merapi', -7.537, 110.552, 'BERKEMBANG', 'Pokdarwis Argo Merapi Maju', '081200000099', 78.5),
('0cde5369-35a5-5197-9103-b35400a0eade', 'babad-allas-boyolali', 'Desa Wisata Babad Allas', 'Kabupaten Boyolali', 'Kecamatan Babad Allas', -7.533, 110.596, 'BERKEMBANG', 'Pokdarwis Babad Allas Maju', '081200000100', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('8abefc8b-c0f8-59b6-bb6d-e348adf5d44c', 'bangkok-boyolali', 'Desa Wisata Bangkok', 'Kabupaten Boyolali', 'Kecamatan Bangkok', -7.529, 110.64, 'BERKEMBANG', 'Pokdarwis Bangkok Maju', '081200000101', 78.5),
('969ff474-dd2b-5814-a991-331ae7f32364', 'bhumi-damalung-boyolali', 'Desa Wisata Bhumi Damalung', 'Kabupaten Boyolali', 'Kecamatan Bhumi Damalung', -7.525, 110.524, 'BERKEMBANG', 'Pokdarwis Bhumi Damalung Maju', '081200000102', 78.5),
('69043fd3-795e-5e9f-9c74-16a81f4fc259', 'bulu-serang-boyolali', 'Desa Wisata Bulu Serang', 'Kabupaten Boyolali', 'Kecamatan Bulu Serang', -7.521, 110.568, 'BERKEMBANG', 'Pokdarwis Bulu Serang Maju', '081200000103', 78.5),
('22f4bd67-a57f-5d56-9943-b4bc6d440168', 'bumi-klakah-boyolali', 'Desa Wisata Bumi Klakah', 'Kabupaten Boyolali', 'Kecamatan Bumi Klakah', -7.517, 110.612, 'BERKEMBANG', 'Pokdarwis Bumi Klakah Maju', '081200000104', 78.5),
('90de1c01-8fa0-5b9e-b8e7-8f78f4f1774e', 'camp-bell-2-edupark-boyolali', 'Desa Wisata Camp Bell 2 Edupark', 'Kabupaten Boyolali', 'Kecamatan Camp Bell 2 Edupark', -7.513, 110.656, 'BERKEMBANG', 'Pokdarwis Camp Bell 2 Edupark Maju', '081200000105', 78.5),
('204a1663-d6c1-5ad7-b0dc-5d33bcb7a5aa', 'cepogo-boyolali', 'Desa Wisata Cepogo', 'Kabupaten Boyolali', 'Kecamatan Cepogo', -7.509, 110.54, 'BERKEMBANG', 'Pokdarwis Cepogo Maju', '081200000106', 78.5),
('ed335123-b9a1-5420-81bf-6914a5c1a202', 'desa-wisata-catur-boyolali', 'Desa Wisata Desa Wisata Catur', 'Kabupaten Boyolali', 'Kecamatan Desa Wisata Catur', -7.505, 110.584, 'BERKEMBANG', 'Pokdarwis Desa Wisata Catur Maju', '081200000107', 78.5),
('5580824c-dc8f-5fdf-b0a9-782adfa16831', 'dewa-saga-boyolali', 'Desa Wisata Dewa Saga', 'Kabupaten Boyolali', 'Kecamatan Dewa Saga', -7.501, 110.628, 'BERKEMBANG', 'Pokdarwis Dewa Saga Maju', '081200000108', 78.5),
('8dcec2b9-e4a7-5680-8c3c-1d63e5ea721d', 'dewata-ndul-deso-boyolali', 'Desa Wisata Dewata Ndul Deso', 'Kabupaten Boyolali', 'Kecamatan Dewata Ndul Deso', -7.497, 110.672, 'BERKEMBANG', 'Pokdarwis Dewata Ndul Deso Maju', '081200000109', 78.5),
('2d98bf3f-3a95-503b-b4db-d5e31594c33f', 'dewi-kunti-boyolali', 'Desa Wisata Dewi Kunti', 'Kabupaten Boyolali', 'Kecamatan Dewi Kunti', -7.493, 110.556, 'BERKEMBANG', 'Pokdarwis Dewi Kunti Maju', '081200000110', 78.5),
('972acb56-107e-5ddb-bed5-ee2ee54d4447', 'duta-arga-kencana-boyolali', 'Desa Wisata Duta  Arga Kencana', 'Kabupaten Boyolali', 'Kecamatan Duta  Arga Kencana', -7.489, 110.6, 'BERKEMBANG', 'Pokdarwis Duta  Arga Kencana Maju', '081200000111', 78.5),
('f579f685-515b-5e7d-88b5-9c5f75d234ae', 'eko-bukit-wonopotro-boyolali', 'Desa Wisata Eko Bukit Wonopotro', 'Kabupaten Boyolali', 'Kecamatan Eko Bukit Wonopotro', -7.485, 110.644, 'BERKEMBANG', 'Pokdarwis Eko Bukit Wonopotro Maju', '081200000112', 78.5),
('f72aefa1-107d-5085-827a-9ee09bb4efdc', 'embung-giritirto-boyolali', 'Desa Wisata Embung Giritirto', 'Kabupaten Boyolali', 'Kecamatan Embung Giritirto', -7.481, 110.528, 'BERKEMBANG', 'Pokdarwis Embung Giritirto Maju', '081200000113', 78.5),
('dde414dc-096b-58c1-8810-a6b836ebed99', 'gedangan-boyolali', 'Desa Wisata Gedangan', 'Kabupaten Boyolali', 'Kecamatan Gedangan', -7.477, 110.572, 'BERKEMBANG', 'Pokdarwis Gedangan Maju', '081200000114', 78.5),
('433c75ac-6cbd-5655-88b0-39c9adb567fe', 'gemuling-jaya-boyolali', 'Desa Wisata Gemuling Jaya', 'Kabupaten Boyolali', 'Kecamatan Gemuling Jaya', -7.473, 110.616, 'BERKEMBANG', 'Pokdarwis Gemuling Jaya Maju', '081200000115', 78.5),
('7dec1270-ea58-56c8-b54c-71c9a61d246b', 'gentong-kencono-boyolali', 'Desa Wisata Gentong Kencono', 'Kabupaten Boyolali', 'Kecamatan Gentong Kencono', -7.469, 110.66, 'BERKEMBANG', 'Pokdarwis Gentong Kencono Maju', '081200000116', 78.5),
('46fd0909-edd6-5e51-b6f5-ea4a2b773ccf', 'kampus-kopi-banyuanyar-boyolali', 'Desa Wisata Kampus Kopi Banyuanyar', 'Kabupaten Boyolali', 'Kecamatan Kampus Kopi Banyuanyar', -7.465, 110.544, 'BERKEMBANG', 'Pokdarwis Kampus Kopi Banyuanyar Maju', '081200000117', 78.5),
('d3ae35e5-e7eb-5303-98a5-e3e2a34e63cb', 'karang-kepoh-boyolali', 'Desa Wisata Karang Kepoh', 'Kabupaten Boyolali', 'Kecamatan Karang Kepoh', -7.461, 110.588, 'BERKEMBANG', 'Pokdarwis Karang Kepoh Maju', '081200000118', 78.5),
('f30017ef-7b33-5f00-90d7-4ab8fa70e5f0', 'kemasan-boyolali', 'Desa Wisata Kemasan', 'Kabupaten Boyolali', 'Kecamatan Kemasan', -7.5736, 110.6808, 'BERKEMBANG', 'Pokdarwis Kemasan Maju', '081200000119', 78.5),
('8a2f7499-3d58-5a9a-a1f7-242a7d209250', 'kembangkuning-boyolali', 'Desa Wisata Kembangkuning', 'Kabupaten Boyolali', 'Kecamatan Kembangkuning', -7.613, 110.516, 'BERKEMBANG', 'Pokdarwis Kembangkuning Maju', '081200000120', 78.5),
('0fe58f1f-4a98-52d9-97e3-e04ac2586ed3', 'kiringan-boyolali', 'Desa Wisata Kiringan', 'Kabupaten Boyolali', 'Kecamatan Kiringan', -7.609, 110.56, 'BERKEMBANG', 'Pokdarwis Kiringan Maju', '081200000121', 78.5),
('0e0704ca-17a8-58ed-9737-0635972f60ec', 'kreatif-gunung-sari-di-kelurahan-kemiri-boyolali', 'Desa Wisata Kreatif Gunung Sari Di Kelurahan Kemiri', 'Kabupaten Boyolali', 'Kecamatan Kreatif Gunung Sari Di Kelurahan Kemiri', -7.605, 110.604, 'BERKEMBANG', 'Pokdarwis Kreatif Gunung Sari Di Kelurahan Kemiri Maju', '081200000122', 78.5),
('e2f37b23-4738-5e2b-827c-63606a5df25d', 'lencoh-boyolali', 'Desa Wisata Lencoh', 'Kabupaten Boyolali', 'Kecamatan Lencoh', -7.601, 110.648, 'BERKEMBANG', 'Pokdarwis Lencoh Maju', '081200000123', 78.5),
('6f00e5c7-f33c-511c-bfbc-6629bb75970e', 'paras-boyolali', 'Desa Wisata Paras', 'Kabupaten Boyolali', 'Kecamatan Paras', -7.597, 110.532, 'BERKEMBANG', 'Pokdarwis Paras Maju', '081200000124', 78.5),
('20fea047-a907-55ed-b6f7-3b270830ea48', 'pengging-handayaningrat-boyolali', 'Desa Wisata Pengging Handayaningrat', 'Kabupaten Boyolali', 'Kecamatan Pengging Handayaningrat', -7.593, 110.576, 'BERKEMBANG', 'Pokdarwis Pengging Handayaningrat Maju', '081200000125', 78.5),
('1ea8457b-fcc1-5035-b63b-b6fd5fb23a3f', 'pereng-gandul-boyolali', 'Desa Wisata Pereng Gandul', 'Kabupaten Boyolali', 'Kecamatan Pereng Gandul', -7.589, 110.62, 'BERKEMBANG', 'Pokdarwis Pereng Gandul Maju', '081200000126', 78.5),
('cbd148f9-eaaa-5308-82cc-50f10ecb4c27', 'pesona-air-nepen-boyolali', 'Desa Wisata Pesona Air Nepen', 'Kabupaten Boyolali', 'Kecamatan Pesona Air Nepen', -7.585, 110.664, 'BERKEMBANG', 'Pokdarwis Pesona Air Nepen Maju', '081200000127', 78.5),
('a0000000-0000-0000-0000-000000000006', 'samiran-boyolali', 'Desa Wisata Samiran', 'Kabupaten Boyolali', 'Kecamatan Samiran', -7.581, 110.548, 'BERKEMBANG', 'Pokdarwis Samiran Maju', '081200000128', 78.5),
('0908631a-2073-51fe-a84d-54f891cf66b1', 'samudra-purnama-boyolali', 'Desa Wisata Samudra Purnama', 'Kabupaten Boyolali', 'Kecamatan Samudra Purnama', -7.577, 110.592, 'BERKEMBANG', 'Pokdarwis Samudra Purnama Maju', '081200000129', 78.5),
('fe956c57-6c26-5cd5-a165-c5404220572c', 'sekar-kedaton-boyolali', 'Desa Wisata Sekar Kedaton', 'Kabupaten Boyolali', 'Kecamatan Sekar Kedaton', -7.573, 110.636, 'BERKEMBANG', 'Pokdarwis Sekar Kedaton Maju', '081200000130', 78.5),
('4e6efba2-6513-53bb-92d3-a7ffe24c663f', 'sendang-songo-boyolali', 'Desa Wisata Sendang Songo', 'Kabupaten Boyolali', 'Kecamatan Sendang Songo', -7.569, 110.52, 'BERKEMBANG', 'Pokdarwis Sendang Songo Maju', '081200000131', 78.5),
('4eccdf53-cf21-528c-a1df-37ecaad999f1', 'sewu-rupo-boyolali', 'Desa Wisata Sewu Rupo', 'Kabupaten Boyolali', 'Kecamatan Sewu Rupo', -7.565, 110.564, 'BERKEMBANG', 'Pokdarwis Sewu Rupo Maju', '081200000132', 78.5),
('663aea27-3e22-58c7-abba-e9684c543ea7', 'sido-makmur-boyolali', 'Desa Wisata Sido Makmur', 'Kabupaten Boyolali', 'Kecamatan Sido Makmur', -7.561, 110.608, 'BERKEMBANG', 'Pokdarwis Sido Makmur Maju', '081200000133', 78.5),
('d836699d-8e72-5ebf-8c5d-88053bd077b6', 'smart-kebonan-boyolali', 'Desa Wisata Smart Kebonan', 'Kabupaten Boyolali', 'Kecamatan Smart Kebonan', -7.557, 110.652, 'BERKEMBANG', 'Pokdarwis Smart Kebonan Maju', '081200000134', 78.5),
('6846359d-bdb1-5898-a8d1-b0bf0bc86f2e', 'sumber-tirta-boyolali', 'Desa Wisata Sumber Tirta', 'Kabupaten Boyolali', 'Kecamatan Sumber Tirta', -7.553, 110.536, 'BERKEMBANG', 'Pokdarwis Sumber Tirta Maju', '081200000135', 78.5),
('e67a1b09-f3b2-57c5-ab68-f0660d6c62a3', 'suroteleng-boyolali', 'Desa Wisata Suroteleng', 'Kabupaten Boyolali', 'Kecamatan Suroteleng', -7.549, 110.58, 'BERKEMBANG', 'Pokdarwis Suroteleng Maju', '081200000136', 78.5),
('fc6b132d-1eb0-5b47-85ab-bc5971e00fae', 'taman-indra-prastha-boyolali', 'Desa Wisata Taman Indra Prastha', 'Kabupaten Boyolali', 'Kecamatan Taman Indra Prastha', -7.545, 110.624, 'BERKEMBANG', 'Pokdarwis Taman Indra Prastha Maju', '081200000137', 78.5),
('a7c6cb38-fc86-5be8-83aa-1b141816e36b', 'tanduk-sejahtera-boyolali', 'Desa Wisata Tanduk Sejahtera', 'Kabupaten Boyolali', 'Kecamatan Tanduk Sejahtera', -7.541, 110.668, 'BERKEMBANG', 'Pokdarwis Tanduk Sejahtera Maju', '081200000138', 78.5),
('f033b1dd-02af-537b-a2f9-4ddccd92663f', 'tegalsari-boyolali', 'Desa Wisata Tegalsari', 'Kabupaten Boyolali', 'Kecamatan Tegalsari', -7.3009, 109.9067, 'BERKEMBANG', 'Pokdarwis Tegalsari Maju', '081200000139', 78.5),
('6187fc00-9086-598a-8f9d-f40fc0c3ac77', 'tikungan-cinta-cluntang-boyolali', 'Desa Wisata Tikungan Cinta Cluntang', 'Kabupaten Boyolali', 'Kecamatan Tikungan Cinta Cluntang', -7.533, 110.596, 'BERKEMBANG', 'Pokdarwis Tikungan Cinta Cluntang Maju', '081200000140', 78.5),
('bc764f2b-54a6-52e5-b614-67a2c5e3e8d5', 'waduk-cengklik-rejo-makmur-boyolali', 'Desa Wisata Waduk Cengklik Rejo Makmur', 'Kabupaten Boyolali', 'Kecamatan Waduk Cengklik Rejo Makmur', -7.529, 110.64, 'BERKEMBANG', 'Pokdarwis Waduk Cengklik Rejo Makmur Maju', '081200000141', 78.5),
('1f2e6316-b863-5de4-b1e5-8e6aba167fff', 'wonosemar-boyolali', 'Desa Wisata Wonosemar', 'Kabupaten Boyolali', 'Kecamatan Wonosemar', -7.525, 110.524, 'BERKEMBANG', 'Pokdarwis Wonosemar Maju', '081200000142', 78.5),
('7251740e-04d5-5b1d-bdc5-61775489a61a', 'batursari-brebes', 'Desa Wisata Batursari', 'Kabupaten Brebes', 'Kecamatan Batursari', -6.858, 109.015, 'BERKEMBANG', 'Pokdarwis Batursari Maju', '081200000143', 78.5),
('1a8f34eb-b51e-55c7-bed7-09594cbf28df', 'ciseureuh-brebes', 'Desa Wisata Ciseureuh', 'Kabupaten Brebes', 'Kecamatan Ciseureuh', -6.854, 109.059, 'BERKEMBANG', 'Pokdarwis Ciseureuh Maju', '081200000144', 78.5),
('91779582-077a-5c3f-93c9-8cd307f9ec08', 'galuh-timur-brebes', 'Desa Wisata Galuh Timur', 'Kabupaten Brebes', 'Kecamatan Galuh Timur', -7.211, 108.9947, 'BERKEMBANG', 'Pokdarwis Galuh Timur Maju', '081200000145', 78.5),
('8259bf89-0e27-5e62-be1b-6880635892e2', 'kaliwlingi-brebes', 'Desa Wisata Kaliwlingi', 'Kabupaten Brebes', 'Kecamatan Kaliwlingi', -6.846, 108.987, 'BERKEMBANG', 'Pokdarwis Kaliwlingi Maju', '081200000146', 78.5),
('5e24280f-7fbc-51e7-b804-cc6192599b4b', 'kampoeng-sokadana-brebes', 'Desa Wisata Kampoeng Sokadana', 'Kabupaten Brebes', 'Kecamatan Kampoeng Sokadana', -6.842, 109.031, 'BERKEMBANG', 'Pokdarwis Kampoeng Sokadana Maju', '081200000147', 78.5),
('1d69c41d-b6e7-5240-bf86-2a19092844e4', 'kampung-sawah-brebes', 'Desa Wisata Kampung Sawah', 'Kabupaten Brebes', 'Kecamatan Kampung Sawah', -6.838, 109.075, 'BERKEMBANG', 'Pokdarwis Kampung Sawah Maju', '081200000148', 78.5),
('cfe2bbf0-58af-5e1f-a0f0-b77fdfa7fc88', 'karangbale-brebes', 'Desa Wisata Karangbale', 'Kabupaten Brebes', 'Kecamatan Karangbale', -6.9939, 108.9209, 'BERKEMBANG', 'Pokdarwis Karangbale Maju', '081200000149', 78.5),
('91cabd2f-28e3-5182-99e5-c3c135f91aea', 'limbangan-wetan-brebes', 'Desa Wisata Limbangan Wetan', 'Kabupaten Brebes', 'Kecamatan Limbangan Wetan', -6.83, 109.003, 'BERKEMBANG', 'Pokdarwis Limbangan Wetan Maju', '081200000150', 78.5),
('16ce8392-4101-5a91-8c87-c52ebc030f46', 'malahayu-brebes', 'Desa Wisata Malahayu', 'Kabupaten Brebes', 'Kecamatan Malahayu', -6.826, 109.047, 'BERKEMBANG', 'Pokdarwis Malahayu Maju', '081200000151', 78.5),
('d9bc82a4-9aad-58ed-9389-de17f5bf27fb', 'pandansari-brebes', 'Desa Wisata Pandansari', 'Kabupaten Brebes', 'Kecamatan Pandansari', -6.822, 109.091, 'BERKEMBANG', 'Pokdarwis Pandansari Maju', '081200000152', 78.5),
('d2eb60c8-9051-5610-b427-c60d3235812e', 'paralayang-brebes', 'Desa Wisata Paralayang', 'Kabupaten Brebes', 'Kecamatan Paralayang', -6.818, 108.975, 'BERKEMBANG', 'Pokdarwis Paralayang Maju', '081200000153', 78.5),
('d54540d7-21ea-5331-a9e3-a7bf3f63952b', 'sawojajar-brebes', 'Desa Wisata Sawojajar', 'Kabupaten Brebes', 'Kecamatan Sawojajar', -6.814, 109.019, 'BERKEMBANG', 'Pokdarwis Sawojajar Maju', '081200000154', 78.5),
('bdfc7a0c-7718-5cf2-8baf-ce73e2d9709f', 'winduaji-brebes', 'Desa Wisata Winduaji', 'Kabupaten Brebes', 'Kecamatan Winduaji', -7.3232, 109.0596, 'BERKEMBANG', 'Pokdarwis Winduaji Maju', '081200000155', 78.5),
('24e7888c-cd0c-58e1-a76d-6607adcd2049', 'winduasri-brebes', 'Desa Wisata Winduasri', 'Kabupaten Brebes', 'Kecamatan Winduasri', -6.806, 109.107, 'BERKEMBANG', 'Pokdarwis Winduasri Maju', '081200000156', 78.5),
('7c84814e-9d3b-58b4-8110-8be5ad13e18c', 'wista-bandungsari-brebes', 'Desa Wisata Wista Bandungsari', 'Kabupaten Brebes', 'Kecamatan Wista Bandungsari', -6.802, 108.991, 'BERKEMBANG', 'Pokdarwis Wista Bandungsari Maju', '081200000157', 78.5),
('413669e3-9815-573e-a268-8d02704bfa1e', 'alam-lestari-cilacap', 'Desa Wisata Alam Lestari', 'Kabupaten Cilacap', 'Kecamatan Alam Lestari', -7.646, 109.007, 'BERKEMBANG', 'Pokdarwis Alam Lestari Maju', '081200000158', 78.5),
('95aa1b7a-f8e8-5fd4-8b8f-827fb74e7c9b', 'bhumi-nawasena-cilacap', 'Desa Wisata Bhumi Nawasena', 'Kabupaten Cilacap', 'Kecamatan Bhumi Nawasena', -7.642, 109.051, 'BERKEMBANG', 'Pokdarwis Bhumi Nawasena Maju', '081200000159', 78.5),
('7497acf3-4f25-5bdf-8fcb-3f9a8fcd0a95', 'bojong-tirta-indah-cilacap', 'Desa Wisata Bojong Tirta Indah', 'Kabupaten Cilacap', 'Kecamatan Bojong Tirta Indah', -7.798, 108.935, 'BERKEMBANG', 'Pokdarwis Bojong Tirta Indah Maju', '081200000160', 78.5),
('931d634d-3cb0-58a6-b1a2-c9a1b9b442c4', 'bunton-cilacap', 'Desa Wisata Bunton', 'Kabupaten Cilacap', 'Adipala', -7.794, 108.979, 'MAJU', 'Pokdarwis Bunton Maju', '081200000161', 85.0),
('0f43a72d-baa5-56d1-be1c-a3e5c9de4844', 'cimendaway-indah-cilacap', 'Desa Wisata Cimendaway Indah', 'Kabupaten Cilacap', 'Kecamatan Cimendaway Indah', -7.79, 109.023, 'BERKEMBANG', 'Pokdarwis Cimendaway Indah Maju', '081200000162', 78.5),
('3302c210-d789-5231-b529-637eba491f97', 'cipari-cilacap', 'Desa Wisata Cipari', 'Kabupaten Cilacap', 'Kecamatan Cipari', -7.786, 109.067, 'BERKEMBANG', 'Pokdarwis Cipari Maju', '081200000163', 78.5),
('7715bebf-8d15-525b-9f77-c825c19b34fb', 'curug-geulis-cilacap', 'Desa Wisata Curug Geulis', 'Kabupaten Cilacap', 'Kecamatan Curug Geulis', -7.782, 108.951, 'BERKEMBANG', 'Pokdarwis Curug Geulis Maju', '081200000164', 78.5),
('eecbd78a-390f-5721-8963-39277b68b30c', 'curug-tonjong-panto-cinagara-cilacap', 'Desa Wisata Curug Tonjong Panto Cinagara', 'Kabupaten Cilacap', 'Kecamatan Curug Tonjong Panto Cinagara', -7.778, 108.995, 'BERKEMBANG', 'Pokdarwis Curug Tonjong Panto Cinagara Maju', '081200000165', 78.5),
('44d8e527-fff3-584c-871b-7220608c9fb8', 'eko-dayeuhluhur-cilacap', 'Desa Wisata Eko (Dayeuhluhur)', 'Kabupaten Cilacap', 'Kecamatan Eko (Dayeuhluhur)', -7.774, 109.039, 'BERKEMBANG', 'Pokdarwis Eko (Dayeuhluhur) Maju', '081200000166', 78.5),
('e9f79d67-c3e0-5d65-8a2c-4d54483f4c21', 'eko-tambaksari-cilacap', 'Desa Wisata Eko Tambaksari', 'Kabupaten Cilacap', 'Kecamatan Eko Tambaksari', -7.77, 109.083, 'BERKEMBANG', 'Pokdarwis Eko Tambaksari Maju', '081200000167', 78.5),
('3cff4f19-1848-5e3b-9a42-058da3b85974', 'genta-cilacap', 'Desa Wisata Genta', 'Kabupaten Cilacap', 'Kecamatan Genta', -7.766, 108.967, 'BERKEMBANG', 'Pokdarwis Genta Maju', '081200000168', 78.5),
('d75ba458-a7f1-5654-860b-cc01a38968a3', 'jambusari-cilacap', 'Desa Wisata Jambusari', 'Kabupaten Cilacap', 'Jeruklegi', -7.762, 109.011, 'MAJU', 'Pokdarwis Jambusari Maju', '081200000169', 85.0),
('7472f2ff-9370-5103-87bf-d44434bb552b', 'kamulyan-cilacap', 'Desa Wisata Kamulyan', 'Kabupaten Cilacap', 'Kecamatan Kamulyan', -7.527, 108.8637, 'BERKEMBANG', 'Pokdarwis Kamulyan Maju', '081200000170', 78.5),
('010fd4b1-8fe9-5e26-a661-13541c394317', 'karang-banar-cilacap', 'Desa Wisata Karang Banar', 'Kabupaten Cilacap', 'Kecamatan Karang Banar', -7.754, 108.939, 'BERKEMBANG', 'Pokdarwis Karang Banar Maju', '081200000171', 78.5),
('334fca74-9569-5bac-abed-a624ee3dfb0e', 'karangmangu-cilacap', 'Desa Wisata Karangmangu', 'Kabupaten Cilacap', 'Kroya', -7.75, 108.983, 'MAJU', 'Pokdarwis Karangmangu Maju', '081200000172', 85.0),
('59d986c0-943d-5838-ad7e-50d83aaabc60', 'karangsari-rawandelik-cilacap', 'Desa Wisata Karangsari (Rawandelik)', 'Kabupaten Cilacap', 'Kecamatan Karangsari (Rawandelik)', -7.746, 109.027, 'BERKEMBANG', 'Pokdarwis Karangsari (Rawandelik) Maju', '081200000173', 78.5),
('f8516e67-847d-5451-929d-6b1d040c2475', 'kompas-cilacap', 'Desa Wisata Kompas', 'Kabupaten Cilacap', 'Kecamatan Kompas', -7.742, 109.071, 'BERKEMBANG', 'Pokdarwis Kompas Maju', '081200000174', 78.5),
('47ab3d82-2452-59f1-8fe9-f450d8f9023a', 'kumandang-cilacap', 'Desa Wisata Kumandang', 'Kabupaten Cilacap', 'Kecamatan Kumandang', -7.738, 108.955, 'BERKEMBANG', 'Pokdarwis Kumandang Maju', '081200000175', 78.5),
('54490577-bf55-5ce9-8da5-9c438289065c', 'lewih-manggu-cilacap', 'Desa Wisata Lewih Manggu', 'Kabupaten Cilacap', 'Kecamatan Lewih Manggu', -7.734, 108.999, 'BERKEMBANG', 'Pokdarwis Lewih Manggu Maju', '081200000176', 78.5),
('1a185998-ea92-59b8-9c8a-a32670623e0e', 'mandala-giri-cilacap', 'Desa Wisata Mandala Giri', 'Kabupaten Cilacap', 'Kecamatan Mandala Giri', -7.73, 109.043, 'BERKEMBANG', 'Pokdarwis Mandala Giri Maju', '081200000177', 78.5),
('90b149eb-d287-5bd8-b93f-06e37dd1afde', 'mentasan-cilacap', 'Desa Wisata Mentasan', 'Kabupaten Cilacap', 'Kawungaten', -7.726, 109.087, 'MAJU', 'Pokdarwis Mentasan Maju', '081200000178', 85.0),
('5c848f15-37ee-5c6e-ac08-1ae0bb840526', 'padang-bumi-kamulyan-cilacap', 'Desa Wisata Padang Bumi Kamulyan', 'Kabupaten Cilacap', 'Kecamatan Padang Bumi Kamulyan', -7.722, 108.971, 'BERKEMBANG', 'Pokdarwis Padang Bumi Kamulyan Maju', '081200000179', 78.5),
('28fbb2d2-0dd7-5e57-ba74-7942e27c8b2b', 'pesona-serayu-cilacap', 'Desa Wisata Pesona Serayu', 'Kabupaten Cilacap', 'Kecamatan Pesona Serayu', -7.718, 109.015, 'BERKEMBANG', 'Pokdarwis Pesona Serayu Maju', '081200000180', 78.5),
('3b98cc95-95da-5f1a-859f-ffb98b44abf0', 'rahayu-cilacap', 'Desa Wisata Rahayu', 'Kabupaten Cilacap', 'Kecamatan Rahayu', -7.714, 109.059, 'BERKEMBANG', 'Pokdarwis Rahayu Maju', '081200000181', 78.5),
('56737772-5fd8-5d9f-be58-5858388378b7', 'salam-sari-cilacap', 'Desa Wisata Salam Sari', 'Kabupaten Cilacap', 'Kecamatan Salam Sari', -7.71, 108.943, 'BERKEMBANG', 'Pokdarwis Salam Sari Maju', '081200000182', 78.5),
('7e27b8ad-3833-56af-a28a-90d67c544fab', 'samudra-mandiri-sejahtera-cilacap', 'Desa Wisata Samudra Mandiri Sejahtera', 'Kabupaten Cilacap', 'Kecamatan Samudra Mandiri Sejahtera', -7.706, 108.987, 'BERKEMBANG', 'Pokdarwis Samudra Mandiri Sejahtera Maju', '081200000183', 78.5),
('aaf8dff8-2325-5495-b48a-d0dfec4d2b9c', 'sendang-kencana-cilacap', 'Desa Wisata Sendang Kencana', 'Kabupaten Cilacap', 'Kecamatan Sendang Kencana', -7.702, 109.031, 'BERKEMBANG', 'Pokdarwis Sendang Kencana Maju', '081200000184', 78.5),
('e271806b-912b-5855-a060-8f1c86ebd80e', 'sport-center-cilacap', 'Desa Wisata Sport Center', 'Kabupaten Cilacap', 'Kecamatan Sport Center', -7.698, 109.075, 'BERKEMBANG', 'Pokdarwis Sport Center Maju', '081200000185', 78.5),
('0f399417-691c-5c72-89fa-ce12e5c845d1', 'talabunsa-cilacap', 'Desa Wisata Talabunsa', 'Kabupaten Cilacap', 'Kecamatan Talabunsa', -7.694, 108.959, 'BERKEMBANG', 'Pokdarwis Talabunsa Maju', '081200000186', 78.5),
('75d1aecc-8499-58fc-b5d7-5393634a707d', 'wagir-indah-cilacap', 'Desa Wisata Wagir Indah', 'Kabupaten Cilacap', 'Kecamatan Wagir Indah', -7.69, 109.003, 'BERKEMBANG', 'Pokdarwis Wagir Indah Maju', '081200000187', 78.5),
('99cc5455-0278-51dd-abba-5f3dbd39554e', 'bedono-demak', 'Desa Wisata Bedono', 'Kabupaten Demak', 'Kecamatan Bedono', -6.862, 110.67, 'BERKEMBANG', 'Pokdarwis Bedono Maju', '081200000188', 78.5),
('74233144-c5cd-5db2-829a-75dd596a40a7', 'berahan-kulon-demak', 'Desa Wisata Berahan Kulon', 'Kabupaten Demak', 'Kecamatan Berahan Kulon', -6.858, 110.714, 'BERKEMBANG', 'Pokdarwis Berahan Kulon Maju', '081200000189', 78.5),
('a7fa1306-5fc4-5731-a1d8-3b10e4976f36', 'bermi-demak', 'Desa Wisata Bermi', 'Kabupaten Demak', 'Kecamatan Bermi', -6.854, 110.598, 'BERKEMBANG', 'Pokdarwis Bermi Maju', '081200000190', 78.5),
('2567b42e-5298-523f-8020-7e041c487176', 'boyolali-demak', 'Desa Wisata Boyolali', 'Kabupaten Demak', 'Kecamatan Boyolali', -6.85, 110.642, 'BERKEMBANG', 'Pokdarwis Boyolali Maju', '081200000191', 78.5),
('4c7fbdb5-f288-5e91-886c-c166da3be441', 'bungo-demak', 'Desa Wisata Bungo', 'Kabupaten Demak', 'Kecamatan Bungo', -6.7788, 110.6231, 'BERKEMBANG', 'Pokdarwis Bungo Maju', '081200000192', 78.5),
('74cfca44-6b7a-5c1d-be85-f2646dbac3dc', 'candisari-demak', 'Desa Wisata Candisari', 'Kabupaten Demak', 'Kecamatan Candisari', -7.0122, 110.5542, 'BERKEMBANG', 'Pokdarwis Candisari Maju', '081200000193', 78.5),
('9a47b602-5adc-5e81-ab05-e7583b7f96f0', 'jatirogo-demak', 'Desa Wisata Jatirogo', 'Kabupaten Demak', 'Kecamatan Jatirogo', -6.838, 110.614, 'BERKEMBANG', 'Pokdarwis Jatirogo Maju', '081200000194', 78.5),
('c12366dc-8e2d-5a53-9372-e7ec77f0627e', 'jragung-demak', 'Desa Wisata Jragung', 'Kabupaten Demak', 'Kecamatan Jragung', -7.1095, 110.5567, 'BERKEMBANG', 'Pokdarwis Jragung Maju', '081200000195', 78.5),
('778507cc-6286-5e99-9052-1031f0938de0', 'kalianyar-demak', 'Desa Wisata Kalianyar', 'Kabupaten Demak', 'Kecamatan Kalianyar', -6.83, 110.702, 'BERKEMBANG', 'Pokdarwis Kalianyar Maju', '081200000196', 78.5),
('b98a9126-3c20-5074-a3bd-3e57c14bda5e', 'karangmlati-demak', 'Desa Wisata Karangmlati', 'Kabupaten Demak', 'Kecamatan Karangmlati', -6.826, 110.586, 'BERKEMBANG', 'Pokdarwis Karangmlati Maju', '081200000197', 78.5),
('7c0af790-4eef-540e-b0f8-44379880e0de', 'kedungori-demak', 'Desa Wisata Kedungori', 'Kabupaten Demak', 'Kecamatan Kedungori', -6.822, 110.63, 'BERKEMBANG', 'Pokdarwis Kedungori Maju', '081200000198', 78.5),
('f0e32aef-6ad7-52df-a646-358af31ff519', 'kunir-demak', 'Desa Wisata Kunir', 'Kabupaten Demak', 'Kecamatan Kunir', -6.818, 110.674, 'BERKEMBANG', 'Pokdarwis Kunir Maju', '081200000199', 78.5),
('031bb385-bf9b-54c8-a71c-3f2338d545df', 'morodemak-demak', 'Desa Wisata Morodemak', 'Kabupaten Demak', 'Kecamatan Morodemak', -6.8308, 110.5524, 'BERKEMBANG', 'Pokdarwis Morodemak Maju', '081200000200', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('d066ed7e-9d82-51a8-9589-3e6e42ef9683', 'mranak-demak', 'Desa Wisata Mranak', 'Kabupaten Demak', 'Kecamatan Mranak', -6.97, 110.602, 'BERKEMBANG', 'Pokdarwis Mranak Maju', '081200000201', 78.5),
('16774159-fc77-5743-9813-14b9fcb0ba24', 'pilangwetan-demak', 'Desa Wisata Pilangwetan', 'Kabupaten Demak', 'Kecamatan Pilangwetan', -6.966, 110.646, 'BERKEMBANG', 'Pokdarwis Pilangwetan Maju', '081200000202', 78.5),
('cfabaade-2ae9-5f01-807e-d80f1d686602', 'surodadi-demak', 'Desa Wisata Surodadi', 'Kabupaten Demak', 'Kecamatan Surodadi', -6.962, 110.69, 'BERKEMBANG', 'Pokdarwis Surodadi Maju', '081200000203', 78.5),
('061e54fc-f442-55aa-b45e-d9994db4bbb5', 'tambakbulusan-demak', 'Desa Wisata Tambakbulusan', 'Kabupaten Demak', 'Kecamatan Tambakbulusan', -6.958, 110.574, 'BERKEMBANG', 'Pokdarwis Tambakbulusan Maju', '081200000204', 78.5),
('5bc45b96-0e1f-50e5-b1c1-f4b7539419af', 'temuroso-demak', 'Desa Wisata Temuroso', 'Kabupaten Demak', 'Kecamatan Temuroso', -6.954, 110.618, 'BERKEMBANG', 'Pokdarwis Temuroso Maju', '081200000205', 78.5),
('321bf30f-dae8-5e70-8f43-ff9cb07d0686', 'timbulsloko-demak', 'Desa Wisata Timbulsloko', 'Kabupaten Demak', 'Kecamatan Timbulsloko', -6.95, 110.662, 'BERKEMBANG', 'Pokdarwis Timbulsloko Maju', '081200000206', 78.5),
('40465d0c-812c-532b-b37f-4f07311a7e46', 'tlogoweru-demak', 'Desa Wisata Tlogoweru', 'Kabupaten Demak', 'Kecamatan Tlogoweru', -7.0145, 110.6131, 'BERKEMBANG', 'Pokdarwis Tlogoweru Maju', '081200000207', 78.5),
('a8371b24-82a7-55b1-b9b7-93ee4f1f791d', 'wonosari-demak', 'Desa Wisata Wonosari', 'Kabupaten Demak', 'Kecamatan Wonosari', -6.942, 110.59, 'BERKEMBANG', 'Pokdarwis Wonosari Maju', '081200000208', 78.5),
('4724fb63-ab69-5be8-bfb1-8b50d7d36016', 'banjarejo-grobogan', 'Desa Wisata Banjarejo', 'Kabupaten Grobogan', 'Kecamatan Banjarejo', -7.131, 110.913, 'BERKEMBANG', 'Pokdarwis Banjarejo Maju', '081200000209', 78.5),
('0e019778-abf8-55dc-8a68-63da301a7d39', 'cingkrong-grobogan', 'Desa Wisata Cingkrong', 'Kabupaten Grobogan', 'Kecamatan Cingkrong', -7.127, 110.957, 'BERKEMBANG', 'Pokdarwis Cingkrong Maju', '081200000210', 78.5),
('7553d075-04dd-53b2-8d4b-211475992044', 'crewek-grobogan', 'Desa Wisata Crewek', 'Kabupaten Grobogan', 'Kecamatan Crewek', -7.152, 111.1144, 'BERKEMBANG', 'Pokdarwis Crewek Maju', '081200000211', 78.5),
('f09a50a4-2024-5325-9e5e-4be379a7dc70', 'dokoro-grobogan', 'Desa Wisata Dokoro', 'Kabupaten Grobogan', 'Kecamatan Dokoro', -7.119, 110.885, 'BERKEMBANG', 'Pokdarwis Dokoro Maju', '081200000212', 78.5),
('33860ed9-ca0d-5f2a-a29b-c479af82339b', 'geyer-grobogan', 'Desa Wisata Geyer', 'Kabupaten Grobogan', 'Kecamatan Geyer', -7.115, 110.929, 'BERKEMBANG', 'Pokdarwis Geyer Maju', '081200000213', 78.5),
('f59f7d30-ca57-5167-b06e-c10281f58cf5', 'godan-grobogan', 'Desa Wisata Godan', 'Kabupaten Grobogan', 'Kecamatan Godan', -7.0491, 111.0228, 'BERKEMBANG', 'Pokdarwis Godan Maju', '081200000214', 78.5),
('30d44f33-8df7-5fc0-9033-a6c4df1c79e3', 'grabagan-grobogan', 'Desa Wisata Grabagan', 'Kabupaten Grobogan', 'Kradenan', -7.107, 110.857, 'MANDIRI', 'Pokdarwis Grabagan Maju', '081200000215', 92.5),
('0575c8aa-3d68-54ed-b8f5-060c0c60f4e0', 'jatiharjo-grobogan', 'Desa Wisata Jatiharjo', 'Kabupaten Grobogan', 'Kecamatan Jatiharjo', -7.103, 110.901, 'BERKEMBANG', 'Pokdarwis Jatiharjo Maju', '081200000216', 78.5),
('413a463e-234e-53ea-9f87-a05979863787', 'jono-grobogan', 'Desa Wisata Jono', 'Kabupaten Grobogan', 'Kecamatan Jono', -7.099, 110.945, 'BERKEMBANG', 'Pokdarwis Jono Maju', '081200000217', 78.5),
('f63a5061-490b-59e0-8c23-16a7cb736bdd', 'karangsari-grobogan', 'Desa Wisata Karangsari', 'Kabupaten Grobogan', 'Kecamatan Karangsari', -7.095, 110.989, 'BERKEMBANG', 'Pokdarwis Karangsari Maju', '081200000218', 78.5),
('6c31b7ae-3863-5b8d-894a-9dda15699532', 'kemadohbatur-grobogan', 'Desa Wisata Kemadohbatur', 'Kabupaten Grobogan', 'Kecamatan Kemadohbatur', -7.091, 110.873, 'BERKEMBANG', 'Pokdarwis Kemadohbatur Maju', '081200000219', 78.5),
('a6e1572c-31e2-5371-ab28-c2e023e3a21d', 'kradenan-grobogan', 'Desa Wisata Kradenan', 'Kabupaten Grobogan', 'Kecamatan Kradenan', -7.087, 110.917, 'BERKEMBANG', 'Pokdarwis Kradenan Maju', '081200000220', 78.5),
('1532e572-b622-56f2-a778-cfac25c2933b', 'krangganharjo-grobogan', 'Desa Wisata Krangganharjo', 'Kabupaten Grobogan', 'Kecamatan Krangganharjo', -7.083, 110.961, 'BERKEMBANG', 'Pokdarwis Krangganharjo Maju', '081200000221', 78.5),
('d0a9e9c3-66a2-5e13-bc06-1b99c51eab6a', 'kronggen-grobogan', 'Desa Wisata Kronggen', 'Kabupaten Grobogan', 'Kecamatan Kronggen', -7.079, 110.845, 'BERKEMBANG', 'Pokdarwis Kronggen Maju', '081200000222', 78.5),
('5e132932-1173-500d-9ade-afc9fc2489bb', 'kuwu-grobogan', 'Desa Wisata Kuwu', 'Kabupaten Grobogan', 'Kecamatan Kuwu', -7.075, 110.889, 'BERKEMBANG', 'Pokdarwis Kuwu Maju', '081200000223', 78.5),
('90004f0b-4db7-5485-858c-770f4aab8a6e', 'manggarmas-grobogan', 'Desa Wisata Manggarmas', 'Kabupaten Grobogan', 'Kecamatan Manggarmas', -7.071, 110.933, 'BERKEMBANG', 'Pokdarwis Manggarmas Maju', '081200000224', 78.5),
('ff9432f5-c097-5e80-8424-67396beed3a4', 'mlowokarangtalun-grobogan', 'Desa Wisata Mlowokarangtalun', 'Kabupaten Grobogan', 'Kecamatan Mlowokarangtalun', -7.067, 110.977, 'BERKEMBANG', 'Pokdarwis Mlowokarangtalun Maju', '081200000225', 78.5),
('39ddb7b2-6d95-55d0-af9e-9a6a3eb0570e', 'penadaran-grobogan', 'Desa Wisata Penadaran', 'Kabupaten Grobogan', 'Kecamatan Penadaran', -7.063, 110.861, 'BERKEMBANG', 'Pokdarwis Penadaran Maju', '081200000226', 78.5),
('6e314363-d633-5859-9c0e-947bafed8247', 'penganten-grobogan', 'Desa Wisata Penganten', 'Kabupaten Grobogan', 'Kecamatan Penganten', -7.059, 110.905, 'BERKEMBANG', 'Pokdarwis Penganten Maju', '081200000227', 78.5),
('82b312e2-aece-501e-856b-0ad1978f67c3', 'putat-grobogan', 'Desa Wisata Putat', 'Kabupaten Grobogan', 'Purwodadi', -7.055, 110.949, 'MAJU', 'Pokdarwis Putat Maju', '081200000228', 85.0),
('69ec0bac-10e7-5243-afc9-58b5bf3c2848', 'rambat-grobogan', 'Desa Wisata Rambat', 'Kabupaten Grobogan', 'Kecamatan Rambat', -7.051, 110.993, 'BERKEMBANG', 'Pokdarwis Rambat Maju', '081200000229', 78.5),
('2fc685d5-87eb-59d1-93f1-c9c2f47af41c', 'sedayu-grobogan', 'Desa Wisata Sedayu', 'Kabupaten Grobogan', 'Kecamatan Sedayu', -6.9662, 111.0219, 'BERKEMBANG', 'Pokdarwis Sedayu Maju', '081200000230', 78.5),
('09ba489b-1441-549d-9f78-851a6aa2f2a1', 'selo-grobogan', 'Desa Wisata Selo', 'Kabupaten Grobogan', 'Kecamatan Selo', -7.043, 110.921, 'BERKEMBANG', 'Pokdarwis Selo Maju', '081200000231', 78.5),
('6b16dfe9-474f-56aa-bbac-b55e82f52742', 'simo-grobogan', 'Desa Wisata Simo', 'Kabupaten Grobogan', 'Kradenan', -7.039, 110.965, 'MANDIRI', 'Pokdarwis Simo Maju', '081200000232', 92.5),
('217dc257-dda7-5e02-9472-632d774536c8', 'sumberagung-grobogan', 'Desa Wisata Sumberagung', 'Kabupaten Grobogan', 'Kecamatan Sumberagung', -7.035, 110.849, 'BERKEMBANG', 'Pokdarwis Sumberagung Maju', '081200000233', 78.5),
('7672a0e5-436c-5696-8166-b19b4a3d3172', 'sumberjatipohon-grobogan', 'Desa Wisata Sumberjatipohon', 'Kabupaten Grobogan', 'Kecamatan Sumberjatipohon', -7.031, 110.893, 'BERKEMBANG', 'Pokdarwis Sumberjatipohon Maju', '081200000234', 78.5),
('01eccdac-7800-59d4-a85b-eb161dde7877', 'sumberjosari-grobogan', 'Desa Wisata Sumberjosari', 'Kabupaten Grobogan', 'Kecamatan Sumberjosari', -7.115, 110.7805, 'BERKEMBANG', 'Pokdarwis Sumberjosari Maju', '081200000235', 78.5),
('dd731a6c-efc4-55c8-8d08-fcbe644c913d', 'tanjungharjo-grobogan', 'Desa Wisata Tanjungharjo', 'Kabupaten Grobogan', 'Kecamatan Tanjungharjo', -7.023, 110.981, 'BERKEMBANG', 'Pokdarwis Tanjungharjo Maju', '081200000236', 78.5),
('d52d6058-0377-51a6-85fa-3b612aff2532', 'tarub-grobogan', 'Desa Wisata Tarub', 'Kabupaten Grobogan', 'Kecamatan Tarub', -7.0759, 111.0121, 'BERKEMBANG', 'Pokdarwis Tarub Maju', '081200000237', 78.5),
('4fb57ed6-7e23-533a-8a29-acbe838db038', 'tegowanu-wetan-grobogan', 'Desa Wisata Tegowanu Wetan', 'Kabupaten Grobogan', 'Tegowanu', -7.015, 110.909, 'MAJU', 'Pokdarwis Tegowanu Wetan Maju', '081200000238', 85.0),
('638b2fa2-9efd-5bbc-aa74-88a0849dc056', 'temurejo-grobogan', 'Desa Wisata Temurejo', 'Kabupaten Grobogan', 'Kecamatan Temurejo', -7.011, 110.953, 'BERKEMBANG', 'Pokdarwis Temurejo Maju', '081200000239', 78.5),
('e3b18649-9cb3-501c-81d2-55743dd56374', 'tlogorejo-grobogan', 'Desa Wisata Tlogorejo', 'Kabupaten Grobogan', 'Kecamatan Tlogorejo', -7.045, 110.7195, 'BERKEMBANG', 'Pokdarwis Tlogorejo Maju', '081200000240', 78.5),
('885c88af-a752-5b30-ae1a-c9495f5d5c82', 'bandengan-jepara', 'Desa Wisata Bandengan', 'Kabupaten Jepara', 'Kecamatan Bandengan', -6.665, 110.632, 'BERKEMBANG', 'Pokdarwis Bandengan Maju', '081200000241', 78.5),
('86e8e09f-63c2-5092-a8d0-4a381d533bd5', 'banjar-agung-jepara', 'Desa Wisata Banjar Agung', 'Kabupaten Jepara', 'Bangsri', -6.661, 110.676, 'MAJU', 'Pokdarwis Banjar Agung Maju', '081200000242', 85.0),
('53f552a6-769d-5eaa-ab68-3e4e8e6ae469', 'batealit-jepara', 'Desa Wisata Batealit', 'Kabupaten Jepara', 'Kecamatan Batealit', -6.6292, 110.7367, 'BERKEMBANG', 'Pokdarwis Batealit Maju', '081200000243', 78.5),
('1867def6-ccbc-5621-9823-c903fcebada3', 'bondo-jepara', 'Desa Wisata Bondo', 'Kabupaten Jepara', 'Kecamatan Bondo', -6.653, 110.604, 'BERKEMBANG', 'Pokdarwis Bondo Maju', '081200000244', 78.5),
('2ae13271-35bc-5101-b4c2-0f82b0e00b13', 'damarwulan-jepara', 'Desa Wisata Damarwulan', 'Kabupaten Jepara', 'Kecamatan Damarwulan', -6.649, 110.648, 'BERKEMBANG', 'Pokdarwis Damarwulan Maju', '081200000245', 78.5),
('feb91098-9cc1-5f57-a429-28e9c4d65dd9', 'gemulung-jepara', 'Desa Wisata Gemulung', 'Kabupaten Jepara', 'Kecamatan Gemulung', -6.645, 110.692, 'BERKEMBANG', 'Pokdarwis Gemulung Maju', '081200000246', 78.5),
('2406211b-9859-5b65-a3a4-61d849094d9b', 'karimunjawa-jepara', 'Desa Wisata Karimunjawa', 'Kabupaten Jepara', 'Kecamatan Karimunjawa', -6.641, 110.736, 'BERKEMBANG', 'Pokdarwis Karimunjawa Maju', '081200000247', 78.5),
('22e9019b-2536-5082-b7eb-b570e3a52835', 'kemujan-jepara', 'Desa Wisata Kemujan', 'Kabupaten Jepara', 'Kecamatan Kemujan', -6.637, 110.62, 'BERKEMBANG', 'Pokdarwis Kemujan Maju', '081200000248', 78.5),
('1c9db815-b18e-5fc7-ac5f-00c9d06bc0e2', 'kendeng-sidi-alit-jepara', 'Desa Wisata Kendeng Sidi Alit', 'Kabupaten Jepara', 'Kecamatan Kendeng Sidi Alit', -6.633, 110.664, 'BERKEMBANG', 'Pokdarwis Kendeng Sidi Alit Maju', '081200000249', 78.5),
('8f836464-3373-5c3d-98f2-3538118e304c', 'kunir-jepara', 'Desa Wisata Kunir', 'Kabupaten Jepara', 'Kecamatan Kunir', -6.629, 110.708, 'BERKEMBANG', 'Pokdarwis Kunir Maju', '081200000250', 78.5),
('81588e88-45bf-5277-b71b-7d156c0a1348', 'mulyoharjo-jepara', 'Desa Wisata Mulyoharjo', 'Kabupaten Jepara', 'Kecamatan Mulyoharjo', -6.625, 110.592, 'BERKEMBANG', 'Pokdarwis Mulyoharjo Maju', '081200000251', 78.5),
('8c4806f5-33ff-5f8f-9d9c-1de139c50d64', 'panggung-jepara', 'Desa Wisata Panggung', 'Kabupaten Jepara', 'Kecamatan Panggung', -6.621, 110.636, 'BERKEMBANG', 'Pokdarwis Panggung Maju', '081200000252', 78.5),
('407b1b7d-0219-5f44-9656-7f79864589fd', 'petekeyan-jepara', 'Desa Wisata Petekeyan', 'Kabupaten Jepara', 'Kecamatan Petekeyan', -6.617, 110.68, 'BERKEMBANG', 'Pokdarwis Petekeyan Maju', '081200000253', 78.5),
('c631e80f-e1f4-50bd-9e4e-d29911c134ce', 'plajan-jepara', 'Desa Wisata Plajan', 'Kabupaten Jepara', 'Kecamatan Plajan', -6.613, 110.724, 'BERKEMBANG', 'Pokdarwis Plajan Maju', '081200000254', 78.5),
('6845d2da-56f3-5a62-bcf2-30d7f444b4f8', 'plosorejo-jepara', 'Desa Wisata Plosorejo', 'Kabupaten Jepara', 'Kecamatan Plosorejo', -7.0654, 110.9919, 'BERKEMBANG', 'Pokdarwis Plosorejo Maju', '081200000255', 78.5),
('0a5286ce-a4a9-5440-851c-67f590987354', 'pule-jepara', 'Desa Wisata Pule', 'Kabupaten Jepara', 'Kecamatan Pule', -6.6878, 110.7978, 'BERKEMBANG', 'Pokdarwis Pule Maju', '081200000256', 78.5),
('4503da1b-bf0b-5de0-9933-169401aac453', 'semat-jepara', 'Desa Wisata Semat', 'Kabupaten Jepara', 'Tahunan', -6.601, 110.696, 'MAJU', 'Pokdarwis Semat Maju', '081200000257', 85.0),
('0803e35c-6765-52e6-805b-78dc3ccf3b21', 'suwawal-timur-jepara', 'Desa Wisata Suwawal Timur', 'Kabupaten Jepara', 'Kecamatan Suwawal Timur', -6.597, 110.74, 'BERKEMBANG', 'Pokdarwis Suwawal Timur Maju', '081200000258', 78.5),
('29ae8c55-f6dd-5d30-93fc-96371c1df4d4', 'tanjung-jepara', 'Desa Wisata Tanjung', 'Kabupaten Jepara', 'Kecamatan Tanjung', -7.6644, 110.7505, 'BERKEMBANG', 'Pokdarwis Tanjung Maju', '081200000259', 78.5),
('bdb80ff2-93e4-5116-85fd-c4610e8f27f4', 'tegalsambi-jepara', 'Desa Wisata Tegalsambi', 'Kabupaten Jepara', 'Kecamatan Tegalsambi', -6.589, 110.668, 'BERKEMBANG', 'Pokdarwis Tegalsambi Maju', '081200000260', 78.5),
('23bdd2cb-0742-5143-aa4e-efa6463b69b1', 'teluk-awur-jepara', 'Desa Wisata Teluk Awur', 'Kabupaten Jepara', 'Kecamatan Teluk Awur', -6.585, 110.712, 'BERKEMBANG', 'Pokdarwis Teluk Awur Maju', '081200000261', 78.5),
('dfe0a8e3-97a9-5fd9-bcd3-07d7047ba419', 'tempur-jepara', 'Desa Wisata Tempur', 'Kabupaten Jepara', 'Kecamatan Tempur', -6.581, 110.596, 'BERKEMBANG', 'Pokdarwis Tempur Maju', '081200000262', 78.5),
('de7e6e91-f381-56ff-8d04-7a921069c17f', 'troso-jepara', 'Desa Wisata Troso', 'Kabupaten Jepara', 'Kecamatan Troso', -6.577, 110.64, 'BERKEMBANG', 'Pokdarwis Troso Maju', '081200000263', 78.5),
('045dbe0e-9692-5881-a3b6-2c9e90957f37', 'watu-aji-jepara', 'Desa Wisata Watu Aji', 'Kabupaten Jepara', 'Keling', -6.573, 110.684, 'MAJU', 'Pokdarwis Watu Aji Maju', '081200000264', 85.0),
('28875380-90d3-5ee3-b9bb-4bca7acc6c34', 'welahan-jepara', 'Desa Wisata Welahan', 'Kabupaten Jepara', 'Kecamatan Welahan', -6.765, 110.7131, 'BERKEMBANG', 'Pokdarwis Welahan Maju', '081200000265', 78.5),
('69df7e96-b45d-5ad3-a023-602fe6926982', 'alaska-karanganyar', 'Desa Wisata Alaska', 'Kabupaten Karanganyar', 'Kecamatan Alaska', -7.572, 110.895, 'BERKEMBANG', 'Pokdarwis Alaska Maju', '081200000266', 78.5),
('c1b88526-6eda-5bf3-bd88-e31ff1e6d226', 'anggrasmanis-karanganyar', 'Desa Wisata Anggrasmanis', 'Kabupaten Karanganyar', 'Jenawi', -7.568, 110.939, 'MAJU', 'Pokdarwis Anggrasmanis Maju', '081200000267', 85.0),
('f9a8c9f5-c15b-5e57-ad05-36e9954c8af2', 'batik-girilayu-karanganyar', 'Desa Wisata Batik Girilayu', 'Kabupaten Karanganyar', 'Kecamatan Batik Girilayu', -7.564, 110.983, 'BERKEMBANG', 'Pokdarwis Batik Girilayu Maju', '081200000268', 78.5),
('31b758be-f7ad-5def-9337-cad7a4e1b498', 'berjo-karanganyar', 'Desa Wisata Berjo', 'Kabupaten Karanganyar', 'Ngargoyoso', -7.56, 111.027, 'MAJU', 'Pokdarwis Berjo Maju', '081200000269', 85.0),
('afd1a426-f571-55ae-8254-56d1514ae829', 'beruk-sejuk-karanganyar', 'Desa Wisata Beruk Sejuk', 'Kabupaten Karanganyar', 'Kecamatan Beruk Sejuk', -7.556, 110.911, 'BERKEMBANG', 'Pokdarwis Beruk Sejuk Maju', '081200000270', 78.5),
('92a60ebb-c564-5acd-820d-d544bf9a1b32', 'cetho-karanganyar', 'Desa Wisata Cetho', 'Kabupaten Karanganyar', 'Kecamatan Cetho', -7.552, 110.955, 'BERKEMBANG', 'Pokdarwis Cetho Maju', '081200000271', 78.5),
('a3617dcf-b52d-52ce-b0d2-5435bbf9a9d4', 'gempolan-karanganyar', 'Desa Wisata Gempolan', 'Kabupaten Karanganyar', 'Kecamatan Gempolan', -7.548, 110.999, 'BERKEMBANG', 'Pokdarwis Gempolan Maju', '081200000272', 78.5),
('fe2b19e8-e3a5-556a-b2e4-12d7418f8a6b', 'girimulyo-karanganyar', 'Desa Wisata Girimulyo', 'Kabupaten Karanganyar', 'Kecamatan Girimulyo', -7.544, 110.883, 'BERKEMBANG', 'Pokdarwis Girimulyo Maju', '081200000273', 78.5),
('21ea9a73-5db0-50ec-be5e-0792bfa264f2', 'gondang-tresno-karanganyar', 'Desa Wisata Gondang Tresno', 'Kabupaten Karanganyar', 'Kecamatan Gondang Tresno', -7.54, 110.927, 'BERKEMBANG', 'Pokdarwis Gondang Tresno Maju', '081200000274', 78.5),
('26228761-cdaa-529f-9869-40e595f19adf', 'harjosari-karanganyar', 'Desa Wisata Harjosari', 'Kabupaten Karanganyar', 'Kecamatan Harjosari', -7.536, 110.971, 'BERKEMBANG', 'Pokdarwis Harjosari Maju', '081200000275', 78.5),
('50994b01-09ba-5923-a400-e8f55d615c11', 'kampung-barokah-karanganyar', 'Desa Wisata Kampung  Barokah', 'Kabupaten Karanganyar', 'Kecamatan Kampung  Barokah', -7.532, 111.015, 'BERKEMBANG', 'Pokdarwis Kampung  Barokah Maju', '081200000276', 78.5),
('fde3888c-4dad-5ac4-a69e-9c86daee5b9d', 'kampung-blumbang-karanganyar', 'Desa Wisata Kampung  Blumbang', 'Kabupaten Karanganyar', 'Kecamatan Kampung  Blumbang', -7.528, 110.899, 'BERKEMBANG', 'Pokdarwis Kampung  Blumbang Maju', '081200000277', 78.5),
('dfd7e82c-01d7-566e-ac3c-c98a7a06d58f', 'kampung-sekipan-karanganyar', 'Desa Wisata Kampung  Sekipan', 'Kabupaten Karanganyar', 'Kecamatan Kampung  Sekipan', -7.524, 110.943, 'BERKEMBANG', 'Pokdarwis Kampung  Sekipan Maju', '081200000278', 78.5),
('c7be730a-5712-5fe3-8448-88ee894495a1', 'kampung-sewu-kembang-karanganyar', 'Desa Wisata Kampung  Sewu Kembang', 'Kabupaten Karanganyar', 'Kecamatan Kampung  Sewu Kembang', -7.52, 110.987, 'BERKEMBANG', 'Pokdarwis Kampung  Sewu Kembang Maju', '081200000279', 78.5),
('0b98223d-6909-5f83-839d-fab7e28c31a0', 'kampung-purba-dayu-karanganyar', 'Desa Wisata Kampung Purba Dayu', 'Kabupaten Karanganyar', 'Kecamatan Kampung Purba Dayu', -7.676, 110.871, 'BERKEMBANG', 'Pokdarwis Kampung Purba Dayu Maju', '081200000280', 78.5),
('c29959a3-bbe0-5e23-b344-cf4cde0ed013', 'karang-karanganyar', 'Desa Wisata Karang', 'Kabupaten Karanganyar', 'Kecamatan Karang', -7.672, 110.915, 'BERKEMBANG', 'Pokdarwis Karang Maju', '081200000281', 78.5),
('299eedd1-bec5-58f5-9ace-63ff7b9f58be', 'karangrejo-karanganyar', 'Desa Wisata Karangrejo', 'Kabupaten Karanganyar', 'Kecamatan Karangrejo', -7.668, 110.959, 'BERKEMBANG', 'Pokdarwis Karangrejo Maju', '081200000282', 78.5),
('61d83ce7-eb33-5ed5-bab6-3baeaa57e863', 'kembang-dawung-karanganyar', 'Desa Wisata Kembang  Dawung', 'Kabupaten Karanganyar', 'Kecamatan Kembang  Dawung', -7.664, 111.003, 'BERKEMBANG', 'Pokdarwis Kembang  Dawung Maju', '081200000283', 78.5),
('b4c66c01-b64c-51d7-a85e-55b55b00fcbf', 'kemuning-karanganyar', 'Desa Wisata Kemuning', 'Kabupaten Karanganyar', 'Kecamatan Kemuning', -7.66, 110.887, 'BERKEMBANG', 'Pokdarwis Kemuning Maju', '081200000284', 78.5),
('bde3a802-80cd-5e44-996a-9c2377edc663', 'kimendeng-gebyog-karanganyar', 'Desa Wisata Kimendeng Gebyog', 'Kabupaten Karanganyar', 'Kecamatan Kimendeng Gebyog', -7.656, 110.931, 'BERKEMBANG', 'Pokdarwis Kimendeng Gebyog Maju', '081200000285', 78.5),
('bb232d1c-619e-5f5d-9892-dab81d73cab7', 'klatak-karanganyar', 'Desa Wisata Klatak', 'Kabupaten Karanganyar', 'Kecamatan Klatak', -7.652, 110.975, 'BERKEMBANG', 'Pokdarwis Klatak Maju', '081200000286', 78.5),
('4ff1c7de-d485-5693-a976-9410865d6c00', 'lembah-dongde-karanganyar', 'Desa Wisata Lembah Dongde', 'Kabupaten Karanganyar', 'Kecamatan Lembah Dongde', -7.648, 111.019, 'BERKEMBANG', 'Pokdarwis Lembah Dongde Maju', '081200000287', 78.5),
('497f1612-1404-5731-bc0d-e4bf7185fd82', 'pablengan-karanganyar', 'Desa Wisata Pablengan', 'Kabupaten Karanganyar', 'Kecamatan Pablengan', -7.644, 110.903, 'BERKEMBANG', 'Pokdarwis Pablengan Maju', '081200000288', 78.5),
('b7f0b83e-e0a4-56bc-8057-082497d29924', 'rejosari-karanganyar', 'Desa Wisata Rejosari', 'Kabupaten Karanganyar', 'Kecamatan Rejosari', -7.2792, 110.0608, 'BERKEMBANG', 'Pokdarwis Rejosari Maju', '081200000289', 78.5),
('352609ca-8f1c-583d-9e43-4db489cd2769', 'salam-karanganyar', 'Desa Wisata Salam', 'Kabupaten Karanganyar', 'Kecamatan Salam', -7.636, 110.991, 'BERKEMBANG', 'Pokdarwis Salam Maju', '081200000290', 78.5),
('d98c8f91-c9d8-5126-b7d8-70df41d4887a', 'segorogunung-karanganyar', 'Desa Wisata Segorogunung', 'Kabupaten Karanganyar', 'Ngargoyoso', -7.632, 110.875, 'MANDIRI', 'Pokdarwis Segorogunung Maju', '081200000291', 92.5),
('938e310e-11f1-53e7-93a4-decc9158e1c7', 'sendang-bejen-karanganyar', 'Desa Wisata Sendang Bejen', 'Kabupaten Karanganyar', 'Kecamatan Sendang Bejen', -7.628, 110.919, 'BERKEMBANG', 'Pokdarwis Sendang Bejen Maju', '081200000292', 78.5),
('38481dd0-f6d1-57c6-abde-6749a50f8481', 'sendang-plesungan-karanganyar', 'Desa Wisata Sendang Plesungan', 'Kabupaten Karanganyar', 'Kecamatan Sendang Plesungan', -7.624, 110.963, 'BERKEMBANG', 'Pokdarwis Sendang Plesungan Maju', '081200000293', 78.5),
('29a1a30e-6bf7-5500-911e-6023373c1c92', 'sumberbulu-karanganyar', 'Desa Wisata Sumberbulu', 'Kabupaten Karanganyar', 'Kecamatan Sumberbulu', -7.62, 111.007, 'BERKEMBANG', 'Pokdarwis Sumberbulu Maju', '081200000294', 78.5),
('c711e76a-f8fa-5fe9-b4c0-56960803b490', 'tamansari-karanganyar', 'Desa Wisata Tamansari', 'Kabupaten Karanganyar', 'Kecamatan Tamansari', -7.4339, 109.1899, 'BERKEMBANG', 'Pokdarwis Tamansari Maju', '081200000295', 78.5),
('1e2ab906-1543-522e-8406-c8cd47aa72d8', 'trengguli-karanganyar', 'Desa Wisata Trengguli', 'Kabupaten Karanganyar', 'Kecamatan Trengguli', -7.612, 110.935, 'BERKEMBANG', 'Pokdarwis Trengguli Maju', '081200000296', 78.5),
('a168941e-8c6a-5240-a37b-104128071a4c', 'tunggulrejo-karanganyar', 'Desa Wisata Tunggulrejo', 'Kabupaten Karanganyar', 'Kecamatan Tunggulrejo', -7.608, 110.979, 'BERKEMBANG', 'Pokdarwis Tunggulrejo Maju', '081200000297', 78.5),
('47c1a111-4e5c-56ce-8fec-f37b2af6e1a6', 'umbul-udal-udalan-karanganyar', 'Desa Wisata Umbul Udal Udalan', 'Kabupaten Karanganyar', 'Kecamatan Umbul Udal Udalan', -7.604, 111.023, 'BERKEMBANG', 'Pokdarwis Umbul Udal Udalan Maju', '081200000298', 78.5),
('e0824e5e-ba3c-59d3-9728-6382e9e1d24b', 'wonorejo-karanganyar', 'Desa Wisata Wonorejo', 'Kabupaten Karanganyar', 'Kecamatan Wonorejo', -7.7058, 111.1227, 'BERKEMBANG', 'Pokdarwis Wonorejo Maju', '081200000299', 78.5),
('00f84d6c-5ab4-5a69-9940-35568435c382', 'adiluhur-kebumen', 'Desa Wisata Adiluhur', 'Kabupaten Kebumen', 'Kecamatan Adiluhur', -7.67, 109.66, 'BERKEMBANG', 'Pokdarwis Adiluhur Maju', '081200000300', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('d34a651a-77ab-5200-9127-2ccc29e115e8', 'buayan-kebumen', 'Desa Wisata Buayan', 'Kabupaten Kebumen', 'Kecamatan Buayan', -7.666, 109.704, 'BERKEMBANG', 'Pokdarwis Buayan Maju', '081200000301', 78.5),
('4bf17b10-f724-55e2-984d-65603eddc1ed', 'cangkring-kebumen', 'Desa Wisata Cangkring', 'Kabupaten Kebumen', 'Kecamatan Cangkring', -7.662, 109.588, 'BERKEMBANG', 'Pokdarwis Cangkring Maju', '081200000302', 78.5),
('6b5d087d-6177-58a3-a892-fa1dfdc931b1', 'grenggeng-kebumen', 'Desa Wisata Grenggeng', 'Kabupaten Kebumen', 'Kecamatan Grenggeng', -7.658, 109.632, 'BERKEMBANG', 'Pokdarwis Grenggeng Maju', '081200000303', 78.5),
('0b6d2a40-8156-54d5-a210-160eb0c05596', 'gunungsari-kebumen', 'Desa Wisata Gunungsari', 'Kabupaten Kebumen', 'Kecamatan Gunungsari', -7.5391, 109.6166, 'BERKEMBANG', 'Pokdarwis Gunungsari Maju', '081200000304', 78.5),
('de15a9bb-25bb-532e-9c97-3e43f3e9e39a', 'jatijajar-kebumen', 'Desa Wisata Jatijajar', 'Kabupaten Kebumen', 'Kecamatan Jatijajar', -7.65, 109.72, 'BERKEMBANG', 'Pokdarwis Jatijajar Maju', '081200000305', 78.5),
('eae8debb-4c43-5f3e-b8dd-d82f1842ec0b', 'jemur-kebumen', 'Desa Wisata Jemur', 'Kabupaten Kebumen', 'Kecamatan Jemur', -7.646, 109.604, 'BERKEMBANG', 'Pokdarwis Jemur Maju', '081200000306', 78.5),
('cd4e622d-6364-50ed-88b2-e5e4f05d7d2c', 'jemur-kebumen-2', 'Desa Wisata Jemur', 'Kabupaten Kebumen', 'Kecamatan Jemur', -7.642, 109.648, 'BERKEMBANG', 'Pokdarwis Jemur Maju', '081200000307', 78.5),
('c7fec11e-d829-5be0-81e2-4123e054fadf', 'kalibening-kebumen', 'Desa Wisata Kalibening', 'Kabupaten Kebumen', 'Kecamatan Kalibening', -7.5419, 109.6333, 'BERKEMBANG', 'Pokdarwis Kalibening Maju', '081200000308', 78.5),
('507d4972-e06b-56e2-923a-f877a12aa8a5', 'kalipoh-kebumen', 'Desa Wisata Kalipoh', 'Kabupaten Kebumen', 'Kecamatan Kalipoh', -7.634, 109.736, 'BERKEMBANG', 'Pokdarwis Kalipoh Maju', '081200000309', 78.5),
('4126ba4b-2e76-57f6-b816-ce8269f886bd', 'karangbolong-kebumen', 'Desa Wisata Karangbolong', 'Kabupaten Kebumen', 'Kecamatan Karangbolong', -7.63, 109.62, 'BERKEMBANG', 'Pokdarwis Karangbolong Maju', '081200000310', 78.5),
('4a3be2b4-cbd6-5531-8262-8b12dd9b0c9a', 'karangduwur-kebumen', 'Desa Wisata Karangduwur', 'Kabupaten Kebumen', 'Kecamatan Karangduwur', -7.626, 109.664, 'BERKEMBANG', 'Pokdarwis Karangduwur Maju', '081200000311', 78.5),
('dc024bb1-8414-5a5f-86e2-93a6ce5e94c4', 'karanggayam-kebumen', 'Desa Wisata Karanggayam', 'Kabupaten Kebumen', 'Kecamatan Karanggayam', -7.622, 109.708, 'BERKEMBANG', 'Pokdarwis Karanggayam Maju', '081200000312', 78.5),
('e13bc768-2558-5dd6-ab11-6b5cb13bda92', 'karangrejo-kebumen', 'Desa Wisata Karangrejo', 'Kabupaten Kebumen', 'Kecamatan Karangrejo', -7.618, 109.592, 'BERKEMBANG', 'Pokdarwis Karangrejo Maju', '081200000313', 78.5),
('73f2b01b-03e3-5e43-9f8f-96aba6afa040', 'karangsambung-kebumen', 'Desa Wisata Karangsambung', 'Kabupaten Kebumen', 'Kecamatan Karangsambung', -7.614, 109.636, 'BERKEMBANG', 'Pokdarwis Karangsambung Maju', '081200000314', 78.5),
('d1a3b36f-bd28-562c-b871-c723c6215e5b', 'muktisari-kebumen', 'Desa Wisata Muktisari', 'Kabupaten Kebumen', 'Kecamatan Muktisari', -7.61, 109.68, 'BERKEMBANG', 'Pokdarwis Muktisari Maju', '081200000315', 78.5),
('2a8378dc-1c5e-579b-910c-4ffe47b9ca0f', 'pandansari-kebumen', 'Desa Wisata Pandansari', 'Kabupaten Kebumen', 'Kecamatan Pandansari', -7.606, 109.724, 'BERKEMBANG', 'Pokdarwis Pandansari Maju', '081200000316', 78.5),
('a24cb79e-f643-53b0-b19a-2f79c5f8fbe0', 'peniron-kebumen', 'Desa Wisata Peniron', 'Kabupaten Kebumen', 'Kecamatan Peniron', -7.602, 109.608, 'BERKEMBANG', 'Pokdarwis Peniron Maju', '081200000317', 78.5),
('958d7acf-deb1-5e44-a134-c32f0d68ab84', 'penusupan-kebumen', 'Desa Wisata Penusupan', 'Kabupaten Kebumen', 'Kecamatan Penusupan', -6.9802, 109.1607, 'BERKEMBANG', 'Pokdarwis Penusupan Maju', '081200000318', 78.5),
('860ab797-71a0-5535-8061-c0354ea9b2dd', 'rahayu-kebumen', 'Desa Wisata Rahayu', 'Kabupaten Kebumen', 'Kecamatan Rahayu', -7.594, 109.696, 'BERKEMBANG', 'Pokdarwis Rahayu Maju', '081200000319', 78.5),
('7dd84f3c-4cba-5eea-a501-5712428298d2', 'rowokele-kebumen', 'Desa Wisata Rowokele', 'Kabupaten Kebumen', 'Rowokele', -7.75, 109.58, 'MAJU', 'Pokdarwis Rowokele Maju', '081200000320', 85.0),
('989729bc-7195-5473-b272-cb9202059758', 'seboro-kebumen', 'Desa Wisata Seboro', 'Kabupaten Kebumen', 'Kecamatan Seboro', -7.746, 109.624, 'BERKEMBANG', 'Pokdarwis Seboro Maju', '081200000321', 78.5),
('c976d312-0009-54e0-9e54-d655242f2351', 'semali-kebumen', 'Desa Wisata Semali', 'Kabupaten Kebumen', 'Kecamatan Semali', -7.5678, 109.5327, 'BERKEMBANG', 'Pokdarwis Semali Maju', '081200000322', 78.5),
('4f3aafbf-a09f-5c8c-96fe-fe64bb68357f', 'sendangdalem-kebumen', 'Desa Wisata Sendangdalem', 'Kabupaten Kebumen', 'Kecamatan Sendangdalem', -7.738, 109.712, 'BERKEMBANG', 'Pokdarwis Sendangdalem Maju', '081200000323', 78.5),
('610c3498-6ab5-5839-ad73-8e546c9bce00', 'temanggal-kebumen', 'Desa Wisata Temanggal', 'Kabupaten Kebumen', 'Kecamatan Temanggal', -7.6851, 109.5724, 'BERKEMBANG', 'Pokdarwis Temanggal Maju', '081200000324', 78.5),
('c187918c-41eb-5a91-b04e-1c9f8085d450', 'wonoharjo-kebumen', 'Desa Wisata Wonoharjo', 'Kabupaten Kebumen', 'Kecamatan Wonoharjo', -7.73, 109.64, 'BERKEMBANG', 'Pokdarwis Wonoharjo Maju', '081200000325', 78.5),
('6dd6596c-e431-5bea-91c4-c842b5f34716', 'wonosari-kebumen', 'Desa Wisata Wonosari', 'Kabupaten Kebumen', 'Kecamatan Wonosari', -7.726, 109.684, 'BERKEMBANG', 'Pokdarwis Wonosari Maju', '081200000326', 78.5),
('dbc0acc7-e629-57fb-9407-cac0b5e1d0a7', 'bendosari-kendal', 'Desa Wisata Bendosari', 'Kabupaten Kendal', 'Kecamatan Bendosari', -7.0453, 109.9814, 'BERKEMBANG', 'Pokdarwis Bendosari Maju', '081200000327', 78.5),
('3b687e9f-2ec8-537b-8b74-ac799bedbbe5', 'blimbing-kendal', 'Desa Wisata Blimbing', 'Kabupaten Kendal', 'Kecamatan Blimbing', -7.1169, 110.2658, 'BERKEMBANG', 'Pokdarwis Blimbing Maju', '081200000328', 78.5),
('9d3ffaa6-cb08-5e61-b67b-efaece56b271', 'cacaban-kendal', 'Desa Wisata Cacaban', 'Kabupaten Kendal', 'Kecamatan Cacaban', -6.968, 110.2, 'BERKEMBANG', 'Pokdarwis Cacaban Maju', '081200000329', 78.5),
('d5fa7cce-95b6-529c-96fc-9370d8b33543', 'getas-kendal', 'Desa Wisata Getas', 'Kabupaten Kendal', 'Kecamatan Getas', -6.964, 110.244, 'BERKEMBANG', 'Pokdarwis Getas Maju', '081200000330', 78.5),
('111d5ddd-46a8-5442-bf68-34f3925ddd2a', 'getasblawong-kendal', 'Desa Wisata Getasblawong', 'Kabupaten Kendal', 'Pageruyung', -6.96, 110.128, 'MAJU', 'Pokdarwis Getasblawong Maju', '081200000331', 85.0),
('3980b697-5834-560c-af5d-82490ed0d12b', 'gondang-kendal', 'Desa Wisata Gondang', 'Kabupaten Kendal', 'Limbangan', -6.956, 110.172, 'MAJU', 'Pokdarwis Gondang Maju', '081200000332', 85.0),
('35da0d6f-3321-5399-828c-2b088b221535', 'jungsemi-kendal', 'Desa Wisata Jungsemi', 'Kabupaten Kendal', 'Kecamatan Jungsemi', -6.9078, 110.1231, 'BERKEMBANG', 'Pokdarwis Jungsemi Maju', '081200000333', 78.5),
('0a5ddc84-9fc7-5530-b556-b4edd66d0802', 'kartika-jaya-kendal', 'Desa Wisata Kartika Jaya', 'Kabupaten Kendal', 'Kecamatan Kartika Jaya', -6.8669, 110.2136, 'BERKEMBANG', 'Pokdarwis Kartika Jaya Maju', '081200000334', 78.5),
('ba9292d3-4d0e-5b12-8bc7-c3778a512411', 'kedungboto-kendal', 'Desa Wisata Kedungboto', 'Kabupaten Kendal', 'Kecamatan Kedungboto', -6.944, 110.144, 'BERKEMBANG', 'Pokdarwis Kedungboto Maju', '081200000335', 78.5),
('bf7b12e7-7c74-5b7f-85f7-a22f538ad42f', 'kutoharjo-kendal', 'Desa Wisata Kutoharjo', 'Kabupaten Kendal', 'Kecamatan Kutoharjo', -6.9617, 110.2567, 'BERKEMBANG', 'Pokdarwis Kutoharjo Maju', '081200000336', 78.5),
('f8281ea0-f3d7-5b2f-9418-83a83da0ae48', 'magelung-kendal', 'Desa Wisata Magelung', 'Kabupaten Kendal', 'Kecamatan Magelung', -6.936, 110.232, 'BERKEMBANG', 'Pokdarwis Magelung Maju', '081200000337', 78.5),
('0da7b962-d465-5cd4-969f-6fe49a756b2e', 'mororejo-kendal', 'Desa Wisata Mororejo', 'Kabupaten Kendal', 'Kecamatan Mororejo', -6.932, 110.276, 'BERKEMBANG', 'Pokdarwis Mororejo Maju', '081200000338', 78.5),
('ae24a2e7-2e37-5f00-8a2b-68eb2fb7da4c', 'ngesrepbalong-kendal', 'Desa Wisata Ngesrepbalong', 'Kabupaten Kendal', 'Kecamatan Ngesrepbalong', -6.928, 110.16, 'BERKEMBANG', 'Pokdarwis Ngesrepbalong Maju', '081200000339', 78.5),
('e5efb4f3-4305-5dfd-940b-5bc56f4728bc', 'pakis-kendal', 'Desa Wisata Pakis', 'Kabupaten Kendal', 'Kecamatan Pakis', -7.1833, 110.3083, 'BERKEMBANG', 'Pokdarwis Pakis Maju', '081200000340', 78.5),
('99d62029-da61-57f0-964b-35f145555969', 'purworejo-kendal', 'Desa Wisata Purworejo', 'Kabupaten Kendal', 'Kecamatan Purworejo', -6.92, 110.248, 'BERKEMBANG', 'Pokdarwis Purworejo Maju', '081200000341', 78.5),
('be3420b6-2c82-5425-8ba5-8f20f4117469', 'sidomakmur-kendal', 'Desa Wisata Sidomakmur', 'Kabupaten Kendal', 'Kecamatan Sidomakmur', -6.916, 110.132, 'BERKEMBANG', 'Pokdarwis Sidomakmur Maju', '081200000342', 78.5),
('4943127e-fb86-5b2b-9202-77472d10934b', 'singorojo-kendal', 'Desa Wisata Singorojo', 'Kabupaten Kendal', 'Kecamatan Singorojo', -6.912, 110.176, 'BERKEMBANG', 'Pokdarwis Singorojo Maju', '081200000343', 78.5),
('5dec37df-f630-5dcf-8e8d-b5d44390d3a4', 'tambahrejo-kendal', 'Desa Wisata Tambahrejo', 'Kabupaten Kendal', 'Kecamatan Tambahrejo', -7.0511, 110.0531, 'BERKEMBANG', 'Pokdarwis Tambahrejo Maju', '081200000344', 78.5),
('c0e7d101-5d65-54aa-8d50-66c65c44e34f', 'tampingan-kendal', 'Desa Wisata Tampingan', 'Kabupaten Kendal', 'Kecamatan Tampingan', -6.904, 110.264, 'BERKEMBANG', 'Pokdarwis Tampingan Maju', '081200000345', 78.5),
('d95f1334-701f-55d5-8745-1782a7535e39', 'trayu-kendal', 'Desa Wisata Trayu', 'Kabupaten Kendal', 'Singorojo', -6.9, 110.148, 'MAJU', 'Pokdarwis Trayu Maju', '081200000346', 85.0),
('956af12f-0114-5921-a68e-f88db45be8eb', 'wonosari-kendal', 'Desa Wisata Wonosari', 'Kabupaten Kendal', 'Kecamatan Wonosari', -7.0011, 110.1565, 'BERKEMBANG', 'Pokdarwis Wonosari Maju', '081200000347', 78.5),
('8554cc82-0603-5b58-bd6a-bd666883c411', 'balerante-klaten', 'Desa Wisata Balerante', 'Kabupaten Klaten', 'Kecamatan Balerante', -7.6175, 110.4737, 'BERKEMBANG', 'Pokdarwis Balerante Maju', '081200000348', 78.5),
('7af36393-2028-5fab-9e5f-1e2418321a29', 'bugisan-klaten', 'Desa Wisata Bugisan', 'Kabupaten Klaten', 'Prambanan', -7.669, 110.679, 'MAJU', 'Pokdarwis Bugisan Maju', '081200000349', 85.0),
('2132e166-6558-5094-af51-a34caedd2060', 'glagah-klaten', 'Desa Wisata Glagah', 'Kabupaten Klaten', 'Kecamatan Glagah', -7.665, 110.563, 'BERKEMBANG', 'Pokdarwis Glagah Maju', '081200000350', 78.5),
('626ff67f-85b4-5a69-a9f4-ac4e9e5dcee1', 'gununggajah-klaten', 'Desa Wisata Gununggajah', 'Kabupaten Klaten', 'Kecamatan Gununggajah', -7.7629, 110.6655, 'BERKEMBANG', 'Pokdarwis Gununggajah Maju', '081200000351', 78.5),
('30ae0e01-b719-5146-b5b7-4c19baadc3ba', 'janti-klaten', 'Desa Wisata Janti', 'Kabupaten Klaten', 'Kecamatan Janti', -7.657, 110.651, 'BERKEMBANG', 'Pokdarwis Janti Maju', '081200000352', 78.5),
('b8232e9b-687c-5142-93ed-e55522c13e1b', 'jarum-klaten', 'Desa Wisata Jarum', 'Kabupaten Klaten', 'Kecamatan Jarum', -7.653, 110.535, 'BERKEMBANG', 'Pokdarwis Jarum Maju', '081200000353', 78.5),
('0928a798-877d-52b7-a2b4-bc147984ea32', 'jimbung-klaten', 'Desa Wisata Jimbung', 'Kabupaten Klaten', 'Kecamatan Jimbung', -7.649, 110.579, 'BERKEMBANG', 'Pokdarwis Jimbung Maju', '081200000354', 78.5),
('9a0977f8-25d2-5665-9b49-2ccd8d605bc4', 'kahuman-klaten', 'Desa Wisata Kahuman', 'Kabupaten Klaten', 'Kecamatan Kahuman', -7.645, 110.623, 'BERKEMBANG', 'Pokdarwis Kahuman Maju', '081200000355', 78.5),
('2150ff77-2c89-531c-ac68-6d54a63149bd', 'kalikotes-klaten', 'Desa Wisata Kalikotes', 'Kabupaten Klaten', 'Kecamatan Kalikotes', -7.7167, 110.6236, 'BERKEMBANG', 'Pokdarwis Kalikotes Maju', '081200000356', 78.5),
('23c5d0a7-6275-5d52-9a6e-2e517fab5542', 'karangasem-klaten', 'Desa Wisata Karangasem', 'Kabupaten Klaten', 'Kecamatan Karangasem', -7.8041, 110.6955, 'BERKEMBANG', 'Pokdarwis Karangasem Maju', '081200000357', 78.5),
('f42b745d-3ef3-50ae-9f5b-3793477d54a3', 'karangduren-klaten', 'Desa Wisata Karangduren', 'Kabupaten Klaten', 'Kecamatan Karangduren', -7.633, 110.595, 'BERKEMBANG', 'Pokdarwis Karangduren Maju', '081200000358', 78.5),
('78609886-0d52-539f-91d9-fa292fcd113a', 'karangnongko-klaten', 'Desa Wisata Karangnongko', 'Kabupaten Klaten', 'Kecamatan Karangnongko', -7.629, 110.639, 'BERKEMBANG', 'Pokdarwis Karangnongko Maju', '081200000359', 78.5),
('71a532cb-92ff-5098-b579-5fed81bfe778', 'kebonalas-klaten', 'Desa Wisata Kebonalas', 'Kabupaten Klaten', 'Kecamatan Kebonalas', -7.6881, 110.4903, 'BERKEMBANG', 'Pokdarwis Kebonalas Maju', '081200000360', 78.5),
('2bbfb152-78ae-53e7-b533-38c335407772', 'kebondalem-kidul-klaten', 'Desa Wisata Kebondalem Kidul', 'Kabupaten Klaten', 'Kecamatan Kebondalem Kidul', -7.781, 110.567, 'BERKEMBANG', 'Pokdarwis Kebondalem Kidul Maju', '081200000361', 78.5),
('58a55283-6a02-546d-83c2-b2ff8d8c5e49', 'krakitan-klaten', 'Desa Wisata Krakitan', 'Kabupaten Klaten', 'Kecamatan Krakitan', -7.777, 110.611, 'BERKEMBANG', 'Pokdarwis Krakitan Maju', '081200000362', 78.5),
('0b76a4dd-00c9-5934-9436-adcea4dbf520', 'kranggan-klaten', 'Desa Wisata Kranggan', 'Kabupaten Klaten', 'Kecamatan Kranggan', -7.773, 110.655, 'BERKEMBANG', 'Pokdarwis Kranggan Maju', '081200000363', 78.5),
('47fa9ddc-3ec6-5549-8c08-3596d4cbf68f', 'krikilan-klaten', 'Desa Wisata Krikilan', 'Kabupaten Klaten', 'Kecamatan Krikilan', -7.4556, 110.8342, 'BERKEMBANG', 'Pokdarwis Krikilan Maju', '081200000364', 78.5),
('eef4b891-d69e-5c4f-a8cf-4f2585e8dccf', 'kupang-klaten', 'Desa Wisata Kupang', 'Kabupaten Klaten', 'Karangdowo', -7.765, 110.583, 'MAJU', 'Pokdarwis Kupang Maju', '081200000365', 85.0),
('7f3825db-a687-540c-b0c4-a18cd3f39d74', 'malangjiwan-klaten', 'Desa Wisata Malangjiwan', 'Kabupaten Klaten', 'Kecamatan Malangjiwan', -7.761, 110.627, 'BERKEMBANG', 'Pokdarwis Malangjiwan Maju', '081200000366', 78.5),
('ebea88f8-a3e7-51cb-b0d0-3d258735df1c', 'manjungan-klaten', 'Desa Wisata Manjungan', 'Kabupaten Klaten', 'Ngawen', -7.757, 110.671, 'MAJU', 'Pokdarwis Manjungan Maju', '081200000367', 85.0),
('b43302d7-946e-5487-93f6-3e5e9110db93', 'melikan-klaten', 'Desa Wisata Melikan', 'Kabupaten Klaten', 'Kecamatan Melikan', -7.7781, 110.6256, 'BERKEMBANG', 'Pokdarwis Melikan Maju', '081200000368', 78.5),
('1415731d-f2f6-56d1-bc7b-51d64d0c61f6', 'mranggen-klaten', 'Desa Wisata Mranggen', 'Kabupaten Klaten', 'Jatinom', -7.749, 110.599, 'MAJU', 'Pokdarwis Mranggen Maju', '081200000369', 85.0),
('9e3882e4-0469-577e-8197-a175bb03202d', 'ngerangan-klaten', 'Desa Wisata Ngerangan', 'Kabupaten Klaten', 'Kecamatan Ngerangan', -7.745, 110.643, 'BERKEMBANG', 'Pokdarwis Ngerangan Maju', '081200000370', 78.5),
('f3be8ede-e7bc-57a1-975e-90192afc07f4', 'ngering-klaten', 'Desa Wisata Ngering', 'Kabupaten Klaten', 'Kecamatan Ngering', -7.741, 110.527, 'BERKEMBANG', 'Pokdarwis Ngering Maju', '081200000371', 78.5),
('b8ab2da2-ff28-5fa2-adce-eb28a493e998', 'nglinggi-klaten', 'Desa Wisata Nglinggi', 'Kabupaten Klaten', 'Kecamatan Nglinggi', -7.737, 110.571, 'BERKEMBANG', 'Pokdarwis Nglinggi Maju', '081200000372', 78.5),
('ea42ed1d-49e4-574e-9627-af34bc4ed350', 'ngrundul-klaten', 'Desa Wisata Ngrundul', 'Kabupaten Klaten', 'Kecamatan Ngrundul', -7.733, 110.615, 'BERKEMBANG', 'Pokdarwis Ngrundul Maju', '081200000373', 78.5),
('6ab8d24d-34eb-5cc4-9f3e-41a272e5bb39', 'pasung-klaten', 'Desa Wisata Pasung', 'Kabupaten Klaten', 'Wedi', -7.729, 110.659, 'MAJU', 'Pokdarwis Pasung Maju', '081200000374', 85.0),
('e8755d02-84d5-5e16-ba93-a1e6ac5d1412', 'pokak-klaten', 'Desa Wisata Pokak', 'Kabupaten Klaten', 'Kecamatan Pokak', -7.725, 110.543, 'BERKEMBANG', 'Pokdarwis Pokak Maju', '081200000375', 78.5),
('d2f136db-5c76-51df-bfa7-09f7de9b0089', 'ponggok-klaten', 'Desa Wisata Ponggok', 'Kabupaten Klaten', 'Kecamatan Ponggok', -7.721, 110.587, 'BERKEMBANG', 'Pokdarwis Ponggok Maju', '081200000376', 78.5),
('58f9d16e-6015-5b26-a776-8f4ac0059844', 'sidowarno-klaten', 'Desa Wisata Sidowarno', 'Kabupaten Klaten', 'Kecamatan Sidowarno', -7.6528, 110.7886, 'BERKEMBANG', 'Pokdarwis Sidowarno Maju', '081200000377', 78.5),
('1b014f73-3921-5e24-8b0a-a55872c1f61d', 'sidowayah-klaten', 'Desa Wisata Sidowayah', 'Kabupaten Klaten', 'Kecamatan Sidowayah', -7.713, 110.675, 'BERKEMBANG', 'Pokdarwis Sidowayah Maju', '081200000378', 78.5),
('9585ffa6-46d1-57c3-8028-00373e78a53c', 'soropaten-klaten', 'Desa Wisata Soropaten', 'Kabupaten Klaten', 'Kecamatan Soropaten', -7.709, 110.559, 'BERKEMBANG', 'Pokdarwis Soropaten Maju', '081200000379', 78.5),
('0d8337f8-9740-5d66-bef0-c5b159895ef1', 'tanjung-klaten', 'Desa Wisata Tanjung', 'Kabupaten Klaten', 'Kecamatan Tanjung', -7.6644, 110.7505, 'BERKEMBANG', 'Pokdarwis Tanjung Maju', '081200000380', 78.5),
('72ccc4cb-2c40-52b9-9935-536a54546752', 'tegalmulyo-klaten', 'Desa Wisata Tegalmulyo', 'Kabupaten Klaten', 'Kecamatan Tegalmulyo', -7.701, 110.647, 'BERKEMBANG', 'Pokdarwis Tegalmulyo Maju', '081200000381', 78.5),
('67229123-08a6-54d1-96f6-15f05a29dc49', 'tlogowatu-klaten', 'Desa Wisata Tlogowatu', 'Kabupaten Klaten', 'Kecamatan Tlogowatu', -7.697, 110.531, 'BERKEMBANG', 'Pokdarwis Tlogowatu Maju', '081200000382', 78.5),
('b7364610-cd72-5b0b-a618-fb5095251cfc', 'dukuh-waringin-kudus', 'Desa Wisata Dukuh Waringin', 'Kabupaten Kudus', 'Kecamatan Dukuh Waringin', -6.793, 110.813, 'BERKEMBANG', 'Pokdarwis Dukuh Waringin Maju', '081200000383', 78.5),
('a40bd113-e95c-5a99-bc8c-fb123a7573a0', 'gondosari-kudus', 'Desa Wisata Gondosari', 'Kabupaten Kudus', 'Kecamatan Gondosari', -6.7267, 110.8461, 'BERKEMBANG', 'Pokdarwis Gondosari Maju', '081200000384', 78.5),
('83e9bdad-039c-5189-a585-ffebb6777646', 'gribig-kudus', 'Desa Wisata Gribig', 'Kabupaten Kudus', 'Kecamatan Gribig', -6.785, 110.901, 'BERKEMBANG', 'Pokdarwis Gribig Maju', '081200000385', 78.5),
('8122da90-aa30-5033-8507-e69f15543469', 'janggalan-kudus', 'Desa Wisata Janggalan', 'Kabupaten Kudus', 'Kecamatan Janggalan', -6.8069, 110.8306, 'BERKEMBANG', 'Pokdarwis Janggalan Maju', '081200000386', 78.5),
('c2a4fb16-1081-5eb9-a78f-9985757db118', 'japan-kudus', 'Desa Wisata Japan', 'Kabupaten Kudus', 'Kecamatan Japan', -6.777, 110.829, 'BERKEMBANG', 'Pokdarwis Japan Maju', '081200000387', 78.5),
('b60a4819-a872-5846-b50d-378c100b183a', 'jepang-kudus', 'Desa Wisata Jepang', 'Kabupaten Kudus', 'Kecamatan Jepang', -6.773, 110.873, 'BERKEMBANG', 'Pokdarwis Jepang Maju', '081200000388', 78.5),
('8390e2e7-5a5e-51b2-a003-85c68a3e0f27', 'jurang-kudus', 'Desa Wisata Jurang', 'Kabupaten Kudus', 'Gebog', -6.769, 110.917, 'MAJU', 'Pokdarwis Jurang Maju', '081200000389', 85.0),
('ccce77b0-140f-51ca-8701-57c6aa9bff1e', 'kajar-kudus', 'Desa Wisata Kajar', 'Kabupaten Kudus', 'Kecamatan Kajar', -6.765, 110.801, 'BERKEMBANG', 'Pokdarwis Kajar Maju', '081200000390', 78.5),
('2f3a712e-a9f7-50f0-894a-520ce06a179e', 'kaliputu-kudus', 'Desa Wisata Kaliputu', 'Kabupaten Kudus', 'Kecamatan Kaliputu', -6.761, 110.845, 'BERKEMBANG', 'Pokdarwis Kaliputu Maju', '081200000391', 78.5),
('1b90d8f5-436a-5d09-afb1-021725fab52d', 'kaliwungu-kudus', 'Desa Wisata Kaliwungu', 'Kabupaten Kudus', 'Kecamatan Kaliwungu', -6.757, 110.889, 'BERKEMBANG', 'Pokdarwis Kaliwungu Maju', '081200000392', 78.5),
('84e7930c-aee9-5190-882d-4a0fd9489666', 'kandangmas-kudus', 'Desa Wisata Kandangmas', 'Kabupaten Kudus', 'Kecamatan Kandangmas', -6.753, 110.773, 'BERKEMBANG', 'Pokdarwis Kandangmas Maju', '081200000393', 78.5),
('3988784a-6971-5180-ad77-9d31ab2368b6', 'karangampel-kudus', 'Desa Wisata Karangampel', 'Kabupaten Kudus', 'Kecamatan Karangampel', -6.749, 110.817, 'BERKEMBANG', 'Pokdarwis Karangampel Maju', '081200000394', 78.5),
('58a11297-b80c-51bc-bc43-909b3b7a0a7e', 'karangrowo-kudus', 'Desa Wisata Karangrowo', 'Kabupaten Kudus', 'Kecamatan Karangrowo', -6.8853, 110.8728, 'BERKEMBANG', 'Pokdarwis Karangrowo Maju', '081200000395', 78.5),
('8bb4a293-4a0a-51f6-8dab-6666b9e89a71', 'kauman-kudus', 'Desa Wisata Kauman', 'Kabupaten Kudus', 'Kecamatan Kauman', -6.8042, 110.8328, 'BERKEMBANG', 'Pokdarwis Kauman Maju', '081200000396', 78.5),
('390ffc99-8ee1-5773-ae81-a4830a60b72d', 'kedungdowo-kudus', 'Desa Wisata Kedungdowo', 'Kabupaten Kudus', 'Kecamatan Kedungdowo', -6.737, 110.789, 'BERKEMBANG', 'Pokdarwis Kedungdowo Maju', '081200000397', 78.5),
('86a00cda-7abd-5b5f-9998-acfe40a48c55', 'kesambi-kudus', 'Desa Wisata Kesambi', 'Kabupaten Kudus', 'Kecamatan Kesambi', -6.733, 110.833, 'BERKEMBANG', 'Pokdarwis Kesambi Maju', '081200000398', 78.5),
('cd9947dc-ec8e-56f1-b803-9b41f3f75474', 'klaling-kudus', 'Desa Wisata Klaling', 'Kabupaten Kudus', 'Kecamatan Klaling', -6.7817, 110.9244, 'BERKEMBANG', 'Pokdarwis Klaling Maju', '081200000399', 78.5),
('556f8370-b891-5b39-9209-73d680fea862', 'loram-kulon-kudus', 'Desa Wisata Loram Kulon', 'Kabupaten Kudus', 'Kecamatan Loram Kulon', -6.885, 110.761, 'BERKEMBANG', 'Pokdarwis Loram Kulon Maju', '081200000400', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('67bca7c1-8d72-598e-a520-c881b1e2fed8', 'margorejo-kudus', 'Desa Wisata Margorejo', 'Kabupaten Kudus', 'Kecamatan Margorejo', -6.881, 110.805, 'BERKEMBANG', 'Pokdarwis Margorejo Maju', '081200000401', 78.5),
('62af3e4a-3967-533b-a28c-9131d52beda4', 'menawan-kudus', 'Desa Wisata Menawan', 'Kabupaten Kudus', 'Gebog', -6.877, 110.849, 'MAJU', 'Pokdarwis Menawan Maju', '081200000402', 85.0),
('3c1a4c44-0d13-57c9-ac02-3aa2cebef830', 'ngemplak-kudus', 'Desa Wisata Ngemplak', 'Kabupaten Kudus', 'Kecamatan Ngemplak', -6.873, 110.893, 'BERKEMBANG', 'Pokdarwis Ngemplak Maju', '081200000403', 78.5),
('ac8a7b8e-6aff-5643-9749-ac67e15ade3d', 'padurenan-kudus', 'Desa Wisata Padurenan', 'Kabupaten Kudus', 'Kecamatan Padurenan', -6.869, 110.777, 'BERKEMBANG', 'Pokdarwis Padurenan Maju', '081200000404', 78.5),
('645975f2-160a-55f7-89c1-de358782c257', 'pedawang-kudus', 'Desa Wisata Pedawang', 'Kabupaten Kudus', 'Bae', -6.865, 110.821, 'MAJU', 'Pokdarwis Pedawang Maju', '081200000405', 85.0),
('0fa5c29d-7606-5068-9c3b-43d56eaec3a2', 'rahtawu-kudus', 'Desa Wisata Rahtawu', 'Kabupaten Kudus', 'Kecamatan Rahtawu', -6.861, 110.865, 'BERKEMBANG', 'Pokdarwis Rahtawu Maju', '081200000406', 78.5),
('fe5a551e-c389-545d-9220-e55b6e40f65e', 'tanjungrejo-kudus', 'Desa Wisata Tanjungrejo', 'Kabupaten Kudus', 'Kecamatan Tanjungrejo', -6.857, 110.909, 'BERKEMBANG', 'Pokdarwis Tanjungrejo Maju', '081200000407', 78.5),
('01fc5f71-f88a-5609-bb66-47aef3bb0b09', 'temulus-kudus', 'Desa Wisata Temulus', 'Kabupaten Kudus', 'Kecamatan Temulus', -6.8592, 110.8989, 'BERKEMBANG', 'Pokdarwis Temulus Maju', '081200000408', 78.5),
('6ed60443-3bbd-5177-90aa-2b17ceb0533a', 'terban-kudus', 'Desa Wisata Terban', 'Kabupaten Kudus', 'Kecamatan Terban', -6.849, 110.837, 'BERKEMBANG', 'Pokdarwis Terban Maju', '081200000409', 78.5),
('854c30be-4e06-52fd-ad9e-8cb1f5f9d021', 'ternadi-kudus', 'Desa Wisata Ternadi', 'Kabupaten Kudus', 'Kecamatan Ternadi', -6.845, 110.881, 'BERKEMBANG', 'Pokdarwis Ternadi Maju', '081200000410', 78.5),
('961068fc-4245-55ba-a42a-e510125e5e51', 'wates-kudus', 'Desa Wisata Wates', 'Kabupaten Kudus', 'Kecamatan Wates', -6.841, 110.765, 'BERKEMBANG', 'Pokdarwis Wates Maju', '081200000411', 78.5),
('379d3120-0707-58ad-9880-e64c8e3818c5', 'wonosoco-kudus', 'Desa Wisata Wonosoco', 'Kabupaten Kudus', 'Kecamatan Wonosoco', -6.837, 110.809, 'BERKEMBANG', 'Pokdarwis Wonosoco Maju', '081200000412', 78.5),
('8d23ccba-6ea8-59d4-a897-ab9848834479', 'banyubiru-magelang', 'Desa Wisata Banyubiru', 'Kabupaten Magelang', 'Dukun', -7.578, 110.228, 'MAJU', 'Pokdarwis Banyubiru Maju', '081200000413', 85.0),
('a2fa7b5e-e037-579a-9e2f-940e44911d82', 'banyuroto-magelang', 'Desa Wisata Banyuroto', 'Kabupaten Magelang', 'Kecamatan Banyuroto', -7.574, 110.272, 'BERKEMBANG', 'Pokdarwis Banyuroto Maju', '081200000414', 78.5),
('e4619990-f1f3-54ae-862f-d95fd2d47017', 'bawang-magelang', 'Desa Wisata Bawang', 'Kabupaten Magelang', 'Kecamatan Bawang', -7.57, 110.156, 'BERKEMBANG', 'Pokdarwis Bawang Maju', '081200000415', 78.5),
('25bcbed0-015d-59c1-9779-cf22dcec8c5c', 'bigaran-magelang', 'Desa Wisata Bigaran', 'Kabupaten Magelang', 'Kecamatan Bigaran', -7.566, 110.2, 'BERKEMBANG', 'Pokdarwis Bigaran Maju', '081200000416', 78.5),
('33c24956-db99-54f6-966f-0c73dca9616a', 'borobudur-magelang', 'Desa Wisata Borobudur', 'Kabupaten Magelang', 'Kecamatan Borobudur', -7.562, 110.244, 'BERKEMBANG', 'Pokdarwis Borobudur Maju', '081200000417', 78.5),
('a0000000-0000-0000-0000-000000000002', 'candirejo-magelang', 'Desa Wisata Candirejo', 'Kabupaten Magelang', 'Kecamatan Candirejo', -7.339, 109.9331, 'BERKEMBANG', 'Pokdarwis Candirejo Maju', '081200000418', 78.5),
('097155b5-7686-54ca-9272-118b4a75f18a', 'girikulon-magelang', 'Desa Wisata Girikulon', 'Kabupaten Magelang', 'Kecamatan Girikulon', -7.554, 110.172, 'BERKEMBANG', 'Pokdarwis Girikulon Maju', '081200000419', 78.5),
('531e6c72-a379-5174-8d0b-14666d89814c', 'giritengah-magelang', 'Desa Wisata Giritengah', 'Kabupaten Magelang', 'Kecamatan Giritengah', -7.55, 110.216, 'BERKEMBANG', 'Pokdarwis Giritengah Maju', '081200000420', 78.5),
('679cf253-7501-54e0-955a-28f2caad659a', 'gunungpring-magelang', 'Desa Wisata Gunungpring', 'Kabupaten Magelang', 'Kecamatan Gunungpring', -7.5913, 110.2781, 'BERKEMBANG', 'Pokdarwis Gunungpring Maju', '081200000421', 78.5),
('dda5f855-5aca-596a-b18e-946407cb77a0', 'jamuskauman-magelang', 'Desa Wisata Jamuskauman', 'Kabupaten Magelang', 'Ngluwar', -7.542, 110.144, 'MAJU', 'Pokdarwis Jamuskauman Maju', '081200000422', 85.0),
('403c21a1-8629-513e-9952-6f6970ab8212', 'kalijoso-magelang', 'Desa Wisata Kalijoso', 'Kabupaten Magelang', 'Kecamatan Kalijoso', -7.538, 110.188, 'BERKEMBANG', 'Pokdarwis Kalijoso Maju', '081200000423', 78.5),
('088c9793-5b79-5057-bae2-46680c025f93', 'karanganyar-magelang', 'Desa Wisata Karanganyar', 'Kabupaten Magelang', 'Kecamatan Karanganyar', -7.534, 110.232, 'BERKEMBANG', 'Pokdarwis Karanganyar Maju', '081200000424', 78.5),
('fb31d4cf-36c1-5897-b7c3-673ce2f38a76', 'karangrejo-magelang', 'Desa Wisata Karangrejo', 'Kabupaten Magelang', 'Kecamatan Karangrejo', -7.53, 110.276, 'BERKEMBANG', 'Pokdarwis Karangrejo Maju', '081200000425', 78.5),
('49152fa5-24c6-583f-aa46-b547b92b9826', 'kebonlegi-magelang', 'Desa Wisata Kebonlegi', 'Kabupaten Magelang', 'Kecamatan Kebonlegi', -7.526, 110.16, 'BERKEMBANG', 'Pokdarwis Kebonlegi Maju', '081200000426', 78.5),
('e7136196-6aa9-54e7-a52f-9d0b1f79f15c', 'kebonsari-magelang', 'Desa Wisata Kebonsari', 'Kabupaten Magelang', 'Kecamatan Kebonsari', -7.522, 110.204, 'BERKEMBANG', 'Pokdarwis Kebonsari Maju', '081200000427', 78.5),
('c0309db5-b884-53a0-b7c9-c540e02ba6a4', 'keditan-magelang', 'Desa Wisata Keditan', 'Kabupaten Magelang', 'Kecamatan Keditan', -7.518, 110.248, 'BERKEMBANG', 'Pokdarwis Keditan Maju', '081200000428', 78.5),
('4caf51e1-e2ca-5f25-942b-cd2bdea40707', 'kembangkuning-magelang', 'Desa Wisata Kembangkuning', 'Kabupaten Magelang', 'Kecamatan Kembangkuning', -7.514, 110.292, 'BERKEMBANG', 'Pokdarwis Kembangkuning Maju', '081200000429', 78.5),
('bd9b8dcc-7215-5b79-901c-212321a47f17', 'kembanglimus-magelang', 'Desa Wisata Kembanglimus', 'Kabupaten Magelang', 'Kecamatan Kembanglimus', -7.51, 110.176, 'BERKEMBANG', 'Pokdarwis Kembanglimus Maju', '081200000430', 78.5),
('2d7bd546-e816-5406-b68c-b1c30b2f67bc', 'kenalan-magelang', 'Desa Wisata Kenalan', 'Kabupaten Magelang', 'Kecamatan Kenalan', -7.506, 110.22, 'BERKEMBANG', 'Pokdarwis Kenalan Maju', '081200000431', 78.5),
('c2ad1be6-5104-595e-a70d-74ba5d6712b4', 'majaksingi-magelang', 'Desa Wisata Majaksingi', 'Kabupaten Magelang', 'Borobudur', -7.502, 110.264, 'MAJU', 'Pokdarwis Majaksingi Maju', '081200000432', 85.0),
('58efd524-a4f8-5aa6-8a90-600ff22e2984', 'mangli-magelang', 'Desa Wisata Mangli', 'Kabupaten Magelang', 'Kecamatan Mangli', -7.498, 110.148, 'BERKEMBANG', 'Pokdarwis Mangli Maju', '081200000433', 78.5),
('8d8bcf94-9401-5d77-82d3-c3331ed80022', 'mendut-magelang', 'Desa Wisata Mendut', 'Kabupaten Magelang', 'Kecamatan Mendut', -7.494, 110.192, 'BERKEMBANG', 'Pokdarwis Mendut Maju', '081200000434', 78.5),
('3b24675b-1a84-5679-92aa-27eec7398cde', 'ngadiharjo-magelang', 'Desa Wisata Ngadiharjo', 'Kabupaten Magelang', 'Kecamatan Ngadiharjo', -7.6131, 110.1737, 'BERKEMBANG', 'Pokdarwis Ngadiharjo Maju', '081200000435', 78.5),
('5eafe42a-3fa4-5973-aee3-88faf2feef22', 'ngargogondo-magelang', 'Desa Wisata Ngargogondo', 'Kabupaten Magelang', 'Borobudur', -7.486, 110.28, 'MAJU', 'Pokdarwis Ngargogondo Maju', '081200000436', 85.0),
('3452051a-22a6-5dac-9d65-feb0a65d58ba', 'ngargoretno-magelang', 'Desa Wisata Ngargoretno', 'Kabupaten Magelang', 'Kecamatan Ngargoretno', -7.482, 110.164, 'BERKEMBANG', 'Pokdarwis Ngargoretno Maju', '081200000437', 78.5),
('e536713f-01ee-5fee-9cf5-2ffad201bf68', 'ngargosoko-magelang', 'Desa Wisata Ngargosoko', 'Kabupaten Magelang', 'Kecamatan Ngargosoko', -7.5715, 110.3696, 'BERKEMBANG', 'Pokdarwis Ngargosoko Maju', '081200000438', 78.5),
('73eeab5d-6035-502a-a7a9-3311171e8f95', 'ngawen-magelang', 'Desa Wisata Ngawen', 'Kabupaten Magelang', 'Muntilan', -7.474, 110.252, 'MANDIRI', 'Pokdarwis Ngawen Maju', '081200000439', 92.5),
('2adaae61-8186-55fc-a135-795530c37723', 'pancuranmas-magelang', 'Desa Wisata Pancuranmas', 'Kabupaten Magelang', 'Kecamatan Pancuranmas', -7.63, 110.136, 'BERKEMBANG', 'Pokdarwis Pancuranmas Maju', '081200000440', 78.5),
('f5d60914-7c1f-5649-89e9-5d9411952045', 'paremono-magelang', 'Desa Wisata Paremono', 'Kabupaten Magelang', 'Kecamatan Paremono', -7.626, 110.18, 'BERKEMBANG', 'Pokdarwis Paremono Maju', '081200000441', 78.5),
('e19788dd-8cbc-544b-9195-67add7c04256', 'pogalan-magelang', 'Desa Wisata Pogalan', 'Kabupaten Magelang', 'Kecamatan Pogalan', -7.622, 110.224, 'BERKEMBANG', 'Pokdarwis Pogalan Maju', '081200000442', 78.5),
('fc437359-5fde-5ad7-952c-e7b78b21792e', 'polengan-magelang', 'Desa Wisata Polengan', 'Kabupaten Magelang', 'Kecamatan Polengan', -7.618, 110.268, 'BERKEMBANG', 'Pokdarwis Polengan Maju', '081200000443', 78.5),
('a5bc7abf-d5e6-562d-9f75-9154883204fa', 'prajeksari-magelang', 'Desa Wisata Prajeksari', 'Kabupaten Magelang', 'Kecamatan Prajeksari', -7.614, 110.152, 'BERKEMBANG', 'Pokdarwis Prajeksari Maju', '081200000444', 78.5),
('ecc088e7-a0fb-5713-83df-f2848c82ad49', 'sambak-magelang', 'Desa Wisata Sambak', 'Kabupaten Magelang', 'Kecamatan Sambak', -7.61, 110.196, 'BERKEMBANG', 'Pokdarwis Sambak Maju', '081200000445', 78.5),
('5c955e27-0e61-562b-8475-5948ac685333', 'sambak-magelang-2', 'Desa Wisata Sambak', 'Kabupaten Magelang', 'Kecamatan Sambak', -7.606, 110.24, 'BERKEMBANG', 'Pokdarwis Sambak Maju', '081200000446', 78.5),
('6b076ce1-ac21-5777-81f6-252b2938de0e', 'sambeng-magelang', 'Desa Wisata Sambeng', 'Kabupaten Magelang', 'Kecamatan Sambeng', -7.602, 110.284, 'BERKEMBANG', 'Pokdarwis Sambeng Maju', '081200000447', 78.5),
('6595d67b-b7cd-55df-915a-8fc3446ab3d7', 'sukosari-magelang', 'Desa Wisata Sukosari', 'Kabupaten Magelang', 'Kecamatan Sukosari', -7.598, 110.168, 'BERKEMBANG', 'Pokdarwis Sukosari Maju', '081200000448', 78.5),
('6375815e-2571-5773-bec3-af31e3465916', 'sumber-magelang', 'Desa Wisata Sumber', 'Kabupaten Magelang', 'Kecamatan Sumber', -7.594, 110.212, 'BERKEMBANG', 'Pokdarwis Sumber Maju', '081200000449', 78.5),
('38c936cd-9ef1-5229-ba6b-c3246d08e135', 'sutopati-magelang', 'Desa Wisata Sutopati', 'Kabupaten Magelang', 'Kecamatan Sutopati', -7.59, 110.256, 'BERKEMBANG', 'Pokdarwis Sutopati Maju', '081200000450', 78.5),
('5185e2bd-64b1-53c6-a013-ccc3718a0271', 'tanjungsari-magelang', 'Desa Wisata Tanjungsari', 'Kabupaten Magelang', 'Kecamatan Tanjungsari', -7.586, 110.14, 'BERKEMBANG', 'Pokdarwis Tanjungsari Maju', '081200000451', 78.5),
('901f4f33-f497-53f1-8fba-13d5a97541c2', 'tegalarum-magelang', 'Desa Wisata Tegalarum', 'Kabupaten Magelang', 'Kecamatan Tegalarum', -7.582, 110.184, 'BERKEMBANG', 'Pokdarwis Tegalarum Maju', '081200000452', 78.5),
('19c02d54-44a3-5ce3-a5e8-3c453703b620', 'temanggal-magelang', 'Desa Wisata Temanggal', 'Kabupaten Magelang', 'Tempuran', -7.6851, 109.5724, 'MAJU', 'Pokdarwis Temanggal Maju', '081200000453', 85.0),
('fdb8a60b-3a61-5ee5-8e97-47693a923b02', 'temanggung-magelang', 'Desa Wisata Temanggung', 'Kabupaten Magelang', 'Kecamatan Temanggung', -7.574, 110.272, 'BERKEMBANG', 'Pokdarwis Temanggung Maju', '081200000454', 78.5),
('a68423c3-3907-53d2-9f6d-ef670916e42a', 'wanurejo-magelang', 'Desa Wisata Wanurejo', 'Kabupaten Magelang', 'Kecamatan Wanurejo', -7.57, 110.156, 'BERKEMBANG', 'Pokdarwis Wanurejo Maju', '081200000455', 78.5),
('3841bb12-03be-5fa5-9d07-49707326503f', 'wonolelo-magelang', 'Desa Wisata Wonolelo', 'Kabupaten Magelang', 'Kecamatan Wonolelo', -7.566, 110.2, 'BERKEMBANG', 'Pokdarwis Wonolelo Maju', '081200000456', 78.5),
('899539b0-30a0-5819-b2ae-582c1595921a', 'wringinputih-magelang', 'Desa Wisata Wringinputih', 'Kabupaten Magelang', 'Kecamatan Wringinputih', -7.562, 110.244, 'BERKEMBANG', 'Pokdarwis Wringinputih Maju', '081200000457', 78.5),
('782758b7-4773-5c9b-83ac-3549abea26a1', 'bageng-pati', 'Desa Wisata Bageng', 'Kabupaten Pati', 'Kecamatan Bageng', -6.762, 111.11, 'BERKEMBANG', 'Pokdarwis Bageng Maju', '081200000458', 78.5),
('48500625-c238-5b0d-8391-9889a0b6dcb9', 'bakaran-wetan-pati', 'Desa Wisata Bakaran Wetan', 'Kabupaten Pati', 'Juwana', -6.758, 110.994, 'MANDIRI', 'Pokdarwis Bakaran Wetan Maju', '081200000459', 92.5),
('70f741d6-92f5-501b-b42f-19447fcc1689', 'dewi-kinasih-pati', 'Desa Wisata Dewi Kinasih', 'Kabupaten Pati', 'Kecamatan Dewi Kinasih', -6.754, 111.038, 'BERKEMBANG', 'Pokdarwis Dewi Kinasih Maju', '081200000460', 78.5),
('4e6c1acb-a56f-5dcb-9050-8f0e52a7ea37', 'gading-bumi-asri-pati', 'Desa Wisata Gading Bumi Asri', 'Kabupaten Pati', 'Kecamatan Gading Bumi Asri', -6.75, 111.082, 'BERKEMBANG', 'Pokdarwis Gading Bumi Asri Maju', '081200000461', 78.5),
('5fec5760-cb07-5699-898a-2249a7a4ad23', 'gong-sutra-pati', 'Desa Wisata Gong Sutra', 'Kabupaten Pati', 'Kecamatan Gong Sutra', -6.746, 110.966, 'BERKEMBANG', 'Pokdarwis Gong Sutra Maju', '081200000462', 78.5),
('824f00ca-0532-5fb8-a37f-5f4427526650', 'gulangpongge-pati', 'Desa Wisata Gulangpongge', 'Kabupaten Pati', 'Kecamatan Gulangpongge', -6.742, 111.01, 'BERKEMBANG', 'Pokdarwis Gulangpongge Maju', '081200000463', 78.5),
('58efc7a0-7237-544e-aa26-9c0daa4ff97a', 'kedumulyo-pati', 'Desa Wisata Kedumulyo', 'Kabupaten Pati', 'Kecamatan Kedumulyo', -6.9238, 110.9582, 'BERKEMBANG', 'Pokdarwis Kedumulyo Maju', '081200000464', 78.5),
('0060d6eb-5b6d-56b4-a64a-43e2df1b7fbd', 'larangan-pati', 'Desa Wisata Larangan', 'Kabupaten Pati', 'Kecamatan Larangan', -6.9009, 111.0557, 'BERKEMBANG', 'Pokdarwis Larangan Maju', '081200000465', 78.5),
('95f061bf-9242-5208-b4e0-4996dc820313', 'mangrove-lestari-pati', 'Desa Wisata Mangrove Lestari', 'Kabupaten Pati', 'Kecamatan Mangrove Lestari', -6.73, 110.982, 'BERKEMBANG', 'Pokdarwis Mangrove Lestari Maju', '081200000466', 78.5),
('2be49cde-c17c-5458-8c6e-f0753c3ae18d', 'mojosemi-pati', 'Desa Wisata Mojosemi', 'Kabupaten Pati', 'Kecamatan Mojosemi', -6.726, 111.026, 'BERKEMBANG', 'Pokdarwis Mojosemi Maju', '081200000467', 78.5),
('1963d988-c535-5fee-9b41-f074e429c5b7', 'pancasila-jrahi-pati', 'Desa Wisata Pancasila Jrahi', 'Kabupaten Pati', 'Kecamatan Pancasila Jrahi', -6.722, 111.07, 'BERKEMBANG', 'Pokdarwis Pancasila Jrahi Maju', '081200000468', 78.5),
('6895cf36-6f51-59cf-b9f4-98231411784c', 'pesona-talun-pati', 'Desa Wisata Pesona Talun', 'Kabupaten Pati', 'Kecamatan Pesona Talun', -6.718, 111.114, 'BERKEMBANG', 'Pokdarwis Pesona Talun Maju', '081200000469', 78.5),
('cd79a511-68c4-50f6-bf85-275925203cce', 'sidomulyo-pati', 'Desa Wisata Sidomulyo', 'Kabupaten Pati', 'Kecamatan Sidomulyo', -6.5992, 110.9714, 'BERKEMBANG', 'Pokdarwis Sidomulyo Maju', '081200000470', 78.5),
('7f69416f-33d5-5503-b605-bcf9b491c720', 'sunan-ngerang-pati', 'Desa Wisata Sunan Ngerang', 'Kabupaten Pati', 'Kecamatan Sunan Ngerang', -6.71, 111.042, 'BERKEMBANG', 'Pokdarwis Sunan Ngerang Maju', '081200000471', 78.5),
('240c306e-4f7d-51b7-abf8-5b959ccad0dc', 'tunggulsari-pati', 'Desa Wisata Tunggulsari', 'Kabupaten Pati', 'Kecamatan Tunggulsari', -6.706, 111.086, 'BERKEMBANG', 'Pokdarwis Tunggulsari Maju', '081200000472', 78.5),
('56393828-93f8-5c97-baa7-868f9c71ebba', 'wana-samudra-pati', 'Desa Wisata Wana Samudra', 'Kabupaten Pati', 'Kecamatan Wana Samudra', -6.702, 110.97, 'BERKEMBANG', 'Pokdarwis Wana Samudra Maju', '081200000473', 78.5),
('93b3fd87-3ed0-5b91-a0cc-2346b87c43bb', 'bedagung-pekalongan', 'Desa Wisata Bedagung', 'Kabupaten Pekalongan', 'Kecamatan Bedagung', -6.971, 109.599, 'BERKEMBANG', 'Pokdarwis Bedagung Maju', '081200000474', 78.5),
('e130edeb-6c08-5916-9a14-af678ef69b71', 'botosari-pekalongan', 'Desa Wisata Botosari', 'Kabupaten Pekalongan', 'Kecamatan Botosari', -6.967, 109.643, 'BERKEMBANG', 'Pokdarwis Botosari Maju', '081200000475', 78.5),
('fcc212e2-20ff-5e1f-958a-5506b48ed19a', 'domiyang-pekalongan', 'Desa Wisata Domiyang', 'Kabupaten Pekalongan', 'Kecamatan Domiyang', -6.963, 109.687, 'BERKEMBANG', 'Pokdarwis Domiyang Maju', '081200000476', 78.5),
('3d4eeb96-69b7-535e-9ad5-51b58e29170b', 'kaliboja-pekalongan', 'Desa Wisata Kaliboja', 'Kabupaten Pekalongan', 'Kecamatan Kaliboja', -6.959, 109.571, 'BERKEMBANG', 'Pokdarwis Kaliboja Maju', '081200000477', 78.5),
('1c60a90a-19d0-50ee-900a-901bd6694608', 'kaliombo-pekalongan', 'Desa Wisata Kaliombo', 'Kabupaten Pekalongan', 'Kecamatan Kaliombo', -6.955, 109.615, 'BERKEMBANG', 'Pokdarwis Kaliombo Maju', '081200000478', 78.5),
('ff9f2011-3797-5b6f-af0f-784c55186646', 'karanggondang-pekalongan', 'Desa Wisata Karanggondang', 'Kabupaten Pekalongan', 'Karanganyar', -6.951, 109.659, 'MAJU', 'Pokdarwis Karanggondang Maju', '081200000479', 85.0),
('6ed4f154-492d-564e-aa5c-e27b8d8f71e0', 'kasimpar-pekalongan', 'Desa Wisata Kasimpar', 'Kabupaten Pekalongan', 'Kecamatan Kasimpar', -7.1361, 109.7342, 'BERKEMBANG', 'Pokdarwis Kasimpar Maju', '081200000480', 78.5),
('74639925-db7b-5cb5-81fc-c7972164d10b', 'kayupuring-pekalongan', 'Desa Wisata Kayupuring', 'Kabupaten Pekalongan', 'Petungkriyono', -7.103, 109.587, 'MAJU', 'Pokdarwis Kayupuring Maju', '081200000481', 85.0),
('c4a8e18f-b894-528f-a0f0-2f3c6baa7057', 'krandegan-pekalongan', 'Desa Wisata Krandegan', 'Kabupaten Pekalongan', 'Kecamatan Krandegan', -7.099, 109.631, 'BERKEMBANG', 'Pokdarwis Krandegan Maju', '081200000482', 78.5),
('647bb341-26f9-512a-a633-e2f2ec8e6f55', 'lambanggelun-pekalongan', 'Desa Wisata Lambanggelun', 'Kabupaten Pekalongan', 'Kecamatan Lambanggelun', -7.095, 109.675, 'BERKEMBANG', 'Pokdarwis Lambanggelun Maju', '081200000483', 78.5),
('2946b9c7-fcbf-5342-8801-5e813142bb5e', 'lemah-abang-pekalongan', 'Desa Wisata Lemah Abang', 'Kabupaten Pekalongan', 'Doro', -7.091, 109.559, 'MAJU', 'Pokdarwis Lemah Abang Maju', '081200000484', 85.0),
('bf76cabd-e4ce-52d8-a228-bfe66b9cb8d5', 'lolong-pekalongan', 'Desa Wisata Lolong', 'Kabupaten Pekalongan', 'Kecamatan Lolong', -7.087, 109.603, 'BERKEMBANG', 'Pokdarwis Lolong Maju', '081200000485', 78.5),
('d4f343eb-10ab-55ac-80b8-ab3a448f29be', 'lumeneng-pekalongan', 'Desa Wisata Lumeneng', 'Kabupaten Pekalongan', 'Kecamatan Lumeneng', -7.083, 109.647, 'BERKEMBANG', 'Pokdarwis Lumeneng Maju', '081200000486', 78.5),
('748c2275-1683-54c1-85b0-fa35be7e61e3', 'notogiwang-pekalongan', 'Desa Wisata Notogiwang', 'Kabupaten Pekalongan', 'Kecamatan Notogiwang', -7.079, 109.691, 'BERKEMBANG', 'Pokdarwis Notogiwang Maju', '081200000487', 78.5),
('c0268fca-102e-5781-af83-4a63304b16fa', 'paninggaran-pekalongan', 'Desa Wisata Paninggaran', 'Kabupaten Pekalongan', 'Kecamatan Paninggaran', -7.075, 109.575, 'BERKEMBANG', 'Pokdarwis Paninggaran Maju', '081200000488', 78.5),
('a99f5d29-9c99-5c83-86b7-46e229007c2a', 'sawangan-pekalongan', 'Desa Wisata Sawangan', 'Kabupaten Pekalongan', 'Kecamatan Sawangan', -7.071, 109.619, 'BERKEMBANG', 'Pokdarwis Sawangan Maju', '081200000489', 78.5),
('2b5a5416-554b-5fc8-9ddc-140e5eb1920c', 'tanggeran-pekalongan', 'Desa Wisata Tanggeran', 'Kabupaten Pekalongan', 'Kecamatan Tanggeran', -7.067, 109.663, 'BERKEMBANG', 'Pokdarwis Tanggeran Maju', '081200000490', 78.5),
('aecf6490-b02b-551e-a0e0-4a3381afd8d2', 'tenogo-pekalongan', 'Desa Wisata Tenogo', 'Kabupaten Pekalongan', 'Kecamatan Tenogo', -7.063, 109.547, 'BERKEMBANG', 'Pokdarwis Tenogo Maju', '081200000491', 78.5),
('1fb7949d-8f4b-51d4-a5f4-b8d83498c728', 'tlogohendro-pekalongan', 'Desa Wisata Tlogohendro', 'Kabupaten Pekalongan', 'Kecamatan Tlogohendro', -7.1547, 109.7681, 'BERKEMBANG', 'Pokdarwis Tlogohendro Maju', '081200000492', 78.5),
('e3cba70c-7913-5e5b-881b-6344966ec7ad', 'tlogopakis-pekalongan', 'Desa Wisata Tlogopakis', 'Kabupaten Pekalongan', 'Kecamatan Tlogopakis', -7.1444, 109.7061, 'BERKEMBANG', 'Pokdarwis Tlogopakis Maju', '081200000493', 78.5),
('7da5b390-01d2-5299-b7ae-c7f28cef4810', 'werdi-pekalongan', 'Desa Wisata Werdi', 'Kabupaten Pekalongan', 'Kecamatan Werdi', -7.051, 109.679, 'BERKEMBANG', 'Pokdarwis Werdi Maju', '081200000494', 78.5),
('87244ba4-ce1e-5950-b14c-b130edae79b2', 'winduaji-pekalongan', 'Desa Wisata Winduaji', 'Kabupaten Pekalongan', 'Kecamatan Winduaji', -7.3232, 109.0596, 'BERKEMBANG', 'Pokdarwis Winduaji Maju', '081200000495', 78.5),
('a9d5df7b-8d5f-5e5a-86e6-d7dd8ffa5c6b', 'asemdoyong-pemalang', 'Desa Wisata Asemdoyong', 'Kabupaten Pemalang', 'Kecamatan Asemdoyong', -6.909, 109.365, 'BERKEMBANG', 'Pokdarwis Asemdoyong Maju', '081200000496', 78.5),
('852e00e1-15dc-5d16-832e-f76632392679', 'badak-pemalang', 'Desa Wisata Badak', 'Kabupaten Pemalang', 'Kecamatan Badak', -6.905, 109.409, 'BERKEMBANG', 'Pokdarwis Badak Maju', '081200000497', 78.5),
('85c3a2f4-0ec2-5454-8cf5-a374d3ba0281', 'banyumudal-pemalang', 'Desa Wisata Banyumudal', 'Kabupaten Pemalang', 'Moga', -6.901, 109.453, 'MAJU', 'Pokdarwis Banyumudal Maju', '081200000498', 85.0),
('e667b4dd-df5b-53c4-ba28-adb1dd2009e3', 'bulakan-pemalang', 'Desa Wisata Bulakan', 'Kabupaten Pemalang', 'Kecamatan Bulakan', -6.897, 109.337, 'BERKEMBANG', 'Pokdarwis Bulakan Maju', '081200000499', 78.5),
('aedd350b-73bf-50bf-af7e-1dd6b1809a69', 'cawet-pemalang', 'Desa Wisata Cawet', 'Kabupaten Pemalang', 'Kecamatan Cawet', -6.893, 109.381, 'BERKEMBANG', 'Pokdarwis Cawet Maju', '081200000500', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('b52f4e72-efd1-5e02-9f0f-ecd12e6e6e2e', 'cikendung-pemalang', 'Desa Wisata Cikendung', 'Kabupaten Pemalang', 'Kecamatan Cikendung', -6.889, 109.425, 'BERKEMBANG', 'Pokdarwis Cikendung Maju', '081200000501', 78.5),
('9db99c55-5986-5f99-ae5b-d33558c43470', 'clekatakan-pemalang', 'Desa Wisata Clekatakan', 'Kabupaten Pemalang', 'Kecamatan Clekatakan', -6.885, 109.309, 'BERKEMBANG', 'Pokdarwis Clekatakan Maju', '081200000502', 78.5),
('d2c8037b-7895-52ae-8d5f-458c04a30891', 'gambuhan-pemalang', 'Desa Wisata Gambuhan', 'Kabupaten Pemalang', 'Pulosari', -6.881, 109.353, 'MAJU', 'Pokdarwis Gambuhan Maju', '081200000503', 85.0),
('82d7317f-c18d-5573-b72a-6dc31a23a693', 'gapura-pemalang', 'Desa Wisata Gapura', 'Kabupaten Pemalang', 'Kecamatan Gapura', -6.877, 109.397, 'BERKEMBANG', 'Pokdarwis Gapura Maju', '081200000504', 78.5),
('65f28803-0e20-5559-af09-afcce58543bb', 'gongseng-pemalang', 'Desa Wisata Gongseng', 'Kabupaten Pemalang', 'Kecamatan Gongseng', -6.873, 109.441, 'BERKEMBANG', 'Pokdarwis Gongseng Maju', '081200000505', 78.5),
('52fb0ae9-de93-53de-81ea-ca81621aa00f', 'gunungsari-pemalang', 'Desa Wisata Gunungsari', 'Kabupaten Pemalang', 'Pulosari', -7.5391, 109.6166, 'MAJU', 'Pokdarwis Gunungsari Maju', '081200000506', 85.0),
('a1d06c1d-0b1c-540a-957c-24ddc9f943cc', 'jojogan-pemalang', 'Desa Wisata Jojogan', 'Kabupaten Pemalang', 'Kecamatan Jojogan', -6.865, 109.369, 'BERKEMBANG', 'Pokdarwis Jojogan Maju', '081200000507', 78.5),
('f2fabccd-38a5-5459-9d1d-b36e2e0d8a72', 'jurangmangu-pemalang', 'Desa Wisata Jurangmangu', 'Kabupaten Pemalang', 'Kecamatan Jurangmangu', -6.861, 109.413, 'BERKEMBANG', 'Pokdarwis Jurangmangu Maju', '081200000508', 78.5),
('7585bc86-295b-507d-a9b8-cb3a2ada4ae7', 'kaliprau-pemalang', 'Desa Wisata Kaliprau', 'Kabupaten Pemalang', 'Ulujami', -6.857, 109.457, 'MAJU', 'Pokdarwis Kaliprau Maju', '081200000509', 85.0),
('7e4e1aea-cd95-53a2-b6ce-44028cdffd2a', 'karangsari-pemalang', 'Desa Wisata Karangsari', 'Kabupaten Pemalang', 'Pulosari', -6.853, 109.341, 'MAJU', 'Pokdarwis Karangsari Maju', '081200000510', 85.0),
('9d33a4d8-fec2-5658-bed2-bd55a49ce19e', 'kebanggan-pemalang', 'Desa Wisata Kebanggan', 'Kabupaten Pemalang', 'Kecamatan Kebanggan', -6.849, 109.385, 'BERKEMBANG', 'Pokdarwis Kebanggan Maju', '081200000511', 78.5),
('1c48a5e3-1673-5e01-9412-414e8ad27ff8', 'kecepit-pemalang', 'Desa Wisata Kecepit', 'Kabupaten Pemalang', 'Kecamatan Kecepit', -6.845, 109.429, 'BERKEMBANG', 'Pokdarwis Kecepit Maju', '081200000512', 78.5),
('0230356a-590e-567d-82ea-2d7dcd747c1c', 'majalangu-pemalang', 'Desa Wisata Majalangu', 'Kabupaten Pemalang', 'Kecamatan Majalangu', -7.1547, 109.4341, 'BERKEMBANG', 'Pokdarwis Majalangu Maju', '081200000513', 78.5),
('c79307b6-5daf-5287-b5b4-46a1d0a75b80', 'mandiraja-pemalang', 'Desa Wisata Mandiraja', 'Kabupaten Pemalang', 'Kecamatan Mandiraja', -6.837, 109.357, 'BERKEMBANG', 'Pokdarwis Mandiraja Maju', '081200000514', 78.5),
('7044f45b-0946-53a6-af95-3149dd45fd66', 'mejagong-pemalang', 'Desa Wisata Mejagong', 'Kabupaten Pemalang', 'Kecamatan Mejagong', -6.833, 109.401, 'BERKEMBANG', 'Pokdarwis Mejagong Maju', '081200000515', 78.5),
('e641c0bf-96b3-5865-b891-1a9e893f5451', 'mendelem-pemalang', 'Desa Wisata Mendelem', 'Kabupaten Pemalang', 'Kecamatan Mendelem', -6.829, 109.445, 'BERKEMBANG', 'Pokdarwis Mendelem Maju', '081200000516', 78.5),
('88ddc82a-0ae6-5956-8bd2-b04260b9740c', 'mojo-pemalang', 'Desa Wisata Mojo', 'Kabupaten Pemalang', 'Kecamatan Mojo', -6.825, 109.329, 'BERKEMBANG', 'Pokdarwis Mojo Maju', '081200000517', 78.5),
('c347461e-b98c-5380-8ce8-a6170e04fd66', 'nyalembeng-pemalang', 'Desa Wisata Nyalembeng', 'Kabupaten Pemalang', 'Pulosari', -6.821, 109.373, 'MANDIRI', 'Pokdarwis Nyalembeng Maju', '081200000518', 92.5),
('8811c1e9-ab8b-51b4-b76f-4c58a3f7df75', 'nyamplungsari-pemalang', 'Desa Wisata Nyamplungsari', 'Kabupaten Pemalang', 'Petarukan', -6.817, 109.417, 'MAJU', 'Pokdarwis Nyamplungsari Maju', '081200000519', 85.0),
('2048b283-f79c-5e6e-938c-c7aff97fc0c0', 'penggarit-pemalang', 'Desa Wisata Penggarit', 'Kabupaten Pemalang', 'Kecamatan Penggarit', -6.9589, 109.4211, 'BERKEMBANG', 'Pokdarwis Penggarit Maju', '081200000520', 78.5),
('78b4bcd6-00f5-59d0-93a6-1bd707522260', 'pulosari-pemalang', 'Desa Wisata Pulosari', 'Kabupaten Pemalang', 'Kecamatan Pulosari', -6.969, 109.345, 'BERKEMBANG', 'Pokdarwis Pulosari Maju', '081200000521', 78.5),
('5b289cc7-c352-51f9-b178-86c93ea2aa5e', 'sarwodadi-pemalang', 'Desa Wisata Sarwodadi', 'Kabupaten Pemalang', 'Kecamatan Sarwodadi', -6.965, 109.389, 'BERKEMBANG', 'Pokdarwis Sarwodadi Maju', '081200000522', 78.5),
('23ef70f8-7854-5144-9ef9-0c76a9129da2', 'sikasur-pemalang', 'Desa Wisata Sikasur', 'Kabupaten Pemalang', 'Kecamatan Sikasur', -6.961, 109.433, 'BERKEMBANG', 'Pokdarwis Sikasur Maju', '081200000523', 78.5),
('59e338e2-92f6-512b-b34b-a801bb36dcca', 'sima-pemalang', 'Desa Wisata Sima', 'Kabupaten Pemalang', 'Kecamatan Sima', -6.957, 109.317, 'BERKEMBANG', 'Pokdarwis Sima Maju', '081200000524', 78.5),
('8d79b096-eb54-5b1f-b188-a7f359009977', 'simpur-pemalang', 'Desa Wisata Simpur', 'Kabupaten Pemalang', 'Kecamatan Simpur', -6.953, 109.361, 'BERKEMBANG', 'Pokdarwis Simpur Maju', '081200000525', 78.5),
('257aee68-019a-5395-8c29-824404e459c6', 'surajaya-pemalang', 'Desa Wisata Surajaya', 'Kabupaten Pemalang', 'Pemalang', -6.949, 109.405, 'MAJU', 'Pokdarwis Surajaya Maju', '081200000526', 85.0),
('e7144572-c677-5452-9a46-ccbfacf0a40c', 'susukan-pemalang', 'Desa Wisata Susukan', 'Kabupaten Pemalang', 'Kecamatan Susukan', -6.945, 109.449, 'BERKEMBANG', 'Pokdarwis Susukan Maju', '081200000527', 78.5),
('07945dc9-45ae-56b0-99a3-3bb1f8df08c8', 'tundagan-pemalang', 'Desa Wisata Tundagan', 'Kabupaten Pemalang', 'Kecamatan Tundagan', -6.941, 109.333, 'BERKEMBANG', 'Pokdarwis Tundagan Maju', '081200000528', 78.5),
('e9d4b8f4-fb16-563f-8e88-75b822be8137', 'wanarejan-utara-pemalang', 'Desa Wisata Wanarejan Utara', 'Kabupaten Pemalang', 'Kecamatan Wanarejan Utara', -6.937, 109.377, 'BERKEMBANG', 'Pokdarwis Wanarejan Utara Maju', '081200000529', 78.5),
('ed8c2d05-60e0-5f78-8318-2e3796ef2abf', 'watukumpul-pemalang', 'Desa Wisata Watukumpul', 'Kabupaten Pemalang', 'Kecamatan Watukumpul', -6.933, 109.421, 'BERKEMBANG', 'Pokdarwis Watukumpul Maju', '081200000530', 78.5),
('58a49e6b-3470-5ec5-a992-c3dd61c5bd11', 'wisnu-pemalang', 'Desa Wisata Wisnu', 'Kabupaten Pemalang', 'Kecamatan Wisnu', -6.929, 109.305, 'BERKEMBANG', 'Pokdarwis Wisnu Maju', '081200000531', 78.5),
('057260e0-aff3-5170-b422-d853dfad6468', 'banjaran-purbalingga', 'Desa Wisata Banjaran', 'Kabupaten Purbalingga', 'Kecamatan Banjaran', -7.3589, 109.3775, 'BERKEMBANG', 'Pokdarwis Banjaran Maju', '081200000532', 78.5),
('90657a31-0f6e-5b94-b940-7b667062779c', 'bumisari-purbalingga', 'Desa Wisata Bumisari', 'Kabupaten Purbalingga', 'Kecamatan Bumisari', -7.416, 109.375, 'BERKEMBANG', 'Pokdarwis Bumisari Maju', '081200000533', 78.5),
('0fab7b17-eaa3-5f74-90e2-c91ff1e7d642', 'gemuruh-purbalingga', 'Desa Wisata Gemuruh', 'Kabupaten Purbalingga', 'Kecamatan Gemuruh', -7.3756, 109.3428, 'BERKEMBANG', 'Pokdarwis Gemuruh Maju', '081200000534', 78.5),
('80d0d002-1753-5d2a-b3a2-e4ff23412342', 'gunungwuled-purbalingga', 'Desa Wisata Gunungwuled', 'Kabupaten Purbalingga', 'Kecamatan Gunungwuled', -7.408, 109.303, 'BERKEMBANG', 'Pokdarwis Gunungwuled Maju', '081200000535', 78.5),
('a0000000-0000-0000-0000-000000000005', 'karangbanjar-purbalingga', 'Desa Wisata Karangbanjar', 'Kabupaten Purbalingga', 'Kecamatan Karangbanjar', -7.404, 109.347, 'BERKEMBANG', 'Pokdarwis Karangbanjar Maju', '081200000536', 78.5),
('377bd139-0819-5b54-8045-e3584907d085', 'karangcegak-purbalingga', 'Desa Wisata Karangcegak', 'Kabupaten Purbalingga', 'Kecamatan Karangcegak', -7.3336, 109.3136, 'BERKEMBANG', 'Pokdarwis Karangcegak Maju', '081200000537', 78.5),
('426b637e-4e0e-5375-9aa6-915ef6c685de', 'karangcengis-purbalingga', 'Desa Wisata Karangcengis', 'Kabupaten Purbalingga', 'Kecamatan Karangcengis', -7.396, 109.435, 'BERKEMBANG', 'Pokdarwis Karangcengis Maju', '081200000538', 78.5),
('99b14418-1adc-5607-8ab5-b5b256efc6a0', 'karangreja-purbalingga', 'Desa Wisata Karangreja', 'Kabupaten Purbalingga', 'Kecamatan Karangreja', -7.392, 109.319, 'BERKEMBANG', 'Pokdarwis Karangreja Maju', '081200000539', 78.5),
('e76e383f-819a-5df0-bc03-33f4cd59a3b5', 'karangtalun-purbalingga', 'Desa Wisata Karangtalun', 'Kabupaten Purbalingga', 'Kecamatan Karangtalun', -7.388, 109.363, 'BERKEMBANG', 'Pokdarwis Karangtalun Maju', '081200000540', 78.5),
('a82a2a0d-b56f-5761-8309-5515f9ac7d54', 'kedungbenda-purbalingga', 'Desa Wisata Kedungbenda', 'Kabupaten Purbalingga', 'Kecamatan Kedungbenda', -7.4731, 109.3309, 'BERKEMBANG', 'Pokdarwis Kedungbenda Maju', '081200000541', 78.5),
('7cd51ae2-8e81-5995-8655-c4db16eebd93', 'kutabawa-purbalingga', 'Desa Wisata Kutabawa', 'Kabupaten Purbalingga', 'Kecamatan Kutabawa', -7.38, 109.291, 'BERKEMBANG', 'Pokdarwis Kutabawa Maju', '081200000542', 78.5),
('a0000000-0000-0000-0000-000000000003', 'limbasari-purbalingga', 'Desa Wisata Limbasari', 'Kabupaten Purbalingga', 'Kecamatan Limbasari', -7.376, 109.335, 'BERKEMBANG', 'Pokdarwis Limbasari Maju', '081200000543', 78.5),
('060daf02-8b22-5a0d-b413-17eadff7692a', 'nangkod-purbalingga', 'Desa Wisata Nangkod', 'Kabupaten Purbalingga', 'Kecamatan Nangkod', -7.384, 109.5333, 'BERKEMBANG', 'Pokdarwis Nangkod Maju', '081200000544', 78.5),
('eb286939-76eb-5ee3-9c47-9d36a2e82cac', 'onje-purbalingga', 'Desa Wisata Onje', 'Kabupaten Purbalingga', 'Kecamatan Onje', -7.368, 109.423, 'BERKEMBANG', 'Pokdarwis Onje Maju', '081200000545', 78.5),
('cd45a94f-6478-5c97-95e9-f1d02b97dd25', 'pagerandong-purbalingga', 'Desa Wisata Pagerandong', 'Kabupaten Purbalingga', 'Kecamatan Pagerandong', -7.364, 109.307, 'BERKEMBANG', 'Pokdarwis Pagerandong Maju', '081200000546', 78.5),
('25fa3958-012b-5d92-80f8-579cba5f1746', 'panusupan-purbalingga', 'Desa Wisata Panusupan', 'Kabupaten Purbalingga', 'Kecamatan Panusupan', -7.36, 109.351, 'BERKEMBANG', 'Pokdarwis Panusupan Maju', '081200000547', 78.5),
('0b96bc47-c3c0-5fe0-b479-a5d70ed4bad7', 'patemon-purbalingga', 'Desa Wisata Patemon', 'Kabupaten Purbalingga', 'Kecamatan Patemon', -7.3525, 109.3644, 'BERKEMBANG', 'Pokdarwis Patemon Maju', '081200000548', 78.5),
('45856e93-37a8-5408-9ba6-14174c5ef1b9', 'pepedan-purbalingga', 'Desa Wisata Pepedan', 'Kabupaten Purbalingga', 'Kecamatan Pepedan', -7.352, 109.439, 'BERKEMBANG', 'Pokdarwis Pepedan Maju', '081200000549', 78.5),
('b40e2bd0-7368-5fb8-9cdc-b68cfbb66d78', 'sangkanayu-purbalingga', 'Desa Wisata Sangkanayu', 'Kabupaten Purbalingga', 'Kecamatan Sangkanayu', -7.348, 109.323, 'BERKEMBANG', 'Pokdarwis Sangkanayu Maju', '081200000550', 78.5),
('8220dd13-75e1-5f5e-8c78-3baf97788936', 'selakambang-purbalingga', 'Desa Wisata Selakambang', 'Kabupaten Purbalingga', 'Kaligondang', -7.344, 109.367, 'MAJU', 'Pokdarwis Selakambang Maju', '081200000551', 85.0),
('38c3f3ce-2b1b-5516-9003-6c90655c97aa', 'serang-purbalingga', 'Desa Wisata Serang', 'Kabupaten Purbalingga', 'Kecamatan Serang', -7.2289, 109.2894, 'BERKEMBANG', 'Pokdarwis Serang Maju', '081200000552', 78.5),
('7bc6f800-ecb6-580d-911e-f0191f531a7c', 'serayu-larangan-purbalingga', 'Desa Wisata Serayu Larangan', 'Kabupaten Purbalingga', 'Mrebet', -7.336, 109.295, 'MAJU', 'Pokdarwis Serayu Larangan Maju', '081200000553', 85.0),
('be575eae-4132-551c-a9f5-7c63a3b70612', 'sirau-purbalingga', 'Desa Wisata Sirau', 'Kabupaten Purbalingga', 'Karangmoncol', -7.332, 109.339, 'MAJU', 'Pokdarwis Sirau Maju', '081200000554', 85.0),
('f397fa26-6ce0-5c3a-b2fc-8ff6c30ad731', 'siwarak-purbalingga', 'Desa Wisata Siwarak', 'Kabupaten Purbalingga', 'Karangreja', -7.328, 109.383, 'MAJU', 'Pokdarwis Siwarak Maju', '081200000555', 85.0),
('6a6f7701-9b4f-5013-a1f8-f268e83b36ff', 'tanalum-purbalingga', 'Desa Wisata Tanalum', 'Kabupaten Purbalingga', 'Kecamatan Tanalum', -7.324, 109.427, 'BERKEMBANG', 'Pokdarwis Tanalum Maju', '081200000556', 78.5),
('1f37c881-b86f-5c9e-967c-1d53b4021819', 'timbang-purbalingga', 'Desa Wisata Timbang', 'Kabupaten Purbalingga', 'Kecamatan Timbang', -7.3981, 109.5431, 'BERKEMBANG', 'Pokdarwis Timbang Maju', '081200000557', 78.5),
('cf7f7e4d-1afe-510a-b22b-11810dfaffae', 'tlahab-kidul-purbalingga', 'Desa Wisata Tlahab Kidul', 'Kabupaten Purbalingga', 'Kecamatan Tlahab Kidul', -7.2617, 109.3397, 'BERKEMBANG', 'Pokdarwis Tlahab Kidul Maju', '081200000558', 78.5),
('65fd7edb-3b52-5b48-89e3-f79b21d2abb9', 'tumanggal-purbalingga', 'Desa Wisata Tumanggal', 'Kabupaten Purbalingga', 'Pengadegan', -7.312, 109.399, 'MAJU', 'Pokdarwis Tumanggal Maju', '081200000559', 85.0),
('99986e19-57df-5306-839b-3b45aab915af', 'awu-awu-purworejo', 'Desa Wisata Awu Awu', 'Kabupaten Purworejo', 'Kecamatan Awu Awu', -7.8342, 109.9217, 'BERKEMBANG', 'Pokdarwis Awu Awu Maju', '081200000560', 78.5),
('fa83428d-a792-554b-8afb-5585cee7a830', 'bagelan-purworejo', 'Desa Wisata Bagelan', 'Kabupaten Purworejo', 'Kecamatan Bagelan', -7.791, 109.972, 'BERKEMBANG', 'Pokdarwis Bagelan Maju', '081200000561', 78.5),
('e2a21092-c1b7-575a-9708-90f7534bb6af', 'bandung-purworejo', 'Desa Wisata Bandung', 'Kabupaten Purworejo', 'Kecamatan Bandung', -7.787, 110.016, 'BERKEMBANG', 'Pokdarwis Bandung Maju', '081200000562', 78.5),
('91d0f425-af0f-5a52-ac69-d9cf2267ce43', 'benowo-purworejo', 'Desa Wisata Benowo', 'Kabupaten Purworejo', 'Kecamatan Benowo', -7.783, 110.06, 'BERKEMBANG', 'Pokdarwis Benowo Maju', '081200000563', 78.5),
('ce012a04-3c7b-5d43-a780-dc95bac82d74', 'cacaban-kidul-purworejo', 'Desa Wisata Cacaban Kidul', 'Kabupaten Purworejo', 'Bener', -7.779, 109.944, 'MAJU', 'Pokdarwis Cacaban Kidul Maju', '081200000564', 85.0),
('484f724d-8cda-5a3d-957f-1ca9dd613637', 'cepedak-purworejo', 'Desa Wisata Cepedak', 'Kabupaten Purworejo', 'Kecamatan Cepedak', -7.775, 109.988, 'BERKEMBANG', 'Pokdarwis Cepedak Maju', '081200000565', 78.5),
('d4b04074-7c6c-5a88-bc88-c67d689c96ce', 'dadirejo-purworejo', 'Desa Wisata Dadirejo', 'Kabupaten Purworejo', 'Kecamatan Dadirejo', -7.771, 110.032, 'BERKEMBANG', 'Pokdarwis Dadirejo Maju', '081200000566', 78.5),
('e923ecb7-4580-5966-a538-3440e61e9bf8', 'donorejo-purworejo', 'Desa Wisata Donorejo', 'Kabupaten Purworejo', 'Kecamatan Donorejo', -7.767, 110.076, 'BERKEMBANG', 'Pokdarwis Donorejo Maju', '081200000567', 78.5),
('b43adaf9-996c-5b22-bf19-5bb9e945298a', 'durensari-purworejo', 'Desa Wisata Durensari', 'Kabupaten Purworejo', 'Bagelen', -7.763, 109.96, 'MAJU', 'Pokdarwis Durensari Maju', '081200000568', 85.0),
('f633bef1-80c5-5848-ab4a-269096c5710a', 'gedangan-purworejo', 'Desa Wisata Gedangan', 'Kabupaten Purworejo', 'Purwodadi', -7.759, 110.004, 'MAJU', 'Pokdarwis Gedangan Maju', '081200000569', 85.0),
('49054704-3ac6-532d-8389-8f7d8db9cfb7', 'giyombong-purworejo', 'Desa Wisata Giyombong', 'Kabupaten Purworejo', 'Kecamatan Giyombong', -7.755, 110.048, 'BERKEMBANG', 'Pokdarwis Giyombong Maju', '081200000570', 78.5),
('163759e5-6d16-52f9-9e3c-facaaf4bd407', 'guntur-purworejo', 'Desa Wisata Guntur', 'Kabupaten Purworejo', 'Bener', -7.751, 109.932, 'MAJU', 'Pokdarwis Guntur Maju', '081200000571', 85.0),
('73c40f8c-5d80-5491-aba4-f8f14a3c2507', 'gunung-condong-purworejo', 'Desa Wisata Gunung Condong', 'Kabupaten Purworejo', 'Kecamatan Gunung Condong', -7.747, 109.976, 'BERKEMBANG', 'Pokdarwis Gunung Condong Maju', '081200000572', 78.5),
('58e1a6f2-6aac-54d0-bf5a-6aa44c2408de', 'gunung-wangi-purworejo', 'Desa Wisata Gunung Wangi', 'Kabupaten Purworejo', 'Kecamatan Gunung Wangi', -7.743, 110.02, 'BERKEMBANG', 'Pokdarwis Gunung Wangi Maju', '081200000573', 78.5),
('1e125e83-c3a4-54e2-b7af-b58949689adc', 'jati-purworejo', 'Desa Wisata Jati', 'Kabupaten Purworejo', 'Kecamatan Jati', -7.739, 110.064, 'BERKEMBANG', 'Pokdarwis Jati Maju', '081200000574', 78.5),
('2a876356-32ca-51ca-99c3-17d55116ea85', 'jatimalang-purworejo', 'Desa Wisata Jatimalang', 'Kabupaten Purworejo', 'Kecamatan Jatimalang', -7.735, 109.948, 'BERKEMBANG', 'Pokdarwis Jatimalang Maju', '081200000575', 78.5),
('06603bf9-bf65-56d6-b2dc-3995e1594341', 'jogoboyo-purworejo', 'Desa Wisata Jogoboyo', 'Kabupaten Purworejo', 'Purwodadi', -7.731, 109.992, 'MAJU', 'Pokdarwis Jogoboyo Maju', '081200000576', 85.0),
('7c937385-8852-5047-a283-1a413fc93135', 'kaligono-purworejo', 'Desa Wisata Kaligono', 'Kabupaten Purworejo', 'Kecamatan Kaligono', -7.727, 110.036, 'BERKEMBANG', 'Pokdarwis Kaligono Maju', '081200000577', 78.5),
('21e03975-e9a8-52d9-910a-7ac1d6f42a5b', 'kalisemo-purworejo', 'Desa Wisata Kalisemo', 'Kabupaten Purworejo', 'Kecamatan Kalisemo', -7.723, 110.08, 'BERKEMBANG', 'Pokdarwis Kalisemo Maju', '081200000578', 78.5),
('31abf7bf-1804-5315-81e3-ed3c8c001682', 'kaliurip-purworejo', 'Desa Wisata Kaliurip', 'Kabupaten Purworejo', 'Kecamatan Kaliurip', -7.6561, 109.8989, 'BERKEMBANG', 'Pokdarwis Kaliurip Maju', '081200000579', 78.5),
('900161a1-e8bb-52fd-9962-3d45d1e3fbf5', 'kaliwatubumi-purworejo', 'Desa Wisata Kaliwatubumi', 'Kabupaten Purworejo', 'Kecamatan Kaliwatubumi', -7.715, 110.008, 'BERKEMBANG', 'Pokdarwis Kaliwatubumi Maju', '081200000580', 78.5),
('aaa67a95-6b78-5576-b81e-73d15003c51c', 'kaliwungu-purworejo', 'Desa Wisata Kaliwungu', 'Kabupaten Purworejo', 'Kecamatan Kaliwungu', -7.711, 110.052, 'BERKEMBANG', 'Pokdarwis Kaliwungu Maju', '081200000581', 78.5),
('7f91eec6-f5af-5a16-b512-e0f7c32983e6', 'karangrejo-purworejo', 'Desa Wisata Karangrejo', 'Kabupaten Purworejo', 'Kutoarjo', -7.707, 109.936, 'MAJU', 'Pokdarwis Karangrejo Maju', '081200000582', 85.0),
('26bbf708-0da3-595e-a694-f01fe3e77cae', 'karangrejo-purworejo-2', 'Desa Wisata Karangrejo', 'Kabupaten Purworejo', 'Kutoarjo', -7.703, 109.98, 'MAJU', 'Pokdarwis Karangrejo Maju', '081200000583', 85.0),
('04804ff8-5c32-5b2c-bb83-a0176be0e9ed', 'keburuhan-purworejo', 'Desa Wisata Keburuhan', 'Kabupaten Purworejo', 'Kecamatan Keburuhan', -7.699, 110.024, 'BERKEMBANG', 'Pokdarwis Keburuhan Maju', '081200000584', 78.5),
('5a63d7f5-63ae-5652-9d5b-ee1184fa2666', 'kemanukan-purworejo', 'Desa Wisata Kemanukan', 'Kabupaten Purworejo', 'Kecamatan Kemanukan', -7.695, 110.068, 'BERKEMBANG', 'Pokdarwis Kemanukan Maju', '081200000585', 78.5),
('05e33ece-5916-51a0-bd79-7a8c68508bf2', 'kemenjing-purworejo', 'Desa Wisata Kemenjing', 'Kabupaten Purworejo', 'Kecamatan Kemenjing', -7.691, 109.952, 'BERKEMBANG', 'Pokdarwis Kemenjing Maju', '081200000586', 78.5),
('78916e1e-a8b9-59c7-a7b7-556790c5252e', 'kemiri-purworejo', 'Desa Wisata Kemiri', 'Kabupaten Purworejo', 'Kecamatan Kemiri', -7.5911, 110.0083, 'BERKEMBANG', 'Pokdarwis Kemiri Maju', '081200000587', 78.5),
('227e98c4-fff6-5500-9173-d3d11596da37', 'kertojayan-purworejo', 'Desa Wisata Kertojayan', 'Kabupaten Purworejo', 'Kecamatan Kertojayan', -7.683, 110.04, 'BERKEMBANG', 'Pokdarwis Kertojayan Maju', '081200000588', 78.5),
('8b2a58ac-d239-51fd-9ea3-68fba7863d65', 'ketawangrejo-purworejo', 'Desa Wisata Ketawangrejo', 'Kabupaten Purworejo', 'Kecamatan Ketawangrejo', -7.679, 110.084, 'BERKEMBANG', 'Pokdarwis Ketawangrejo Maju', '081200000589', 78.5),
('e68e5511-daca-5b1f-8805-2aecf4778807', 'loano-purworejo', 'Desa Wisata Loano', 'Kabupaten Purworejo', 'Kecamatan Loano', -7.6633, 110.0383, 'BERKEMBANG', 'Pokdarwis Loano Maju', '081200000590', 78.5),
('7f1a2da0-de00-5967-9b8f-022c0434a4ec', 'loning-purworejo', 'Desa Wisata Loning', 'Kabupaten Purworejo', 'Kecamatan Loning', -7.671, 110.012, 'BERKEMBANG', 'Pokdarwis Loning Maju', '081200000591', 78.5),
('dfdfecc6-3cd5-5c1e-a2f3-bf14c5fac4d9', 'magelung-kidul-purworejo', 'Desa Wisata Magelung Kidul', 'Kabupaten Purworejo', 'Kecamatan Magelung Kidul', -7.667, 110.056, 'BERKEMBANG', 'Pokdarwis Magelung Kidul Maju', '081200000592', 78.5),
('f216d6dd-8d75-57f3-8dc0-ff5be3f11ed9', 'malangrejo-purworejo', 'Desa Wisata Malangrejo', 'Kabupaten Purworejo', 'Kecamatan Malangrejo', -7.663, 109.94, 'BERKEMBANG', 'Pokdarwis Malangrejo Maju', '081200000593', 78.5),
('d7c8a08d-9417-5bba-8125-e4dba518af99', 'ngadirejo-purworejo', 'Desa Wisata Ngadirejo', 'Kabupaten Purworejo', 'Kecamatan Ngadirejo', -7.659, 109.984, 'BERKEMBANG', 'Pokdarwis Ngadirejo Maju', '081200000594', 78.5),
('2eadbbbd-7d7f-555b-be94-9fa52456def6', 'pagak-purworejo', 'Desa Wisata Pagak', 'Kabupaten Purworejo', 'Ngombol', -7.655, 110.028, 'MAJU', 'Pokdarwis Pagak Maju', '081200000595', 85.0),
('d1e49404-adc0-5196-b980-db82d620d099', 'pamriyan-purworejo', 'Desa Wisata Pamriyan', 'Kabupaten Purworejo', 'Kecamatan Pamriyan', -7.651, 110.072, 'BERKEMBANG', 'Pokdarwis Pamriyan Maju', '081200000596', 78.5),
('a930f742-bace-5a64-8a0f-392a3ede256e', 'pandanrejo-purworejo', 'Desa Wisata Pandanrejo', 'Kabupaten Purworejo', 'Kecamatan Pandanrejo', -7.647, 109.956, 'BERKEMBANG', 'Pokdarwis Pandanrejo Maju', '081200000597', 78.5),
('492bb4c4-5b04-5ac4-899c-dc1453f66788', 'patutrejo-purworejo', 'Desa Wisata Patutrejo', 'Kabupaten Purworejo', 'Kecamatan Patutrejo', -7.643, 110.0, 'BERKEMBANG', 'Pokdarwis Patutrejo Maju', '081200000598', 78.5),
('edb71e25-da6f-5cfc-9de3-645cd6a7f073', 'pejagran-purworejo', 'Desa Wisata Pejagran', 'Kabupaten Purworejo', 'Kecamatan Pejagran', -7.8456, 109.9428, 'BERKEMBANG', 'Pokdarwis Pejagran Maju', '081200000599', 78.5),
('b32f9bac-ec2f-565d-85a5-059c821e8a1f', 'pucungroto-purworejo', 'Desa Wisata Pucungroto', 'Kabupaten Purworejo', 'Kaligesing', -7.795, 109.928, 'MAJU', 'Pokdarwis Pucungroto Maju', '081200000600', 85.0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('133b1433-b57d-5279-b17e-46b8ef12be01', 'purbayan-purworejo', 'Desa Wisata Purbayan', 'Kabupaten Purworejo', 'Kecamatan Purbayan', -7.791, 109.972, 'BERKEMBANG', 'Pokdarwis Purbayan Maju', '081200000601', 78.5),
('029f820b-8add-5493-bc6f-58aba177f7f1', 'sambeng-purworejo', 'Desa Wisata Sambeng', 'Kabupaten Purworejo', 'Kecamatan Sambeng', -7.787, 110.016, 'BERKEMBANG', 'Pokdarwis Sambeng Maju', '081200000602', 78.5),
('63d436e8-fe4d-5907-bcd6-7c2f4d670558', 'sedayu-purworejo', 'Desa Wisata Sedayu', 'Kabupaten Purworejo', 'Kecamatan Sedayu', -6.9662, 111.0219, 'BERKEMBANG', 'Pokdarwis Sedayu Maju', '081200000603', 78.5),
('85c06827-99bb-59e8-96ef-2a3b34d184f7', 'semawung-purworejo', 'Desa Wisata Semawung', 'Kabupaten Purworejo', 'Purworejo', -7.779, 109.944, 'MAJU', 'Pokdarwis Semawung Maju', '081200000604', 85.0),
('2e57f551-0190-501b-bbbf-eccbf971e559', 'sidomulyo-purworejo', 'Desa Wisata Sidomulyo', 'Kabupaten Purworejo', 'Kecamatan Sidomulyo', -7.775, 109.988, 'BERKEMBANG', 'Pokdarwis Sidomulyo Maju', '081200000605', 78.5),
('72ec36eb-6503-5f11-a4a4-59b735abc07d', 'somongari-purworejo', 'Desa Wisata Somongari', 'Kabupaten Purworejo', 'Kecamatan Somongari', -7.771, 110.032, 'BERKEMBANG', 'Pokdarwis Somongari Maju', '081200000606', 78.5),
('c670df07-90d7-5d87-8c63-ae2b4d2d0e05', 'sukowuwuh-purworejo', 'Desa Wisata Sukowuwuh', 'Kabupaten Purworejo', 'Kecamatan Sukowuwuh', -7.767, 110.076, 'BERKEMBANG', 'Pokdarwis Sukowuwuh Maju', '081200000607', 78.5),
('9d85329c-4a2d-5c57-983f-62320d0c97d6', 'tawangsari-purworejo', 'Desa Wisata Tawangsari', 'Kabupaten Purworejo', 'Kecamatan Tawangsari', -7.763, 109.96, 'BERKEMBANG', 'Pokdarwis Tawangsari Maju', '081200000608', 78.5),
('8b01b870-8b5f-561a-9b5f-5990c27e6e0a', 'tlogoguwo-purworejo', 'Desa Wisata Tlogoguwo', 'Kabupaten Purworejo', 'Kaligesing', -7.759, 110.004, 'MAJU', 'Pokdarwis Tlogoguwo Maju', '081200000609', 85.0),
('891a761e-7c99-5f80-af06-1bb73e229937', 'tlogokotes-purworejo', 'Desa Wisata Tlogokotes', 'Kabupaten Purworejo', 'Bagelen', -7.755, 110.048, 'MAJU', 'Pokdarwis Tlogokotes Maju', '081200000610', 85.0),
('48c6800d-5ba1-511d-8369-52a340871fae', 'tlogosono-purworejo', 'Desa Wisata Tlogosono', 'Kabupaten Purworejo', 'Kecamatan Tlogosono', -7.6244, 109.9886, 'BERKEMBANG', 'Pokdarwis Tlogosono Maju', '081200000611', 78.5),
('f879076b-beef-5f88-9e65-17de3ad5b6ed', 'tunjungan-purworejo', 'Desa Wisata Tunjungan', 'Kabupaten Purworejo', 'Kecamatan Tunjungan', -7.8358, 109.9433, 'BERKEMBANG', 'Pokdarwis Tunjungan Maju', '081200000612', 78.5),
('3235089c-3cbb-5ad8-8533-d9f84ed72f95', 'wonosido-purworejo', 'Desa Wisata Wonosido', 'Kabupaten Purworejo', 'Kecamatan Wonosido', -7.743, 110.02, 'BERKEMBANG', 'Pokdarwis Wonosido Maju', '081200000613', 78.5),
('3c91ae73-8803-5e32-b80a-74e0e6833614', 'babagan-rembang', 'Desa Wisata Babagan', 'Kabupaten Rembang', 'Kecamatan Babagan', -6.731, 111.4, 'BERKEMBANG', 'Pokdarwis Babagan Maju', '081200000614', 78.5),
('b293bb5b-b656-577b-9227-64e6bb0e2625', 'balongmulyo-rembang', 'Desa Wisata Balongmulyo', 'Kabupaten Rembang', 'Kecamatan Balongmulyo', -6.727, 111.284, 'BERKEMBANG', 'Pokdarwis Balongmulyo Maju', '081200000615', 78.5),
('b981403e-8c1d-578b-be76-150601b7bc37', 'banggi-rembang', 'Desa Wisata Banggi', 'Kabupaten Rembang', 'Kecamatan Banggi', -6.723, 111.328, 'BERKEMBANG', 'Pokdarwis Banggi Maju', '081200000616', 78.5),
('4877e456-d634-563c-88fb-a4101fd1830e', 'binangun-rembang', 'Desa Wisata Binangun', 'Kabupaten Rembang', 'Kecamatan Binangun', -6.719, 111.372, 'BERKEMBANG', 'Pokdarwis Binangun Maju', '081200000617', 78.5),
('62c1a08b-21bc-5cf1-9aeb-676340d9db13', 'bonang-rembang', 'Desa Wisata Bonang', 'Kabupaten Rembang', 'Kecamatan Bonang', -6.715, 111.416, 'BERKEMBANG', 'Pokdarwis Bonang Maju', '081200000618', 78.5),
('2f1dc8c9-3804-566d-88e1-18608da4c998', 'bulu-rembang', 'Desa Wisata Bulu', 'Kabupaten Rembang', 'Kecamatan Bulu', -6.711, 111.3, 'BERKEMBANG', 'Pokdarwis Bulu Maju', '081200000619', 78.5),
('d8f41363-1a98-5280-8b0e-8180d98487c4', 'candimulyo-rembang', 'Desa Wisata Candimulyo', 'Kabupaten Rembang', 'Kecamatan Candimulyo', -6.707, 111.344, 'BERKEMBANG', 'Pokdarwis Candimulyo Maju', '081200000620', 78.5),
('867286a1-e115-5fcb-83b5-a829c9600a04', 'dadapan-rembang', 'Desa Wisata Dadapan', 'Kabupaten Rembang', 'Kecamatan Dadapan', -6.703, 111.388, 'BERKEMBANG', 'Pokdarwis Dadapan Maju', '081200000621', 78.5),
('c3df7d68-e278-5f9f-8fa5-e563ea5309a9', 'dasun-rembang', 'Desa Wisata Dasun', 'Kabupaten Rembang', 'Kecamatan Dasun', -6.699, 111.272, 'BERKEMBANG', 'Pokdarwis Dasun Maju', '081200000622', 78.5),
('7ed5d6c6-a4cc-5c4b-a2d5-e6e12ba59f19', 'gedongmulyo-rembang', 'Desa Wisata Gedongmulyo', 'Kabupaten Rembang', 'Kecamatan Gedongmulyo', -6.695, 111.316, 'BERKEMBANG', 'Pokdarwis Gedongmulyo Maju', '081200000623', 78.5),
('ea5f4f0e-f5b0-5384-b163-c9e1e068dad0', 'gowak-rembang', 'Desa Wisata Gowak', 'Kabupaten Rembang', 'Kecamatan Gowak', -6.6823, 111.4878, 'BERKEMBANG', 'Pokdarwis Gowak Maju', '081200000624', 78.5),
('0d963462-e6db-5937-8580-e7bf58f62d73', 'kajar-rembang', 'Desa Wisata Kajar', 'Kabupaten Rembang', 'Kecamatan Kajar', -6.687, 111.404, 'BERKEMBANG', 'Pokdarwis Kajar Maju', '081200000625', 78.5),
('f8c8dab9-0667-524a-8edf-a409462c6298', 'karangsari-rembang', 'Desa Wisata Karangsari', 'Kabupaten Rembang', 'Kecamatan Karangsari', -6.7608, 111.3237, 'BERKEMBANG', 'Pokdarwis Karangsari Maju', '081200000626', 78.5),
('c9a375f1-0cc6-542f-8081-8842a2c7e18a', 'karangturi-rembang', 'Desa Wisata Karangturi', 'Kabupaten Rembang', 'Kecamatan Karangturi', -6.7012, 111.4453, 'BERKEMBANG', 'Pokdarwis Karangturi Maju', '081200000627', 78.5),
('d5d33e3c-d271-5e57-b429-99c2d4563eb3', 'karasgede-rembang', 'Desa Wisata Karasgede', 'Kabupaten Rembang', 'Kecamatan Karasgede', -6.675, 111.376, 'BERKEMBANG', 'Pokdarwis Karasgede Maju', '081200000628', 78.5),
('90cc2e00-3165-5ff8-bc01-8f90d63d7e1a', 'ngulahan-rembang', 'Desa Wisata Ngulahan', 'Kabupaten Rembang', 'Kecamatan Ngulahan', -6.7612, 111.5286, 'BERKEMBANG', 'Pokdarwis Ngulahan Maju', '081200000629', 78.5),
('cb900df0-f321-5964-9d49-4cd0dcd17df1', 'pamotan-rembang', 'Desa Wisata Pamotan', 'Kabupaten Rembang', 'Kecamatan Pamotan', -6.7619, 111.4881, 'BERKEMBANG', 'Pokdarwis Pamotan Maju', '081200000630', 78.5),
('9a8ac667-e535-54e2-abe2-dc4255a0ac11', 'panohan-rembang', 'Desa Wisata Panohan', 'Kabupaten Rembang', 'Kecamatan Panohan', -6.8153, 111.4378, 'BERKEMBANG', 'Pokdarwis Panohan Maju', '081200000631', 78.5),
('162d18e0-39fe-550e-a89e-3dc493eb847b', 'pasarbanggi-rembang', 'Desa Wisata Pasarbanggi', 'Kabupaten Rembang', 'Kecamatan Pasarbanggi', -6.659, 111.392, 'BERKEMBANG', 'Pokdarwis Pasarbanggi Maju', '081200000632', 78.5),
('d5afab1f-e95b-55cb-bd2c-6acc62be4728', 'punjulharjo-rembang', 'Desa Wisata Punjulharjo', 'Kabupaten Rembang', 'Kecamatan Punjulharjo', -6.655, 111.276, 'BERKEMBANG', 'Pokdarwis Punjulharjo Maju', '081200000633', 78.5),
('e274c769-b070-533a-ba6c-6cc4874eb772', 'sendangasri-rembang', 'Desa Wisata Sendangasri', 'Kabupaten Rembang', 'Kecamatan Sendangasri', -6.6819, 111.4599, 'BERKEMBANG', 'Pokdarwis Sendangasri Maju', '081200000634', 78.5),
('ad81b1c7-3d6b-599b-b5f0-54a8d9ff5261', 'sudo-rembang', 'Desa Wisata Sudo', 'Kabupaten Rembang', 'Kecamatan Sudo', -6.647, 111.364, 'BERKEMBANG', 'Pokdarwis Sudo Maju', '081200000635', 78.5),
('9f899d2b-fa06-5a28-ba02-90c01de410a0', 'tasikagung-rembang', 'Desa Wisata Tasikagung', 'Kabupaten Rembang', 'Kecamatan Tasikagung', -6.703, 111.3345, 'BERKEMBANG', 'Pokdarwis Tasikagung Maju', '081200000636', 78.5),
('52c8ec13-d2bf-572d-91fd-5d6dcd3af1ed', 'tasikharjo-rembang', 'Desa Wisata Tasikharjo', 'Kabupaten Rembang', 'Kecamatan Tasikharjo', -6.639, 111.292, 'BERKEMBANG', 'Pokdarwis Tasikharjo Maju', '081200000637', 78.5),
('77005a69-06d5-5dfc-884c-b38e45a51608', 'terjan-rembang', 'Desa Wisata Terjan', 'Kabupaten Rembang', 'Kecamatan Terjan', -6.635, 111.336, 'BERKEMBANG', 'Pokdarwis Terjan Maju', '081200000638', 78.5),
('ffd9a331-c65c-556d-8b27-b7de36e372f7', 'tireman-rembang', 'Desa Wisata Tireman', 'Kabupaten Rembang', 'Kecamatan Tireman', -6.631, 111.38, 'BERKEMBANG', 'Pokdarwis Tireman Maju', '081200000639', 78.5),
('11a2fa6a-e192-5522-90d6-1d283a313738', 'tritunggal-rembang', 'Desa Wisata Tritunggal', 'Kabupaten Rembang', 'Kecamatan Tritunggal', -6.787, 111.264, 'BERKEMBANG', 'Pokdarwis Tritunggal Maju', '081200000640', 78.5),
('c1ca61d7-e6c8-507a-8620-3d5f52ceb057', 'tuyuhan-rembang', 'Desa Wisata Tuyuhan', 'Kabupaten Rembang', 'Kecamatan Tuyuhan', -6.783, 111.308, 'BERKEMBANG', 'Pokdarwis Tuyuhan Maju', '081200000641', 78.5),
('96927216-9343-5a38-850b-772cc371d1d0', 'asinan-semarang', 'Desa Wisata Asinan', 'Kabupaten Semarang', 'Kecamatan Asinan', -7.286, 110.445, 'BERKEMBANG', 'Pokdarwis Asinan Maju', '081200000642', 78.5),
('8851aadb-5d0b-5a17-a711-3de085f32a0b', 'banyubiru-semarang', 'Desa Wisata Banyubiru', 'Kabupaten Semarang', 'Kecamatan Banyubiru', -7.282, 110.489, 'BERKEMBANG', 'Pokdarwis Banyubiru Maju', '081200000643', 78.5),
('95bb7243-12f1-5756-8c96-b30864759711', 'banyukuning-semarang', 'Desa Wisata Banyukuning', 'Kabupaten Semarang', 'Bandungan', -7.278, 110.373, 'MAJU', 'Pokdarwis Banyukuning Maju', '081200000644', 85.0),
('fc311f8b-89c3-5371-b53c-6f9694d81cc3', 'batur-semarang', 'Desa Wisata Batur', 'Kabupaten Semarang', 'Kecamatan Batur', -7.274, 110.417, 'BERKEMBANG', 'Pokdarwis Batur Maju', '081200000645', 78.5),
('3fbadfee-8cee-5d52-88ef-d481b7886c3a', 'bejalen-semarang', 'Desa Wisata Bejalen', 'Kabupaten Semarang', 'Kecamatan Bejalen', -7.2747, 110.4144, 'BERKEMBANG', 'Pokdarwis Bejalen Maju', '081200000646', 78.5),
('fa03c886-2bae-5479-b8b6-9fc76d212a05', 'bergas-kidul-semarang', 'Desa Wisata Bergas Kidul', 'Kabupaten Semarang', 'Kecamatan Bergas Kidul', -7.266, 110.505, 'BERKEMBANG', 'Pokdarwis Bergas Kidul Maju', '081200000647', 78.5),
('627639f0-f439-5cd8-81c3-406b2d85b361', 'bergas-lor-semarang', 'Desa Wisata Bergas Lor', 'Kabupaten Semarang', 'Kecamatan Bergas Lor', -7.262, 110.389, 'BERKEMBANG', 'Pokdarwis Bergas Lor Maju', '081200000648', 78.5),
('4692caa6-416f-5911-bebb-2b7bbc7cec3a', 'branjang-semarang', 'Desa Wisata Branjang', 'Kabupaten Semarang', 'Kecamatan Branjang', -7.258, 110.433, 'BERKEMBANG', 'Pokdarwis Branjang Maju', '081200000649', 78.5),
('d89d7026-f797-5ba1-82a0-9077336f1096', 'brongkol-semarang', 'Desa Wisata Brongkol', 'Kabupaten Semarang', 'Kecamatan Brongkol', -7.254, 110.477, 'BERKEMBANG', 'Pokdarwis Brongkol Maju', '081200000650', 78.5),
('7c9e3da1-700b-5992-9e2b-b63b3c47d83c', 'candi-semarang', 'Desa Wisata Candi', 'Kabupaten Semarang', 'Kecamatan Candi', -7.25, 110.361, 'BERKEMBANG', 'Pokdarwis Candi Maju', '081200000651', 78.5),
('8c5d1804-41ad-551b-9be8-7c867512b617', 'candigaron-semarang', 'Desa Wisata Candigaron', 'Kabupaten Semarang', 'Kecamatan Candigaron', -7.2364, 110.2886, 'BERKEMBANG', 'Pokdarwis Candigaron Maju', '081200000652', 78.5),
('12f23c23-2395-51c3-b5e4-05100c49b8a4', 'candirejo-semarang', 'Desa Wisata Candirejo', 'Kabupaten Semarang', 'Kecamatan Candirejo', -7.339, 109.9331, 'BERKEMBANG', 'Pokdarwis Candirejo Maju', '081200000653', 78.5),
('1af02b4f-2fb8-5f89-9ed7-e24127a71167', 'derekan-semarang', 'Desa Wisata Derekan', 'Kabupaten Semarang', 'Kecamatan Derekan', -7.238, 110.493, 'BERKEMBANG', 'Pokdarwis Derekan Maju', '081200000654', 78.5),
('999508f8-08fe-51d7-97b1-1fe77da8e421', 'diwak-semarang', 'Desa Wisata Diwak', 'Kabupaten Semarang', 'Kecamatan Diwak', -7.234, 110.377, 'BERKEMBANG', 'Pokdarwis Diwak Maju', '081200000655', 78.5),
('bcad78c8-de3b-52ac-a2e5-10ea9af480b1', 'doplang-semarang', 'Desa Wisata Doplang', 'Kabupaten Semarang', 'Kecamatan Doplang', -7.5836, 110.6569, 'BERKEMBANG', 'Pokdarwis Doplang Maju', '081200000656', 78.5),
('07e297e0-4135-5e13-a3ec-9ee9720cf3c4', 'duren-semarang', 'Desa Wisata Duren', 'Kabupaten Semarang', 'Kecamatan Duren', -7.226, 110.465, 'BERKEMBANG', 'Pokdarwis Duren Maju', '081200000657', 78.5),
('39c98567-5bc6-5e3f-a268-f5552bdea004', 'gedong-semarang', 'Desa Wisata Gedong', 'Kabupaten Semarang', 'Kecamatan Gedong', -7.222, 110.509, 'BERKEMBANG', 'Pokdarwis Gedong Maju', '081200000658', 78.5),
('eb1b835f-e55f-52b3-933b-9830d6769d45', 'gemawang-semarang', 'Desa Wisata Gemawang', 'Kabupaten Semarang', 'Kecamatan Gemawang', -7.218, 110.393, 'BERKEMBANG', 'Pokdarwis Gemawang Maju', '081200000659', 78.5),
('c95a0958-2a70-5fd1-91d0-d36178bb9048', 'gendangan-semarang', 'Desa Wisata Gendangan', 'Kabupaten Semarang', 'Kecamatan Gendangan', -7.214, 110.437, 'BERKEMBANG', 'Pokdarwis Gendangan Maju', '081200000660', 78.5),
('e0fed841-ebab-52ba-9acf-93e74e18a506', 'genting-semarang', 'Desa Wisata Genting', 'Kabupaten Semarang', 'Kecamatan Genting', -7.21, 110.481, 'BERKEMBANG', 'Pokdarwis Genting Maju', '081200000661', 78.5),
('730a2421-fe5e-55fe-b900-56a5fcefacaf', 'gogik-semarang', 'Desa Wisata Gogik', 'Kabupaten Semarang', 'Kecamatan Gogik', -7.206, 110.365, 'BERKEMBANG', 'Pokdarwis Gogik Maju', '081200000662', 78.5),
('5560e58e-646d-5ef5-9b69-80e363bdea85', 'gogodalem-semarang', 'Desa Wisata Gogodalem', 'Kabupaten Semarang', 'Kecamatan Gogodalem', -7.202, 110.409, 'BERKEMBANG', 'Pokdarwis Gogodalem Maju', '081200000663', 78.5),
('4dc15711-dfce-5bc7-a10c-07d2f6a5ab7a', 'jatijajar-semarang', 'Desa Wisata Jatijajar', 'Kabupaten Semarang', 'Bergas', -7.198, 110.453, 'MAJU', 'Pokdarwis Jatijajar Maju', '081200000664', 85.0),
('b1fcf69b-91a2-5b79-9334-4450843efd00', 'jatirunggo-semarang', 'Desa Wisata Jatirunggo', 'Kabupaten Semarang', 'Kecamatan Jatirunggo', -7.2036, 110.4886, 'BERKEMBANG', 'Pokdarwis Jatirunggo Maju', '081200000665', 78.5),
('cdcb0341-6490-586b-8663-5741af947893', 'jembrak-semarang', 'Desa Wisata Jembrak', 'Kabupaten Semarang', 'Kecamatan Jembrak', -7.19, 110.381, 'BERKEMBANG', 'Pokdarwis Jembrak Maju', '081200000666', 78.5),
('6d9ddc16-e7cf-551b-8507-08f9c16ede38', 'kadirejo-semarang', 'Desa Wisata Kadirejo', 'Kabupaten Semarang', 'Pabelan', -7.186, 110.425, 'MAJU', 'Pokdarwis Kadirejo Maju', '081200000667', 85.0),
('1f984f4d-5930-56e6-965c-fa409425291b', 'kalisidi-semarang', 'Desa Wisata Kalisidi', 'Kabupaten Semarang', 'Ungaran Barat', -7.182, 110.469, 'MAJU', 'Pokdarwis Kalisidi Maju', '081200000668', 85.0),
('cc08a74e-be9d-533e-bdfc-a1b443f9ea2f', 'kalongan-semarang', 'Desa Wisata Kalongan', 'Kabupaten Semarang', 'Kecamatan Kalongan', -7.178, 110.513, 'BERKEMBANG', 'Pokdarwis Kalongan Maju', '081200000669', 78.5),
('ff2d563a-124f-5d9a-ab98-ccdd008e4958', 'kampung-genuk-indah-semarang', 'Desa Wisata Kampung  Genuk Indah', 'Kabupaten Semarang', 'Kecamatan Kampung  Genuk Indah', -7.174, 110.397, 'BERKEMBANG', 'Pokdarwis Kampung  Genuk Indah Maju', '081200000670', 78.5),
('23427ceb-4266-56fc-b34c-9dde113bbb5e', 'kampung-kluwihan-semarang', 'Desa Wisata Kampung  Kluwihan', 'Kabupaten Semarang', 'Kecamatan Kampung  Kluwihan', -7.17, 110.441, 'BERKEMBANG', 'Pokdarwis Kampung  Kluwihan Maju', '081200000671', 78.5),
('3ad4ef17-33a5-5cf4-ac7a-02a9cf4b9878', 'kampung-winongsari-semarang', 'Desa Wisata Kampung  Winongsari', 'Kabupaten Semarang', 'Kecamatan Kampung  Winongsari', -7.166, 110.485, 'BERKEMBANG', 'Pokdarwis Kampung  Winongsari Maju', '081200000672', 78.5),
('8aa6b1d2-b6ac-5125-b05f-3166a5a12c6e', 'kebondowo-semarang', 'Desa Wisata Kebondowo', 'Kabupaten Semarang', 'Kecamatan Kebondowo', -7.162, 110.369, 'BERKEMBANG', 'Pokdarwis Kebondowo Maju', '081200000673', 78.5),
('d9dd109d-8bd4-52de-91e7-bab565537420', 'keji-semarang', 'Desa Wisata Keji', 'Kabupaten Semarang', 'Kecamatan Keji', -7.158, 110.413, 'BERKEMBANG', 'Pokdarwis Keji Maju', '081200000674', 78.5),
('b1c5fc7d-0bf5-5431-bdc3-b092d632d041', 'kelurahan-semarang', 'Desa Wisata Kelurahan', 'Kabupaten Semarang', 'Jambu', -7.154, 110.457, 'MAJU', 'Pokdarwis Kelurahan Maju', '081200000675', 85.0),
('6ca64dde-7140-516a-b480-a781c6d312f5', 'kemambang-semarang', 'Desa Wisata Kemambang', 'Kabupaten Semarang', 'Banyubiru', -7.15, 110.501, 'MAJU', 'Pokdarwis Kemambang Maju', '081200000676', 85.0),
('c3eba5bd-bf5e-56bc-bcbf-27b7191e3e19', 'kemawi-semarang', 'Desa Wisata Kemawi', 'Kabupaten Semarang', 'Kecamatan Kemawi', -7.146, 110.385, 'BERKEMBANG', 'Pokdarwis Kemawi Maju', '081200000677', 78.5),
('39782489-eccf-5c24-a551-b0cd79e1f9c5', 'kemetul-semarang', 'Desa Wisata Kemetul', 'Kabupaten Semarang', 'Kecamatan Kemetul', -7.142, 110.429, 'BERKEMBANG', 'Pokdarwis Kemetul Maju', '081200000678', 78.5),
('6dd6168c-d5f5-5246-a57e-c39d52410f24', 'kenteng-semarang', 'Desa Wisata Kenteng', 'Kabupaten Semarang', 'Kecamatan Kenteng', -7.138, 110.473, 'BERKEMBANG', 'Pokdarwis Kenteng Maju', '081200000679', 78.5),
('b5695d3f-800e-59c8-8477-cd5b6e0f77af', 'keseneng-semarang', 'Desa Wisata Keseneng', 'Kabupaten Semarang', 'Kecamatan Keseneng', -7.294, 110.357, 'BERKEMBANG', 'Pokdarwis Keseneng Maju', '081200000680', 78.5),
('b28832c1-ec8d-53ce-86ed-00cec728e44c', 'klepu-semarang', 'Desa Wisata Klepu', 'Kabupaten Semarang', 'Kecamatan Klepu', -7.29, 110.401, 'BERKEMBANG', 'Pokdarwis Klepu Maju', '081200000681', 78.5),
('7190e43f-b323-552d-a9ea-2affae1d99a1', 'kopeng-semarang', 'Desa Wisata Kopeng', 'Kabupaten Semarang', 'Kecamatan Kopeng', -7.286, 110.445, 'BERKEMBANG', 'Pokdarwis Kopeng Maju', '081200000682', 78.5),
('5a140d58-5d4c-5a26-bc3e-3572fe747515', 'lembah-kendali-sobe-semarang', 'Desa Wisata Lembah Kendali Sobe', 'Kabupaten Semarang', 'Kecamatan Lembah Kendali Sobe', -7.282, 110.489, 'BERKEMBANG', 'Pokdarwis Lembah Kendali Sobe Maju', '081200000683', 78.5),
('a0000000-0000-0000-0000-000000000007', 'lerep-semarang', 'Desa Wisata Lerep', 'Kabupaten Semarang', 'Kecamatan Lerep', -7.278, 110.373, 'BERKEMBANG', 'Pokdarwis Lerep Maju', '081200000684', 78.5),
('601986ba-9c61-56bc-bf7a-58f72bc4e34d', 'losari-semarang', 'Desa Wisata Losari', 'Kabupaten Semarang', 'Kecamatan Losari', -7.274, 110.417, 'BERKEMBANG', 'Pokdarwis Losari Maju', '081200000685', 78.5),
('37f03d35-c426-5e30-b595-b2d04c725d6e', 'menari-ngrawan-semarang', 'Desa Wisata Menari Ngrawan', 'Kabupaten Semarang', 'Kecamatan Menari Ngrawan', -7.27, 110.461, 'BERKEMBANG', 'Pokdarwis Menari Ngrawan Maju', '081200000686', 78.5),
('d13440eb-0935-56d4-b665-74671e8218db', 'muncar-semarang', 'Desa Wisata Muncar', 'Kabupaten Semarang', 'Kecamatan Muncar', -7.266, 110.505, 'BERKEMBANG', 'Pokdarwis Muncar Maju', '081200000687', 78.5),
('1b26b741-d9b6-5584-b189-c9257f35a42f', 'munding-semarang', 'Desa Wisata Munding', 'Kabupaten Semarang', 'Kecamatan Munding', -7.262, 110.389, 'BERKEMBANG', 'Pokdarwis Munding Maju', '081200000688', 78.5),
('cbae7adf-71ae-5ba5-afba-136b88c23767', 'ngempon-semarang', 'Desa Wisata Ngempon', 'Kabupaten Semarang', 'Kecamatan Ngempon', -7.258, 110.433, 'BERKEMBANG', 'Pokdarwis Ngempon Maju', '081200000689', 78.5),
('e9d0c314-c72b-5ed8-8e23-2381c01a39ae', 'nogosaren-semarang', 'Desa Wisata Nogosaren', 'Kabupaten Semarang', 'Kecamatan Nogosaren', -7.3581, 110.4208, 'BERKEMBANG', 'Pokdarwis Nogosaren Maju', '081200000690', 78.5),
('cabf53ba-8e46-5890-ac96-42a8158634d4', 'nyatnyono-semarang', 'Desa Wisata Nyatnyono', 'Kabupaten Semarang', 'Kecamatan Nyatnyono', -7.25, 110.361, 'BERKEMBANG', 'Pokdarwis Nyatnyono Maju', '081200000691', 78.5),
('5c4ec42c-b8c6-5e4b-a464-c9ac5875ba23', 'nyemoh-semarang', 'Desa Wisata Nyemoh', 'Kabupaten Semarang', 'Kecamatan Nyemoh', -7.246, 110.405, 'BERKEMBANG', 'Pokdarwis Nyemoh Maju', '081200000692', 78.5),
('1ae935a9-dd16-5d0c-93f7-79037adc0f46', 'pagersari-semarang', 'Desa Wisata Pagersari', 'Kabupaten Semarang', 'Bergas', -7.242, 110.449, 'MAJU', 'Pokdarwis Pagersari Maju', '081200000693', 85.0),
('ad4e89d9-6ddf-59b9-ac9a-fc67381bd0db', 'pasekan-semarang', 'Desa Wisata Pasekan', 'Kabupaten Semarang', 'Kecamatan Pasekan', -7.238, 110.493, 'BERKEMBANG', 'Pokdarwis Pasekan Maju', '081200000694', 78.5),
('2e5b0d23-807a-59f5-9992-0420a8afdc3c', 'petemon-semarang', 'Desa Wisata Petemon', 'Kabupaten Semarang', 'Kecamatan Petemon', -7.234, 110.377, 'BERKEMBANG', 'Pokdarwis Petemon Maju', '081200000695', 78.5),
('2866ebf3-b74e-5287-9ac1-986df5b812a3', 'plumutan-semarang', 'Desa Wisata Plumutan', 'Kabupaten Semarang', 'Kecamatan Plumutan', -7.23, 110.421, 'BERKEMBANG', 'Pokdarwis Plumutan Maju', '081200000696', 78.5),
('6d99dfc3-b26b-548b-8162-42066274e805', 'polobogo-semarang', 'Desa Wisata Polobogo', 'Kabupaten Semarang', 'Getasan', -7.226, 110.465, 'MAJU', 'Pokdarwis Polobogo Maju', '081200000697', 85.0),
('5f5bbdd8-3769-554b-8c42-7c2ddc743d43', 'poncoruso-semarang', 'Desa Wisata Poncoruso', 'Kabupaten Semarang', 'Kecamatan Poncoruso', -7.2092, 110.4103, 'BERKEMBANG', 'Pokdarwis Poncoruso Maju', '081200000698', 78.5),
('32613795-22b1-58e4-aa68-ece705e15909', 'pringsari-semarang', 'Desa Wisata Pringsari', 'Kabupaten Semarang', 'Pringapus', -7.218, 110.393, 'MAJU', 'Pokdarwis Pringsari Maju', '081200000699', 85.0),
('89d945f4-0cfe-5fd3-abb1-080abf37c45a', 'rembes-semarang', 'Desa Wisata Rembes', 'Kabupaten Semarang', 'Kecamatan Rembes', -7.214, 110.437, 'BERKEMBANG', 'Pokdarwis Rembes Maju', '081200000700', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('c1636080-46cf-533c-9462-d3e43d22b51b', 'rowoboni-semarang', 'Desa Wisata Rowoboni', 'Kabupaten Semarang', 'Kecamatan Rowoboni', -7.3122, 110.4231, 'BERKEMBANG', 'Pokdarwis Rowoboni Maju', '081200000701', 78.5),
('780061ad-a43e-5a3e-9f23-2b6f4e2943c1', 'samban-semarang', 'Desa Wisata Samban', 'Kabupaten Semarang', 'Kecamatan Samban', -7.206, 110.365, 'BERKEMBANG', 'Pokdarwis Samban Maju', '081200000702', 78.5),
('396f5120-00e7-5af8-a0f2-77fe1328cf7c', 'sambirejo-semarang', 'Desa Wisata Sambirejo', 'Kabupaten Semarang', 'Bringin', -7.202, 110.409, 'MAJU', 'Pokdarwis Sambirejo Maju', '081200000703', 85.0),
('b96ad9ba-e241-59a7-b1f1-3c8529bc66ea', 'samirono-semarang', 'Desa Wisata Samirono', 'Kabupaten Semarang', 'Kecamatan Samirono', -7.198, 110.453, 'BERKEMBANG', 'Pokdarwis Samirono Maju', '081200000704', 78.5),
('96a8f105-10b0-5f98-b563-5e7a45e20eee', 'sepakung-semarang', 'Desa Wisata Sepakung', 'Kabupaten Semarang', 'Kecamatan Sepakung', -7.194, 110.497, 'BERKEMBANG', 'Pokdarwis Sepakung Maju', '081200000705', 78.5),
('95bde9bd-b57d-5897-9c16-042fca82957f', 'sidomukti-semarang', 'Desa Wisata Sidomukti', 'Kabupaten Semarang', 'Kecamatan Sidomukti', -7.19, 110.381, 'BERKEMBANG', 'Pokdarwis Sidomukti Maju', '081200000706', 78.5),
('17f539ba-f145-5ee3-9a11-fc6e41b66087', 'sukorejo-semarang', 'Desa Wisata Sukorejo', 'Kabupaten Semarang', 'Suruh', -7.186, 110.425, 'MAJU', 'Pokdarwis Sukorejo Maju', '081200000707', 85.0),
('c3c177ae-af79-5fa4-9ab6-54f6393e17b1', 'sumogawe-semarang', 'Desa Wisata Sumogawe', 'Kabupaten Semarang', 'Kecamatan Sumogawe', -7.182, 110.469, 'BERKEMBANG', 'Pokdarwis Sumogawe Maju', '081200000708', 78.5),
('275b205f-9b0b-53ce-89ed-225e1f0bb762', 'tajuk-semarang', 'Desa Wisata Tajuk', 'Kabupaten Semarang', 'Kecamatan Tajuk', -7.178, 110.513, 'BERKEMBANG', 'Pokdarwis Tajuk Maju', '081200000709', 78.5),
('ff9c3058-af0a-5528-ae72-af24c7f30440', 'tawang-semarang', 'Desa Wisata Tawang', 'Kabupaten Semarang', 'Kecamatan Tawang', -7.174, 110.397, 'BERKEMBANG', 'Pokdarwis Tawang Maju', '081200000710', 78.5),
('fe3f6bbe-eb63-5e89-9319-092637eae9bb', 'tegalwaton-semarang', 'Desa Wisata Tegalwaton', 'Kabupaten Semarang', 'Kecamatan Tegalwaton', -7.17, 110.441, 'BERKEMBANG', 'Pokdarwis Tegalwaton Maju', '081200000711', 78.5),
('077cf982-5efa-5c94-95c8-9fe2e19bfe5d', 'timpik-semarang', 'Desa Wisata Timpik', 'Kabupaten Semarang', 'Susukan', -7.166, 110.485, 'MAJU', 'Pokdarwis Timpik Maju', '081200000712', 85.0),
('77789427-dbff-5d5d-8e2e-d45cc7191a26', 'ujung-ujung-semarang', 'Desa Wisata Ujung-Ujung', 'Kabupaten Semarang', 'Kecamatan Ujung-Ujung', -7.162, 110.369, 'BERKEMBANG', 'Pokdarwis Ujung-Ujung Maju', '081200000713', 78.5),
('69b0e2f8-00b9-5a81-a1d4-eff5dce10c48', 'wiata-kawasan-produksi-widuri-semarang', 'Desa Wisata Wiata Kawasan Produksi Widuri', 'Kabupaten Semarang', 'Kecamatan Wiata Kawasan Produksi Widuri', -7.158, 110.413, 'BERKEMBANG', 'Pokdarwis Wiata Kawasan Produksi Widuri Maju', '081200000714', 78.5),
('236d8d62-fb83-5c9d-9741-09b441521160', 'wirogomo-semarang', 'Desa Wisata Wirogomo', 'Kabupaten Semarang', 'Kecamatan Wirogomo', -7.154, 110.457, 'BERKEMBANG', 'Pokdarwis Wirogomo Maju', '081200000715', 78.5),
('2b9b8083-bef2-5b82-988c-15aeb7fde195', 'karungan-sragen', 'Desa Wisata Karungan', 'Kabupaten Sragen', 'Plupuh', -7.362, 111.086, 'MAJU', 'Pokdarwis Karungan Maju', '081200000716', 85.0),
('ef594998-82bf-5a2f-ae19-e10ddf8b0bfc', 'kliwonan-sragen', 'Desa Wisata Kliwonan', 'Kabupaten Sragen', 'Kecamatan Kliwonan', -7.358, 110.97, 'BERKEMBANG', 'Pokdarwis Kliwonan Maju', '081200000717', 78.5),
('4952f8e1-dc4f-5275-88ef-7d4918bcd359', 'krikilan-sragen', 'Desa Wisata Krikilan', 'Kabupaten Sragen', 'Kecamatan Krikilan', -7.4556, 110.8342, 'BERKEMBANG', 'Pokdarwis Krikilan Maju', '081200000718', 78.5),
('b66ee897-d866-5e7c-a5ee-fda84014ba48', 'pilangsari-sragen', 'Desa Wisata Pilangsari', 'Kabupaten Sragen', 'Kecamatan Pilangsari', -7.35, 111.058, 'BERKEMBANG', 'Pokdarwis Pilangsari Maju', '081200000719', 78.5),
('20e1e7eb-a63e-5bf2-bfa5-1111c8df768f', 'sendang-kun-gerit-sragen', 'Desa Wisata Sendang Kun Gerit', 'Kabupaten Sragen', 'Kecamatan Sendang Kun Gerit', -7.506, 110.942, 'BERKEMBANG', 'Pokdarwis Sendang Kun Gerit Maju', '081200000720', 78.5),
('d83329dc-7f39-5339-b98d-312fd8fbde14', 'sukorejo-sragen', 'Desa Wisata Sukorejo', 'Kabupaten Sragen', 'Kecamatan Sukorejo', -7.502, 110.986, 'BERKEMBANG', 'Pokdarwis Sukorejo Maju', '081200000721', 78.5),
('c3039241-f4d3-557e-9647-a6a621951722', 'bakalan-sukoharjo', 'Desa Wisata Bakalan', 'Kabupaten Sukoharjo', 'Kecamatan Bakalan', -7.6398, 110.8677, 'BERKEMBANG', 'Pokdarwis Bakalan Maju', '081200000722', 78.5),
('b7b79752-d2de-5b8d-8983-9959fa7501d9', 'cangkol-sukoharjo', 'Desa Wisata Cangkol', 'Kabupaten Sukoharjo', 'Kecamatan Cangkol', -7.751, 110.887, 'BERKEMBANG', 'Pokdarwis Cangkol Maju', '081200000723', 78.5),
('e44493a0-a0b9-5a29-8515-8c9a76f0bf2c', 'gentan-geopark-village-sukoharjo', 'Desa Wisata Gentan Geopark Village', 'Kabupaten Sukoharjo', 'Kecamatan Gentan Geopark Village', -7.747, 110.771, 'BERKEMBANG', 'Pokdarwis Gentan Geopark Village Maju', '081200000724', 78.5),
('81d4022f-f4ff-5dad-8829-47c1f6b9e9c6', 'gupit-sukoharjo', 'Desa Wisata Gupit', 'Kabupaten Sukoharjo', 'Kecamatan Gupit', -7.743, 110.815, 'BERKEMBANG', 'Pokdarwis Gupit Maju', '081200000725', 78.5),
('5ddf4836-5058-5f98-97ff-873858d22c61', 'jangglengan-sukoharjo', 'Desa Wisata Jangglengan', 'Kabupaten Sukoharjo', 'Kecamatan Jangglengan', -7.739, 110.859, 'BERKEMBANG', 'Pokdarwis Jangglengan Maju', '081200000726', 78.5),
('2eb70bd0-f137-5819-b3b4-85cb0873f845', 'juron-sendang-sumrup-sukoharjo', 'Desa Wisata Juron "Sendang Sumrup"', 'Kabupaten Sukoharjo', 'Kecamatan Juron "Sendang Sumrup"', -7.735, 110.903, 'BERKEMBANG', 'Pokdarwis Juron "Sendang Sumrup" Maju', '081200000727', 78.5),
('7e2931f4-cc58-5a0a-958b-3cd1e35a03b7', 'karangasem-sukoharjo', 'Desa Wisata Karangasem', 'Kabupaten Sukoharjo', 'Bulu', -7.8041, 110.6955, 'MAJU', 'Pokdarwis Karangasem Maju', '081200000728', 85.0),
('b092f5a8-4ba5-5c65-8a8c-f4c870568825', 'kayuapak-sukoharjo', 'Desa Wisata Kayuapak', 'Kabupaten Sukoharjo', 'Kecamatan Kayuapak', -7.727, 110.831, 'BERKEMBANG', 'Pokdarwis Kayuapak Maju', '081200000729', 78.5),
('f84ab8c9-d6da-5a91-9792-0e2038910690', 'kedungjambal-sukoharjo', 'Desa Wisata Kedungjambal', 'Kabupaten Sukoharjo', 'Kecamatan Kedungjambal', -7.723, 110.875, 'BERKEMBANG', 'Pokdarwis Kedungjambal Maju', '081200000730', 78.5),
('f12cb567-4707-54bd-bd97-fa6270655331', 'kreatif-kenep-sukoharjo', 'Desa Wisata Kreatif Kenep', 'Kabupaten Sukoharjo', 'Kecamatan Kreatif Kenep', -7.719, 110.759, 'BERKEMBANG', 'Pokdarwis Kreatif Kenep Maju', '081200000731', 78.5),
('abceb71d-44ca-5208-817b-043259ede084', 'laban-sukoharjo', 'Desa Wisata Laban', 'Kabupaten Sukoharjo', 'Kecamatan Laban', -7.6006, 110.8472, 'BERKEMBANG', 'Pokdarwis Laban Maju', '081200000732', 78.5),
('4b62c1a7-7783-5ca3-914c-5a8ac979372b', 'mulur-sukoharjo', 'Desa Wisata Mulur', 'Kabupaten Sukoharjo', 'Kecamatan Mulur', -7.711, 110.847, 'BERKEMBANG', 'Pokdarwis Mulur Maju', '081200000733', 78.5),
('65c5adba-d028-5ba2-b8db-eda07298a242', 'ngrombo-kuncoro-sukoharjo', 'Desa Wisata Ngrombo Kuncoro', 'Kabupaten Sukoharjo', 'Kecamatan Ngrombo Kuncoro', -7.707, 110.891, 'BERKEMBANG', 'Pokdarwis Ngrombo Kuncoro Maju', '081200000734', 78.5),
('5cdf2301-4d7f-5bd3-b9d6-668fb5749c9f', 'pengkol-sukoharjo', 'Desa Wisata Pengkol', 'Kabupaten Sukoharjo', 'Kecamatan Pengkol', -7.75, 110.9065, 'BERKEMBANG', 'Pokdarwis Pengkol Maju', '081200000735', 78.5),
('10d551bf-bff8-5308-9009-9d5d6fe56bce', 'plesan-sukoharjo', 'Desa Wisata Plesan', 'Kabupaten Sukoharjo', 'Kecamatan Plesan', -7.699, 110.819, 'BERKEMBANG', 'Pokdarwis Plesan Maju', '081200000736', 78.5),
('0a09899a-8fba-5d06-a387-8f2265c8a110', 'pojok-selo-beraksi-sukoharjo', 'Desa Wisata Pojok "Selo Beraksi"', 'Kabupaten Sukoharjo', 'Kecamatan Pojok "Selo Beraksi"', -7.695, 110.863, 'BERKEMBANG', 'Pokdarwis Pojok "Selo Beraksi" Maju', '081200000737', 78.5),
('8a0f46e8-43be-5261-8a0e-6123879cca9b', 'rotan-trangsan-sukoharjo', 'Desa Wisata Rotan Trangsan', 'Kabupaten Sukoharjo', 'Kecamatan Rotan Trangsan', -7.691, 110.907, 'BERKEMBANG', 'Pokdarwis Rotan Trangsan Maju', '081200000738', 78.5),
('54a69ec0-c323-5b45-87ee-6534b1e54647', 'tiyaran-sukoharjo', 'Desa Wisata Tiyaran', 'Kabupaten Sukoharjo', 'Kecamatan Tiyaran', -7.7734, 110.8537, 'BERKEMBANG', 'Pokdarwis Tiyaran Maju', '081200000739', 78.5),
('c047163b-a41e-5c20-b70f-a425c5ca8413', 'watubonang-sukoharjo', 'Desa Wisata Watubonang', 'Kabupaten Sukoharjo', 'Kecamatan Watubonang', -7.7468, 110.7677, 'BERKEMBANG', 'Pokdarwis Watubonang Maju', '081200000740', 78.5),
('5a58f68f-3346-52bf-9343-2c0a2e61de7c', 'wirun-sukoharjo', 'Desa Wisata Wirun', 'Kabupaten Sukoharjo', 'Kecamatan Wirun', -7.679, 110.879, 'BERKEMBANG', 'Pokdarwis Wirun Maju', '081200000741', 78.5),
('4b84216e-886e-5e7b-b3d1-9765ebd58e45', 'batuagung-tegal', 'Desa Wisata Batuagung', 'Kabupaten Tegal', 'Kecamatan Batuagung', -7.0972, 109.093, 'BERKEMBANG', 'Pokdarwis Batuagung Maju', '081200000742', 78.5),
('01b52e9f-0158-54a2-9889-b82259aebc97', 'bukateja-tegal', 'Desa Wisata Bukateja', 'Kabupaten Tegal', 'Kecamatan Bukateja', -6.971, 109.113, 'BERKEMBANG', 'Pokdarwis Bukateja Maju', '081200000743', 78.5),
('600b1a27-11b9-513a-968b-4de2ef14a65f', 'cempaka-tegal', 'Desa Wisata Cempaka', 'Kabupaten Tegal', 'Kecamatan Cempaka', -6.967, 109.157, 'BERKEMBANG', 'Pokdarwis Cempaka Maju', '081200000744', 78.5),
('2512997b-561b-58b1-8a76-85e30f2a7459', 'cikura-tegal', 'Desa Wisata Cikura', 'Kabupaten Tegal', 'Kecamatan Cikura', -6.963, 109.201, 'BERKEMBANG', 'Pokdarwis Cikura Maju', '081200000745', 78.5),
('e876ff7c-0924-5d79-81bf-f5860a229770', 'danawarih-tegal', 'Desa Wisata Danawarih', 'Kabupaten Tegal', 'Kecamatan Danawarih', -6.959, 109.085, 'BERKEMBANG', 'Pokdarwis Danawarih Maju', '081200000746', 78.5),
('ca473fc9-b357-57c9-95f9-014717c27322', 'dukuhbenda-tegal', 'Desa Wisata Dukuhbenda', 'Kabupaten Tegal', 'Kecamatan Dukuhbenda', -7.2001, 109.1066, 'BERKEMBANG', 'Pokdarwis Dukuhbenda Maju', '081200000747', 78.5),
('5b1fa363-4f95-5109-bd9b-a7f042617954', 'jejeg-tegal', 'Desa Wisata Jejeg', 'Kabupaten Tegal', 'Kecamatan Jejeg', -7.1665, 109.0921, 'BERKEMBANG', 'Pokdarwis Jejeg Maju', '081200000748', 78.5),
('63306299-4510-5ef8-b83b-f6d424864e43', 'kalibakung-tegal', 'Desa Wisata Kalibakung', 'Kabupaten Tegal', 'Kecamatan Kalibakung', -7.0999, 109.1363, 'BERKEMBANG', 'Pokdarwis Kalibakung Maju', '081200000749', 78.5),
('d9b89ca3-ea38-544c-984f-4328914f8054', 'kaligayam-tegal', 'Desa Wisata Kaligayam', 'Kabupaten Tegal', 'Kecamatan Kaligayam', -6.943, 109.101, 'BERKEMBANG', 'Pokdarwis Kaligayam Maju', '081200000750', 78.5),
('b15c5c44-139c-50a4-9235-0492e228a254', 'kalisoka-tegal', 'Desa Wisata Kalisoka', 'Kabupaten Tegal', 'Kecamatan Kalisoka', -6.955, 109.1155, 'BERKEMBANG', 'Pokdarwis Kalisoka Maju', '081200000751', 78.5),
('fd0cf47b-2baa-5fa8-b89a-6b7a6fc01527', 'muncanglarang-tegal', 'Desa Wisata Muncanglarang', 'Kabupaten Tegal', 'Kecamatan Muncanglarang', -6.935, 109.189, 'BERKEMBANG', 'Pokdarwis Muncanglarang Maju', '081200000752', 78.5),
('6a94497d-6307-5d7b-8ff4-4765a48434b2', 'munjungagung-tegal', 'Desa Wisata Munjungagung', 'Kabupaten Tegal', 'Kecamatan Munjungagung', -6.931, 109.073, 'BERKEMBANG', 'Pokdarwis Munjungagung Maju', '081200000753', 78.5),
('833a773f-cdc3-5189-a8cc-4484886bd3bc', 'pagerwangi-tegal', 'Desa Wisata Pagerwangi', 'Kabupaten Tegal', 'Kecamatan Pagerwangi', -6.927, 109.117, 'BERKEMBANG', 'Pokdarwis Pagerwangi Maju', '081200000754', 78.5),
('244bd235-7bc3-5298-bf35-93177a9bf834', 'panusupan-tegal', 'Desa Wisata Panusupan', 'Kabupaten Tegal', 'Kecamatan Panusupan', -6.923, 109.161, 'BERKEMBANG', 'Pokdarwis Panusupan Maju', '081200000755', 78.5),
('91dde650-7b9f-50e9-a99e-ebf6f6952377', 'rembul-tegal', 'Desa Wisata Rembul', 'Kabupaten Tegal', 'Kecamatan Rembul', -6.919, 109.205, 'BERKEMBANG', 'Pokdarwis Rembul Maju', '081200000756', 78.5),
('65ee3a88-bf95-5595-ad04-e39243be4d8f', 'sigedong-tegal', 'Desa Wisata Sigedong', 'Kabupaten Tegal', 'Kecamatan Sigedong', -6.915, 109.089, 'BERKEMBANG', 'Pokdarwis Sigedong Maju', '081200000757', 78.5),
('31f3a7ef-56b0-5370-9d56-fcd9f3dd304a', 'tuwel-tegal', 'Desa Wisata Tuwel', 'Kabupaten Tegal', 'Kecamatan Tuwel', -6.911, 109.133, 'BERKEMBANG', 'Pokdarwis Tuwel Maju', '081200000758', 78.5),
('8c474fb7-77e4-5f15-bc2c-b03ff77204ee', 'wangandawa-tegal', 'Desa Wisata Wangandawa', 'Kabupaten Tegal', 'Kecamatan Wangandawa', -6.907, 109.177, 'BERKEMBANG', 'Pokdarwis Wangandawa Maju', '081200000759', 78.5),
('532a4307-7897-5809-95e1-0acfc7072caa', 'bansari-temanggung', 'Desa Wisata Bansari', 'Kabupaten Temanggung', 'Kecamatan Bansari', -7.396, 110.096, 'BERKEMBANG', 'Pokdarwis Bansari Maju', '081200000760', 78.5),
('eb9cc3ce-07f3-5a68-9ff6-87f4d5495567', 'banyu-suci-temanggung', 'Desa Wisata Banyu Suci', 'Kabupaten Temanggung', 'Kecamatan Banyu Suci', -7.392, 110.14, 'BERKEMBANG', 'Pokdarwis Banyu Suci Maju', '081200000761', 78.5),
('bec2b159-4d55-5232-ad5a-cb7b24f8fcd7', 'bumi-makukuhan-temanggung', 'Desa Wisata Bumi Makukuhan', 'Kabupaten Temanggung', 'Kecamatan Bumi Makukuhan', -7.388, 110.184, 'BERKEMBANG', 'Pokdarwis Bumi Makukuhan Maju', '081200000762', 78.5),
('412f0561-8c92-5ed6-ac0a-5d97a8b47708', 'cepag-temanggung', 'Desa Wisata Cepag', 'Kabupaten Temanggung', 'Kecamatan Cepag', -7.384, 110.228, 'BERKEMBANG', 'Pokdarwis Cepag Maju', '081200000763', 78.5),
('4edf6d38-2f82-58aa-a320-3b36bb1f672a', 'curug-surodipo-temanggung', 'Desa Wisata Curug Surodipo', 'Kabupaten Temanggung', 'Kecamatan Curug Surodipo', -7.38, 110.112, 'BERKEMBANG', 'Pokdarwis Curug Surodipo Maju', '081200000764', 78.5),
('fcc27236-f81a-562d-bca5-4227554f7939', 'dewi-era-maya-temanggung', 'Desa Wisata Dewi Era Maya', 'Kabupaten Temanggung', 'Kecamatan Dewi Era Maya', -7.376, 110.156, 'BERKEMBANG', 'Pokdarwis Dewi Era Maya Maju', '081200000765', 78.5),
('e4930f11-a094-5246-baf9-e9995d1752ad', 'gedongsari-temanggung', 'Desa Wisata Gedongsari', 'Kabupaten Temanggung', 'Kecamatan Gedongsari', -7.372, 110.2, 'BERKEMBANG', 'Pokdarwis Gedongsari Maju', '081200000766', 78.5),
('71ff4ab5-9d76-510e-b9ff-31990f3db710', 'giripurno-temanggung', 'Desa Wisata Giripurno', 'Kabupaten Temanggung', 'Ngadirejo', -7.368, 110.244, 'MAJU', 'Pokdarwis Giripurno Maju', '081200000767', 85.0),
('d9581f12-c8c3-59d5-ac21-94ec096bf716', 'kaloran-temanggung', 'Desa Wisata Kaloran', 'Kabupaten Temanggung', 'Kecamatan Kaloran', -7.2683, 110.2425, 'BERKEMBANG', 'Pokdarwis Kaloran Maju', '081200000768', 78.5),
('6e1772f3-b314-51d9-85bd-bbd1484a6f8f', 'kampung-mbako-temanggung', 'Desa Wisata Kampung Mbako', 'Kabupaten Temanggung', 'Kecamatan Kampung Mbako', -7.36, 110.172, 'BERKEMBANG', 'Pokdarwis Kampung Mbako Maju', '081200000769', 78.5),
('fef4ab57-79f9-5993-bfb8-08f6798807b5', 'kembangsari-temanggung', 'Desa Wisata Kembangsari', 'Kabupaten Temanggung', 'Kecamatan Kembangsari', -7.2425, 110.2025, 'BERKEMBANG', 'Pokdarwis Kembangsari Maju', '081200000770', 78.5),
('fb89f225-d3b4-5a43-b568-fecb1c9929a7', 'liyangan-temanggung', 'Desa Wisata Liyangan', 'Kabupaten Temanggung', 'Kecamatan Liyangan', -7.352, 110.1, 'BERKEMBANG', 'Pokdarwis Liyangan Maju', '081200000771', 78.5),
('7edbb4e8-4f59-5109-9ce3-61ecf5e18693', 'makukuhan-temanggung', 'Desa Wisata Makukuhan', 'Kabupaten Temanggung', 'Kecamatan Makukuhan', -7.348, 110.144, 'BERKEMBANG', 'Pokdarwis Makukuhan Maju', '081200000772', 78.5),
('9ee2f283-0003-5372-8665-bb6bda1a49f9', 'masjid-wali-dan-makam-kyai-pahing-temanggung', 'Desa Wisata Masjid Wali Dan Makam Kyai Pahing', 'Kabupaten Temanggung', 'Kecamatan Masjid Wali Dan Makam Kyai Pahing', -7.344, 110.188, 'BERKEMBANG', 'Pokdarwis Masjid Wali Dan Makam Kyai Pahing Maju', '081200000773', 78.5),
('15dd4602-fdca-5eea-bf01-f5cbe605be4a', 'mranggen-kidul-temanggung', 'Desa Wisata Mranggen Kidul', 'Kabupaten Temanggung', 'Kecamatan Mranggen Kidul', -7.34, 110.232, 'BERKEMBANG', 'Pokdarwis Mranggen Kidul Maju', '081200000774', 78.5),
('72d79232-a442-507c-9f6e-8db8c0e84747', 'muncar-moncer-temanggung', 'Desa Wisata Muncar Moncer', 'Kabupaten Temanggung', 'Kecamatan Muncar Moncer', -7.336, 110.116, 'BERKEMBANG', 'Pokdarwis Muncar Moncer Maju', '081200000775', 78.5),
('c0c9481b-aee8-50a0-bdec-b2335ee9c6a5', 'ngadimulyo-temanggung', 'Desa Wisata Ngadimulyo', 'Kabupaten Temanggung', 'Kecamatan Ngadimulyo', -7.332, 110.16, 'BERKEMBANG', 'Pokdarwis Ngadimulyo Maju', '081200000776', 78.5),
('f145de4f-5cc9-5955-b3ea-57577a0b3369', 'petarangan-temanggung', 'Desa Wisata Petarangan', 'Kabupaten Temanggung', 'Kledung', -7.328, 110.204, 'MAJU', 'Pokdarwis Petarangan Maju', '081200000777', 85.0),
('a9660af6-b10f-5386-9fe0-d5e480884205', 'pluralisme-temanggung', 'Desa Wisata Pluralisme', 'Kabupaten Temanggung', 'Kecamatan Pluralisme', -7.324, 110.248, 'BERKEMBANG', 'Pokdarwis Pluralisme Maju', '081200000778', 78.5),
('186ad084-edce-56d0-b58a-d6d537131d93', 'prangkokan-temanggung', 'Desa Wisata Prangkokan', 'Kabupaten Temanggung', 'Kecamatan Prangkokan', -7.32, 110.132, 'BERKEMBANG', 'Pokdarwis Prangkokan Maju', '081200000779', 78.5),
('ead1052e-e155-5171-836f-2536cf23f5ab', 'puser-bumi-temanggung', 'Desa Wisata Puser Bumi', 'Kabupaten Temanggung', 'Kecamatan Puser Bumi', -7.316, 110.176, 'BERKEMBANG', 'Pokdarwis Puser Bumi Maju', '081200000780', 78.5),
('5061dc3c-a0fc-52ce-80f5-1c23e2bafdb2', 'rejosari-temanggung', 'Desa Wisata Rejosari', 'Kabupaten Temanggung', 'Kecamatan Rejosari', -7.2792, 110.0608, 'BERKEMBANG', 'Pokdarwis Rejosari Maju', '081200000781', 78.5),
('1a50679a-80af-50d9-a399-6d006c8626e5', 'tegowanuh-temanggung', 'Desa Wisata Tegowanuh', 'Kabupaten Temanggung', 'Kecamatan Tegowanuh', -7.2925, 110.2033, 'BERKEMBANG', 'Pokdarwis Tegowanuh Maju', '081200000782', 78.5),
('88d291fa-0245-5646-a36d-d6b0a127aa68', 'tlahab-temanggung', 'Desa Wisata Tlahab', 'Kabupaten Temanggung', 'Kecamatan Tlahab', -7.304, 110.148, 'BERKEMBANG', 'Pokdarwis Tlahab Maju', '081200000783', 78.5),
('bb5932f5-6eba-5eed-bac7-cde92aa6036e', 'tlogowero-temanggung', 'Desa Wisata Tlogowero', 'Kabupaten Temanggung', 'Kecamatan Tlogowero', -7.3, 110.192, 'BERKEMBANG', 'Pokdarwis Tlogowero Maju', '081200000784', 78.5),
('aae99427-2dc8-560a-ae9c-7527ec2e4ebb', 'trah-aji-temanggung', 'Desa Wisata Trah Aji', 'Kabupaten Temanggung', 'Kecamatan Trah Aji', -7.296, 110.236, 'BERKEMBANG', 'Pokdarwis Trah Aji Maju', '081200000785', 78.5),
('cfc5ef07-0ebf-50a2-bf2c-6a8acc34f2a6', 'tuk-mulyo-temanggung', 'Desa Wisata Tuk Mulyo', 'Kabupaten Temanggung', 'Kecamatan Tuk Mulyo', -7.292, 110.12, 'BERKEMBANG', 'Pokdarwis Tuk Mulyo Maju', '081200000786', 78.5),
('d78e1899-83b4-5916-947a-f635af997b6c', 'wagir-bawang-temanggung', 'Desa Wisata Wagir Bawang', 'Kabupaten Temanggung', 'Kecamatan Wagir Bawang', -7.288, 110.164, 'BERKEMBANG', 'Pokdarwis Wagir Bawang Maju', '081200000787', 78.5),
('b6a7965f-aeed-53d0-8003-b13784245ef6', 'conto-wonogiri', 'Desa Wisata Conto', 'Kabupaten Wonogiri', 'Kecamatan Conto', -7.7551, 111.2045, 'BERKEMBANG', 'Pokdarwis Conto Maju', '081200000788', 78.5),
('6f17f795-938a-5efa-b4b0-a62c780d2564', 'kampung-wayang-wonogiri', 'Desa Wisata Kampung Wayang', 'Kabupaten Wonogiri', 'Kecamatan Kampung Wayang', -7.779, 111.001, 'BERKEMBANG', 'Pokdarwis Kampung Wayang Maju', '081200000789', 78.5),
('84e15c56-7896-51d3-8ea4-32d30cd066bf', 'karanglor-wonogiri', 'Desa Wisata Karanglor', 'Kabupaten Wonogiri', 'Kecamatan Karanglor', -7.8286, 110.8106, 'BERKEMBANG', 'Pokdarwis Karanglor Maju', '081200000790', 78.5),
('4ff8767f-1b51-5f7c-a0e9-f73081c2ff22', 'paraggupito-wonogiri', 'Desa Wisata Paraggupito', 'Kabupaten Wonogiri', 'Kecamatan Paraggupito', -7.771, 110.929, 'BERKEMBANG', 'Pokdarwis Paraggupito Maju', '081200000791', 78.5),
('240a316a-bd53-538b-b398-d4dc71f6afb4', 'sendang-pinilih-wonogiri', 'Desa Wisata Sendang Pinilih', 'Kabupaten Wonogiri', 'Kecamatan Sendang Pinilih', -7.767, 110.973, 'BERKEMBANG', 'Pokdarwis Sendang Pinilih Maju', '081200000792', 78.5),
('dc0b997c-c2b5-547c-a380-f37d12f1fe3a', 'sumberejo-wonogiri', 'Desa Wisata Sumberejo', 'Kabupaten Wonogiri', 'Kecamatan Sumberejo', -7.9807, 110.9921, 'BERKEMBANG', 'Pokdarwis Sumberejo Maju', '081200000793', 78.5),
('f611b889-e638-59db-93c9-ec79636ce1cd', 'banyukembar-wonosobo', 'Desa Wisata Banyukembar', 'Kabupaten Wonosobo', 'Kecamatan Banyukembar', -7.307, 109.876, 'BERKEMBANG', 'Pokdarwis Banyukembar Maju', '081200000794', 78.5),
('e3f0dbd0-21ca-5404-8a88-86469486b3a1', 'batursari-wonosobo', 'Desa Wisata Batursari', 'Kabupaten Wonosobo', 'Sapuran', -7.303, 109.92, 'MAJU', 'Pokdarwis Batursari Maju', '081200000795', 85.0),
('24f517fe-41a4-57e5-b9af-b68466ba1811', 'beran-wonosobo', 'Desa Wisata Beran', 'Kabupaten Wonosobo', 'Kepil', -7.299, 109.964, 'MAJU', 'Pokdarwis Beran Maju', '081200000796', 85.0),
('5f48e940-b340-535e-b68d-ff511d37e12b', 'besuki-wonosobo', 'Desa Wisata Besuki', 'Kabupaten Wonosobo', 'Kecamatan Besuki', -7.295, 109.848, 'BERKEMBANG', 'Pokdarwis Besuki Maju', '081200000797', 78.5),
('0f20ed07-b6a6-560a-a546-ad87ef390b25', 'binangun-wonosobo', 'Desa Wisata Binangun', 'Kabupaten Wonosobo', 'Kecamatan Binangun', -7.291, 109.892, 'BERKEMBANG', 'Pokdarwis Binangun Maju', '081200000798', 78.5),
('9a65e13a-b742-55fd-a44b-63517a96bfc1', 'bojasari-wonosobo', 'Desa Wisata Bojasari', 'Kabupaten Wonosobo', 'Kecamatan Bojasari', -7.287, 109.936, 'BERKEMBANG', 'Pokdarwis Bojasari Maju', '081200000799', 78.5),
('cd52ddec-763e-57fb-a529-fb4de633363e', 'campursari-wonosobo', 'Desa Wisata Campursari', 'Kabupaten Wonosobo', 'Kecamatan Campursari', -7.443, 109.82, 'BERKEMBANG', 'Pokdarwis Campursari Maju', '081200000800', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)
VALUES
('5e9a07cb-9b86-5b55-8ccf-c96b9eb3a66b', 'candirejo-wonosobo', 'Desa Wisata Candirejo', 'Kabupaten Wonosobo', 'Kecamatan Candirejo', -7.339, 109.9331, 'BERKEMBANG', 'Pokdarwis Candirejo Maju', '081200000801', 78.5),
('f37d2c28-a020-51f5-b751-16c3a7706a7f', 'damarkasian-wonosobo', 'Desa Wisata Damarkasian', 'Kabupaten Wonosobo', 'Kecamatan Damarkasian', -7.435, 109.908, 'BERKEMBANG', 'Pokdarwis Damarkasian Maju', '081200000802', 78.5),
('88c117cb-b301-5fea-b87b-0e875fbe0dea', 'deroduwur-wonosobo', 'Desa Wisata Deroduwur', 'Kabupaten Wonosobo', 'Kecamatan Deroduwur', -7.431, 109.952, 'BERKEMBANG', 'Pokdarwis Deroduwur Maju', '081200000803', 78.5),
('918300ce-fe54-5b80-b58f-9733de971d02', 'dieng-wonosobo', 'Desa Wisata Dieng', 'Kabupaten Wonosobo', 'Kecamatan Dieng', -7.427, 109.836, 'BERKEMBANG', 'Pokdarwis Dieng Maju', '081200000804', 78.5),
('726a10b2-12bd-5423-b241-40d286e07943', 'erorejo-wonosobo', 'Desa Wisata Erorejo', 'Kabupaten Wonosobo', 'Kecamatan Erorejo', -7.423, 109.88, 'BERKEMBANG', 'Pokdarwis Erorejo Maju', '081200000805', 78.5),
('92c26358-1b6e-5bb6-8490-d3a05b70c629', 'garung-wonosobo', 'Desa Wisata Garung', 'Kabupaten Wonosobo', 'Kecamatan Garung', -7.419, 109.924, 'BERKEMBANG', 'Pokdarwis Garung Maju', '081200000806', 78.5),
('9f513f6a-ab31-532f-a154-5b5c1fb21f48', 'giyanti-wonosobo', 'Desa Wisata Giyanti', 'Kabupaten Wonosobo', 'Kecamatan Giyanti', -7.415, 109.968, 'BERKEMBANG', 'Pokdarwis Giyanti Maju', '081200000807', 78.5),
('6213a347-cd02-5bef-b6c8-485e6f027a55', 'gondowulan-wonosobo', 'Desa Wisata Gondowulan', 'Kabupaten Wonosobo', 'Kecamatan Gondowulan', -7.411, 109.852, 'BERKEMBANG', 'Pokdarwis Gondowulan Maju', '081200000808', 78.5),
('d9f5ee89-f237-58c2-bbd1-0d9508e32b23', 'igirmranak-wonosobo', 'Desa Wisata Igirmranak', 'Kabupaten Wonosobo', 'Kecamatan Igirmranak', -7.407, 109.896, 'BERKEMBANG', 'Pokdarwis Igirmranak Maju', '081200000809', 78.5),
('07957424-9b0e-5bf6-8b4f-f6512f6329b5', 'kadipaten-wonosobo', 'Desa Wisata Kadipaten', 'Kabupaten Wonosobo', 'Kecamatan Kadipaten', -7.403, 109.94, 'BERKEMBANG', 'Pokdarwis Kadipaten Maju', '081200000810', 78.5),
('fcad2437-55ef-58f5-b52e-679997311c98', 'kalidesel-wonosobo', 'Desa Wisata Kalidesel', 'Kabupaten Wonosobo', 'Kecamatan Kalidesel', -7.2766, 109.8497, 'BERKEMBANG', 'Pokdarwis Kalidesel Maju', '081200000811', 78.5),
('1bc158ff-e1f9-5b20-925d-505163602365', 'kalimendong-wonosobo', 'Desa Wisata Kalimendong', 'Kabupaten Wonosobo', 'Leksono', -7.395, 109.868, 'MAJU', 'Pokdarwis Kalimendong Maju', '081200000812', 85.0),
('6f58a665-f779-5032-a5b2-fec5835c0db3', 'karangsari-wonosobo', 'Desa Wisata Karangsari', 'Kabupaten Wonosobo', 'Kecamatan Karangsari', -7.4781, 109.963, 'BERKEMBANG', 'Pokdarwis Karangsari Maju', '081200000813', 78.5),
('22076b3a-0f9a-5698-ac2c-c1fe800b39ef', 'keseneng-wonosobo', 'Desa Wisata Keseneng', 'Kabupaten Wonosobo', 'Mojotengah', -7.387, 109.956, 'MAJU', 'Pokdarwis Keseneng Maju', '081200000814', 85.0),
('45d3ddb6-31fd-575a-b88e-9f8808c2da47', 'kreo-wonosobo', 'Desa Wisata Kreo', 'Kabupaten Wonosobo', 'Kecamatan Kreo', -7.2594, 109.9419, 'BERKEMBANG', 'Pokdarwis Kreo Maju', '081200000815', 78.5),
('061ff4b7-c538-5677-b0b4-ba13b4b2807f', 'krinjing-wonosobo', 'Desa Wisata Krinjing', 'Kabupaten Wonosobo', 'Kecamatan Krinjing', -7.379, 109.884, 'BERKEMBANG', 'Pokdarwis Krinjing Maju', '081200000816', 78.5),
('5d098a64-6e17-597a-af3d-d499eb93f5fc', 'kumejing-wonosobo', 'Desa Wisata Kumejing', 'Kabupaten Wonosobo', 'Kecamatan Kumejing', -7.5608, 109.7701, 'BERKEMBANG', 'Pokdarwis Kumejing Maju', '081200000817', 78.5),
('f5ea5fa7-3fb5-5704-afaa-9cd1ba2f3e26', 'lengkong-wonosobo', 'Desa Wisata Lengkong', 'Kabupaten Wonosobo', 'Kecamatan Lengkong', -7.371, 109.972, 'BERKEMBANG', 'Pokdarwis Lengkong Maju', '081200000818', 78.5),
('f6d14091-9478-5887-868e-5ced91f69318', 'limbangan-wonosobo', 'Desa Wisata Limbangan', 'Kabupaten Wonosobo', 'Watumalang', -7.367, 109.856, 'MAJU', 'Pokdarwis Limbangan Maju', '081200000819', 85.0),
('c95bdf86-c382-5047-80ec-2e421b526d94', 'lipursari-wonosobo', 'Desa Wisata Lipursari', 'Kabupaten Wonosobo', 'Kecamatan Lipursari', -7.363, 109.9, 'BERKEMBANG', 'Pokdarwis Lipursari Maju', '081200000820', 78.5),
('2b6b8d93-431d-5899-acf0-4cfe9efb1ce3', 'maduretno-wonosobo', 'Desa Wisata Maduretno', 'Kabupaten Wonosobo', 'Kecamatan Maduretno', -7.359, 109.944, 'BERKEMBANG', 'Pokdarwis Maduretno Maju', '081200000821', 78.5),
('696f88e4-c98c-5692-9670-8e2b9196ec1c', 'maron-wonosobo', 'Desa Wisata Maron', 'Kabupaten Wonosobo', 'Kecamatan Maron', -7.355, 109.828, 'BERKEMBANG', 'Pokdarwis Maron Maju', '081200000822', 78.5),
('ed64143e-1b13-5776-b6ba-a0d597760cfa', 'mergolangu-wonosobo', 'Desa Wisata Mergolangu', 'Kabupaten Wonosobo', 'Kecamatan Mergolangu', -7.351, 109.872, 'BERKEMBANG', 'Pokdarwis Mergolangu Maju', '081200000823', 78.5),
('aff2885e-2a32-5ae4-910b-8bdc2e560aef', 'mergosari-wonosobo', 'Desa Wisata Mergosari', 'Kabupaten Wonosobo', 'Kecamatan Mergosari', -7.4781, 109.9637, 'BERKEMBANG', 'Pokdarwis Mergosari Maju', '081200000824', 78.5),
('d70490c2-0675-52d9-9516-e2a7c43637d3', 'pagerejo-wonosobo', 'Desa Wisata Pagerejo', 'Kabupaten Wonosobo', 'Kecamatan Pagerejo', -7.3641, 109.9768, 'BERKEMBANG', 'Pokdarwis Pagerejo Maju', '081200000825', 78.5),
('2b19e3af-fc81-5bbc-b0e4-92beb03a90a5', 'pakuncen-wonosobo', 'Desa Wisata Pakuncen', 'Kabupaten Wonosobo', 'Kecamatan Pakuncen', -7.339, 109.844, 'BERKEMBANG', 'Pokdarwis Pakuncen Maju', '081200000826', 78.5),
('f3c3cc6a-f7ec-5c1e-8e7b-f1468bc1f661', 'parikesit-wonosobo', 'Desa Wisata Parikesit', 'Kabupaten Wonosobo', 'Kecamatan Parikesit', -7.335, 109.888, 'BERKEMBANG', 'Pokdarwis Parikesit Maju', '081200000827', 78.5),
('cd98f9b2-c39a-520c-a589-eea4da6c82cc', 'patakbanteng-wonosobo', 'Desa Wisata Patakbanteng', 'Kabupaten Wonosobo', 'Kecamatan Patakbanteng', -7.331, 109.932, 'BERKEMBANG', 'Pokdarwis Patakbanteng Maju', '081200000828', 78.5),
('a7e0b068-9a27-5eb5-a865-5c6ddeef837b', 'pecekelan-wonosobo', 'Desa Wisata Pecekelan', 'Kabupaten Wonosobo', 'Kecamatan Pecekelan', -7.327, 109.976, 'BERKEMBANG', 'Pokdarwis Pecekelan Maju', '081200000829', 78.5),
('0c237ba8-a0de-5a2b-b530-9473855a2b35', 'plobangan-wonosobo', 'Desa Wisata Plobangan', 'Kabupaten Wonosobo', 'Selomerto', -7.323, 109.86, 'MAJU', 'Pokdarwis Plobangan Maju', '081200000830', 85.0),
('8f34efc9-4453-5560-bd53-f1beb27140de', 'projoburitan-wonosobo', 'Desa Wisata Projoburitan', 'Kabupaten Wonosobo', 'Kecamatan Projoburitan', -7.319, 109.904, 'BERKEMBANG', 'Pokdarwis Projoburitan Maju', '081200000831', 78.5),
('a575d7d9-a083-596c-a13f-e7fea30851c9', 'pulosaren-wonosobo', 'Desa Wisata Pulosaren', 'Kabupaten Wonosobo', 'Kecamatan Pulosaren', -7.4483, 110.0578, 'BERKEMBANG', 'Pokdarwis Pulosaren Maju', '081200000832', 78.5),
('d32cc6ee-bbb7-5b21-99f6-e90653ebd2a9', 'reco-wonosobo', 'Desa Wisata Reco', 'Kabupaten Wonosobo', 'Kecamatan Reco', -7.311, 109.832, 'BERKEMBANG', 'Pokdarwis Reco Maju', '081200000833', 78.5),
('77f39045-d3ad-5199-a6b3-b4cdc38bbbe8', 'ropoh-wonosobo', 'Desa Wisata Ropoh', 'Kabupaten Wonosobo', 'Kepil', -7.307, 109.876, 'MAJU', 'Pokdarwis Ropoh Maju', '081200000834', 85.0),
('8a3b653a-e381-50c0-bcaa-cf2405c38913', 'sawangan-wonosobo', 'Desa Wisata Sawangan', 'Kabupaten Wonosobo', 'Kecamatan Sawangan', -7.303, 109.92, 'BERKEMBANG', 'Pokdarwis Sawangan Maju', '081200000835', 78.5),
('772d0dff-9861-56ec-85c7-881326f5a641', 'selokromo-wonosobo', 'Desa Wisata Selokromo', 'Kabupaten Wonosobo', 'Kecamatan Selokromo', -7.299, 109.964, 'BERKEMBANG', 'Pokdarwis Selokromo Maju', '081200000836', 78.5),
('5e866292-3b7d-50ff-b749-a24211a67add', 'sembungan-wonosobo', 'Desa Wisata Sembungan', 'Kabupaten Wonosobo', 'Kecamatan Sembungan', -7.295, 109.848, 'BERKEMBANG', 'Pokdarwis Sembungan Maju', '081200000837', 78.5),
('743f8fe8-3dae-5d73-b65c-f9f855723606', 'sendangsari-wonosobo', 'Desa Wisata Sendangsari', 'Kabupaten Wonosobo', 'Kecamatan Sendangsari', -7.291, 109.892, 'BERKEMBANG', 'Pokdarwis Sendangsari Maju', '081200000838', 78.5),
('741d3181-d743-5507-9310-ea6d88cfdbff', 'sikunang-wonosobo', 'Desa Wisata Sikunang', 'Kabupaten Wonosobo', 'Kecamatan Sikunang', -7.2312, 109.904, 'BERKEMBANG', 'Pokdarwis Sikunang Maju', '081200000839', 78.5),
('a5cb1b29-0215-570f-9ecf-e3dcb7db9063', 'slukatan-wonosobo', 'Desa Wisata Slukatan', 'Kabupaten Wonosobo', 'Kecamatan Slukatan', -7.443, 109.82, 'BERKEMBANG', 'Pokdarwis Slukatan Maju', '081200000840', 78.5),
('6b5cb70e-dc3b-5c1a-9435-5eb903695aea', 'sumbersari-wonosobo', 'Desa Wisata Sumbersari', 'Kabupaten Wonosobo', 'Kecamatan Sumbersari', -7.5803, 109.7747, 'BERKEMBANG', 'Pokdarwis Sumbersari Maju', '081200000841', 78.5),
('84c270dd-1e45-57e1-a3f9-82cd2102b85e', 'talunombo-wonosobo', 'Desa Wisata Talunombo', 'Kabupaten Wonosobo', 'Kecamatan Talunombo', -7.435, 109.908, 'BERKEMBANG', 'Pokdarwis Talunombo Maju', '081200000842', 78.5),
('6969abe3-3f81-5dcb-8bec-39005cb5f4ac', 'tambi-wonosobo', 'Desa Wisata Tambi', 'Kabupaten Wonosobo', 'Kecamatan Tambi', -7.2639, 109.9547, 'BERKEMBANG', 'Pokdarwis Tambi Maju', '081200000843', 78.5),
('bc0935ce-d26e-5c3f-9f78-c19d310d1cbe', 'tegalsari-wonosobo', 'Desa Wisata Tegalsari', 'Kabupaten Wonosobo', 'Kecamatan Tegalsari', -7.3009, 109.9067, 'BERKEMBANG', 'Pokdarwis Tegalsari Maju', '081200000844', 78.5),
('a8dc31f9-9c70-5b7c-b5f3-42b9cb7e0321', 'tempurejo-wonosobo', 'Desa Wisata Tempurejo', 'Kabupaten Wonosobo', 'Kecamatan Tempurejo', -7.423, 109.88, 'BERKEMBANG', 'Pokdarwis Tempurejo Maju', '081200000845', 78.5),
('4af58b3c-6493-5e18-a426-a2569e03f521', 'tlogo-wonosobo', 'Desa Wisata Tlogo', 'Kabupaten Wonosobo', 'Kecamatan Tlogo', -7.419, 109.924, 'BERKEMBANG', 'Pokdarwis Tlogo Maju', '081200000846', 78.5),
('1162de14-d919-5765-82e6-60d73e8f67a6', 'tlogojati-wonosobo', 'Desa Wisata Tlogojati', 'Kabupaten Wonosobo', 'Kecamatan Tlogojati', -7.415, 109.968, 'BERKEMBANG', 'Pokdarwis Tlogojati Maju', '081200000847', 78.5),
('cc64c4ac-a4b6-5da7-af46-d33ff02fe28d', 'tlogomulyo-wonosobo', 'Desa Wisata Tlogomulyo', 'Kabupaten Wonosobo', 'Kecamatan Tlogomulyo', -7.3523, 109.9673, 'BERKEMBANG', 'Pokdarwis Tlogomulyo Maju', '081200000848', 78.5),
('8aa69de7-648b-5a48-a36a-934bb6e0af54', 'warangan-wonosobo', 'Desa Wisata Warangan', 'Kabupaten Wonosobo', 'Kepil', -7.407, 109.896, 'MAJU', 'Pokdarwis Warangan Maju', '081200000849', 85.0),
('54dcf4eb-7d99-51f0-abd6-dbb19b10df3f', 'wilayu-wonosobo', 'Desa Wisata Wilayu', 'Kabupaten Wonosobo', 'Kecamatan Wilayu', -7.403, 109.94, 'BERKEMBANG', 'Pokdarwis Wilayu Maju', '081200000850', 78.5),
('55ddf968-4943-58a6-aaec-b5adc10a437d', 'winongsari-wonosobo', 'Desa Wisata Winongsari', 'Kabupaten Wonosobo', 'Kecamatan Winongsari', -7.399, 109.824, 'BERKEMBANG', 'Pokdarwis Winongsari Maju', '081200000851', 78.5),
('0cbcbaa7-9068-5cd5-9f6c-3a0e93fe638e', 'cepoko-semarang', 'Desa Wisata Cepoko', 'Kota Semarang', 'Kecamatan Cepoko', -6.998, 110.406, 'BERKEMBANG', 'Pokdarwis Cepoko Maju', '081200000852', 78.5),
('d978fe4d-af7b-5abe-810e-3589abf5db88', 'jatirejo-semarang', 'Desa Wisata Jatirejo', 'Kota Semarang', 'Kecamatan Jatirejo', -6.994, 110.45, 'BERKEMBANG', 'Pokdarwis Jatirejo Maju', '081200000853', 78.5),
('4fc6520b-8e3c-5e21-8a26-dfeaa7ee5a97', 'kampung-djadhoel-rejomulyo-semarang', 'Desa Wisata Kampung Djadhoel Rejomulyo', 'Kota Semarang', 'Kecamatan Kampung Djadhoel Rejomulyo', -6.99, 110.494, 'BERKEMBANG', 'Pokdarwis Kampung Djadhoel Rejomulyo Maju', '081200000854', 78.5),
('f119bfe5-fb1b-5e82-97a3-b4998a7e6d29', 'kampung-jajan-pasar-bangetayu-kulon-semarang', 'Desa Wisata Kampung Jajan Pasar Bangetayu Kulon', 'Kota Semarang', 'Kecamatan Kampung Jajan Pasar Bangetayu Kulon', -6.986, 110.378, 'BERKEMBANG', 'Pokdarwis Kampung Jajan Pasar Bangetayu Kulon Maju', '081200000855', 78.5),
('37066328-8635-525b-abaa-8c2272684e71', 'kampung-melayu-dadapsari-semarang', 'Desa Wisata Kampung Melayu Dadapsari', 'Kota Semarang', 'Kecamatan Kampung Melayu Dadapsari', -6.982, 110.422, 'BERKEMBANG', 'Pokdarwis Kampung Melayu Dadapsari Maju', '081200000856', 78.5),
('a1d88acf-d3ee-5dda-a913-2a28bba3aafc', 'kandri-semarang', 'Desa Wisata Kandri', 'Kota Semarang', 'Kecamatan Kandri', -6.978, 110.466, 'BERKEMBANG', 'Pokdarwis Kandri Maju', '081200000857', 78.5),
('1146a55e-abac-5e3e-8cb1-f105d6220867', 'kedungpane-semarang', 'Desa Wisata Kedungpane', 'Kota Semarang', 'Kecamatan Kedungpane', -6.974, 110.51, 'BERKEMBANG', 'Pokdarwis Kedungpane Maju', '081200000858', 78.5),
('6eb09e1b-643b-5ef6-80b8-ddd189704962', 'nongkosawit-semarang', 'Desa Wisata Nongkosawit', 'Kota Semarang', 'Kecamatan Nongkosawit', -6.97, 110.394, 'BERKEMBANG', 'Pokdarwis Nongkosawit Maju', '081200000859', 78.5),
('e1be781c-27c6-5c75-88a6-90dac9aa1ea0', 'tapak-tugurejo-semarang', 'Desa Wisata Tapak Tugurejo', 'Kota Semarang', 'Kecamatan Tapak Tugurejo', -6.966, 110.438, 'BERKEMBANG', 'Pokdarwis Tapak Tugurejo Maju', '081200000860', 78.5),
('950461c4-35b6-5b4f-bc37-71344fb37eb7', 'wonolopo-semarang', 'Desa Wisata Wonolopo', 'Kota Semarang', 'Kecamatan Wonolopo', -6.962, 110.482, 'BERKEMBANG', 'Pokdarwis Wonolopo Maju', '081200000861', 78.5),
('56685c0d-055a-517f-88fb-af3f4d8a02da', 'baluwarti-surakarta', 'Desa Wisata Baluwarti', 'Kota Surakarta', 'Kecamatan Baluwarti', -7.567, 110.752, 'BERKEMBANG', 'Pokdarwis Baluwarti Maju', '081200000862', 78.5),
('7bcd752d-e829-55ae-b11f-62a5b8bf7ba1', 'jayengan-surakarta', 'Desa Wisata Jayengan', 'Kota Surakarta', 'Kecamatan Jayengan', -7.563, 110.796, 'BERKEMBANG', 'Pokdarwis Jayengan Maju', '081200000863', 78.5),
('f1812b2c-ba26-541d-88d8-06e2380662d2', 'kauman-surakarta', 'Desa Wisata Kauman', 'Kota Surakarta', 'Kecamatan Kauman', -6.8042, 110.8328, 'BERKEMBANG', 'Pokdarwis Kauman Maju', '081200000864', 78.5),
('d6edc5d9-ed68-5c2b-b0f6-08ec48a73a82', 'kemlayan-surakarta', 'Desa Wisata Kemlayan', 'Kota Surakarta', 'Kecamatan Kemlayan', -7.555, 110.884, 'BERKEMBANG', 'Pokdarwis Kemlayan Maju', '081200000865', 78.5),
('7798e3bc-c7a8-52c4-b42d-70487994eeaa', 'keprabon-surakarta', 'Desa Wisata Keprabon', 'Kota Surakarta', 'Kecamatan Keprabon', -7.551, 110.768, 'BERKEMBANG', 'Pokdarwis Keprabon Maju', '081200000866', 78.5),
('e60b402a-be72-5273-9bf8-18174846803e', 'laweyan-surakarta', 'Desa Wisata Laweyan', 'Kota Surakarta', 'Kecamatan Laweyan', -7.547, 110.812, 'BERKEMBANG', 'Pokdarwis Laweyan Maju', '081200000867', 78.5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;

UPDATE tourist_villages SET updated_at = CURRENT_TIMESTAMP WHERE geom IS NULL;

INSERT INTO village_grants (id, village_id, fiscal_year, funding_source, total_allocated, total_realized, remaining_balance, lpj_document_url, lpj_status, uploaded_at)
VALUES
('b0000004-0000-0000-0000-000000000000', 'e992f74c-326f-5e87-b3e2-dc437a2b6f7d', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-dawuhan-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000006-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 1000000000.00, 850000000.00, 150000000.00, '/documents/lpj-dieng-kulon-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000008-0000-0000-0000-000000000000', '6e2e30b6-9f1d-5853-bfd8-8afe58ab4bd7', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-giritirta-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000009-0000-0000-0000-000000000000', '23717fb9-edf3-5d1f-b854-810bdbda7dfc', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-glempang-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000013-0000-0000-0000-000000000000', '0a24b213-581f-5f46-ade7-3124c328e34f', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-kalilunjar-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000015-0000-0000-0000-000000000000', 'f2879501-f8d9-504a-94a9-4e8b6e2f201f', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kasmaran-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000018-0000-0000-0000-000000000000', '9d539070-039f-5354-a9b8-77e62b6d2241', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-pagak-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000021-0000-0000-0000-000000000000', 'b7b8bf25-5d0c-5969-ba94-ba92cea05840', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pesangkalan-banjarnegara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000057-0000-0000-0000-000000000000', '3759451a-56f3-50f0-92f5-9aeff69828c6', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kedawung-batang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000059-0000-0000-0000-000000000000', 'b0a5beae-9075-56bc-ac91-e2dc58f34fd1', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kemiri-barat-batang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000062-0000-0000-0000-000000000000', '7fc5ef9f-a673-5fda-ace0-d65fd19b570e', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pacet-batang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000068-0000-0000-0000-000000000000', 'cc6b3685-3afa-5bf6-a65e-e137dff22465', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pranten-batang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000072-0000-0000-0000-000000000000', '874add72-d951-5cee-b5aa-9325482722fa', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-sangubanyu-batang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000079-0000-0000-0000-000000000000', 'abb351a3-9c4f-5dad-8b4e-f8a84738b3d5', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-balong-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000080-0000-0000-0000-000000000000', '1441dee9-6e91-51df-9495-ef0984f455c1', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-bangowan-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000083-0000-0000-0000-000000000000', 'aa845b6b-514d-57e5-abb8-722ac621a2cb', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangjong-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000084-0000-0000-0000-000000000000', '1385ef87-5955-57f3-ba0f-4c5c336fb5c5', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-klopoduwur-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000085-0000-0000-0000-000000000000', '17664162-adce-5404-a2bc-e10b34faf8c3', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-ledok-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000090-0000-0000-0000-000000000000', '83fa9107-fd74-5188-a40c-4cd041249a5c', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-sambongrejo-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000091-0000-0000-0000-000000000000', 'f535308c-44de-506a-bdd2-c4aa864d7329', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-singonegoro-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000093-0000-0000-0000-000000000000', '1f0499e4-264d-536e-b99d-c4b0d405a682', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tempuran-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000094-0000-0000-0000-000000000000', 'bbb6b28d-afb0-54b3-afce-e99da947659e', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tinapan-blora-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000161-0000-0000-0000-000000000000', '931d634d-3cb0-58a6-b1a2-c9a1b9b442c4', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-bunton-cilacap-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000169-0000-0000-0000-000000000000', 'd75ba458-a7f1-5654-860b-cc01a38968a3', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-jambusari-cilacap-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000172-0000-0000-0000-000000000000', '334fca74-9569-5bac-abed-a624ee3dfb0e', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangmangu-cilacap-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000178-0000-0000-0000-000000000000', '90b149eb-d287-5bd8-b93f-06e37dd1afde', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-mentasan-cilacap-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000215-0000-0000-0000-000000000000', '30d44f33-8df7-5fc0-9033-a6c4df1c79e3', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-grabagan-grobogan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000228-0000-0000-0000-000000000000', '82b312e2-aece-501e-856b-0ad1978f67c3', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-putat-grobogan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000232-0000-0000-0000-000000000000', '6b16dfe9-474f-56aa-bbac-b55e82f52742', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-simo-grobogan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000238-0000-0000-0000-000000000000', '4fb57ed6-7e23-533a-8a29-acbe838db038', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tegowanu-wetan-grobogan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000242-0000-0000-0000-000000000000', '86e8e09f-63c2-5092-a8d0-4a381d533bd5', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-banjar-agung-jepara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000257-0000-0000-0000-000000000000', '4503da1b-bf0b-5de0-9933-169401aac453', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-semat-jepara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000264-0000-0000-0000-000000000000', '045dbe0e-9692-5881-a3b6-2c9e90957f37', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-watu-aji-jepara-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000267-0000-0000-0000-000000000000', 'c1b88526-6eda-5bf3-bd88-e31ff1e6d226', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-anggrasmanis-karanganyar-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000269-0000-0000-0000-000000000000', '31b758be-f7ad-5def-9337-cad7a4e1b498', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-berjo-karanganyar-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000291-0000-0000-0000-000000000000', 'd98c8f91-c9d8-5126-b7d8-70df41d4887a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-segorogunung-karanganyar-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000320-0000-0000-0000-000000000000', '7dd84f3c-4cba-5eea-a501-5712428298d2', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-rowokele-kebumen-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000331-0000-0000-0000-000000000000', '111d5ddd-46a8-5442-bf68-34f3925ddd2a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-getasblawong-kendal-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000332-0000-0000-0000-000000000000', '3980b697-5834-560c-af5d-82490ed0d12b', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-gondang-kendal-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000346-0000-0000-0000-000000000000', 'd95f1334-701f-55d5-8745-1782a7535e39', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-trayu-kendal-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000349-0000-0000-0000-000000000000', '7af36393-2028-5fab-9e5f-1e2418321a29', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-bugisan-klaten-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000365-0000-0000-0000-000000000000', 'eef4b891-d69e-5c4f-a8cf-4f2585e8dccf', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kupang-klaten-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000367-0000-0000-0000-000000000000', 'ebea88f8-a3e7-51cb-b0d0-3d258735df1c', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-manjungan-klaten-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000369-0000-0000-0000-000000000000', '1415731d-f2f6-56d1-bc7b-51d64d0c61f6', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-mranggen-klaten-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000374-0000-0000-0000-000000000000', '6ab8d24d-34eb-5cc4-9f3e-41a272e5bb39', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pasung-klaten-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000389-0000-0000-0000-000000000000', '8390e2e7-5a5e-51b2-a003-85c68a3e0f27', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-jurang-kudus-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000402-0000-0000-0000-000000000000', '62af3e4a-3967-533b-a28c-9131d52beda4', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-menawan-kudus-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000405-0000-0000-0000-000000000000', '645975f2-160a-55f7-89c1-de358782c257', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pedawang-kudus-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000413-0000-0000-0000-000000000000', '8d23ccba-6ea8-59d4-a897-ab9848834479', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-banyubiru-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000422-0000-0000-0000-000000000000', 'dda5f855-5aca-596a-b18e-946407cb77a0', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-jamuskauman-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (village_id, fiscal_year) DO UPDATE SET total_allocated = EXCLUDED.total_allocated;

INSERT INTO village_grants (id, village_id, fiscal_year, funding_source, total_allocated, total_realized, remaining_balance, lpj_document_url, lpj_status, uploaded_at)
VALUES
('b0000432-0000-0000-0000-000000000000', 'c2ad1be6-5104-595e-a70d-74ba5d6712b4', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-majaksingi-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000436-0000-0000-0000-000000000000', '5eafe42a-3fa4-5973-aee3-88faf2feef22', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-ngargogondo-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000439-0000-0000-0000-000000000000', '73eeab5d-6035-502a-a7a9-3311171e8f95', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-ngawen-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000453-0000-0000-0000-000000000000', '19c02d54-44a3-5ce3-a5e8-3c453703b620', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-temanggal-magelang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000459-0000-0000-0000-000000000000', '48500625-c238-5b0d-8391-9889a0b6dcb9', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-bakaran-wetan-pati-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000479-0000-0000-0000-000000000000', 'ff9f2011-3797-5b6f-af0f-784c55186646', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karanggondang-pekalongan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000481-0000-0000-0000-000000000000', '74639925-db7b-5cb5-81fc-c7972164d10b', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kayupuring-pekalongan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000484-0000-0000-0000-000000000000', '2946b9c7-fcbf-5342-8801-5e813142bb5e', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-lemah-abang-pekalongan-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000498-0000-0000-0000-000000000000', '85c3a2f4-0ec2-5454-8cf5-a374d3ba0281', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-banyumudal-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000503-0000-0000-0000-000000000000', 'd2c8037b-7895-52ae-8d5f-458c04a30891', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-gambuhan-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000506-0000-0000-0000-000000000000', '52fb0ae9-de93-53de-81ea-ca81621aa00f', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-gunungsari-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000509-0000-0000-0000-000000000000', '7585bc86-295b-507d-a9b8-cb3a2ada4ae7', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kaliprau-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000510-0000-0000-0000-000000000000', '7e4e1aea-cd95-53a2-b6ce-44028cdffd2a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangsari-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000518-0000-0000-0000-000000000000', 'c347461e-b98c-5380-8ce8-a6170e04fd66', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 500000000.00, 425000000.00, 75000000.00, '/documents/lpj-nyalembeng-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000519-0000-0000-0000-000000000000', '8811c1e9-ab8b-51b4-b76f-4c58a3f7df75', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-nyamplungsari-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000526-0000-0000-0000-000000000000', '257aee68-019a-5395-8c29-824404e459c6', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-surajaya-pemalang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000551-0000-0000-0000-000000000000', '8220dd13-75e1-5f5e-8c78-3baf97788936', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-selakambang-purbalingga-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000553-0000-0000-0000-000000000000', '7bc6f800-ecb6-580d-911e-f0191f531a7c', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-serayu-larangan-purbalingga-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000554-0000-0000-0000-000000000000', 'be575eae-4132-551c-a9f5-7c63a3b70612', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-sirau-purbalingga-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000555-0000-0000-0000-000000000000', 'f397fa26-6ce0-5c3a-b2fc-8ff6c30ad731', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-siwarak-purbalingga-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000559-0000-0000-0000-000000000000', '65fd7edb-3b52-5b48-89e3-f79b21d2abb9', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tumanggal-purbalingga-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000564-0000-0000-0000-000000000000', 'ce012a04-3c7b-5d43-a780-dc95bac82d74', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-cacaban-kidul-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000568-0000-0000-0000-000000000000', 'b43adaf9-996c-5b22-bf19-5bb9e945298a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-durensari-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000569-0000-0000-0000-000000000000', 'f633bef1-80c5-5848-ab4a-269096c5710a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-gedangan-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000571-0000-0000-0000-000000000000', '163759e5-6d16-52f9-9e3c-facaaf4bd407', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-guntur-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000576-0000-0000-0000-000000000000', '06603bf9-bf65-56d6-b2dc-3995e1594341', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-jogoboyo-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000582-0000-0000-0000-000000000000', '7f91eec6-f5af-5a16-b512-e0f7c32983e6', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangrejo-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000583-0000-0000-0000-000000000000', '26bbf708-0da3-595e-a694-f01fe3e77cae', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangrejo-purworejo-2-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000595-0000-0000-0000-000000000000', '2eadbbbd-7d7f-555b-be94-9fa52456def6', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pagak-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000600-0000-0000-0000-000000000000', 'b32f9bac-ec2f-565d-85a5-059c821e8a1f', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pucungroto-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000604-0000-0000-0000-000000000000', '85c06827-99bb-59e8-96ef-2a3b34d184f7', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-semawung-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000609-0000-0000-0000-000000000000', '8b01b870-8b5f-561a-9b5f-5990c27e6e0a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tlogoguwo-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000610-0000-0000-0000-000000000000', '891a761e-7c99-5f80-af06-1bb73e229937', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-tlogokotes-purworejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000644-0000-0000-0000-000000000000', '95bb7243-12f1-5756-8c96-b30864759711', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-banyukuning-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000664-0000-0000-0000-000000000000', '4dc15711-dfce-5bc7-a10c-07d2f6a5ab7a', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-jatijajar-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000667-0000-0000-0000-000000000000', '6d9ddc16-e7cf-551b-8507-08f9c16ede38', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kadirejo-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000668-0000-0000-0000-000000000000', '1f984f4d-5930-56e6-965c-fa409425291b', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kalisidi-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000675-0000-0000-0000-000000000000', 'b1c5fc7d-0bf5-5431-bdc3-b092d632d041', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kelurahan-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000676-0000-0000-0000-000000000000', '6ca64dde-7140-516a-b480-a781c6d312f5', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kemambang-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000693-0000-0000-0000-000000000000', '1ae935a9-dd16-5d0c-93f7-79037adc0f46', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pagersari-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000697-0000-0000-0000-000000000000', '6d99dfc3-b26b-548b-8162-42066274e805', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-polobogo-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000699-0000-0000-0000-000000000000', '32613795-22b1-58e4-aa68-ece705e15909', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-pringsari-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000703-0000-0000-0000-000000000000', '396f5120-00e7-5af8-a0f2-77fe1328cf7c', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-sambirejo-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000707-0000-0000-0000-000000000000', '17f539ba-f145-5ee3-9a11-fc6e41b66087', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-sukorejo-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000712-0000-0000-0000-000000000000', '077cf982-5efa-5c94-95c8-9fe2e19bfe5d', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-timpik-semarang-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000716-0000-0000-0000-000000000000', '2b9b8083-bef2-5b82-988c-15aeb7fde195', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karungan-sragen-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000728-0000-0000-0000-000000000000', '7e2931f4-cc58-5a0a-958b-3cd1e35a03b7', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-karangasem-sukoharjo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000767-0000-0000-0000-000000000000', '71ff4ab5-9d76-510e-b9ff-31990f3db710', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-giripurno-temanggung-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000777-0000-0000-0000-000000000000', 'f145de4f-5cc9-5955-b3ea-57577a0b3369', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-petarangan-temanggung-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000795-0000-0000-0000-000000000000', 'e3f0dbd0-21ca-5404-8a88-86469486b3a1', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-batursari-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (village_id, fiscal_year) DO UPDATE SET total_allocated = EXCLUDED.total_allocated;

INSERT INTO village_grants (id, village_id, fiscal_year, funding_source, total_allocated, total_realized, remaining_balance, lpj_document_url, lpj_status, uploaded_at)
VALUES
('b0000796-0000-0000-0000-000000000000', '24f517fe-41a4-57e5-b9af-b68466ba1811', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-beran-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000812-0000-0000-0000-000000000000', '1bc158ff-e1f9-5b20-925d-505163602365', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-kalimendong-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000814-0000-0000-0000-000000000000', '22076b3a-0f9a-5698-ac2c-c1fe800b39ef', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-keseneng-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000819-0000-0000-0000-000000000000', 'f6d14091-9478-5887-868e-5ced91f69318', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-limbangan-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000830-0000-0000-0000-000000000000', '0c237ba8-a0de-5a2b-b530-9473855a2b35', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-plobangan-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000834-0000-0000-0000-000000000000', '77f39045-d3ad-5199-a6b3-b4cdc38bbbe8', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-ropoh-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('b0000849-0000-0000-0000-000000000000', '8aa69de7-648b-5a48-a36a-934bb6e0af54', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 85000000.00, 15000000.00, '/documents/lpj-warangan-wonosobo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (village_id, fiscal_year) DO UPDATE SET total_allocated = EXCLUDED.total_allocated;

-- <<< END seed-villages-867.sql >>>

-- >>> BEGIN seed-hsd-2026.sql <<<
-- ==============================================================================
-- DEWI JATENG - SEED 1.061 HARGA SATUAN DASAR (HSD) MAS PETRUK 2026 PEMPROV JATENG
-- ==============================================================================

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0001', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 85000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0002', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0003', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 480000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0004', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0005', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0006', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 21869.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0007', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 12100000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0008', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0009', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0010', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 18000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0011', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 115000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0012', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0013', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0014', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 12000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0015', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0016', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 485920.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0017', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1540000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0018', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 685000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0019', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0020', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0021', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0022', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0023', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0024', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0025', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0026', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0027', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0028', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0029', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0030', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0031', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Cilacap', 2026),
('HSD-2026-0032', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 77000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0033', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 435000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0034', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 465000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0035', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0036', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0037', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0038', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9492000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0039', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0040', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0041', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0042', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0043', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0044', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0045', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0046', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0047', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 590000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0048', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1470000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0049', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 665000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0050', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0051', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0052', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0053', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0054', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0055', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0056', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0057', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0058', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0059', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0060', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0061', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0062', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Banyumas', 2026),
('HSD-2026-0063', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 77000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0064', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0065', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 440000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0066', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0067', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0068', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0069', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9591750.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0070', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0071', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0072', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0073', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 100000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0074', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0075', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0076', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0077', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 150000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0078', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 580000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0079', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1410000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0080', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 750000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0081', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0082', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0083', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0084', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0085', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0086', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2644000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0087', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0088', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0089', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0090', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0091', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0092', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0093', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Purbalingga', 2026),
('HSD-2026-0094', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79500.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0095', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0096', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 440000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0097', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0098', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0099', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0100', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9526666.00, 'Kabupaten Banjarnegara', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0101', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0102', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0103', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 17000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0104', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0105', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 73000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0106', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0107', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0108', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 57750.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0109', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 525000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0110', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1430000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0111', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 550000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0112', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0113', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0114', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0115', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0116', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0117', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0118', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 17000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0119', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0120', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0121', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0122', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0123', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0124', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Banjarnegara', 2026),
('HSD-2026-0125', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 80000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0126', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0127', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0128', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0129', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0130', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 15000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0131', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9651250.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0132', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12134250.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0133', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0134', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 17000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0135', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 115000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0136', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 68000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0137', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0138', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 12000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0139', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0140', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 610000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0141', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1500000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0142', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 660000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0143', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0144', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0145', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0146', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0147', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 630000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0148', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0149', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0150', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0151', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0152', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0153', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0154', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0155', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Kebumen', 2026),
('HSD-2026-0156', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 81000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0157', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0158', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0159', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0160', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0161', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 15000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0162', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9680000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0163', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12472750.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0164', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0165', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0166', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0167', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 71000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0168', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0169', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0170', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0171', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0172', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1460000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0173', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0174', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0175', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0176', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0177', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0178', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0179', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0180', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0181', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0182', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0183', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0184', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0185', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0186', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Purworejo', 2026),
('HSD-2026-0187', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0188', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0189', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 460000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0190', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0191', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0192', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0193', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9758250.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0194', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12632750.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0195', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0196', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0197', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0198', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 71000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0199', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0200', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Wonosobo', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0201', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0202', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0203', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1450000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0204', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0205', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0206', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0207', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0208', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0209', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0210', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0211', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0212', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0213', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0214', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0215', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0216', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0217', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Wonosobo', 2026),
('HSD-2026-0218', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 125000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0219', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0220', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0221', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0222', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0223', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0224', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 8950000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0225', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 17006000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0226', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0227', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 13000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0228', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0229', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 75000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0230', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0231', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0232', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0233', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 385865.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0234', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1570000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0235', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 610000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0236', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0237', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0238', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0239', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0240', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0241', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0242', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0243', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0244', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0245', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0246', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0247', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0248', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Magelang', 2026),
('HSD-2026-0249', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 76000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0250', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0251', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 445000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0252', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0253', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0254', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0255', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10183250.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0256', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12585750.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0257', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0258', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 17000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0259', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0260', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0261', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0262', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0263', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 135000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0264', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0265', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1440000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0266', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 640000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0267', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0268', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0269', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0270', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0271', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0272', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0273', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 18143.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0274', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0275', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0276', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0277', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0278', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0279', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Boyolali', 2026),
('HSD-2026-0280', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 77000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0281', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0282', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 440000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0283', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0284', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0285', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0286', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9706250.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0287', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12864250.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0288', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0289', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0290', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0291', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0292', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0293', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0294', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 135000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0295', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0296', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1440000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0297', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 635000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0298', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0299', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0300', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Klaten', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0301', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0302', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 615000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0303', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0304', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0305', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0306', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0307', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0308', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0309', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0310', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Klaten', 2026),
('HSD-2026-0311', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 76000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0312', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0313', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 445000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0314', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0315', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0316', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0317', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9995833.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0318', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12788250.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0319', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0320', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 13000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0321', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 88000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0322', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0323', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0324', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 9500.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0325', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0326', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0327', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1480000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0328', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 590000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0329', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0330', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0331', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0332', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0333', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0334', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0335', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0336', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0337', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0338', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0339', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0340', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0341', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Sukoharjo', 2026),
('HSD-2026-0342', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0343', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0344', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0345', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0346', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0347', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0348', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10128500.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0349', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 14290833.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0350', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0351', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 13000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0352', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0353', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0354', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0355', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0356', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 145000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0357', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 415380.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0358', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1530000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0359', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0360', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0361', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0362', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0363', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0364', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0365', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0366', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 17471.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0367', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0368', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0369', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0370', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0371', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0372', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Wonogiri', 2026),
('HSD-2026-0373', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0374', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 475000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0375', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 485000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0376', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0377', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0378', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0379', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9480000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0380', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 13188250.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0381', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0382', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0383', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0384', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0385', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0386', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0387', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 185000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0388', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0389', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1510000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0390', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0391', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0392', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0393', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0394', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0395', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0396', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0397', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0398', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0399', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0400', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Karanganyar', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0401', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0402', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0403', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Karanganyar', 2026),
('HSD-2026-0404', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 77000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0405', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0406', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 460000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0407', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0408', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0409', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0410', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10530500.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0411', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12500000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0412', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0413', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 13000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0414', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0415', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0416', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0417', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0418', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0419', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 374700.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0420', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1470000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0421', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 665000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0422', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0423', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0424', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0425', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0426', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0427', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0428', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0429', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0430', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0431', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0432', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0433', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0434', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Sragen', 2026),
('HSD-2026-0435', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0436', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0437', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0438', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 410000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0439', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 405000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0440', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0441', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9924500.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0442', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12121500.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0443', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0444', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0445', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0446', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0447', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0448', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 14000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0449', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0450', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0451', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1490000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0452', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 615000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0453', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0454', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0455', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0456', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0457', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0458', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0459', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0460', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0461', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0462', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0463', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0464', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0465', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Grobogan', 2026),
('HSD-2026-0466', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0467', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0468', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 445000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0469', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 405000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0470', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 405000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0471', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 21869.00, 'Kabupaten Blora', 2026),
('HSD-2026-0472', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9920000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0473', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0474', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0475', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0476', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0477', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Blora', 2026),
('HSD-2026-0478', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Blora', 2026),
('HSD-2026-0479', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 14000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0480', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0481', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 485920.00, 'Kabupaten Blora', 2026),
('HSD-2026-0482', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1460000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0483', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 605000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0484', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0485', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0486', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0487', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Blora', 2026),
('HSD-2026-0488', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0489', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0490', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0491', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Blora', 2026),
('HSD-2026-0492', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Blora', 2026),
('HSD-2026-0493', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Blora', 2026),
('HSD-2026-0494', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Blora', 2026),
('HSD-2026-0495', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Blora', 2026),
('HSD-2026-0496', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Blora', 2026),
('HSD-2026-0497', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 76000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0498', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0499', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 440000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0500', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 395000.00, 'Kabupaten Rembang', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0501', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 395000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0502', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0503', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9824000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0504', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 13840566.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0505', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0506', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0507', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0508', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 74520.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0509', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0510', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0511', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 135000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0512', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0513', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1440000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0514', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 585000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0515', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0516', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0517', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0518', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0519', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0520', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0521', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 17143.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0522', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0523', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0524', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0525', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0526', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0527', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Rembang', 2026),
('HSD-2026-0528', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0529', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0530', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0531', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 410000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0532', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0533', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0534', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9419000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0535', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0536', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0537', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0538', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 98000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0539', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 81000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0540', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 135000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0541', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 12000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0542', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0543', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Pati', 2026),
('HSD-2026-0544', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1460000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0545', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 610000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0546', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0547', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0548', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0549', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Pati', 2026),
('HSD-2026-0550', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0551', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0552', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0553', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Pati', 2026),
('HSD-2026-0554', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pati', 2026),
('HSD-2026-0555', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Pati', 2026),
('HSD-2026-0556', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pati', 2026),
('HSD-2026-0557', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Pati', 2026),
('HSD-2026-0558', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Pati', 2026),
('HSD-2026-0559', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 83000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0560', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0561', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 465000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0562', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0563', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 400000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0564', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0565', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9550000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0566', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0567', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0568', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 12000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0569', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0570', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0571', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0572', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 12000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0573', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 145000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0574', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0575', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1470000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0576', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 665000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0577', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0578', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0579', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0580', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0581', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0582', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0583', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0584', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0585', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0586', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0587', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0588', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0589', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Kudus', 2026),
('HSD-2026-0590', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0591', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 475000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0592', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 485000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0593', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0594', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 420000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0595', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0596', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 17400000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0597', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 18951333.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0598', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0599', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0600', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Jepara', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0601', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0602', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0603', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 12000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0604', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 170000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0605', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 388140.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0606', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1620000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0607', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0608', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0609', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0610', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0611', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0612', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0613', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0614', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0615', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0616', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0617', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0618', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0619', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0620', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Jepara', 2026),
('HSD-2026-0621', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 76000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0622', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0623', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0624', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0625', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0626', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0627', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 8968750.00, 'Kabupaten Demak', 2026),
('HSD-2026-0628', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0629', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0630', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0631', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0632', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Demak', 2026),
('HSD-2026-0633', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Demak', 2026),
('HSD-2026-0634', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 11000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0635', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0636', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Demak', 2026),
('HSD-2026-0637', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1460000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0638', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0639', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0640', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0641', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0642', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Demak', 2026),
('HSD-2026-0643', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0644', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0645', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0646', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Demak', 2026),
('HSD-2026-0647', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Demak', 2026),
('HSD-2026-0648', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Demak', 2026),
('HSD-2026-0649', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Demak', 2026),
('HSD-2026-0650', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Demak', 2026),
('HSD-2026-0651', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Demak', 2026),
('HSD-2026-0652', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0653', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 435000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0654', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 470000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0655', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 435000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0656', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 415000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0657', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 15000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0658', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9215000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0659', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0660', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0661', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 14000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0662', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 100000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0663', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0664', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0665', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0666', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 155000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0667', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0668', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1650000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0669', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 815000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0670', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0671', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0672', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0673', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0674', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0675', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0676', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0677', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0678', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0679', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0680', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0681', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0682', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Semarang', 2026),
('HSD-2026-0683', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 81000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0684', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0685', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0686', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 384666.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0687', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0688', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0689', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9422750.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0690', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12976000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0691', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0692', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 14000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0693', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0694', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 75000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0695', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0696', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0697', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 240000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0698', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0699', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1490000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0700', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kabupaten Temanggung', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0701', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0702', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0703', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0704', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 212666.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0705', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0706', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2500500.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0707', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0708', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0709', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0710', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0711', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0712', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0713', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Temanggung', 2026),
('HSD-2026-0714', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 81000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0715', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0716', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0717', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0718', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0719', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0720', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9219750.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0721', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12059750.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0722', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0723', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0724', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 99000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0725', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0726', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0727', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0728', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 125000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0729', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0730', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1440000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0731', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0732', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0733', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0734', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0735', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0736', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0737', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0738', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0739', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0740', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0741', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0742', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0743', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0744', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Kendal', 2026),
('HSD-2026-0745', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Batang', 2026),
('HSD-2026-0746', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Batang', 2026),
('HSD-2026-0747', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Batang', 2026),
('HSD-2026-0748', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Batang', 2026),
('HSD-2026-0749', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Batang', 2026),
('HSD-2026-0750', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Batang', 2026),
('HSD-2026-0751', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Batang', 2026),
('HSD-2026-0752', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0753', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0754', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0755', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0756', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0757', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0758', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10152750.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0759', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0760', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0761', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 13000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0762', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 115000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0763', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0764', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0765', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0766', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 78000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0767', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0768', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1540000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0769', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0770', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0771', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0772', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0773', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0774', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0775', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0776', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 21429.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0777', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0778', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0779', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0780', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0781', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0782', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Pekalongan', 2026),
('HSD-2026-0783', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 75000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0784', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0785', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 445000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0786', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0787', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0788', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0789', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9993000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0790', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0791', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0792', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 14000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0793', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 105000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0794', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0795', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0796', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0797', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 76000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0798', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0799', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1420000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0800', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 660000.00, 'Kabupaten Pemalang', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0801', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0802', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0803', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0804', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0805', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0806', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0807', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 20476.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0808', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0809', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0810', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0811', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0812', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0813', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Pemalang', 2026),
('HSD-2026-0814', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 77000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0815', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0816', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 455000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0817', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0818', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0819', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0820', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9586500.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0821', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0822', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0823', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0824', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0825', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0826', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0827', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0828', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0829', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0830', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1440000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0831', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 650000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0832', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0833', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0834', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0835', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0836', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0837', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0838', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0839', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0840', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0841', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0842', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0843', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0844', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kabupaten Tegal', 2026),
('HSD-2026-0845', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0846', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0847', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0848', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0849', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0850', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0851', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10044750.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0852', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0853', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0854', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 14000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0855', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0856', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0857', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0858', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0859', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 165000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0860', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0861', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1520000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0862', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0863', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0864', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0865', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0866', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0867', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0868', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0869', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0870', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0871', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0872', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0873', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0874', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0875', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kabupaten Brebes', 2026),
('HSD-2026-0876', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kota Magelang', 2026),
('HSD-2026-0877', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 435000.00, 'Kota Magelang', 2026),
('HSD-2026-0878', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kota Magelang', 2026),
('HSD-2026-0879', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Magelang', 2026),
('HSD-2026-0880', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Magelang', 2026),
('HSD-2026-0881', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Magelang', 2026),
('HSD-2026-0882', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9310000.00, 'Kota Magelang', 2026),
('HSD-2026-0883', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kota Magelang', 2026),
('HSD-2026-0884', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Magelang', 2026),
('HSD-2026-0885', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kota Magelang', 2026),
('HSD-2026-0886', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kota Magelang', 2026),
('HSD-2026-0887', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 69000.00, 'Kota Magelang', 2026),
('HSD-2026-0888', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Magelang', 2026),
('HSD-2026-0889', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Magelang', 2026),
('HSD-2026-0890', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 240000.00, 'Kota Magelang', 2026),
('HSD-2026-0891', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kota Magelang', 2026),
('HSD-2026-0892', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1490000.00, 'Kota Magelang', 2026),
('HSD-2026-0893', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kota Magelang', 2026),
('HSD-2026-0894', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Magelang', 2026),
('HSD-2026-0895', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Magelang', 2026),
('HSD-2026-0896', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Magelang', 2026),
('HSD-2026-0897', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kota Magelang', 2026),
('HSD-2026-0898', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Magelang', 2026),
('HSD-2026-0899', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Magelang', 2026),
('HSD-2026-0900', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 17000.00, 'Kota Magelang', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-0901', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Magelang', 2026),
('HSD-2026-0902', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Magelang', 2026),
('HSD-2026-0903', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kota Magelang', 2026),
('HSD-2026-0904', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Magelang', 2026),
('HSD-2026-0905', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Magelang', 2026),
('HSD-2026-0906', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kota Magelang', 2026),
('HSD-2026-0907', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 80000.00, 'Kota Surakarta', 2026),
('HSD-2026-0908', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kota Surakarta', 2026),
('HSD-2026-0909', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 465000.00, 'Kota Surakarta', 2026),
('HSD-2026-0910', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Surakarta', 2026),
('HSD-2026-0911', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Surakarta', 2026),
('HSD-2026-0912', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Surakarta', 2026),
('HSD-2026-0913', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 10713500.00, 'Kota Surakarta', 2026),
('HSD-2026-0914', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12588750.00, 'Kota Surakarta', 2026),
('HSD-2026-0915', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Surakarta', 2026),
('HSD-2026-0916', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kota Surakarta', 2026),
('HSD-2026-0917', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kota Surakarta', 2026),
('HSD-2026-0918', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kota Surakarta', 2026),
('HSD-2026-0919', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Surakarta', 2026),
('HSD-2026-0920', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Surakarta', 2026),
('HSD-2026-0921', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 145000.00, 'Kota Surakarta', 2026),
('HSD-2026-0922', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kota Surakarta', 2026),
('HSD-2026-0923', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1570000.00, 'Kota Surakarta', 2026),
('HSD-2026-0924', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 670000.00, 'Kota Surakarta', 2026),
('HSD-2026-0925', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Surakarta', 2026),
('HSD-2026-0926', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Surakarta', 2026),
('HSD-2026-0927', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Surakarta', 2026),
('HSD-2026-0928', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 134016.00, 'Kota Surakarta', 2026),
('HSD-2026-0929', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Surakarta', 2026),
('HSD-2026-0930', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Surakarta', 2026),
('HSD-2026-0931', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kota Surakarta', 2026),
('HSD-2026-0932', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kota Surakarta', 2026),
('HSD-2026-0933', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Surakarta', 2026),
('HSD-2026-0934', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kota Surakarta', 2026),
('HSD-2026-0935', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Surakarta', 2026),
('HSD-2026-0936', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Surakarta', 2026),
('HSD-2026-0937', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kota Surakarta', 2026),
('HSD-2026-0938', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kota Salatiga', 2026),
('HSD-2026-0939', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 425000.00, 'Kota Salatiga', 2026),
('HSD-2026-0940', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kota Salatiga', 2026),
('HSD-2026-0941', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Salatiga', 2026),
('HSD-2026-0942', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Salatiga', 2026),
('HSD-2026-0943', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Salatiga', 2026),
('HSD-2026-0944', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9520000.00, 'Kota Salatiga', 2026),
('HSD-2026-0945', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kota Salatiga', 2026),
('HSD-2026-0946', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Salatiga', 2026),
('HSD-2026-0947', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kota Salatiga', 2026),
('HSD-2026-0948', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 115000.00, 'Kota Salatiga', 2026),
('HSD-2026-0949', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kota Salatiga', 2026),
('HSD-2026-0950', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Salatiga', 2026),
('HSD-2026-0951', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Salatiga', 2026),
('HSD-2026-0952', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 145000.00, 'Kota Salatiga', 2026),
('HSD-2026-0953', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 462675.00, 'Kota Salatiga', 2026),
('HSD-2026-0954', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1520000.00, 'Kota Salatiga', 2026),
('HSD-2026-0955', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 655000.00, 'Kota Salatiga', 2026),
('HSD-2026-0956', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Salatiga', 2026),
('HSD-2026-0957', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Salatiga', 2026),
('HSD-2026-0958', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Salatiga', 2026),
('HSD-2026-0959', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kota Salatiga', 2026),
('HSD-2026-0960', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Salatiga', 2026),
('HSD-2026-0961', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Salatiga', 2026),
('HSD-2026-0962', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kota Salatiga', 2026),
('HSD-2026-0963', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 27500.00, 'Kota Salatiga', 2026),
('HSD-2026-0964', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 187000.00, 'Kota Salatiga', 2026),
('HSD-2026-0965', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 187000.00, 'Kota Salatiga', 2026),
('HSD-2026-0966', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 187000.00, 'Kota Salatiga', 2026),
('HSD-2026-0967', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Salatiga', 2026),
('HSD-2026-0968', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kota Salatiga', 2026),
('HSD-2026-0969', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kota Semarang', 2026),
('HSD-2026-0970', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 440000.00, 'Kota Semarang', 2026),
('HSD-2026-0971', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 470000.00, 'Kota Semarang', 2026),
('HSD-2026-0972', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 435000.00, 'Kota Semarang', 2026),
('HSD-2026-0973', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 450000.00, 'Kota Semarang', 2026),
('HSD-2026-0974', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Semarang', 2026),
('HSD-2026-0975', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9379500.00, 'Kota Semarang', 2026),
('HSD-2026-0976', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12500000.00, 'Kota Semarang', 2026),
('HSD-2026-0977', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Semarang', 2026),
('HSD-2026-0978', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 15000.00, 'Kota Semarang', 2026),
('HSD-2026-0979', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 100000.00, 'Kota Semarang', 2026),
('HSD-2026-0980', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kota Semarang', 2026),
('HSD-2026-0981', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Semarang', 2026),
('HSD-2026-0982', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Semarang', 2026),
('HSD-2026-0983', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 155000.00, 'Kota Semarang', 2026),
('HSD-2026-0984', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 540000.00, 'Kota Semarang', 2026),
('HSD-2026-0985', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1650000.00, 'Kota Semarang', 2026),
('HSD-2026-0986', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 850000.00, 'Kota Semarang', 2026),
('HSD-2026-0987', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Semarang', 2026),
('HSD-2026-0988', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Semarang', 2026),
('HSD-2026-0989', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Semarang', 2026),
('HSD-2026-0990', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kota Semarang', 2026),
('HSD-2026-0991', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Semarang', 2026),
('HSD-2026-0992', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Semarang', 2026),
('HSD-2026-0993', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kota Semarang', 2026),
('HSD-2026-0994', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22857.00, 'Kota Semarang', 2026),
('HSD-2026-0995', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Semarang', 2026),
('HSD-2026-0996', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kota Semarang', 2026),
('HSD-2026-0997', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Semarang', 2026),
('HSD-2026-0998', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Semarang', 2026),
('HSD-2026-0999', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kota Semarang', 2026),
('HSD-2026-1000', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 78000.00, 'Kota Pekalongan', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)
VALUES
('HSD-2026-1001', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1002', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 470000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1003', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1004', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1005', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1006', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 11200000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1007', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1008', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1009', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 14000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1010', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 110000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1011', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kota Pekalongan', 2026),
('HSD-2026-1012', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Pekalongan', 2026),
('HSD-2026-1013', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1014', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 105000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1015', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 438300.00, 'Kota Pekalongan', 2026),
('HSD-2026-1016', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1570000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1017', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 620000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1018', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1019', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1020', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1021', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kota Pekalongan', 2026),
('HSD-2026-1022', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1023', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1024', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1025', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kota Pekalongan', 2026),
('HSD-2026-1026', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Pekalongan', 2026),
('HSD-2026-1027', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 22875.00, 'Kota Pekalongan', 2026),
('HSD-2026-1028', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Pekalongan', 2026),
('HSD-2026-1029', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Pekalongan', 2026),
('HSD-2026-1030', 'Mandor', 'UPAH_TENAGA', 'OH', 29936.00, 'Kota Pekalongan', 2026),
('HSD-2026-1031', 'Semen Portland 50 kg (Semen (50 Kg))', 'MATERIAL_SEMEN', 'zak', 79000.00, 'Kota Tegal', 2026),
('HSD-2026-1032', 'Pasir Pasang', 'MATERIAL_AGREGAT', 'm3', 430000.00, 'Kota Tegal', 2026),
('HSD-2026-1033', 'Pasir Beton', 'MATERIAL_AGREGAT', 'm3', 460000.00, 'Kota Tegal', 2026),
('HSD-2026-1034', 'Batu Kali', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Tegal', 2026),
('HSD-2026-1035', 'Batu Belah 15/20 (Batu Belah 15 x 25 cm)', 'MATERIAL_AGREGAT', 'm3', 380000.00, 'Kota Tegal', 2026),
('HSD-2026-1036', 'Besi Beton Polos D10 (Besi beton polos)', 'MATERIAL_LOGAM', 'kg', 14000.00, 'Kota Tegal', 2026),
('HSD-2026-1037', 'Kayu Meranti 2/20 (Papan Kayu 2/20)', 'MATERIAL_KAYU', 'm3', 9982000.00, 'Kota Tegal', 2026),
('HSD-2026-1038', 'Kayu Meranti 6/12 (Balok Kayu 6/12 Kelas II atau III)', 'MATERIAL_KAYU', 'm3', 12000000.00, 'Kota Tegal', 2026),
('HSD-2026-1039', 'Kayu Kaso Bekisting (Kayu Kaso bekisting)', 'MATERIAL_KAYU', 'm3', 2812000.00, 'Kota Tegal', 2026),
('HSD-2026-1040', 'Genteng Beton', 'MATERIAL_ATAP', 'buah', 16000.00, 'Kota Tegal', 2026),
('HSD-2026-1041', 'Seng Gelombang BJLS 0.20 (Seng Gelombang BJLS-30 (t=0,05) panjang 1,8 m'' dan lebar 0,9m'')', 'MATERIAL_ATAP', 'lembar', 88000.00, 'Kota Tegal', 2026),
('HSD-2026-1042', 'Cat Tembok Interior 5 kg (Cat Tembok Interior)', 'BAHAN_KIMIA', 'kaleng', 58300.00, 'Kota Tegal', 2026),
('HSD-2026-1043', 'Cat Tembok Eksterior 5 kg (Cat Tembok Eksterior)', 'BAHAN_KIMIA', 'kaleng', 134600.00, 'Kota Tegal', 2026),
('HSD-2026-1044', 'Keramik Lantai 40x40 KW1 (Keramik Lantai uk. 40 x 40 cm)', 'MATERIAL_KERAMIK', 'm2', 10000.00, 'Kota Tegal', 2026),
('HSD-2026-1045', 'Pipa PVC AW 3 inch (PIPA PVC AW ; DN. 3"(80 mm) dan aksesoris)', 'MATERIAL_PIPA', 'batang', 140000.00, 'Kota Tegal', 2026),
('HSD-2026-1046', 'Pipa PVC AW 4 inch (Pipa PVC 4")', 'MATERIAL_PIPA', 'batang', 555000.00, 'Kota Tegal', 2026),
('HSD-2026-1047', 'Kloset Duduk Monoblok (Kloset Duduk)', 'SANITASI_PLUMBING', 'unit', 1400000.00, 'Kota Tegal', 2026),
('HSD-2026-1048', 'Wastafel Keramik (Wastafel Lengkap)', 'SANITASI_PLUMBING', 'unit', 665000.00, 'Kota Tegal', 2026),
('HSD-2026-1049', 'Beton Instant 40 MPa (Beton Instant 40 Mpa)', 'MATERIAL_BETON', 'm3', 1350000.00, 'Kota Tegal', 2026),
('HSD-2026-1050', 'Bekisting Rigid Pavement (Bekisting/Fix Form Rigid Pavement)', 'MATERIAL_LAIN', 'bh/M''', 50000.00, 'Kota Tegal', 2026),
('HSD-2026-1051', 'Pelat Rambu EG', 'MATERIAL_LAIN', 'buah', 325000.00, 'Kota Tegal', 2026),
('HSD-2026-1052', 'Rangka Atap Baja Ringan (Rangka atap baja ringan)', 'MATERIAL_LOGAM', 'm2', 18741.00, 'Kota Tegal', 2026),
('HSD-2026-1053', 'Kaca Tempered 8mm (Kaca Tempered tebal 8 mm)', 'MATERIAL_LAIN', 'm2', 596000.00, 'Kota Tegal', 2026),
('HSD-2026-1054', 'Tangki Air 1000 L (Tangki air 1000 liter)', 'SANITASI_PLUMBING', 'unit', 2328000.00, 'Kota Tegal', 2026),
('HSD-2026-1055', 'Kepala Tukang', 'UPAH_TENAGA', 'OH', 170000.00, 'Kota Tegal', 2026),
('HSD-2026-1056', 'Tukang Batu', 'UPAH_TENAGA', 'OH', 22472.00, 'Kota Tegal', 2026),
('HSD-2026-1057', 'Tukang Kayu', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Tegal', 2026),
('HSD-2026-1058', 'Tukang Besi', 'UPAH_TENAGA', 'OH', 160000.00, 'Kota Tegal', 2026),
('HSD-2026-1059', 'Tukang Cat', 'UPAH_TENAGA', 'OH', 179783.00, 'Kota Tegal', 2026),
('HSD-2026-1060', 'Pekerja / Buruh (Pekerja Biasa)', 'UPAH_TENAGA', 'OH', 126000.00, 'Kota Tegal', 2026),
('HSD-2026-1061', 'Mandor', 'UPAH_TENAGA', 'OH', 239711.00, 'Kota Tegal', 2026)
ON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;

-- <<< END seed-hsd-2026.sql >>>

-- >>> BEGIN seed-demo.sql <<<
-- ==============================================================================
-- DEWI JATENG - SEED DATA DEMO (idempoten, aman dijalankan berulang)
-- Dipakai untuk mengisi data contoh yang cukup kaya agar seluruh halaman
-- frontend (Beranda, /lapor, /transparansi, /pengelola) menampilkan isi nyata.
--
-- Jalankan manual pada container yang sudah berjalan:
--   docker exec -i dewijateng_db psql -U postgres -d dewijateng < docker/seed-demo.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Perbaiki URL foto laporan bawaan agar menunjuk aset yang benar-benar ada
-- ------------------------------------------------------------------------------
UPDATE incident_reports SET photo_before_url = '/img/figma/curug-sebelum.png'
WHERE report_code = 'LP-JTG-2026-0012';

UPDATE incident_reports SET photo_before_url = '/img/figma/aduan-sampah.png'
WHERE report_code = 'LP-JTG-2026-0042';

UPDATE incident_reports SET photo_before_url = '/img/figma/toilet-sebelum.png'
WHERE report_code = 'LP-JTG-2026-0088';

UPDATE report_resolutions SET photo_after_url = '/img/figma/curug-sesudah.png'
WHERE report_id = 'c0000000-0000-0000-0000-000000000001';

-- ------------------------------------------------------------------------------
-- 2. Rincian belanja LPJ Desa Wisata Candirejo (total realisasi Rp 142.000.000)
-- ------------------------------------------------------------------------------
INSERT INTO grant_expenses (id, grant_id, activity_name, category, volume, unit, claimed_unit_price, budget_allocated, amount_realized, remaining_amount, ai_anomaly_flag, anomaly_note) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Paving Block K-300 Area Parkir Wisata (420 M2)', 'MATERIAL_FISIK', 420.00, 'M2', 185000.00, 85000000.00, 77700000.00, 7300000.00, false, 'Harga satuan sesuai SSH Jateng Rp 185.000/M2'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Kanstin Beton Precast Pembatas Parkir (60 Batang)', 'MATERIAL_FISIK', 60.00, 'Batang', 145000.00, 9000000.00, 8700000.00, 300000.00, false, 'Sesuai SSH Rp 150.000/batang'),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Papan Interpretasi Wisata & Rambu Edukasi (8 Unit)', 'OPERASIONAL', 8.00, 'Unit', 450000.00, 4000000.00, 3600000.00, 400000.00, false, 'Sesuai standar biaya papan informasi desa wisata'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Upah Tukang Pasang Paving & Kanstin (10 Hari)', 'UPAH_TENAGA', 10.00, 'Hari', 1800000.00, 18000000.00, 18000000.00, 0.00, false, 'Realisasi upah sesuai HOK dan kesepakatan Pokdarwis'),
('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Rehabilitasi Toilet Umum & Instalasi Air Bersih', 'MATERIAL_FISIK', 2.00, 'Unit', 13500000.00, 27000000.00, 27000000.00, 0.00, false, 'Realisasi penuh sesuai RAB rehabilitasi MCK'),
('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'Pembelian APD & Rambu K3 Jalur Pejalan Kaki (20 Set)', 'KESELAMATAN_K3', 20.00, 'Set', 350000.00, 7000000.00, 7000000.00, 0.00, true, 'Indikasi deviasi harga klaim +75% vs batas wajar SSH Jateng (Rp 200.000/set)')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Laporan aduan warga tambahan (lintas desa, foto memakai aset lokal)
-- ------------------------------------------------------------------------------
INSERT INTO incident_reports (id, report_code, village_id, category, title, description, photo_before_url, latitude, longitude, is_anonymous, status, created_at, updated_at) VALUES
('c0000000-0000-0000-0000-000000000004', 'LP-JTG-2026-0101', 'a0000000-0000-0000-0000-000000000002', 'FASILITAS_RUSAK', 'Wastafel & Keran Taman Wisata Candirejo Kering', 'Keran wastafel di area taman tidak mengalir sejak pompa air rusak. Pengunjung kesulitan mencuci tangan setelah menyentuh hewan ternak di sekitar.', '/img/figma/aduan-wastafel.png', -7.6189200, 110.2296100, false, 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
('c0000000-0000-0000-0000-000000000005', 'LP-JTG-2026-0102', 'a0000000-0000-0000-0000-000000000002', 'BAHAYA_K3', 'Jembatan Kayu Akses Sawah Rawan Ambles', 'Papan jembatan kayu penghubung jalur wisata edukasi sawah sudah lapuk dan bergoyang. Wisatawan rombongan sekolah tetap melintas setiap akhir pekan.', '/img/figma/curug-sebelum.png', -7.6194700, 110.2285300, true, 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '13 days'),
('c0000000-0000-0000-0000-000000000006', 'LP-JTG-2026-0103', 'a0000000-0000-0000-0000-000000000004', 'FASILITAS_RUSAK', 'Toilet Umum Kawasan Kawah Sikidang Tidak Bisa Dikunci', 'Pintu bilik toilet nomor 2 dan 3 tidak bisa ditutup rapat, gagang pintu lepas. Lokasi tepat di jalur utama kawah sehingga ramai pengunjung.', '/img/figma/toilet-sebelum.png', -7.2054100, 109.9049100, false, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '1 days'),
('c0000000-0000-0000-0000-000000000007', 'LP-JTG-2026-0104', 'a0000000-0000-0000-0000-000000000004', 'KEBERSIHAN', 'Sampah Plastik Menumpuk di Jalur Kawah', 'Tempat sampah di sepanjang jalur kawah penuh dan sampah plastik berserakan hingga masuk ke aliran air panas. Perlu pengangkutan rutin.', '/img/figma/aduan-sampah.png', -7.2050300, 109.9053200, true, 'SUBMITTED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('c0000000-0000-0000-0000-000000000008', 'LP-JTG-2026-0105', 'a0000000-0000-0000-0000-000000000005', 'PUNGLI', 'Pungutan Parkir Liar di Depan Area Wisata', 'Petugas tidak resmi meminta Rp 10.000 per motor tanpa karcis. Pengunjung yang menolak diminta memindahkan kendaraan ke lokasi yang jauh.', '/img/figma/aduan-parkir.png', -7.2928100, 109.3511400, true, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('c0000000-0000-0000-0000-000000000009', 'LP-JTG-2026-0106', 'a0000000-0000-0000-0000-000000000007', 'FASILITAS_RUSAK', 'Area Parkir Wisata Berlubang dan Tergenang', 'Permukaan aspal area parkir berlubang besar dan tergenang saat hujan. Kendaraan roda dua beberapa kali terperosok.', '/img/figma/aduan-parkir.png', -7.1582300, 110.3764200, false, 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '21 days', CURRENT_TIMESTAMP - INTERVAL '16 days'),
('c0000000-0000-0000-0000-000000000010', 'LP-JTG-2026-0107', 'a0000000-0000-0000-0000-000000000006', 'BAHAYA_K3', 'Pagar Tebing Jalur Pendakian Longsor', 'Pagar pengaman di tikungan tebing jalur pendakian runtuh termakan longsor. Jalur masih dipakai pendaki tanpa pembatas pengganti.', '/img/figma/aduan-curug-sebelum.png', -7.4906300, 110.4961800, false, 'SUBMITTED', CURRENT_TIMESTAMP - INTERVAL '1 days', CURRENT_TIMESTAMP - INTERVAL '1 days'),
('c0000000-0000-0000-0000-000000000011', 'LP-JTG-2026-0108', 'a0000000-0000-0000-0000-000000000001', 'KEBERSIHAN', 'Saluran Air Tersumbat Sampah Daun', 'Saluran drainase di jalur menuju curug tersumbat daun dan menggenang. Jalur pejalan kaki jadi licin dan berlumut.', '/img/figma/aduan-sampah.png', -7.3696200, 110.4286700, true, 'RESOLVED', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('c0000000-0000-0000-0000-000000000012', 'LP-JTG-2026-0109', 'a0000000-0000-0000-0000-000000000002', 'FASILITAS_RUSAK', 'Lampu Penerangan Jalan Desa Wisata Mati', 'Enam titik lampu penerangan jalur wisata padam sejak dua minggu terakhir. Jalur menjadi gelap dan rawan bagi wisatawan yang pulang malam.', '/img/figma/aduan-wastafel.png', -7.6179900, 110.2301400, false, 'SUBMITTED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Bukti perbaikan (Proof-of-Fix) untuk laporan berstatus RESOLVED
-- ------------------------------------------------------------------------------
INSERT INTO report_resolutions (report_id, action_summary, photo_after_url, officer_name, exif_timestamp_verified, exif_photo_date, resolved_at) VALUES
(
    'c0000000-0000-0000-0000-000000000004',
    'Pompa air diganti baru dengan kapasitas 250 watt, pipa distribusi ke empat wastafel dibersihkan dari kerak, dan keran yang patah diganti stainless.',
    '/img/figma/toilet-sesudah.png',
    'Bagus Setyawan (Teknisi Sarpras Pokdarwis Candirejo Makmur)',
    true,
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'Jembatan kayu dibongkar dan diganti konstruksi baja ringan dengan lantai papan ulin anti-slip sepanjang 8 meter. Pondasi beton ditambah pada kedua ujung.',
    '/img/figma/curug-sesudah.png',
    'Sutrisno (Koordinator Lapangan Pokdarwis Candirejo)',
    true,
    CURRENT_TIMESTAMP - INTERVAL '13 days',
    CURRENT_TIMESTAMP - INTERVAL '13 days'
),
(
    'c0000000-0000-0000-0000-000000000009',
    'Lubang aspal ditambal hotmix seluas 24 m2, saluran drainase dibersihkan, dan permukaan diberi marka ulang. Genangan tidak lagi muncul saat hujan.',
    '/img/figma/curug-sesudah.png',
    'Agus Purwanto (Tim Pemeliharaan Desa Wisata Lerep)',
    true,
    CURRENT_TIMESTAMP - INTERVAL '16 days',
    CURRENT_TIMESTAMP - INTERVAL '16 days'
),
(
    'c0000000-0000-0000-0000-000000000011',
    'Saluran dibersihkan sepanjang 120 meter, sampah daun diangkut, dan dipasang kisi penahan sampah di dua titik agar tidak tersumbat kembali.',
    '/img/figma/aduan-curug-sesudah.png',
    'Slamet Riyadi (Koordinator Sarpras Pokdarwis Getas Indah)',
    true,
    CURRENT_TIMESTAMP - INTERVAL '8 days',
    CURRENT_TIMESTAMP - INTERVAL '8 days'
)
ON CONFLICT (report_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4b. Sinkronisasi PostgreSQL sequence agar aduan baru tidak bentrok dengan kode seed
-- ------------------------------------------------------------------------------
SELECT setval(
    'seq_report_code_2026',
    COALESCE((
        SELECT MAX(SUBSTRING(report_code FROM '(\d+)$')::bigint)
        FROM incident_reports
        WHERE report_code LIKE 'LP-JTG-2026-%'
    ), 100),
    true
);

-- ------------------------------------------------------------------------------
-- 4c. Akun Demo Awal: Admin Disbudparekraf & Pengelola Desa Wisata Candirejo
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, role, village_id, full_name, phone, status, approval_status, email_verified_at, must_change_password) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'disbudparekraf',
    'disbudparekraf@jatengprov.go.id',
    'pbkdf2$10000$e8393b3b6dd5c7a1d54ff785fe602a15$29a96fc31b11b546e7bd1f4d4a76ea09e9b7fd5725e5ba7482e68399c0fd9d100d631542bd772a89a98165781c457c40af01f984f7b486b8ce5d620a6492a9f2',
    'disbudparekraf',
    NULL,
    'Admin Eksekutif Disbudparekraf Jateng',
    '081122334455',
    'AKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP,
    false
),
(
    'e0000000-0000-0000-0000-000000000002',
    'desa-candirejo',
    'desa-candirejo@jatengprov.go.id',
    'pbkdf2$10000$6cff3c501f59dfe02a2379ec35bb5e8b$675ca8fa45b9f676a5ec2ae35a9243ec35c351e9de1c9ef579ae65234d465b1855877166e6b7956e9cfae3b9db2ec4965d3f2b3c13ff56e32c1d41ce4595357e',
    'desa',
    'a0000000-0000-0000-0000-000000000002',
    'Pengelola Desa Wisata Candirejo',
    '081234567802',
    'AKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP,
    false
)
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4b. Status LPJ contoh untuk antrean verifikasi Disbudparekraf
--     (supaya layar "Aktivitas" menampilkan campuran status seperti desain)
-- ------------------------------------------------------------------------------
UPDATE village_grants SET lpj_status = 'SUBMITTED', uploaded_at = CURRENT_TIMESTAMP - INTERVAL '3 days',
       lpj_review_notes = NULL
 WHERE village_id = 'a0000000-0000-0000-0000-000000000002'; -- Candirejo

UPDATE village_grants SET lpj_status = 'SUBMITTED', uploaded_at = CURRENT_TIMESTAMP - INTERVAL '2 days',
       lpj_review_notes = NULL
 WHERE id = 'b0000004-0000-0000-0000-000000000000'; -- Dawuhan

UPDATE village_grants SET lpj_status = 'REVISION', uploaded_at = CURRENT_TIMESTAMP - INTERVAL '5 days',
       lpj_review_notes = 'Realisasi upah kerja perlu dilampiri daftar hadir HOK dan foto progres.'
 WHERE village_id = 'a0000000-0000-0000-0000-000000000001'; -- Getas

UPDATE village_grants SET lpj_status = 'VERIFIED', uploaded_at = CURRENT_TIMESTAMP - INTERVAL '1 days'
 WHERE id = 'b0000006-0000-0000-0000-000000000000'; -- Dieng Kulon

-- ------------------------------------------------------------------------------
-- 4d. Akun pengelola desa wisata contoh (Fase 3 — layar "Akun desa wisata")
--
-- Lima akun tambahan supaya tabel, filter status, dan layar detail akun
-- menampilkan campuran status seperti desain. Kata sandi semua akun di bawah:
--   desa2026!aman
-- Status diturunkan dari kolom, bukan kolom baru:
--   Aktif               -> status='AKTIF'
--   Menunggu aktivasi   -> status='NONAKTIF' & email_verified_at IS NULL
--   Nonaktif            -> email_verified_at terisi & deactivated_at terisi
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, role, village_id, full_name, phone, status, approval_status, email_verified_at, activated_at, deactivated_at, must_change_password, created_at) VALUES
(
    'e0000000-0000-0000-0000-000000000003',
    'desa-lerep',
    'pengelola@lerep.desa.id',
    'pbkdf2$10000$422e27a0e4b9052d03b094209dd9101e$dad28a744cabc33c33bfa6de18d61d2e8f15a09866363c5e9704f3d8a24f5094766b12844e1887d23601269d68176dbffbbe70bb937cc88a725a305da030c32e',
    'desa',
    'a0000000-0000-0000-0000-000000000007',
    'Budi Santoso',
    '081234567803',
    'AKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP - INTERVAL '42 days',
    CURRENT_TIMESTAMP - INTERVAL '42 days',
    NULL,
    false,
    CURRENT_TIMESTAMP - INTERVAL '45 days'
),
(
    'e0000000-0000-0000-0000-000000000004',
    'desa-karangrejo',
    'pengelola@karangrejo.desa.id',
    'pbkdf2$10000$b84ff5281c182d294cd146d43a830a7a$3c548633566be7cbb5f6576ed95619d897f3ff3f44ac0e2a0622f4302d700ee52243bfdea128ce110f05e174eaaa65cdb1dfe65ce0f2b920ac9e33178270eb77',
    'desa',
    'fb31d4cf-36c1-5897-b7c3-673ce2f38a76',
    'Dewi Lestari',
    '081234567804',
    'NONAKTIF',
    'DISETUJUI',
    NULL,
    NULL,
    NULL,
    false,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'e0000000-0000-0000-0000-000000000005',
    'desa-ponggok',
    'pengelola@ponggok.desa.id',
    'pbkdf2$10000$442ecb089f2b54592bba977b15a1488c$0a8b9aabd160df0a556c8572721627422bee6ac46a19320b15bfd090b1190ad0202f420004278076ba8d914eed70530b05543ba6b285c774c56533d94099dcfe',
    'desa',
    'd2f136db-5c76-51df-bfa7-09f7de9b0089',
    'Agus Prasetyo',
    '081234567805',
    'AKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    NULL,
    false,
    CURRENT_TIMESTAMP - INTERVAL '33 days'
),
(
    'e0000000-0000-0000-0000-000000000006',
    'desa-sembungan',
    'pengelola@sembungan.desa.id',
    'pbkdf2$10000$e15dd669a51db3bcc31a452f533205fe$2c7450c74b66d1ed167ece418bef9dce4f193dffb100776895235c80ba64801e5a6c809a6ed5a24e73bccef3218f60e0b491a795f2f958b2c9bcbb07b6623c4e',
    'desa',
    '5e866292-3b7d-50ff-b749-a24211a67add',
    'Rina Wulandari',
    '081234567806',
    'AKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP - INTERVAL '21 days',
    CURRENT_TIMESTAMP - INTERVAL '21 days',
    NULL,
    false,
    CURRENT_TIMESTAMP - INTERVAL '24 days'
),
(
    'e0000000-0000-0000-0000-000000000007',
    'desa-kandri',
    'pengelola@kandri.desa.id',
    'pbkdf2$10000$2f048891119b86422e098be74657de07$7b1d3b1bf12e27c269d1f9b7792839a0249e42f24ae052d9e5ae05f2ae592f65c649b6c2b08d8299ff9faca4ec21ab0cb63d3b96798ea3ee98eedb68e1160f41',
    'desa',
    'a1d88acf-d3ee-5dda-a913-2a28bba3aafc',
    'Wahyu Hidayat',
    '081234567807',
    'NONAKTIF',
    'DISETUJUI',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP - INTERVAL '9 days',
    false,
    CURRENT_TIMESTAMP - INTERVAL '64 days'
)
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4e. Undangan aktivasi yang masih menggantung untuk Karangrejo
--
-- Supaya layar detail akun menampilkan "Undangan dikirim" + masa berlaku seperti
-- desain. Hash di bawah sengaja tidak bisa dipakai (token asli tidak disimpan);
-- tombol "Kirim ulang undangan" akan menerbitkan tautan yang benar-benar jalan.
-- ------------------------------------------------------------------------------
INSERT INTO auth_tokens (id, user_id, type, token_hash, expires_at, used_at, created_at) VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000004',
    'UNDANGAN_AKTIVASI',
    '00000000000000000000000000000000000000000000000000000000000000a1',
    CURRENT_TIMESTAMP + INTERVAL '22 hours',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4f. Transaksi keuangan desa wisata (Fase 4 - layar "Monitoring keuangan")
--
-- Angka mengikuti desain Figma `422:604`, `422:665`, `422:726`, `422:787`,
-- `422:848`, `422:909` untuk Desa Candirejo (6 pemasukan Rp 120 jt, 6
-- pengeluaran Rp 84 jt, saldo awal Rp 24 jt). Lerep, Ponggok, dan Sembungan
-- dibuat secukupnya agar total rekap sama dengan desain (180/126, 300/210,
-- 150/105). Karangrejo dan Kandri sengaja tanpa transaksi -> "Belum lapor".
--
-- Catatan: `PK-2026-0201` sengaja tanpa bukti supaya status "Perlu bukti"
-- tampil seperti desain.
-- ------------------------------------------------------------------------------
INSERT INTO village_opening_balances (village_id, period, amount) VALUES
('a0000000-0000-0000-0000-000000000002', '2026-10', 24000000),
('a0000000-0000-0000-0000-000000000007', '2026-10', 36000000),
('d2f136db-5c76-51df-bfa7-09f7de9b0089', '2026-10', 60000000),
('5e866292-3b7d-50ff-b749-a24211a67add', '2026-10', 30000000)
ON CONFLICT (village_id, period) DO UPDATE SET amount = EXCLUDED.amount;

INSERT INTO village_transactions (
    id, village_id, type, reference_code, title, category, transaction_date,
    amount, payment_method, counterparty, note, proof_file_name,
    proof_file_size_kb, proof_uploaded_by, recorded_by, recorded_at
) VALUES
-- Desa Wisata Candirejo - pemasukan (total Rp 120.000.000)
('c1000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0101',
 'Dukungan mitra wisata', 'Kemitraan', '2026-10-05', 15000000,
 'Transfer bank', 'PT Borobudur Wisata', 'Dukungan promosi bersama mitra.',
 'bukti-kemitraan-05-okt-2026.pdf', 204, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-05 16:20:00+07'),
('c1000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0102',
 'Sewa lapak UMKM', 'Sewa lapak', '2026-10-10', 9000000,
 'Setoran ke rekening desa', 'Paguyuban UMKM Candirejo', 'Sewa 30 lapak x Rp 300.000.',
 'bukti-sewa-lapak-10-okt-2026.pdf', 186, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-10 15:10:00+07'),
('c1000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0103',
 'Layanan parkir wisata', 'Parkir', '2026-10-15', 12000000,
 'Setoran ke rekening desa', 'Juru parkir kawasan wisata', 'Setoran parkir dua pekan.',
 'bukti-parkir-15-okt-2026.pdf', 172, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-15 16:05:00+07'),
('c1000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0104',
 'Layanan homestay', 'Homestay', '2026-10-22', 18000000,
 'Transfer bank', 'Pokdarwis Candirejo', '12 kamar x 3 malam.',
 'bukti-homestay-22-okt-2026.pdf', 231, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-22 14:40:00+07'),
('c1000000-0000-0000-0000-000000000105', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0105',
 'Paket wisata budaya', 'Paket wisata', '2026-10-27', 30000000,
 'Transfer bank', 'Desa Wisata Candirejo', 'Paket edukasi 6 sekolah.',
 'bukti-paket-wisata-27-okt-2026.pdf', 265, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-27 15:55:00+07'),
('c1000000-0000-0000-0000-000000000106', 'a0000000-0000-0000-0000-000000000002', 'PEMASUKAN', 'PM-2026-0106',
 'Penjualan tiket akhir bulan', 'Tiket wisata', '2026-10-31', 36000000,
 'Setoran ke rekening desa', 'Loket tiket desa wisata', '1.200 tiket x Rp 30.000.',
 'rekap-tiket-candirejo-31-okt-2026.pdf', 248, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-31 17:30:00+07'),

-- Desa Wisata Candirejo - pengeluaran (total Rp 84.000.000)
('c1000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0201',
 'Operasional kegiatan desa', 'Operasional', '2026-10-03', 10000000,
 'Tunai', 'Kas desa', 'Belanja operasional harian.', NULL, NULL, NULL,
 'Siti Rahmawati', '2026-10-03 14:00:00+07'),
('c1000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0202',
 'Tagihan listrik dan air', 'Utilitas', '2026-10-09', 8000000,
 'Transfer bank', 'PDAM & PLN', 'Tagihan bulan September.',
 'bukti-listrik-air-09-okt-2026.pdf', 158, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-09 11:20:00+07'),
('c1000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0203',
 'Kebersihan kawasan wisata', 'Kebersihan', '2026-10-14', 10000000,
 'Tunai', 'Petugas kebersihan', 'Honor 10 petugas x 1 bulan.',
 'bukti-kebersihan-14-okt-2026.pdf', 165, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-14 10:45:00+07'),
('c1000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0204',
 'Promosi dan publikasi', 'Promosi', '2026-10-20', 12000000,
 'Transfer bank', 'CV Media Kreatif', 'Cetak materi promosi wisata.',
 'bukti-promosi-20-okt-2026.pdf', 289, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-20 13:15:00+07'),
('c1000000-0000-0000-0000-000000000205', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0205',
 'Honor pemandu wisata', 'SDM', '2026-10-25', 20000000,
 'Tunai', 'Pemandu wisata desa', 'Honor 8 pemandu x 1 bulan.',
 'bukti-honor-pemandu-25-okt-2026.pdf', 197, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-25 15:00:00+07'),
('c1000000-0000-0000-0000-000000000206', 'a0000000-0000-0000-0000-000000000002', 'PENGELUARAN', 'PK-2026-0206',
 'Perbaikan fasilitas wisata', 'Pemeliharaan', '2026-10-30', 24000000,
 'Transfer bank', 'CV Sumber Makmur', 'perbaikan 12 unit bangku x Rp 2.000.000.',
 'bukti-perbaikan-fasilitas-30-okt-2026.pdf', 312, 'Siti Rahmawati', 'Siti Rahmawati', '2026-10-30 15:00:00+07'),

-- Desa Wisata Lerep - pemasukan Rp 180 jt / pengeluaran Rp 126 jt
('c1000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000007', 'PEMASUKAN', 'PM-2026-0301',
 'Penjualan tiket wisata', 'Tiket wisata', '2026-10-08', 90000000,
 'Setoran ke rekening desa', 'Loket tiket Lerep', 'Rekap tiket pekan pertama.',
 'rekap-tiket-lerep-08-okt-2026.pdf', 242, 'Budi Santoso', 'Budi Santoso', '2026-10-08 16:30:00+07'),
('c1000000-0000-0000-0000-000000000302', 'a0000000-0000-0000-0000-000000000007', 'PEMASUKAN', 'PM-2026-0302',
 'Layanan homestay', 'Homestay', '2026-10-19', 45000000,
 'Transfer bank', 'Pokdarwis Lerep', '20 kamar x 2 malam.',
 'bukti-homestay-lerep-19-okt-2026.pdf', 228, 'Budi Santoso', 'Budi Santoso', '2026-10-19 14:10:00+07'),
('c1000000-0000-0000-0000-000000000303', 'a0000000-0000-0000-0000-000000000007', 'PEMASUKAN', 'PM-2026-0303',
 'Paket edukasi sekolah', 'Paket wisata', '2026-10-29', 45000000,
 'Transfer bank', 'SMPN 2 Ungaran', 'Kunjungan edukasi 300 siswa.',
 'bukti-edukasi-lerep-29-okt-2026.pdf', 251, 'Budi Santoso', 'Budi Santoso', '2026-10-29 15:40:00+07'),
('c1000000-0000-0000-0000-000000000311', 'a0000000-0000-0000-0000-000000000007', 'PENGELUARAN', 'PK-2026-0311',
 'Honor pemandu wisata', 'SDM', '2026-10-12', 36000000,
 'Tunai', 'Pemandu wisata Lerep', 'Honor 12 pemandu x 1 bulan.',
 'bukti-honor-lerep-12-okt-2026.pdf', 189, 'Budi Santoso', 'Budi Santoso', '2026-10-12 13:25:00+07'),
('c1000000-0000-0000-0000-000000000312', 'a0000000-0000-0000-0000-000000000007', 'PENGELUARAN', 'PK-2026-0312',
 'Pemeliharaan jalur wisata', 'Pemeliharaan', '2026-10-23', 45000000,
 'Transfer bank', 'CV Karya Taman', 'Perbaikan jalur dan pagar.',
 'bukti-pemeliharaan-lerep-23-okt-2026.pdf', 301, 'Budi Santoso', 'Budi Santoso', '2026-10-23 11:05:00+07'),
('c1000000-0000-0000-0000-000000000313', 'a0000000-0000-0000-0000-000000000007', 'PENGELUARAN', 'PK-2026-0313',
 'Promosi dan publikasi', 'Promosi', '2026-10-30', 45000000,
 'Transfer bank', 'CV Media Kreatif', 'Iklan digital dan cetak.',
 'bukti-promosi-lerep-30-okt-2026.pdf', 274, 'Budi Santoso', 'Budi Santoso', '2026-10-30 10:50:00+07'),

-- Desa Wisata Ponggok - pemasukan Rp 300 jt / pengeluaran Rp 210 jt
('c1000000-0000-0000-0000-000000000401', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PEMASUKAN', 'PM-2026-0401',
 'Penjualan tiket Umbul Ponggok', 'Tiket wisata', '2026-10-07', 150000000,
 'Setoran ke rekening desa', 'Loket Umbul Ponggok', 'Rekap tiket pekan pertama.',
 'rekap-tiket-ponggok-07-okt-2026.pdf', 262, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-07 17:15:00+07'),
('c1000000-0000-0000-0000-000000000402', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PEMASUKAN', 'PM-2026-0402',
 'Sewa lapak UMKM', 'Sewa lapak', '2026-10-18', 60000000,
 'Setoran ke rekening desa', 'Paguyuban UMKM Ponggok', 'Sewa 100 lapak x Rp 600.000.',
 'bukti-sewa-lapak-ponggok-18-okt-2026.pdf', 219, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-18 14:35:00+07'),
('c1000000-0000-0000-0000-000000000403', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PEMASUKAN', 'PM-2026-0403',
 'Paket snorkeling', 'Paket wisata', '2026-10-28', 90000000,
 'Transfer bank', 'Pokdarwis Ponggok', 'Paket 1.500 pengunjung.',
 'bukti-snorkeling-ponggok-28-okt-2026.pdf', 288, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-28 16:45:00+07'),
('c1000000-0000-0000-0000-000000000411', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PENGELUARAN', 'PK-2026-0411',
 'Honor pemandu dan instruktur', 'SDM', '2026-10-11', 90000000,
 'Tunai', 'Pemandu Umbul Ponggok', 'Honor 30 pemandu x 1 bulan.',
 'bukti-honor-ponggok-11-okt-2026.pdf', 236, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-11 15:20:00+07'),
('c1000000-0000-0000-0000-000000000412', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PENGELUARAN', 'PK-2026-0412',
 'Pemeliharaan kolam dan area wisata', 'Pemeliharaan', '2026-10-21', 75000000,
 'Transfer bank', 'CV Tirta Jaya', 'Perawatan kolam dan pompa.',
 'bukti-pemeliharaan-ponggok-21-okt-2026.pdf', 297, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-21 12:30:00+07'),
('c1000000-0000-0000-0000-000000000413', 'd2f136db-5c76-51df-bfa7-09f7de9b0089', 'PENGELUARAN', 'PK-2026-0413',
 'Operasional harian', 'Operasional', '2026-10-31', 45000000,
 'Tunai', 'Kas desa', 'Belanja operasional bulan Oktober.',
 'bukti-operasional-ponggok-31-okt-2026.pdf', 183, 'Agus Prasetyo', 'Agus Prasetyo', '2026-10-31 16:05:00+07'),

-- Desa Wisata Sembungan - pemasukan Rp 150 jt / pengeluaran Rp 105 jt
('c1000000-0000-0000-0000-000000000501', '5e866292-3b7d-50ff-b749-a24211a67add', 'PEMASUKAN', 'PM-2026-0501',
 'Penjualan tiket sunrise', 'Tiket wisata', '2026-10-06', 75000000,
 'Setoran ke rekening desa', 'Loket Sembungan', 'Rekap tiket pekan pertama.',
 'rekap-tiket-sembungan-06-okt-2026.pdf', 221, 'Rina Wulandari', 'Rina Wulandari', '2026-10-06 16:10:00+07'),
('c1000000-0000-0000-0000-000000000502', '5e866292-3b7d-50ff-b749-a24211a67add', 'PEMASUKAN', 'PM-2026-0502',
 'Layanan homestay', 'Homestay', '2026-10-17', 45000000,
 'Transfer bank', 'Pokdarwis Sembungan', '15 kamar x 2 malam.',
 'bukti-homestay-sembungan-17-okt-2026.pdf', 214, 'Rina Wulandari', 'Rina Wulandari', '2026-10-17 14:55:00+07'),
('c1000000-0000-0000-0000-000000000503', '5e866292-3b7d-50ff-b749-a24211a67add', 'PEMASUKAN', 'PM-2026-0503',
 'Paket camping', 'Paket wisata', '2026-10-26', 30000000,
 'Transfer bank', 'Komunitas Pendaki Dieng', 'Paket camping 150 peserta.',
 'bukti-camping-sembungan-26-okt-2026.pdf', 259, 'Rina Wulandari', 'Rina Wulandari', '2026-10-26 15:25:00+07'),
('c1000000-0000-0000-0000-000000000511', '5e866292-3b7d-50ff-b749-a24211a67add', 'PENGELUARAN', 'PK-2026-0511',
 'Honor pemandu wisata', 'SDM', '2026-10-10', 30000000,
 'Tunai', 'Pemandu Sembungan', 'Honor 10 pemandu x 1 bulan.',
 'bukti-honor-sembungan-10-okt-2026.pdf', 176, 'Rina Wulandari', 'Rina Wulandari', '2026-10-10 13:40:00+07'),
('c1000000-0000-0000-0000-000000000512', '5e866292-3b7d-50ff-b749-a24211a67add', 'PENGELUARAN', 'PK-2026-0512',
 'Pemeliharaan jalur pendakian', 'Pemeliharaan', '2026-10-20', 45000000,
 'Transfer bank', 'CV Dieng Karya', 'Perbaikan jalur dan tangga.',
 'bukti-pemeliharaan-sembungan-20-okt-2026.pdf', 286, 'Rina Wulandari', 'Rina Wulandari', '2026-10-20 11:30:00+07'),
('c1000000-0000-0000-0000-000000000513', '5e866292-3b7d-50ff-b749-a24211a67add', 'PENGELUARAN', 'PK-2026-0513',
 'Kebersihan kawasan wisata', 'Kebersihan', '2026-10-30', 30000000,
 'Tunai', 'Petugas kebersihan', 'Honor 15 petugas x 1 bulan.',
 'bukti-kebersihan-sembungan-30-okt-2026.pdf', 168, 'Rina Wulandari', 'Rina Wulandari', '2026-10-30 10:15:00+07')
ON CONFLICT (reference_code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4g. Nama pengelola Candirejo mengikuti desain (person, bukan label desa).
-- ------------------------------------------------------------------------------
UPDATE users SET full_name = 'Siti Rahmawati'
 WHERE username = 'desa-candirejo' AND full_name = 'Pengelola Desa Wisata Candirejo';

-- ------------------------------------------------------------------------------
-- 5. Ringkasan hasil seed
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_count INT;
    g_count INT;
    e_count INT;
    r_count INT;
    res_count INT;
    t_count INT;
BEGIN
    SELECT count(*) INTO v_count FROM tourist_villages;
    SELECT count(*) INTO g_count FROM village_grants;
    SELECT count(*) INTO e_count FROM grant_expenses;
    SELECT count(*) INTO r_count FROM incident_reports;
    SELECT count(*) INTO res_count FROM report_resolutions;
    SELECT count(*) INTO t_count FROM village_transactions;
    RAISE NOTICE 'Seed selesai: % desa, % grant, % pos belanja, % laporan, % bukti perbaikan, % transaksi keuangan',
        v_count, g_count, e_count, r_count, res_count, t_count;
END
$$;

-- <<< END seed-demo.sql >>>

-- >>> BEGIN seed-demo-full.sql <<<
-- ==============================================================================
-- DEWI JATENG - SEED DEMO PENUH (semua 868 desa wisata)
--
-- Melengkapi data yang masih kosong setelah `docker/seed-demo.sql`:
--   * village_grants      -> tiap desa punya LPJ 2026
--   * grant_expenses      -> rincian pos belanja untuk tiap LPJ
--   * incident_reports    -> aduan warga tiap desa
--   * report_resolutions  -> bukti perbaikan untuk tiap aduan RESOLVED
--
-- Sifat:
--   * IDEMPOTEN  - guard `NOT EXISTS`; aman dijalankan berkali-kali.
--   * DETERMINISTIK - angka diturunkan dari md5(id desa), jadi hasil seed
--     selalu sama walau script dijalankan ulang.
--   * Data Candirejo/Getas/Lerep yang sudah cocok desain TIDAK diubah.
--
-- Catatan: `village_transactions` (monitoring keuangan) sengaja tidak diisi
-- untuk seluruh desa karena layar itu memang dibatasi ke desa yang punya akun
-- pengelola (lihat MONITORED_SQL di lib/services/financeService.ts).
--
-- Dimuat otomatis oleh `npm run db:seed` setelah `docker/seed-demo.sql`.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Helper deterministik: byte ke-N dari md5(seed), dimodulo.
--    Dipakai sebagai pseudo-random yang stabil untuk seluruh script ini.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dewi_seed_int(p_seed TEXT, p_byte INT, p_mod INT)
RETURNS INT AS $$
  SELECT (get_byte(decode(md5(p_seed), 'hex'), p_byte % 16)::int) % p_mod;
$$ LANGUAGE sql IMMUTABLE;


-- ------------------------------------------------------------------------------
-- 1. village_grants - satu LPJ 2026 untuk tiap desa yang belum punya
--
--    Pagu per kategori + jitter Rp 0-40 juta, dibagi ke sumber dana
--    APBDes 40% / Banprov 50% / PADes sisanya. Realisasi 70-90% dari pagu.
--    Sebaran status mengikuti komposisi nyata: mayoritas VERIFIED.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v              RECORD;
  v_seed         TEXT;
  v_base         NUMERIC;
  v_total        NUMERIC;
  v_realized     NUMERIC;
  v_apbdes       NUMERIC;
  v_banprov      NUMERIC;
  v_pades        NUMERIC;
  v_status       VARCHAR(20);
  v_url          VARCHAR(255);
  v_uploaded     TIMESTAMPTZ;
  v_roll         INT;
BEGIN
  FOR v IN
    SELECT tv.id, tv.slug, tv.category
      FROM tourist_villages tv
     WHERE NOT EXISTS (
             SELECT 1 FROM village_grants vg
              WHERE vg.village_id = tv.id AND vg.fiscal_year = 2026)
     ORDER BY tv.id
  LOOP
    v_seed := v.id::text;

    v_base := CASE v.category
                WHEN 'RINTISAN'   THEN 50000000
                WHEN 'BERKEMBANG' THEN 100000000
                WHEN 'MAJU'       THEN 150000000
                WHEN 'MANDIRI'    THEN 200000000
                ELSE 100000000
              END;

    v_total := v_base + (dewi_seed_int(v_seed, 0, 5) * 10000000);

    v_apbdes  := round(v_total * 0.40, -6);
    v_banprov := round(v_total * 0.50, -6);
    v_pades   := v_total - v_apbdes - v_banprov;

    v_realized := round(v_total * (70 + dewi_seed_int(v_seed, 1, 21)) / 100.0, -5);

    v_roll := dewi_seed_int(v_seed, 2, 100);
    v_status := CASE
                  WHEN v_roll < 78 THEN 'VERIFIED'
                  WHEN v_roll < 90 THEN 'SUBMITTED'
                  WHEN v_roll < 96 THEN 'PENDING_UPLOAD'
                  ELSE 'REVISION'
                END;

    IF v_status = 'PENDING_UPLOAD' THEN
      v_url := NULL;
      v_uploaded := NULL;
    ELSE
      v_url := '/documents/lpj-' || v.slug || '-2026.pdf';
      v_uploaded := CURRENT_TIMESTAMP
                    - make_interval(days => 3 + dewi_seed_int(v_seed, 3, 40));
    END IF;

    INSERT INTO village_grants (
      village_id, fiscal_year, funding_source,
      apbdes_amount, banprov_amount, pades_amount,
      total_allocated, total_realized, remaining_balance,
      lpj_document_url, lpj_status, uploaded_at
    ) VALUES (
      v.id, 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng',
      v_apbdes, v_banprov, v_pades,
      v_total, v_realized, v_total - v_realized,
      v_url, v_status, v_uploaded
    )
    ON CONFLICT (village_id, fiscal_year) DO NOTHING;
  END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 1b. village_grants - LPJ 2023, 2024, 2025 untuk tiap desa
--
--     Halaman Transparansi menampilkan pilihan tahun 2023-2026. Tanpa baris ini
--     hanya 2026 yang berisi dana. Pola sama dengan 2026, tetapi pagu lebih
--     kecil untuk tahun yang lebih lama (faktor pertumbuhan ~7%/tahun) dan
--     diberi jitter deterministik agar tidak seragam.
--
--     Rincian pos belanja-nya diisi otomatis oleh blok 2 di bawah (blok itu
--     memilih semua grant yang belum punya pos belanja).
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v         RECORD;
  y         INT;
  v_seed    TEXT;
  v_base    NUMERIC;
  v_factor  NUMERIC;
  v_total   NUMERIC;
  v_realized NUMERIC;
  v_apbdes  NUMERIC;
  v_banprov NUMERIC;
  v_pades   NUMERIC;
  v_status  VARCHAR(20);
  v_url     VARCHAR(255);
  v_uploaded TIMESTAMPTZ;
  v_roll    INT;
BEGIN
  FOR y IN 2023..2025 LOOP
    FOR v IN
      SELECT tv.id, tv.slug, tv.category
        FROM tourist_villages tv
       WHERE NOT EXISTS (
               SELECT 1 FROM village_grants vg
                WHERE vg.village_id = tv.id AND vg.fiscal_year = y)
       ORDER BY tv.id
    LOOP
      v_seed := v.id::text || '-' || y::text;

      v_base := CASE v.category
                  WHEN 'RINTISAN'   THEN 50000000
                  WHEN 'BERKEMBANG' THEN 100000000
                  WHEN 'MAJU'       THEN 150000000
                  WHEN 'MANDIRI'    THEN 200000000
                  ELSE 100000000
                END;

      -- Faktor pertumbuhan: 2023 ~0,83 ; 2024 ~0,89 ; 2025 ~0,95 dari 2026.
      v_factor := 0.83 + (y - 2023) * 0.06;

      v_total := round((v_base + dewi_seed_int(v_seed, 0, 5) * 10000000)
                       * v_factor, -6);

      v_apbdes  := round(v_total * 0.40, -6);
      v_banprov := round(v_total * 0.50, -6);
      v_pades   := v_total - v_apbdes - v_banprov;

      v_realized := round(v_total * (72 + dewi_seed_int(v_seed, 1, 20)) / 100.0, -5);

      v_roll := dewi_seed_int(v_seed, 2, 100);
      v_status := CASE
                    WHEN v_roll < 74 THEN 'VERIFIED'
                    WHEN v_roll < 88 THEN 'SUBMITTED'
                    WHEN v_roll < 95 THEN 'PENDING_UPLOAD'
                    ELSE 'REVISION'
                  END;

      IF v_status = 'PENDING_UPLOAD' THEN
        v_url := NULL;
        v_uploaded := NULL;
      ELSE
        v_url := '/documents/lpj-' || v.slug || '-' || y::text || '.pdf';
        v_uploaded := make_timestamptz(y, 12, 20, 10, 0, 0)
                      - make_interval(days => dewi_seed_int(v_seed, 3, 60));
      END IF;

      INSERT INTO village_grants (
        village_id, fiscal_year, funding_source,
        apbdes_amount, banprov_amount, pades_amount,
        total_allocated, total_realized, remaining_balance,
        lpj_document_url, lpj_status, uploaded_at
      ) VALUES (
        v.id, y, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng',
        v_apbdes, v_banprov, v_pades,
        v_total, v_realized, v_total - v_realized,
        v_url, v_status, v_uploaded
      )
      ON CONFLICT (village_id, fiscal_year) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 1c. village_grants - pecah sumber dana (APBDes/Banprov/PADes) yang masih nol
--
--     Sebagian grant lama hanya menyimpan total_allocated sehingga donut
--     "Sumber Pendanaan Desa" kosong. Bagi dengan komposisi baku 40/50/10 dan
--     sisa pembulatan ke PADes. Guard `= 0` membuat blok ini idempoten.
-- ------------------------------------------------------------------------------
UPDATE village_grants
   SET apbdes_amount  = round(total_allocated * 0.40, -6),
       banprov_amount = round(total_allocated * 0.50, -6),
       pades_amount   = total_allocated
                        - round(total_allocated * 0.40, -6)
                        - round(total_allocated * 0.50, -6)
 WHERE apbdes_amount + banprov_amount + pades_amount = 0
   AND total_allocated > 0;


-- ------------------------------------------------------------------------------
-- 2. grant_expenses - rincian pos belanja untuk tiap LPJ yang masih kosong
--
--    Jumlah pos 3-6 baris per LPJ. Total budget_allocated / amount_realized
--    dibagi rata dari pagu LPJ sehingga jumlah rincian selalu = total LPJ.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  g           RECORD;
  v_seed      TEXT;
  v_n         INT;
  v_i         INT;
  v_idx       INT;
  v_names     TEXT[];
  v_cats      TEXT[];
  v_vols      NUMERIC[];
  v_units     TEXT[];
  v_ba        NUMERIC;
  v_ar        NUMERIC;
  v_left_ba   NUMERIC;
  v_left_ar   NUMERIC;
  v_left_pos  INT;
  v_flagged   BOOLEAN;
BEGIN
  v_names := ARRAY[
    'Paving Block K-300 Area Parkir Wisata',
    'Kanstin Beton Precast Pembatas Parkir',
    'Rehabilitasi Toilet Umum & Instalasi Air Bersih',
    'Papan Interpretasi Wisata & Rambu Edukasi',
    'Pengerasan Jalur Pejalan Kaki Wisata',
    'Renovasi Gazebo & Bangku Taman',
    'Upah Tukang & Tenaga Harian',
    'Upah Pemasangan Rangka Baja',
    'Pembelian APD & Peralatan K3',
    'Pengadaan Kotak P3K & Alat Keselamatan Wisata',
    'Papan Himbauan Keselamatan & Jalur Evakuasi',
    'Honor Petugas Kebersihan & Operasional Harian'
  ];
  v_cats := ARRAY[
    'MATERIAL_FISIK', 'MATERIAL_FISIK', 'MATERIAL_FISIK', 'OPERASIONAL',
    'MATERIAL_FISIK', 'MATERIAL_FISIK', 'UPAH_TENAGA', 'UPAH_TENAGA',
    'KESELAMATAN_K3', 'KESELAMATAN_K3', 'OPERASIONAL', 'OPERASIONAL'
  ];
  v_vols := ARRAY[
    120, 40, 2, 6, 250, 4, 30, 5, 15, 6, 8, 1
  ]::NUMERIC[];
  v_units := ARRAY[
    'M2', 'Batang', 'Unit', 'Unit', 'M2', 'Unit',
    'HOK', 'Hari', 'Set', 'Unit', 'Set', 'Bulan'
  ];

  FOR g IN
    SELECT vg.id AS grant_id, vg.total_allocated, vg.total_realized
      FROM village_grants vg
     WHERE NOT EXISTS (
             SELECT 1 FROM grant_expenses ge WHERE ge.grant_id = vg.id)
     ORDER BY vg.id
  LOOP
    v_seed     := g.grant_id::text;
    v_n        := 3 + dewi_seed_int(v_seed, 0, 4);   -- 3..6 pos
    v_left_ba  := g.total_allocated;
    v_left_ar  := g.total_realized;

    FOR v_i IN 1..v_n LOOP
      v_idx      := 1 + dewi_seed_int(v_seed, v_i, 12);
      v_left_pos := v_n - v_i + 1;

      IF v_left_pos = 1 THEN
        v_ba := v_left_ba;
        v_ar := v_left_ar;
      ELSE
        v_ba := round(v_left_ba / v_left_pos, -5);
        v_ar := round(v_left_ar / v_left_pos, -5);
      END IF;

      v_flagged := dewi_seed_int(v_seed, v_i + 5, 100) < 6;

      INSERT INTO grant_expenses (
        grant_id, activity_name, category, volume, unit,
        claimed_unit_price, budget_allocated, amount_realized, remaining_amount,
        ai_anomaly_flag, anomaly_note
      ) VALUES (
        g.grant_id, v_names[v_idx], v_cats[v_idx], v_vols[v_idx], v_units[v_idx],
        round(v_ba / v_vols[v_idx]), v_ba, v_ar, v_ba - v_ar,
        v_flagged,
        CASE WHEN v_flagged
             THEN 'Indikasi deviasi harga di atas batas wajar SSH Jateng; perlu klarifikasi.'
             ELSE 'Harga satuan sesuai SSH Jateng.' END
      );

      v_left_ba := v_left_ba - v_ba;
      v_left_ar := v_left_ar - v_ar;
    END LOOP;
  END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 2b. Rapikan header LPJ yang tidak sama dengan jumlah rincian pos belanja
--     (memperbaiki data lama: Getas Rp 100 juta vs rincian Rp 62,25 juta).
-- ------------------------------------------------------------------------------
UPDATE village_grants vg
   SET total_allocated   = s.sba,
       total_realized    = s.sar,
       remaining_balance = s.sba - s.sar
  FROM (
    SELECT grant_id,
           SUM(budget_allocated) AS sba,
           SUM(amount_realized)  AS sar
      FROM grant_expenses
     GROUP BY grant_id
  ) s
 WHERE s.grant_id = vg.id
   AND (vg.total_allocated <> s.sba OR vg.total_realized <> s.sar);


-- ------------------------------------------------------------------------------
-- 2c. Aduan lama dari seed desa (867) belum punya daftar foto lampiran;
--     isi agar tiap aduan pasti punya minimal satu foto.
-- ------------------------------------------------------------------------------
UPDATE incident_reports
   SET photo_before_urls = jsonb_build_array(photo_before_url)
 WHERE photo_before_urls IS NULL
    OR photo_before_urls = '[]'::jsonb;


-- ------------------------------------------------------------------------------
-- 3. incident_reports + report_resolutions - aduan warga tiap desa
--
--    Tiap desa yang belum punya aduan mendapat 1-2 aduan. Kode tiket diambil
--    dari sequence `seq_report_code_2026` supaya tidak bentrok. Aduan
--    berstatus RESOLVED langsung diberi bukti perbaikan.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v           RECORD;
  v_seed      TEXT;
  v_n         INT;
  v_i         INT;
  v_idx       INT;
  v_code      TEXT;
  v_report_id UUID;
  v_status    VARCHAR(20);
  v_created   TIMESTAMPTZ;
  v_updated   TIMESTAMPTZ;
  v_cats      TEXT[];
  v_titles    TEXT[];
  v_descs     TEXT[];
  v_photos    TEXT[];
  v_after     TEXT;
  v_officer   TEXT;
  v_roll      INT;
  v_sla_hours INT;
BEGIN
  v_cats := ARRAY[
    'FASILITAS_RUSAK', 'FASILITAS_RUSAK', 'BAHAYA_K3', 'KEBERSIHAN',
    'FASILITAS_RUSAK', 'PUNGLI', 'BAHAYA_K3', 'KEBERSIHAN'
  ];
  v_titles := ARRAY[
    'Papan Informasi Wisata Rusak Termakan Cuaca',
    'Bangku Taman Wisata Patah dan Berbahaya',
    'Jembatan Kayu Akses Wisata Rawan Ambles',
    'Tumpukan Sampah di Jalur Utama Wisata',
    'Lampu Penerangan Jalur Wisata Padam',
    'Pungutan Parkir Liar Tanpa Karcis Resmi',
    'Pagar Pengaman Tebing Jalur Wisata Longsor',
    'Saluran Air Wisata Tersumbat Sampah Daun'
  ];
  v_descs := ARRAY[
    'Papan informasi arah wisata sudah lapuk dan tulisannya tidak terbaca, pengunjung sering tersesat menuju area utama.',
    'Dua bangku taman patah pada bagian penopang sehingga tidak aman diduduki pengunjung, terutama anak-anak.',
    'Papan jembatan kayu penghubung jalur wisata sudah lapuk dan bergoyang saat dilintasi rombongan pengunjung.',
    'Tempat sampah di sepanjang jalur penuh dan sampah berserakan hingga ke area parkir pengunjung.',
    'Enam titik lampu penerangan jalur wisata padam sejak dua minggu terakhir sehingga jalur gelap saat sore.',
    'Petugas tidak resmi meminta biaya parkir tanpa karcis resmi dan pengunjung yang menolak diminta memindahkan kendaraan.',
    'Pagar pengaman di tikungan tebing runtuh termakan longsor dan jalur masih dipakai pengunjung tanpa pembatas pengganti.',
    'Saluran drainase jalur wisata tersumbat daun sehingga air menggenang dan jalur pejalan kaki menjadi licin.'
  ];
  v_photos := ARRAY[
    '/img/figma/toilet-sebelum.png',
    '/img/figma/aduan-sampah.png',
    '/img/figma/curug-sebelum.png',
    '/img/figma/aduan-wastafel.png',
    '/img/figma/aduan-parkir.png',
    '/img/figma/aduan-curug-sebelum.png'
  ];

  FOR v IN
    SELECT tv.id, tv.latitude, tv.longitude, tv.pokdarwis_name
      FROM tourist_villages tv
     WHERE NOT EXISTS (
             SELECT 1 FROM incident_reports r WHERE r.village_id = tv.id)
     ORDER BY tv.id
  LOOP
    v_seed := v.id::text;
    v_n    := 1 + (CASE WHEN dewi_seed_int(v_seed, 0, 4) = 0 THEN 1 ELSE 0 END);

    FOR v_i IN 1..v_n LOOP
      v_idx    := 1 + dewi_seed_int(v_seed, v_i, 8);
      v_roll   := dewi_seed_int(v_seed, v_i + 8, 100);
      v_status := CASE
                    WHEN v_roll < 60 THEN 'RESOLVED'
                    WHEN v_roll < 80 THEN 'IN_PROGRESS'
                    ELSE 'SUBMITTED'
                  END;
      v_sla_hours := CASE WHEN v_cats[v_idx] = 'PUNGLI' THEN 24 ELSE 168 END;

      v_created := CURRENT_TIMESTAMP
                   - make_interval(days => 1 + dewi_seed_int(v_seed, v_i + 3, 60));
      v_updated := v_created
                   + make_interval(hours => 2 + dewi_seed_int(v_seed, v_i + 11, 30));

      v_code := 'LP-JTG-2026-' || lpad(nextval('seq_report_code_2026')::text, 4, '0');

      INSERT INTO incident_reports (
        report_code, village_id, category, title, description,
        photo_before_url, photo_before_urls, latitude, longitude,
        is_anonymous, status, deadline_at, created_at, updated_at
      ) VALUES (
        v_code, v.id, v_cats[v_idx], v_titles[v_idx], v_descs[v_idx],
        v_photos[1 + dewi_seed_int(v_seed, v_i + 13, array_length(v_photos, 1))],
        jsonb_build_array(v_photos[1 + dewi_seed_int(v_seed, v_i + 13, array_length(v_photos, 1))]),
        v.latitude  + (dewi_seed_int(v_seed, v_i + 1, 11) - 5) / 1000.0,
        v.longitude + (dewi_seed_int(v_seed, v_i + 2, 11) - 5) / 1000.0,
        dewi_seed_int(v_seed, v_i + 7, 2) = 1,
        v_status,
        v_created + make_interval(hours => v_sla_hours),
        v_created,
        v_updated
      )
      RETURNING id INTO v_report_id;

      IF v_status = 'RESOLVED' THEN
        v_after   := v_photos[1 + dewi_seed_int(v_seed, v_i + 17, array_length(v_photos, 1))];
        v_officer := (ARRAY[
          'Teknisi Sarpras Pokdarwis ',
          'Koordinator Lapangan Pokdarwis ',
          'Tim Pemeliharaan Desa Wisata ',
          'Koordinator Sarpras Pokdarwis '
        ])[1 + dewi_seed_int(v_seed, v_i + 19, 4)] || v.pokdarwis_name;

        INSERT INTO report_resolutions (
          report_id, action_summary, photo_after_url, officer_name,
          exif_timestamp_verified, exif_photo_date, resolved_at
        ) VALUES (
          v_report_id,
          'Perbaikan dikerjakan sesuai rekomendasi teknis: material diganti, area dibersihkan, '
            || 'dan dipasang pengaman tambahan agar tidak terulang.',
          CASE
            WHEN v_after LIKE '%sebelum%'
              THEN replace(v_after, 'sebelum', 'sesudah')
            ELSE '/img/figma/curug-sesudah.png'
          END,
          v_officer,
          TRUE,
          v_created + make_interval(days => 2),
          v_created + make_interval(days => 2)
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 5. Sinkronkan sequence kode aduan dengan data terbaru
-- ------------------------------------------------------------------------------
SELECT setval(
  'seq_report_code_2026',
  COALESCE((
    SELECT MAX(SUBSTRING(report_code FROM '(\d+)$')::bigint)
      FROM incident_reports
     WHERE report_code LIKE 'LP-JTG-2026-%'
  ), 100),
  true
);


-- ------------------------------------------------------------------------------
-- 6. Ringkasan hasil seed
-- ------------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM tourist_villages)                        AS desa_total,
  (SELECT COUNT(*) FROM village_grants)                          AS grants,
  (SELECT COUNT(DISTINCT fiscal_year) FROM village_grants)       AS tahun_anggaran,
  (SELECT COUNT(*) FROM village_grants
    WHERE apbdes_amount + banprov_amount + pades_amount = 0)     AS grant_sumber_dana_kosong,
  (SELECT COUNT(*) FROM grant_expenses)                          AS expenses,
  (SELECT COUNT(*) FROM incident_reports)                        AS reports,
  (SELECT COUNT(*) FROM report_resolutions)                      AS resolutions,
  (SELECT COUNT(*) FROM tourist_villages tv
    WHERE NOT EXISTS (SELECT 1 FROM village_grants vg
                       WHERE vg.village_id = tv.id))             AS desa_tanpa_grant,
  (SELECT COUNT(*) FROM tourist_villages tv
    WHERE (SELECT COUNT(DISTINCT vg.fiscal_year) FROM village_grants vg
            WHERE vg.village_id = tv.id) < 4)                    AS desa_grant_kurang_4_tahun,
  (SELECT COUNT(*) FROM tourist_villages tv
    WHERE NOT EXISTS (SELECT 1 FROM incident_reports r
                       WHERE r.village_id = tv.id))              AS desa_tanpa_aduan;

-- <<< END seed-demo-full.sql >>>

-- >>> BEGIN seed-finance-bulk.sql <<<
-- ==============================================================================
-- DEWI JATENG - Isi monitoring keuangan untuk banyak desa (demo)
--
-- `seed-demo.sql` hanya mengisi 4 desa (sesuai desain Figma), sehingga tabel
-- "Keuangan desa wisata" pada dashboard hanya berisi 4 baris sementara 868 desa
-- dipantau. Berkas ini menurunkan transaksi dari pos belanja LPJ TA 2026 untuk
-- 120 desa terverifikasi lainnya supaya pemantauan tidak tampak kosong.
--
-- Idempoten: desa yang sudah punya transaksi dilewati, dan `reference_code`
-- memakai awalan 1xxxx/2xxxx yang tidak dipakai seed lain.
-- ==============================================================================

BEGIN;

CREATE TEMP TABLE bulk_target ON COMMIT DROP AS
SELECT vg.village_id,
       vg.id            AS grant_id,
       vg.total_allocated,
       COALESCE(u.full_name, 'Pengelola desa') AS manager,
       row_number() OVER (ORDER BY tv.name)    AS i
  FROM village_grants vg
  JOIN tourist_villages tv ON tv.id = vg.village_id
  LEFT JOIN users u ON u.village_id = vg.village_id AND u.role = 'desa'
 WHERE vg.fiscal_year = 2026
   AND vg.lpj_status = 'VERIFIED'
   AND NOT EXISTS (SELECT 1 FROM village_transactions vt WHERE vt.village_id = vg.village_id)
 ORDER BY tv.name
 LIMIT 120;

CREATE TEMP TABLE bulk_exp ON COMMIT DROP AS
SELECT b.i,
       ge.activity_name,
       ge.category,
       ge.amount_realized,
       row_number() OVER (PARTITION BY b.i ORDER BY ge.amount_realized DESC) AS rn
  FROM bulk_target b
  JOIN grant_expenses ge ON ge.grant_id = b.grant_id;

CREATE TEMP TABLE bulk_sum ON COMMIT DROP AS
SELECT i, SUM(amount_realized) AS exp_sum
  FROM bulk_exp
 WHERE rn <= 3
 GROUP BY i;

-- Saldo awal periode: 5% pagu, dibulatkan ke juta (minimal Rp 5 juta).
INSERT INTO village_opening_balances (village_id, period, amount)
SELECT village_id,
       '2026-10',
       GREATEST(5000000, round(total_allocated * 0.05 / 1000000) * 1000000)
  FROM bulk_target
ON CONFLICT (village_id, period) DO NOTHING;

-- Pemasukan (total ~115% dari realisasi belanja -> surplus ~15%).
INSERT INTO village_transactions (
    village_id, type, reference_code, title, category, transaction_date,
    amount, payment_method, counterparty, note, proof_file_name,
    proof_file_size_kb, proof_uploaded_by, recorded_by, recorded_at
)
SELECT b.village_id, 'PEMASUKAN',
       'PM-2026-1' || lpad(b.i::text, 4, '0'),
       'Penerimaan tiket wisata desa', 'Tiket wisata',
       DATE '2026-10-03' + ((5 * b.i) % 25)::int,
       GREATEST(1000000, round(s.exp_sum * 0.70 / 100000) * 100000),
       'Setoran ke rekening desa', 'Loket tiket desa wisata',
       'Rekap penerimaan tiket periode berjalan.',
       'bukti-PM-2026-1' || lpad(b.i::text, 4, '0') || '.pdf', 180 + (b.i % 90),
       b.manager, b.manager,
       ((DATE '2026-10-03' + ((5 * b.i) % 25)::int) + TIME '16:20') AT TIME ZONE 'Asia/Jakarta'
  FROM bulk_target b
  JOIN bulk_sum s ON s.i = b.i;

INSERT INTO village_transactions (
    village_id, type, reference_code, title, category, transaction_date,
    amount, payment_method, counterparty, note, proof_file_name,
    proof_file_size_kb, proof_uploaded_by, recorded_by, recorded_at
)
SELECT b.village_id, 'PEMASUKAN',
       'PM-2026-2' || lpad(b.i::text, 4, '0'),
       'Dukungan anggaran desa wisata', 'Dukungan anggaran',
       DATE '2026-10-18' + ((3 * b.i) % 12)::int,
       GREATEST(1000000, round(s.exp_sum * 0.45 / 100000) * 100000),
       'Transfer bank', 'Pemerintah Desa',
       'Dukungan pendampingan dan promosi wisata.',
       'bukti-PM-2026-2' || lpad(b.i::text, 4, '0') || '.pdf', 160 + (b.i % 80),
       b.manager, b.manager,
       ((DATE '2026-10-18' + ((3 * b.i) % 12)::int) + TIME '14:10') AT TIME ZONE 'Asia/Jakarta'
  FROM bulk_target b
  JOIN bulk_sum s ON s.i = b.i;

-- Pengeluaran: 3 pos belanja terbesar dari LPJ TA 2026.
INSERT INTO village_transactions (
    village_id, type, reference_code, title, category, transaction_date,
    amount, payment_method, counterparty, note, proof_file_name,
    proof_file_size_kb, proof_uploaded_by, recorded_by, recorded_at
)
SELECT b.village_id, 'PENGELUARAN',
       'PK-2026-' || e.rn::text || lpad(b.i::text, 4, '0'),
       left(e.activity_name, 200),
       CASE e.category
         WHEN 'UPAH_TENAGA'    THEN 'SDM'
         WHEN 'MATERIAL_FISIK' THEN 'Material'
         WHEN 'KESELAMATAN_K3' THEN 'Keselamatan'
         ELSE 'Operasional'
       END,
       DATE '2026-10-06' + ((b.i * 7 + e.rn * 4) % 24)::int,
       GREATEST(500000, e.amount_realized),
       'Transfer bank', 'Rekanan desa',
       'Realisasi pos belanja LPJ TA 2026.',
       'bukti-PK-2026-' || e.rn::text || lpad(b.i::text, 4, '0') || '.pdf',
       150 + (b.i % 120),
       b.manager, b.manager,
       ((DATE '2026-10-06' + ((b.i * 7 + e.rn * 4) % 24)::int) + TIME '13:30') AT TIME ZONE 'Asia/Jakarta'
  FROM bulk_target b
  JOIN bulk_exp e ON e.i = b.i
 WHERE e.rn <= 3;

COMMIT;

-- <<< END seed-finance-bulk.sql >>>

-- Safety backfill koordinat PostGIS
UPDATE tourist_villages
SET geom = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
WHERE geom IS NULL;
__DEWI_JATENG_SQL_EOF__

echo "=== [3/5] Menyiapkan SSL/TLS & image postgis/postgis:16-3.4 ==="
docker pull postgis/postgis:16-3.4

SSL_QUERY=""
if [ "$ENABLE_SSL" = "true" ] && command -v openssl >/dev/null 2>&1; then
  mkdir -p "$DB_DIR/ssl"
  if [ ! -f "$DB_DIR/ssl/server.crt" ] || [ ! -f "$DB_DIR/ssl/server.key" ]; then
    openssl req -new -x509 -days 3650 -nodes \
      -subj "/CN=dewijateng-db" \
      -out "$DB_DIR/ssl/server.crt" \
      -keyout "$DB_DIR/ssl/server.key" >/dev/null 2>&1
  fi
  chmod 600 "$DB_DIR/ssl/server.key"
  chmod 644 "$DB_DIR/ssl/server.crt"
  docker run --rm -v "$DB_DIR/ssl:/ssl" --entrypoint chown \
    postgis/postgis:16-3.4 postgres:postgres /ssl/server.key /ssl/server.crt
  SSL_QUERY="?sslmode=no-verify"
  echo "SSL aktif (sertifikat tersimpan di $DB_DIR/ssl)"
else
  ENABLE_SSL="false"
  echo "SSL dinonaktifkan (koneksi TCP standar)"
fi

echo "=== [4/5] Menjalankan container PostgreSQL + PostGIS ($CONTAINER_NAME) ==="
VOLUME_EXISTED="false"
if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  VOLUME_EXISTED="true"
  echo "Info: Volume '$VOLUME_NAME' sudah ada. Data lama dipertahankan (gunakan --reset jika ingin seed ulang)."
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

if [ "$ENABLE_SSL" = "true" ]; then
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "${POSTGRES_PORT}:5432" \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    -v "${DB_DIR}/init-all.sql:/docker-entrypoint-initdb.d/20-init-all.sql:ro" \
    -v "${DB_DIR}/ssl/server.crt:/etc/postgresql/ssl/server.crt:ro" \
    -v "${DB_DIR}/ssl/server.key:/etc/postgresql/ssl/server.key:ro" \
    postgis/postgis:16-3.4 \
    postgres \
    -c ssl=on \
    -c ssl_cert_file=/etc/postgresql/ssl/server.crt \
    -c ssl_key_file=/etc/postgresql/ssl/server.key \
    -c max_connections=150 >/dev/null
else
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "${POSTGRES_PORT}:5432" \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    -v "${DB_DIR}/init-all.sql:/docker-entrypoint-initdb.d/20-init-all.sql:ro" \
    postgis/postgis:16-3.4 \
    postgres \
    -c max_connections=150 >/dev/null
fi

echo "=== [5/5] Menunggu inisialisasi skema & seed selesai ==="
READY="false"
for _ in $(seq 1 90); do
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "ERROR: Container berhenti tak terduga. Log terakhir:"
    docker logs --tail 50 "$CONTAINER_NAME" || true
    exit 1
  fi
  if docker exec "$CONTAINER_NAME" pg_isready -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    if docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER_NAME" \
      psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM tourist_villages LIMIT 1;" >/dev/null 2>&1; then
      READY="true"
      break
    fi
  fi
  sleep 2
done

if [ "$READY" != "true" ]; then
  echo "ERROR: Timeout menunggu database siap. Cek log dengan: docker logs $CONTAINER_NAME"
  exit 1
fi

echo ""
echo "Ringkasan isi database:"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER_NAME" \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
SELECT
  (SELECT count(*) FROM tourist_villages) AS desa,
  (SELECT count(*) FROM ssh_reference_rates) AS ssh_hsd,
  (SELECT count(*) FROM village_grants) AS grants,
  (SELECT count(*) FROM grant_expenses) AS expenses,
  (SELECT count(*) FROM incident_reports) AS reports,
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM village_transactions) AS transactions;
"

PUBLIC_IP="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo 'IP_PUBLIC_VPS')"
SESSION_SECRET_GEN="$(rand_hex 32)"
REPORTER_SALT_GEN="$(rand_hex 32)"

echo "======================================================================"
echo " DATABASE BERHASIL DIDEPLOY!"
echo "======================================================================"
echo "1. Pastikan port TCP $POSTGRES_PORT terbuka di firewall VPS:"
echo "   sudo ufw allow ${POSTGRES_PORT}/tcp"
echo "   (dan buka Inbound TCP $POSTGRES_PORT di Firewall/Security Group cloud provider)"
echo ""
echo "2. Salin Environment Variables ini ke Vercel -> Settings -> Environment Variables:"
echo "   DATABASE_URL        = postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${PUBLIC_IP}:${POSTGRES_PORT}/${POSTGRES_DB}${SSL_QUERY}"
echo "   NEXT_PUBLIC_APP_URL = https://domain-vercel-kamu.vercel.app"
echo "   SESSION_SECRET      = ${SESSION_SECRET_GEN}"
echo "   REPORTER_HASH_SALT  = ${REPORTER_SALT_GEN}"
echo ""
echo "3. Setelah simpan di Vercel, lakukan Redeploy."
if [ "$VOLUME_EXISTED" = "true" ]; then
  echo "   (Catatan: volume lama dipakai ulang; jika ingin reset data & seed ulang, jalankan dengan --reset)"
fi
echo "======================================================================"
