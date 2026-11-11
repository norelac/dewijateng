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
