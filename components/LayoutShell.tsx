'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Halaman autentikasi memakai kerangka sendiri (AuthShell) tanpa Navbar/Footer publik.
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/daftar' ||
    Boolean(pathname?.startsWith('/daftar/')) ||
    pathname === '/lupa-kata-sandi' ||
    Boolean(pathname?.startsWith('/lupa-kata-sandi/')) ||
    pathname === '/reset-sandi' ||
    Boolean(pathname?.startsWith('/reset-sandi/'));

  const isDashboardOrAuth =
    pathname?.startsWith('/pengelola') ||
    pathname?.startsWith('/disbudparekraf') ||
    isAuthRoute;

  if (isDashboardOrAuth) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-6">
        <Navbar />
      </div>

      <main className="flex-grow">{children}</main>

      <Footer />
    </>
  );
}
