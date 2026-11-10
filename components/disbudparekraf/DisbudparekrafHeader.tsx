'use client';

import React, { useState, useEffect } from 'react';
import { Menu, PlusCircle, Bell, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { getSessionAction, logoutAction } from '@/app/actions/authActions';
import type { SessionUser } from '@/lib/auth';

interface DisbudparekrafHeaderProps {
  onOpenMobile?: () => void;
  activeTitle?: string;
  onOpenRegisterModal: () => void;
}

export default function DisbudparekrafHeader({
  onOpenMobile,
  activeTitle = 'Command Center Pengawasan 1.000 Desa Wisata',
  onOpenRegisterModal,
}: DisbudparekrafHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    getSessionAction().then(setSession);
  }, []);

  const displayName = session?.fullName || 'Admin Eksekutif Disbudparekraf Jateng';

  return (
    <header className="w-full h-[72px] sm:h-[80px] bg-white border-b border-[#E6ECF5] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile Toggle & Breadcrumb */}
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
            Disbudparekraf Pemprov Jateng
          </span>
          <span className="text-[#64748B] hidden sm:inline font-normal">/</span>
          <span className="text-[#0D2453] font-semibold truncate max-w-[260px] sm:max-w-md">
            {activeTitle}
          </span>
        </div>
      </div>

      {/* Right: Register Button, Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Tombol Utama: Daftarkan Desa Wisata */}
        <button
          type="button"
          onClick={onOpenRegisterModal}
          className="h-10 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Daftarkan Desa Wisata</span>
          <span className="sm:hidden">Daftar Desa</span>
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#0D2453] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              DJ
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-[12px] font-semibold text-[#0D2453] truncate max-w-[150px]">
                {displayName}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Admin Provinsi</span>
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B] hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E6ECF5] p-2 flex flex-col gap-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-[#0D2453]">{displayName}</p>
                <p className="text-[10px] text-[#64748B]">Verifikator Disbudparekraf</p>
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
