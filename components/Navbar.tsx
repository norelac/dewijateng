'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Beranda', disabled: false },
  { href: '/transparansi', label: 'Transparansi Dana', disabled: false },
  { href: '/lapor', label: 'Lapor', disabled: false },
  { href: '/edukasi', label: 'Edukasi & Panduan', disabled: true },
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
        className={`fixed inset-x-0 z-50 flex justify-center pointer-events-none px-4 sm:px-6 transition-all duration-300 ease-in-out ${
          isScrolled ? 'top-3 sm:top-4' : 'top-6'
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-in-out ${
            isScrolled
              ? 'w-full max-w-4xl h-[60px] px-5 sm:px-6 rounded-full bg-white/95 backdrop-blur-md border border-[#E6ECF5] shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-[#0D2453]'
              : 'w-full max-w-[1280px] h-[76px] px-5 sm:px-6 rounded-[20px] bg-white border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-[#0D2453]'
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
          <nav
            className={`hidden md:flex items-center transition-all duration-300 ${
              isScrolled ? 'gap-5 lg:gap-6' : 'gap-7 lg:gap-8'
            }`}
          >
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/#buat-laporan"
              className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs active:scale-95 ${
                isScrolled
                  ? 'px-3.5 sm:px-4 py-2 text-xs sm:text-sm'
                  : 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm'
              }`}
            >
              <span className="text-sm font-light leading-none">+</span>
              <span>Buat Laporan</span>
            </Link>

            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className={`inline-flex items-center rounded-full font-bold bg-white text-[#0D2453] border border-[#0D2453] hover:bg-slate-50 transition-all shadow-xs active:scale-95 cursor-pointer ${
                isScrolled
                  ? 'px-3.5 sm:px-4 py-2 text-xs sm:text-sm'
                  : 'px-4 sm:px-5 py-2.5 text-xs sm:text-sm'
              }`}
            >
              Masuk
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
