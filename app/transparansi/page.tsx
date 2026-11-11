'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  ChevronDown,
  ArrowUpRight,
  FileText,
  X,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface ExpenditureItem {
  id: string;
  date: string;
  title: string;
  sub: string;
  amount: string;
  sshRef?: string;
  sshAmount?: string;
  deviation?: number;
  anomalyNote?: string | null;
  aiFlag?: boolean;
  receiptImg?: string;
  photoImg?: string;
}

// ==== Bentuk respons /api/transparansi (BE-03/BE-07) ====

interface ApiExpense {
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
  created_at?: string;
  receipt_url?: string | null;
  photo_url?: string | null;
}

interface ApiGrant {
  id: string;
  fiscal_year: number;
  funding_source: string;
  apbdes_amount?: number;
  banprov_amount?: number;
  pades_amount?: number;
  total_allocated: number;
  total_realized: number;
  remaining_balance: number;
  lpj_document_url?: string | null;
  lpj_status?: string | null;
}

interface ApiVillage {
  id: string;
  slug: string;
  name: string;
  regency: string;
  district?: string;
}

interface TransparansiResponse {
  success: boolean;
  data?: {
    village: ApiVillage;
    grant: ApiGrant | null;
    expenses: ApiExpense[];
  };
}

const DEFAULT_KABUPATEN = [
  'Kabupaten Magelang',
  'Kabupaten Banyumas',
  'Kabupaten Kendal',
  'Kabupaten Karanganyar',
  'Kabupaten Banjarnegara',
  'Kabupaten Wonosobo',
];

const DEFAULT_DESA = [
  'Desa Candirejo',
  'Desa Limpakuwus',
  'Desa Dieng Kulon',
  'Desa Berjo',
];

function formatAngka(value: number): string {
  return new Intl.NumberFormat('id-ID').format(Math.round(value || 0));
}

function formatTanggalPendek(input?: string): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function mapExpense(exp: ApiExpense): ExpenditureItem {
  const budget = exp.budget_allocated || 0;
  const realized = exp.amount_realized || 0;
  const deviation = budget > 0 ? ((realized - budget) / budget) * 100 : undefined;

  const volumeText =
    exp.volume && exp.unit ? `${formatAngka(exp.volume)} ${exp.unit}` : '';

  return {
    id: exp.id,
    date: formatTanggalPendek(exp.created_at),
    title: exp.activity_name,
    sub: [volumeText, exp.category].filter(Boolean).join(' · ') || 'Belanja desa',
    amount: formatAngka(realized),
    sshRef: exp.category,
    sshAmount: formatAngka(budget),
    deviation: deviation !== undefined ? Math.round(deviation * 10) / 10 : undefined,
    anomalyNote: exp.anomaly_note,
    aiFlag: Boolean(exp.ai_anomaly_flag),
    // Nota selalu tersedia untuk pos yang punya id UUID (dirender dari DB).
    receiptImg:
      exp.receipt_url ??
      (/^[0-9a-f-]{36}$/i.test(exp.id) ? `/documents/nota-${exp.id}.svg` : undefined),
    photoImg: exp.photo_url || undefined,
  };
}

const EXPENDITURES: ExpenditureItem[] = [
  {
    id: 'exp-1',
    date: '16 Okt 2026',
    title: 'Perbaikan jalur pejalan kaki',
    sub: 'Akses wisata & pagar pengaman',
    amount: '320.000.000',
    sshRef: '5.02.01.05.002',
    sshAmount: '300.000.000',
    deviation: 6.7,
    receiptImg: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=1000&auto=format&fit=crop&q=85',
    photoImg: '/img/figma/curug-sesudah.png',
  },
  {
    id: 'exp-2',
    date: '12 Okt 2026',
    title: 'Penataan area parkir wisata',
    sub: 'Permukaan & marka area parkir',
    amount: '240.000.000',
    sshRef: '5.02.01.06.001',
    sshAmount: '170.000.000',
    deviation: 41.2,
    receiptImg: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=85',
    photoImg: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 'exp-3',
    date: '08 Okt 2026',
    title: 'Pengelolaan kebersihan desa',
    sub: 'Tempat sampah & sarana kebersihan',
    amount: '180.000.000',
    sshRef: '5.02.02.01.003',
    sshAmount: '175.000.000',
    deviation: 2.9,
    receiptImg: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=1000&auto=format&fit=crop&q=85',
    photoImg: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 'exp-4',
    date: '05 Okt 2026',
    title: 'Pemeliharaan toilet wisata',
    sub: 'Sanitasi & perbaikan fasilitas',
    amount: '100.000.000',
    sshRef: '5.02.03.01.002',
    sshAmount: '95.000.000',
    deviation: 5.3,
    receiptImg: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=85',
    photoImg: '/img/figma/toilet-sesudah.png',
  },
];

