import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Monitoring keuangan · DEWI JATENG',
};

/**
 * Layar "Monitoring keuangan".
 *
 * ponytail: isi penuh (desain `422:604`, `422:665`, `422:726`, `422:787`,
 * `422:848`, `422:909`) dikerjakan pada Fase 4. Untuk sekarang halaman ini
 * hanya penanda agar menu sidebar tidak 404.
 */
export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Monitoring keuangan
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Pantau pemasukan, pengeluaran, dan saldo akhir setiap desa wisata.
        </p>
      </div>

      <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-8 shadow-xs flex flex-col items-start gap-3">
        <span className="text-[#0D2453] text-[15px] font-semibold">Segera hadir</span>
        <p className="text-[#64748B] text-[13px] leading-[1.5] max-w-xl">
          Rincian monitoring keuangan per desa sedang disiapkan. Sementara itu, ringkasan periode
          berjalan dapat dilihat di dashboard.
        </p>
        <Link
          href="/disbudparekraf"
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold"
        >
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
