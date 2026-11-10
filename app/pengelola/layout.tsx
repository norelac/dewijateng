import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Portal Pengelola & Balai Desa',
  description:
    'Ruang kerja pengelola desa wisata: verifikasi aduan warga, kelola anggaran, dan unggah bukti perbaikan fisik.',
};

export default function PengelolaLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();

  // Gerbang peran: tanpa sesi PENGELOLA, alihkan ke halaman masuk.
  if (!session) {
    redirect('/masuk?role=pengelola&next=/pengelola');
  }

  return <>{children}</>;
}
