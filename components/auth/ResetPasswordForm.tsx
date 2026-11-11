'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import {
  checkResetToken,
  resetPasswordAction,
} from '@/app/actions/passwordRecoveryActions';

type Phase = 'checking' | 'valid' | 'invalid';

/**
 * Layar "Buat kata sandi baru". Memvalidasi token di URL lalu menampilkan form
 * dua kolom kata sandi. Sukses mengarah ke /reset-sandi/berhasil.
 */
export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validasi token sekali saat halaman dibuka.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        if (!cancelled) setPhase('invalid');
        return;
      }
      const res = await checkResetToken(token);
      if (cancelled) return;
      if (res.valid) {
        setEmail(res.email ?? null);
        setPhase('valid');
      } else {
        setPhase('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('token', token);
      formData.set('password', password);
      formData.set('confirmPassword', confirmPassword);

      const res = await resetPasswordAction(null, formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else {
        setError(res.message || 'Gagal menyimpan kata sandi baru.');
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'checking') {
    return (
      <AuthCard
        eyebrow="PEMULIHAN AKUN"
        title="Memeriksa tautan pemulihan"
        description="Mohon tunggu sebentar."
      >
        <AuthNote>Jangan tutup halaman ini.</AuthNote>
      </AuthCard>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthCard
        eyebrow="PEMULIHAN AKUN"
        title="Tautan tidak berlaku lagi"
        description="Tautan pemulihan sudah kedaluwarsa atau pernah dipakai."
      >
        <AuthNote tone="warning" title="Minta tautan baru">
          Tautan pemulihan hanya berlaku 30 menit dan sekali pakai. Silakan minta tautan baru
          untuk melanjutkan.
        </AuthNote>

        <div className="flex flex-col gap-3">
          <AuthButton href="/lupa-kata-sandi">Minta tautan baru</AuthButton>
          <AuthButton href="/login" variant="secondary">
            Kembali ke halaman masuk
          </AuthButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="PEMULIHAN AKUN"
      title="Buat kata sandi baru"
      description={
        email
          ? `Untuk akun ${email}`
          : 'Masukkan kata sandi baru untuk akun Anda.'
      }
    >
      {error && (
        <AuthNote tone="warning" className="!p-3">
          {error}
        </AuthNote>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <AuthField
          label="Kata sandi baru"
          name="password"
          type="password"
          placeholder="Minimal 12 karakter"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          revealable
          required
        />
        <AuthField
          label="Ulangi kata sandi baru"
          name="confirmPassword"
          type="password"
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          revealable
          required
        />

        <AuthNote title="Ketentuan kata sandi">
          Minimal 12 karakter, serta memuat huruf, angka, dan simbol.
        </AuthNote>

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan kata sandi baru'}
        </AuthButton>
      </form>

      <p className="text-[12px] font-semibold text-[#0D2453] text-center">
        <Link href="/login">Kembali ke halaman masuk</Link>
      </p>
    </AuthCard>
  );
}
