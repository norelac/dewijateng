'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import BalaiDesaLpjUploader from '@/components/BalaiDesaLpjUploader';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';
import { normalizeFiscalYear } from '@/components/pengelola/FiscalYearSelect';

function LpjContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [fiscalYear, setFiscalYear] = useState<number>(
    normalizeFiscalYear(searchParams.get('tahun'))
  );

  useEffect(() => {
    const tahunParam = searchParams.get('tahun');
    if (tahunParam) setFiscalYear(normalizeFiscalYear(tahunParam));
  }, [searchParams]);

  const handleYearChange = (year: number) => {
    setFiscalYear(year);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tahun', String(year));
    router.replace(`/pengelola/lpj?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'lpj') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      <PengelolaSidebar
        activeTab="lpj"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Unggah LPJ"
        />

        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          <BalaiDesaLpjUploader
            fiscalYear={fiscalYear}
            onYearChange={handleYearChange}
          />
        </div>
      </div>
    </div>
  );
}

export default function PengelolaLpjPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-[3px] border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LpjContent />
    </Suspense>
  );
}
