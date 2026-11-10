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
-- 4c. Akun Demo Awal: Admin Dispora & Pengelola Desa Wisata Candirejo
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role, village_id, full_name, phone, status, must_change_password) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'dispora',
    'pbkdf2$10000$58dc4fdbe2bc9641be3a7b67a3da17d3$928da298f6796161a91db390e23d804fcbde16b67f40458cb7cd403b13908969de1765f6c57c41da827d3b35b40304aa7179b1dca9940fc34c0a43733ac8b6b9',
    'dispora',
    NULL,
    'Admin Eksekutif Dispora Jateng',
    '081122334455',
    'AKTIF',
    false
),
(
    'e0000000-0000-0000-0000-000000000002',
    'desa-candirejo',
    'pbkdf2$10000$6cff3c501f59dfe02a2379ec35bb5e8b$675ca8fa45b9f676a5ec2ae35a9243ec35c351e9de1c9ef579ae65234d465b1855877166e6b7956e9cfae3b9db2ec4965d3f2b3c13ff56e32c1d41ce4595357e',
    'desa',
    'a0000000-0000-0000-0000-000000000002',
    'Pengelola Desa Wisata Candirejo',
    '081234567802',
    'AKTIF',
    false
)
ON CONFLICT (username) DO NOTHING;

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
BEGIN
    SELECT count(*) INTO v_count FROM tourist_villages;
    SELECT count(*) INTO g_count FROM village_grants;
    SELECT count(*) INTO e_count FROM grant_expenses;
    SELECT count(*) INTO r_count FROM incident_reports;
    SELECT count(*) INTO res_count FROM report_resolutions;
    RAISE NOTICE 'Seed selesai: % desa, % grant, % pos belanja, % laporan, % bukti perbaikan',
        v_count, g_count, e_count, r_count, res_count;
END
$$;
