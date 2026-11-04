'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Beranda', disabled: false },
  { href: '/transparansi', label: 'Transparansi Dana', disabled: false },
  { href: '/lapor', label: 'Telusuri Aduan', disabled: false },
  { href: '/edukasi', label: 'Edukasi & Panduan', disabled: false },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // ponytail: passive window scroll listener. Upgrade to intersection observer if deep nesting needed.
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Spacer keeps content position when header goes floating */}
      <div className="w-full h-[76px]" aria-hidden="true" />

      {/* Floating Header Wrapper */}
      <header
        className={`fixed inset-x-0 z-50 flex justify-center pointer-events-none px-4 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'top-3.5 sm:top-4' : 'top-6'
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled
              ? 'w-full max-w-[1060px] h-[68px] px-6 sm:px-8 rounded-full bg-white/95 backdrop-blur-md border border-[#E6ECF5] shadow-[0_12px_36px_rgba(13,36,83,0.09)] text-[#0D2453]'
              : 'w-full max-w-[1280px] h-[76px] px-6 sm:px-8 rounded-[20px] bg-white border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-[#0D2453]'
          }`}
        >
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

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            {navItems.map((item) => {
              if (item.disabled) {
                return (
                  <a
                    key={item.label}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-sm text-[#0D2453]/70 font-semibold hover:text-[#0D2453] transition-all py-1 cursor-pointer"
                  >
                    {item.label}
                  </a>
                );
              }

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

          {/* Right Actions: + Buat Laporan & Masuk */}
          <div className="flex items-center gap-3">
            <Link
              href="/#buat-laporan"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs active:scale-95"
            >
              <span className="text-sm font-light leading-none">+</span>
              <span>Buat Laporan</span>
            </Link>

            <Link
              href="/pengelola"
              className="inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[#0D2453] border border-[#0D2453] hover:bg-slate-50 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
