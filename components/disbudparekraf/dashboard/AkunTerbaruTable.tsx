import React from 'react';
import Link from 'next/link';
import type { VillageAccountRow } from '@/app/actions/villageAccountActions';

function StatusBadge({ status }: { status: VillageAccountRow['status'] }) {
  const aktif = status === 'AKTIF';
  const menunggu = status === 'MENUNGGU_AKTIVASI';
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[999px] px-2.5 text-[11px] font-medium whitespace-nowrap ${
        aktif
          ? 'bg-[#E5F4ED] text-[#216B55]'
          : menunggu
          ? 'bg-[#FCF1DC] text-[#875B12]'
          : 'bg-[#EEF2F7] text-[#64748B]'
      }`}
    >
      {aktif ? 'Aktif' : menunggu ? 'Menunggu aktivasi' : 'Nonaktif'}
    </span>
  );
}

/** Tabel akun desa wisata terbaru (Figma 418:1070). Data dari database. */
export default function AkunTerbaruTable({ rows }: { rows: VillageAccountRow[] }) {
  const menunggu = rows.filter((r) => r.status === 'MENUNGGU_AKTIVASI').length;

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
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 px-3 text-center text-[12px] text-[#64748B]">
                  Belum ada akun pengelola desa wisata.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.userId}>
                <td className="py-3.5 px-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[#0D2453] text-[13px] font-semibold">{row.villageName}</span>
                    <span className="text-[#64748B] text-[11px] mt-1">
                      {row.district}, {row.regency}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">{row.fullName}</td>
                <td className="py-3.5 px-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-3.5 px-3">
                  <Link
                    href={`/disbudparekraf/akun/${row.userId}`}
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

      <p className="text-[#64748B] text-[11px] mt-4">
        {rows.length} akun terbaru · {menunggu} akun menunggu aktivasi
      </p>
    </div>
  );
}
