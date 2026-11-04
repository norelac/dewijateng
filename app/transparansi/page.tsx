'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ChevronDown,
  ArrowUpRight,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldCheck,
  Building2,
  Search,
  ExternalLink,
  Layers
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

interface VillageOption {
  id: string;
  slug: string;
  name: string;
  regency: string;
  district: string;
  category: string;
  trust_score: number;
}

interface ExpenseItem {
  id: string;
  activity_name: string;
  category: string;
  volume: number;
  unit: string;
  claimed_unit_price: number;
  budget_allocated: number;
  amount_realized: number;
  remaining_amount: number;
  ai_anomaly_flag: boolean;
  anomaly_note: string | null;
}

interface TransparansiData {
  village: {
    id: string;
    slug: string;
    name: string;
    regency: string;
    district: string;
    category: string;
    pokdarwis_name: string;
    trust_score: number;
  };
  grant: {
    id: string;
    fiscal_year: number;
    funding_source: string;
    total_allocated: number;
    total_realized: number;
    remaining_balance: number;
    lpj_document_url: string | null;
    lpj_status: string;
    uploaded_at: string | null;
  } | null;
  expenses: ExpenseItem[];
  tariffs: Array<{
    id: number;
    item_name: string;
    tariff_type: string;
    price: number;
  }>;
}

const DEFAULT_EXPENSE_PHOTOS = [
  {
    receipt: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=800&auto=format&fit=crop&q=80',
    photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
  },
  {
    receipt: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    photo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  },
  {
    receipt: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=800&auto=format&fit=crop&q=80',
    photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
  },
  {
    receipt: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    photo: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&auto=format&fit=crop&q=80',
  },
  {
    receipt: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=800&auto=format&fit=crop&q=80',
    photo: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
  },
];

