import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lapor - DEWI JATENG',
  description: 'Kanal Pengawasan Publik Bergaransi SLA - DEWI JATENG',
};

export default function LaporPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#EBEBEB] shadow-xs">
        <h1 className="text-xl font-bold text-[#0D2453]">Fitur Sedang Disiapkan</h1>
        <p className="text-xs sm:text-sm text-[#767676] mt-2">
          Halaman pelaporan sedang dalam tahap pengembangan dan sinkronisasi sistem. Anda dapat menggunakan formulir pelaporan di halaman Beranda.
        </p>
        <div className="mt-6">
          <Link
            href="/#buat-laporan"
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs"
          >
            Ke Formulir Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
