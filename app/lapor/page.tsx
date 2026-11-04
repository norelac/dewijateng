'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Plus,
  MapPin,
  Check,
  ShieldCheck,
  X,
  Maximize2,
} from 'lucide-react';

interface TimelineStep {
  title: string;
  date: string;
  done: boolean;
}

interface ReportItem {
  id: string;
  ticketCode: string;
  status: 'Masuk' | 'Diverifikasi' | 'Diproses' | 'Selesai';
  title: string;
  summary: string;
  detailDesc: string;
  locationShort: string;
  locationFull: string;
  date: string;
  category: string;
  kabupaten: string;
  desa: string;
  thumbImg: string;
  beforePhoto?: {
    url: string;
    label: string;
  };
  afterPhoto?: {
    url: string;
    label: string;
  };
  timeline: TimelineStep[];
}

const REPORTS_DATA: ReportItem[] = [
  // Page 1
  {
    id: 'rep-0891',
    ticketCode: 'DS-JTG-2026-0891',
    status: 'Selesai',
    title: 'Akses ke curug buruk',
    summary: 'Jalur berlubang dan licin mengganggu akses pengunjung menuju curug.',
    detailDesc:
      'Permukaan akses ke curug rusak dan tergenang setelah hujan. Kondisi ini menyulitkan wisatawan yang berjalan kaki. Foto awal menunjukkan titik jalur yang perlu ditangani.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '1 Ags 2026',
    category: 'Akses & Jalan',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 1 Ags 2026',
    },
    afterPhoto: {
      url: '/img/figma/aduan-curug-sesudah.png',
      label: 'Sesudah · 12 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '1 Ags 2026 · 09.10 WIB', done: true },
      { title: 'Diverifikasi desa', date: '3 Ags 2026 · 10.00 WIB', done: true },
      { title: 'Proses perbaikan lapangan', date: '5 Okt 2026 · 08.30 WIB', done: true },
      { title: 'Selesai', date: '12 Okt 2026 · 11.30 WIB', done: true },
    ],
  },
  {
    id: 'rep-0942',
    ticketCode: 'DS-JTG-2026-0942',
    status: 'Diproses',
    title: 'Sampah menumpuk di area istirahat',
    summary: 'Tempat sampah penuh di sekitar bangku pengunjung dan perlu dibersihkan.',
    detailDesc:
      'Tempat sampah penuh di sekitar bangku peristirahatan dan jalur taman wisata belum terangkut. Perlu penambahan frekuensi pengangkutan dan tempat sampah pilah baru.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '25 Okt 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-sampah.png',
    beforePhoto: {
      url: '/img/figma/aduan-sampah.png',
      label: 'Sebelum · 25 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '25 Okt 2026 · 14.15 WIB', done: true },
      { title: 'Diverifikasi desa', date: '26 Okt 2026 · 09.00 WIB', done: true },
      { title: 'Proses pembersihan & pengadaan', date: '27 Okt 2026 · 10.30 WIB', done: true },
    ],
  },
  {
    id: 'rep-0948',
    ticketCode: 'DS-JTG-2026-0948',
    status: 'Diverifikasi',
    title: 'Pungli parkir tidak sesuai',
    summary: 'Pengunjung menemukan perbedaan tarif yang diminta dengan informasi di lokasi.',
    detailDesc:
      'Pengunjung menemukan perbedaan tarif parkir kendaraan roda empat yang diminta petugas lapangan dengan papan tarif resmi desa. Belum diberikan tiket/karcis bernomor seri.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '27 Okt 2026',
    category: 'Pungutan Liar',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-parkir.png',
    beforePhoto: {
      url: '/img/figma/aduan-parkir.png',
      label: 'Sebelum · 27 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '27 Okt 2026 · 11.20 WIB', done: true },
      { title: 'Diverifikasi desa', date: '28 Okt 2026 · 08.45 WIB', done: true },
    ],
  },
  {
    id: 'rep-0953',
    ticketCode: 'DS-JTG-2026-0953',
    status: 'Masuk',
    title: 'Keran wastafel rusak',
    summary: 'Keran di dekat toilet pengunjung belum mengalir saat digunakan.',
    detailDesc:
      'Kran cuci tangan wastafel di area toilet utama patah dan air tidak mengalir. Pengunjung kesulitan mencuci tangan setelah keluar dari toilet fasilitas umum.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '28 Okt 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-wastafel.png',
    beforePhoto: {
      url: '/img/figma/aduan-wastafel.png',
      label: 'Sebelum · 28 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '28 Okt 2026 · 16.40 WIB', done: true },
    ],
  },

  // Page 2
  {
    id: 'rep-0961',
    ticketCode: 'DS-JTG-2026-0961',
    status: 'Diproses',
    title: 'Lampu penerangan jalur malam mati',
    summary: 'Tiga titik lampu solar cell di jalur pejalan kaki tidak menyala saat senja.',
    detailDesc:
      'Lampu penerangan jalan tenaga surya di sepanjang rute kebun buah mati sejak dua hari lalu. Pengunjung yang pulang sore hari terpaksa memakai senter ponsel.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '29 Okt 2026',
    category: 'Akses & Jalan',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 29 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '29 Okt 2026 · 18.20 WIB', done: true },
      { title: 'Diverifikasi desa', date: '30 Okt 2026 · 08.00 WIB', done: true },
      { title: 'Perbaikan panel baterai', date: '31 Okt 2026 · 09.30 WIB', done: true },
    ],
  },
  {
    id: 'rep-0968',
    ticketCode: 'DS-JTG-2026-0968',
    status: 'Diverifikasi',
    title: 'Papan petunjuk arah wisata patah',
    summary: 'Plang informasi arah toilet dan musala miring tertimpa dahan pohon.',
    detailDesc:
      'Papan arah penunjuk fasilitas umum di pertigaan dekat parkir barat roboh sebagian sehingga menyulitkan wisatawan baru menemukan lokasi musala.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '30 Okt 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-parkir.png',
    beforePhoto: {
      url: '/img/figma/aduan-parkir.png',
      label: 'Sebelum · 30 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '30 Okt 2026 · 10.15 WIB', done: true },
      { title: 'Diverifikasi desa', date: '30 Okt 2026 · 14.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-0972',
    ticketCode: 'DS-JTG-2026-0972',
    status: 'Masuk',
    title: 'Pagar pengaman bambu lapuk',
    summary: 'Batas pagar tepian tebing spot foto mulai rapuh dan bergoyang.',
    detailDesc:
      'Pagar pembatas dari bilah bambu di gardu pandang terancam patah jika disandari kelompok pengunjung. Perlu penggantian rangka kayu atau pipa besi galvanis.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '31 Okt 2026',
    category: 'Bahaya Keselamatan (K3)',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 31 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '31 Okt 2026 · 15.45 WIB', done: true },
    ],
  },
  {
    id: 'rep-0979',
    ticketCode: 'DS-JTG-2026-0979',
    status: 'Selesai',
    title: 'Saluran drainase tersumbat sampah',
    summary: 'Air meluap ke badan jalan saat hujan karena selokan tertutup ranting.',
    detailDesc:
      'Got pembuangan air di samping kios suvenir tersumbat daun kering dan tanah sedimen. Got telah dinormalisasi dan dipasangi jaring kawat penahan sampah.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '18 Okt 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-sampah.png',
    beforePhoto: {
      url: '/img/figma/aduan-sampah.png',
      label: 'Sebelum · 18 Okt 2026',
    },
    afterPhoto: {
      url: '/img/figma/aduan-curug-sesudah.png',
      label: 'Sesudah · 21 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '18 Okt 2026 · 08.00 WIB', done: true },
      { title: 'Diverifikasi desa', date: '18 Okt 2026 · 10.30 WIB', done: true },
      { title: 'Pembersihan got warga', date: '19 Okt 2026 · 09.00 WIB', done: true },
      { title: 'Selesai', date: '21 Okt 2026 · 11.00 WIB', done: true },
    ],
  },

  // Page 3
  {
    id: 'rep-0985',
    ticketCode: 'DS-JTG-2026-0985',
    status: 'Diproses',
    title: 'Paving area parkir amblas',
    summary: 'Bagian konblok parkir motor ambles sekitar 10 cm akibat rembesan air.',
    detailDesc:
      'Penurunan tanah di area sudut parkir kendaraan roda dua menyebabkan motor mudah roboh saat distandar. Tim pemeliharaan desa sedang membongkar dan memadatkan pasir.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '1 Nov 2026',
    category: 'Akses & Jalan',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-parkir.png',
    beforePhoto: {
      url: '/img/figma/aduan-parkir.png',
      label: 'Sebelum · 1 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '1 Nov 2026 · 11.00 WIB', done: true },
      { title: 'Diverifikasi desa', date: '1 Nov 2026 · 14.30 WIB', done: true },
      { title: 'Pemadatan sub-grade', date: '2 Nov 2026 · 09.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-0991',
    ticketCode: 'DS-JTG-2026-0991',
    status: 'Diverifikasi',
    title: 'Kursi santai gazebo rusak',
    summary: 'Papan sandaran bangku bambu di gazebo tepi sungai patah separuh.',
    detailDesc:
      'Salah satu bangku di saung peristirahatan keluarga tidak dapat dipakai karena bilah kayunya patah. Telah dijadwalkan penggantian papan kayu jati belanda.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '2 Nov 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 2 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '2 Nov 2026 · 13.10 WIB', done: true },
      { title: 'Diverifikasi desa', date: '2 Nov 2026 · 16.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-0997',
    ticketCode: 'DS-JTG-2026-0997',
    status: 'Masuk',
    title: 'Grendel pintu toilet bilik 2 macet',
    summary: 'Kunci selot pintu kamar mandi longgar dan susah dikunci dari dalam.',
    detailDesc:
      'Grendel toilet umum bilik kedua rusak sehingga pintu sering terbuka sendiri saat ada tiupan angin. Butuh pemasangan grendel slot stainless baru.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '3 Nov 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-wastafel.png',
    beforePhoto: {
      url: '/img/figma/aduan-wastafel.png',
      label: 'Sebelum · 3 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '3 Nov 2026 · 09.20 WIB', done: true },
    ],
  },
  {
    id: 'rep-1004',
    ticketCode: 'DS-JTG-2026-1004',
    status: 'Selesai',
    title: 'Rambu peringatan jurang pudar',
    summary: 'Cat plang himbauan batas aman tebing pudar terpapar panas matahari.',
    detailDesc:
      'Plang peringatan bahaya di tikungan tebing telah dicat ulang menggunakan stiker reflektif menyala malam hari untuk meningkatkan kewaspadaan pengendara jeep wisata.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '15 Okt 2026',
    category: 'Bahaya Keselamatan (K3)',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 15 Okt 2026',
    },
    afterPhoto: {
      url: '/img/figma/aduan-curug-sesudah.png',
      label: 'Sesudah · 17 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '15 Okt 2026 · 10.00 WIB', done: true },
      { title: 'Diverifikasi desa', date: '15 Okt 2026 · 13.00 WIB', done: true },
      { title: 'Pemasangan rambu baru', date: '16 Okt 2026 · 11.00 WIB', done: true },
      { title: 'Selesai', date: '17 Okt 2026 · 15.00 WIB', done: true },
    ],
  },

  // Page 4
  {
    id: 'rep-1011',
    ticketCode: 'DS-JTG-2026-1011',
    status: 'Selesai',
    title: 'Informasi tarif loket tidak jelas',
    summary: 'Pengunjung luar daerah bingung tarif masuk terusan dan retribusi desa.',
    detailDesc:
      'Pemasangan banner tarif resmi Perdes lengkap dengan rincian biaya tiket masuk, parkir, dan sewa wahana telah dipasang tegak tepat di depan gerbang loket.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '10 Okt 2026',
    category: 'Pungutan Liar',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-parkir.png',
    beforePhoto: {
      url: '/img/figma/aduan-parkir.png',
      label: 'Sebelum · 10 Okt 2026',
    },
    afterPhoto: {
      url: '/img/figma/aduan-curug-sesudah.png',
      label: 'Sesudah · 12 Okt 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '10 Okt 2026 · 14.00 WIB', done: true },
      { title: 'Diverifikasi desa', date: '11 Okt 2026 · 09.00 WIB', done: true },
      { title: 'Pemasangan plang Perdes', date: '11 Okt 2026 · 15.00 WIB', done: true },
      { title: 'Selesai', date: '12 Okt 2026 · 10.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-1018',
    ticketCode: 'DS-JTG-2026-1018',
    status: 'Diproses',
    title: 'Tempat cuci tangan airnya kosong',
    summary: 'Tandon toren air portabel di dekat warung kuliner belum diisi ulang.',
    detailDesc:
      'Toren air portabel kapasitas 250 liter kosong sejak siang hari saat kunjungan ramai. Petugas Pokdarwis sedang menyambungkan selang dari sumur bor utama.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '3 Nov 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-wastafel.png',
    beforePhoto: {
      url: '/img/figma/aduan-wastafel.png',
      label: 'Sebelum · 3 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '3 Nov 2026 · 12.30 WIB', done: true },
      { title: 'Diverifikasi desa', date: '3 Nov 2026 · 13.45 WIB', done: true },
      { title: 'Penyambungan pipa pipa sumur', date: '3 Nov 2026 · 15.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-1025',
    ticketCode: 'DS-JTG-2026-1025',
    status: 'Diverifikasi',
    title: 'Jalur tangga batu berlumut licin',
    summary: 'Anak tangga turunan menuju sungai licin saat kabut pagi hari.',
    detailDesc:
      'Lumut tebal menempel di undakan batu kali setelah musim penghujan. Perlu penyikatan berkala dan penaburan pasir kasar agar tidak membahayakan lansia dan anak.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '4 Nov 2026',
    category: 'Akses & Jalan',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-curug-sebelum.png',
    beforePhoto: {
      url: '/img/figma/aduan-curug-sebelum.png',
      label: 'Sebelum · 4 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '4 Nov 2026 · 07.45 WIB', done: true },
      { title: 'Diverifikasi desa', date: '4 Nov 2026 · 09.00 WIB', done: true },
    ],
  },
  {
    id: 'rep-1032',
    ticketCode: 'DS-JTG-2026-1032',
    status: 'Masuk',
    title: 'Tong sampah pilah tutupnya pecah',
    summary: 'Tutup drum sampah anorganik retak sehingga dimasuki air hujan.',
    detailDesc:
      'Tutup tong sampah plastik pecah terbentur saat proses pengangkutan truk sampah desa kemarin sore. Membutuhkan penggantian tutup drum ukuran 50 liter.',
    locationShort: 'Candirejo, Magelang',
    locationFull: 'Desa Candirejo, Borobudur, Magelang',
    date: '4 Nov 2026',
    category: 'Fasilitas & Sanitasi',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    thumbImg: '/img/figma/aduan-sampah.png',
    beforePhoto: {
      url: '/img/figma/aduan-sampah.png',
      label: 'Sebelum · 4 Nov 2026',
    },
    timeline: [
      { title: 'Laporan terkirim', date: '4 Nov 2026 · 09.30 WIB', done: true },
    ],
  },
];

const STATUS_FILTERS = ['Semua', 'Masuk', 'Diverifikasi', 'Diproses', 'Selesai'] as const;
const ITEMS_PER_PAGE = 4;

export default function LaporPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Kabupaten Magelang');
  const [selectedDesa, setSelectedDesa] = useState('Desa Candirejo');
  const [selectedKategori, setSelectedKategori] = useState('Semua kategori');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('Semua');

  const [currentPage, setCurrentPage] = useState(1);
  const [activeReportId, setActiveReportId] = useState<string>(REPORTS_DATA[0].id);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; label: string } | null>(null);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return REPORTS_DATA.filter((item) => {
      if (statusFilter !== 'Semua' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.ticketCode.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.summary.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchDesc) return false;
      }
      if (selectedKategori !== 'Semua kategori' && item.category !== selectedKategori) {
        return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery, selectedKategori]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, selectedKategori, selectedKabupaten, selectedDesa]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Active report selection
  const activeReport = useMemo(() => {
    const found = REPORTS_DATA.find((r) => r.id === activeReportId);
    return found || paginatedReports[0] || filteredReports[0] || REPORTS_DATA[0];
  }, [activeReportId, paginatedReports, filteredReports]);

  const renderStatusBadge = (status: ReportItem['status']) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="bg-[#E4F6E8] text-[#216B55] px-3 py-1.5 rounded-full text-xs font-semibold">
            Selesai
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-[#FFF4DC] text-[#936015] px-3 py-1.5 rounded-full text-xs font-semibold">
            Diproses
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="bg-[#EDF3FC] text-[#0D2453] px-3 py-1.5 rounded-full text-xs font-semibold">
            Diverifikasi
          </span>
        );
      case 'Masuk':
      default:
        return (
          <span className="bg-[#EDF3FC] text-[#0D2453] px-3 py-1.5 rounded-full text-xs font-semibold">
            Masuk
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 flex flex-col items-start gap-[44px] mt-[44px] mb-24">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#767676] font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-[#0D2453] transition-colors">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-400">/</li>
          <li className="text-[#0D2453] font-semibold" aria-current="page">
            Telusuri Laporan
          </li>
        </ol>
      </nav>

      {/* 2. Header Section */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-[983px]">
          <div className="flex items-center gap-2.5 text-[#0D2453]">
            <Search className="w-6 h-6 text-[#0D2453] stroke-[2.5]" />
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0D2453]">
              Telusuri Laporan
            </h1>
          </div>
          <p className="text-xs sm:text-[15px] text-[#767676] mt-1.5 font-normal">
            Dari laporan terkirim hingga perbaikan selesai. Temukan laporan dan ikuti perkembangannya di desa wisata Jawa Tengah.
          </p>
        </div>

        <Link
          href="/#buat-laporan"
          className="bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-[18px] py-[13px] rounded-full text-xs sm:text-[13px] font-bold flex items-center gap-2 transition-colors duration-150 shrink-0 self-start md:self-center cursor-pointer shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan</span>
        </Link>
      </div>

      {/* 3. Search & Filter Card */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.08),0_24px_40px_-12px_rgba(13,36,83,0.10)] flex flex-col gap-6">
        {/* Ticket search row */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-[#0D2453]">
            Cari kode tiket atau kata kunci laporan
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="border border-[#E6ECF5] rounded-[14px] h-[50px] px-4 py-3 flex-1 w-full flex items-center gap-3 transition-colors duration-150 focus-within:border-[#0D2453]/35 focus-within:ring-1 focus-within:ring-[#0D2453]/15">
              <Search className="w-5 h-5 text-[#64748B] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: DS-JTG-2026-0891 atau akses ke curug"
                className="w-full bg-transparent border-0 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#64748B] placeholder:font-normal focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="w-full sm:w-auto bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-6 py-3 rounded-full text-xs sm:text-[13px] font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              Cari Laporan
            </button>
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Kabupaten */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-[#0D2453]">
              Kabupaten
            </label>
            <div className="relative">
              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-semibold focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Kabupaten Magelang">Kabupaten Magelang</option>
                <option value="Kabupaten Banyumas">Kabupaten Banyumas</option>
                <option value="Kabupaten Kendal">Kabupaten Kendal</option>
                <option value="Kabupaten Karanganyar">Kabupaten Karanganyar</option>
                <option value="Kabupaten Banjarnegara">Kabupaten Banjarnegara</option>
                <option value="Kabupaten Wonosobo">Kabupaten Wonosobo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#0D2453] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desa wisata */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-[#0D2453]">
              Desa wisata
            </label>
            <div className="relative">
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-semibold focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Desa Candirejo">Desa Candirejo</option>
                <option value="Desa Limpakuwus">Desa Limpakuwus</option>
                <option value="Desa Dieng Kulon">Desa Dieng Kulon</option>
                <option value="Desa Berjo">Desa Berjo</option>
                <option value="Desa Getas (Tubing Genting)">Desa Getas (Tubing Genting)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#0D2453] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-[#0D2453]">
              Kategori
            </label>
            <div className="relative">
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-semibold focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Semua kategori">Semua kategori</option>
                <option value="Akses & Jalan">Akses &amp; Jalan</option>
                <option value="Fasilitas & Sanitasi">Fasilitas &amp; Sanitasi</option>
                <option value="Pungutan Liar">Pungutan Liar</option>
                <option value="Bahaya Keselamatan (K3)">Bahaya Keselamatan (K3)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#0D2453] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Results & Master-Detail Section */}
      <section className="w-full flex flex-col gap-6">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0D2453] text-white font-bold shadow-xs'
                    : 'bg-white border border-[#E6ECF5] text-[#0D2453] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Section Header Meta */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-[#0D2453]">
            Laporan di {selectedDesa}
          </h2>
          <span className="text-xs sm:text-[13px] font-medium text-[#767676]">
            Urutan: relevansi pencarian ↓
          </span>
        </div>

        {/* 2-Column Master-Detail Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Left Column: Report Cards List (560px on desktop) */}
          <div className="w-full lg:w-[560px] shrink-0 flex flex-col gap-4">
            {paginatedReports.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E6ECF5] p-8 text-center text-[#64748B] text-sm shadow-[0_1px_2px_rgba(13,36,83,0.035),0_6px_14px_-8px_rgba(13,36,83,0.10)] font-medium">
                Tidak ada laporan yang sesuai dengan filter pencarian.
              </div>
            ) : (
              paginatedReports.map((report) => {
                const isActive = report.id === activeReport.id;
                return (
                  <div
                    key={report.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    onClick={() => setActiveReportId(report.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveReportId(report.id);
                      }
                    }}
                    className={`rounded-[20px] p-6 cursor-pointer flex flex-col gap-3.5 border outline-offset-2 transition-[background-color,border-color,box-shadow] duration-150 ${
                      isActive
                        ? 'bg-[#EDF3FC] border-[#0D2453]/25 shadow-[0_1px_2px_rgba(13,36,83,0.05),0_6px_14px_-4px_rgba(13,36,83,0.10),0_18px_32px_-12px_rgba(13,36,83,0.12)]'
                        : 'bg-white border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.035),0_6px_14px_-8px_rgba(13,36,83,0.10)] hover:border-[#CBD5E1] hover:shadow-[0_1px_2px_rgba(13,36,83,0.04),0_10px_22px_-8px_rgba(13,36,83,0.14)]'
                    }`}
                  >
                    {/* Top: Ticket & Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D2453]">
                        {report.ticketCode}
                      </span>
                      {renderStatusBadge(report.status)}
                    </div>

                    {/* Middle: Thumb & Content */}
                    <div className="flex items-start gap-4">
                      <div className="w-[104px] h-[90px] rounded-[12px] overflow-hidden shrink-0 bg-slate-100">
                        <img
                          src={report.thumbImg}
                          alt={report.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <h3 className="text-base sm:text-[17px] font-bold text-[#0D2453] leading-snug line-clamp-1">
                          {report.title}
                        </h3>
                        <p className="text-[13px] font-normal text-[#64748B] leading-[1.6] line-clamp-2">
                          {report.summary}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Location & Date */}
                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5 font-medium">
                      <span>{report.locationShort}</span>
                      <span>{report.date}</span>
                    </div>

                    {/* Active Indicator Arrow */}
                    {isActive && (
                      <div className="text-xs font-bold text-[#0D2453] pt-0.5">
                        Detail ditampilkan &rarr;
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-3 pb-1 mt-1 text-[13px] text-[#64748B]">
              <span className="font-medium text-xs sm:text-[13px] text-[#767676]">
                Menampilkan{' '}
                {filteredReports.length === 0
                  ? 0
                  : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredReports.length
                    )}`}{' '}
                dari {filteredReports.length}
              </span>

              {/* Page numbers: 1, 2, 3, 4 */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                        const nextReport = filteredReports[(page - 1) * ITEMS_PER_PAGE];
                        if (nextReport) {
                          setActiveReportId(nextReport.id);
                        }
                      }}
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0D2453] text-white font-bold shadow-[0_2px_6px_rgba(13,36,83,0.18)]'
                          : 'bg-white border border-[#E6ECF5] text-[#0D2453] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                      aria-label={`Halaman ${page}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Report Detail */}
          {filteredReports.length > 0 && (
            <div
              key={activeReport.id}
              className="detail-swap w-full lg:flex-1 bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_1px_3px_rgba(13,36,83,0.05),0_10px_20px_-8px_rgba(13,36,83,0.10),0_32px_56px_-24px_rgba(13,36,83,0.16)] flex flex-col gap-6"
            >
              {/* 1. Header & Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#767676] tracking-[1px] uppercase">
                  Detail Laporan
                </span>
                {renderStatusBadge(activeReport.status)}
              </div>

              {/* 2. Identity & Description */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs sm:text-[13px] font-bold text-[#0D2453]">
                  {activeReport.ticketCode}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0D2453] leading-snug">
                  {activeReport.title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                  <MapPin className="w-4 h-4 text-[#0D2453] shrink-0" />
                  <span>{activeReport.locationFull}</span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#64748B] leading-[1.7] font-normal mt-0.5">
                  {activeReport.detailDesc}
                </p>
              </div>

              {/* 3. Perjalanan Laporan (Timeline) */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-[#0D2453]">
                  Perjalanan laporan
                </h4>

                <div className="space-y-0">
                  {activeReport.timeline.map((step, idx) => {
                    const isLast = idx === activeReport.timeline.length - 1;
                    const isCurrent = isLast && activeReport.status !== 'Selesai';
                    return (
                      <div key={idx} className="flex gap-3.5 items-start">
                        {/* Indicator circle & vertical line */}
                        <div className="flex flex-col items-center shrink-0 w-7">
                          {isCurrent ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#0D2453] flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0D2453]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#E4F6E8] flex items-center justify-center text-[#216B55] shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                          {!isLast && <div className="w-px h-10 bg-[#E6ECF5] my-1" />}
                        </div>

                        {/* Step info */}
                        <div className="flex flex-col pb-3 min-w-0">
                          <span className="text-sm font-bold text-[#0D2453] leading-tight">
                            {step.title}
                          </span>
                          <span className="text-xs text-[#64748B] mt-1 leading-normal font-medium">
                            {step.date}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Sebelum & Sesudah Photos */}
              <div className="flex flex-col gap-3.5">
                <h4 className="text-sm font-bold text-[#0D2453]">
                  Sebelum &amp; sesudah
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Sebelum */}
                  {activeReport.beforePhoto && (
                    <div className="flex flex-col gap-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setLightboxImg({
                            url: activeReport.beforePhoto!.url,
                            label: `${activeReport.title} - ${activeReport.beforePhoto!.label}`,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setLightboxImg({
                              url: activeReport.beforePhoto!.url,
                              label: `${activeReport.title} - ${activeReport.beforePhoto!.label}`,
                            });
                          }
                        }}
                        className="h-[176px] rounded-[14px] overflow-hidden bg-slate-100 border border-[#E6ECF5] cursor-pointer group relative transition-colors duration-150 hover:border-[#CBD5E1]"
                      >
                        <img
                          src={activeReport.beforePhoto.url}
                          alt="Foto kondisi sebelum perbaikan"
                          className="w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors duration-150 flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                        </div>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-medium">
                        {activeReport.beforePhoto.label}
                      </span>
                    </div>
                  )}

                  {/* Sesudah */}
                  {activeReport.afterPhoto ? (
                    <div className="flex flex-col gap-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setLightboxImg({
                            url: activeReport.afterPhoto!.url,
                            label: `${activeReport.title} - ${activeReport.afterPhoto!.label}`,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setLightboxImg({
                              url: activeReport.afterPhoto!.url,
                              label: `${activeReport.title} - ${activeReport.afterPhoto!.label}`,
                            });
                          }
                        }}
                        className="h-[176px] rounded-[14px] overflow-hidden bg-slate-100 border border-[#E6ECF5] cursor-pointer group relative transition-colors duration-150 hover:border-[#CBD5E1]"
                      >
                        <img
                          src={activeReport.afterPhoto.url}
                          alt="Foto kondisi sesudah perbaikan"
                          className="w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors duration-150 flex items-center justify-center">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                        </div>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-medium">
                        {activeReport.afterPhoto.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="h-[176px] rounded-[14px] bg-[#F3F5F8] border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-[#64748B] font-semibold">
                          Dokumentasi penanganan
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">
                          Menunggu pembaruan lapangan
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-medium">
                        Sesudah · Dalam proses
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Privacy Notice Banner */}
              <div className="bg-[#F3F5F8] rounded-[14px] p-4 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#0D2453] shrink-0 mt-0.5" />
                <p className="text-xs text-[#64748B] leading-[1.6] font-normal">
                  Tampilan publik hanya memuat informasi aduan. Identitas dan data pribadi pelapor tidak ditampilkan.
                </p>
              </div>
            </div>
          )}

          {filteredReports.length === 0 && (
            <div className="w-full lg:flex-1 min-h-[320px] bg-white rounded-[24px] border border-dashed border-[#CBD5E1] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-2">
              <Search className="w-6 h-6 text-[#94A3B8]" />
              <p className="text-[15px] font-bold text-[#0D2453]">
                Belum ada laporan yang cocok
              </p>
              <p className="text-[13px] text-[#64748B] max-w-sm leading-[1.6] font-medium">
                Coba kode tiket lain, kata kunci yang lebih pendek, atau longgarkan filter status dan kategori.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Bottom CTA Banner */}
      <section className="w-full bg-[#EDF3FC] rounded-[24px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_10px_20px_-10px_rgba(13,36,83,0.12),0_28px_48px_-24px_rgba(13,36,83,0.14)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-xl sm:text-[22px] font-bold text-[#0D2453]">
            Melihat kendala di desa wisata?
          </h3>
          <p className="text-xs sm:text-[14px] text-[#64748B] leading-[1.6] font-normal">
            Sampaikan lokasi, ceritakan kejadiannya, dan sertakan bukti yang relevan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/#buat-laporan"
            className="flex-1 sm:flex-initial bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-[18px] py-[13px] rounded-full text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan</span>
          </Link>
          <Link
            href="/edukasi"
            className="flex-1 sm:flex-initial bg-white border border-[#0D2453] hover:bg-[#F8FAFC] text-[#0D2453] px-[18px] py-[13px] rounded-full text-xs sm:text-[13px] font-bold text-center transition-colors duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            Panduan Pelaporan
          </Link>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base">{lightboxImg.label}</h4>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.label}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#767676]">
              <span className="font-medium">Dokumentasi tindak lanjut aduan</span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs hover:bg-[#163574] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
