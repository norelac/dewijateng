import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Command Center Disbudparekraf Pemprov Jateng',
  description:
    'Pusat kendali eksekutif pengawasan target 1.000 desa wisata 2027, radar kepatuhan 35 kab/kota, dan rekomendasi hibah sarpras APBD 2027.',
};

export default function DisporaparLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSession();

  // Gerbang peran: hanya sesi PEMBINA yang boleh membuka command center.
  if (!session || session.role !== 'PEMBINA') {
    redirect('/masuk?role=pembina&next=/disporapar');
  }

  return <>{children}</>;
}
