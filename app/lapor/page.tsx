'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Maximize2,
  X,
  MapPin,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Receipt,
  Eye,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

interface ReportItem {
  id: string;
  ticketCode: string;
  category: 'Akses & Jalan' | 'Fasilitas & Sanitasi' | 'Pungutan Liar' | 'Bahaya Keselamatan (K3)';
  title: string;
  desc: string;
  kabupaten: string;
  desa: string;
  date: string;
  reporter: string;
  status: 'Selesai' | 'Dalam Penanganan';
  slaLabel: string;
  beforePhoto?: string;
  afterPhoto?: string;
  response: {
    official: string;
    date: string;
    content: string;
  };
  budgetInfo?: {
    amount: string;
    source: string;
    transparencyUrl: string;
  };
  timeline: {
    title: string;
    date: string;
    done: boolean;
    note: string;
  }[];
}

const REPORT_ITEMS: ReportItem[] = [
  {
    id: 'rep-0891',
    ticketCode: 'DS-JTG-2026-0891',
    category: 'Akses & Jalan',
    title: 'Akses ke curug buruk dan pagar pengaman lapuk',
    desc: 'Jalur setapak tebing curug licin berlumpur saat hujan dan pagar pembatas bambu telah patah di beberapa titik rawan.',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    date: '1 Ags 2026 • 09.30 WIB',
    reporter: 'Pelapor Anonim',
    status: 'Selesai',
    slaLabel: 'Tuntas dalam 5 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Pemerintah Desa Candirejo & Pokdarwis',
      date: '12 Okt 2026 • 14.15 WIB',
      content: 'Pekerjaan rabat beton jalan setapak 240 meter tuntas dikerjakan bersama warga. Pagar pengaman besi galvanis telah dipasang permanen.',
    },
    budgetInfo: {
      amount: 'Rp 100.000.000',
      source: 'Bantuan Provinsi 2026',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Aduan Diterima & Verifikasi GPS',
        date: '1 Ags 2026 • 09.30 WIB',
        done: true,
        note: 'Titik koordinat dan keabsahan foto disetujui tim verifikator.',
      },
      {
        title: 'Disposisi & Penerbitan SPK',
        date: '2 Ags 2026 • 11.00 WIB',
        done: true,
        note: 'Surat perintah kerja diterbitkan untuk Pokdarwis Candirejo.',
      },
      {
        title: 'Realisasi Fisik & Upload Bukti Kuitansi',
        date: '12 Okt 2026 • 14.15 WIB',
        done: true,
        note: 'Pekerjaan selesai 100%. Bukti nota kasir dan foto hasil kerja tervalidasi.',
      },
    ],
  },
  {
    id: 'rep-0744',
    ticketCode: 'DS-JTG-2026-0744',
    category: 'Fasilitas & Sanitasi',
    title: 'Wastafel mampet dan kran air toilet tidak mengalir',
    desc: 'Dua bilik toilet umum di area parkir utama wisata mampet, kran cuci tangan patah, dan penampungan air kosong.',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    date: '6 Okt 2026 • 11.20 WIB',
    reporter: 'Pelapor Anonim',
    status: 'Selesai',
    slaLabel: 'Tuntas dalam 3 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Unit Pengelola Kebersihan Desa Candirejo',
      date: '9 Okt 2026 • 16.00 WIB',
      content: 'Instalasi pipa suplai diganti baru, kran air otomatis dipasang, dan jadwal kuras tandon dijadwalkan berkala tiap dua hari.',
    },
    budgetInfo: {
      amount: 'Rp 15.000.000',
      source: 'PADes Wisata Candirejo',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Laporan Masuk',
        date: '6 Okt 2026 • 11.20 WIB',
        done: true,
        note: 'Aduan masuk kategori fasilitas sanitasi.',
      },
      {
        title: 'Pemeriksaan Pipa & Pengadaan Material',
        date: '7 Okt 2026 • 14.00 WIB',
        done: true,
        note: 'Pipa tersumbat lumut tebal, diputuskan penggantian pipa paralon.',
      },
      {
        title: 'Perbaikan Selesai & Sanitasi Bersih',
        date: '9 Okt 2026 • 16.00 WIB',
        done: true,
        note: 'Air mengalir normal, sanitasi berfungsi optimal kembali.',
      },
    ],
  },
  {
    id: 'rep-0922',
    ticketCode: 'DS-JTG-2026-0922',
    category: 'Pungutan Liar',
    title: 'Tarif parkir liar tidak sesuai plang karcis resmi',
    desc: 'Oknum petugas di pintu masuk timur menarik retribusi parkir mobil Rp 20.000 tanpa karcis bernomor seri Pemkab.',
    kabupaten: 'Kabupaten Banjarnegara',
    desa: 'Desa Dieng Kulon',
    date: '18 Okt 2026 • 13.45 WIB',
    reporter: 'Wisatawan Domestik',
    status: 'Selesai',
    slaLabel: 'Tuntas dalam 24 jam',
    beforePhoto: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Satgas Pengawasan Pariwisata Dieng & Bhabinkamtibmas',
      date: '19 Okt 2026 • 10.00 WIB',
      content: 'Penertiban langsung di lokasi. Petugas liar dipindahtugaskan dan papan pengumuman tarif resmi Perda telah ditegakkan di 4 titik pintu masuk.',
    },
    timeline: [
      {
        title: 'Laporan Prioritas Pungli Diterima',
        date: '18 Okt 2026 • 13.45 WIB',
        done: true,
        note: 'Eskalasi darurat SLA 24 jam ke BUMDes Dieng Kulon.',
      },
      {
        title: 'Sidang Lapangan Bersama Pokdarwis',
        date: '18 Okt 2026 • 17.00 WIB',
        done: true,
        note: 'Klarifikasi dan penertiban oknum penarik parkir liar.',
      },
      {
        title: 'Pemasangan Plang Tarif Resmi & Pos Pantau',
        date: '19 Okt 2026 • 10.00 WIB',
        done: true,
        note: 'Sistem karcis barcode terpusat diaktifkan.',
      },
    ],
  },
  {
    id: 'rep-0955',
    ticketCode: 'DS-JTG-2026-0955',
    category: 'Bahaya Keselamatan (K3)',
    title: 'Bantalan kayu titian jembatan retak dan berderit',
    desc: 'Bantalan penyangga papan titian wisata hutan pinus tampak retak melintang dan goyang saat dilewati kelompok wisatawan.',
    kabupaten: 'Kabupaten Banyumas',
    desa: 'Desa Limpakuwus',
    date: '21 Okt 2026 • 15.10 WIB',
    reporter: 'Pelapor Anonim',
    status: 'Dalam Penanganan',
    slaLabel: 'Sisa SLA: 2 hari kerja',
    beforePhoto: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Dinas Pemuda Olahraga & Pariwisata Kab. Banyumas',
      date: '22 Okt 2026 • 09.00 WIB',
      content: 'Wahana titian kayu telah ditutup sementara dengan garis pembatas bahaya. Tim teknis konstruksi sedang menguji beban dan menghitung RAB penggantian balok baja.',
    },
    timeline: [
      {
        title: 'Laporan Diterima & Validasi Titik K3',
        date: '21 Okt 2026 • 15.10 WIB',
        done: true,
        note: 'Kategori bahaya keselamatan berisiko tinggi.',
      },
      {
        title: 'Penutupan Sementara Akses Wahana',
        date: '22 Okt 2026 • 09.00 WIB',
        done: true,
        note: 'Pemasangan police line dan pengumuman penutupan demi keselamatan pengunjung.',
      },
      {
        title: 'Penggantian Struktur Penopang',
        date: '23 Okt 2026 (Sedang Berjalan)',
        done: false,
        note: 'Proses pemotongan dan perakitan rangka penopang baru.',
      },
    ],
  },
  {
    id: 'rep-0971',
    ticketCode: 'DS-JTG-2026-0971',
    category: 'Akses & Jalan',
    title: 'Material longsor menutup separuh lajur masuk air terjun',
    desc: 'Tebing setinggi 3 meter longsor akibat hujan deras semalam, menutup sebagian jalan paving akses kendaraan shuttle wisata.',
    kabupaten: 'Kabupaten Karanganyar',
    desa: 'Desa Berjo',
    date: '23 Okt 2026 • 08.00 WIB',
    reporter: 'Pengelola Homestay Warga',
    status: 'Dalam Penanganan',
    slaLabel: 'Sisa SLA: 1 hari kerja',
    beforePhoto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Relawan BPBD & Pengelola Wisata Air Terjun Jumog',
      date: '23 Okt 2026 • 10.30 WIB',
      content: 'Pembersihan tanah longsor sedang berlangsung menggunakan alat berat mini. Direncanakan pembuatan bronjong kawat untuk menahan tebing.',
    },
    timeline: [
      {
        title: 'Laporan Darurat Masuk',
        date: '23 Okt 2026 • 08.00 WIB',
        done: true,
        note: 'Akses terhambat 50%, kendaraan roda empat dialihkan.',
      },
      {
        title: 'Pengerukan Lumpur & Batu',
        date: '23 Okt 2026 • 10.30 WIB (Sedang Berjalan)',
        done: false,
        note: 'Proses evakuasi material dan pemasangan terpal pelindung tebing.',
      },
    ],
  },
  {
    id: 'rep-0680',
    ticketCode: 'DS-JTG-2026-0680',
    category: 'Fasilitas & Sanitasi',
    title: 'Kekurangan tempat sampah di rute tubing genting',
    desc: 'Pengunjung meninggalkan botol dan bungkus makanan di bebatuan pinggir sungai karena ketiadaan tempat sampah terpilah di titik finish.',
    kabupaten: 'Kabupaten Kendal',
    desa: 'Desa Getas (Tubing Genting)',
    date: '11 Okt 2026 • 14.00 WIB',
    reporter: 'Komunitas Pecinta Alam',
    status: 'Selesai',
    slaLabel: 'Tuntas dalam 4 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Pengurus Pokdarwis Tubing Genting Getas',
      date: '15 Okt 2026 • 11.00 WIB',
      content: 'Telah dipasang 8 set tempat sampah pilah (organik, anorganik, residu) di sepanjang dermaga start dan rest area finish.',
    },
    budgetInfo: {
      amount: 'Rp 8.500.000',
      source: 'Operasional Pokdarwis 2026',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Laporan Diterima',
        date: '11 Okt 2026 • 14.00 WIB',
        done: true,
        note: 'Verifikasi volume sampah dan titik kumpul.',
      },
      {
        title: 'Pengadaan Tong Sampah Pilah',
        date: '13 Okt 2026 • 10.00 WIB',
        done: true,
        note: 'Pemesanan 8 set tong sampah drum baja ramah lingkungan.',
      },
      {
        title: 'Pemasangan & Pembersihan Total',
        date: '15 Okt 2026 • 11.00 WIB',
        done: true,
        note: 'Area sungai bersih kembali dan edukasi buang sampah dipasang.',
      },
    ],
  },
];

