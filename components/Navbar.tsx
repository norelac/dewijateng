'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Beranda', disabled: false },
  { href: '/transparansi', label: 'Transparansi Dana', disabled: false },
  { href: '/lapor', label: 'Telusur Aduan', disabled: false },
  { href: '/edukasi', label: 'Edukasi & Panduan', disabled: true },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-5 sm:px-6 py-3.5">
      <div className="flex items-center justify-between">
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

        {/* Center Navigation Links with Active Underline */}
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
        <div className="flex items-center gap-2.5">
          <Link
            href="/#buat-laporan"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs active:scale-95"
          >
            <span className="text-sm font-light leading-none">+</span>
            <span>Buat Laporan</span>
          </Link>

          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[#0D2453] border border-[#0D2453] hover:bg-slate-50 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Masuk
          </button>
        </div>
      </div>
    </header>
  );
}
