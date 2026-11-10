'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react';
import { getSessionAction, logoutAction } from '@/app/actions/authActions';
import type { SessionUser } from '@/lib/auth';

/** Judul jejak halaman per rute (mengikuti label menu pada desain). */
const TITLES: { match: (path: string) => boolean; label: string }[] = [
  { match: (p) => p === '/disbudparekraf', label: 'Dashboard' },
  { match: (p) => p.startsWith('/disbudparekraf/akun'), label: 'Akun desa wisata' },
  { match: (p) => p.startsWith('/disbudparekraf/monitoring'), label: 'Monitoring keuangan' },
  { match: (p) => p.startsWith('/disbudparekraf/aktivitas'), label: 'Aktivitas' },
];

interface DashboardTopbarProps {
  onOpenMobile?: () => void;
}

export default function DashboardTopbar({ onOpenMobile }: DashboardTopbarProps) {
  const pathname = usePathname() || '';
  const [session, setSession] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getSessionAction().then(setSession);
  }, []);

  const title = TITLES.find((t) => t.match(pathname))?.label ?? 'Dashboard';
  const displayName = session?.fullName || 'Admin Disbudparekraf';
  const roleLabel = session?.role === 'disbudparekraf' ? 'Admin dinas' : 'Pengelola desa';

  const initials =
    (session?.fullName || 'Admin Disbudparekraf')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'CD';

  return (
    <header className="w-full h-[80px] bg-white border-b border-[#E6ECF5] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-[#0D2453] hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[13px] min-w-0">
          <span className="text-[#64748B] hidden sm:inline">Disbudparekraf</span>
          <span className="text-[#64748B] hidden sm:inline">/</span>
          <span className="text-[#0D2453] font-semibold truncate">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <button
          type="button"
          className="p-1 rounded-lg text-[#0D2453] hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notifikasi"
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>

        <div className="h-[28px] w-px bg-[#E6ECF5]" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[#EDF3FC] text-[#0D2453] flex items-center justify-center font-semibold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col gap-[3px] text-left leading-none">
              <span className="text-[12px] font-semibold text-[#0D2453] truncate max-w-[220px]">
                {displayName}
              </span>
              <span className="text-[10px] text-[#64748B]">{roleLabel}</span>
            </div>
            <ChevronDown className="w-[14px] h-[14px] text-[#64748B] hidden md:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E6ECF5] p-2 flex flex-col gap-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-[#0D2453]">{displayName}</p>
                <p className="text-[10px] text-[#64748B]">{roleLabel}</p>
              </div>
              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
