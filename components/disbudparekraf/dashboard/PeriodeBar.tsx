import React from 'react';
import { ChevronDown } from 'lucide-react';
import { DASHBOARD_TERAKHIR_DIPERBARUI, DASHBOARD_WILAYAH } from '@/components/disbudparekraf/dashboard/demoData';
import { periodeLabel } from '@/lib/finance';

/**
 * Bar filter periode pemantauan dashboard (Figma 422:1002).
 * Angka pelapor dan tanggal pembaruan dibaca dari database (Fase 4).
 */
export default function PeriodeBar({
  desaMelapor,
  desaTotal,
  diperbarui,
  periode,
}: {
  desaMelapor: number;
  desaTotal: number;
  diperbarui: string | null;
  periode: string;
}) {
  const labels = [periodeLabel(periode), DASHBOARD_WILAYAH];

  return (
    <div className="w-full bg-white border border-[#E6ECF5] rounded-[14px] px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
      <span className="text-[#64748B] text-[12px] whitespace-nowrap">Periode pemantauan</span>

      <div className="flex items-center gap-3 flex-wrap">
        {labels.map((label) => (
          <div
            key={label}
            className="h-[40px] px-4 inline-flex items-center gap-3 rounded-[999px] border border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-medium"
          >
            <span>{label}</span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </div>
        ))}
      </div>

      <div className="lg:ml-auto flex flex-col gap-0.5">
        <span className="text-[#0D2453] text-[13px] font-semibold">
          {desaMelapor} dari {desaTotal} desa sudah melapor
        </span>
        <span className="text-[#64748B] text-[11px]">
          {diperbarui ? `Data diperbarui ${diperbarui}` : DASHBOARD_TERAKHIR_DIPERBARUI}
        </span>
      </div>
    </div>
  );
}
