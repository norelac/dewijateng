'use client';

import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { periodeLabel } from '@/lib/finance';

interface MonitoringFilterBarProps {
  periode: string;
  wilayah: string;
  desa: string;
  periodeOptions: string[];
  wilayahOptions: string[];
  desaOptions: { slug: string; name: string }[];
}

const SELECT_CLASS =
  'w-full h-[44px] pl-4 pr-9 rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-medium text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] cursor-pointer';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
      <span className="text-[11px] text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

/** Filter rekap keuangan: periode, wilayah, desa + tombol Terapkan (Figma 422:604). */
export default function MonitoringFilterBar({
  periode,
  wilayah,
  desa,
  periodeOptions,
  wilayahOptions,
  desaOptions,
}: MonitoringFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname() || '/disbudparekraf/monitoring';
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ periode, wilayah, desa });

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    const next: Record<string, string> = {
      periode: form.periode,
      wilayah: form.wilayah,
      desa: form.desa,
    };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Filter berubah -> kembali ke halaman pertama.
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="bg-white border border-[#E6ECF5] rounded-[14px] px-5 py-4 shadow-xs flex flex-col lg:flex-row lg:items-end gap-4">
      <Field label="Periode">
        <Select
          value={form.periode}
          onChange={(value) => setForm({ ...form, periode: value })}
        >
          {periodeOptions.map((p) => (
            <option key={p} value={p}>
              {periodeLabel(p)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Wilayah">
        <Select value={form.wilayah} onChange={(value) => setForm({ ...form, wilayah: value })}>
          <option value="">Semua kabupaten / kota</option>
          {wilayahOptions.map((w) => (
            <option key={w} value={w}>
              {w.replace(/^Kabupaten\s+/i, '')}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Desa wisata">
        <Select value={form.desa} onChange={(value) => setForm({ ...form, desa: value })}>
          <option value="">Semua desa</option>
          {desaOptions.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.name}
            </option>
          ))}
        </Select>
      </Field>

      <button
        type="button"
        onClick={apply}
        className="h-[44px] px-8 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#163B80] transition-colors whitespace-nowrap cursor-pointer"
      >
        Terapkan
      </button>
    </div>
  );
}
