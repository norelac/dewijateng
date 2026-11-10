import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Portal Pengelola & Balai Desa',
  description:
    'Ruang kerja pengelola desa wisata: verifikasi aduan warga, kelola anggaran, dan unggah bukti perbaikan fisik.',
};

export default async function PengelolaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Gerbang peran: hanya akun desa yang boleh membuka ruang pengelola.
  if (!session || session.role !== 'desa') {
    redirect('/login?redirect=/pengelola');
  }

  return <>{children}</>;
}
