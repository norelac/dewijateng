export type TicketStatus = 'Masuk' | 'Diverifikasi' | 'Diproses' | 'Selesai';

export interface TimelineEvent {
  status: TicketStatus;
  date: string;
  title: string;
  description: string;
}

export interface DashboardTicket {
  id: string;
  code: string;
  title: string;
  date: string;
  fullDate?: string;
  status: TicketStatus;
  actionLabel: string;
  image: string;
  imageLabel?: string;
  imageSub?: string;
  resolvedImage?: string;
  resolvedImageLabel?: string;
  location: string;
  category: string;
  description: string;
  pelapor: string;
  notes?: string;
  timeline?: TimelineEvent[];
  updatedAt?: string;
}

export interface BudgetSource {
  name: string;
  percentage: number;
  amount: number;
  formattedAmount: string;
  color: string;
}

export interface VillageBudgetData {
  year: number;
  dateStr: string;
  apbdes: number;
  banprov: number;
  pades: number;
  usedAmount: number;
  usedActivitiesCount: number;
  lastUpdatedStr: string;
}

export const INITIAL_BUDGET_DATA: VillageBudgetData = {
  year: 2026,
  dateStr: '28 Oktober 2026',
  apbdes: 720000000,
  banprov: 300000000,
  pades: 180000000,
  usedAmount: 840000000,
  usedActivitiesCount: 4,
  lastUpdatedStr: '20 Okt 2026 · Bantuan Provinsi Rp300.000.000 dipublikasikan.',
};

export interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  amount: number;
  formattedAmount: string;
  hasReceipt: boolean;
  hasPhoto: boolean;
  status: 'Terpublikasi' | 'Draft';
  receiptUrl?: string;
  photoUrl?: string;
}

export interface ActivityItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  code?: string;
}

export type ActivityType = 'Semua' | 'Laporan' | 'Anggaran';

export interface ActivityHistoryEvent {
  id: string;
  date: string;
  type: 'Laporan' | 'Anggaran';
  title: string;
  subject: string;
  desc: string;
  actionLabel: string;
  actionTab: 'laporan' | 'anggaran';
  ticketId?: string;
}

export interface HandlingStage {
  date: string;
  label: string;
}

export const INITIAL_ACTIVITY_HISTORY: ActivityHistoryEvent[] = [
  {
    id: 'hist-1',
    date: '28 Okt 2026',
    type: 'Laporan',
    title: 'Laporan baru diterima',
    subject: 'Keran wastafel rusak · DS-JTG-2026-0953',
    desc: 'Masuk · menunggu verifikasi pengelola desa.',
    actionLabel: 'Lihat detail laporan →',
    actionTab: 'laporan',
    ticketId: 't-1',
  },
  {
    id: 'hist-2',
    date: '20 Okt 2026',
    type: 'Anggaran',
    title: 'Sumber dana diperbarui',
    subject: 'Bantuan Provinsi · Rp300.000.000',
    desc: 'Nilai sumber pendanaan diperbarui dan dipublikasikan.',
    actionLabel: 'Lihat anggaran →',
    actionTab: 'anggaran',
  },
  {
    id: 'hist-3',
    date: '12 Okt 2026',
    type: 'Laporan',
    title: 'Penanganan laporan selesai',
    subject: 'Akses ke curug buruk · DS-JTG-2026-0891',
    desc: 'Dokumentasi perbaikan tersedia.',
    actionLabel: 'Lihat laporan →',
    actionTab: 'laporan',
    ticketId: 't-3',
  },
];

export const INITIAL_HANDLING_STAGES: HandlingStage[] = [
  { date: '1 Ags 2026', label: 'Masuk' },
  { date: '3 Ags 2026', label: 'Diverifikasi' },
  { date: '5 Okt 2026', label: 'Proses perbaikan' },
  { date: '12 Okt 2026', label: 'Selesai' },
];

