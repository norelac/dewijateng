import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getTransaction,
  periodeLabel,
  tanggalPanjang,
  type TransactionType,
} from '@/lib/services/financeService';
import TransactionDetailView from '@/components/disbudparekraf/monitoring/TransactionDetailView';
import { ChevronLeft } from 'lucide-react';

/** Layar detail transaksi (Figma 422:848 pemasukan, 422:909 pengeluaran). */
export default async function TransactionDetailScreen({
  slug,
  type,
  referenceCode,
  periode,
}: {
  slug: string;
  type: TransactionType;
  referenceCode: string;
  periode?: string;
}) {
  const tx = await getTransaction(slug, referenceCode);
  if (!tx || tx.type !== type) notFound();

  const pemasukan = type === 'PEMASUKAN';
  const jenis = pemasukan ? 'pemasukan' : 'pengeluaran';
  const daftarHref = `/disbudparekraf/monitoring/${slug}/${jenis}${
    periode ? `?periode=${periode}` : ''
  }`;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <Link
        href={daftarHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0D2453] hover:underline w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Kembali ke daftar {jenis}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Detail {jenis} desa
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          {tx.village.shortName} · {tx.referenceCode} · {tanggalPanjang(tx.transactionDate)}
        </p>
      </div>

      <TransactionDetailView tx={tx} />

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>Periode {periodeLabel(tx.transactionDate.slice(0, 7))}</span>
      </div>
    </div>
  );
}
