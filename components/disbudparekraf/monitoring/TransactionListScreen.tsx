import React from 'react';
import { notFound } from 'next/navigation';
import {
  getAvailablePeriods,
  getMonitoredVillages,
  getVillageFinance,
  listTransactions,
  periodeLabel,
  wilayahLabel,
  type TransactionType,
} from '@/lib/services/financeService';
import { formatRupiahShort } from '@/lib/utils';
import VillageFinanceHeader from '@/components/disbudparekraf/monitoring/VillageFinanceHeader';
import FinanceSummaryCards from '@/components/disbudparekraf/monitoring/FinanceSummaryCards';
import TransactionTable from '@/components/disbudparekraf/monitoring/TransactionTable';

const JENIS: Record<TransactionType, { path: string; nama: string }> = {
  PEMASUKAN: { path: 'pemasukan', nama: 'pemasukan' },
  PENGELUARAN: { path: 'pengeluaran', nama: 'pengeluaran' },
};

export interface TransactionListSearchParams {
  periode?: string;
  q?: string;
  kategori?: string;
  bukti?: string;
  page?: string;
}

/**
 * Layar daftar transaksi pemasukan/pengeluaran desa.
 * Dipakai oleh Figma 422:726 (pemasukan) dan 422:787 (pengeluaran).
 */
export default async function TransactionListScreen({
  slug,
  type,
  searchParams,
}: {
  slug: string;
  type: TransactionType;
  searchParams: TransactionListSearchParams;
}) {
  const bukti =
    searchParams.bukti === 'LENGKAP' || searchParams.bukti === 'PERLU_BUKTI'
      ? searchParams.bukti
      : 'SEMUA';

  const [data, periodeOptions, villages, summary] = await Promise.all([
    listTransactions({
      slug,
      type,
      periode: searchParams.periode,
      q: searchParams.q,
      kategori: searchParams.kategori,
      bukti,
      page: Number.parseInt(searchParams.page || '1', 10) || 1,
    }),
    getAvailablePeriods(),
    getMonitoredVillages(),
    getVillageFinance(slug, searchParams.periode),
  ]);

  if (!data) notFound();

  const { village } = data;
  const pemasukan = type === 'PEMASUKAN';
  const jenis = JENIS[type];
  const lengkap = data.total - data.jumlahTanpaBukti;

  const cards = [
    {
      label: pemasukan ? 'Total pemasukan' : 'Total pengeluaran',
      value: formatRupiahShort(data.totalAmount),
      note: 'Seluruh transaksi periode ini',
      variant: 'navy' as const,
    },
    {
      label: 'Jumlah transaksi',
      value: `${data.total} transaksi`,
      note: 'Urutan terbaru ke terlama',
      variant: 'white' as const,
    },
    {
      label: 'Bukti transaksi',
      value: `${lengkap} dari ${data.total} lengkap`,
      note:
        data.jumlahTanpaBukti > 0
          ? `${data.jumlahTanpaBukti} transaksi perlu dilengkapi bukti`
          : 'Semua bukti tersedia',
      variant: data.jumlahTanpaBukti > 0 ? ('amber' as const) : ('white' as const),
    },
  ];

  const exportQuery = new URLSearchParams({
    scope: jenis.path,
    desa: village.slug,
    periode: data.periode,
  }).toString();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <VillageFinanceHeader
        slug={village.slug}
        shortName={village.shortName}
        wilayah={wilayahLabel(village.district, village.regency)}
        managerLabel="Dicatat oleh pengelola desa"
        periode={data.periode}
        periodeOptions={periodeOptions}
        desaOptions={villages.map((v) => ({ slug: v.slug, name: v.shortName }))}
        diperbarui={summary?.diperbarui ?? null}
        activeTab={jenis.path === 'pemasukan' ? 'pemasukan' : 'pengeluaran'}
        jumlahPemasukan={summary?.jumlahPemasukan ?? 0}
        jumlahPengeluaran={summary?.jumlahPengeluaran ?? 0}
        jumlahTransaksi={summary?.jumlahTransaksi ?? data.total}
        jumlahLengkap={
          summary ? summary.jumlahTransaksi - summary.jumlahTanpaBukti : lengkap
        }
        backHref={`/disbudparekraf/monitoring?periode=${data.periode}`}
        backLabel="Kembali ke monitoring keuangan"
        unduhHref={`/disbudparekraf/monitoring/export?${exportQuery}`}
        unduhLabel={`Unduh daftar ${jenis.nama}`}
      />

      <FinanceSummaryCards cards={cards} compact />

      <TransactionTable
        data={data}
        activeQuery={searchParams.q || ''}
        activeKategori={searchParams.kategori || ''}
        activeBukti={bukti}
      />

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>Data contoh · Periode {periodeLabel(data.periode)}</span>
      </div>
    </div>
  );
}