export const INITIAL_TICKETS_DATA: DashboardTicket[] = [
  {
    id: 't-1',
    code: 'DS-JTG-2026-0953',
    title: 'Keran wastafel rusak',
    date: '28 Okt 2026',
    fullDate: 'Diterima 28 Oktober 2026',
    status: 'Masuk',
    actionLabel: 'Lihat detail',
    image: '/img/figma/aduan-wastafel.png',
    imageLabel: 'Foto kondisi keran',
    imageSub: 'Representasi lampiran · gambar kondisi fasilitas',
    location: 'Candirejo, Borobudur, Magelang',
    category: 'Sanitasi & Kebersihan',
    description:
      'Keran wastafel di fasilitas wisata Candirejo rusak dan tidak dapat digunakan dengan baik. Mohon pemeriksaan serta perbaikan agar pengunjung dapat kembali mencuci tangan.',
    pelapor: 'Anonim (Warga/Wisatawan)',
    timeline: [
      {
        status: 'Masuk',
        date: '28 Okt 2026',
        title: 'Laporan diterima',
        description: 'Menunggu pemeriksaan dan verifikasi pengelola desa.',
      },
    ],
  },
  {
    id: 't-2',
    code: 'DS-JTG-2026-0948',
    title: 'Pungli parkir tidak sesuai',
    date: '27 Okt 2026',
    fullDate: 'Diterima 27 Oktober 2026',
    status: 'Diverifikasi',
    actionLabel: 'Lihat detail',
    image: '/img/figma/aduan-parkir.png',
    imageLabel: 'Foto karcis parkir tidak resmi',
    imageSub: 'Representasi lampiran · gambar tiket retribusi',
    location: 'Area Parkir Masuk Gerbang Timur, Candirejo',
    category: 'Ketertiban & Retribusi',
    description:
      'Oknum meminta tarif parkir mobil Rp 15.000 tanpa karcis resmi perda desa wisata. Harap ditertibkan pengelola Pokdarwis.',
    pelapor: 'Anonim (Wisatawan)',
    timeline: [
      {
        status: 'Diverifikasi',
        date: '27 Okt 2026',
        title: 'Laporan diverifikasi',
        description: 'Sesuai fakta lapangan. Koordinasi dengan Pokdarwis sedang berjalan.',
      },
      {
        status: 'Masuk',
        date: '27 Okt 2026',
        title: 'Laporan diterima',
        description: 'Menunggu pemeriksaan dan verifikasi pengelola desa.',
      },
    ],
  },
  {
    id: 't-3',
    code: 'DS-JTG-2026-0942',
    title: 'Sampah menumpuk di area istirahat',
    date: '25 Okt 2026',
    fullDate: 'Diterima 25 Okt 2026',
    status: 'Diproses',
    actionLabel: 'Perbarui progres',
    image: '/img/figma/aduan-sampah.png',
    imageLabel: 'Sebelum penanganan',
    imageSub: 'Representasi lampiran laporan · kondisi area istirahat',
    resolvedImage: '/img/figma/toilet-sesudah.png',
    resolvedImageLabel: 'Sesudah penanganan',
    location: 'Gazebo & Rest Area Utama, Candirejo',
    category: 'Sanitasi & Lingkungan',
    description:
      'Tempat pembuangan sampah penuh dan meluber setelah akhir pekan panjang. Mengeluarkan bau tidak sedap.',
    pelapor: 'Anonim (Warga Lokal)',
    notes: 'Jadwal pengangkutan armada kebersihan telah dipercepat menjadi 2x sehari.',
    timeline: [
      {
        status: 'Diproses',
        date: '26 Okt 2026',
        title: 'Penanganan dimulai',
        description: 'Pembersihan area dan penggantian tong sampah terpilah.',
      },
      {
        status: 'Diverifikasi',
        date: '25 Okt 2026',
        title: 'Laporan diverifikasi',
        description: 'Pemeriksaan lokasi rest area oleh petugas kebersihan desa.',
      },
      {
        status: 'Masuk',
        date: '25 Okt 2026',
        title: 'Laporan diterima',
        description: 'Menunggu pemeriksaan dan verifikasi pengelola desa.',
      },
    ],
  },
  {
    id: 't-4',
    code: 'DS-JTG-2026-0891',
    title: 'Akses ke curug buruk',
    date: '1 Ags 2026',
    fullDate: 'Diterima 1 Agustus 2026',
    status: 'Selesai',
    actionLabel: 'Lihat detail',
    image: '/img/figma/aduan-curug-sebelum.png',
    imageLabel: 'Sebelum penanganan',
    imageSub: 'Representasi lampiran · kondisi jalan setapak curug',
    resolvedImage: '/img/figma/aduan-curug-sesudah.png',
    resolvedImageLabel: 'Sesudah penanganan',
    location: 'Jalur Setapak Curug Candirejo',
    category: 'Akses & Fasilitas Fisik',
    description:
      'Anak tangga setapak menuju curug licin dan pegangan pagar bambu patah. Telah diperbaiki dengan pagar baja galvanis & cor semen bertekstur.',
    pelapor: 'Anonim (Wisatawan Mancanegara)',
    notes: 'Pekerjaan fisik selesai 100%. Pagar pengaman galvanis kokoh terpasang.',
    timeline: [
      {
        status: 'Selesai',
        date: '12 Okt 2026',
        title: 'Penanganan laporan selesai',
        description: 'Dokumentasi perbaikan fisik terverifikasi oleh Pemprov Jateng.',
      },
      {
        status: 'Diproses',
        date: '10 Ags 2026',
        title: 'Pengerjaan fisik berjalan',
        description: 'Pengecoran tangga dan pemasangan pagar pengaman.',
      },
      {
        status: 'Diverifikasi',
        date: '02 Ags 2026',
        title: 'Laporan diverifikasi',
        description: 'Survei teknis lapangan Pokdarwis.',
      },
      {
        status: 'Masuk',
        date: '01 Ags 2026',
        title: 'Laporan diterima',
        description: 'Menunggu verifikasi pengelola desa.',
      },
    ],
  },
];
