import React from 'react';
import DashboardHeader from '@/components/disbudparekraf/dashboard/DashboardHeader';
import PeriodeBar from '@/components/disbudparekraf/dashboard/PeriodeBar';
import FinanceSummaryCards from '@/components/disbudparekraf/monitoring/FinanceSummaryCards';
import ArusKasSection from '@/components/disbudparekraf/dashboard/ArusKasSection';
import KeuanganDesaTable from '@/components/disbudparekraf/dashboard/KeuanganDesaTable';
import PengelolaanAkunSection from '@/components/disbudparekraf/dashboard/PengelolaanAkunSection';
import TrustScoreSection from '@/components/disbudparekraf/dashboard/TrustScoreSection';
import AkunTerbaruTable from '@/components/disbudparekraf/dashboard/AkunTerbaruTable';
import { getDashboardFinance } from '@/lib/services/financeService';
import { getVillageAccountStats } from '@/app/actions/villageAccountActions';
import { formatRupiahShort } from '@/lib/utils';

// Angka keuangan dibaca dari database setiap permintaan (Fase 4).
export const dynamic = 'force-dynamic';

/** Dashboard Disbudparekraf (Figma 418:561). */
export default async function DisbudparekrafDashboardPage() {
  const [finance, account] = await Promise.all([
    getDashboardFinance(),
    getVillageAccountStats(),
  ]);
  const { cards: totals } = finance;
  const rasioPengeluaran =
    totals.pemasukan > 0 ? Math.round((totals.pengeluaran / totals.pemasukan) * 100) : 0;

  const cards = [
    {
      label: 'Total pemasukan',
      value: formatRupiahShort(totals.pemasukan),
      note: `${totals.desaMelapor} desa yang melaporkan`,
      variant: 'navy' as const,
    },
    {
      label: 'Total pengeluaran',
      value: formatRupiahShort(totals.pengeluaran),
      note: `${rasioPengeluaran}% dari pemasukan periode ini`,
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
      note: `Saldo awal ${formatRupiahShort(totals.saldoAwal)} + surplus`,
      variant: 'white' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <DashboardHeader />
      <PeriodeBar
        desaMelapor={totals.desaMelapor}
        desaTotal={totals.desaTotal}
        diperbarui={finance.diperbarui}
        periode={finance.periode}
      />
      <FinanceSummaryCards cards={cards} />
      <ArusKasSection
        cashflow={finance.cashflow}
        periode={finance.periode}
        belumLapor={finance.belumLapor}
        perluBukti={finance.perluBukti}
        perluBuktiDesa={finance.perluBuktiDesa}
      />
      <KeuanganDesaTable
        rows={finance.rows}
        desaMelapor={totals.desaMelapor}
        desaTotal={totals.desaTotal}
        periode={finance.periode}
      />
      <TrustScoreSection />
      <PengelolaanAkunSection stats={account.stats} />
      <AkunTerbaruTable rows={account.recent} />

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>
          {finance.diperbarui ? `Diperbarui ${finance.diperbarui}` : 'Belum ada data'}
        </span>
      </div>
    </div>
  );
}
