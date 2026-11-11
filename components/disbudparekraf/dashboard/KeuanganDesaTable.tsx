import React from 'react';
import Link from 'next/link';
import type { VillageFinanceRow } from '@/lib/finance';
import { periodeLabel } from '@/lib/finance';
import { formatRupiahCompact } from '@/lib/utils';
import KelengkapanBadge from '@/components/disbudparekraf/monitoring/KelengkapanBadge';

function wilayahShort(regency: string): string {
  return regency.replace(/^Kabupaten\s+/i, '');
}

/**
 * Tabel ringkasan keuangan per desa pada dashboard (Figma 422:1068).
 * Hanya desa yang sudah melapor yang ditampilkan, dibatasi beberapa baris
 * teratas; daftar lengkap ada di menu Monitoring keuangan.
 */
const DASHBOARD_ROW_LIMIT = 8;

export default function KeuanganDesaTable({
  rows,
  desaMelapor,
  desaTotal,
  periode,
}: {
  rows: VillageFinanceRow[];
  desaMelapor: number;
  desaTotal: number;
  periode: string;
}) {
  const visibleRows = rows.slice(0, DASHBOARD_ROW_LIMIT);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="w-full bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Keuangan desa wisata
          </h3>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            Ringkasan {desaMelapor} dari {desaTotal} desa · periode {periodeLabel(periode)}
          </p>
        </div>
        <Link
          href="/disbudparekraf/monitoring"
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors"
        >
          Lihat seluruh desa
        </Link>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[12px] text-[#64748B]">
                  Belum ada desa yang melaporkan periode ini.
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr key={row.villageId}>
                <td className="py-3.5 px-3">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[#0D2453] text-[13px] font-semibold">
                      {row.shortName}
                    </span>
                    <span className="text-[#64748B] text-[11px] mt-1">
                      {wilayahShort(row.regency)}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">
                  {formatRupiahCompact(row.pemasukan)}
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">
                  {formatRupiahCompact(row.pengeluaran)}
                </td>
                <td className="py-3.5 px-3 text-[#0D2453] text-[12px]">
                  {formatRupiahCompact(row.saldoAkhir)}
                </td>
                <td className="py-3.5 px-3">
                  <KelengkapanBadge value={row.kelengkapan} />
                </td>
                <td className="py-3.5 px-3">
                  <Link
                    href={`/disbudparekraf/monitoring/${row.slug}?periode=${periode}`}
                    className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors"
                  >
                    Lihat desa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[#64748B] text-[11px] mt-4">
        Saldo akhir = saldo awal + pemasukan − pengeluaran. Data yang belum dilengkapi tidak
        dianggap final.
        {hiddenCount > 0 && (
          <>
            {' '}
            Menampilkan {visibleRows.length} dari {rows.length} desa yang sudah melapor —{' '}
            <Link
              href={`/disbudparekraf/monitoring?periode=${periode}`}
              className="font-semibold text-[#0D2453] hover:underline"
            >
              lihat seluruhnya
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
