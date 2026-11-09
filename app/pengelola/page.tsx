'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import DashboardKpis from '@/components/pengelola/DashboardKpis';
import AntreanLaporanTable from '@/components/pengelola/AntreanLaporanTable';
import AnggaranSection from '@/components/pengelola/AnggaranSection';
import PengeluaranSection from '@/components/pengelola/PengeluaranSection';
import AktivitasPanduanSection from '@/components/pengelola/AktivitasPanduanSection';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';
import {
  useBudgetData,
  useDashboardTickets,
} from '@/components/pengelola/usePengelolaData';

function PengelolaDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { tickets } = useDashboardTickets();
  const { budget } = useBudgetData();

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabId === 'pengeluaran') {
      document
        .getElementById('section-pengeluaran')
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  // Dukungan tautan lama /pengelola?tab=pengeluaran
  useEffect(() => {
    if (searchParams.get('tab') === 'pengeluaran') {
      document
        .getElementById('section-pengeluaran')
        ?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola (Desktop + Mobile Drawer) */}
      <PengelolaSidebar
        activeTab="dashboard"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Dashboard"
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          {/* KPI Indikator & Identitas Desa */}
          <section id="section-kpi" className="w-full">
            <DashboardKpis
              villageName="Desa Candirejo"
              regency="Borobudur, Kabupaten Magelang · Jawa Tengah"
              updatedAt="Per 28 Oktober 2026 · 10.00 WIB"
              periodYear="TA 2026"
            />
          </section>

          {/* Antrean Aduan / Laporan Desa */}
          <section id="section-antrean-laporan" className="w-full">
            <AntreanLaporanTable
              tickets={tickets}
              onOpenKelolaLaporan={() => router.push('/pengelola/laporan')}
              onOpenTicketView={(ticket, action) =>
                router.push(`/pengelola/laporan?view=${action}&id=${ticket.id}`)
              }
            />
          </section>

          {/* Ringkasan Anggaran (Sumber Dana Donut + Realisasi Bar) */}
          <section id="section-anggaran" className="w-full">
            <AnggaranSection
              budget={budget}
              onManageBudget={() => router.push('/pengelola/anggaran')}
            />
          </section>

          {/* Pengeluaran & Kelengkapan Publikasi */}
          <section id="section-pengeluaran" className="w-full">
            <PengeluaranSection />
          </section>

          {/* Aktivitas Terbaru & Panduan Transparan */}
          <section id="section-aktivitas" className="w-full">
            <AktivitasPanduanSection />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function PengelolaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PengelolaDashboardContent />
    </Suspense>
  );
}