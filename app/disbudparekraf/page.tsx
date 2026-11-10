'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Wallet,
  CheckCircle2,
  Award,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
  MapPin,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import DisbudparekrafSidebar from '@/components/disbudparekraf/DisbudparekrafSidebar';
import DisbudparekrafHeader from '@/components/disbudparekraf/DisbudparekrafHeader';
import RegisterVillageModal from '@/components/disbudparekraf/RegisterVillageModal';
import LpjVerificationQueue from '@/components/disbudparekraf/LpjVerificationQueue';

interface MacroMetrics {
  total_villages: number;
  lpj_compliance_rate: number;
  total_complaints: number;
  resolved_complaints: number;
  resolution_rate: number;
  average_trust_score: number;
  total_allocated_sum: number;
  total_realized_sum: number;
}

interface RegencyStatus {
  regency: string;
  total_villages: number;
  average_score: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

interface GrantPriority {
  village_id: string;
  name: string;
  regency: string;
  category: string;
  trust_score: number;
  recommendation: string;
}

interface OverviewData {
  macro_metrics: MacroMetrics;
  regency_status: RegencyStatus[];
  grant_priorities: GrantPriority[];
}

export default function DisbudparekrafDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Radar search & filter
  const [regencySearch, setRegencySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/disbudparekraf/overview');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data Command Center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSectionScroll = (sec: string) => {
    setActiveSection(sec);
    if (sec === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(`section-${sec}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredRegencies =
    data?.regency_status.filter((r) => {
      const matchesSearch = r.regency.toLowerCase().includes(regencySearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const m = data?.macro_metrics;
  const totalAllocated = m?.total_allocated_sum || 16400000000;
  const totalRealized = m?.total_realized_sum || 13940000000;
  const realizedPct = totalAllocated > 0 ? Math.round((totalRealized / totalAllocated) * 100) : 85;

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative selection:bg-blue-100 selection:text-[#0D2453]">
      {/* 1. Sidebar Navigasi Disbudparekraf (Persis style dashboard desa) */}
      <DisbudparekrafSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionScroll}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        pendingLpjCount={2}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Header Bar */}
        <DisbudparekrafHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTitle="Command Center Pengawasan 1.000 Desa"
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        />

        {/* Konten Utama */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          {/* Header Title */}
          <div className="w-full flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-[#0D2453] text-[24px] sm:text-[28px] font-semibold tracking-[-0.7px]">
              Dashboard eksekutif Disbudparekraf
            </h1>
            <button
              type="button"
              onClick={fetchOverview}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0D2453] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Konteks Pengawasan Bar (Persis seperti di dashboard desa) */}
          <div className="bg-white rounded-[14px] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#E6ECF5] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-[18px] h-[18px] shrink-0 text-[#0D2453] flex items-center justify-center">
                <Building2 className="w-[18px] h-[18px] text-[#0D2453]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[#0D2453] text-[14px] font-semibold">
                  Pemerintah Provinsi Jawa Tengah
                </span>
                <span className="text-[#64748B] text-[11px] font-normal mt-0.5">
                  Pengawasan Terpadu 35 Kabupaten/Kota · 867 Desa Wisata Terdata
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto">
              <span className="text-[#64748B] text-[11px] font-normal whitespace-nowrap">
                Per 28 Oktober 2026 · 10.00 WIB
              </span>
              <div className="bg-white border border-[#E6ECF5] rounded-full h-8 px-3 flex items-center gap-2 text-[#0D2453] text-[11px] font-semibold">
                <ChevronDown className="w-3.5 h-3.5 text-[#0D2453]" />
                <span>TA 2026</span>
              </div>
            </div>
          </div>

          {/* 4 Summary Indicator Cards (Persis seperti gambar pengelola) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            {/* Card 1: Total Pendanaan / Bantuan (Dark Navy Card #0D2453) */}
            <div className="bg-[#0D2453] text-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between w-full">
                <span className="text-white text-[12px] font-normal">
                  Total bantuan keuangan
                </span>
                <Wallet className="w-[18px] h-[18px] text-white shrink-0" />
              </div>
              <div className="text-white text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
                Rp 16,4 Miliar
              </div>
              <div className="text-white text-[11px] font-normal opacity-90">
                119 desa penerima sarpras wisata
              </div>
            </div>

            {/* Card 2: Laporan / LPJ perlu diverifikasi */}
            <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between w-full">
                <span className="text-[#64748B] text-[12px] font-normal">
                  LPJ perlu ditelaah
                </span>
                <FileCheck2 className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
              </div>
              <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
                3 dokumen
              </div>
              <div className="text-[#64748B] text-[11px] font-normal">
                2 menunggu telaah · 1 perlu revisi
              </div>
            </div>

            {/* Card 3: Kepatuhan Dokumen LPJ */}
            <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between w-full">
                <span className="text-[#64748B] text-[12px] font-normal">
                  Kepatuhan unggah LPJ
                </span>
                <CheckCircle2 className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
              </div>
              <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
                92% dari 119
              </div>
              <div className="text-[#64748B] text-[11px] font-normal">
                107 desa telah diverifikasi lengkap
              </div>
            </div>

            {/* Card 4: Rata-rata Kepatuhan Trust Score */}
            <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between w-full">
                <span className="text-[#64748B] text-[12px] font-normal">
                  Kelengkapan acuan harga
                </span>
                <Award className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
              </div>
              <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
                1.061 dari 1.061
              </div>
              <div className="text-[#64748B] text-[11px] font-normal">
                100% material terikat HSD 2026
              </div>
            </div>
          </div>

          {/* Section 1: Antrean Verifikasi Dokumen LPJ Desa (Matching layout persis) */}
          <section id="section-lpj" className="w-full">
            <LpjVerificationQueue onStatusChange={fetchOverview} />
          </section>

          {/* Section 2: Dua Kartu (Sumber Pendanaan & Realisasi Anggaran) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Card Kiri: Komposisi Alokasi Bantuan Provinsi */}
            <div className="bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[#0D2453] text-[16px] font-semibold">
                  Komposisi bantuan keuangan
                </h3>
                <p className="text-[#64748B] text-[11px] mt-0.5">
                  Distribusi alokasi sarpras pariwisata Pemprov Jateng · Kepgub 414/16/2023
                </p>
              </div>

              {/* Donut Chart + Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
                {/* SVG Donut */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="14" fill="none" />
                    {/* Berkembang 67% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0D2453"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="160 238"
                      strokeDashoffset="0"
                    />
                    {/* Maju 27% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0284C7"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="64 238"
                      strokeDashoffset="-160"
                    />
                    {/* Mandiri 6% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10B981"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="14 238"
                      strokeDashoffset="-224"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[#0D2453] text-sm font-bold">Rp 16,4 M</span>
                    <span className="text-[10px] text-[#64748B]">Total Pagu</span>
                  </div>
                </div>

                {/* Legend Items */}
                <div className="flex flex-col gap-2 w-full max-w-xs text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0D2453]" />
                      <span className="text-[#0D2453] font-medium">109 Desa Berkembang</span>
                    </div>
                    <span className="font-semibold text-[#0D2453]">Rp 10,9 M (67%)</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                      <span className="text-[#0D2453] font-medium">9 Desa Maju</span>
                    </div>
                    <span className="font-semibold text-[#0D2453]">Rp 4,5 M (27%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-[#0D2453] font-medium">1 Desa Mandiri</span>
                    </div>
                    <span className="font-semibold text-[#0D2453]">Rp 1,0 M (6%)</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#94A3B8] text-center pt-2 border-t border-slate-100">
                Keputusan Gubernur Jawa Tengah Nomor 414/16/2023 Tahap I
              </div>
            </div>

            {/* Card Kanan: Realisasi Anggaran */}
            <div className="bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[#0D2453] text-[16px] font-semibold">
                  Realisasi serapan bantuan
                </h3>
                <p className="text-[#64748B] text-[11px] mt-0.5">
                  Belanja sarpras tercatat sesuai dokumen LPJ yang masuk ke Disbudparekraf
                </p>
              </div>

              <div className="my-6">
                <div className="text-[#0D2453] text-[40px] sm:text-[44px] font-bold tracking-tight">
                  {realizedPct}%
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F1F5F9] rounded-full h-3 overflow-hidden mt-2">
                  <div
                    className="bg-[#0D2453] h-full rounded-full transition-all duration-700"
                    style={{ width: `${realizedPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Dana terpakai · {realizedPct}%</span>
                    <span className="text-base font-bold text-[#0D2453]">
                      {formatRupiah(totalRealized)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] block">Sisa kas · {100 - realizedPct}%</span>
                    <span className="text-base font-bold text-[#0D2453]">
                      {formatRupiah(totalAllocated - totalRealized)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#94A3B8] pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Status verifikasi fiskal</span>
                <span className="font-semibold text-emerald-600">Terbuka untuk Publik</span>
              </div>
            </div>
          </div>

          {/* Section 3: Radar Kepatuhan 35 Kabupaten/Kota (Persis table di screenshot) */}
          <section id="section-radar" className="w-full bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-[#0D2453] text-[18px] sm:text-[20px] font-semibold tracking-[-0.5px]">
                  Radar kepatuhan wilayah 35 Kabupaten / Kota
                </h3>
                <p className="text-[#64748B] text-[12px] mt-0.5">
                  Status semaphore (🟢 Patuh, 🟡 Perhatian, 🔴 Kritis) evaluasi target 1.000 desa wisata 2027.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari kabupaten / kota..."
                  value={regencySearch}
                  onChange={(e) => setRegencySearch(e.target.value)}
                  className="w-full h-9 px-3 pl-8 rounded-xl bg-white border border-[#E6ECF5] text-xs text-[#0D2453] placeholder-slate-400 focus:outline-none focus:border-[#0D2453] transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Filter Semaphore */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#0D2453] text-white'
                      : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#0D2453]'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Semua Wilayah'
                    : st === 'GREEN'
                    ? '🟢 Patuh (≥80)'
                    : st === 'YELLOW'
                    ? '🟡 Perhatian (60-79)'
                    : '🔴 Kritis (<60)'}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Kabupaten / Kota</th>
                    <th className="py-2.5 px-3">Desa Wisata</th>
                    <th className="py-2.5 px-3">Rata-rata Skor</th>
                    <th className="py-2.5 px-3">Status Semaphore</th>
                    <th className="py-2.5 px-3 text-right">Rekomendasi Hibah 2027</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC] text-xs">
                  {filteredRegencies.slice(0, 15).map((r) => (
                    <tr key={r.regency} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#0D2453]">
                        {r.regency}
                      </td>
                      <td className="py-3 px-3 text-[#64748B]">
                        {r.total_villages} Desa Wisata
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#0D2453]">
                        {r.average_score.toFixed(1)} / 100
                      </td>
                      <td className="py-3 px-3">
                        {r.status === 'GREEN' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 Patuh
                          </span>
                        )}
                        {r.status === 'YELLOW' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            🟡 Perhatian
                          </span>
                        )}
                        {r.status === 'RED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            🔴 Kritis
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-[11px] font-semibold ${
                          r.status === 'GREEN'
                            ? 'text-emerald-700'
                            : r.status === 'YELLOW'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}>
                          {r.status === 'GREEN'
                            ? 'Prioritas Lanjutan Hibah'
                            : r.status === 'YELLOW'
                            ? 'Pendampingan Teknis'
                            : 'Audit Khusus'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Bottom Two Cards (Aktivitas Terbaru & Info Box Navy) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
            {/* Left Column (Span 7): Aktivitas Terbaru */}
            <div className="lg:col-span-7 bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-[#0D2453] text-[16px] font-semibold">
                    Aktivitas pengawasan terbaru
                  </h3>
                  <span className="text-[11px] text-[#64748B]">Log sistem 2026</span>
                </div>

                <div className="flex flex-col gap-3.5 mt-4">
                  <div className="flex items-start gap-3 pb-3 border-b border-slate-50">
                    <span className="text-[11px] font-bold text-[#64748B] w-14 shrink-0 mt-0.5">
                      28 Okt
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#0D2453]">
                        Dokumen LPJ Desa Wisata Candirejo disetujui (VERIFIED)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Alokasi Rp 150.000.000 telah terverifikasi memenuhi standar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pb-3 border-b border-slate-50">
                    <span className="text-[11px] font-bold text-[#64748B] w-14 shrink-0 mt-0.5">
                      25 Okt
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#0D2453]">
                        Pendeteksian anomali harga pos belanja di Desa Getas (+44%)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Deviasi harga semen vs HSD MAS PETRUK Kab. Magelang
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-bold text-[#64748B] w-14 shrink-0 mt-0.5">
                      20 Okt
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#0D2453]">
                        Penerbitan entitas & akun baru Desa Wisata Dieng Kulon
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Kredensial otomatis terbit dengan sandi sementara 12 karakter
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <Link
                  href="/transparansi"
                  className="text-xs font-semibold text-[#0D2453] hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka arsip transparansi publik</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column (Span 5): Dark Navy Info Box persis di gambar */}
            <div className="lg:col-span-5 bg-[#0D2453] text-white rounded-[20px] sm:rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white leading-snug">
                  Tindak lanjut pengawasan yang akuntabel
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Formula Trust Score 50/50 dan audit otomatis terhadap 1.061 harga riil HSD MAS PETRUK 2026 menjaga akuntabilitas hibah sarpras sebelum pagu APBD 2027 digelontorkan.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">MAS PETRUK DPUBinmarcipka</span>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  + Daftarkan Desa Baru
                </button>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="w-full text-center py-4 text-[11px] text-[#94A3B8] border-t border-[#E6ECF5]">
            © 2026 DEWI JATENG · Dinas Kebudayaan, Pariwisata, dan Ekonomi Kreatif Provinsi Jawa Tengah
          </div>
        </div>
      </div>

      {/* Modal Pendaftaran Desa Baru */}
      <RegisterVillageModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={fetchOverview}
      />
    </div>
  );
}
