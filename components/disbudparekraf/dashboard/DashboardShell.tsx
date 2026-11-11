'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/disbudparekraf/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/disbudparekraf/dashboard/DashboardTopbar';

/**
 * Kerangka dashboard Disbudparekraf: sidebar 232px + bilah atas 80px.
 *
 * Shell dikunci setinggi viewport: halaman luar tidak ikut scroll, hanya area
 * konten yang punya scroll sendiri. Sidebar & bilah atas selalu diam.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-[#F7F9FC] h-screen flex items-stretch w-full relative overflow-hidden">
      <DashboardSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DashboardTopbar onOpenMobile={() => setMobileOpen(true)} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}
