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
