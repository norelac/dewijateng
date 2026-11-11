import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthShellProps {
  children: React.ReactNode;
  /**
   * Aksi di kanan bilah atas. Bawaan: "Butuh bantuan?" + tombol Pusat bantuan
   * (sesuai mayoritas layar). Layar login memakai tautan Daftar.
   */
  headerRight?: React.ReactNode;
}

/**
 * Kerangka halaman autentikasi "Ruang Admin Dinas" mengikuti desain Figma:
 * bilah atas 88px, area kanvas terang, catatan layanan 56px di bawah.
 */
export default function AuthShell({ children, headerRight }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <header className="h-[88px] bg-white flex items-center justify-between px-5 sm:px-[56px] shrink-0">
        <Link href="/" className="flex items-center gap-[10px]">
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
          <div className="flex flex-col leading-[1.15]">
            <span className="font-semibold text-[17px] text-[#0D2453]">DEWI JATENG</span>
            <span className="text-[9px] tracking-[0.4px] text-[#64748B]">
              RUANG ADMIN DINAS
            </span>
          </div>
        </Link>

        {headerRight ?? (
          <div className="flex items-center gap-[14px]">
            <span className="hidden sm:inline text-[13px] text-[#64748B]">Butuh bantuan?</span>
            <a
              href="mailto:dewijateng@jatengprov.go.id"
              className="h-[40px] px-[20px] inline-flex items-center justify-center rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453]"
            >
              Pusat bantuan
            </a>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-[112px]">{children}</main>

      <footer className="h-[56px] bg-[#F7F9FC] flex items-center justify-between px-5 sm:px-[56px] text-[10px] text-[#64748B] shrink-0">
        <span>© 2026 DEWI JATENG</span>
        <span>Portal desa wisata Jawa Tengah</span>
      </footer>
    </div>
  );
}
