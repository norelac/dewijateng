// ==============================================================================
// Tipe & pemformat ringkasan keuangan desa (Fase 4)
//
// Berkas ini tidak menyentuh basis data sehingga aman diimpor komponen klien
// (`'use client'`). Kueri database-nya ada di `lib/services/financeService.ts`,
// yang mengimpor ulang berkas ini agar pemanggil lama tetap bekerja.
// ==============================================================================

export type TransactionType = 'PEMASUKAN' | 'PENGELUARAN';

/** Kelengkapan laporan diturunkan dari data, tidak disimpan sebagai kolom. */
export type Kelengkapan = 'LENGKAP' | 'PERLU_BUKTI' | 'BELUM_LAPOR';

export const KELENGKAPAN_LABEL: Record<Kelengkapan, string> = {
  LENGKAP: 'Lengkap',
  PERLU_BUKTI: 'Perlu bukti',
  BELUM_LAPOR: 'Belum lapor',
};

export interface MonitoredVillage {
  villageId: string;
  slug: string;
  name: string;
  shortName: string;
  regency: string;
  district: string;
  managerName: string;
  managerEmail: string | null;
}

export interface VillageFinanceRow extends MonitoredVillage {
  pemasukan: number;
  pengeluaran: number;
  saldoAwal: number;
  saldoAkhir: number;
  surplus: number;
  jumlahTransaksi: number;
  jumlahTanpaBukti: number;
  kelengkapan: Kelengkapan;
}

export interface FinanceRecap {
  rows: VillageFinanceRow[];
  totals: {
    pemasukan: number;
    pengeluaran: number;
    surplus: number;
    saldoAwal: number;
    saldoAkhir: number;
    desaMelapor: number;
    desaTotal: number;
    lengkap: number;
    perluBukti: number;
    belumLapor: number;
  };
  wilayahOptions: string[];
  desaOptions: { slug: string; name: string }[];
  active: {
    periode: string;
    wilayah: string;
    desa: string;
    kelengkapan: Kelengkapan | 'SEMUA';
  };
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  diperbarui: string | null;
  /** Total khusus baris yang lolos filter (dipakai baris total tabel). */
  filteredTotals: FinanceRecap['totals'];
}

export interface CashflowBucket {
  label: string;
  pemasukan: number;
  pengeluaran: number;
}

export interface VillageFinanceSummary {
  village: MonitoredVillage;
  periode: string;
  diperbarui: string | null;
  pemasukan: number;
  pengeluaran: number;
  surplus: number;
  saldoAwal: number;
  saldoAkhir: number;
  jumlahTransaksi: number;
  jumlahPemasukan: number;
  jumlahPengeluaran: number;
  jumlahTanpaBukti: number;
  kelengkapan: Kelengkapan;
  cashflow: CashflowBucket[];
  recent: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  referenceCode: string;
  type: TransactionType;
  title: string;
  category: string;
  transactionDate: string;
  amount: number;
  hasProof: boolean;
}

export interface TransactionDetail extends TransactionSummary {
  village: MonitoredVillage;
  paymentMethod: string | null;
  counterparty: string | null;
  note: string | null;
  proofFileName: string | null;
  proofFileSizeKb: number | null;
  proofUploadedBy: string | null;
  recordedBy: string;
  recordedAt: string;
}

export interface TransactionListResult {
  rows: TransactionSummary[];
  categoryOptions: string[];
  total: number;
  totalAmount: number;
  page: number;
  perPage: number;
  totalPages: number;
  from: number;
  to: number;
  jumlahTanpaBukti: number;
  village: MonitoredVillage;
  periode: string;
  type: TransactionType;
}

export interface DashboardFinance {
  cards: {
    pemasukan: number;
    pengeluaran: number;
    surplus: number;
    saldoAwal: number;
    saldoAkhir: number;
    desaMelapor: number;
    desaTotal: number;
  };
  cashflow: CashflowBucket[];
  rows: VillageFinanceRow[];
  belumLapor: number;
  perluBukti: number;
  perluBuktiDesa: string | null;
  periode: string;
  diperbarui: string | null;
}

// ------------------------------------------------------------------------------
// Helper pemformat (tanpa basis data)
// ------------------------------------------------------------------------------

/** Nama desa tanpa awalan "Desa Wisata" (dipakai di tabel dan judul). */
export function shortVillageName(name: string): string {
  return name.replace(/^Desa Wisata\s+/i, '');
}

/** "Borobudur, Magelang" - kecamatan tanpa "Kecamatan", kabupaten tanpa "Kabupaten". */
export function wilayahLabel(district: string, regency: string): string {
  const d = district.replace(/^Kecamatan\s+/i, '');
  const r = regency.replace(/^(Kabupaten|Kota)\s+/i, '');
  return `${d}, ${r}`;
}

/**
 * Label opsi filter desa: "Karangrejo · Magelang".
 * 40 nama desa di data demo dipakai lebih dari satu desa, jadi kabupaten/kota
 * harus ikut ditampilkan agar pilihannya bisa dibedakan.
 */
export function desaOptionLabel(shortName: string, regency: string): string {
  const r = regency.replace(/^(Kabupaten|Kota)\s+/i, '');
  return `${shortName} · ${r}`;
}

/** "Oktober 2026" dari "2026-10". */
export function periodeLabel(period: string): string {
  const [y, m] = period.split('-').map((v) => Number.parseInt(v, 10));
  if (!y || !m) return period;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1)
  );
}

/** Tanggal ISO (YYYY-MM-DD) -> "31 Okt 2026". */
export function tanggalPendek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Tanggal ISO (YYYY-MM-DD) -> "31 Oktober 2026". */
export function tanggalPanjang(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Nama berkas bukti untuk sebuah kode referensi (dipakai tautan PDF). */
export function proofFileName(referenceCode: string): string {
  return `bukti-${referenceCode}.pdf`;
}

/** Tautan bukti transaksi; `?unduh=1` untuk memaksa unduhan. */
export function proofUrl(referenceCode: string, unduh = false): string {
  return `/documents/${proofFileName(referenceCode)}${unduh ? '?unduh=1' : ''}`;
}
