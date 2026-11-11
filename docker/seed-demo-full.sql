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
