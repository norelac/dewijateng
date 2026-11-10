import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DASHBOARD_PERIODE,
  DASHBOARD_TERAKHIR_DIPERBARUI,
  DASHBOARD_WILAYAH,
  DESA_MELAPOR,
} from '@/components/disbudparekraf/dashboard/demoData';

/** Bar filter periode pemantauan (Figma 422:1002). */
export default function PeriodeBar() {
  return (
    <div className="w-full bg-white border border-[#E6ECF5] rounded-[14px] px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
      <span className="text-[#64748B] text-[12px] whitespace-nowrap">Periode pemantauan</span>

      <div className="flex items-center gap-3 flex-wrap">
        {[DASHBOARD_PERIODE, DASHBOARD_WILAYAH].map((label) => (
          <button
            key={label}
            type="button"
            className="h-[40px] px-4 inline-flex items-center gap-3 rounded-[999px] border border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-medium"
          >
            <span>{label}</span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
        ))}
      </div>

      <div className="lg:ml-auto flex flex-col gap-0.5">
        <span className="text-[#0D2453] text-[13px] font-semibold">
          {DESA_MELAPOR.sudah} dari {DESA_MELAPOR.total} desa sudah melapor
        </span>
        <span className="text-[#64748B] text-[11px]">{DASHBOARD_TERAKHIR_DIPERBARUI}</span>
      </div>
    </div>
  );
}
