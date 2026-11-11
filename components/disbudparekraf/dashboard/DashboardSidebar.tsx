'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  LineChart,
  Activity,
  ExternalLink,
  CircleHelp,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU: NavItem[] = [
  { href: '/disbudparekraf', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/disbudparekraf/akun', label: 'Akun desa wisata', icon: Landmark },
  { href: '/disbudparekraf/monitoring', label: 'Monitoring keuangan', icon: LineChart },
  { href: '/disbudparekraf/aktivitas', label: 'Aktivitas', icon: Activity },
];

const SUPPORT: NavItem[] = [
  { href: '/', label: 'Lihat situs publik', icon: ExternalLink },
  { href: '/disbudparekraf/pusat-bantuan', label: 'Pusat bantuan', icon: CircleHelp },
  { href: '/disbudparekraf/pengaturan', label: 'Pengaturan', icon: Settings },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Sidebar ruang admin dinas.
 *
 * Tata letak, tinggi item, dan jarak sengaja dibuat identik dengan
 * `components/pengelola/PengelolaSidebar.tsx` agar kedua ruang terasa satu
 * keluarga. Kartu pengingat privasi diberi gerbang tinggi viewport supaya
 * menu "Pengaturan" tidak pernah terpotong di layar pendek.
 */
export default function DashboardSidebar({
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname() || '';

  // Item aktif: cocok persis, atau awalan rute untuk sub-halaman.
  const isActive = (href: string) =>
    href === '/disbudparekraf' ? pathname === '/disbudparekraf' : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex flex-col gap-3">
        {/* Identitas platform */}
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
                RUANG ADMIN DINAS
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

        {/* Cakupan akses */}
        <div className="bg-[#F3F5F8] rounded-[10px] p-3 flex flex-col gap-1.5">
          <span className="text-[#64748B] text-[10px] font-normal tracking-wide uppercase">
            DISBUDPAREKRAF
          </span>
          <span className="text-[#0D2453] text-[13px] font-semibold">Provinsi Jawa Tengah</span>
        </div>

        {/* Menu utama */}
        <div className="flex flex-col gap-1">
          <span className="text-[#64748B] text-[10px] font-normal tracking-[1px] px-2 mb-1">
            MENU UTAMA
          </span>
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`w-full h-10 px-3 rounded-[10px] flex items-center gap-2.5 transition-colors text-left ${
                  active
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'bg-white text-[#64748B] font-normal hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`}
                />
                <span className="text-[12px]">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Pemisah */}
        <div className="h-px bg-[#E6ECF5] w-full" />

        {/* Menu pendukung */}
        <div className="flex flex-col gap-1.5">
          {SUPPORT.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`w-full h-10 px-3 rounded-[10px] flex items-center gap-2.5 transition-colors text-[12px] text-left ${
                  active
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'text-[#64748B] hover:text-[#0D2453] hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-[17px] h-[17px] shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Pengingat privasi — disembunyikan di viewport pendek agar menu tidak terpotong */}
        <div className="hidden [@media(min-height:860px)]:flex bg-[#EDF3FC] rounded-[14px] p-3 flex-col gap-2">
          <ShieldCheck className="w-[18px] h-[18px] text-[#0D2453]" />
          <p className="text-[#0D2453] text-[12px] font-semibold leading-tight">
            Kelola akses dengan aman
          </p>
          <p className="text-[#64748B] text-[11px] leading-[1.7]">
            Buat akun hanya untuk pengelola desa yang telah ditunjuk.
          </p>
        </div>

        {/* Footer brand */}
        <p className="text-[#64748B] text-[10px] font-normal px-2">DEWI JATENG · 2026</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-[232px] shrink-0 bg-white border-r border-[#E6ECF5] pt-5 pb-4 px-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Drawer mobile */}
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
