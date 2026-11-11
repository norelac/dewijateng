import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edukasi Hak Warga & Panduan Pelaporan Wisata',
  description:
    'Pedoman hak keterbukaan informasi publik (UU KIP), cara membaca transparansi dana desa wisata, privasi pelapor, dan kontak layanan resmi Jawa Tengah.',
};

export default function EdukasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
