'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { TransactionListResult } from '@/lib/finance';
import { formatRupiah, formatRupiahCompact } from '@/lib/utils';
import { BuktiBadge } from '@/components/disbudparekraf/monitoring/KelengkapanBadge';

function tanggalPendek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Daftar transaksi pemasukan/pengeluaran beserta filter (Figma 422:726 / 422:787). */
export default function TransactionTable({
  data,
  activeQuery,
  activeKategori,
  activeBukti,
}: {
  data: TransactionListResult;
  activeQuery: string;
  activeKategori: string;
  activeBukti: 'SEMUA' | 'LENGKAP' | 'PERLU_BUKTI';
}) {
  const router = useRouter();
  const pathname = usePathname() || '/disbudparekraf/monitoring';
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(activeQuery);

  const pemasukan = data.type === 'PEMASUKAN';
  const namaJenis = pemasukan ? 'pemasukan' : 'pengeluaran';

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

  // Pencarian ditunda 300 ms agar tidak memicu navigasi per ketikan.
  useEffect(() => {
    if (query === activeQuery) return;
    const timer = setTimeout(() => pushWith({ q: query || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const tanpaBukti = data.rows.filter((row) => !row.hasProof);
  const lengkapCount = data.total - data.jumlahTanpaBukti;

  return (
    <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
          Daftar {namaJenis}
        </h2>
        <p className="text-[#64748B] text-[12px] leading-[1.5]">
          Nilai berdasarkan tanggal transaksi, bukan tanggal unggah bukti.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama transaksi atau nomor referensi"
            className="w-full h-[40px] pl-9 pr-3 rounded-[8px] border border-[#E6ECF5] bg-white text-[12px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none focus:border-[#0D2453] transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={activeKategori}
            onChange={(e) => pushWith({ kategori: e.target.value || null })}
            className="h-[40px] pl-4 pr-9 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer max-w-[220px]"
          >
            <option value="">Semua kategori</option>
            {data.categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={activeBukti}
            onChange={(e) =>
              pushWith({ bukti: e.target.value === 'SEMUA' ? null : e.target.value })
            }
            className="h-[40px] pl-4 pr-9 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer"
          >
            <option value="SEMUA">Semua bukti</option>
            <option value="LENGKAP">Lengkap</option>
            <option value="PERLU_BUKTI">Perlu bukti</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="bg-[#F7F9FC] text-[11px] font-medium text-[#64748B]">
              <th className="rounded-l-[6px] py-2 px-3 font-medium w-[14%]">Tanggal</th>
              <th className="py-2 px-3 font-medium w-[14%]">Kategori</th>
              <th className="py-2 px-3 font-medium">Transaksi</th>
              <th className="py-2 px-3 font-medium w-[14%]">Nominal</th>
              <th className="py-2 px-3 font-medium w-[12%]">Bukti</th>
              <th className="rounded-r-[6px] py-2 px-3 font-medium w-[14%]">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-[#64748B]"
                >
                  Tidak ada transaksi yang cocok dengan filter ini.
                </td>
              </tr>
            )}
            {data.rows.map((row) => (
              <tr key={row.id} className="border-b border-[#E6ECF5] last:border-b-0">
                <td className="py-3 px-3 text-[12px] text-[#64748B] whitespace-nowrap">
                  {tanggalPendek(row.transactionDate)}
                </td>
                <td className="py-3 px-3 text-[12px] text-[#64748B]">{row.category}</td>
                <td className="py-3 px-3">
                  <p className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                    {row.title}
                  </p>
                  <p className="text-[#64748B] text-[11px] leading-[1.5]">{row.referenceCode}</p>
                </td>
                <td className="py-3 px-3 text-[12px] text-[#0D2453] whitespace-nowrap">
                  {formatRupiah(row.amount)}
                </td>
                <td className="py-3 px-3">
                  <BuktiBadge hasProof={row.hasProof} />
                </td>
                <td className="py-3 px-3">
                  <Link
                    href={`/disbudparekraf/monitoring/${data.village.slug}/${namaJenis}/${row.referenceCode}?periode=${data.periode}`}
                    className="inline-flex items-center justify-center h-[40px] px-4 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Lihat detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#EDF3FC] text-[#0D2453] text-[12px] font-semibold">
              <td className="py-3 px-3 rounded-l-[6px]" colSpan={3}>
                Total {data.total} transaksi {namaJenis}
              </td>
              <td className="py-3 px-3 whitespace-nowrap">{formatRupiah(data.totalAmount)}</td>
              <td className="py-3 px-3 rounded-r-[6px]" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <p className="text-[#64748B] text-[11px]">
          Menampilkan {data.from}–{data.to} dari {data.total} transaksi
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#64748B]">
            Halaman {data.page} dari {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => pushWith({ page: String(data.page - 1) })}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#E6ECF5] text-[#0D2453] disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={data.page >= data.totalPages}
            onClick={() => pushWith({ page: String(data.page + 1) })}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#E6ECF5] text-[#0D2453] disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {tanpaBukti.length > 0 ? (
        <div className="mt-4 rounded-[12px] bg-[#FCF1DC] px-4 py-3 flex flex-col gap-1">
          <p className="text-[#875B12] text-[13px] font-semibold">
            {data.jumlahTanpaBukti} transaksi {namaJenis} memerlukan bukti
          </p>
          <p className="text-[#875B12] text-[12px]">
            {tanpaBukti
              .slice(0, 3)
              .map((t) => `${t.referenceCode} · ${t.title} · ${formatRupiahCompact(t.amount)}`)
              .join('  |  ')}{' '}
            Hubungi pengelola untuk melengkapi dokumen.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-[12px] bg-[#F7F9FC] border border-[#E6ECF5] px-4 py-3 flex flex-col gap-1">
          <p className="text-[#0D2453] text-[13px] font-semibold">
            {pemasukan
              ? 'Pemasukan tercatat berbeda dari saldo akhir'
              : `${lengkapCount} transaksi pengeluaran berlengkap bukti`}
          </p>
          <p className="text-[#64748B] text-[12px]">
            {pemasukan
              ? 'Saldo akhir dihitung dari saldo awal + pemasukan − pengeluaran. Bukti dapat ditinjau melalui detail transaksi.'
              : 'Seluruh transaksi periode ini memiliki bukti dokumen yang tercatat.'}
          </p>
        </div>
      )}
    </div>
  );
}