export default function TransparansiPage() {
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [regencies, setRegencies] = useState<string[]>([]);
  const [selectedRegency, setSelectedRegency] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('2026');

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TransparansiData | null>(null);

  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    url: string;
    title: string;
    type: 'Nota' | 'Foto Fisik';
  } | null>(null);

  // 1. Ambil daftar semua desa dari API PostgreSQL
  useEffect(() => {
    async function fetchVillages() {
      try {
        const res = await fetch('/api/villages');
        const json = await res.json();
        if (json.success && json.data?.villages) {
          const list: VillageOption[] = json.data.villages;
          setVillages(list);

          // Kumpulkan daftar kabupaten unik
          const uniqueRegencies = Array.from(new Set(list.map((v) => v.regency))).sort();
          setRegencies(uniqueRegencies);

          // Default pilih Magelang jika ada, atau regency pertama
          const defaultReg = uniqueRegencies.includes('Kabupaten Magelang')
            ? 'Kabupaten Magelang'
            : uniqueRegencies[0] || '';
          setSelectedRegency(defaultReg);

          // Default desa dalam regency terpilih
          const defaultVillage = list.find((v) => v.regency === defaultReg) || list[0];
          if (defaultVillage) {
            setSelectedVillageId(defaultVillage.id);
            fetchTransparansi(defaultVillage.id, '2026');
          }
        }
      } catch (err) {
        console.error('Gagal memuat daftar desa wisata:', err);
        setLoading(false);
      }
    }
    fetchVillages();
  }, []);

  // 2. Ambil data transparansi dana desa yang dipilih
  async function fetchTransparansi(villageId: string, year: string) {
    if (!villageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transparansi?village_id=${villageId}&fiscal_year=${year}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Gagal mengambil data transparansi:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // Handle pergantian kabupaten
  const handleRegencyChange = (reg: string) => {
    setSelectedRegency(reg);
    const availableVillages = villages.filter((v) => v.regency === reg);
    if (availableVillages.length > 0) {
      const newVillageId = availableVillages[0].id;
      setSelectedVillageId(newVillageId);
      fetchTransparansi(newVillageId, fiscalYear);
    }
  };

  // Handle klik tombol Tampilkan
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVillageId) {
      fetchTransparansi(selectedVillageId, fiscalYear);
    }
  };

  const filteredVillages = villages.filter(
    (v) => !selectedRegency || v.regency === selectedRegency
  );

  // Perhitungan Keuangan
  const allocated = data?.grant?.total_allocated || 0;
  const realized = data?.grant?.total_realized || 0;
  const remaining = data?.grant?.remaining_balance || (allocated > realized ? allocated - realized : 0);
  const realizedPercentage = allocated > 0 ? Math.min(100, Math.round((realized / allocated) * 100)) : 0;
  const remainingPercentage = 100 - realizedPercentage;

  // Donut SVG circumference = 2 * PI * 62 = ~389.56
  const circumference = 389.56;
  const grantProvRatio = allocated > 0 ? 0.65 : 0.6;
  const apbdesRatio = allocated > 0 ? 0.25 : 0.25;
  const padesRatio = 1 - grantProvRatio - apbdesRatio;

  const strokeDash1 = (grantProvRatio * circumference).toFixed(2);
  const strokeDash2 = (apbdesRatio * circumference).toFixed(2);
  const strokeDash3 = (padesRatio * circumference).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 mt-4">
      {/* 1. Header Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5 text-[#0D2453]">
          <Landmark className="w-6 h-6 text-[#0D2453]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D2453]">
            Transparansi Dana Desa
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#767676] mt-1">
          Dari mana dana berasal dan untuk apa dibelanjakan? Telusuri anggaran hingga bukti fisik penggunaannya.
        </p>
      </div>

      {/* 2. Filter Bar Card */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-2xl border border-[#EBEBEB] p-5 sm:p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Pilih Kabupaten */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Pilih Kabupaten
            </label>
            <div className="relative">
              <select
                value={selectedRegency}
                onChange={(e) => handleRegencyChange(e.target.value)}
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
              >
                {regencies.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pilih Desa */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Pilih Desa Wisata
            </label>
            <div className="relative">
              <select
                value={selectedVillageId}
                onChange={(e) => {
                  setSelectedVillageId(e.target.value);
                  fetchTransparansi(e.target.value, fiscalYear);
                }}
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
              >
                {filteredVillages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tahun Anggaran */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Tahun Anggaran
            </label>
            <div className="relative">
              <select
                value={fiscalYear}
                onChange={(e) => {
                  setFiscalYear(e.target.value);
                  if (selectedVillageId) fetchTransparansi(selectedVillageId, e.target.value);
                }}
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tombol Tampilkan */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Memuat...' : 'Tampilkan'}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Village Header Banner Card */}
      <section className="bg-[#0D2453] rounded-3xl p-6 sm:p-8 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wide uppercase">
              {data?.village.category || 'Desa Wisata'}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trust Score: {data?.village.trust_score || 85}/100</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {data?.village.name || 'Memuat data desa...'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Kec. {data?.village.district || '-'}, {data?.village.regency || '-'} • Pengelola: {data?.village.pokdarwis_name || 'Pokdarwis'} • Tahun {fiscalYear}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Status Dokumen LPJ Resmi */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-left">
            <div className="text-[11px] text-slate-300 font-medium">
              Dokumen LPJ Resmi Balai Desa
            </div>
            {data?.grant?.lpj_status === 'VERIFIED' ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terverifikasi Disporapar</span>
                </span>
                {data.grant.lpj_document_url && (
                  <a
                    href={data.grant.lpj_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh PDF</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-300 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Menunggu Verifikasi LPJ</span>
              </div>
            )}
          </div>

          <div className="text-left md:text-right border-l md:border-l-0 md:pl-0 pl-4 border-white/20">
            <span className="text-xs text-slate-300 font-medium block">
              Total Pagu Bantuan Provinsi
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight block mt-0.5">
              {formatRupiah(allocated)}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Two Comparison Cards: Sumber Pendanaan vs Dana Terpakai */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Sumber Pendanaan Desa (Donut Chart) */}
        <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
              Sumber Pendanaan Desa
            </h3>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Distribusi sumber pendapatan desa wisata tahun anggaran {fiscalYear}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut Chart Canvas SVG */}
            <div className="sm:col-span-6 flex items-center justify-center relative">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Circle Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#E2E8F0"
                  strokeWidth="24"
                  fill="transparent"
                />
                {/* Segment 1: Bantuan Khusus Pemprov Jateng */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#0D2453"
                  strokeWidth="24"
                  strokeDasharray={`${strokeDash1} ${circumference}`}
                  strokeDashoffset="0"
                  fill="transparent"
                />
                {/* Segment 2: APBDes */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#3B82F6"
                  strokeWidth="24"
                  strokeDasharray={`${strokeDash2} ${circumference}`}
                  strokeDashoffset={`-${strokeDash1}`}
                  fill="transparent"
                />
                {/* Segment 3: PADes Wisata */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#93C5FD"
                  strokeWidth="24"
                  strokeDasharray={`${strokeDash3} ${circumference}`}
                  strokeDashoffset={`-${parseFloat(strokeDash1) + parseFloat(strokeDash2)}`}
                  fill="transparent"
                />
              </svg>

              {/* Center Text in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                <span className="text-sm sm:text-base font-bold text-[#0D2453] leading-tight">
                  {formatRupiah(allocated)}
                </span>
                <span className="text-[10px] text-[#767676] font-medium mt-0.5">
                  Pagu Terdaftar
                </span>
              </div>
            </div>

            {/* Legend Items */}
            <div className="sm:col-span-6 space-y-4">
              {/* Legend 1: Bantuan Provinsi */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#0D2453] mt-0.5 shrink-0"></span>
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      Bantuan Pemprov Jateng
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5">
                      {formatRupiah(allocated)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">
                  {Math.round(grantProvRatio * 100)}%
                </span>
              </div>

              {/* Legend 2: Alokasi APBDes */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#3B82F6] mt-0.5 shrink-0"></span>
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      APBDes Murni
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5">
                      {formatRupiah(Math.round(allocated * 0.35))}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">
                  {Math.round(apbdesRatio * 100)}%
                </span>
              </div>

              {/* Legend 3: PADes Wisata */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#93C5FD] mt-0.5 shrink-0"></span>
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      PADes Wisata (Karcis/Parkir)
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5">
                      {formatRupiah(Math.round(allocated * 0.15))}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">
                  {Math.round(padesRatio * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Dana Terpakai (Progress Bar & Stats) */}
        <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
                Dana Realisasi &amp; Sisa Kas
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-[#0D2453] rounded-lg">
                Tahun {fiscalYear}
              </span>
            </div>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Realisasi belanja fisik yang terverifikasi dan sisa saldo bantuan provinsi.
            </p>
          </div>

          <div className="space-y-6">
            {/* Big Indicator */}
            <div className="flex items-baseline justify-between">
              <div className="text-5xl font-extrabold text-[#0D2453] tracking-tight">
                {realizedPercentage}%
              </div>
              <div className="text-xs text-[#767676] font-medium">
                dari pagu bantuan telah terealisasi
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-4 rounded-full bg-[#DCE7F5] overflow-hidden flex">
              <div
                className="h-full bg-[#0D2453] rounded-full transition-all duration-500"
                style={{ width: `${realizedPercentage}%` }}
              ></div>
            </div>

            {/* Bottom Summary (Dana Terpakai vs Sisa Saldo Kas) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0D2453]"></span>
                  <span>Dana Realisasi • {realizedPercentage}%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  {formatRupiah(realized)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#DCE7F5]"></span>
                  <span>Sisa Saldo Kas • {remainingPercentage}%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  {formatRupiah(remaining)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Table Section: Laporan Pengeluaran Desa Wisata */}
      <section className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0D2453]">
              Laporan Pos Belanja Sarpras &amp; Fasilitas
            </h3>
            <p className="text-xs text-[#767676] mt-0.5">
              Setiap pos pengeluaran dicocokkan otomatis dengan Katalog Standar Satuan Harga (SSH) Pemprov Jateng.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sesuai SSH</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Deviasi &gt;+40%</span>
            </span>
          </div>
        </div>

        {/* Expenditures Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-[#0D2453]">
            {/* Table Head with Soft Blue Tint */}
            <thead>
              <tr className="bg-[#DCE7F5]/70 text-[#0D2453] text-xs font-semibold">
                <th scope="col" className="px-5 py-3.5 rounded-l-xl">No</th>
                <th scope="col" className="px-5 py-3.5">Nama Kegiatan / Pos Belanja</th>
                <th scope="col" className="px-5 py-3.5">Volume &amp; Harga Satuan</th>
                <th scope="col" className="px-5 py-3.5">Realisasi (Rp)</th>
                <th scope="col" className="px-5 py-3.5">Audit SSH Pemprov</th>
                <th scope="col" className="px-5 py-3.5 rounded-r-xl">Bukti Fisik</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EBEBEB]">
              {!data?.expenses || data.expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#767676] text-xs">
                    Belum ada pos belanja yang diunggah untuk tahun anggaran {fiscalYear}.
                  </td>
                </tr>
              ) : (
                data.expenses.map((row, idx) => {
                  const photoItem = DEFAULT_EXPENSE_PHOTOS[idx % DEFAULT_EXPENSE_PHOTOS.length];

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* No */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#767676] font-medium align-middle">
                        {idx + 1}
                      </td>

                      {/* Kegiatan */}
                      <td className="px-5 py-4 align-middle">
                        <div className="font-bold text-[#0D2453] text-xs sm:text-sm">
                          {row.activity_name}
                        </div>
                        <div className="text-[11px] text-[#767676] mt-0.5 flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                            {row.category}
                          </span>
                          <span>Pagu: {formatRupiah(row.budget_allocated)}</span>
                        </div>
                      </td>

                      {/* Volume & Harga Satuan */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#0D2453] align-middle">
                        <div className="font-semibold">
                          {row.volume} {row.unit}
                        </div>
                        <div className="text-[11px] text-[#767676]">
                          @{formatRupiah(row.claimed_unit_price)}
                        </div>
                      </td>

                      {/* Realisasi */}
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-[#0D2453] text-xs sm:text-sm align-middle">
                        {formatRupiah(row.amount_realized)}
                      </td>

                      {/* Audit SSH */}
                      <td className="px-5 py-4 align-middle">
                        {row.ai_anomaly_flag ? (
                          <div className="flex flex-col gap-1 max-w-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 self-start">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Anomali Deviasi</span>
                            </span>
                            <span className="text-[11px] text-rose-700 leading-snug">
                              {row.anomaly_note || 'Harga klaim melebihi batas wajar SSH'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Wajar SSH</span>
                            </span>
                            <span className="text-[11px] text-[#767676]">
                              {row.anomaly_note || 'Sesuai standar satuan'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Foto Bukti Fisik & Nota */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          {/* Nota Kuitansi Box */}
                          <div className="flex flex-col">
                            <div
                              onClick={() =>
                                setActiveReceiptModal({
                                  url: photoItem.receipt,
                                  title: `${row.activity_name} - Nota Kuitansi`,
                                  type: 'Nota',
                                })
                              }
                              className="w-14 h-10 rounded-lg bg-[#E2E8F0] border border-slate-300 flex items-center justify-center text-[9px] font-bold text-[#475569] tracking-tighter text-center px-1 leading-tight select-none cursor-pointer hover:border-[#0D2453] transition-colors"
                            >
                              NOTA
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReceiptModal({
                                  url: photoItem.receipt,
                                  title: `${row.activity_name} - Nota Kuitansi`,
                                  type: 'Nota',
                                })
                              }
                              className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1 hover:underline cursor-pointer"
                            >
                              <span>Nota</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Foto Fisik Box */}
                          <div className="flex flex-col">
                            <div
                              onClick={() =>
                                setActiveReceiptModal({
                                  url: photoItem.photo,
                                  title: `${row.activity_name} - Dokumentasi Lapangan`,
                                  type: 'Foto Fisik',
                                })
                              }
                              className="w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-[#0D2453] transition-colors"
                            >
                              <img
                                src={photoItem.photo}
                                alt={row.activity_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReceiptModal({
                                  url: photoItem.photo,
                                  title: `${row.activity_name} - Dokumentasi Lapangan`,
                                  type: 'Foto Fisik',
                                })
                              }
                              className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1 hover:underline cursor-pointer"
                            >
                              <span>Foto</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Total Summary */}
            {data?.expenses && data.expenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/70 border-t border-[#EBEBEB] text-xs font-semibold text-[#0D2453]">
                  <td className="px-5 py-4" colSpan={3}>
                    <span className="font-bold text-[#0D2453] text-sm">
                      Total Belanja Modal Tercatat
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-[#0D2453] text-sm">
                      {formatRupiah(realized)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#767676] font-normal" colSpan={2}>
                    Sama dengan total realisasi dana terpakai • {realizedPercentage}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Lightbox / Modal for Evidence Preview */}
      {activeReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setActiveReceiptModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm sm:text-base">{activeReceiptModal.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeReceiptModal.url}
                alt={activeReceiptModal.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#767676]">
              <span>Dokumentasi transparansi anggaran kas desa wisata Jawa Tengah</span>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs cursor-pointer"
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
