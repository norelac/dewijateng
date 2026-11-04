'use client';

import React, { useState, useMemo } from 'react';
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
      {
        title: 'Laporan terkirim',
        date: '1 Ags 2026 · 09.10 WIB',
        done: true,
      },
      {
        title: 'Diverifikasi desa',
        date: '3 Ags 2026 · 10.00 WIB',
        done: true,
      },
      {
        title: 'Proses perbaikan lapangan',
        date: '5 Okt 2026 · 08.30 WIB',
        done: true,
      },
      {
        title: 'Selesai',
        date: '12 Okt 2026 · 11.30 WIB',
        done: true,
      },
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
      {
        title: 'Laporan terkirim',
        date: '25 Okt 2026 · 14.15 WIB',
        done: true,
      },
      {
        title: 'Diverifikasi desa',
        date: '26 Okt 2026 · 09.00 WIB',
        done: true,
      },
      {
        title: 'Proses pembersihan & pengadaan',
        date: '27 Okt 2026 · 10.30 WIB',
        done: true,
      },
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
      {
        title: 'Laporan terkirim',
        date: '27 Okt 2026 · 11.20 WIB',
        done: true,
      },
      {
        title: 'Diverifikasi desa',
        date: '28 Okt 2026 · 08.45 WIB',
        done: true,
      },
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
      {
        title: 'Laporan terkirim',
        date: '28 Okt 2026 · 16.40 WIB',
        done: true,
      },
    ],
  },
];

const STATUS_FILTERS = ['Semua', 'Masuk', 'Diverifikasi', 'Diproses', 'Selesai'] as const;

