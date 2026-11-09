'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import KelolaLaporanListView from '@/components/pengelola/KelolaLaporanListView';
import VerifikasiLaporanView from '@/components/pengelola/VerifikasiLaporanView';
import PerbaruiPenangananView from '@/components/pengelola/PerbaruiPenangananView';
import { TAB_ROUTES } from '@/components/pengelola/navRoutes';
import { useDashboardTickets } from '@/components/pengelola/usePengelolaData';
import { markReportInProgressAction } from '@/app/actions/reportActions';
import { resolveReportAction } from '@/app/actions/resolutionActions';
import { DashboardTicket } from '@/components/pengelola/types';

function LaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { tickets, loading, reload } = useDashboardTickets();

  const initialView = (searchParams.get('view') as 'list' | 'detail' | 'progres') || 'list';
  const initialTicketId = searchParams.get('id') || '';

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
    if (tabId === 'laporan') {
      setLaporanSubView('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = TAB_ROUTES[tabId];
    if (target) router.push(target);
  };

  const handleSelectTicketFromList = (
    ticket: DashboardTicket,
    action: 'detail' | 'progres'
  ) => {
    setSelectedTicketId(ticket.id);
    setLaporanSubView(action);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verifikasi laporan = tandai IN_PROGRESS di BE (BE hanya punya SUBMITTED/IN_PROGRESS/RESOLVED).
  const handleConfirmVerification = async (
    ticketId: string,
    result: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return { success: false, error: 'Laporan tidak ditemukan.' };
    const res = await markReportInProgressAction(ticket.code);
    if (!res.success) return { success: false, error: res.error };
    await reload();
    return { success: true };
  };

  const handleSaveProgress = async (
    ticketId: string,
    notes: string,
    markCompleted: boolean,
    resolvedFile?: File | null
  ): Promise<{ success: boolean; error?: string }> => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return { success: false, error: 'Laporan tidak ditemukan.' };

    // Belum ada endpoint catatan progres; hanya bisa mulai penanganan (Masuk → Diproses).
    if (!markCompleted) {
      if (ticket.status !== 'Masuk') {
        return {
          success: false,
          error:
            'Catatan progres belum tersimpan: laporan sudah dalam penanganan. Tandai selesai dengan foto bukti untuk menutup laporan.',
        };
      }
      const res = await markReportInProgressAction(ticket.code);
      if (!res.success) return { success: false, error: res.error };
      await reload();
      return { success: true };
    }

    if (!resolvedFile) {
      return {
        success: false,
        error: 'Lampirkan foto sesudah penanganan (Proof-of-Fix) untuk menandai selesai.',
      };
    }

    const summary =
      notes && notes.trim().length >= 10
        ? notes.trim()
        : `Penanganan laporan ${ticket.code} telah diselesaikan oleh pengelola desa.`;

    const fd = new FormData();
    fd.append('report_code', ticket.code);
    fd.append('action_summary', summary);
    fd.append('officer_name', 'Pengelola Desa Candirejo');
    fd.append('photo_after', resolvedFile);

    const res = await resolveReportAction(fd);
    if (!res.success) return { success: false, error: res.error };
    await reload();
    return { success: true };
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      <PengelolaSidebar
        activeTab="laporan"
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle="Kelola laporan"
        />

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

          {loading && tickets.length === 0 && (
            <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] text-[#64748b] text-[13px]">
              Memuat daftar laporan...
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] text-[#64748b] text-[13px]">
              Belum ada laporan aduan masuk.
            </div>
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