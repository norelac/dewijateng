import React from 'react';
import Link from 'next/link';

/** Judul halaman + aksi utama "Buat akun desa" (Figma 418:1035–418:1037). */
export default function DashboardHeader() {
  return (
    <div className="w-full flex items-start justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Dashboard Disbudparekraf
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Pantau pemasukan, pengeluaran, dan akses pengelola desa wisata.
        </p>
      </div>

      {/* ponytail: rute /disbudparekraf/akun/buat dibuat pada Fase 3. */}
      <Link
        href="/disbudparekraf/akun"
        className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold whitespace-nowrap"
      >
        Buat akun desa
      </Link>
    </div>
  );
}
