import type { Metadata } from 'next';
import { Inter, MonteCarlo } from 'next/font/google';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const monteCarlo = MonteCarlo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-montecarlo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'DEWI JATENG - Dari Laporan, Menjadi Perbaikan',
    template: '%s · DEWI JATENG',
  },
  description:
    'Platform keterbukaan dokumen LPJ bantuan keuangan sarpras dan tindak lanjut aduan fasilitas desa wisata di Jawa Tengah.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`scroll-smooth ${inter.variable} ${monteCarlo.variable}`}
    >
      <body className="bg-[#F7F9FC] text-[#0D2453] font-sans antialiased min-h-screen flex flex-col selection:bg-blue-100 selection:text-[#0D2453]">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
