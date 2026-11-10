-- ==============================================================================
-- DEWI JATENG - Database Schema & Initial Seeder (PostgreSQL 16 + PostGIS 3.4)
-- Repositori: /Users/ilham/Documents/development/matics/dewijateng
-- ==============================================================================

-- 1. Mengaktifkan ekstensi geospasial & UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing tables jika migrasi ulang
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
-- TABEL 2: official_tariffs (Tarif Resmi Sesuai Perdes / JADESTA Kemenparekraf)
-- ==============================================================================
CREATE TABLE official_tariffs (
    id BIGSERIAL PRIMARY KEY,
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    tariff_type VARCHAR(30) CHECK (tariff_type IN ('ENTRY_TICKET', 'PARKING_MOTOR', 'PARKING_CAR', 'PACKAGE_TOUR')) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tariffs_village ON official_tariffs(village_id);

-- ==============================================================================
-- TABEL 3: village_grants (Dokumen LPJ Bantuan Keuangan Pemprov / APBDes)
-- ==============================================================================
CREATE TABLE village_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL, -- 2024, 2025, 2026
    funding_source VARCHAR(150) NOT NULL, -- Bantuan Keuangan Pemprov Jateng / APBDes
    total_allocated DECIMAL(15, 2) NOT NULL, -- Pagu Bantuan Diterima
    total_realized DECIMAL(15, 2) DEFAULT 0.00, -- Total Realisasi Belanja Modal
    remaining_balance DECIMAL(15, 2) DEFAULT 0.00, -- Sisa Saldo Kas
    lpj_document_url VARCHAR(255) NULL, -- Tautan berkas asli LPJ (PDF)
    lpj_status VARCHAR(20) CHECK (lpj_status IN ('PENDING_UPLOAD', 'SUBMITTED', 'VERIFIED', 'REVISION')) DEFAULT 'PENDING_UPLOAD',
    lpj_review_notes TEXT NULL, -- Catatan verifikator Dispora saat revisi / verifikasi
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
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326),
    is_anonymous BOOLEAN DEFAULT TRUE,
    reporter_contact_hash VARCHAR(64) NULL, -- SHA-256 hash nomor kontak pelapor
    status VARCHAR(20) CHECK (status IN ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'SUBMITTED',
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
-- TABEL 8: users (Akun Pengguna Sistem - Dispora & Pengelola Desa)
-- ==============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('desa', 'dispora')) NOT NULL,
    village_id UUID NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    status VARCHAR(20) CHECK (status IN ('AKTIF', 'NONAKTIF')) DEFAULT 'AKTIF',
    must_change_password BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_village CHECK (
        (role = 'desa' AND village_id IS NOT NULL) OR
        (role = 'dispora' AND village_id IS NULL)
    )
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_village ON users(village_id);



-- ==============================================================================
-- TRIGGER GEOSPASIAL OTOMATIS: Update kolom 'geom' dari lat & long
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_geom_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
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
-- SEED DATA: Tarif Resmi Sesuai Perdes Desa Wisata
-- ==============================================================================
INSERT INTO official_tariffs (village_id, item_name, tariff_type, price, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Tiket Masuk Kawasan Curug Kembar', 'ENTRY_TICKET', 10000.00, true),
('a0000000-0000-0000-0000-000000000001', 'Parkir Sepeda Motor Resmi', 'PARKING_MOTOR', 2000.00, true),
('a0000000-0000-0000-0000-000000000001', 'Parkir Mobil Pribadi Resmi', 'PARKING_CAR', 5000.00, true),
('a0000000-0000-0000-0000-000000000002', 'Tiket Masuk Desa Candirejo', 'ENTRY_TICKET', 15000.00, true),
('a0000000-0000-0000-0000-000000000002', 'Parkir Motor Wisatawan', 'PARKING_MOTOR', 3000.00, true),
('a0000000-0000-0000-0000-000000000002', 'Paket Keliling Dokar Wisata', 'PACKAGE_TOUR', 150000.00, true),
('a0000000-0000-0000-0000-000000000003', 'Tiket Masuk Watu Mujur', 'ENTRY_TICKET', 7000.00, true),
('a0000000-0000-0000-0000-000000000003', 'Parkir Motor', 'PARKING_MOTOR', 2000.00, true);


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
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', 100000000.00, 70500000.00, 29500000.00, '/documents/lpj-desa-getas-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 2026, 'Bantuan Keuangan Pemprov Jateng TA 2026', 150000000.00, 142000000.00, 8000000.00, '/documents/lpj-candirejo-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '15 days'),
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
ALTER TABLE official_tariffs ENABLE ROW LEVEL SECURITY;
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

-- 2. official_tariffs
CREATE POLICY "official_tariffs_select_public" ON official_tariffs FOR SELECT TO public USING (is_active = true OR auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "official_tariffs_all_auth" ON official_tariffs FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

-- 3. village_grants
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
