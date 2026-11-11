import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardShell from '@/components/disbudparekraf/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'Dashboard Disbudparekraf Pemprov Jateng',
  description:
    'Pantau desa wisata dan kelola akses pengelola dalam satu tempat.',
};

export default async function DisbudparekrafLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Gerbang peran: hanya akun Disbudparekraf yang boleh membuka ruang admin dinas.
  if (!session || session.role !== 'disbudparekraf') {
    redirect('/login?redirect=/disbudparekraf');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
