'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  Award,
  ExternalLink,
  LogOut,
  X,
  Building2,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/authActions';

interface DisbudparekrafSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  pendingLpjCount?: number;
}

export default function DisbudparekrafSidebar({
  activeSection = 'overview',
  onSectionChange,
  mobileOpen = false,
  onCloseMobile,
  pendingLpjCount = 0,
}: DisbudparekrafSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    {
      id: 'lpj',
      label: 'Verifikasi LPJ',
      icon: FileCheck2,
      badge: pendingLpjCount > 0 ? String(pendingLpjCount) : undefined,
    },
    { id: 'radar', label: 'Radar 35 Wilayah', icon: MapPin },
    { id: 'hibah', label: 'Prioritas Hibah 2027', icon: Award },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full gap-6">
      <div className="flex flex-col gap-6">
        {/* Identitas Platform */}
        <div className="flex items-center justify-between px-2">
          <Link href="/disbudparekraf" className="flex items-center gap-2.5">
            <div className="relative w-[25px] h-[27px] shrink-0">
              <Image
                src="/img/logo-pemprov-jateng.png"
                alt="Lambang Jawa Tengah"
                fill
                sizes="25px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-[#0D2453] text-[17px] tracking-tight">
                DEWI JATENG
              </span>
              <span className="text-[#64748B] text-[9px] tracking-[0.6px] font-normal uppercase">
                COMMAND CENTER
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cakupan Akses Eksekutif */}
        <div className="bg-[#F3F5F8] rounded-[10px] p-3 flex flex-col gap-1.5">
          <span className="text-[#64748B] text-[10px] font-normal tracking-wide uppercase">
            ADMIN VERIFIKATOR PROVINSI
          </span>
          <span className="text-[#0D2453] text-[13px] font-semibold leading-tight">
            Disbudparekraf Jateng
          </span>
          <span className="text-[#94A3B8] text-[10px]">
            Pengawasan 35 Kab/Kota & 867 Desa
          </span>
        </div>

        {/* Menu Utama */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[#64748B] text-[10px] font-normal tracking-[1px] px-2 mb-1">
            NAVIGASI EKSEKUTIF
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onSectionChange) onSectionChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'bg-white text-[#64748B] font-normal hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-[#64748B]'
                    }`}
                  />
                  <span className="text-[13px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Bawah: Tautan Publik & Logout */}
      <div className="flex flex-col gap-2 pt-4 border-t border-[#E6ECF5]">
        <Link
          href="/transparansi"
          className="w-full h-10 px-3 rounded-[10px] flex items-center justify-between text-[#64748B] hover:text-[#0D2453] hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-[#64748B]" />
            <span className="text-[12px] font-medium">Portal Transparansi</span>
          </div>
        </Link>

        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="w-full h-10 px-3 rounded-[10px] flex items-center gap-3 text-rose-600 hover:bg-rose-50 transition-colors text-left text-[12px] font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (Sticky Kiri) */}
      <aside className="hidden lg:flex w-[260px] bg-white border-r border-[#E6ECF5] p-5 flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-[#E6ECF5] p-5 z-50 flex flex-col justify-between shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
