import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center Disbudparekraf Pemprov Jateng',
  description:
    'Pusat kendali eksekutif pengawasan target 1.000 desa wisata 2027, radar kepatuhan 35 kab/kota, dan rekomendasi hibah sarpras APBD 2027.',
};

export default function DisbudparekrafLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
