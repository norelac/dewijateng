'use client';

import React, { useState } from 'react';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import DashboardKpis from '@/components/pengelola/DashboardKpis';
import AntreanLaporanTable from '@/components/pengelola/AntreanLaporanTable';
import AnggaranSection from '@/components/pengelola/AnggaranSection';
import PengeluaranSection from '@/components/pengelola/PengeluaranSection';
import AktivitasPanduanSection from '@/components/pengelola/AktivitasPanduanSection';
import KelolaLaporanListView from '@/components/pengelola/KelolaLaporanListView';
import VerifikasiLaporanView from '@/components/pengelola/VerifikasiLaporanView';
import PerbaruiPenangananView from '@/components/pengelola/PerbaruiPenangananView';
import {
  DashboardTicket,
  TicketStatus,
  INITIAL_TICKETS_DATA,
} from '@/components/pengelola/types';

export default function PengelolaPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [tickets, setTickets] = useState<DashboardTicket[]>(INITIAL_TICKETS_DATA);

  // Sub-view in 'laporan' tab: 'list' | 'detail' | 'progres'
  const [laporanSubView, setLaporanSubView] = useState<'list' | 'detail' | 'progres'>(
    'list'
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>('t-1');

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'laporan':
        return 'Kelola laporan';
      case 'anggaran':
        return 'Anggaran desa';
      case 'pengeluaran':
        return 'Pengeluaran & bukti';
      case 'profil':
        return 'Profil desa';
      case 'aktivitas':
        return 'Aktivitas';
      case 'pengaturan':
        return 'Pengaturan';
      default:
        return 'Dashboard';
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'laporan') {
      setLaporanSubView('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === 'anggaran') {
      const el = document.getElementById('section-anggaran');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'pengeluaran') {
      const el = document.getElementById('section-pengeluaran');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'aktivitas') {
      const el = document.getElementById('section-aktivitas');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
      {/* 1. Sidebar Navigasi Pengelola (Desktop + Mobile Drawer) */}
      <PengelolaSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Area Kerja Konten */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Bilah Akun Top Header */}
        <PengelolaHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          activeTabTitle={getTabTitle(activeTab)}
        />

        {/* Konten Halaman */}
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
          {activeTab === 'dashboard' ? (
            <>
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
                  onOpenKelolaLaporan={() => {
                    setActiveTab('laporan');
                    setLaporanSubView('list');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenTicketView={(ticket, action) => {
                    setActiveTab('laporan');
                    setSelectedTicketId(ticket.id);
                    setLaporanSubView(action);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </section>

              {/* Ringkasan Anggaran (Sumber Dana Donut + Realisasi Bar) */}
              <section id="section-anggaran" className="w-full">
                <AnggaranSection />
              </section>

              {/* Pengeluaran & Kelengkapan Publikasi */}
              <section id="section-pengeluaran" className="w-full">
                <PengeluaranSection />
              </section>

              {/* Aktivitas Terbaru & Panduan Transparan */}
              <section id="section-aktivitas" className="w-full">
                <AktivitasPanduanSection />
              </section>
            </>
          ) : activeTab === 'laporan' ? (
            <>
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
            </>
          ) : (
            /* Fallback for other sidebar items */
            <div className="bg-white rounded-[16px] border border-[#e6ecf5] p-8 text-center flex flex-col items-center gap-3">
              <h2 className="text-[#0d2453] text-lg font-semibold">
                {getTabTitle(activeTab)}
              </h2>
              <p className="text-sm text-[#64748b]">
                Halaman {getTabTitle(activeTab)} sedang aktif.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="mt-2 text-xs font-semibold px-4 py-2 rounded-full bg-[#0d2453] text-white hover:bg-[#132d66]"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
