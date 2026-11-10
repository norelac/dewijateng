import React from 'react';
import Link from 'next/link';
import { CASHFLOW } from '@/components/disbudparekraf/dashboard/demoData';

const SCALE_MAX = 800;
const CHART_HEIGHT = 168; // px, tinggi area batang (selaras skala 0–800)

/** Tinggi batang dari nilai (juta rupiah) ke px. */
function barHeight(value: number) {
  return Math.round((value / SCALE_MAX) * CHART_HEIGHT);
}

/** Grafik arus kas 4 periode + kartu tindak lanjut keuangan (Figma 422:1026–422:1066). */
export default function ArusKasSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Grafik arus kas */}
      <div className="lg:col-span-7 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col">
        <div className="flex flex-col gap-1">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Arus kas seluruh desa</h3>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">Oktober 2026 · dalam juta rupiah</p>
        </div>

        <div className="flex items-center gap-5 mt-3 justify-end">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2453]" />
            <span className="text-[12px] text-[#0D2453]">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2453]/45" />
            <span className="text-[12px] text-[#0D2453]">Pengeluaran</span>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {/* Sumbu Y */}
          <div className="flex flex-col justify-between text-[11px] text-[#64748B] h-[168px] py-0 shrink-0">
            <span>800</span>
            <span>400</span>
            <span>0</span>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Area batang */}
            <div className="relative h-[168px] flex items-end justify-between gap-4 border-b border-[#E6ECF5]">
              {[800, 400].map((line) => (
                <span
                  key={line}
                  className="absolute left-0 right-0 border-t border-dashed border-[#F1F5F9]"
                  style={{ bottom: `${(line / SCALE_MAX) * 100}%` }}
                />
              ))}

              {CASHFLOW.map((bar) => (
                <div key={bar.periode} className="relative flex-1 flex items-end justify-center gap-1.5 h-full">
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-[11px] text-[#64748B] mb-1">{bar.pemasukanLabel}</span>
                    <div
                      className="w-[26px] rounded-t-[6px] bg-[#0D2453]"
                      style={{ height: `${barHeight(bar.pemasukan)}px` }}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-[11px] text-[#64748B] mb-1">{bar.pengeluaranLabel}</span>
                    <div
                      className="w-[26px] rounded-t-[6px] bg-[#0D2453]/45"
                      style={{ height: `${barHeight(bar.pengeluaran)}px` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Label periode */}
            <div className="flex justify-between gap-4 mt-2">
              {CASHFLOW.map((bar) => (
                <span key={bar.periode} className="flex-1 text-center text-[11px] text-[#64748B]">
                  {bar.periode}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tindak lanjut keuangan */}
      <div className="lg:col-span-5 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col">
        <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Tindak lanjut keuangan</h3>

        <div className="flex flex-col gap-1 mt-4">
          <span className="text-[#0D2453] text-[13px] font-semibold">6 desa belum mengirim laporan</span>
          <span className="text-[#64748B] text-[12px]">Data belum masuk untuk periode Oktober.</span>
        </div>

        <div className="h-px w-full bg-[#E6ECF5] my-4" />

        <div className="flex flex-col gap-1">
          <span className="text-[#0D2453] text-[13px] font-semibold">6 desa perlu melengkapi bukti</span>
          <span className="text-[#64748B] text-[12px]">Termasuk 1 transaksi di Desa Candirejo.</span>
        </div>

        {/* ponytail: rute monitoring penuh dibuat pada Fase 4. */}
        <Link
          href="/disbudparekraf/monitoring"
          className="mt-auto h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold self-start"
        >
          Lihat monitoring
        </Link>
      </div>
    </div>
  );
}
