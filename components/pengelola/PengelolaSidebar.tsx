'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  MessagesSquare,
  Wallet,
  ReceiptText,
  Landmark,
  ScrollText,
  ExternalLink,
  HelpCircle,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';

interface PengelolaSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function PengelolaSidebar({
  activeTab = 'dashboard',
  onTabChange,
  mobileOpen = false,
  onCloseMobile,
}: PengelolaSidebarProps) {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'laporan', label: 'Kelola laporan', icon: MessagesSquare, badge: '3' },
    { id: 'anggaran', label: 'Anggaran desa', icon: Wallet },
    { id: 'pengeluaran', label: 'Pengeluaran & bukti', icon: ReceiptText },
    { id: 'profil', label: 'Profil desa', icon: Landmark },
    { id: 'aktivitas', label: 'Aktivitas', icon: ScrollText },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full gap-6">
      <div className="flex flex-col gap-6">
        {/* Identitas Platform */}
        <div className="flex items-center justify-between px-2">
          <Link href="/pengelola" className="flex items-center gap-2.5">
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
                RUANG PENGELOLA
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

        {/* Cakupan Akses Desa */}
        <div className="bg-[#F3F5F8] rounded-[10px] p-3 flex flex-col gap-1.5">
          <span className="text-[#64748B] text-[10px] font-normal tracking-wide uppercase">
            ADMIN PENGELOLA DESA
          </span>
          <span className="text-[#0D2453] text-[13px] font-semibold">
            Desa Candirejo
          </span>
        </div>

        {/* Menu Utama */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[#64748B] text-[10px] font-normal tracking-[1px] px-2 mb-1">
            MENU UTAMA
          </span>
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onTabChange) onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full h-11 px-3 rounded-[10px] flex items-center justify-between transition-colors text-left ${
                  isActive
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'bg-white text-[#64748B] font-normal hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-white' : 'text-[#64748B]'
                    }`}
                  />
                  <span className="text-[12px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pemisah */}
        <div className="h-px bg-[#E6ECF5] w-full" />

        {/* Menu Pendukung */}
        <div className="flex flex-col gap-1.5">
          <Link
            href="/"
            className="h-10 px-3 rounded-[10px] flex items-center gap-2.5 text-[#64748B] hover:text-[#0D2453] hover:bg-slate-50 transition-colors text-[12px]"
          >
            <ExternalLink className="w-[17px] h-[17px] shrink-0" />
            <span>Lihat situs publik</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (onTabChange) onTabChange('pusat-bantuan');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full h-10 px-3 rounded-[10px] flex items-center gap-2.5 transition-colors text-[12px] text-left ${
              activeTab === 'pusat-bantuan'
                ? 'bg-[#0D2453] text-white font-semibold'
                : 'text-[#64748B] hover:text-[#0D2453] hover:bg-slate-50'
            }`}
          >
            <HelpCircle
              className={`w-[17px] h-[17px] shrink-0 ${
                activeTab === 'pusat-bantuan' ? 'text-white' : 'text-[#64748B]'
              }`}
            />
            <span>Pusat bantuan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onTabChange) onTabChange('pengaturan');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full h-10 px-3 rounded-[10px] flex items-center gap-2.5 transition-colors text-[12px] text-left ${
              activeTab === 'pengaturan'
                ? 'bg-[#0D2453] text-white font-semibold'
                : 'text-[#64748B] hover:text-[#0D2453] hover:bg-slate-50'
            }`}
          >
            <Settings
              className={`w-[17px] h-[17px] shrink-0 ${
                activeTab === 'pengaturan' ? 'text-white' : 'text-[#64748B]'
              }`}
            />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Pengingat Privasi */}
        <div className="bg-[#EDF3FC] rounded-[14px] p-4 flex flex-col gap-2.5">
          <ShieldCheck className="w-[18px] h-[18px] text-[#0D2453]" />
          <p className="text-[#0D2453] text-[12px] font-semibold leading-tight">
            Jaga kepercayaan publik
          </p>
          <p className="text-[#64748B] text-[11px] leading-[1.7]">
            Lindungi data pelapor. Publikasikan hanya informasi dan bukti yang aman.
          </p>
        </div>

        {/* Footer Brand */}
        <p className="text-[#64748B] text-[10px] font-normal px-2">
          DEWI JATENG · 2026
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Fixed/Sticky */}
      <aside className="hidden lg:flex flex-col w-[232px] shrink-0 min-h-screen bg-white border-r border-[#E6ECF5] pt-7 pb-6 px-4 self-stretch">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[270px] max-w-[85vw] bg-white min-h-screen p-5 shadow-2xl z-10 flex flex-col overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
