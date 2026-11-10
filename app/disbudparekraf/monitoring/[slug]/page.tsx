import React from 'react';
import { notFound } from 'next/navigation';
import {
  getAvailablePeriods,
  getMonitoredVillages,
  getVillageFinance,
  periodeLabel,
  wilayahLabel,
} from '@/lib/services/financeService';
import VillageFinanceHeader from '@/components/disbudparekraf/monitoring/VillageFinanceHeader';
import VillageFinanceSummaryView from '@/components/disbudparekraf/monitoring/VillageFinanceSummaryView';

export const dynamic = 'force-dynamic';

/** Layar ringkasan keuangan satu desa (Figma 422:665). */
export default async function VillageFinancePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { periode?: string };
}) {
  const [data, periodeOptions, villages] = await Promise.all([
    getVillageFinance(params.slug, searchParams.periode),
    getAvailablePeriods(),
    getMonitoredVillages(),
  ]);

  if (!data) notFound();

  const { village } = data;
  const managerLabel = village.managerName
    ? `Pengelola: ${village.managerName}`
    : 'Belum ada pengelola terdaftar';

  const exportQuery = new URLSearchParams({
    scope: 'laporan',
    desa: village.slug,
    periode: data.periode,
  }).toString();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <VillageFinanceHeader
        slug={village.slug}
        shortName={village.shortName}
        wilayah={wilayahLabel(village.district, village.regency)}
        managerLabel={managerLabel}
        periode={data.periode}
        periodeOptions={periodeOptions}
        desaOptions={villages.map((v) => ({ slug: v.slug, name: v.shortName }))}
        diperbarui={data.diperbarui}
        activeTab="ringkasan"
        jumlahPemasukan={data.jumlahPemasukan}
        jumlahPengeluaran={data.jumlahPengeluaran}
        jumlahTransaksi={data.jumlahTransaksi}
        jumlahLengkap={data.jumlahTransaksi - data.jumlahTanpaBukti}
        backHref={`/disbudparekraf/monitoring?periode=${data.periode}`}
        backLabel="Kembali ke monitoring keuangan"
        unduhHref={`/disbudparekraf/monitoring/export?${exportQuery}`}
        unduhLabel="Unduh laporan desa"
      />

      <VillageFinanceSummaryView data={data} />

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>Periode {periodeLabel(data.periode)}</span>
      </div>
    </div>
  );
}
