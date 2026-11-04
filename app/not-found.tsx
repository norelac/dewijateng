import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-3xl font-extrabold text-[#0D2453]">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-[#767676] mt-2 max-w-md">
        Halaman yang Anda cari tidak tersedia atau sedang dalam perbaikan.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2.5 rounded-full bg-[#0D2453] text-white font-bold text-xs hover:bg-[#132d66] transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
