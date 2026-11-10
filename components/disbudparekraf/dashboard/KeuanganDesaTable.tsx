import React from 'react';
import { KEUANGAN_DESA } from '@/components/disbudparekraf/dashboard/demoData';

function KelengkapanBadge({ value }: { value: 'Lengkap' | 'Perlu bukti' }) {
  const lengkap = value === 'Lengkap';
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[999px] px-2.5 text-[11px] font-medium ${
        lengkap ? 'bg-[#E5F4ED] text-[#216B55]' : 'bg-[#FCF1DC] text-[#875B12]'
      }`}
    >
      {value}
    </span>
  );
}

/** Tabel ringkasan keuangan per desa (Figma 422:1068). */
export default function KeuanganDesaTable() {
  return (
    <div className="w-full bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Keuangan desa wisata</h3>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            Ringkasan 4 dari 48 desa · periode Oktober 2026
          </p>
        </div>
        <button
          type="button"
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap"
        >
          Lihat seluruh desa
        </button>
      </div>

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#F7F9FC] rounded-[6px] text-[11px] font-medium text-[#64748B]">
              <th className="py-2.5 px-3 font-medium rounded-l-[6px]">Desa wisata</th>
              <th className="py-2.5 px-3 font-medium">Pemasukan</th>
              <th className="py-2.5 px-3 font-medium">Pengeluaran</th>
              <th className="py-2.5 px-3 font-medium">Saldo akhir</th>
              <th className="py-2.5 px-3 font-medium">Kelengkapan</th>
              <th className="py-2.5 px-3 font-medium rounded-r-[6px]">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF5]">
            {KEUANGAN_DESA.map((row) => (
              <tr key={row.desa}>
                <td className="py-3.5 px-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[#0D2453] text-[13px] font-semibold">{row.desa}</span>
                    <span className="text-[#64748B] text-[11px] mt-1">{row.wilayah}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">{row.pemasukan}</td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">{row.pengeluaran}</td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">{row.saldo}</td>
                <td className="py-3.5 px-3">
                  <KelengkapanBadge value={row.kelengkapan} />
                </td>
                <td className="py-3.5 px-3">
                  <button
                    type="button"
                    className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap"
                  >
                    Lihat desa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[#64748B] text-[11px] mt-4">
        Saldo akhir = saldo awal + pemasukan − pengeluaran. Data yang belum dilengkapi tidak dianggap final.
      </p>
    </div>
  );
}
