'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/disbudparekraf/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/disbudparekraf/dashboard/DashboardTopbar';

/** Kerangka dashboard Disbudparekraf: sidebar 232px + bilah atas 80px. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-[#F7F9FC] min-h-screen flex items-start w-full relative">
      <DashboardSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        <DashboardTopbar onOpenMobile={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}
