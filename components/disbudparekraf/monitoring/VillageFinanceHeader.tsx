'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { periodeLabel } from '@/lib/finance';

type Tab = 'ringkasan' | 'pemasukan' | 'pengeluaran';

interface VillageFinanceHeaderProps {
  slug: string;
  shortName: string;
  wilayah: string;
  managerLabel: string;
  periode: string;
  periodeOptions: string[];
  desaOptions: { slug: string; name: string }[];
  diperbarui: string | null;
  activeTab: Tab;
  jumlahPemasukan: number;
  jumlahPengeluaran: number;
  jumlahTransaksi: number;
  jumlahLengkap: number;
  backHref: string;
  backLabel: string;
  unduhHref: string;
  unduhLabel: string;
}

const TAB_LABEL: Record<Tab, string> = {
  ringkasan: 'Ringkasan',
  pemasukan: 'Pemasukan',
  pengeluaran: 'Pengeluaran',
};

/** Kepala layar keuangan desa: identitas, pemilih desa/periode, dan tab (Figma 422:665/726/787). */
export default function VillageFinanceHeader({
  slug,
  shortName,
  wilayah,
  managerLabel,
  periode,
  periodeOptions,
  desaOptions,
  diperbarui,
  activeTab,
  jumlahPemasukan,
  jumlahPengeluaran,
  jumlahTransaksi,
  jumlahLengkap,
  backHref,
  backLabel,
  unduhHref,
  unduhLabel,
}: VillageFinanceHeaderProps) {
  const router = useRouter();

  const tabHref = (tab: Tab) => {
    const base = `/disbudparekraf/monitoring/${slug}`;
    const path = tab === 'ringkasan' ? base : `${base}/${tab}`;
    return `${path}?periode=${periode}`;
  };

  const tabCount = (tab: Tab) =>
    tab === 'pemasukan' ? jumlahPemasukan : tab === 'pengeluaran' ? jumlahPengeluaran : null;

  const judul =
    activeTab === 'ringkasan'
      ? `Keuangan Desa ${shortName}`
      : activeTab === 'pemasukan'
        ? `Pemasukan Desa ${shortName}`
        : `Pengeluaran Desa ${shortName}`;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0D2453] hover:underline w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
            {judul}
          </h1>
          <p className="text-[#64748B] text-[13px] leading-[1.5]">
            {wilayah} · {managerLabel}
          </p>
        </div>
        <a
          href={unduhHref}
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors"
        >
          {unduhLabel}
        </a>
      </div>

      {/* Pemilih desa + periode */}
      <div className="bg-white border border-[#E6ECF5] rounded-[14px] px-5 py-3 shadow-xs flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={slug}
              onChange={(e) =>
                router.push(`/disbudparekraf/monitoring/${e.target.value}?periode=${periode}`)
              }
              className="h-[40px] pl-4 pr-9 rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-medium text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer"
            >
              {desaOptions.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={periode}
              onChange={(e) => {
                const base = `/disbudparekraf/monitoring/${slug}`;
                const path =
                  activeTab === 'ringkasan' ? base : `${base}/${activeTab}`;
                router.push(`${path}?periode=${e.target.value}`);
              }}
              className="h-[40px] pl-4 pr-9 rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-medium text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer"
            >
              {periodeOptions.map((p) => (
                <option key={p} value={p}>
                  {periodeLabel(p)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="lg:ml-auto text-[11px] text-[#64748B]">
          {diperbarui ? `Diperbarui ${diperbarui}` : 'Belum ada transaksi'} ·{' '}
          <span className="text-[#64748B]">Akses baca saja</span>
        </span>
      </div>

      {/* Tab ringkasan / pemasukan / pengeluaran */}
      <div className="bg-white border border-[#E6ECF5] rounded-[14px] px-4 py-[11px] shadow-xs flex flex-wrap items-center gap-3">
        {(Object.keys(TAB_LABEL) as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const count = tabCount(tab);
          return (
            <Link
              key={tab}
              href={tabHref(tab)}
              className={`h-[40px] px-5 inline-flex items-center rounded-[999px] text-[12px] font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#0D2453] text-white'
                  : 'bg-white text-[#0D2453] border-2 border-[#E6ECF5] hover:bg-slate-50'
              }`}
            >
              {TAB_LABEL[tab]}
              {count !== null ? ` ${count}` : ''}
            </Link>
          );
        })}

        <span className="lg:ml-auto text-[11px] text-[#64748B]">
          {activeTab === 'ringkasan'
            ? `${jumlahTransaksi} transaksi · bukti lengkap ${jumlahLengkap}/${jumlahTransaksi}`
            : `Periode: ${periodeLabel(periode)}`}
        </span>
      </div>
    </div>
  );
}
