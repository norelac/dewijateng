'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type {
  VillageAccountListResult,
  VillageAccountStatus,
} from '@/app/actions/villageAccountActions';

const STATUS_BADGE: Record<VillageAccountStatus, string> = {
  AKTIF: 'bg-[#E5F4ED] text-[#216B55]',
  MENUNGGU_AKTIVASI: 'bg-[#FFF4DB] text-[#875B12]',
  NONAKTIF: 'bg-[#EDF3FC] text-[#0D2453]',
};

const TABS: { key: VillageAccountStatus | 'SEMUA'; label: string }[] = [
  { key: 'SEMUA', label: 'Semua akun' },
  { key: 'AKTIF', label: 'Aktif' },
  { key: 'MENUNGGU_AKTIVASI', label: 'Menunggu aktivasi' },
  { key: 'NONAKTIF', label: 'Nonaktif' },
];

/** "Borobudur, Magelang" — kecamatan tanpa awalan "Kecamatan". */
function wilayah(district: string, regency: string) {
  const d = district.replace(/^Kecamatan\s+/i, '');
  const r = regency.replace(/^(Kabupaten|Kota)\s+/i, '');
  return `${d}, ${r}`;
}

interface VillageAccountTableProps {
  data: VillageAccountListResult;
  activeStatus: VillageAccountStatus | 'SEMUA';
  activeQuery: string;
  activeKabupaten: string;
}

export default function VillageAccountTable({
  data,
  activeStatus,
  activeQuery,
  activeKabupaten,
}: VillageAccountTableProps) {
  const router = useRouter();
  const pathname = usePathname() || '/disbudparekraf/akun';
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(activeQuery);

  const pushWith = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    // Setiap perubahan filter kembali ke halaman pertama.
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

  const from = data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1;
  const to = Math.min(data.page * data.perPage, data.total);

  return (
    <>
      {/* Filter status akun */}
      <div className="bg-white rounded-[14px] shadow-[0px_2px_2.5px_rgba(0,0,0,0.10),0px_9px_4.5px_rgba(0,0,0,0.09),0px_21px_6px_rgba(0,0,0,0.05)] px-4 py-[11px] flex flex-wrap items-center gap-3">
        {TABS.map((tab) => {
          const active = activeStatus === tab.key;
          const count = data.counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => pushWith({ status: tab.key === 'SEMUA' ? null : tab.key })}
              className={`h-[40px] px-4 rounded-[999px] text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0D2453] text-white'
                  : 'bg-white text-[#0D2453] border-2 border-[#E6ECF5] hover:bg-slate-50'
              }`}
            >
              {tab.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Daftar akun desa wisata */}
      <div className="bg-white rounded-[14px] shadow-[0px_2px_2.5px_rgba(0,0,0,0.10),0px_9px_4.5px_rgba(0,0,0,0.09),0px_21px_6px_rgba(0,0,0,0.05)] p-6">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Seluruh akun desa wisata
          </h2>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            Kelola identitas, status akses, dan undangan pengelola.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama desa, pengelola, atau email"
              className="w-full h-[40px] pl-9 pr-3 rounded-[8px] border border-[#E6ECF5] bg-white text-[12px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none focus:border-[#0D2453] transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={activeStatus}
              onChange={(e) =>
                pushWith({ status: e.target.value === 'SEMUA' ? null : e.target.value })
              }
              className="h-[40px] pl-4 pr-9 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer"
            >
              <option value="SEMUA">Semua status</option>
              <option value="AKTIF">Aktif</option>
              <option value="MENUNGGU_AKTIVASI">Menunggu aktivasi</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={activeKabupaten}
              onChange={(e) => pushWith({ kabupaten: e.target.value || null })}
              className="h-[40px] pl-4 pr-9 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer max-w-[240px]"
            >
              <option value="">Kabupaten / kota</option>
              {data.kabupatenOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-[#F7F9FC] text-[11px] font-medium text-[#64748B]">
                <th className="rounded-l-[6px] py-2 px-3 font-medium w-[23%]">Desa wisata</th>
                <th className="py-2 px-3 font-medium w-[20%]">Pengelola</th>
                <th className="py-2 px-3 font-medium w-[25%]">Email akun</th>
                <th className="py-2 px-3 font-medium w-[14%]">Status</th>
                <th className="rounded-r-[6px] py-2 px-3 font-medium w-[18%]">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[12px] text-[#64748B]">
                    Tidak ada akun yang cocok dengan filter ini.
                  </td>
                </tr>
              )}
              {data.rows.map((row) => (
                <tr key={row.userId} className="border-b border-[#E6ECF5] last:border-b-0">
                  <td className="py-3 px-3">
                    <p className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                      {row.villageName.replace(/^Desa Wisata\s+/i, '')}
                    </p>
                    <p className="text-[#64748B] text-[11px] leading-[1.5]">
                      {wilayah(row.district, row.regency)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-[12px] text-[#0D2453]">{row.fullName}</td>
                  <td className="py-3 px-3 text-[11px] text-[#64748B] break-all">
                    {row.email || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center h-[26px] px-2.5 rounded-[999px] text-[11px] font-medium whitespace-nowrap ${STATUS_BADGE[row.status]}`}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/disbudparekraf/akun/${row.userId}`}
                      className="inline-flex items-center justify-center h-[40px] px-4 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Detail akun
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <p className="text-[#64748B] text-[11px]">
            Menampilkan {from}–{to} dari {data.total} desa wisata
          </p>
          {data.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => pushWith({ page: String(data.page - 1) })}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#E6ECF5] text-[#0D2453] disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-[#64748B]">
                {data.page} / {data.totalPages}
              </span>
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
          )}
        </div>
      </div>
    </>
  );
}
