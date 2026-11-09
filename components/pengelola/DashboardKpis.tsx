'use client';

import React from 'react';
import {
  MapPin,
  ChevronDown,
  Wallet,
  MessagesSquare,
  CheckCircle2,
  Files,
} from 'lucide-react';

interface ReportCounts {
  total: number;
  perluDitangani: number;
  masuk: number;
  diverifikasi: number;
  diproses: number;
  selesai: number;
}

interface DashboardKpisProps {
  villageName?: string;
  regency?: string;
  updatedAt?: string;
  periodYear?: string;
  totalFunding?: number;
  reportCounts?: ReportCounts;
  evidence?: { complete: number; total: number };
}

function formatFunding(num: number): string {
  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    })} Miliar`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 0,
    })} Juta`;
  }
  return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
}

export default function DashboardKpis({
  villageName = 'Desa Candirejo',
  regency = 'Borobudur, Kabupaten Magelang · Jawa Tengah',
  updatedAt = 'Per 28 Oktober 2026 · 10.00 WIB',
  periodYear = 'TA 2026',
  totalFunding = 1200000000,
  reportCounts = {
    total: 4,
    perluDitangani: 3,
    masuk: 1,
    diverifikasi: 1,
    diproses: 1,
    selesai: 1,
  },
  evidence = { complete: 4, total: 4 },
}: DashboardKpisProps) {
  const villageShort = villageName.replace(/^Desa\s+/i, '');
  const selesaiPct =
    reportCounts.total > 0
      ? Math.round((reportCounts.selesai / reportCounts.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="w-full">
        <h1 className="text-[#0D2453] text-[24px] sm:text-[28px] font-semibold tracking-[-0.7px]">
          Dashboard pengelola desa
        </h1>
      </div>

      {/* Konteks Desa Bar */}
      <div className="bg-white rounded-[14px] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#E6ECF5] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-[18px] h-[18px] shrink-0 text-[#0D2453] flex items-center justify-center">
            <MapPin className="w-[18px] h-[18px] text-[#0D2453]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[#0D2453] text-[14px] font-semibold">
              {villageName}
            </span>
            <span className="text-[#64748B] text-[11px] font-normal mt-0.5">
              {regency}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <span className="text-[#64748B] text-[11px] font-normal whitespace-nowrap">
            {updatedAt}
          </span>
          <div className="bg-white border border-[#E6ECF5] rounded-full h-8 px-3 flex items-center gap-2 text-[#0D2453] text-[11px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-[#0D2453]" />
            <span>{periodYear}</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {/* Card 1: Total Pendanaan (Dark Card) */}
        <div className="bg-[#0D2453] text-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between w-full">
            <span className="text-white text-[12px] font-normal">
              Total pendanaan
            </span>
            <Wallet className="w-[18px] h-[18px] text-white shrink-0" />
          </div>
          <div className="text-white text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
            {formatFunding(totalFunding)}
          </div>
          <div className="text-white text-[11px] font-normal opacity-90">
            Tahun anggaran {periodYear.replace(/[^0-9]/g, '') || '2026'}
          </div>
        </div>

        {/* Card 2: Laporan Perlu Ditangani */}
        <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[12px] font-normal">
              Laporan perlu ditangani
            </span>
            <MessagesSquare className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
          </div>
          <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
            {reportCounts.perluDitangani} laporan
          </div>
          <div className="text-[#64748B] text-[11px] font-normal">
            {reportCounts.masuk} masuk · {reportCounts.diverifikasi} diverifikasi ·{' '}
            {reportCounts.diproses} diproses
          </div>
        </div>

        {/* Card 3: Laporan Selesai */}
        <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[12px] font-normal">
              Laporan selesai
            </span>
            <CheckCircle2 className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
          </div>
          <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
            {reportCounts.selesai} dari {reportCounts.total}
          </div>
          <div className="text-[#64748B] text-[11px] font-normal">
            {selesaiPct}% dari seluruh laporan {villageShort}
          </div>
        </div>

        {/* Card 4: Kelengkapan Bukti */}
        <div className="bg-white rounded-[18px] p-5 h-[142px] flex flex-col justify-between border border-[#E6ECF5] shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between w-full">
            <span className="text-[#64748B] text-[12px] font-normal">
              Kelengkapan bukti
            </span>
            <Files className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
          </div>
          <div className="text-[#0D2453] text-[28px] sm:text-[30px] font-semibold tracking-[-0.8px] leading-tight">
            {evidence.complete} dari {evidence.total}
          </div>
          <div className="text-[#64748B] text-[11px] font-normal">
            {evidence.total > 0 && evidence.complete >= evidence.total
              ? 'Semua kegiatan memiliki nota & foto'
              : `${evidence.complete} kegiatan memiliki nota & foto`}
          </div>
        </div>
      </div>
    </div>
  );
}
