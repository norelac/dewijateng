import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Montserrat, MonteCarlo } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const monteCarlo = MonteCarlo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-montecarlo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DEWI JATENG - Dari Laporan, Menjadi Perbaikan',
  description:
    'Pantau penggunaan dana desa secara terbuka dan laporkan kendala fasilitas wisata secara cepat.',
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
      className={`scroll-smooth ${plusJakartaSans.variable} ${montserrat.variable} ${monteCarlo.variable}`}
    >
      <body className="bg-[#F7F9FC] text-[#0D2453] font-sans antialiased min-h-screen flex flex-col selection:bg-blue-100 selection:text-[#0D2453]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <Navbar />
        </div>

        <main className="flex-grow">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
