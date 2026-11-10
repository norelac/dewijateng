'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import { requestPasswordResetAction } from '@/app/actions/passwordRecoveryActions';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('email', email);
      const res = await requestPasswordResetAction(null, formData);

      if (res.success && res.redirectTo) {
        if (res.devLink) sessionStorage.setItem('dewi_reset_link', res.devLink);
        router.push(res.redirectTo);
      } else {
        setError(res.message || 'Gagal memproses permintaan pemulihan.');
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="PEMULIHAN AKUN"
      title="Lupa kata sandi?"
      description="Masukkan email akun untuk menerima tautan pemulihan."
    >
      {error && (
        <AuthNote tone="warning" className="!p-3">
          {error}
        </AuthNote>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <AuthField
          label="Email akun"
          name="email"
          type="email"
          placeholder="nama@instansi.go.id atau email pengelola"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <AuthNote title="Untuk dinas dan pengelola desa">
          Gunakan email yang terdaftar pada akun Anda. Tautan pemulihan berlaku selama 30 menit.
        </AuthNote>

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Mengirim...' : 'Kirim tautan pemulihan'}
        </AuthButton>
      </form>

      <p className="text-[12px] font-semibold text-[#0D2453] text-center">
        <Link href="/login">Kembali ke halaman masuk</Link>
      </p>
    </AuthCard>
  );
}
