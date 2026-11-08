'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import KelolaLaporanListView from '@/components/pengelola/KelolaLaporanListView';
import VerifikasiLaporanView from '@/components/pengelola/VerifikasiLaporanView';
import PerbaruiPenangananView from '@/components/pengelola/PerbaruiPenangananView';
import {
  DashboardTicket,
  TicketStatus,
  INITIAL_TICKETS_DATA,
} from '@/components/pengelola/types';

function LaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [tickets, setTickets] = useState<DashboardTicket[]>(INITIAL_TICKETS_DATA);

  const initialView = (searchParams.get('view') as 'list' | 'detail' | 'progres') || 'list';
  const initialTicketId = searchParams.get('id') || 't-1';

  const [laporanSubView, setLaporanSubView] = useState<'list' | 'detail' | 'progres'>(initialView);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(initialTicketId);

  useEffect(() => {
    const viewParam = searchParams.get('view') as 'list' | 'detail' | 'progres' | null;
    const idParam = searchParams.get('id');
    if (viewParam) setLaporanSubView(viewParam);
    if (idParam) setSelectedTicketId(idParam);
  }, [searchParams]);

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'dashboard') {
      router.push('/pengelola');
    } else if (tabId === 'laporan') {
      setLaporanSubView('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/pengelola?tab=${tabId}`);
    }
  };

  const handleSelectTicketFromList = (
    ticket: DashboardTicket,
    action: 'detail' | 'progres'
  ) => {
    setSelectedTicketId(ticket.id);
    setLaporanSubView(action);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmVerification = (
    ticketId: string,
    result: string,
    notes: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Diverifikasi' as TicketStatus,
            actionLabel: 'Mulai penanganan',
            notes: notes || t.notes,
            timeline: [
              {
                status: 'Diverifikasi',
                date: '28 Okt 2026',
                title: 'Laporan diverifikasi',
                description: `Pemeriksaan selesai: ${result}. Rencana tindak lanjut dicatat.`,
              },
              ...(t.timeline || []),
            ],
          };
        }
        return t;
      })
    );
  };

  const handleSaveProgress = (
    ticketId: string,
    notes: string,
    markCompleted: boolean,
    resolvedImage?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newStatus: TicketStatus = markCompleted
            ? 'Selesai'
            : 'Diproses';
          return {
            ...t,
            status: newStatus,
            actionLabel: markCompleted ? 'Lihat detail' : 'Perbarui progres',
            notes: notes || t.notes,
            resolvedImage: resolvedImage || t.resolvedImage,
            timeline: [
              {
                status: newStatus,
                date: '28 Okt 2026',
                title: markCompleted
                  ? 'Penanganan laporan selesai'
                  : 'Progres penanganan diperbarui',
                description: notes || 'Pekerjaan fisik dan dokumentasi diperbarui.',
              },
              ...(t.timeline || []),
            ],
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      {/* 1. Sidebar Navigasi Pengelola */}
      <PengelolaSidebar
        activeTab="laporan"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Kelola laporan"
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          {laporanSubView === 'list' && (
            <KelolaLaporanListView
              tickets={tickets}
              onSelectTicket={handleSelectTicketFromList}
            />
          )}

          {laporanSubView === 'detail' && selectedTicket && (
            <VerifikasiLaporanView
              ticket={selectedTicket}
              onBack={() => {
                setLaporanSubView('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onConfirmVerification={handleConfirmVerification}
              onSwitchToProgres={() => {
                setLaporanSubView('progres');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {laporanSubView === 'progres' && selectedTicket && (
            <PerbaruiPenangananView
              ticket={selectedTicket}
              onBack={() => {
                setLaporanSubView('list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSaveProgress={handleSaveProgress}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PengelolaLaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LaporanContent />
    </Suspense>
  );
}
