import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Telusuri Laporan & Bukti Perbaikan (Proof-of-Fix)',
  description:
    'Lacak status tiket aduan masyarakat, timeline penanganan, dan komparasi foto before-after perbaikan fasilitas.',
};

export default function LaporLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
