import React from 'react';
import { getAvailablePeriods, getFinanceRecap, periodeLabel, type Kelengkapan } from '@/lib/services/financeService';
import { formatRupiahShort } from '@/lib/utils';
import MonitoringFilterBar from '@/components/disbudparekraf/monitoring/MonitoringFilterBar';
import FinanceSummaryCards from '@/components/disbudparekraf/monitoring/FinanceSummaryCards';
import VillageRecapTable from '@/components/disbudparekraf/monitoring/VillageRecapTable';

export const metadata = {
  title: 'Monitoring keuangan',
};

// Rekap dibaca langsung dari database setiap permintaan.
export const dynamic = 'force-dynamic';

const VALID_KELENGKAPAN: (Kelengkapan | 'SEMUA')[] = [
  'SEMUA',
  'LENGKAP',
  'PERLU_BUKTI',
  'BELUM_LAPOR',
];

/** Layar "Monitoring keuangan desa" (Figma 422:604). */
export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: { periode?: string; wilayah?: string; desa?: string; kelengkapan?: string; page?: string };
}) {
  const rawKelengkapan = (searchParams.kelengkapan || 'SEMUA').toUpperCase();
  const kelengkapan = VALID_KELENGKAPAN.includes(rawKelengkapan as Kelengkapan | 'SEMUA')
    ? (rawKelengkapan as Kelengkapan | 'SEMUA')
    : 'SEMUA';

  const [periodeOptions, recap] = await Promise.all([
    getAvailablePeriods(),
    getFinanceRecap({
      periode: searchParams.periode,
      wilayah: searchParams.wilayah,
      desa: searchParams.desa,
      kelengkapan,
      page: Number.parseInt(searchParams.page || '1', 10) || 1,
    }),
  ]);

  const { totals } = recap;
  const rasioPengeluaran =
    totals.pemasukan > 0 ? Math.round((totals.pengeluaran / totals.pemasukan) * 100) : 0;

  const cards = [
    {
      label: 'Pemasukan tercatat',
      value: formatRupiahShort(totals.pemasukan),
      note: `${totals.desaMelapor} dari ${totals.desaTotal} desa melaporkan`,
      variant: 'navy' as const,
    },
    {
      label: 'Pengeluaran tercatat',
      value: formatRupiahShort(totals.pengeluaran),
      note: `${rasioPengeluaran}% dari pemasukan`,
      variant: 'white' as const,
    },
    {
      label: 'Surplus periode',
      value: formatRupiahShort(totals.surplus),
      note: 'Pemasukan − pengeluaran',
      variant: 'white' as const,
    },
    {
      label: 'Saldo akhir tercatat',
      value: formatRupiahShort(totals.saldoAkhir),
      note: `Saldo awal: ${formatRupiahShort(totals.saldoAwal)}`,
      variant: 'white' as const,
    },
  ];

  const periode = periodeLabel(recap.active.periode);
  const exportQuery = new URLSearchParams({
    scope: 'rekap',
    periode: recap.active.periode,
    ...(recap.active.wilayah ? { wilayah: recap.active.wilayah } : {}),
    ...(recap.active.desa ? { desa: recap.active.desa } : {}),
    ...(recap.active.kelengkapan !== 'SEMUA' ? { kelengkapan: recap.active.kelengkapan } : {}),
  }).toString();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
            Monitoring keuangan desa
          </h1>
          <p className="text-[#64748B] text-[13px] leading-[1.5]">
            Bandingkan pemasukan, pengeluaran, dan saldo setiap desa wisata.
          </p>
        </div>
        <a
          href={`/disbudparekraf/monitoring/export?${exportQuery}`}
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[#0D2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors"
        >
          Unduh rekap
        </a>
      </div>

      <MonitoringFilterBar
        periode={recap.active.periode}
        wilayah={recap.active.wilayah}
        desa={recap.active.desa}
        periodeOptions={periodeOptions}
        wilayahOptions={recap.wilayahOptions}
        desaOptions={recap.desaOptions}
      />

      <FinanceSummaryCards cards={cards} compact />
      <VillageRecapTable recap={recap} />

      <div className="bg-[#EDF3FC] rounded-[14px] px-6 py-[18px] flex flex-col gap-2">
        <p className="text-[#0D2453] text-[14px] font-semibold leading-[1.5]">
          Data untuk pemantauan, bukan perubahan transaksi
        </p>
        <p className="text-[#64748B] text-[13px] leading-[1.5] max-w-[1000px]">
          Dinas dapat meninjau dan mengunduh laporan. Pencatatan dan perbaikan data dilakukan oleh
          pengelola desa. Tanda &ldquo;—&rdquo; berarti belum dilaporkan, bukan nol.
        </p>
      </div>

      {totals.belumLapor > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E6ECF5] rounded-[14px] px-6 py-[18px]">
            <p className="text-[#0D2453] text-[13px] font-semibold">
              {totals.belumLapor} desa belum melaporkan periode ini
            </p>
            <p className="text-[#64748B] text-[12px] mt-1">
              Hubungi pengelola untuk melengkapi laporan {periode}.
            </p>
          </div>
          <div className="bg-white border border-[#E6ECF5] rounded-[14px] px-6 py-[18px]">
            <p className="text-[#0D2453] text-[13px] font-semibold">
              {totals.perluBukti} desa perlu melengkapi bukti transaksi
            </p>
            <p className="text-[#64748B] text-[12px] mt-1">
              Buka rincian desa untuk meninjau kelengkapan bukti.
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>{periode} · Satuan M = miliar; jt = juta</span>
      </div>
    </div>
  );
}
