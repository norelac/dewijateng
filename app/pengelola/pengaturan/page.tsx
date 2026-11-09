'use client';

import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import PengaturanView from '@/components/pengelola/PengaturanView';

function PengaturanContent() {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/pengelola');
    } else if (tabId === 'laporan') {
      router.push('/pengelola/laporan');
    } else if (tabId === 'anggaran') {
      router.push('/pengelola/anggaran');
    } else if (tabId === 'aktivitas') {
      router.push('/pengelola/aktivitas');
    } else if (tabId === 'pusat-bantuan') {
      router.push('/pengelola/pusat-bantuan');
    } else if (tabId === 'pengaturan') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/pengelola?tab=${tabId}`);
    }
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola */}
      <PengelolaSidebar
        activeTab="pengaturan"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Pengaturan"
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          <PengaturanView />
        </div>
      </div>
    </div>
  );
}

export default function PengelolaPengaturanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PengaturanContent />
    </Suspense>
  );
}
