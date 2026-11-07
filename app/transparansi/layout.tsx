import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparansi Dana & Audit LPJ Belanja Modal',
  description:
    'Pantau alokasi, realisasi, dan audit Standar Satuan Harga (SSH) belanja sarana prasarana desa wisata Jawa Tengah.',
};

export default function TransparansiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