export default function LaporPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Kabupaten Magelang');
  const [selectedDesa, setSelectedDesa] = useState('Desa Candirejo');
  const [selectedKategori, setSelectedKategori] = useState('Semua kategori');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('Semua');

  const [activeReportId, setActiveReportId] = useState<string>(REPORTS_DATA[0].id);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; label: string } | null>(null);

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

  const activeReport = useMemo(() => {
    const found = REPORTS_DATA.find((r) => r.id === activeReportId);
    return found || filteredReports[0] || REPORTS_DATA[0];
  }, [activeReportId, filteredReports]);

  const renderStatusBadge = (status: ReportItem['status']) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="bg-[#E4F6E8] text-[#216B55] px-3 py-1.5 rounded-full text-xs font-medium">
            Selesai
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-[#FFF4DC] text-[#936015] px-3 py-1.5 rounded-full text-xs font-medium">
            Diproses
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="bg-[#EDF3FC] text-[#0D2453] px-3 py-1.5 rounded-full text-xs font-medium">
            Diverifikasi
          </span>
        );
      case 'Masuk':
      default:
        return (
          <span className="bg-[#EDF3FC] text-[#0D2453] px-3 py-1.5 rounded-full text-xs font-medium">
            Masuk
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 flex flex-col items-start gap-[44px] mt-[44px] mb-24">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-[#64748B] font-normal">
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
          <div className="flex items-center gap-3.5 text-[#0D2453]">
            <Search className="w-6 h-6 text-[#0D2453]" />
            <h1 className="text-2xl font-semibold tracking-tight text-[#0D2453]">
              Telusuri Laporan
            </h1>
          </div>
          <p className="text-[16px] text-[#64748B] mt-3 font-normal leading-[1.7]">
            Dari laporan terkirim hingga perbaikan selesai. Temukan laporan dan ikuti perkembangannya di desa wisata Jawa Tengah.
          </p>
        </div>

        <Link
          href="/#buat-laporan"
          className="bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-[18px] py-[13px] rounded-full text-[13px] font-semibold flex items-center gap-2 transition-colors duration-150 shrink-0 self-start md:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan</span>
        </Link>
      </div>

      {/* 3. Search & Filter Card */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.08),0_24px_40px_-12px_rgba(13,36,83,0.10)] flex flex-col gap-6">
        {/* Ticket search row */}
        <div className="space-y-2.5">
          <label className="block text-[16px] font-semibold text-[#0D2453]">
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
                className="w-full bg-transparent border-0 text-[14px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none"
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
              className="w-full sm:w-auto bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-5 py-3 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0"
            >
              Cari Laporan
            </button>
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Kabupaten */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-normal text-[#0D2453]">
              Kabupaten
            </label>
            <div className="relative">
              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-[13px] text-[#0D2453] font-normal focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
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
          <div className="space-y-2.5">
            <label className="block text-[13px] font-normal text-[#0D2453]">
              Desa wisata
            </label>
            <div className="relative">
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-[13px] text-[#0D2453] font-normal focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
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
          <div className="space-y-2.5">
            <label className="block text-[13px] font-normal text-[#0D2453]">
              Kategori
            </label>
            <div className="relative">
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="w-full bg-[#F3F5F8] border-0 rounded-[14px] px-4 py-3 text-[13px] text-[#0D2453] font-normal focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
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
                className={`px-5 py-3 rounded-full text-[14px] transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'bg-white border border-[#E6ECF5] text-[#0D2453] font-normal hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Section Header Meta */}
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#0D2453]">
            Laporan di {selectedDesa}
          </h2>
          <span className="text-[13px] font-normal text-[#64748B]">
            Urutan: relevansi pencarian ↓
          </span>
        </div>

        {/* 2-Column Master-Detail Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Left Column: Report Cards List (560px on desktop) */}
          <div className="w-full lg:w-[560px] shrink-0 flex flex-col gap-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E6ECF5] p-8 text-center text-[#64748B] text-sm shadow-[0_1px_2px_rgba(13,36,83,0.035),0_6px_14px_-8px_rgba(13,36,83,0.10)]">
                Tidak ada laporan yang sesuai dengan filter pencarian.
              </div>
            ) : (
              filteredReports.map((report) => {
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
                        ? 'bg-[#EDF3FC] border-[#0D2453]/20 shadow-[0_1px_2px_rgba(13,36,83,0.05),0_6px_14px_-4px_rgba(13,36,83,0.10),0_18px_32px_-12px_rgba(13,36,83,0.12)]'
                        : 'bg-white border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.035),0_6px_14px_-8px_rgba(13,36,83,0.10)] hover:border-[#CBD5E1] hover:shadow-[0_1px_2px_rgba(13,36,83,0.04),0_10px_22px_-8px_rgba(13,36,83,0.14)]'
                    }`}
                  >
                    {/* Top: Ticket & Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0D2453]">
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
                        <h3 className="text-[17px] font-semibold text-[#0D2453] leading-[1.4] line-clamp-1">
                          {report.title}
                        </h3>
                        <p className="text-[13px] font-normal text-[#64748B] leading-[1.6] line-clamp-2">
                          {report.summary}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Location & Date */}
                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5 font-normal">
                      <span>{report.locationShort}</span>
                      <span>{report.date}</span>
                    </div>

                    {/* Active Indicator Arrow */}
                    {isActive && (
                      <div className="text-xs font-semibold text-[#0D2453] pt-0.5">
                        Detail ditampilkan &rarr;
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 pb-1 mt-1 text-[13px] text-[#64748B]">
              <span>
                Menampilkan 1–{filteredReports.length} dari {filteredReports.length}
              </span>
              <div className="w-9 h-9 rounded-[10px] bg-[#0D2453] text-white flex items-center justify-center font-normal text-[13px] shadow-[0_2px_6px_rgba(13,36,83,0.18)]">
                1
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
              <span className="text-xs font-semibold text-[#64748B] tracking-[1px] uppercase">
                Detail Laporan
              </span>
              {renderStatusBadge(activeReport.status)}
            </div>

            {/* 2. Identity & Description */}
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-[#0D2453]">
                {activeReport.ticketCode}
              </span>
              <h3 className="text-[20px] font-semibold text-[#0D2453] leading-snug">
                {activeReport.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <MapPin className="w-4 h-4 text-[#64748B] shrink-0" />
                <span>{activeReport.locationFull}</span>
              </div>
              <p className="text-xs text-[#64748B] leading-[1.7] font-normal mt-0.5">
                {activeReport.detailDesc}
              </p>
            </div>

            {/* 3. Perjalanan Laporan (Timeline) */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[14px] font-semibold text-[#0D2453]">
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
                        <span className="text-[14px] font-semibold text-[#0D2453] leading-tight">
                          {step.title}
                        </span>
                        <span className="text-xs text-[#64748B] mt-1 leading-normal">
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
              <h4 className="text-[14px] font-semibold text-[#0D2453]">
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
                    <span className="text-[11px] text-[#64748B] font-normal">
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
                    <span className="text-[11px] text-[#64748B] font-normal">
                      {activeReport.afterPhoto.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="h-[176px] rounded-[14px] bg-[#F3F5F8] border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-xs text-[#64748B] font-medium">
                        Dokumentasi penanganan
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Menunggu pembaruan lapangan
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] font-normal">
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
              <p className="text-[15px] font-semibold text-[#0D2453]">
                Belum ada laporan yang cocok
              </p>
              <p className="text-[13px] text-[#64748B] max-w-sm leading-[1.6]">
                Coba kode tiket lain, kata kunci yang lebih pendek, atau longgarkan filter status dan kategori.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Bottom CTA Banner */}
      <section className="w-full bg-[#EDF3FC] rounded-[24px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_10px_20px_-10px_rgba(13,36,83,0.12),0_28px_48px_-24px_rgba(13,36,83,0.14)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-[22px] font-semibold text-[#0D2453]">
            Melihat kendala di desa wisata?
          </h3>
          <p className="text-[14px] text-[#64748B] leading-[1.6] font-normal">
            Sampaikan lokasi, ceritakan kejadiannya, dan sertakan bukti yang relevan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/#buat-laporan"
            className="flex-1 sm:flex-initial bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-[18px] py-[13px] rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan</span>
          </Link>
          <Link
            href="/edukasi"
            className="flex-1 sm:flex-initial bg-white border border-[#0D2453] hover:bg-[#F8FAFC] text-[#0D2453] px-[18px] py-[13px] rounded-full text-[13px] font-semibold text-center transition-colors duration-150 cursor-pointer"
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
              <span>Dokumentasi tindak lanjut aduan</span>
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
