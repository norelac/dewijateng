'use client';

import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import PusatBantuanView from '@/components/pengelola/PusatBantuanView';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';

function PusatBantuanContent() {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'pusat-bantuan') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola */}
      <PengelolaSidebar
        activeTab="pusat-bantuan"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Pusat bantuan"
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          <PusatBantuanView />
        </div>
      </div>
    </div>
  );
}

export default function PengelolaPusatBantuanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PusatBantuanContent />
    </Suspense>
  );
}
