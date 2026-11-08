'use client';

import React from 'react';

export default function AnggaranSection() {
  // SVG Donut calculation
  // Radius r = 58, Circumference = 2 * PI * 58 ≈ 364.42
  const c = 364.42;
  const apbdesLength = 0.60 * c; // 218.65
  const banprovLength = 0.25 * c; // 91.10
  const padesLength = 0.15 * c; // 54.66

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
            Komposisi pendapatan desa · TA 2026
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
              {/* APBDes 60% */}
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
              {/* Bantuan Provinsi 25% */}
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
              {/* PADes Wisata 15% */}
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
              <span className="text-[#0D2453] text-[20px] font-semibold tracking-tight leading-none">
                Rp 1,2 M
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
                  <span className="font-semibold">60%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal">
                  Rp 720.000.000
                </span>
              </div>
            </div>

            {/* Bantuan Provinsi */}
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-[#7B92C1] mt-1 shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1 leading-tight">
                <div className="flex items-center justify-between text-[#0D2453] text-[12px]">
                  <span className="font-normal">Bantuan Provinsi</span>
                  <span className="font-semibold">25%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal">
                  Rp 300.000.000
                </span>
              </div>
            </div>

            {/* PADes Wisata */}
            <div className="flex items-start gap-2.5 w-full">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-[#CBE2FF] mt-1 shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1 leading-tight">
                <div className="flex items-center justify-between text-[#0D2453] text-[12px]">
                  <span className="font-normal">PADes Wisata</span>
                  <span className="font-semibold">15%</span>
                </div>
                <span className="text-[#64748B] text-[11px] font-normal">
                  Rp 180.000.000
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
            className="text-[#0D2453] text-[12px] font-semibold hover:underline shrink-0"
          >
            Kelola anggaran →
          </button>
        </div>

        {/* Persentase Realisasi */}
        <div className="flex items-end justify-between w-full pt-1">
          <span className="text-[#0D2453] text-[36px] sm:text-[38px] font-semibold tracking-[-1px] leading-none">
            70%
          </span>
          <span className="bg-[#F3F5F8] text-[#64748B] text-[11px] font-medium px-2.5 py-1.5 rounded-full leading-none">
            4 kegiatan tercatat
          </span>
        </div>

        {/* Progress Bar (Dual Color 70% vs 30%) */}
        <div className="h-[16px] w-full rounded-[5px] overflow-hidden flex bg-slate-100">
          <div
            className="bg-[#0D2453] h-full transition-all duration-500"
            style={{ width: '70%' }}
            title="Dana terpakai: 70%"
          />
          <div
            className="bg-[#CBE2FF] h-full transition-all duration-500 flex-1"
            title="Sisa kas: 30%"
          />
        </div>

        {/* Rincian Realisasi */}
        <div className="flex items-start gap-6 w-full pt-1">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-normal leading-none">
              Dana terpakai · 70%
            </span>
            <span className="text-[#0D2453] text-[17px] sm:text-[18px] font-medium leading-tight">
              Rp 840.000.000
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[#64748B] text-[11px] font-normal leading-none">
              Sisa kas · 30%
            </span>
            <span className="text-[#0D2453] text-[17px] sm:text-[18px] font-medium leading-tight">
              Rp 360.000.000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