const KABUPATEN_OPTIONS = [
  'Semua Kabupaten',
  'Kabupaten Magelang',
  'Kabupaten Banyumas',
  'Kabupaten Kendal',
  'Kabupaten Karanganyar',
  'Kabupaten Banjarnegara',
  'Kabupaten Wonosobo',
];

const STATUS_FILTERS = [
  'Semua Status',
  'Dalam Penanganan',
  'Selesai',
];

const CATEGORY_FILTERS = [
  'Semua Kategori',
  'Akses & Jalan',
  'Fasilitas & Sanitasi',
  'Pungutan Liar',
  'Bahaya Keselamatan (K3)',
];

export default function LaporPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua Kabupaten');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  // Modal Detail State
  const [activeDetailItem, setActiveDetailItem] = useState<ReportItem | null>(null);

  // Lightbox State
  const [activeLightbox, setActiveLightbox] = useState<{
    url: string;
    title: string;
    tag: string;
  } | null>(null);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return REPORT_ITEMS.filter((item) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.ticketCode.toLowerCase().includes(q);
        const matchDesa = item.desa.toLowerCase().includes(q);
        const matchKab = item.kabupaten.toLowerCase().includes(q);
        const matchDesc = item.desc.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesa && !matchKab && !matchDesc) {
          return false;
        }
      }

      // 2. Kabupaten Filter
      if (selectedKabupaten !== 'Semua Kabupaten' && item.kabupaten !== selectedKabupaten) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'Semua Status' && item.status !== selectedStatus) {
        return false;
      }

      // 4. Category Filter
      if (selectedCategory !== 'Semua Kategori' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedKabupaten, selectedStatus, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-[32px] mt-4 mb-20">
      {/* 1. Header & Call to Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-[#0D2453]">
            <div className="w-8 h-8 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0D2453]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D2453]">
              Telusur & Jelajah Aduan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#767676] mt-1.5 max-w-2xl">
            Pantau transparansi penanganan pengaduan fisik fasilitas, penertiban pungutan, dan bukti realisasi SPJ desa wisata se-Jawa Tengah.
          </p>
        </div>

        <Link
          href="/#buat-laporan"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0 active:scale-95 group"
        >
          <span>+ Buat Laporan Baru</span>
          <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2. Top Summary Stat Counters */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0 font-extrabold text-lg">
            889
          </div>
          <div>
            <div className="text-xs font-bold text-[#767676] uppercase tracking-wide">
              Total Aduan Masuk
            </div>
            <div className="text-sm font-bold text-[#0D2453] mt-0.5">
              Warga & Wisatawan Jateng
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-extrabold text-lg">
            51
          </div>
          <div>
            <div className="text-xs font-bold text-[#767676] uppercase tracking-wide">
              Dalam Penanganan
            </div>
            <div className="text-sm font-bold text-[#0D2453] mt-0.5">
              Timer SLA Aktif & Verifikasi
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6FFFA] text-[#319795] flex items-center justify-center shrink-0 font-extrabold text-lg">
            838
          </div>
          <div>
            <div className="text-xs font-bold text-[#767676] uppercase tracking-wide">
              Selesai & Ada Bukti SPJ
            </div>
            <div className="text-sm font-bold text-[#0D2453] mt-0.5">
              94,2% Tingkat Keterbukaan
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search Bar & Filter Controls Card */}
      <div className="bg-white rounded-3xl border border-[#EBEBEB] p-5 sm:p-6 shadow-xs space-y-4">
        {/* Row 1: Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode tiket (contoh: DS-JTG-2026-0891), nama desa wisata, atau topik masalah..."
            className="w-full bg-[#F5F5F5] border-0 rounded-2xl pl-12 pr-4 py-3.5 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Select Dropdowns & Category Pills */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Kabupaten Dropdown */}
          <div className="md:col-span-4 relative">
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-2.5 text-xs text-[#0D2453] font-bold focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
            >
              {KABUPATEN_OPTIONS.map((kab) => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Kategori Dropdown */}
          <div className="md:col-span-4 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-2.5 text-xs text-[#0D2453] font-bold focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
            >
              {CATEGORY_FILTERS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Tabs */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STATUS_FILTERS.map((st) => {
              const isActive = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#0D2453] text-white shadow-2xs'
                      : 'bg-[#F5F5F5] text-[#767676] hover:text-[#0D2453]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Results Header & Count */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-[#767676]">
          Menampilkan <span className="text-[#0D2453]">{filteredReports.length}</span> laporan publik
        </div>
        {(searchQuery || selectedKabupaten !== 'Semua Kabupaten' || selectedStatus !== 'Semua Status' || selectedCategory !== 'Semua Kategori') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedKabupaten('Semua Kabupaten');
              setSelectedStatus('Semua Status');
              setSelectedCategory('Semua Kategori');
            }}
            className="text-xs font-bold text-[#0D2453] hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 5. Report Cards Grid (2 Columns, Lapor Semar Style) */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EBEBEB] p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0D2453]">Tidak ada aduan yang sesuai</h3>
          <p className="text-xs text-[#767676] mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kabupaten dan kategori.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {filteredReports.map((item) => {
            const isCompleted = item.status === 'Selesai';

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#EBEBEB] p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Card Header: Ticket Code, Category, Status Badge */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#0D2453] tracking-wide">
                          {item.ticketCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#0D2453] border border-[#EBEBEB]">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#767676] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.desa}, {item.kabupaten}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isCompleted
                            ? 'bg-[#E6FFFA] text-[#319795] border-[#B2F5EA]'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-[#767676] font-medium">
                        {item.slaLabel}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Content */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-[#0D2453] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#4A5568] mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Photos: Before & After (If Available) */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Before Photo */}
                    {item.beforePhoto && (
                      <div>
                        <div className="text-[11px] font-bold text-[#767676] mb-1">
                          Kondisi Awal
                        </div>
                        <div
                          onClick={() =>
                            setActiveLightbox({
                              url: item.beforePhoto!,
                              title: `${item.ticketCode} - Kondisi Awal`,
                              tag: 'Sebelum Perbaikan',
                            })
                          }
                          className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer shadow-2xs"
                        >
                          <img
                            src={item.beforePhoto}
                            alt="Kondisi Awal"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* After Photo or Processing Placeholder */}
                    {item.afterPhoto ? (
                      <div>
                        <div className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hasil Perbaikan (Proof-of-Fix)</span>
                        </div>
                        <div
                          onClick={() =>
                            setActiveLightbox({
                              url: item.afterPhoto!,
                              title: `${item.ticketCode} - Hasil Perbaikan`,
                              tag: 'Sesudah Selesai',
                            })
                          }
                          className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer shadow-2xs"
                        >
                          <img
                            src={item.afterPhoto}
                            alt="Hasil Perbaikan"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tahap Eksekusi</span>
                        </div>
                        <div className="aspect-[4/3] rounded-2xl bg-[#F7F9FC] border border-dashed border-amber-300 flex flex-col items-center justify-center p-4 text-center">
                          <Clock className="w-6 h-6 text-amber-600 mb-1.5 animate-pulse" />
                          <span className="text-[11px] font-bold text-[#0D2453]">
                            Petugas di Lapangan
                          </span>
                          <span className="text-[10px] text-[#767676] mt-0.5">
                            Wajib upload foto fisik untuk tutup tiket
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Official Response Box (Tindak Lanjut Desa) */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] border-l-4 border-l-[#0D2453] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#0D2453]">
                        {item.response.official}
                      </span>
                      <span className="text-[#767676]">{item.response.date}</span>
                    </div>
                    <p className="text-xs text-[#4A5568] leading-relaxed">
                      {item.response.content}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Budget / SPJ Link & Detail Trigger */}
                <div className="pt-3 border-t border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {item.budgetInfo ? (
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#0D2453] shrink-0" />
                      <div className="text-[11px]">
                        <span className="text-[#767676]">Realisasi: </span>
                        <span className="font-bold text-[#0D2453]">{item.budgetInfo.amount}</span>
                        <Link
                          href={item.budgetInfo.transparencyUrl}
                          className="inline-flex items-center gap-0.5 text-[#0D2453] font-bold ml-2 hover:underline"
                        >
                          <span>Cek SPJ ↗</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#767676]">
                      {item.reporter} • {item.date}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveDetailItem(item)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5F5F5] hover:bg-slate-200 text-xs font-bold text-[#0D2453] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Linimasa Tiket</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Bottom Banner: Report Issue CTA */}
      <section className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0D2453]">
            Menemukan kejanggalan atau fasilitas rusak di desa wisata?
          </h2>
          <p className="text-xs text-[#767676] mt-1 max-w-2xl">
            Sampaikan pengaduan melalui formulir instan di Beranda. Laporan Anda tercatat langsung di dashboard pengawasan Pemprov Jateng dengan garansi SLA tuntas.
          </p>
        </div>
        <Link
          href="/#buat-laporan"
          className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold shadow-xs transition-all shrink-0 active:scale-95"
        >
          <span>Buka Formulir Beranda</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </section>

      {/* 7. Modal: Timeline Detail */}
      <AnimatePresence>
        {activeDetailItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setActiveDetailItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-[#EBEBEB] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#EBEBEB] pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#0D2453]">
                      {activeDetailItem.ticketCode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeDetailItem.status === 'Selesai'
                          ? 'bg-[#E6FFFA] text-[#319795]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeDetailItem.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0D2453] mt-1">
                    {activeDetailItem.title}
                  </h3>
                  <span className="text-xs text-[#767676] block mt-0.5">
                    {activeDetailItem.desa}, {activeDetailItem.kabupaten}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailItem(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-4 py-2">
                <h4 className="text-xs font-bold text-[#767676] uppercase tracking-wider">
                  Riwayat & Linimasa Penanganan
                </h4>
                <div className="space-y-3.5">
                  {activeDetailItem.timeline.map((st, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {st.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-[#0D2453]">{st.title}</div>
                        <div className="text-[10px] text-[#767676] mt-0.5">{st.date}</div>
                        <div className="text-[11px] text-[#4A5568] mt-1 leading-snug">
                          {st.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget transparency link */}
              {activeDetailItem.budgetInfo && (
                <div className="mt-5 p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#767676] block uppercase font-bold">
                      Realisasi Buku Kas
                    </span>
                    <span className="text-xs font-bold text-[#0D2453]">
                      {activeDetailItem.budgetInfo.amount} ({activeDetailItem.budgetInfo.source})
                    </span>
                  </div>
                  <Link
                    href={activeDetailItem.budgetInfo.transparencyUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] hover:underline"
                  >
                    <span>Buka SPJ</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-3 border-t border-[#EBEBEB]">
                <button
                  type="button"
                  onClick={() => setActiveDetailItem(null)}
                  className="w-full py-2.5 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold transition-all"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setActiveLightbox(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative border border-slate-700/50"
            >
              <div className="relative aspect-[16/10] bg-slate-900">
                <img
                  src={activeLightbox.url}
                  alt={activeLightbox.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveLightbox(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-xs font-bold">
                  {activeLightbox.tag}
                </span>
              </div>
              <div className="p-4 sm:p-5 bg-white">
                <h4 className="text-sm font-bold text-[#0D2453]">
                  {activeLightbox.title}
                </h4>
                <p className="text-xs text-[#767676] mt-0.5">
                  Foto bukti verifikasi fisik pengawasan tata kelola desa wisata Jawa Tengah.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
