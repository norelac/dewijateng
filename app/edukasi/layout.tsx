import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edukasi Hak Warga & Standar Keselamatan Wisata',
  description:
    'Pedoman hak keterbukaan informasi publik (UU KIP), alur penanganan laporan aduan, dan standar keselamatan wahana wisata Jawa Tengah.',
};

export default function EdukasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
