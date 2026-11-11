// ==============================================================================
// DEWI JATENG - Finance Monitoring Service (Fase 4)
//
// Membaca `village_transactions` + `village_opening_balances` untuk layar
// "Monitoring keuangan" Disbudparekraf. Semua fungsi di sini BACA SAJA: dinas
// memantau dan mengunduh, pencatatan transaksi dilakukan pengelola desa.
//
// Cakupan desa = desa yang punya akun pengelola (`users.role = 'desa'`), sama
// seperti daftar pada layar "Akun desa wisata".
// ==============================================================================

import { query } from '@/lib/db';
import {
  shortVillageName,
  type CashflowBucket,
  type DashboardFinance,
  type FinanceRecap,
  type Kelengkapan,
  type MonitoredVillage,
  type TransactionDetail,
  type TransactionListResult,
  type TransactionSummary,
  type TransactionType,
  type VillageFinanceRow,
  type VillageFinanceSummary,
} from '@/lib/finance';

// Tipe dan pemformat ringkasan ada di `@/lib/finance` (tanpa impor basis data,
// aman untuk komponen klien). Diekspor ulang agar pemanggil lama tetap bekerja.
export * from '@/lib/finance';

// ------------------------------------------------------------------------------
// Helper internal (berkaitan dengan kueri)
// ------------------------------------------------------------------------------

/** Rentang tanggal setengah-terbuka [awal, akhir) untuk periode YYYY-MM. */
function periodRange(period: string): { start: string; end: string } {
  const [y, m] = period.split('-').map((v) => Number.parseInt(v, 10));
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end };
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Timestamp (Date, ISO string, atau epoch ms) -> "9 November 2026". */
function tanggalDiperbarui(value: unknown): string | null {
  if (!value) return null;
  const d =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value)
        : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function deriveKelengkapan(jumlahTransaksi: number, tanpaBukti: number): Kelengkapan {
  if (jumlahTransaksi === 0) return 'BELUM_LAPOR';
  return tanpaBukti > 0 ? 'PERLU_BUKTI' : 'LENGKAP';
}

// ------------------------------------------------------------------------------
// Daftar desa yang dipantau
// ------------------------------------------------------------------------------

const MONITORED_SQL = `
  SELECT DISTINCT ON (tv.id)
         tv.id   AS village_id,
         tv.slug,
         tv.name,
         tv.regency,
         tv.district,
         u.full_name AS manager_name,
         u.email     AS manager_email
    FROM tourist_villages tv
    LEFT JOIN users u ON u.village_id = tv.id AND u.role = 'desa'
   ORDER BY tv.id, u.created_at ASC
`;

function mapVillage(row: any): MonitoredVillage {
  return {
    villageId: row.village_id,
    slug: row.slug,
    name: row.name,
    shortName: shortVillageName(row.name),
    regency: row.regency,
    district: row.district,
    managerName: row.manager_name,
    managerEmail: row.manager_email,
  };
}

export async function getMonitoredVillages(): Promise<MonitoredVillage[]> {
  const res = await query<any>(MONITORED_SQL);
  return res.rows.map(mapVillage).sort((a, b) => a.shortName.localeCompare(b.shortName));
}

