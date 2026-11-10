'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Menu, LogOut, User, Shield } from 'lucide-react';
import { getSessionAction, logoutAction } from '@/app/actions/authActions';
import type { SessionUser } from '@/lib/auth';

interface PengelolaHeaderProps {
  onOpenMobile?: () => void;
  activeTabTitle?: string;
}

export default function PengelolaHeader({
  onOpenMobile,
  activeTabTitle = 'Dashboard',
}: PengelolaHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    getSessionAction().then(setSession);
  }, []);

  const displayName = session?.fullName || 'Pengelola Desa';
  const roleLabel = session?.role === 'disbudparekraf' ? 'Admin Disbudparekraf' : 'Admin Desa';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || 'PD';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutAction();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="w-full h-[72px] sm:h-[80px] bg-white border-b border-[#E6ECF5] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-[#0D2453] hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[12px]">
          <span className="text-[#64748B] hidden sm:inline font-normal">
            Pengelolaan desa
          </span>
          <span className="text-[#64748B] hidden sm:inline font-normal">/</span>
          <span className="text-[#0D2453] font-semibold">{activeTabTitle}</span>
        </div>
      </div>

      {/* Right: Notification & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0D2453] transition-colors"
          aria-label="Notifikasi"
          title="Notifikasi terbaru"
        >
          <Bell className="w-[18px] h-[18px]" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          )}
        </button>

        {/* Separator */}
        <div className="h-7 w-px bg-[#E6ECF5] hidden sm:block" />

        {/* Profile Card & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] text-[11px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-[#0D2453] leading-none">
                {displayName}
              </span>
              <span className="text-[10px] font-normal text-[#64748B] leading-none">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          </button>

          {/* Simple Dropdown Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E6ECF5] py-2 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="text-xs font-semibold text-[#0D2453]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500">{roleLabel}</p>
                </div>
                <div className="px-4 py-2 text-[11px] text-[#64748B] flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sesi Resmi Aktif</span>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
