'use client';

import React, { useState } from 'react';
import PengelolaSidebar from '@/components/pengelola/PengelolaSidebar';
import PengelolaHeader from '@/components/pengelola/PengelolaHeader';
import DashboardKpis from '@/components/pengelola/DashboardKpis';
import AntreanLaporanTable from '@/components/pengelola/AntreanLaporanTable';
import AnggaranSection from '@/components/pengelola/AnggaranSection';
import PengeluaranSection from '@/components/pengelola/PengeluaranSection';
import AktivitasPanduanSection from '@/components/pengelola/AktivitasPanduanSection';

export default function PengelolaPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'laporan':
        return 'Kelola Laporan';
      case 'anggaran':
        return 'Anggaran Desa';
      case 'pengeluaran':
        return 'Pengeluaran & Bukti';
      case 'profil':
        return 'Profil Desa';
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
    // Smooth scroll to relevant section if on dashboard
    if (tabId === 'laporan') {
      const el = document.getElementById('section-antrean-laporan');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'anggaran') {
      const el = document.getElementById('section-anggaran');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'pengeluaran') {
      const el = document.getElementById('section-pengeluaran');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'aktivitas') {
      const el = document.getElementById('section-aktivitas');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

        {/* Konten Dashboard Grid Container */}
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
            <AntreanLaporanTable />
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
        </div>
      </div>
    </div>
  );
}
