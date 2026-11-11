'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Tahun anggaran yang tersedia di basis data demo (2023–2026). */
export const FISCAL_YEARS = [2026, 2025, 2024, 2023] as const;

export type FiscalYear = (typeof FISCAL_YEARS)[number];

export function normalizeFiscalYear(value: unknown): FiscalYear {
  const n = Number(value);
  return (FISCAL_YEARS as readonly number[]).includes(n) ? (n as FiscalYear) : 2026;
}

interface FiscalYearSelectProps {
  value: number;
  onChange: (year: FiscalYear) => void;
  /** Varian tampilan: pil ringkas (dashboard) atau tombol border (anggaran). */
  variant?: 'pill' | 'button';
  labelPrefix?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  /** Penuhi lebar kontainer (dipakai pada formulir ubah anggaran). */
  fullWidth?: boolean;
}

/**
 * Dropdown tahun anggaran yang benar-benar bisa diklik.
 *
 * Sebelumnya `TA 2026` pada dashboard pengelola hanya `<div>` statis sehingga
 * tahun tidak bisa diganti. Komponen ini menutup celah tersebut dan dipakai
 * bersama oleh dashboard, halaman anggaran, dan halaman pengeluaran agar
 * perilakunya konsisten (klik luar & Esc menutup menu, navigasi keyboard aktif).
 */
export default function FiscalYearSelect({
  value,
  onChange,
  variant = 'pill',
  labelPrefix = 'TA',
  disabled = false,
  align = 'right',
  fullWidth = false,
}: FiscalYearSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const displayLabel = labelPrefix ? `${labelPrefix} ${value}` : String(value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const triggerClass =
    variant === 'pill'
      ? 'bg-white border border-[#E6ECF5] rounded-full h-8 px-3 flex items-center gap-2 text-[#0D2453] text-[11px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
      : 'bg-white border-2 border-[#E6ECF5] rounded-full h-[40px] px-[14px] flex items-center gap-[8px] text-[#0D2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Pilih tahun anggaran, saat ini ${displayLabel}`}
        className={`${triggerClass} ${fullWidth ? 'w-full justify-between' : ''}`}
      >
        {variant === 'pill' && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#0D2453] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
        <span>{displayLabel}</span>
        {variant === 'button' && (
          <ChevronDown
            className={`w-[16px] h-[16px] text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Tahun anggaran"
          className={`absolute top-[calc(100%+8px)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${fullWidth ? 'left-0 right-0 w-full' : 'w-[130px]'} bg-white border border-[#E6ECF5] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100`}
        >
          {FISCAL_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              role="option"
              aria-selected={value === year}
              onClick={() => {
                onChange(year);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-[12px] hover:bg-slate-50 cursor-pointer ${
                value === year
                  ? 'font-semibold text-[#0D2453] bg-slate-50'
                  : 'text-[#64748B]'
              }`}
            >
              {labelPrefix ? `${labelPrefix} ${year}` : year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
