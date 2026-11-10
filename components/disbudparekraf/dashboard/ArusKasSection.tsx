import React from 'react';
import Link from 'next/link';
import CashflowChart from '@/components/disbudparekraf/monitoring/CashflowChart';
import { periodeLabel, type CashflowBucket } from '@/lib/finance';

/**
 * Grafik arus kas seluruh desa + kartu tindak lanjut keuangan
 * (Figma 422:1026-422:1066). Angka dibaca dari database.
 */
export default function ArusKasSection({
  cashflow,
  periode,
  belumLapor,
  perluBukti,
  perluBuktiDesa,
}: {
  cashflow: CashflowBucket[];
  periode: string;
  belumLapor: number;
  perluBukti: number;
  perluBuktiDesa: string | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <CashflowChart
        className="lg:col-span-7"
        title="Arus kas seluruh desa"
        subtitle={`${periodeLabel(periode)} · dalam juta rupiah`}
        buckets={cashflow}
      />

      <div className="lg:col-span-5 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col">
        <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
          Tindak lanjut keuangan
        </h3>

        <div className="flex flex-col gap-1 mt-4">
          <span className="text-[#0D2453] text-[13px] font-semibold">
            {belumLapor} desa belum mengirim laporan
          </span>
          <span className="text-[#64748B] text-[12px]">
            Data belum masuk untuk periode {periodeLabel(periode)}.
          </span>
        </div>

        <div className="h-px w-full bg-[#E6ECF5] my-4" />

        <div className="flex flex-col gap-1">
          <span className="text-[#0D2453] text-[13px] font-semibold">
            {perluBukti} desa perlu melengkapi bukti
          </span>
          <span className="text-[#64748B] text-[12px]">
            {perluBuktiDesa
              ? `Termasuk transaksi di Desa ${perluBuktiDesa}.`
              : 'Seluruh transaksi desa pelapor sudah berlengkap bukti.'}
          </span>
        </div>

        <Link
          href="/disbudparekraf/monitoring"
          className="mt-auto h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold self-start hover:bg-[#163B80] transition-colors"
        >
          Lihat monitoring
        </Link>
      </div>
    </div>
  );
}
