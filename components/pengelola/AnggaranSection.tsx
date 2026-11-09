'use client';

import React from 'react';
import { VillageBudgetData } from './types';

interface AnggaranSectionProps {
  budget: VillageBudgetData;
  onManageBudget?: () => void;
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp');
}

function formatShortMiliar(num: number): string {
  if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    });
    return `Rp ${val} M`;
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 0,
    });
    return `Rp ${val} Jt`;
  }
  return formatRupiah(num);
}

export default function AnggaranSection({
  budget,
  onManageBudget,
}: AnggaranSectionProps) {
  const total = budget.apbdes + budget.banprov + budget.pades;
  const apbdesRatio = total > 0 ? budget.apbdes / total : 0;
  const banprovRatio = total > 0 ? budget.banprov / total : 0;
  const padesRatio = total > 0 ? budget.pades / total : 0;

  const apbdesPct = Math.round(apbdesRatio * 100);
  const banprovPct = Math.round(banprovRatio * 100);
  const padesPct = Math.max(0, 100 - apbdesPct - banprovPct);

  const usedPct = total > 0 ? Math.round((budget.usedAmount / total) * 100) : 0;
  const sisaPct = Math.max(0, 100 - usedPct);
  const sisaKas = Math.max(0, total - budget.usedAmount);

  // SVG Donut calculation
  // Radius r = 58, Circumference = 2 * PI * 58 ≈ 364.42
  const c = 364.42;
  const apbdesLength = apbdesRatio * c;
  const banprovLength = banprovRatio * c;
  const padesLength = padesRatio * c;

  const banprovOffset = -apbdesLength;
  const padesOffset = -(apbdesLength + banprovLength);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch">
      {/* Kartu 1: Sumber Pendanaan */}
      <div className="bg-white border border-[#E6ECF5] rounded-[18px] p-6 flex flex-col gap-5 shadow-xs justify-between">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-normal">
            Sumber pendanaan
          </h2>
          <p className="text-[#64748B] text-[12px] font-normal leading-relaxed">
            Komposisi pendapatan desa · TA {budget.year || 2026}
          </p>
        </div>

        {/* Donut & Legend */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-7 w-full py-1">
          {/* Donut Chart SVG */}
          <div className="relative w-[156px] h-[156px] shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 156 156"
            >
              {/* Background track */}
              <circle
                cx="78"
                cy="78"
                r="58"
                fill="none"
                stroke="#F3F5F8"
                strokeWidth="20"
              />
              {/* APBDes */}
              <circle
                cx="78"
                cy="78"
                r="58"
                fill="none"
                stroke="#0D2453"
                strokeWidth="20"
                strokeDasharray={`${apbdesLength} ${c}`}
                strokeDashoffset="0"
              />
              {/* Bantuan Provinsi */}
              <circle
                cx="78"
                cy="78"
                r="58"
                fill="none"
                stroke="#7B92C1"
                strokeWidth="20"
                strokeDasharray={`${banprovLength} ${c}`}
                strokeDashoffset={banprovOffset}
              />
              {/* PADes Wisata */}
              <circle
                cx="78"
                cy="78"
                r="58"
                fill="none"
                stroke="#CBE2FF"
                strokeWidth="20"
                strokeDasharray={`${padesLength} ${c}`}
                strokeDashoffset={padesOffset}
              />
            </svg>

            {/* Center Overlay Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[#0D2453] text-[18px] sm:text-[20px] font-semibold tracking-tight leading-none text-center">
                {formatShortMiliar(total)}
              </span>
              <span className="text-[#64748B] text-[10px] font-normal mt-1 leading-none">
                Total pendanaan
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            {/* APBDes */}
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-[#0D2453] mt-1 shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1 leading-tight">
                <div className="flex items-center justify-between text-[#0D2453] text-[12px]">
                  <span className="font-normal">APBDes</span>
                  <span className="font-semibold">{apbdesPct}%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal font-mono">
                  {formatRupiah(budget.apbdes)}
                </span>
              </div>
            </div>

            {/* Bantuan Provinsi */}
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-[#7B92C1] mt-1 shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1 leading-tight">
                <div className="flex items-center justify-between text-[#0D2453] text-[12px]">
                  <span className="font-normal">Bantuan Provinsi</span>
                  <span className="font-semibold">{banprovPct}%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal font-mono">
                  {formatRupiah(budget.banprov)}
                </span>
              </div>
            </div>

            {/* PADes Wisata */}
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-[#CBE2FF] mt-1 shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1 leading-tight">
                <div className="flex items-center justify-between text-[#0D2453] text-[12px]">
                  <span className="font-normal">PADes Wisata</span>
                  <span className="font-semibold">{padesPct}%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal font-mono">
                  {formatRupiah(budget.pades)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kartu 2: Realisasi Anggaran */}
      <div className="bg-white border border-[#E6ECF5] rounded-[18px] p-6 flex flex-col justify-between gap-5 shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-normal">
              Realisasi anggaran
            </h2>
            <p className="text-[#64748B] text-[12px] font-normal leading-relaxed">
              Belanja tercatat sesuai dengan buku kas desa
            </p>
          </div>
          <button
            type="button"
            onClick={onManageBudget}
            className="text-[#0D2453] text-[12px] font-semibold hover:underline shrink-0 cursor-pointer"
          >
            Kelola anggaran →
          </button>
        </div>

        {/* Persentase Realisasi */}
        <div className="flex items-end justify-between w-full pt-1">
          <span className="text-[#0D2453] text-[36px] sm:text-[38px] font-semibold tracking-[-1px] leading-none">
            {usedPct}%
          </span>
          <span className="bg-[#F3F5F8] text-[#64748B] text-[11px] font-medium px-2.5 py-1.5 rounded-full leading-none">
            {budget.usedActivitiesCount || 4} kegiatan tercatat
          </span>
        </div>

        {/* Progress Bar (Dual Color usedPct vs sisaPct) */}
        <div className="h-[16px] w-full rounded-[5px] overflow-hidden flex bg-slate-100">
          <div
            className="bg-[#0D2453] h-full"
            style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }}
            title={`Dana terpakai: ${usedPct}%`}
          />
          <div
            className="bg-[#CBE2FF] h-full flex-1"
            title={`Sisa kas: ${sisaPct}%`}
          />
        </div>

        {/* Rincian Realisasi */}
        <div className="flex items-start gap-6 w-full pt-1">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-normal leading-none">
              Dana terpakai · {usedPct}%
            </span>
            <span className="text-[#0D2453] text-[17px] sm:text-[18px] font-semibold font-mono leading-tight">
              {formatRupiah(budget.usedAmount)}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-normal leading-none">
              Sisa kas · {sisaPct}%
            </span>
            <span className="text-[#0D2453] text-[17px] sm:text-[18px] font-semibold font-mono leading-tight">
              {formatRupiah(sisaKas)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
