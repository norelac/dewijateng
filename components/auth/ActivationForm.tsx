'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import {
  activateVillageAccountAction,
  checkActivationToken,
  type ActivationPreview,
} from '@/app/actions/villageAccountActions';

type Phase = 'checking' | 'invalid' | 'form' | 'done';

/**
 * Layar aktivasi akun pengelola desa dari tautan undangan Disbudparekraf.
 *
 * Bukan bagian dari 19 desain Figma; dibuat supaya tautan `UNDANGAN_AKTIVASI`
 * yang dikirim dari layar "Buat akun desa" punya tujuan yang benar-benar jalan.
 * Gaya mengikuti komponen auth Fase 1 (AuthShell/AuthCard) agar konsisten.
 */
export default function ActivationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [phase, setPhase] = useState<Phase>('checking');
  const [preview, setPreview] = useState<ActivationPreview | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    checkActivationToken(token)
      .then((res) => {
        if (!active) return;
        setPreview(res);
        setPhase(res.valid ? 'form' : 'invalid');
      })
      .catch(() => {
        if (!active) return;
        setPreview({ valid: false, message: 'Gagal memeriksa tautan aktivasi.' });
        setPhase('invalid');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await activateVillageAccountAction(token, password, confirmPassword);
      if (res.success) {
        setPhase('done');
      } else {
        setError(res.message || 'Gagal mengaktifkan akun.');
      }
    } catch {
      setError('Terjadi kesalahan sistem. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'checking') {
    return (
      <AuthCard
        eyebrow="AKTIVASI AKUN"
        title="Memeriksa tautan undangan"
        description="Mohon tunggu sebentar, kami memvalidasi tautan aktivasi Anda."
      >
        <AuthNote tone="info">Tautan hanya bisa dipakai satu kali.</AuthNote>
      </AuthCard>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthCard
        eyebrow="AKTIVASI AKUN"
        title="Tautan tidak berlaku"
        description="Tautan aktivasi sudah dipakai, kedaluwarsa, atau tidak dikenali."
      >
        <AuthNote tone="warning" title="Minta undangan baru">
          {preview?.message ||
            'Hubungi Disbudparekraf Provinsi Jawa Tengah untuk mengirim ulang undangan aktivasi.'}
        </AuthNote>
        <AuthButton href="/login?peran=desa" variant="secondary">
          Kembali ke halaman masuk pengelola
        </AuthButton>
      </AuthCard>
    );
  }

  if (phase === 'done') {
    return (
      <AuthCard
        eyebrow="AKTIVASI AKUN"
        title="Akun berhasil diaktifkan"
        description="Kata sandi Anda sudah tersimpan. Silakan masuk sebagai pengelola desa."
      >
        <AuthNote tone="success" title="Akun siap dipakai">
          Gunakan email <span className="font-semibold">{preview?.email}</span> dan kata sandi yang
          baru Anda tetapkan.
        </AuthNote>
        <AuthButton href="/login?peran=desa">Masuk sebagai pengelola desa</AuthButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="AKTIVASI AKUN"
      title="Aktifkan akun pengelola"
      description={`Halo ${preview?.fullName || 'pengelola'}, tetapkan kata sandi untuk mengaktifkan akun ${preview?.villageName || 'desa wisata'} Anda.`}
    >
      <AuthNote tone="info" title="Akun yang diaktifkan">
        {preview?.email} · {preview?.villageName}
      </AuthNote>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Kata sandi baru"
          name="password"
          type="password"
          placeholder="Minimal 12 karakter"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          revealable
          hint="Minimal 12 karakter, memuat huruf, angka, dan simbol."
        />
        <AuthField
          label="Ulangi kata sandi baru"
          name="confirmPassword"
          type="password"
          placeholder="Ulangi kata sandi"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          autoComplete="new-password"
          revealable
        />

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-3 text-[12px] text-[#991B1B]">
            {error}
          </div>
        )}

        <AuthButton type="submit" disabled={submitting}>
          {submitting ? 'Mengaktifkan akun…' : 'Aktifkan akun'}
        </AuthButton>
      </form>

      <p className="text-[11px] text-[#64748B] leading-[1.5]">
        Dinas tidak pernah mengetahui kata sandi akun desa. Tautan ini berlaku selama 24 jam sejak
        undangan dikirim.
      </p>
    </AuthCard>
  );
}
