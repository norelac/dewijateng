import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ruang Admin Dinas',
  description: 'Masuk, daftar, dan pulihkan akses akun Disbudparekraf DEWI JATENG.',
};

/**
 * Layout khusus halaman autentikasi. Memakai Inter (mengikuti desain Figma),
 * terpisah dari Plus Jakarta Sans yang dipakai halaman publik & dashboard.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={inter.variable}
      style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}
