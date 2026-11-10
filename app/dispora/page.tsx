'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Award,
  AlertCircle,
  Building2,
  FileCheck2,
  FileText,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import RegisterVillageModal from '@/components/dispora/RegisterVillageModal';
import LpjVerificationQueue from '@/components/dispora/LpjVerificationQueue';

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

export default function DisporaCommandCenterPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regencySearch, setRegencySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dispora/overview');
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

  const filteredRegencies = data?.regency_status.filter((r) => {
    const matchesSearch = r.regency.toLowerCase().includes(regencySearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Command Header */}
      <section className="bg-gradient-to-r from-slate-950 via-[#080E21] to-[#0D2453] text-white p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold w-fit mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pusat Kendali Eksekutif Dispora Pemprov Jateng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Command Center Evaluasi 1.000 Desa Wisata 2027
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Monitoring kepatuhan dokumen LPJ bantuan keuangan khusus sarpras, resolusi aduan fisik (Proof-of-Fix), dan evaluasi skor kepatuhan (Trust Score) 35 Kabupaten/Kota Jawa Tengah.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Daftarkan Desa Wisata</span>
            </button>
            <button
              type="button"
              onClick={fetchOverview}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sinkronisasi Data</span>
            </button>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
              Target 2027: 1.000 Desa
            </div>
          </div>
        </div>
      </section>

      {/* 4 Macro KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Desa Wisata Terdata */}
        <div className="p-6 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#767676] uppercase tracking-wider">
            <span>Desa Wisata Aktif</span>
            <Building2 className="w-4 h-4 text-[#0D2453]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0D2453]">
              {data?.macro_metrics.total_villages ?? 0}
            </span>
            <span className="text-xs text-[#767676] font-medium">/ 1.000 target</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0D2453] h-1.5 rounded-full"
              style={{ width: `${Math.min(((data?.macro_metrics.total_villages ?? 0) / 1000) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {(((data?.macro_metrics.total_villages ?? 0) / 1000) * 100)
              .toFixed(1)
              .replace('.', ',')}
            % capaian target RPJMD Pemprov Jateng
          </span>
        </div>

        {/* KPI 2: Kepatuhan LPJ Sarpras */}
        <div className="p-6 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#767676] uppercase tracking-wider">
            <span>Kepatuhan LPJ Sarpras</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {data?.macro_metrics.lpj_compliance_rate ?? 0}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Tervalidasi SSH</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${data?.macro_metrics.lpj_compliance_rate ?? 0}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {data?.macro_metrics.lpj_compliance_rate == null
              ? 'Data kepatuhan LPJ belum tersedia.'
              : 'Rasio dokumen LPJ yang lolos pemeriksaan SSH.'}
          </span>
        </div>

        {/* KPI 3: Rasio Penyelesaian Aduan */}
        <div className="p-6 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#767676] uppercase tracking-wider">
            <span>Rasio Tuntas Aduan Fisik</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0D2453]">
              {data?.macro_metrics.resolution_rate ?? 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({data?.macro_metrics.resolved_complaints ?? 0} dari {data?.macro_metrics.total_complaints ?? 0})
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${data?.macro_metrics.resolution_rate ?? 0}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            Diselesaikan dengan bukti fisik Proof-of-Fix
          </span>
        </div>

        {/* KPI 4: Rata-rata Trust Score */}
        <div className="p-6 rounded-2xl bg-white border border-[#E6ECF5] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#767676] uppercase tracking-wider">
            <span>Rerata Trust Score Jateng</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0D2453]">
              {data?.macro_metrics.average_trust_score ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {data?.macro_metrics.average_trust_score == null
                ? 'Belum ada data'
                : `Kategori: ${
                    data.macro_metrics.average_trust_score >= 85
                      ? 'A'
                      : data.macro_metrics.average_trust_score >= 70
                      ? 'B'
                      : 'C'
                  }`}
            </span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{ width: `${data?.macro_metrics.average_trust_score ?? 0}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            Formula deterministik: 50% LPJ + 50% Aduan
          </span>
        </div>
      </section>

      {/* Antrean Verifikasi Dokumen LPJ oleh Dispora */}
      <LpjVerificationQueue onStatusChange={fetchOverview} />

      {/* Main Grid: Radar 35 Kabupaten/Kota & Prioritas Hibah 2027 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Span 7): Radar Kepatuhan Kabupaten/Kota */}
        <section className="lg:col-span-7 bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-[#0D2453] uppercase tracking-wider mb-1">
                Radar Kepatuhan Teritori
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Status Wilayah 35 Kabupaten / Kota
              </h2>
            </div>

            {/* Filter Status Semaphore */}
            <div className="flex items-center gap-1.5">
              {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#0D2453] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st === 'GREEN' ? '🟢 Patuh' : st === 'YELLOW' ? '🟡 Perhatian' : '🔴 Kritis'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kabupaten/kota di Jawa Tengah..."
              value={regencySearch}
              onChange={(e) => setRegencySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20"
            />
          </div>

          {/* List of Regencies */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredRegencies.length > 0 ? (
              filteredRegencies.map((reg) => (
                <div
                  key={reg.regency}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-[#0D2453] bg-slate-50/50 hover:bg-white transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        reg.status === 'GREEN'
                          ? 'bg-emerald-500 ring-4 ring-emerald-100'
                          : reg.status === 'YELLOW'
                          ? 'bg-amber-500 ring-4 ring-amber-100'
                          : 'bg-rose-500 ring-4 ring-rose-100'
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {reg.regency}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {reg.total_villages} Desa Wisata Terdata
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[#0D2453] font-mono">
                      {reg.average_score}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        reg.status === 'GREEN'
                          ? 'bg-emerald-50 text-emerald-700'
                          : reg.status === 'YELLOW'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {reg.status === 'GREEN' ? 'Status: Patuh' : reg.status === 'YELLOW' ? 'Perlu Pemantauan' : 'Kritis'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada kabupaten yang cocok dengan filter pencarian.
              </div>
            )}
          </div>
        </section>

        {/* Right Column (Span 5): Rekomendasi Alokasi Hibah APBD 2027 */}
        <section className="lg:col-span-5 bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              Decision Support System
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Rekomendasi Hibah Sarpras 2027
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desa dengan skor kepatuhan tertinggi mendapatkan rekomendasi prioritas alokasi Bantuan Keuangan Pemprov Jateng 2027.
            </p>
          </div>

          <div className="space-y-4">
            {data?.grant_priorities && data.grant_priorities.length > 0 ? (
              data.grant_priorities.map((item, idx) => (
                <div
                  key={item.village_id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0D2453] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {item.regency} • Kategori {item.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#0D2453] px-2 py-0.5 rounded bg-blue-50 border border-blue-100 shrink-0">
                      Skor: {item.trust_score}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{item.recommendation.replace(/_/g, ' ')}</span>
                    </span>

                    <Link
                      href="/transparansi"
                      className="text-[11px] font-bold text-[#0D2453] hover:underline flex items-center gap-1"
                    >
                      <span>Cek LPJ</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {loading
                  ? 'Memuat rekomendasi prioritas bantuan dana…'
                  : 'Belum ada rekomendasi prioritas dari data yang tersedia.'}
              </div>
            )}
          </div>

          {/* Guidance Note */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-[#0D2453] space-y-1 text-xs">
            <span className="font-bold block">Kriteria Objektif Alokasi Hibah:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Desa dengan status skor &ge; 80 dan zero markup berhak diprioritaskan menerima lanjutan bantuan sarpras Rp100.000.000,- tahun anggaran 2027.
            </p>
          </div>
        </section>
      </div>

      {/* Modal Pendaftaran Desa Baru & Penerbitan Akun */}
      <RegisterVillageModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={fetchOverview}
      />
    </div>
  );
}
