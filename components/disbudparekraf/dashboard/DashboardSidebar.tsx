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
  LogOut,
  X,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/authActions';

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

const SUPPORT: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/', label: 'Lihat situs publik', icon: ExternalLink },
  { href: '/disbudparekraf/pusat-bantuan', label: 'Pusat bantuan', icon: CircleHelp },
  { href: '/disbudparekraf/pengaturan', label: 'Pengaturan', icon: Settings },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function DashboardSidebar({
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname() || '';

  // Item aktif: cocok persis, atau awalan rute untuk sub-halaman.
  const isActive = (href: string) =>
    href === '/disbudparekraf' ? pathname === '/disbudparekraf' : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col gap-6 px-4 pt-7 pb-6 h-full">
      {/* Identitas platform */}
      <div className="flex items-center gap-2.5 px-2 shrink-0">
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
          <div className="flex flex-col gap-1 leading-tight">
            <span className="font-semibold text-[17px] text-[#0D2453]">DEWI JATENG</span>
            <span className="text-[9px] tracking-[0.6px] text-[#64748B]">RUANG ADMIN DINAS</span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="ml-auto lg:hidden p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cakupan akses */}
      <div className="bg-[#F3F5F8] rounded-[10px] p-3 flex flex-col gap-[7px] shrink-0">
        <span className="text-[#64748B] text-[10px]">DISBUDPAREKRAF</span>
        <span className="text-[#0D2453] text-[13px] font-semibold">Provinsi Jawa Tengah</span>
      </div>

      {/* Menu utama */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <span className="text-[#64748B] text-[10px] px-0 mb-1.5">MENU UTAMA</span>
        {MENU.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`h-11 px-3 rounded-[10px] flex items-center gap-2.5 transition-colors ${
                active
                  ? 'bg-[#0D2453] text-white'
                  : 'text-[#64748B] hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-[#64748B]'}`} />
              <span className="text-[12px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="h-px w-full bg-[#E6ECF5] shrink-0" />

      {/* Menu pendukung */}
      <div className="flex flex-col gap-2.5 px-3 shrink-0">
        {SUPPORT.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 text-[#64748B] hover:text-[#0D2453] transition-colors"
            >
              <Icon className="w-[17px] h-[17px] shrink-0" />
              <span className="text-[12px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Pengingat privasi */}
      <div className="bg-[#EDF3FC] rounded-[14px] p-4 flex flex-col gap-2.5 shrink-0">
        <ShieldCheck className="w-[18px] h-[18px] text-[#0D2453]" />
        <span className="text-[#0D2453] text-[12px] font-semibold">Kelola akses dengan aman</span>
        <span className="text-[#64748B] text-[11px] leading-[1.5]">
          Buat akun hanya untuk pengelola desa yang telah ditunjuk.
        </span>
      </div>

      <div className="flex flex-col gap-2.5 shrink-0">
        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="w-full h-9 px-3 rounded-[10px] flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-left text-[12px] font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </form>
        <span className="text-[#64748B] text-[10px] px-3">DEWI JATENG · 2026</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[232px] bg-white border-r border-[#E6ECF5] flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-[#E6ECF5] z-50 flex flex-col justify-between shadow-xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
