'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FinanceRecap } from '@/lib/finance';
import { formatRupiahCompact } from '@/lib/utils';
import KelengkapanBadge from '@/components/disbudparekraf/monitoring/KelengkapanBadge';

function wilayahShort(regency: string): string {
  return regency.replace(/^Kabupaten\s+/i, '');
}

/**
 * Rekap keuangan setiap desa (Figma 422:604).
 *
 * ponytail: cakupan desa = desa berakun pengelola (belasan baris), jadi filter dan
 * paginasi dikerjakan di server pada `getFinanceRecap`; di sini hanya menyusun URL.
 */
export default function VillageRecapTable({ recap }: { recap: FinanceRecap }) {
  const router = useRouter();
  const pathname = usePathname() || '/disbudparekraf/monitoring';
  const searchParams = useSearchParams();

  const pushWith = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (!('page' in patch)) params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const { totals } = recap;
  const foot = recap.filteredTotals;

  return (
    <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Rekap keuangan setiap desa
          </h2>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            {totals.lengkap} lengkap · {totals.perluBukti} perlu bukti · {totals.belumLapor} belum
            lapor
          </p>
        </div>

        <div className="relative">
          <select
            value={recap.active.kelengkapan}
            onChange={(e) =>
              pushWith({ kelengkapan: e.target.value === 'SEMUA' ? null : e.target.value })
            }
            className="h-[40px] pl-4 pr-9 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer"
          >
            <option value="SEMUA">Semua kelengkapan</option>
            <option value="LENGKAP">Lengkap</option>
            <option value="PERLU_BUKTI">Perlu bukti</option>
            <option value="BELUM_LAPOR">Belum lapor</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-x-auto mt-5">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-[#F7F9FC] text-[11px] font-medium text-[#64748B]">
              <th className="rounded-l-[6px] py-2 px-3 font-medium">Desa wisata</th>
              <th className="py-2 px-3 font-medium">Pemasukan</th>
              <th className="py-2 px-3 font-medium">Pengeluaran</th>
              <th className="py-2 px-3 font-medium">Saldo awal</th>
              <th className="py-2 px-3 font-medium">Saldo akhir</th>
              <th className="py-2 px-3 font-medium">Kelengkapan</th>
              <th className="rounded-r-[6px] py-2 px-3 font-medium">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {recap.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[12px] text-[#64748B]">
                  Tidak ada desa yang cocok dengan filter ini.
                </td>
              </tr>
            )}
            {recap.rows.map((row) => {
              const kosong = row.kelengkapan === 'BELUM_LAPOR';
              return (
                <tr key={row.villageId} className="border-b border-[#E6ECF5]">
                  <td className="py-3 px-3">
                    <p className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                      {row.shortName}
                    </p>
                    <p className="text-[#64748B] text-[11px] leading-[1.5]">
                      {wilayahShort(row.regency)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-[12px] text-[#0D2453]">
                    {kosong ? '—' : formatRupiahCompact(row.pemasukan)}
                  </td>
                  <td className="py-3 px-3 text-[12px] text-[#0D2453]">
                    {kosong ? '—' : formatRupiahCompact(row.pengeluaran)}
                  </td>
                  <td className="py-3 px-3 text-[12px] text-[#0D2453]">
                    {kosong || row.jumlahTransaksi === 0
                      ? '—'
                      : formatRupiahCompact(row.saldoAwal)}
                  </td>
                  <td className="py-3 px-3 text-[12px] text-[#0D2453]">
                    {kosong ? '—' : formatRupiahCompact(row.saldoAkhir)}
                  </td>
                  <td className="py-3 px-3">
                    <KelengkapanBadge value={row.kelengkapan} />
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/disbudparekraf/monitoring/${row.slug}?periode=${recap.active.periode}`}
                      className="inline-flex items-center justify-center h-[40px] px-4 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Lihat desa
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#EDF3FC] text-[#0D2453] text-[12px] font-semibold">
              <td className="py-3 px-3 rounded-l-[6px]">
                Total {foot.desaMelapor} desa melapor
              </td>
              <td className="py-3 px-3">{formatRupiahCompact(foot.pemasukan)}</td>
              <td className="py-3 px-3">{formatRupiahCompact(foot.pengeluaran)}</td>
              <td className="py-3 px-3">{formatRupiahCompact(foot.saldoAwal)}</td>
              <td className="py-3 px-3">{formatRupiahCompact(foot.saldoAkhir)}</td>
              <td className="py-3 px-3" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <p className="text-[#64748B] text-[11px]">
          Menampilkan {recap.total === 0 ? 0 : (recap.page - 1) * recap.perPage + 1}–
          {Math.min(recap.page * recap.perPage, recap.total)} dari {recap.total} desa
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#64748B]">
            Halaman {recap.page} dari {recap.totalPages}
          </span>
          <button
            type="button"
            disabled={recap.page <= 1}
            onClick={() => pushWith({ page: String(recap.page - 1) })}
            className="h-[40px] px-5 inline-flex items-center gap-1.5 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={recap.page >= recap.totalPages}
            onClick={() => pushWith({ page: String(recap.page + 1) })}
            className="h-[40px] px-5 inline-flex items-center gap-1.5 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Berikutnya
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[#64748B] text-[11px] mt-4">
        Saldo akhir = saldo awal + pemasukan − pengeluaran. Tanda &ldquo;—&rdquo; berarti desa belum
        melaporkan periode ini.
      </p>
    </div>
  );
}
