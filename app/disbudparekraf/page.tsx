import React from 'react';
import DashboardHeader from '@/components/disbudparekraf/dashboard/DashboardHeader';
import PeriodeBar from '@/components/disbudparekraf/dashboard/PeriodeBar';
import FinanceStatCards from '@/components/disbudparekraf/dashboard/FinanceStatCards';
import ArusKasSection from '@/components/disbudparekraf/dashboard/ArusKasSection';
import KeuanganDesaTable from '@/components/disbudparekraf/dashboard/KeuanganDesaTable';
import PengelolaanAkunSection from '@/components/disbudparekraf/dashboard/PengelolaanAkunSection';
import AkunTerbaruTable from '@/components/disbudparekraf/dashboard/AkunTerbaruTable';
import { DASHBOARD_FOOTER_TANGGAL } from '@/components/disbudparekraf/dashboard/demoData';

/** Dashboard Disbudparekraf (Figma 418:561) — data contoh, lihat demoData.ts. */
export default function DisbudparekrafDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <DashboardHeader />
      <PeriodeBar />
      <FinanceStatCards />
      <ArusKasSection />
      <KeuanganDesaTable />
      <PengelolaanAkunSection />
      <AkunTerbaruTable />

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>{DASHBOARD_FOOTER_TANGGAL}</span>
      </div>
    </div>
  );
}