/** Periode yang tersedia (dari data transaksi), terbaru lebih dulu. */
export async function getAvailablePeriods(): Promise<string[]> {
  const res = await query<any>(
    `SELECT DISTINCT to_char(transaction_date, 'YYYY-MM') AS period
       FROM village_transactions
      ORDER BY period DESC`
  );
  const periods = res.rows.map((r) => String(r.period));
  if (periods.length > 0) return periods;
  const now = new Date();
  return [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
}

// ------------------------------------------------------------------------------
// Rekap keuangan seluruh desa
// ------------------------------------------------------------------------------

/** Agregat baris rekap (dipakai untuk total keseluruhan dan total terfilter). */
function sumTotals(rows: VillageFinanceRow[]): FinanceRecap['totals'] {
  return {
    pemasukan: rows.reduce((s, r) => s + r.pemasukan, 0),
    pengeluaran: rows.reduce((s, r) => s + r.pengeluaran, 0),
    surplus: rows.reduce((s, r) => s + r.surplus, 0),
    saldoAwal: rows.reduce((s, r) => s + r.saldoAwal, 0),
    saldoAkhir: rows.reduce((s, r) => s + r.saldoAkhir, 0),
    desaMelapor: rows.filter((r) => r.kelengkapan !== 'BELUM_LAPOR').length,
    desaTotal: rows.length,
    lengkap: rows.filter((r) => r.kelengkapan === 'LENGKAP').length,
    perluBukti: rows.filter((r) => r.kelengkapan === 'PERLU_BUKTI').length,
    belumLapor: rows.filter((r) => r.kelengkapan === 'BELUM_LAPOR').length,
  };
}

/**
 * Rekap per desa untuk satu periode.
 *
 * ponytail: agregasi diambil untuk seluruh desa terdaftar (868 baris) lalu
 * disaring di memori, karena `kelengkapan` adalah nilai turunan. Kalau kelak
 * jumlah desa naik ke puluhan ribu, pindahkan penyaringan ke SQL.
 */
export async function getFinanceRecap(options: {
  periode?: string;
  wilayah?: string;
  desa?: string;
  kelengkapan?: Kelengkapan | 'SEMUA';
  page?: number;
  perPage?: number;
}): Promise<FinanceRecap> {
  const periods = await getAvailablePeriods();
  const periode = options.periode && periods.includes(options.periode)
    ? options.periode
    : periods[0];
  const { start, end } = periodRange(periode);

  const agg = await query<any>(
    `SELECT tv.id AS village_id,
            COALESCE(SUM(CASE WHEN vt.type = 'PEMASUKAN' THEN vt.amount END), 0)   AS pemasukan,
            COALESCE(SUM(CASE WHEN vt.type = 'PENGELUARAN' THEN vt.amount END), 0) AS pengeluaran,
            COUNT(vt.id)                                                          AS jumlah_transaksi,
            COUNT(vt.id) FILTER (WHERE vt.proof_file_name IS NULL)                 AS jumlah_tanpa_bukti,
            COALESCE(ob.amount, 0)                                                AS saldo_awal,
            MAX(vt.recorded_at)                                                   AS diperbarui
       FROM tourist_villages tv
       LEFT JOIN village_transactions vt
              ON vt.village_id = tv.id
             AND vt.transaction_date >= $1::date
             AND vt.transaction_date < $2::date
       LEFT JOIN village_opening_balances ob
              ON ob.village_id = tv.id AND ob.period = $3
      GROUP BY tv.id, ob.amount`,
    [start, end, periode]
  );

  const villages = await getMonitoredVillages();
  const aggById = new Map<string, any>(agg.rows.map((r) => [String(r.village_id), r]));

  const rows: VillageFinanceRow[] = villages.map((v) => {
    const a = aggById.get(v.villageId);
    const pemasukan = num(a?.pemasukan);
    const pengeluaran = num(a?.pengeluaran);
    const saldoAwal = num(a?.saldo_awal);
    const jumlahTransaksi = num(a?.jumlah_transaksi);
    const jumlahTanpaBukti = num(a?.jumlah_tanpa_bukti);
    return {
      ...v,
      pemasukan,
      pengeluaran,
      saldoAwal,
      saldoAkhir: saldoAwal + pemasukan - pengeluaran,
      surplus: pemasukan - pengeluaran,
      jumlahTransaksi,
      jumlahTanpaBukti,
      kelengkapan: deriveKelengkapan(jumlahTransaksi, jumlahTanpaBukti),
    };
  });

  const totals = sumTotals(rows);

  // Desa yang sudah melapor tampil lebih dulu supaya halaman pertama rekap
  // tidak penuh baris kosong ketika cakupan sudah mencakup seluruh desa.
  const rowsSorted = [...rows].sort((a, b) => {
    const aKosong = a.kelengkapan === 'BELUM_LAPOR' ? 1 : 0;
    const bKosong = b.kelengkapan === 'BELUM_LAPOR' ? 1 : 0;
    if (aKosong !== bKosong) return aKosong - bKosong;
    if (aKosong === 0 && b.jumlahTransaksi !== a.jumlahTransaksi) {
      return b.jumlahTransaksi - a.jumlahTransaksi;
    }
    return a.shortName.localeCompare(b.shortName);
  });

  const wilayah = options.wilayah || '';
  const desa = options.desa || '';
  const kelengkapan = options.kelengkapan || 'SEMUA';

  const filtered = rowsSorted.filter((row) => {
    if (wilayah && row.regency !== wilayah) return false;
    if (desa && row.slug !== desa) return false;
    if (kelengkapan !== 'SEMUA' && row.kelengkapan !== kelengkapan) return false;
    return true;
  });

  const perPage = options.perPage ?? 6;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(options.page ?? 1, 1), totalPages);

  const diperbarui =
    agg.rows
      .map((r) => r.diperbarui)
      .filter(Boolean)
      .map((value: unknown) => new Date(String(value)).getTime())
      .sort((a: number, b: number) => b - a)
      .map((ms: number) => tanggalDiperbarui(ms))
      .find(Boolean) ?? null;

  return {
    rows: filtered.slice((page - 1) * perPage, page * perPage),
    totals,
    filteredTotals: sumTotals(filtered),
    wilayahOptions: Array.from(new Set(villages.map((v) => v.regency))).sort(),
    desaOptions: villages.map((v) => ({ slug: v.slug, name: v.shortName })),
    active: { periode, wilayah, desa, kelengkapan },
    page,
    perPage,
    total,
    totalPages,
    diperbarui,
  };
}

