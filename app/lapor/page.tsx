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
  FileText,
  Receipt,
  Camera,
  ChevronRight,
  Filter,
  Check
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
    title: 'Akses jalan setapak curug berlumpur dan pagar lapuk',
    desc: 'Jalur setapak tebing curug licin saat hujan dan pagar pembatas bambu telah patah di titik rawan.',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    date: '1 Ags 2026',
    reporter: 'Pelapor Anonim',
    status: 'Selesai',
    slaLabel: 'Tuntas 5 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Pemerintah Desa Candirejo & Pokdarwis',
      date: '12 Okt 2026',
      content: 'Rabat beton jalan setapak 240 meter telah rampung dikerjakan. Pagar besi galvanis dipasang permanen.',
    },
    budgetInfo: {
      amount: 'Rp 100.000.000',
      source: 'Bantuan Provinsi 2026',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Aduan Masuk & Verifikasi Lapangan',
        date: '1 Ags 2026 • 09.30 WIB',
        done: true,
        note: 'Titik koordinat dan keabsahan foto disetujui tim pengawas.',
      },
      {
        title: 'Penerbitan Surat Perintah Kerja',
        date: '2 Ags 2026 • 11.00 WIB',
        done: true,
        note: 'Pekerjaan fisik dirapatkan bersama warga dan Pokdarwis.',
      },
      {
        title: 'Realisasi Fisik & Verifikasi SPJ',
        date: '12 Okt 2026 • 14.15 WIB',
        done: true,
        note: 'Rabat beton selesai 100%. Bukti nota dan dokumentasi terarsip di buku kas.',
      },
    ],
  },
  {
    id: 'rep-0744',
    ticketCode: 'DS-JTG-2026-0744',
    category: 'Fasilitas & Sanitasi',
    title: 'Wastafel mampet dan kran air toilet tidak mengalir',
    desc: 'Dua bilik toilet umum di area parkir utama mampet dan kran cuci tangan patah.',
    kabupaten: 'Kabupaten Magelang',
    desa: 'Desa Candirejo',
    date: '6 Okt 2026',
    reporter: 'Pelapor Anonim',
    status: 'Selesai',
    slaLabel: 'Tuntas 3 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Unit Pengelola Kebersihan Desa Candirejo',
      date: '9 Okt 2026',
      content: 'Instalasi pipa suplai diganti baru, kran dipasang ulang, dan tandon air dikuras rutin.',
    },
    budgetInfo: {
      amount: 'Rp 15.000.000',
      source: 'PADes Wisata Candirejo',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Laporan Divalidasi Petugas',
        date: '6 Okt 2026 • 11.20 WIB',
        done: true,
        note: 'Pemeriksaan pipa tersumbat dan kran patah.',
      },
      {
        title: 'Penggantian Pipa & Keran',
        date: '7 Okt 2026 • 14.00 WIB',
        done: true,
        note: 'Pembelian pipa paralon baru menggunakan dana pemeliharaan.',
      },
      {
        title: 'Pekerjaan Selesai',
        date: '9 Okt 2026 • 16.00 WIB',
        done: true,
        note: 'Air mengalir normal dan fasilitas dibuka kembali.',
      },
    ],
  },
  {
    id: 'rep-0922',
    ticketCode: 'DS-JTG-2026-0922',
    category: 'Pungutan Liar',
    title: 'Tarif parkir liar tanpa karcis resmi di pintu timur',
    desc: 'Tarif parkir mobil ditarik Rp 20.000 tanpa karcis bernomor seri pemerintah daerah.',
    kabupaten: 'Kabupaten Banjarnegara',
    desa: 'Desa Dieng Kulon',
    date: '18 Okt 2026',
    reporter: 'Wisatawan Domestik',
    status: 'Selesai',
    slaLabel: 'Tuntas 24 jam',
    beforePhoto: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Satgas Pengawasan Pariwisata Dieng & Bhabinkamtibmas',
      date: '19 Okt 2026',
      content: 'Penertiban langsung di lokasi. Plang tarif resmi Perda dipasang di 4 pintu masuk kawasan wisata.',
    },
    timeline: [
      {
        title: 'Eskalasi Prioritas 24 Jam',
        date: '18 Okt 2026 • 13.45 WIB',
        done: true,
        note: 'Laporan masuk satgas pungli kabupaten.',
      },
      {
        title: 'Penertiban Lapangan',
        date: '18 Okt 2026 • 17.00 WIB',
        done: true,
        note: 'Klarifikasi oknum pengelola dan penegakan tarif Perda.',
      },
      {
        title: 'Pemasangan Pos Resmi & Karcis Barcode',
        date: '19 Okt 2026 • 10.00 WIB',
        done: true,
        note: 'Karcis resmi terpadu BUMDes mulai beroperasi penuh.',
      },
    ],
  },
  {
    id: 'rep-0955',
    ticketCode: 'DS-JTG-2026-0955',
    category: 'Bahaya Keselamatan (K3)',
    title: 'Bantalan kayu titian jembatan retak dan goyang',
    desc: 'Bantalan penyangga papan titian hutan pinus retak melintang dan bergoyang saat dilewati pengunjung.',
    kabupaten: 'Kabupaten Banyumas',
    desa: 'Desa Limpakuwus',
    date: '21 Okt 2026',
    reporter: 'Pelapor Anonim',
    status: 'Dalam Penanganan',
    slaLabel: 'Sisa SLA: 2 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Dinas Pemuda Olahraga & Pariwisata Kab. Banyumas',
      date: '22 Okt 2026',
      content: 'Wahana titian kayu ditutup sementara demi keselamatan. Tim teknis sedang menguji beban dan merakit rangka pengganti.',
    },
    timeline: [
      {
        title: 'Aduan Diterima',
        date: '21 Okt 2026 • 15.10 WIB',
        done: true,
        note: 'Kategori bahaya keselamatan diprioritaskan.',
      },
      {
        title: 'Penutupan Akses Wahana Sementara',
        date: '22 Okt 2026 • 09.00 WIB',
        done: true,
        note: 'Pemasangan garis pengaman di tangga titian jembatan.',
      },
      {
        title: 'Pergantian Balok Rangka',
        date: '23 Okt 2026 (Berlangsung)',
        done: false,
        note: 'Proses pengelasan dan penggantian bantalan kayu.',
      },
    ],
  },
  {
    id: 'rep-0971',
    ticketCode: 'DS-JTG-2026-0971',
    category: 'Akses & Jalan',
    title: 'Material longsor menutup separuh lajur jalan shuttle',
    desc: 'Tebing setinggi 3 meter longsor menutup sebagian jalan paving menuju pos air terjun.',
    kabupaten: 'Kabupaten Karanganyar',
    desa: 'Desa Berjo',
    date: '23 Okt 2026',
    reporter: 'Pengelola Homestay Warga',
    status: 'Dalam Penanganan',
    slaLabel: 'Sisa SLA: 1 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Relawan BPBD & Pengelola Wisata Air Terjun Jumog',
      date: '23 Okt 2026',
      content: 'Pembersihan tanah longsor sedang berlangsung dengan alat berat mini dan pemasangan bronjong kawat.',
    },
    timeline: [
      {
        title: 'Laporan Masuk',
        date: '23 Okt 2026 • 08.00 WIB',
        done: true,
        note: 'Akses kendaraan roda empat dialihkan ke jalur lingkar.',
      },
      {
        title: 'Pengerukan Lumpur & Batu',
        date: '23 Okt 2026 • 10.30 WIB (Berlangsung)',
        done: false,
        note: 'Evakuasi batu dan pembersihan jalan paving.',
      },
    ],
  },
  {
    id: 'rep-0680',
    ticketCode: 'DS-JTG-2026-0680',
    category: 'Fasilitas & Sanitasi',
    title: 'Kekurangan tempat sampah di titik finish tubing',
    desc: 'Bungkus makanan menumpuk di bebatuan sungai karena belum ada tempat sampah pilah di dermaga finish.',
    kabupaten: 'Kabupaten Kendal',
    desa: 'Desa Getas (Tubing Genting)',
    date: '11 Okt 2026',
    reporter: 'Komunitas Pecinta Alam',
    status: 'Selesai',
    slaLabel: 'Tuntas 4 hari',
    beforePhoto: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    response: {
      official: 'Pengurus Pokdarwis Tubing Genting Getas',
      date: '15 Okt 2026',
      content: '8 set tempat sampah terpilah (organik, anorganik, residu) dipasang di dermaga start dan rest area finish.',
    },
    budgetInfo: {
      amount: 'Rp 8.500.000',
      source: 'Operasional Pokdarwis 2026',
      transparencyUrl: '/transparansi',
    },
    timeline: [
      {
        title: 'Verifikasi Laporan',
        date: '11 Okt 2026 • 14.00 WIB',
        done: true,
        note: 'Pemeriksaan titik penumpukan sampah di tepian sungai.',
      },
      {
        title: 'Pengadaan Tempat Sampah Pilah',
        date: '13 Okt 2026 • 10.00 WIB',
        done: true,
        note: 'Pembelian 8 set drum sampah tertutup.',
      },
      {
        title: 'Pemasangan & Edukasi Wisatawan',
        date: '15 Okt 2026 • 11.00 WIB',
        done: true,
        note: 'Pemasangan plang ajakan menjaga kebersihan sungai.',
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
];

const CATEGORY_OPTIONS = [
  'Semua Kategori',
  'Akses & Jalan',
  'Fasilitas & Sanitasi',
  'Pungutan Liar',
  'Bahaya Keselamatan (K3)',
];

export default function LaporPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua Kabupaten');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | 'Dalam Penanganan' | 'Selesai'>('Semua');

  // Slide-over Drawer State
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null);

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState<{ url: string; label: string } | null>(null);

  const filteredReports = useMemo(() => {
    return REPORT_ITEMS.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.ticketCode.toLowerCase().includes(q);
        const matchDesa = item.desa.toLowerCase().includes(q);
        const matchKab = item.kabupaten.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesa && !matchKab) return false;
      }

      if (selectedKabupaten !== 'Semua Kabupaten' && item.kabupaten !== selectedKabupaten) {
        return false;
      }

      if (selectedCategory !== 'Semua Kategori' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== 'Semua' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedKabupaten, selectedCategory, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 mt-4 mb-24">
      {/* 1. Header Bar: Minimal, Direct, Linear-style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D2453]">
              Telusur Aduan
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAEFF7] text-[#0D2453]">
              889 aduan
            </span>
          </div>
          <p className="text-xs text-[#767676] mt-0.5">
            Daftar laporan masyarakat dan realisasi perbaikan fasilitas desa wisata Jawa Tengah.
          </p>
        </div>

        <Link
          href="/#buat-laporan"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto active:scale-95"
        >
          <span>+ Buat Laporan</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
        </Link>
      </div>

      {/* 2. Unified Filter Row (Single Flat Toolbar) */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] p-2.5 shadow-2xs flex flex-col md:flex-row items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode tiket, nama desa, atau topik masalah..."
            className="w-full bg-[#F5F5F5] border-0 rounded-xl pl-9 pr-3 py-2 text-xs text-[#0D2453] placeholder:text-[#767676] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Kabupaten */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-[#0D2453] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
            >
              {KABUPATEN_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Kategori */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-[#0D2453] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl w-full md:w-auto shrink-0">
          {(['Semua', 'Dalam Penanganan', 'Selesai'] as const).map((st) => {
            const isActive = selectedStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#0D2453] font-bold shadow-2xs'
                    : 'text-[#767676] hover:text-[#0D2453]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Compact List Table (Linear / GitHub Issues Style) */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden shadow-xs">
        {/* Table Head */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#F9FAFC] border-b border-[#EBEBEB] text-[11px] font-semibold text-[#767676]">
          <div className="col-span-2">Tiket & Status</div>
          <div className="col-span-5">Keluhan & Lokasi</div>
          <div className="col-span-2">Kategori</div>
          <div className="col-span-2">Realisasi Kas</div>
          <div className="col-span-1 text-right">Tanggal</div>
        </div>

        {/* Table Rows */}
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#767676]">
            Tidak ada laporan yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {filteredReports.map((item) => {
              const isDone = item.status === 'Selesai';

              return (
                <motion.div
                  key={item.id}
                  layout
                  onClick={() => setSelectedItem(item)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-4 sm:px-5 py-3.5 items-center hover:bg-[#F7F9FC] transition-colors cursor-pointer group select-none"
                >
                  {/* Col 1: Status Dot & Ticket */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      <span className="text-xs font-bold text-[#0D2453] tracking-wide">
                        {item.ticketCode}
                      </span>
                    </div>

                    {/* Mobile-only status tag */}
                    <span
                      className={`md:hidden text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Col 2: Title & Village */}
                  <div className="md:col-span-5 min-w-0 pr-2">
                    <div className="text-xs font-semibold text-[#0D2453] truncate group-hover:text-blue-900 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#767676] truncate mt-0.5">
                      {item.desa}, {item.kabupaten}
                    </div>
                  </div>

                  {/* Col 3: Category */}
                  <div className="md:col-span-2 hidden md:block">
                    <span className="inline-block text-[11px] font-medium text-[#4A5568] bg-[#F5F5F5] px-2 py-0.5 rounded-md truncate max-w-full">
                      {item.category}
                    </span>
                  </div>

                  {/* Col 4: Budget / SPJ */}
                  <div className="md:col-span-2 hidden md:flex items-center gap-1.5 text-xs text-[#0D2453]">
                    {item.budgetInfo ? (
                      <span className="font-semibold">{item.budgetInfo.amount}</span>
                    ) : (
                      <span className="text-[#A0AEC0]">-</span>
                    )}
                  </div>

                  {/* Col 5: Date & Arrow */}
                  <div className="md:col-span-1 flex items-center justify-between md:justify-end text-[11px] text-[#767676]">
                    <span className="truncate">{item.date}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D2453] transition-colors ml-1 hidden md:block" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Slide-over Detail Drawer (Panel Kanan) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            />

            {/* Slide Drawer */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="w-screen max-w-md bg-white border-l border-[#EBEBEB] shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-[#EBEBEB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedItem.status === 'Selesai' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                    <span className="text-sm font-bold text-[#0D2453]">
                      {selectedItem.ticketCode}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedItem.status === 'Selesai'
                          ? 'bg-[#E6FFFA] text-[#319795]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedItem.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Scrollable Body */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                  {/* Title & Meta */}
                  <div>
                    <h3 className="text-base font-bold text-[#0D2453] leading-snug">
                      {selectedItem.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#767676] mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedItem.desa}, {selectedItem.kabupaten}</span>
                    </div>
                    <p className="text-xs text-[#4A5568] mt-2.5 leading-relaxed bg-[#F7F9FC] p-3 rounded-xl border border-[#EBEBEB]">
                      {selectedItem.desc}
                    </p>
                  </div>

                  {/* Photo Evidence (Kondisi Awal vs Hasil Perbaikan) */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#0D2453] flex items-center justify-between">
                      <span>Dokumentasi Fisik</span>
                      <span className="text-[11px] font-normal text-[#767676]">{selectedItem.slaLabel}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Before Photo */}
                      {selectedItem.beforePhoto && (
                        <div>
                          <div className="text-[10px] font-medium text-[#767676] mb-1">
                            Sebelum
                          </div>
                          <div
                            onClick={() =>
                              setLightboxImg({
                                url: selectedItem.beforePhoto!,
                                label: `${selectedItem.ticketCode} - Kondisi Awal`,
                              })
                            }
                            className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer"
                          >
                            <img
                              src={selectedItem.beforePhoto}
                              alt="Sebelum"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* After Photo or In-Progress Box */}
                      {selectedItem.afterPhoto ? (
                        <div>
                          <div className="text-[10px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Hasil Perbaikan</span>
                          </div>
                          <div
                            onClick={() =>
                              setLightboxImg({
                                url: selectedItem.afterPhoto!,
                                label: `${selectedItem.ticketCode} - Hasil Perbaikan`,
                              })
                            }
                            className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer"
                          >
                            <img
                              src={selectedItem.afterPhoto}
                              alt="Hasil Perbaikan"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] font-semibold text-amber-700 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Tahap Fisik</span>
                          </div>
                          <div className="aspect-[4/3] rounded-xl bg-[#F7F9FC] border border-dashed border-amber-300 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[11px] font-bold text-[#0D2453]">Petugas Lapangan</span>
                            <span className="text-[10px] text-[#767676] mt-0.5">Menunggu upload bukti</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Official Village Response */}
                  <div className="p-3.5 rounded-xl bg-[#F7F9FC] border border-[#EBEBEB]">
                    <div className="text-[11px] font-bold text-[#0D2453]">
                      {selectedItem.response.official}
                    </div>
                    <div className="text-[10px] text-[#767676] mb-1">
                      {selectedItem.response.date}
                    </div>
                    <p className="text-xs text-[#4A5568] leading-relaxed">
                      {selectedItem.response.content}
                    </p>
                  </div>

                  {/* Budget Link */}
                  {selectedItem.budgetInfo && (
                    <div className="p-3 rounded-xl bg-[#F9FAFC] border border-[#EBEBEB] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#767676]">Realisasi Dana Kas:</div>
                        <div className="text-xs font-bold text-[#0D2453]">
                          {selectedItem.budgetInfo.amount} ({selectedItem.budgetInfo.source})
                        </div>
                      </div>
                      <Link
                        href={selectedItem.budgetInfo.transparencyUrl}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] hover:underline"
                      >
                        <span>Cek Nota</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* Progress Milestones */}
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold text-[#0D2453]">
                      Linimasa Penanganan
                    </div>
                    <div className="space-y-3">
                      {selectedItem.timeline.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {step.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            )}
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold text-[#0D2453]">{step.title}</div>
                            <div className="text-[10px] text-[#767676]">{step.date}</div>
                            <div className="text-[11px] text-[#4A5568] mt-0.5 leading-snug">
                              {step.note}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-[#EBEBEB] bg-[#F9FAFC]">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-2.5 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold transition-all"
                  >
                    Tutup Detail
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Minimal Lightbox for Photo Inspection */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden max-w-xl w-full shadow-2xl relative"
            >
              <div className="relative aspect-[16/10] bg-slate-900">
                <img
                  src={lightboxImg.url}
                  alt={lightboxImg.label}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3.5 text-xs font-semibold text-[#0D2453]">
                {lightboxImg.label}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
