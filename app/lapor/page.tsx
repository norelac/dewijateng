'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Check,
  ShieldCheck,
  X,
  Maximize2,
  Share2,
  Copy,
  SlidersHorizontal,
  Columns,
  Sparkles,
  Clock,
} from 'lucide-react';

import {
  getPublicReportsAction,
  getReportDetailAction,
} from '@/app/actions/reportActions';
import { calculateSLARemaining } from '@/lib/utils';
import type { IncidentReportDetail } from '@/lib/services/reportService';

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
  /** Tenggat SLA (ISO). null untuk laporan selesai/data lama. */
  deadlineAt?: string | null;
  timeline: TimelineStep[];
}

const REPORTS_DATA: ReportItem[] = [
  // Page 1
  {
    id: 'rep-0891',
    ticketCode: 'LP-JTG-2026-0891',
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
    ticketCode: 'LP-JTG-2026-0942',
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
    ticketCode: 'LP-JTG-2026-0948',
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
    ticketCode: 'LP-JTG-2026-0953',
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
    ticketCode: 'LP-JTG-2026-0961',
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
    ticketCode: 'LP-JTG-2026-0968',
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
    ticketCode: 'LP-JTG-2026-0972',
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
    ticketCode: 'LP-JTG-2026-0979',
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
    ticketCode: 'LP-JTG-2026-0985',
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
    ticketCode: 'LP-JTG-2026-0991',
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
    ticketCode: 'LP-JTG-2026-0997',
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
    ticketCode: 'LP-JTG-2026-1004',
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
    ticketCode: 'LP-JTG-2026-1011',
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
    ticketCode: 'LP-JTG-2026-1018',
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
    ticketCode: 'LP-JTG-2026-1025',
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
    ticketCode: 'LP-JTG-2026-1032',
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

const FALLBACK_BEFORE = '/img/figma/aduan-curug-sebelum.png';
const FALLBACK_AFTER = '/img/figma/aduan-curug-sesudah.png';

/** Ganti foto yang gagal dimuat dengan aset contoh agar tidak muncul ikon rusak. */
function handlePhotoError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  const alt = (img.getAttribute('alt') || '').toLowerCase();
  if (alt.includes('sesudah') || alt.includes('selesai')) {
    img.src = FALLBACK_AFTER;
  } else {
    img.src = FALLBACK_BEFORE;
  }
}

// ==== Pemetaan data backend (BE-04) ke bentuk tampilan ====

const CATEGORY_LABEL: Record<string, string> = {
  FASILITAS_RUSAK: 'Fasilitas & Sanitasi',
  KEBERSIHAN: 'Fasilitas & Sanitasi',
  PUNGLI: 'Pungutan Liar',
  BAHAYA_K3: 'Bahaya Keselamatan (K3)',
};

function mapStatus(status: string): ReportItem['status'] {
  switch (status) {
    case 'RESOLVED':
      return 'Selesai';
    case 'IN_PROGRESS':
      return 'Diproses';
    case 'VERIFIED':
      return 'Diverifikasi';
    default:
      return 'Masuk';
  }
}

function formatTanggalPendek(input: string | Date | null | undefined): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatTanggalJam(input: string | Date | null | undefined): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  const tanggal = formatTanggalPendek(d);
  const jam = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${tanggal} · ${jam.replace(':', '.')} WIB`;
}

function mapIncidentToReportItem(detail: IncidentReportDetail): ReportItem {
  const villageName = detail.village?.name || 'Desa Wisata';
  const regency = detail.village?.regency || 'Jawa Tengah';
  const district = detail.village?.district ? `, ${detail.village.district}` : '';
  const tanggal = formatTanggalPendek(detail.createdAt);
  const status = mapStatus(detail.status);

  const timeline: TimelineStep[] = [
    { title: 'Laporan terkirim', date: formatTanggalJam(detail.createdAt), done: true },
  ];

  if (detail.status === 'IN_PROGRESS' || detail.status === 'RESOLVED') {
    timeline.push({
      title: 'Ditindaklanjuti pengelola desa',
      date: formatTanggalJam(detail.updatedAt),
      done: true,
    });
  }

  if (detail.status === 'RESOLVED' && detail.resolution) {
    timeline.push({
      title: 'Perbaikan selesai & terverifikasi',
      date: formatTanggalJam(detail.resolution.resolvedAt),
      done: true,
    });
  }

  const afterUrl = detail.resolution?.photoAfterUrl;

  return {
    id: detail.id,
    ticketCode: detail.reportCode,
    status,
    title: detail.title,
    summary: detail.description,
    detailDesc: detail.description,
    locationShort: `${villageName}, ${regency}`,
    locationFull: `${villageName}${district}, ${regency}`,
    date: tanggal,
    category: CATEGORY_LABEL[detail.category] || 'Fasilitas & Sanitasi',
    kabupaten: regency,
    desa: villageName,
    thumbImg: detail.photoBeforeUrl || REPORTS_DATA[0].thumbImg,
    beforePhoto: detail.photoBeforeUrl
      ? { url: detail.photoBeforeUrl, label: `Sebelum · ${tanggal}` }
      : undefined,
    afterPhoto:
      afterUrl && detail.resolution
        ? {
            url: afterUrl,
            label: `Sesudah · ${formatTanggalPendek(detail.resolution.resolvedAt)}`,
          }
        : undefined,
    deadlineAt:
      detail.status === 'RESOLVED' || !detail.deadlineAt
        ? null
        : typeof detail.deadlineAt === 'string'
          ? detail.deadlineAt
          : detail.deadlineAt.toISOString(),
    timeline,
  };
}

/** Chip tenggat SLA; menyegarkan label tiap menit. */
function SlaBadge({ deadlineAt }: { deadlineAt: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const sla = calculateSLARemaining(deadlineAt);
  const palette =
    sla.statusColor === 'crimson'
      ? 'bg-[#FDECEA] text-[#B3261E] border-[#F7C9C4]'
      : sla.statusColor === 'amber'
        ? 'bg-[#FFF4DC] text-[#936015] border-[#F3E0B5]'
        : 'bg-[#E7F5ED] text-[#16725C] border-[#BFE3D0]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${palette}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {sla.label}
    </span>
  );
}

function LaporContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua Kabupaten');
  const [selectedDesa, setSelectedDesa] = useState('Semua Desa');
  const [selectedKategori, setSelectedKategori] = useState('Semua kategori');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('Semua');

  // Data live dari BE-04; jatuh ke data contoh bila basis data belum tersedia
  const [reports, setReports] = useState<ReportItem[]>(REPORTS_DATA);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [activeReportId, setActiveReportId] = useState<string>(REPORTS_DATA[0].id);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; label: string } | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!lightboxImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImg]);

  useEffect(() => {
    let cancelled = false;

    getPublicReportsAction({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(mapIncidentToReportItem);
          setReports(mapped);
          setActiveReportId((prev) =>
            mapped.some((r) => r.id === prev) ? prev : mapped[0].id
          );
          setIsLive(true);
        }
      })
      .catch(() => {
        // Basis data belum siap: pertahankan data contoh
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sinkronisasi kode tiket dari URL (?code= / ?tiket= / ?id=)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('tiket') || params.get('id');
    if (!code) return;

    const clean = code.trim().toLowerCase();
    const match = reports.find((r) => {
      const t = r.ticketCode.toLowerCase();
      return (
        t === clean ||
        r.id.toLowerCase() === clean ||
        t.replace('lp-jtg', 'ds-jtg') === clean ||
        t.replace('ds-jtg', 'lp-jtg') === clean
      );
    });
    if (match) {
      // Pastikan laporan yang dituju tidak tersembunyi oleh filter aktif
      setSelectedKabupaten('Semua Kabupaten');
      setSelectedDesa('Semua Desa');
      setStatusFilter('Semua');
      setSelectedKategori('Semua kategori');
      setSearchQuery('');
      setActiveReportId(match.id);
      const idx = reports.findIndex((r) => r.id === match.id);
      if (idx !== -1) {
        setCurrentPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
      }
    } else {
      // Jika belum termuat di daftar publik, ambil langsung dari basis data
      getReportDetailAction(code.trim().toUpperCase())
        .then((res) => {
          if (res.success && res.data) {
            const mapped = mapIncidentToReportItem(res.data);
            setReports((prev) => [
              mapped,
              ...prev.filter((p) => p.ticketCode !== mapped.ticketCode),
            ]);
            setSelectedKabupaten('Semua Kabupaten');
            setSelectedDesa('Semua Desa');
            setStatusFilter('Semua');
            setSelectedKategori('Semua kategori');
            setSearchQuery('');
            setActiveReportId(mapped.id);
            setCurrentPage(1);
          }
        })
        .catch(() => {});
    }
  }, [reports]);

  // Opsi filter dibangun dari data yang tampil, bukan daftar statis
  const kabupatenOptions = useMemo(() => {
    const list = Array.from(new Set(reports.map((r) => r.kabupaten).filter(Boolean)));
    return ['Semua Kabupaten', ...list.sort((a, b) => a.localeCompare(b, 'id'))];
  }, [reports]);

  const desaOptions = useMemo(() => {
    const scoped =
      selectedKabupaten === 'Semua Kabupaten'
        ? reports
        : reports.filter((r) => r.kabupaten === selectedKabupaten);
    const list = Array.from(new Set(scoped.map((r) => r.desa).filter(Boolean)));
    return ['Semua Desa', ...list.sort((a, b) => a.localeCompare(b, 'id'))];
  }, [reports, selectedKabupaten]);

  // Jaga agar desa terpilih tetap valid saat kabupaten berganti
  useEffect(() => {
    if (selectedDesa !== 'Semua Desa' && !desaOptions.includes(selectedDesa)) {
      setSelectedDesa('Semua Desa');
    }
  }, [desaOptions, selectedDesa]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      if (statusFilter !== 'Semua' && item.status !== statusFilter) {
        return false;
      }
      if (selectedKabupaten !== 'Semua Kabupaten' && item.kabupaten !== selectedKabupaten) {
        return false;
      }
      if (selectedDesa !== 'Semua Desa' && item.desa !== selectedDesa) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode =
          item.ticketCode.toLowerCase().includes(q) ||
          item.ticketCode.toLowerCase().replace('lp-jtg', 'ds-jtg').includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.summary.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchDesc) return false;
      }
      if (selectedKategori !== 'Semua kategori' && item.category !== selectedKategori) {
        return false;
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery, selectedKategori, selectedKabupaten, selectedDesa]);

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

  // Jendela nomor halaman: 1 … (aktif ±1) … akhir, sisanya elipsis.
  const pageWindow = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) items.push('ellipsis');
    for (let p = start; p <= end; p += 1) items.push(p);
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const listTopRef = useRef<HTMLDivElement>(null);
  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(clamped);
    const nextReport = filteredReports[(clamped - 1) * ITEMS_PER_PAGE];
    if (nextReport) setActiveReportId(nextReport.id);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Active report selection
  const activeReport = useMemo(() => {
    const found = reports.find((r) => r.id === activeReportId);
    return found || paginatedReports[0] || filteredReports[0] || reports[0];
  }, [reports, activeReportId, paginatedReports, filteredReports]);

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
                placeholder="Contoh: LP-JTG-2026-0891 atau akses ke curug"
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
                {kabupatenOptions.map((kab) => (
                  <option key={kab} value={kab}>
                    {kab}
                  </option>
                ))}
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
                {desaOptions.map((desa) => (
                  <option key={desa} value={desa}>
                    {desa}
                  </option>
                ))}
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg sm:text-xl font-bold text-[#0D2453]">
            {selectedDesa === 'Semua Desa'
              ? selectedKabupaten === 'Semua Kabupaten'
                ? 'Semua laporan aduan warga'
                : `Laporan di ${selectedKabupaten}`
              : `Laporan di ${selectedDesa}`}
          </h2>
          <span className="text-xs sm:text-[13px] font-medium text-[#767676]">
            {isLoading ? (
              'Memuat data terbaru…'
            ) : isLive ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                Data live dari basis data desa
              </>
            ) : (
              'Data contoh · basis data belum terhubung'
            )}
          </span>
        </div>

        {/* 2-Column Master-Detail Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Left Column: Report Cards List (560px on desktop) */}
          <div ref={listTopRef} className="w-full lg:w-[560px] shrink-0 flex flex-col gap-4 scroll-mt-[112px]">
            {paginatedReports.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E6ECF5] p-8 text-center text-[#64748B] text-sm shadow-[0_1px_2px_rgba(13,36,83,0.035),0_6px_14px_-8px_rgba(13,36,83,0.10)] font-medium">
                {isLoading
                  ? 'Memuat laporan…'
                  : 'Tidak ada laporan yang sesuai dengan filter pencarian.'}
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
                          onError={handlePhotoError}
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
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3 pb-1 mt-1 text-[13px] text-[#64748B]">
              <span className="font-medium text-xs sm:text-[13px] text-[#767676] whitespace-nowrap">
                Menampilkan{' '}
                {filteredReports.length === 0
                  ? 0
                  : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredReports.length
                    )}`}{' '}
                dari {filteredReports.length}
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Halaman sebelumnya"
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white border border-[#E6ECF5] text-[#0D2453] transition-all cursor-pointer hover:border-[#CBD5E1] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E6ECF5] disabled:hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pageWindow.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-6 h-9 flex items-center justify-center text-[#94A3B8] select-none"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item)}
                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] transition-all cursor-pointer ${
                          currentPage === item
                            ? 'bg-[#0D2453] text-white font-bold shadow-[0_2px_6px_rgba(13,36,83,0.18)]'
                            : 'bg-white border border-[#E6ECF5] text-[#0D2453] font-semibold hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                        }`}
                        aria-label={`Halaman ${item}`}
                        aria-current={currentPage === item ? 'page' : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman berikutnya"
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white border border-[#E6ECF5] text-[#0D2453] transition-all cursor-pointer hover:border-[#CBD5E1] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E6ECF5] disabled:hover:bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-[#0D2453] font-mono tracking-wide">
                    {activeReport.ticketCode}
                  </span>

                  {/* Share & Copy Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const shareUrl =
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/lapor?code=${activeReport.ticketCode}`
                            : `https://dewijateng.jatengprov.go.id/lapor?code=${activeReport.ticketCode}`;
                        const text = `Pantau progres tindak lanjut aduan "${activeReport.title}" (${activeReport.ticketCode}) di portal DEWI JATENG: ${shareUrl}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F9F0] hover:bg-[#D1F4E2] text-[#128C7E] text-[11px] font-semibold border border-[#A7E8C5] transition-colors cursor-pointer"
                      title="Bagikan ke WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const shareUrl = `${window.location.origin}/lapor?code=${activeReport.ticketCode}`;
                          navigator.clipboard.writeText(shareUrl);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0D2453] text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                      title="Salin tautan tiket"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-600" />
                          <span>Salin Tautan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

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

                {activeReport.deadlineAt && (
                  <div className="pt-1">
                    <SlaBadge deadlineAt={activeReport.deadlineAt} />
                  </div>
                )}
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

              {/* 4. Sebelum & Sesudah Photos / Proof-of-Fix */}
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#0D2453]">
                    Sebelum &amp; sesudah (Proof-of-Fix)
                  </h4>

                  {/* Mode Toggle Button if afterPhoto exists */}
                  {activeReport.beforePhoto && activeReport.afterPhoto && (
                    <div className="flex items-center gap-1 p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => setViewMode('slider')}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          viewMode === 'slider'
                            ? 'bg-white text-[#0D2453] shadow-xs'
                            : 'text-[#64748B] hover:text-[#0D2453]'
                        }`}
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Slider Interaktif</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('side-by-side')}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          viewMode === 'side-by-side'
                            ? 'bg-white text-[#0D2453] shadow-xs'
                            : 'text-[#64748B] hover:text-[#0D2453]'
                        }`}
                      >
                        <Columns className="w-3 h-3" />
                        <span>Berdampingan</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Display Slider or Side-by-side */}
                {activeReport.beforePhoto && activeReport.afterPhoto && viewMode === 'slider' ? (
                  <div className="flex flex-col gap-2">
                    <div className="relative h-[240px] sm:h-[280px] rounded-[16px] overflow-hidden select-none border border-[#CBD5E1] bg-slate-950 group shadow-xs">
                      {/* After (Sesudah) Full Background */}
                      <img
                        src={activeReport.afterPhoto.url}
                        alt="Kondisi sesudah perbaikan"
                        onError={handlePhotoError}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-[#0D2453]/90 text-white text-[11px] font-bold shadow-md pointer-events-none">
                        Sesudah · {activeReport.afterPhoto.label.split('·')[1]?.trim() || 'Tuntas'}
                      </span>

                      {/* Before (Sebelum) Clipped Foreground */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{
                          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                        }}
                      >
                        <img
                          src={activeReport.beforePhoto.url}
                          alt="Kondisi sebelum perbaikan"
                          onError={handlePhotoError}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/80 text-white text-[11px] font-bold shadow-md">
                          Sebelum · {activeReport.beforePhoto.label.split('·')[1]?.trim() || 'Aduan'}
                        </span>
                      </div>

                      {/* Vertical Divider & Draggable Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl border border-slate-300 flex items-center justify-center text-[#0D2453] font-bold text-xs select-none">
                          ↔
                        </div>
                      </div>

                      {/* Transparent Range Input for Touch & Mouse Drag */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                        aria-label="Geser posisi perbandingan bukti fisik"
                      />

                      {/* Lightbox Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: activeReport.afterPhoto!.url,
                            label: `${activeReport.title} - Bukti Fisik Selesai`,
                          })
                        }
                        className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                        title="Perbesar gambar"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[11px] text-[#64748B] font-medium text-center">
                      Tarik atau geser tuas lingkaran putih di atas untuk memeriksa hasil fisik lapangan.
                    </span>
                  </div>
                ) : (
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
                            onError={handlePhotoError}
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
                            onError={handlePhotoError}
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
                )}
              </div>

              {/* 5. EXIF Metadata Validation (Proof-of-Fix Integrity) */}
              {activeReport.afterPhoto && (
                <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] p-4 flex flex-col gap-2.5 text-[#0D2453]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#0D2453]">
                      <ShieldCheck className="w-4 h-4 text-[#0D2453]" />
                      <span>Validasi Data Foto Lapangan</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                      EXIF terverifikasi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]/80">
                    <div>
                      <span className="text-[11px] text-[#64748B] block">Waktu dokumentasi:</span>
                      <span className="font-medium text-[#0D2453]">
                        {activeReport.afterPhoto.label.replace('Sesudah · ', '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#64748B] block">Perangkat &amp; lokasi:</span>
                      <span className="font-medium text-[#0D2453]">Kamera Pokdarwis · Geotagged</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed pt-1">
                    Foto perbaikan telah melalui verifikasi timestamp pemotretan dan kesesuaian koordinat GPS lokasi aduan.
                  </p>
                </div>
              )}

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
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImg.label}
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
                aria-label="Tutup pratinjau foto"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.label}
                onError={handlePhotoError}
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

export default function LaporPage() {
  return <LaporContent />;
}