export default function TransparansiPage() {
  const [selectedKabupaten, setSelectedKabupaten] = useState('Kabupaten Magelang');
  const [selectedDesa, setSelectedDesa] = useState('Desa Candirejo');
  const [selectedTahun, setSelectedTahun] = useState('2026');

  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
    type: 'Nota' | 'Foto Fisik';
  } | null>(null);

  useEffect(() => {
    if (!activeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Data live dari BE-03/BE-07; jatuh ke data contoh bila basis data belum tersedia
  const [villages, setVillages] = useState<ApiVillage[]>([]);
  const [villagesLoaded, setVillagesLoaded] = useState(false);
  const [grant, setGrant] = useState<ApiGrant | null>(null);
  const [liveExpenses, setLiveExpenses] = useState<ApiExpense[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Muat daftar desa wisata untuk mengisi dropdown
  useEffect(() => {
    let cancelled = false;

    fetch('/api/villages?limit=1000')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success || !Array.isArray(json.data)) return;
        const list = json.data as ApiVillage[];
        if (list.length === 0) return;
        setVillages(list);
        setSelectedKabupaten((prev) =>
          list.some((v) => v.regency === prev) ? prev : list[0].regency
        );
      })
      .catch(() => {
        // Basis data belum siap: pertahankan opsi contoh
      })
      .finally(() => {
        if (!cancelled) setVillagesLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const kabupatenOptions = useMemo(() => {
    if (villages.length === 0) return DEFAULT_KABUPATEN;
    return Array.from(new Set(villages.map((v) => v.regency))).sort();
  }, [villages]);

  const desaOptions = useMemo(() => {
    if (villages.length === 0) return DEFAULT_DESA;
    const inRegency = villages.filter((v) => v.regency === selectedKabupaten);
    // Nama desa bisa kembar antar-slug (mis. "Desa Wisata Sambak"), jadi unikkan
    // supaya key <option> tidak duplikat.
    return Array.from(new Set((inRegency.length > 0 ? inRegency : villages).map((v) => v.name)));
  }, [villages, selectedKabupaten]);

  // Pastikan desa terpilih selalu ada di kabupaten aktif
  useEffect(() => {
    if (desaOptions.length === 0) return;
    if (!desaOptions.includes(selectedDesa)) {
      setSelectedDesa(desaOptions[0]);
    }
  }, [desaOptions, selectedDesa]);

  const selectedVillage = useMemo(
    () =>
      villages.find(
        (v) => v.name === selectedDesa && v.regency === selectedKabupaten
      ) ?? villages.find((v) => v.name === selectedDesa),
    [villages, selectedDesa, selectedKabupaten]
  );

  // Muat anggaran & rincian belanja desa terpilih
  useEffect(() => {
    if (!selectedVillage) {
      setLiveExpenses(null);
      setGrant(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const params = new URLSearchParams({
      village_id: selectedVillage.id,
      fiscal_year: selectedTahun,
    });

    fetch(`/api/transparansi?${params.toString()}`)
      .then((res) => res.json())
      .then((json: TransparansiResponse) => {
        if (cancelled) return;
        if (json?.success && json.data) {
          setGrant(json.data.grant);
          setLiveExpenses(Array.isArray(json.data.expenses) ? json.data.expenses : []);
        } else {
          setGrant(null);
          setLiveExpenses(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGrant(null);
        setLiveExpenses(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVillage, selectedTahun, villagesLoaded]);

  const isLive = liveExpenses !== null;
  const expenses = useMemo(
    () => (isLive ? liveExpenses!.map(mapExpense) : EXPENDITURES),
    [isLive, liveExpenses]
  );

  const totalPendanaan = isLive ? (grant?.total_allocated ?? 0) : 1_200_000_000;
  const totalTerpakai = isLive ? (grant?.total_realized ?? 0) : 840_000_000;
  const sisaSaldo = isLive ? (grant?.remaining_balance ?? 0) : 360_000_000;
  const persenTerpakai =
    totalPendanaan > 0 ? Math.round((totalTerpakai / totalPendanaan) * 100) : 0;
  const persenSisa = Math.max(0, 100 - persenTerpakai);

  const totalBelanja = useMemo(() => {
    if (!isLive) return 840_000_000;
    return liveExpenses!.reduce((sum, e) => sum + (e.amount_realized || 0), 0);
  }, [isLive, liveExpenses]);

  // Rincian sumber pendanaan untuk donut: dari DB saat live, dari data contoh
  // saat basis data belum terhubung. Persentase dihitung dari total agar donut
  // selalu utuh walau komposisi tiap desa berbeda.
  const [activeFunding, setActiveFunding] = useState<string | null>(null);
  const fundingSources = useMemo(() => {
    const raw = isLive
      ? (() => {
          const apbdes = grant?.apbdes_amount ?? 0;
          const banprov = grant?.banprov_amount ?? 0;
          const pades = grant?.pades_amount ?? 0;
          // Sebagian grant lama / LPJ baru belum memecah sumber dana
          // (apbdes/banprov/pades = 0). Pakai komposisi baku 40/50/10 dari pagu
          // supaya donut tetap terisi, bukan kosong.
          if (apbdes + banprov + pades === 0 && (grant?.total_allocated ?? 0) > 0) {
            const total = grant!.total_allocated;
            return [
              { key: 'apbdes', label: 'APBDes', amount: Math.round(total * 0.4), color: '#0D2453' },
              { key: 'banprov', label: 'Bantuan Provinsi', amount: Math.round(total * 0.5), color: '#5A8CD4' },
              {
                key: 'pades',
                label: 'PADes Wisata',
                amount: total - Math.round(total * 0.4) - Math.round(total * 0.5),
                color: '#B8D3F7',
              },
            ];
          }
          return [
            { key: 'apbdes', label: 'APBDes', amount: apbdes, color: '#0D2453' },
            { key: 'banprov', label: 'Bantuan Provinsi', amount: banprov, color: '#5A8CD4' },
            { key: 'pades', label: 'PADes Wisata', amount: pades, color: '#B8D3F7' },
          ];
        })()
      : [
          { key: 'apbdes', label: 'APBDes', amount: 720_000_000, color: '#0D2453' },
          { key: 'banprov', label: 'Bantuan Provinsi', amount: 300_000_000, color: '#5A8CD4' },
          { key: 'pades', label: 'PADes Wisata', amount: 180_000_000, color: '#B8D3F7' },
        ];
    const total = raw.reduce((sum, item) => sum + item.amount, 0);
    return raw.map((item) => ({
      ...item,
      percent: total > 0 ? (item.amount / total) * 100 : 0,
    }));
  }, [isLive, grant]);

  const activeFundingItem =
    fundingSources.find((item) => item.key === activeFunding) ?? null;

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
            Transparansi Dana
          </li>
        </ol>
      </nav>

      {/* 2. Header Section */}
      <div className="w-full">
        <div className="flex items-center gap-2.5 text-[#0D2453]">
          <Landmark className="w-6 h-6 text-[#0D2453]" />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0D2453]">
            Transparansi Dana Desa
          </h1>
        </div>
        <p className="text-xs sm:text-[15px] text-[#767676] mt-1.5 font-normal">
          Dari mana dana berasal dan untuk apa dibelanjakan? Telusuri anggaran hingga bukti penggunaannya.
        </p>
      </div>

      {/* 3. Filter Bar Card */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
        >
          {/* Pilih Kabupaten */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Pilih Kabupaten
            </label>
            <div className="relative">
              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                {kabupatenOptions.map((kab) => (
                  <option key={kab} value={kab}>
                    {kab}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pilih Desa */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Pilih Desa
            </label>
            <div className="relative">
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                {desaOptions.map((desa) => (
                  <option key={desa} value={desa}>
                    {desa}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tahun Anggaran */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Tahun Anggaran
            </label>
            <div className="relative">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tombol Tampilkan */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Tampilkan
            </button>
          </div>
        </form>
      </section>

      {/* 3. Village Header Banner Card */}
      <section className="w-full bg-[#0D2453] rounded-[24px] p-6 sm:p-8 text-white shadow-[0_4px_24px_rgba(13,36,83,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-bold tracking-tight">
            {selectedDesa}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-normal">
            {selectedVillage?.district ? `${selectedVillage.district}, ` : ''}
            {selectedKabupaten} · Tahun anggaran {selectedTahun}
          </p>
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
            {!villagesLoaded || isLoading
              ? 'Memuat data anggaran…'
              : isLive
                ? 'Data live dari basis data desa'
                : 'Data contoh · basis data belum terhubung'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-300 font-medium block">
            Total Pendanaan
          </span>
          <span className="text-2xl sm:text-[34px] font-extrabold text-white tracking-tight block mt-0.5">
            {formatRupiah(totalPendanaan)}
          </span>
        </div>
      </section>

      {/* 4. Two Comparison Cards: Sumber Pendanaan vs Dana Terpakai */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card A: Sumber Pendanaan Desa */}
        <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
              Sumber Pendanaan Desa
            </h3>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Komposisi sumber dana tahun anggaran {selectedTahun}.
              {isLive
                ? grant?.funding_source
                  ? ` ${grant.funding_source}`
                  : ''
                : ' Data contoh · basis data belum terhubung'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut Chart Canvas SVG */}
            <div className="sm:col-span-6 flex items-center justify-center relative">
              <svg
                className="w-44 h-44 -rotate-90 transform"
                viewBox="0 0 160 160"
                role="img"
                aria-label={`Komposisi sumber pendanaan ${selectedDesa}`}
              >
                {/* Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#E2E8F0"
                  strokeWidth="24"
                  fill="transparent"
                />
                {(() => {
                  const circumference = 2 * Math.PI * 62;
                  let offset = 0;
                  return fundingSources.map((item) => {
                    const length = (item.percent / 100) * circumference;
                    const dashOffset = -offset;
                    offset += length;
                    const isActive = activeFunding === item.key;
                    const dimmed = activeFunding !== null && !isActive;
                    return (
                      <circle
                        key={item.key}
                        cx="80"
                        cy="80"
                        r="62"
                        stroke={item.color}
                        strokeWidth={isActive ? 28 : 24}
                        strokeDasharray={`${length} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                        fill="transparent"
                        opacity={dimmed ? 0.4 : 1}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setActiveFunding(item.key)}
                        onMouseLeave={() => setActiveFunding(null)}
                        onClick={() =>
                          setActiveFunding((prev) => (prev === item.key ? null : item.key))
                        }
                      >
                        <title>{`${item.label}: ${formatRupiah(item.amount)} (${Math.round(item.percent)}%)`}</title>
                      </circle>
                    );
                  });
                })()}
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
                <span className="text-sm sm:text-base font-bold text-[#0D2453] leading-tight">
                  {formatRupiah(activeFundingItem ? activeFundingItem.amount : totalPendanaan)}
                </span>
                <span className="text-[10px] text-[#767676] font-medium">
                  {activeFundingItem ? activeFundingItem.label : 'Total pendanaan'}
                </span>
              </div>
            </div>

            {/* Legend Items */}
            <div className="sm:col-span-6 space-y-1">
              {fundingSources.map((item) => {
                const isActive = activeFunding === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setActiveFunding(item.key)}
                    onMouseLeave={() => setActiveFunding(null)}
                    onClick={() =>
                      setActiveFunding((prev) => (prev === item.key ? null : item.key))
                    }
                    aria-pressed={isActive}
                    className={`w-full flex items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                      isActive ? 'bg-[#F7F9FC] ring-1 ring-[#E6ECF5]' : 'hover:bg-[#F7F9FC]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="w-3 h-3 rounded-xs mt-0.5 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-[#767676] block mt-0.5 font-medium tabular-nums">
                          {formatRupiah(item.amount)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0D2453] tabular-nums">
                      {Math.round(item.percent)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isLive && grant?.lpj_document_url && (
            <div className="mt-6 pt-5 border-t border-[#E6ECF5]">
              <a
                href={grant.lpj_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D2453] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka dokumen LPJ</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          )}

          {isLive && !grant && (
            <p className="text-xs text-[#767676] leading-relaxed mt-6">
              Belum ada data anggaran yang dipublikasikan untuk desa dan tahun anggaran ini.
            </p>
          )}
        </div>

        {/* Card B: Dana Terpakai (Progress Bar & Stats) */}
        <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
              Dana Terpakai
            </h3>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Realisasi belanja dan saldo kas yang tersisa.
            </p>
          </div>

          <div className="space-y-6">
            {/* Persentase Terpakai */}
            <div className="flex items-baseline justify-between">
              <div className="text-5xl font-extrabold text-[#0D2453] tracking-tight">
                {persenTerpakai}%
              </div>
              <div className="text-xs text-[#767676] font-medium">
                dari total dana telah terpakai
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-4 rounded-full bg-[#DCE7F5] overflow-hidden flex">
              <div
                className="h-full bg-[#0D2453] rounded-full transition-all duration-500"
                style={{ width: `${persenTerpakai}%` }}
              />
            </div>

            {/* Bottom Summary (Dana Terpakai vs Sisa Saldo Kas) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0D2453]" />
                  <span>Dana Terpakai · {persenTerpakai}%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  {formatRupiah(totalTerpakai)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#DCE7F5]" />
                  <span>Sisa Saldo Kas · {persenSisa}%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  {formatRupiah(sisaSaldo)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Table Section: Laporan Pengeluaran Desa Wisata */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0D2453]">
              Laporan Pengeluaran Desa Wisata
            </h3>
            <p className="text-xs text-[#767676] mt-0.5">
              Setiap pengeluaran disertai nota dan dokumentasi fisik. Klik bukti untuk memperbesar.
            </p>
          </div>
          <div className="text-xs text-[#767676] font-medium">
            Tahun anggaran {selectedTahun}
          </div>
        </div>

        {/* Expenditures Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-[#0D2453]">
            {/* Table Head with Soft Blue Tint as in Figma */}
            <thead>
              <tr className="bg-[#DCE7F5] text-[#0D2453] text-xs font-semibold">
                <th scope="col" className="px-5 py-3.5 rounded-l-xl">Tanggal</th>
                <th scope="col" className="px-5 py-3.5">Nama Kegiatan / Fasilitas</th>
                <th scope="col" className="px-5 py-3.5">Nominal (Rp)</th>
                <th scope="col" className="px-5 py-3.5">Pagu / SSH</th>
                <th scope="col" className="px-5 py-3.5">Status Audit</th>
                <th scope="col" className="px-5 py-3.5 rounded-r-xl">Foto Bukti Nota &amp; Fisik</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6ECF5]">
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-[#64748B] font-medium">
                    {isLoading
                      ? 'Memuat rincian belanja…'
                      : 'Belum ada rincian belanja tercatat untuk tahun anggaran ini.'}
                  </td>
                </tr>
              )}
              {expenses.map((row) => {
                const isOverBudget = row.deviation !== undefined && row.deviation > 40;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Tanggal */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-[#0D2453] font-medium align-middle">
                      {row.date}
                    </td>

                    {/* Kegiatan */}
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-[#0D2453] text-xs sm:text-sm">{row.title}</div>
                      <div className="text-[11px] text-[#767676] mt-0.5">{row.sub}</div>
                    </td>

                    {/* Nominal */}
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-[#0D2453] text-xs sm:text-sm align-middle">
                      Rp {row.amount}
                    </td>

                    {/* SSH Jateng */}
                    <td className="px-5 py-4 align-middle whitespace-nowrap">
                      {row.sshRef ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono text-[#64748B]">{row.sshRef}</span>
                          <span className="text-xs font-semibold text-[#0D2453]">Rp {row.sshAmount}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Audit / Deviasi */}
                    <td className="px-5 py-4 align-middle">
                      {row.deviation !== undefined || row.aiFlag ? (
                        <div className="flex flex-col gap-1 items-start">
                          {row.deviation !== undefined && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isOverBudget || row.aiFlag
                                  ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                                  : 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                              }`}
                            >
                              {isOverBudget || row.aiFlag ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <span aria-hidden="true">✓</span>
                              )}
                              <span>
                                {row.deviation > 0 ? '+' : ''}
                                {row.deviation.toFixed(1)}%
                              </span>
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-medium ${
                              isOverBudget || row.aiFlag ? 'text-[#991B1B]' : 'text-[#065F46]'
                            }`}
                          >
                            {row.aiFlag
                              ? 'Ditandai anomali AI'
                              : isOverBudget
                                ? 'Melebihi batas wajar'
                                : 'Sesuai standar SSH'}
                          </span>
                          {row.anomalyNote && (
                            <span
                              className="text-[9px] text-[#767676] leading-snug max-w-[220px]"
                              title={row.anomalyNote}
                            >
                              {row.anomalyNote.length > 80
                                ? `${row.anomalyNote.slice(0, 80)}…`
                                : row.anomalyNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum diaudit</span>
                      )}
                    </td>

                    {/* Foto Bukti Nota & Fisik */}
                    <td className="px-5 py-4 align-middle">
                      {row.receiptImg || row.photoImg ? (
                        <div className="flex items-center gap-3">
                          {/* Nota Box */}
                          {row.receiptImg && (
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveModal({
                                    url: row.receiptImg!,
                                    title: `${row.title} - Nota Kuitansi`,
                                    type: 'Nota',
                                  })
                                }
                                aria-label={`Buka nota kuitansi ${row.title}`}
                                className="w-16 h-11 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer hover:border-[#0D2453] hover:shadow-2xs transition-all relative group"
                              >
                                <img
                                  src={row.receiptImg}
                                  alt={`Nota kuitansi ${row.title}`}
                                  className="w-full h-full object-cover object-top"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1">
                                <span>Nota</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          )}

                          {/* Foto Fisik Box */}
                          {row.photoImg && (
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveModal({
                                    url: row.photoImg!,
                                    title: `${row.title} - Foto Fisik Fasilitas`,
                                    type: 'Foto Fisik',
                                  })
                                }
                                className="w-16 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-[#0D2453] hover:shadow-2xs transition-all relative group"
                              >
                                <img
                                  src={row.photoImg}
                                  alt={`Foto fisik ${row.title}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                  <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1">
                                <span>Foto Fisik</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Bukti belum diunggah
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Total Summary */}
            <tfoot>
              <tr className="bg-slate-50/70 border-t border-[#E6ECF5] text-xs font-semibold text-[#0D2453]">
                <td className="px-5 py-4" colSpan={2}>
                  <span className="font-bold text-[#0D2453] text-sm">Total belanja tercatat</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-[#0D2453] text-sm">
                    {formatRupiah(totalBelanja)}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[#767676] font-normal" colSpan={3}>
                  {isLive
                    ? `${expenses.length} pos belanja pada tahun anggaran ${selectedTahun}`
                    : `Sama dengan dana terpakai · ${persenTerpakai}%`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Lightbox / Modal for Evidence Preview */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeModal.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm sm:text-base">{activeModal.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup pratinjau kuitansi"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeModal.url}
                alt={activeModal.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#767676]">
              <span>Dokumentasi transparansi anggaran {selectedDesa}</span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs hover:bg-[#163574] transition-colors"
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
