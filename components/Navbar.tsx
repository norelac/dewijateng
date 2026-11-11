'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/lapor', label: 'Telusuri Laporan' },
  { href: '/transparansi', label: 'Transparansi Dana' },
  { href: '/edukasi', label: 'Edukasi & Panduan' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Tutup menu mobile tiap ganti rute
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Spacer keeps content position when header goes floating */}
      <div className="w-full h-[76px]" aria-hidden="true" />

      {/* Opaque backdrop: konten yang digulir tidak tembus di belakang header */}
      <div
        className="fixed inset-x-0 top-0 z-40 h-[104px] bg-[#F7F9FC] pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Header Wrapper */}
      <header className="fixed inset-x-0 z-50 flex justify-center pointer-events-none px-4 sm:px-6 top-6">
        <div className="pointer-events-auto flex flex-col w-full max-w-[1280px] rounded-[20px] bg-white border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-[#0D2453]">
          {/* Main Bar */}
          <div className="flex items-center justify-between px-5 sm:px-8 h-[72px] sm:h-[76px]">
            {/* Brand Logo with Pemprov Jateng Image */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <img
                src="/img/logo-pemprov-jateng.png"
                alt="Logo Pemerintah Provinsi Jawa Tengah"
                className="h-6 w-auto object-contain shrink-0"
                width={23}
                height={24}
              />
              <span className="font-bold text-[#0D2453] text-lg sm:text-xl tracking-tight group-hover:text-blue-900 transition-colors">
                DEWI JATENG
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-8">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && (pathname || '').startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition-all py-1 ${
                      isActive
                        ? 'text-[#0D2453] font-bold border-b-2 border-[#0D2453]'
                        : 'text-[#0D2453]/70 font-semibold hover:text-[#0D2453]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/#buat-laporan"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs active:scale-95"
              >
                <span className="text-sm font-light leading-none">+</span>
                <span>Buat Laporan</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[#0D2453] border border-[#0D2453] hover:bg-slate-50 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Masuk
              </Link>
            </div>

            {/* Mobile Actions: Lapor Ringkas + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/#buat-laporan"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all"
              >
                <span>+ Lapor</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="p-2 rounded-xl text-[#0D2453] hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={mobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Accordion */}
          {mobileOpen && (
            <div className="md:hidden border-t border-[#E6ECF5] px-5 py-4 flex flex-col gap-2 bg-white rounded-b-3xl">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && (pathname || '').startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0D2453]/10 text-[#0D2453] font-bold'
                        : 'text-[#0D2453]/80 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#0D2453] border border-[#0D2453] hover:bg-slate-50 transition-all"
                >
                  Masuk
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