// ------------------------------------------------------------------------------
// Ringkasan satu desa
// ------------------------------------------------------------------------------

async function findMonitoredVillage(slug: string): Promise<MonitoredVillage | null> {
  const monitored = await getMonitoredVillages();
  const found = monitored.find((v) => v.slug === slug);
  if (found) return found;

  // Desa terdaftar tetapi belum punya akun pengelola: tetap boleh dipantau.
  const fallback = await query<any>(
    `SELECT id AS village_id, slug, name, regency, district, NULL AS manager_name, NULL AS manager_email
       FROM tourist_villages WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return fallback.rows.length > 0 ? mapVillage(fallback.rows[0]) : null;
}

export async function getVillageFinance(
  slug: string,
  periodeInput?: string
): Promise<VillageFinanceSummary | null> {
  const village = await findMonitoredVillage(slug);
  if (!village) return null;

  const periods = await getAvailablePeriods();
  const periode = periodeInput && periods.includes(periodeInput) ? periodeInput : periods[0];
  const { start, end } = periodRange(periode);

  const summaryRes = await query<any>(
    `SELECT COALESCE(SUM(CASE WHEN type = 'PEMASUKAN' THEN amount END), 0)   AS pemasukan,
            COALESCE(SUM(CASE WHEN type = 'PENGELUARAN' THEN amount END), 0) AS pengeluaran,
            COUNT(*)                                                       AS jumlah_transaksi,
            COUNT(*) FILTER (WHERE type = 'PEMASUKAN')                      AS jumlah_pemasukan,
            COUNT(*) FILTER (WHERE type = 'PENGELUARAN')                    AS jumlah_pengeluaran,
            COUNT(*) FILTER (WHERE proof_file_name IS NULL)                 AS jumlah_tanpa_bukti,
            MAX(recorded_at)                                               AS diperbarui
       FROM village_transactions
      WHERE village_id = $1
        AND transaction_date >= $2::date
        AND transaction_date < $3::date`,
    [village.villageId, start, end]
  );
  const s = summaryRes.rows[0] ?? {};

  const openingRes = await query<any>(
    `SELECT amount FROM village_opening_balances WHERE village_id = $1 AND period = $2 LIMIT 1`,
    [village.villageId, periode]
  );
  const saldoAwal = num(openingRes.rows[0]?.amount);
  const pemasukan = num(s.pemasukan);
  const pengeluaran = num(s.pengeluaran);
  const jumlahTransaksi = num(s.jumlah_transaksi);
  const jumlahTanpaBukti = num(s.jumlah_tanpa_bukti);

  // Empat pekan: 1-7, 8-14, 15-21, 22-akhir bulan (mengikuti desain 422:665).
  const bucketRes = await query<any>(
    `SELECT CASE
              WHEN EXTRACT(DAY FROM transaction_date) <= 7  THEN 0
              WHEN EXTRACT(DAY FROM transaction_date) <= 14 THEN 1
              WHEN EXTRACT(DAY FROM transaction_date) <= 21 THEN 2
              ELSE 3
            END AS bucket,
            COALESCE(SUM(CASE WHEN type = 'PEMASUKAN' THEN amount END), 0)   AS pemasukan,
            COALESCE(SUM(CASE WHEN type = 'PENGELUARAN' THEN amount END), 0) AS pengeluaran
       FROM village_transactions
      WHERE village_id = $1
        AND transaction_date >= $2::date
        AND transaction_date < $3::date
      GROUP BY bucket
      ORDER BY bucket`,
    [village.villageId, start, end]
  );
  const monthShort = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
    new Date(`${start}T00:00:00`)
  );
  const bucketLabels = [
    `1–7 ${monthShort}`,
    `8–14 ${monthShort}`,
    `15–21 ${monthShort}`,
    `22–31 ${monthShort}`,
  ];
  const cashflow: CashflowBucket[] = bucketLabels.map((label, index) => {
    const row = bucketRes.rows.find((r) => num(r.bucket) === index);
    return {
      label,
      pemasukan: num(row?.pemasukan),
      pengeluaran: num(row?.pengeluaran),
    };
  });

  const recentRes = await query<any>(
    `SELECT id, reference_code, type, title, category,
            to_char(transaction_date, 'YYYY-MM-DD') AS transaction_date, amount,
            (proof_file_name IS NOT NULL) AS has_proof
       FROM village_transactions
      WHERE village_id = $1
        AND transaction_date >= $2::date
        AND transaction_date < $3::date
      ORDER BY transaction_date DESC, recorded_at DESC
      LIMIT 6`,
    [village.villageId, start, end]
  );

  return {
    village,
    periode,
    diperbarui: tanggalDiperbarui(s.diperbarui),
    pemasukan,
    pengeluaran,
    surplus: pemasukan - pengeluaran,
    saldoAwal,
    saldoAkhir: saldoAwal + pemasukan - pengeluaran,
    jumlahTransaksi,
    jumlahPemasukan: num(s.jumlah_pemasukan),
    jumlahPengeluaran: num(s.jumlah_pengeluaran),
    jumlahTanpaBukti,
    kelengkapan: deriveKelengkapan(jumlahTransaksi, jumlahTanpaBukti),
    cashflow,
    recent: recentRes.rows.map(mapTransactionSummary),
  };
}

function mapTransactionSummary(row: any): TransactionSummary {
  return {
    id: String(row.id),
    referenceCode: row.reference_code,
    type: row.type,
    title: row.title,
    category: row.category,
    transactionDate:
      row.transaction_date instanceof Date
        ? row.transaction_date.toISOString().slice(0, 10)
        : String(row.transaction_date).slice(0, 10),
    amount: num(row.amount),
    hasProof: Boolean(row.has_proof),
  };
}

// ------------------------------------------------------------------------------
// Daftar transaksi per jenis
// ------------------------------------------------------------------------------

export async function listTransactions(options: {
  slug: string;
  type: TransactionType;
  periode?: string;
  q?: string;
  kategori?: string;
  bukti?: 'SEMUA' | 'LENGKAP' | 'PERLU_BUKTI';
  page?: number;
  perPage?: number;
}): Promise<TransactionListResult | null> {
  const village = await findMonitoredVillage(options.slug);
  if (!village) return null;

  const periods = await getAvailablePeriods();
  const periode = options.periode && periods.includes(options.periode)
    ? options.periode
    : periods[0];
  const { start, end } = periodRange(periode);

  const where: string[] = [
    'village_id = $1',
    'type = $2',
    'transaction_date >= $3::date',
    'transaction_date < $4::date',
  ];
  const params: any[] = [village.villageId, options.type, start, end];

  const q = (options.q || '').trim();
  if (q) {
    params.push(`%${q}%`);
    where.push(`(title ILIKE $${params.length} OR reference_code ILIKE $${params.length})`);
  }
  if (options.kategori) {
    params.push(options.kategori);
    where.push(`category = $${params.length}`);
  }
  if (options.bukti === 'LENGKAP') where.push('proof_file_name IS NOT NULL');
  if (options.bukti === 'PERLU_BUKTI') where.push('proof_file_name IS NULL');

  const whereSql = where.join(' AND ');

  const listRes = await query<any>(
    `SELECT id, reference_code, type, title, category,
            to_char(transaction_date, 'YYYY-MM-DD') AS transaction_date, amount,
            (proof_file_name IS NOT NULL) AS has_proof
       FROM village_transactions
      WHERE ${whereSql}
      ORDER BY transaction_date DESC, recorded_at DESC`,
    params
  );

  const all = listRes.rows.map(mapTransactionSummary);
  const perPage = options.perPage ?? 6;
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(options.page ?? 1, 1), totalPages);
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const categoryRes = await query<any>(
    `SELECT DISTINCT category FROM village_transactions
      WHERE village_id = $1 AND type = $2
        AND transaction_date >= $3::date AND transaction_date < $4::date
      ORDER BY category`,
    [village.villageId, options.type, start, end]
  );

  return {
    rows: all.slice((page - 1) * perPage, page * perPage),
    categoryOptions: categoryRes.rows.map((r) => String(r.category)),
    total,
    totalAmount: all.reduce((sum, row) => sum + row.amount, 0),
    page,
    perPage,
    totalPages,
    from,
    to,
    jumlahTanpaBukti: all.filter((row) => !row.hasProof).length,
    village,
    periode,
    type: options.type,
  };
}

// ------------------------------------------------------------------------------
// Detail transaksi
// ------------------------------------------------------------------------------

function mapTransactionDetail(row: any, village: MonitoredVillage): TransactionDetail {
  return {
    ...mapTransactionSummary({ ...row, has_proof: row.proof_file_name !== null }),
    village,
    paymentMethod: row.payment_method,
    counterparty: row.counterparty,
    note: row.note,
    proofFileName: row.proof_file_name,
    proofFileSizeKb: row.proof_file_size_kb === null ? null : num(row.proof_file_size_kb),
    proofUploadedBy: row.proof_uploaded_by,
    recordedBy: row.recorded_by,
    recordedAt: new Date(row.recorded_at).toISOString(),
  };
}

export async function getTransaction(
  slug: string,
  referenceCode: string
): Promise<TransactionDetail | null> {
  const village = await findMonitoredVillage(slug);
  if (!village) return null;

  const res = await query<any>(
    `SELECT id, reference_code, type, title, category,
            to_char(transaction_date, 'YYYY-MM-DD') AS transaction_date, amount,
            payment_method, counterparty, note, proof_file_name, proof_file_size_kb,
            proof_uploaded_by, recorded_by, recorded_at
       FROM village_transactions
      WHERE village_id = $1 AND reference_code = $2
      LIMIT 1`,
    [village.villageId, referenceCode]
  );
  if (res.rows.length === 0) return null;

  return mapTransactionDetail(res.rows[0], village);
}

/** Dipakai route `/documents/bukti-<ref>.pdf`; tidak terikat slug desa. */
export async function getTransactionByReference(
  referenceCode: string
): Promise<import('@/lib/services/financeDocumentPdf').BuktiTransactionData | null> {
  const res = await query<any>(
    `SELECT vt.id, vt.reference_code, vt.type, vt.title, vt.category,
            to_char(vt.transaction_date, 'YYYY-MM-DD') AS transaction_date, vt.amount,
            vt.payment_method, vt.counterparty, vt.note, vt.proof_file_name,
            vt.proof_file_size_kb, vt.proof_uploaded_by, vt.recorded_by, vt.recorded_at,
            tv.name AS village_name, tv.regency, tv.district,
            u.full_name AS manager_name, u.email AS manager_email
       FROM village_transactions vt
       JOIN tourist_villages tv ON tv.id = vt.village_id
       LEFT JOIN users u ON u.village_id = tv.id AND u.role = 'desa'
      WHERE vt.reference_code = $1
        AND vt.proof_file_name IS NOT NULL
      LIMIT 1`,
    [referenceCode]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    referenceCode: row.reference_code,
    type: row.type,
    title: row.title,
    category: row.category,
    transactionDate: row.transaction_date,
    amount: num(row.amount),
    paymentMethod: row.payment_method,
    counterparty: row.counterparty,
    note: row.note,
    villageName: shortVillageName(row.village_name),
    regency: row.regency,
    district: row.district,
    managerName: row.manager_name || '-',
    managerEmail: row.manager_email,
    recordedBy: row.recorded_by,
    recordedAt: new Date(row.recorded_at).toISOString(),
  };
}

// ------------------------------------------------------------------------------
// Data keuangan untuk dashboard Disbudparekraf
// ------------------------------------------------------------------------------

export async function getDashboardFinance(): Promise<DashboardFinance> {
  // perPage besar: dashboard butuh seluruh baris untuk memilah desa yang melapor.
  const recap = await getFinanceRecap({ perPage: 5000 });
  const rows = recap.rows;

  const monthStart = `${recap.active.periode}-01`;
  const { end } = periodRange(recap.active.periode);
  const bucketRes = await query<any>(
    `SELECT CASE
              WHEN EXTRACT(DAY FROM transaction_date) <= 7  THEN 0
              WHEN EXTRACT(DAY FROM transaction_date) <= 14 THEN 1
              WHEN EXTRACT(DAY FROM transaction_date) <= 21 THEN 2
              ELSE 3
            END AS bucket,
            COALESCE(SUM(CASE WHEN type = 'PEMASUKAN' THEN amount END), 0)   AS pemasukan,
            COALESCE(SUM(CASE WHEN type = 'PENGELUARAN' THEN amount END), 0) AS pengeluaran
       FROM village_transactions
      WHERE transaction_date >= $1::date AND transaction_date < $2::date
      GROUP BY bucket
      ORDER BY bucket`,
    [monthStart, end]
  );
  const monthShort = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(
    new Date(`${monthStart}T00:00:00`)
  );
  const labels = [`1-7 ${monthShort}`, `8-14 ${monthShort}`, `15-21 ${monthShort}`, `22-31 ${monthShort}`];
  const cashflow = labels.map((label, index) => {
    const row = bucketRes.rows.find((r) => num(r.bucket) === index);
    return {
      label,
      pemasukan: num(row?.pemasukan),
      pengeluaran: num(row?.pengeluaran),
    };
  });

  const perluBuktiRow = rows.find((r) => r.kelengkapan === 'PERLU_BUKTI');

  return {
    cards: {
      pemasukan: recap.totals.pemasukan,
      pengeluaran: recap.totals.pengeluaran,
      surplus: recap.totals.surplus,
      saldoAwal: recap.totals.saldoAwal,
      saldoAkhir: recap.totals.saldoAkhir,
      desaMelapor: recap.totals.desaMelapor,
      desaTotal: recap.totals.desaTotal,
    },
    cashflow,
    // Dashboard hanya menampilkan desa yang sudah melapor, seperti desain 422:1068.
    rows: rows.filter((r) => r.kelengkapan !== 'BELUM_LAPOR'),
    belumLapor: recap.totals.belumLapor,
    perluBukti: recap.totals.perluBukti,
    perluBuktiDesa: perluBuktiRow?.shortName ?? null,
    periode: recap.active.periode,
    diperbarui: recap.diperbarui,
  };
}
