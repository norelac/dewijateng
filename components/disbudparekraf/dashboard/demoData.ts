/**
 * Data contoh untuk Dashboard Disbudparekraf (Fase 2).
 *
 * ponytail: angka ditulis statis mengikuti desain Figma `418:561` ("Data contoh ·
 * Diperbarui 9 November 2026"). Ceiling: tidak ada hubungan ke database.
 * Upgrade path Fase 4: ganti konstanta ini dengan hasil query (users,
 * village_grants, grant_expenses) lewat satu fungsi server `getDashboardData()`.
 */

export const DASHBOARD_PERIODE = 'Oktober 2026';
export const DASHBOARD_WILAYAH = 'Semua wilayah';
export const DASHBOARD_TERAKHIR_DIPERBARUI = 'Data contoh · Diperbarui 9 Nov 2026';
export const DASHBOARD_FOOTER_TANGGAL = 'Data contoh · Diperbarui 9 November 2026';

export const DESA_MELAPOR = { sudah: 42, total: 48 };

export type FinanceCard = {
  label: string;
  value: string;
  note: string;
  variant: 'navy' | 'white';
};

export const FINANCE_CARDS: FinanceCard[] = [
  {
    label: 'Total pemasukan',
    value: 'Rp 2,40 M',
    note: '42 desa yang melaporkan',
    variant: 'navy',
  },
  {
    label: 'Total pengeluaran',
    value: 'Rp 1,68 M',
    note: '70% dari pemasukan periode ini',
    variant: 'white',
  },
  {
    label: 'Surplus periode',
    value: 'Rp 720 jt',
    note: 'Pemasukan dikurangi pengeluaran',
    variant: 'white',
  },
  {
    label: 'Saldo akhir tercatat',
    value: 'Rp 1,20 M',
    note: 'Saldo awal Rp 480 jt + surplus',
    variant: 'white',
  },
];

export type CashflowBars = {
  periode: string;
  pemasukan: number;
  pengeluaran: number;
  pemasukanLabel: string;
  pengeluaranLabel: string;
};

/** Nilai dalam juta rupiah; skala grafik 0–800. */
export const CASHFLOW: CashflowBars[] = [
  { periode: '1–7 Okt', pemasukan: 500, pengeluaran: 350, pemasukanLabel: '500', pengeluaranLabel: '350' },
  { periode: '8–14 Okt', pemasukan: 600, pengeluaran: 420, pemasukanLabel: '600', pengeluaranLabel: '420' },
  { periode: '15–21 Okt', pemasukan: 700, pengeluaran: 490, pemasukanLabel: '700', pengeluaranLabel: '490' },
  { periode: '22–31 Okt', pemasukan: 600, pengeluaran: 420, pemasukanLabel: '600', pengeluaranLabel: '420' },
];

export type KeuanganDesaRow = {
  desa: string;
  wilayah: string;
  pemasukan: string;
  pengeluaran: string;
  saldo: string;
  kelengkapan: 'Lengkap' | 'Perlu bukti';
};

export const KEUANGAN_DESA: KeuanganDesaRow[] = [
  { desa: 'Candirejo', wilayah: 'Magelang', pemasukan: 'Rp 120 jt', pengeluaran: 'Rp 84 jt', saldo: 'Rp 60 jt', kelengkapan: 'Perlu bukti' },
  { desa: 'Lerep', wilayah: 'Semarang', pemasukan: 'Rp 180 jt', pengeluaran: 'Rp 126 jt', saldo: 'Rp 90 jt', kelengkapan: 'Lengkap' },
  { desa: 'Ponggok', wilayah: 'Klaten', pemasukan: 'Rp 300 jt', pengeluaran: 'Rp 210 jt', saldo: 'Rp 150 jt', kelengkapan: 'Lengkap' },
  { desa: 'Sembungan', wilayah: 'Wonosobo', pemasukan: 'Rp 150 jt', pengeluaran: 'Rp 105 jt', saldo: 'Rp 75 jt', kelengkapan: 'Lengkap' },
];

export type AksesCard = {
  label: string;
  value: string;
  note: string;
  variant: 'navy' | 'white';
};

export const AKSES_CARDS: AksesCard[] = [
  { label: 'Desa terdaftar', value: '48', note: 'Cakupan 12 kabupaten / kota', variant: 'navy' },
  { label: 'Akun aktif', value: '42', note: '87,5% dari seluruh akun', variant: 'white' },
  { label: 'Menunggu aktivasi', value: '4', note: 'Kirim ulang undangan bila perlu', variant: 'white' },
  { label: 'Akun nonaktif', value: '2', note: 'Akses pengelola dinonaktifkan', variant: 'white' },
];

export const AKSES_RINGKASAN = {
  aktif: 42,
  menunggu: 4,
  nonaktif: 2,
  total: 48,
  judul: 'Kesiapan akses pengelola',
  keterangan: '42 dari 48 desa sudah memiliki akun aktif.',
  prioritas: 'Prioritas: tindak lanjuti undangan yang belum diaktifkan.',
};

export type AkunTerbaruRow = {
  desa: string;
  wilayah: string;
  pengelola: string;
  status: 'Aktif' | 'Menunggu aktivasi';
};

export const AKUN_TERBARU: AkunTerbaruRow[] = [
  { desa: 'Candirejo', wilayah: 'Borobudur, Magelang', pengelola: 'Siti Rahmawati', status: 'Aktif' },
  { desa: 'Lerep', wilayah: 'Ungaran Barat, Semarang', pengelola: 'Budi Santoso', status: 'Aktif' },
  { desa: 'Karangrejo', wilayah: 'Borobudur, Magelang', pengelola: 'Dewi Lestari', status: 'Menunggu aktivasi' },
  { desa: 'Ponggok', wilayah: 'Polanharjo, Klaten', pengelola: 'Agus Prasetyo', status: 'Aktif' },
];
