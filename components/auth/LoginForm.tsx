'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import { loginAction } from '@/app/actions/authActions';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const isDesaEntry = searchParams.get('peran') === 'desa';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('identifier', identifier);
      formData.set('password', password);
      formData.set('peran', isDesaEntry ? 'desa' : 'admin');
      if (remember) formData.set('remember', 'on');

      const res = await loginAction(null, formData);
      if (res.success && res.redirectTo) {
        router.push(redirectTo || res.redirectTo);
        router.refresh();
      } else if (res.redirectTo) {
        setError(res.message || null);
        router.push(res.redirectTo);
      } else {
        setError(res.message || 'Email atau kata sandi tidak sesuai');
      }
    } catch {
      setError('Terjadi kendala jaringan saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headerRight={
        <div className="flex items-center gap-[14px]">
          <span className="hidden sm:inline text-[13px] text-[#64748B]">Belum punya akun?</span>
          <Link
            href="/daftar"
            className="h-[40px] px-[20px] inline-flex items-center justify-center rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453]"
          >
            Daftar
          </Link>
        </div>
      }
    >
      <AuthCard
        eyebrow={isDesaEntry ? 'AKUN PENGELOLA DESA' : 'AKUN DISBUDPAREKRAF'}
        title={isDesaEntry ? 'Masuk ke ruang pengelola' : 'Masuk ke ruang admin dinas'}
        description={
          isDesaEntry
            ? 'Kelola informasi dan laporan desa wisata Anda.'
            : 'Kelola akun dan pantau desa wisata di wilayah Anda.'
        }
      >
        {error && (
          <AuthNote tone="warning" className="!p-3">
            {error}
          </AuthNote>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <AuthField
            label={isDesaEntry ? 'Email pengelola' : 'Email dinas'}
            name="identifier"
            type="text"
            placeholder={isDesaEntry ? 'email pengelola desa' : 'nama@instansi.go.id'}
            value={identifier}
            onChange={setIdentifier}
            autoComplete="username"
            required
          />

          <AuthField
            label="Kata sandi"
            name="password"
            type="password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            revealable
            required
          />

          <div className="flex items-center justify-between gap-4">
            <AuthCheckbox
              name="remember"
              label="Ingat saya"
              checked={remember}
              onChange={setRemember}
            />
            <Link
              href="/lupa-kata-sandi"
              className="text-[12px] font-semibold text-[#0D2453] shrink-0"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </AuthButton>
        </form>

        <p className="text-[12px] font-medium text-[#0D2453] text-center">
          Belum memiliki akun dinas?{' '}
          <Link href="/daftar" className="font-semibold">
            Daftar akun
          </Link>
        </p>

        <div className="h-px w-full bg-[#E6ECF5]" />

        <p className="text-[12px] font-semibold text-[#0D2453] text-center">
          Anda pengelola desa?{' '}
          <Link href="/login?peran=desa" className="font-semibold">
            Masuk pengelola desa
          </Link>
        </p>

        <AuthNote>Akses dinas diberikan kepada petugas resmi yang telah diverifikasi.</AuthNote>
      </AuthCard>
    </AuthShell>
  );
}
