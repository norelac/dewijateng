'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-[#0D2453]">Terjadi Kendala Teknis</h2>
      <p className="text-sm text-[#767676] mt-2 max-w-md">
        {error?.message || 'Gagal memuat halaman. Silakan muat ulang halaman ini.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-6 py-2.5 rounded-full bg-[#0D2453] text-white font-bold text-xs hover:bg-[#132d66] transition-colors"
      >
        Muat Ulang
      </button>
    </div>
  );
}
