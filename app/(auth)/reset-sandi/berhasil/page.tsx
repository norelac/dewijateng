import React from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';

export const metadata = {
  title: 'Kata sandi berhasil diperbarui',
};

/** Layar "Kata sandi berhasil diperbarui". */
export default function ResetSuccessPage() {
  return (
    <AuthShell>
      <AuthCard
        eyebrow="PEMULIHAN AKUN"
        title="Kata sandi berhasil diperbarui"
        description="Akun Anda sudah bisa dipakai dengan kata sandi baru."
      >
        <AuthNote tone="success" title="Kata sandi baru aktif">
          Demi keamanan, semua tautan pemulihan sebelumnya otomatis tidak berlaku.
        </AuthNote>

        <div className="flex flex-col gap-3">
          <AuthButton href="/login">Masuk Disbudparekraf</AuthButton>
          <AuthButton href="/login?peran=desa" variant="secondary">
            Masuk pengelola desa
          </AuthButton>
        </div>

        <div className="h-px w-full bg-[#E6ECF5]" />

        <p className="text-[12px] text-[#64748B] text-center">
          <Link href="/" className="font-medium text-[#0D2453]">
            Kembali ke beranda publik
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
