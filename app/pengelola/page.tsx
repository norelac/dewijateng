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
import { mapGrantExpenseToExpenseItem } from '@/components/pengelola/mapReports';
import type { ActivityItem } from '@/components/pengelola/types';

function PengelolaDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { tickets } = useDashboardTickets();
  const { budget, village, grant, expenses } = useBudgetData();

  const reportCounts = {
    total: tickets.length,
    perluDitangani: tickets.filter((t) => t.status !== 'Selesai').length,
    masuk: tickets.filter((t) => t.status === 'Masuk').length,
    diverifikasi: tickets.filter((t) => t.status === 'Diverifikasi').length,
    diproses: tickets.filter((t) => t.status === 'Diproses').length,
    selesai: tickets.filter((t) => t.status === 'Selesai').length,
  };

  const totalFunding = budget.apbdes + budget.banprov + budget.pades;
  const realisasiPercent =
    totalFunding > 0 ? Math.round((budget.usedAmount / totalFunding) * 100) : undefined;

  const expenseItems = expenses.map((exp) =>
    mapGrantExpenseToExpenseItem(exp, grant?.lpj_document_url || undefined)
  );

  const evidence = {
    complete: expenseItems.filter((e) => e.hasReceipt || e.hasPhoto).length,
    total: expenseItems.length,
  };

  const activities: ActivityItem[] = tickets.slice(0, 3).map((t) => ({
    id: `act-${t.id}`,
    date: t.date,
    title:
      t.status === 'Selesai'
        ? 'Penanganan laporan selesai'
        : t.status === 'Diproses'
        ? 'Penanganan laporan dimulai'
        : 'Laporan baru diterima',
    subtitle: `${t.code} · ${t.status}`,
  }));

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  // Dukungan tautan lama /pengelola?tab=pengeluaran → halaman tersendiri.
  useEffect(() => {
    if (searchParams.get('tab') === 'pengeluaran') {
      router.replace('/pengelola/pengeluaran');
    }
  }, [searchParams, router]);

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola (Desktop + Mobile Drawer) */}
      <PengelolaSidebar
        activeTab="dashboard"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        pendingReportCount={reportCounts.perluDitangani}
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
              villageName={village?.name || 'Desa wisata'}
              regency={
                village
                  ? `${village.district}, ${village.regency} · Jawa Tengah`
                  : 'Jawa Tengah'
              }
              updatedAt={`Per ${budget.dateStr} · 10.00 WIB`}
              periodYear={`TA ${budget.year}`}
              totalFunding={totalFunding}
              reportCounts={reportCounts}
              evidence={evidence}
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
            <PengeluaranSection
              expenses={expenseItems}
              periodLabel={budget.dateStr}
              realisasiPercent={realisasiPercent}
            />
          </section>

          {/* Aktivitas Terbaru & Panduan Transparan */}
          <section id="section-aktivitas" className="w-full">
            <AktivitasPanduanSection
              activities={activities.length > 0 ? activities : undefined}
              onViewHistory={() => router.push('/pengelola/aktivitas')}
            />
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