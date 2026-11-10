/**
 * Data contoh untuk Dashboard Disbudparekraf (Fase 2).
 *
 * ponytail: angka keuangan dashboard sudah dibaca dari database sejak Fase 4
 * (lihat `getDashboardFinance()`), jadi berkas ini hanya menyimpan sisa data
 * contoh untuk kartu akses akun dan daftar akun terbaru. Ceiling: dua blok itu
 * belum terhubung ke database.
 */

export const DASHBOARD_WILAYAH = 'Semua wilayah';
export const DASHBOARD_TERAKHIR_DIPERBARUI = 'Data contoh · Diperbarui 9 Nov 2026';

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
