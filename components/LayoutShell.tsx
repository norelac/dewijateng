'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPengelola = pathname?.startsWith('/pengelola');

  if (isPengelola) {
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
