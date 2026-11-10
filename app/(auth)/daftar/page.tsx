import React from 'react';
import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daftar akun Disbudparekraf',
};

/** Ambil daftar kabupaten/kota dari data desa wisata untuk pilihan "Wilayah tugas". */
async function getRegencies(): Promise<string[]> {
  try {
    const res = await query<{ regency: string }>(
      `SELECT DISTINCT regency FROM tourist_villages WHERE regency IS NOT NULL ORDER BY regency`
    );
    return res.rows.map((r) => r.regency);
  } catch (err) {
    console.error('[daftar] gagal memuat daftar wilayah:', err);
    return [];
  }
}

export default async function RegisterPage() {
  const regencies = await getRegencies();

  return (
    <AuthShell>
      <RegisterForm regencies={regencies} />
    </AuthShell>
  );
}
