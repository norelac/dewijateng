import React from 'react';
import Link from 'next/link';
import { AKUN_TERBARU } from '@/components/disbudparekraf/dashboard/demoData';

function StatusBadge({ status }: { status: 'Aktif' | 'Menunggu aktivasi' }) {
  const aktif = status === 'Aktif';
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[999px] px-2.5 text-[11px] font-medium whitespace-nowrap ${
        aktif ? 'bg-[#E5F4ED] text-[#216B55]' : 'bg-[#FCF1DC] text-[#875B12]'
      }`}
    >
      {status}
    </span>
  );
}

/** Tabel akun desa wisata terbaru (Figma 418:1070). */
export default function AkunTerbaruTable() {
  return (
    <div className="w-full bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Akun desa wisata terbaru</h3>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">Pantau aktivasi akun yang baru dibuat oleh dinas.</p>
        </div>
        <Link
          href="/disbudparekraf/akun"
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap"
        >
          Lihat semua akun
        </Link>
      </div>

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#F7F9FC] text-[11px] font-medium text-[#64748B]">
              <th className="py-2.5 px-3 font-medium rounded-l-[6px]">Desa wisata</th>
              <th className="py-2.5 px-3 font-medium">Pengelola</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
              <th className="py-2.5 px-3 font-medium rounded-r-[6px]">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF5]">
            {AKUN_TERBARU.map((row) => (
              <tr key={row.desa}>
                <td className="py-3.5 px-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[#0D2453] text-[13px] font-semibold">{row.desa}</span>
                    <span className="text-[#64748B] text-[11px] mt-1">{row.wilayah}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">{row.pengelola}</td>
                <td className="py-3.5 px-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-3.5 px-3">
                  <Link
                    href="/disbudparekraf/akun"
                    className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap"
                  >
                    Detail akun
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[#64748B] text-[11px] mt-4">4 akun terbaru · 1 akun menunggu aktivasi</p>
    </div>
  );
}
