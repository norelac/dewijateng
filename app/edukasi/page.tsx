import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edukasi & Panduan - DEWI JATENG',
  description: 'Pusat Literasi Hukum & Pedoman Teknis K3 - DEWI JATENG',
};

export default function EdukasiPage() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 py-20 text-center">
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#EBEBEB] shadow-xs">
        <h1 className="text-xl font-bold text-[#0D2453]">Fitur Sedang Disiapkan</h1>
        <p className="text-xs sm:text-sm text-[#767676] mt-2">
          Materi edukasi dan pedoman teknis sedang dalam proses penyesuaian regulasi Disporapar Jawa Tengah.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-full text-xs font-bold bg-[#0D2453] text-white hover:bg-[#132d66] transition-all shadow-xs"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
