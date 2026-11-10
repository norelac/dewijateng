import React from 'react';
import { KELENGKAPAN_LABEL, type Kelengkapan } from '@/lib/finance';

const BADGE: Record<Kelengkapan, string> = {
  LENGKAP: 'bg-[#E5F4ED] text-[#216B55]',
  PERLU_BUKTI: 'bg-[#FCF1DC] text-[#875B12]',
  BELUM_LAPOR: 'bg-[#EDF3FC] text-[#64748B]',
};

/** Lencana kelengkapan bukti transaksi: Lengkap / Perlu bukti / Belum lapor. */
export default function KelengkapanBadge({
  value,
  label,
}: {
  value: Kelengkapan;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[999px] px-2.5 text-[11px] font-medium whitespace-nowrap ${BADGE[value]}`}
    >
      {label ?? KELENGKAPAN_LABEL[value]}
    </span>
  );
}

/** Lencana status bukti per transaksi (hanya dua nilai). */
export function BuktiBadge({ hasProof }: { hasProof: boolean }) {
  return (
    <span
      className={`inline-flex h-[26px] items-center rounded-[999px] px-2.5 text-[11px] font-medium whitespace-nowrap ${
        hasProof ? 'bg-[#E5F4ED] text-[#216B55]' : 'bg-[#FCF1DC] text-[#875B12]'
      }`}
    >
      {hasProof ? 'Lengkap' : 'Perlu bukti'}
    </span>
  );
}
