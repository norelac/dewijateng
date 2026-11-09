'use client';

import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import AktivitasPengelolaanView from '@/components/pengelola/AktivitasPengelolaanView';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';
import {
  useBudgetData,
  useDashboardTickets,
} from '@/components/pengelola/usePengelolaData';
import {
  buildActivityEvents,
  mapTicketToHandlingStages,
} from '@/components/pengelola/mapReports';

function AktivitasContent() {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { tickets } = useDashboardTickets();
  const { grant, village } = useBudgetData();

  const events = buildActivityEvents(tickets, grant);
  const completed = tickets.find((t) => t.status === 'Selesai');
  const stages = completed ? mapTicketToHandlingStages(completed) : undefined;
  const traceSubject = completed
    ? `${completed.title} · ${completed.code}`
    : undefined;

  const handleTabChange = (tabId: string) => {
    if (tabId === 'aktivitas') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  const handleNavigate = (tab: 'laporan' | 'anggaran', ticketId?: string) => {
    if (tab === 'laporan') {
      const q = ticketId ? `?view=detail&id=${ticketId}` : '';
      router.push(`/pengelola/laporan${q}`);
    } else {
      router.push('/pengelola/anggaran');
    }
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola */}
      <PengelolaSidebar
        activeTab="aktivitas"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Aktivitas"
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          <AktivitasPengelolaanView
            events={events}
            stages={stages}
            traceSubject={traceSubject}
            villageName={village?.name || 'Desa Candirejo'}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </div>
  );
}

export default function PengelolaAktivitasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AktivitasContent />
    </Suspense>
  );
}
