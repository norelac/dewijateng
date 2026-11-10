'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import AnggaranDesaView from '@/components/pengelola/AnggaranDesaView';
import UbahAnggaranView from '@/components/pengelola/UbahAnggaranView';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';
import { useBudgetData } from '@/components/pengelola/usePengelolaData';
import { updateGrantAllocationAction } from '@/app/actions/grantActions';

function AnggaranContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { budget, village, reload } = useBudgetData();

  const initialView = (searchParams.get('view') as 'view' | 'edit') || 'view';
  const [anggaranSubView, setAnggaranSubView] = useState<'view' | 'edit'>(initialView);

  useEffect(() => {
    const viewParam = searchParams.get('view') as 'view' | 'edit' | null;
    if (viewParam) setAnggaranSubView(viewParam);
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'anggaran') {
      setAnggaranSubView('view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      <PengelolaSidebar
        activeTab="anggaran"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Anggaran desa"
        />

        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          {anggaranSubView === 'view' ? (
            <AnggaranDesaView
              budget={budget}
              onOpenEdit={() => {
                setAnggaranSubView('edit');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToPengeluaran={() => {
                router.push('/pengelola/pengeluaran');
              }}
            />
          ) : (
            <UbahAnggaranView
              budget={budget}
              saveEnabled
              onBack={() => {
                setAnggaranSubView('view');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSaveBudget={async (updated) => {
                if (!village?.id) {
                  return { success: false, error: 'Data desa belum tersedia. Muat ulang halaman.' };
                }
                const fiscalYear = updated.year || budget.year;
                // Kirim rincian tiga sumber dana; total dihitung dari jumlahnya di server.
                const res = await updateGrantAllocationAction({
                  villageId: village.id,
                  fiscalYear,
                  totalAllocated:
                    (updated.apbdes ?? 0) + (updated.banprov ?? 0) + (updated.pades ?? 0),
                  apbdesAmount: updated.apbdes ?? 0,
                  banprovAmount: updated.banprov ?? 0,
                  padesAmount: updated.pades ?? 0,
                });

                if (res.success) {
                  await reload();
                  return { success: true };
                }
                return { success: false, error: res.error };
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PengelolaAnggaranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AnggaranContent />
    </Suspense>
  );
}