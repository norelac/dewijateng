'use client';

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, ArrowRight } from 'lucide-react';
import { VillageBudgetData } from './types';
import { useVillageName } from './usePengelolaData';

interface AnggaranDesaViewProps {
  budget: VillageBudgetData;
  onOpenEdit: () => void;
  onNavigateToPengeluaran?: () => void;
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp');
}

export default function AnggaranDesaView({
  budget,
  onOpenEdit,
  onNavigateToPengeluaran,
}: AnggaranDesaViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(budget.year || 2026);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const villageName = useVillageName();

  const totalPendanaan = budget.apbdes + budget.banprov + budget.pades;
  const danaTerpakai = budget.usedAmount;
  const sisaKas = Math.max(0, totalPendanaan - danaTerpakai);

  const usedPercentage =
    totalPendanaan > 0 ? Math.round((danaTerpakai / totalPendanaan) * 100) : 0;
  const sisaPercentage = Math.max(0, 100 - usedPercentage);

  const apbdesPorsi =
    totalPendanaan > 0 ? Math.round((budget.apbdes / totalPendanaan) * 100) : 0;
  const banprovPorsi =
    totalPendanaan > 0 ? Math.round((budget.banprov / totalPendanaan) * 100) : 0;
  const padesPorsi =
    totalPendanaan > 0 ? Math.max(0, 100 - apbdesPorsi - banprovPorsi) : 0;

  return (
    <div className="flex flex-col gap-[24px] w-full" data-node-id="371:1161">
      {/* 1. Pengantar Halaman (Judul & Aksi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] w-full">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal">
            Anggaran desa
          </h1>
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
            Sumber pendanaan dan realisasi {villageName} · Tahun anggaran {selectedYear}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEdit}
          className="bg-[#0d2453] border-2 border-[#0d2453] text-white text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-[#132d66] transition-colors shadow-2xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          Ubah anggaran
        </button>
      </div>

      {/* 2. Periode Anggaran & Filter Dropdown */}
      <div className="flex items-center justify-between gap-4 w-full">
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
          Data per {budget.dateStr || '28 Oktober 2026'}
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
            className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] px-[14px] flex items-center gap-[8px] text-[#0d2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <span>TA {selectedYear}</span>
            <ChevronDown className="w-[16px] h-[16px] text-[#64748b]" />
          </button>

          {yearDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setYearDropdownOpen(false)}
              />
              <div className="absolute right-0 top-[48px] bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 w-[130px] animate-in fade-in zoom-in-95 duration-100">
                {[2026, 2025, 2024].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr);
                      setYearDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-[12px] hover:bg-slate-50 ${
                      selectedYear === yr
                        ? 'font-semibold text-[#0d2453] bg-slate-50'
                        : 'text-[#64748b]'
                    }`}
                  >
                    TA {yr}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Posisi Anggaran (3 Kartu Ringkasan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px] w-full">
        {/* Total Pendanaan */}
        <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
            Total pendanaan
          </p>
          <p className="text-[#0d2453] text-[25px] font-semibold leading-tight font-mono tracking-tight">
            {formatRupiah(totalPendanaan)}
          </p>
          <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
            3 sumber pendanaan
          </p>
        </div>

        {/* Dana Terpakai */}
        <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
            Dana terpakai
          </p>
          <p className="text-[#0d2453] text-[25px] font-semibold leading-tight font-mono tracking-tight">
            {formatRupiah(danaTerpakai)}
          </p>
          <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
            {usedPercentage}% · {budget.usedActivitiesCount || 4} kegiatan tercatat
          </p>
        </div>

        {/* Sisa Kas */}
        <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
            Sisa kas
          </p>
          <p className="text-[#0d2453] text-[25px] font-semibold leading-tight font-mono tracking-tight">
            {formatRupiah(sisaKas)}
          </p>
          <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
            {sisaPercentage}% dari total pendanaan
          </p>
        </div>
      </div>

      {/* 4. Rincian Sumber Pendanaan (Tabel) */}
      <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs w-full">
        <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
          Rincian sumber pendanaan
        </h2>

        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="min-w-[620px] flex flex-col">
            {/* Header Tabel */}
            <div className="bg-[#f3f5f8] rounded-t-[8px] p-[14px] flex items-center gap-[20px] text-[#64748b] text-[13px]">
              <div className="flex-1 min-w-px">Sumber</div>
              <div className="w-[220px] shrink-0">Nominal</div>
              <div className="w-[120px] shrink-0">Porsi</div>
            </div>

            {/* Baris 1: APBDes */}
            <div className="border-b border-[#e6ecf5] px-[14px] py-[16px] flex items-center gap-[20px] text-[#0d2453] text-[13px] hover:bg-slate-50/60 transition-colors">
              <div className="flex-1 min-w-px font-semibold">APBDes</div>
              <div className="w-[220px] shrink-0 font-mono">
                {formatRupiah(budget.apbdes)}
              </div>
              <div className="w-[120px] shrink-0 font-mono">{apbdesPorsi}%</div>
            </div>

            {/* Baris 2: Bantuan Provinsi */}
            <div className="border-b border-[#e6ecf5] px-[14px] py-[16px] flex items-center gap-[20px] text-[#0d2453] text-[13px] hover:bg-slate-50/60 transition-colors">
              <div className="flex-1 min-w-px font-semibold">
                Bantuan Provinsi
              </div>
              <div className="w-[220px] shrink-0 font-mono">
                {formatRupiah(budget.banprov)}
              </div>
              <div className="w-[120px] shrink-0 font-mono">{banprovPorsi}%</div>
            </div>

            {/* Baris 3: PADes Wisata */}
            <div className="border-b border-[#e6ecf5] px-[14px] py-[16px] flex items-center gap-[20px] text-[#0d2453] text-[13px] hover:bg-slate-50/60 transition-colors">
              <div className="flex-1 min-w-px font-semibold">PADes Wisata</div>
              <div className="w-[220px] shrink-0 font-mono">
                {formatRupiah(budget.pades)}
              </div>
              <div className="w-[120px] shrink-0 font-mono">{padesPorsi}%</div>
            </div>
          </div>
        </div>

        <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
          Terakhir diperbarui: {budget.lastUpdatedStr}
        </p>
      </div>

      {/* 5. Realisasi Belanja */}
      <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs w-full">
        <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
          Realisasi belanja
        </h2>

        {/* Bar Realisasi */}
        <div className="h-[12px] rounded-[6px] overflow-hidden flex w-full bg-[#cbe2ff]">
          <div
            className="h-full bg-[#0d2453]"
            style={{ width: `${Math.min(100, Math.max(0, usedPercentage))}%` }}
          />
        </div>

        {/* Keterangan Realisasi & Tombol Tindakan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[14px] w-full pt-[4px]">
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
            {usedPercentage}% digunakan · {formatRupiah(danaTerpakai)}
          </p>

          <button
            type="button"
            onClick={onNavigateToPengeluaran}
            className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] px-[16px] flex items-center gap-[8px] text-[#0d2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
          >
            <span>Lihat pengeluaran &amp; bukti</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Catatan Informasi Integritas Buku Kas */}
      <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px] w-full">
        <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
        <p className="text-[#0d2453] text-[13px] font-normal leading-[1.5] flex-1">
          Realisasi mengikuti pengeluaran tersimpan di buku kas. Mengubah sumber pendanaan tidak menambah atau menghapus pengeluaran.
        </p>
      </div>

      {/* 7. Sub-Footer Layanan */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>{villageName} · Per 28 Oktober 2026</span>
      </div>
    </div>
  );
}
