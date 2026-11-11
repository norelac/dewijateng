'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthSelect from '@/components/auth/AuthSelect';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import DemoLink from '@/components/auth/DemoLink';
import { registerAdminAction } from '@/app/actions/registrationActions';

interface RegisterFormProps {
  regencies: string[];
}

export default function RegisterForm({ regencies }: RegisterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    nip: '',
    institution: '',
    regency: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevLink(null);
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.set(key, value));
      if (agree) formData.set('agree', 'on');

      const res = await registerAdminAction(null, formData);
      if (res.success && res.redirectTo) {
        if (res.devLink) sessionStorage.setItem('dewi_dev_link', res.devLink);
        router.push(res.redirectTo);
      } else {
        setError(res.message || 'Pendaftaran gagal. Periksa kembali data Anda.');
        if (res.devLink) setDevLink(res.devLink);
      }
    } catch {
      setError('Terjadi kendala jaringan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      eyebrow="PENDAFTARAN AKUN DINAS"
      title="Daftar akun Disbudparekraf"
      description="Gunakan identitas petugas dan email resmi instansi."
      width={600}
    >
      {error && (
        <AuthNote tone="warning" className="!p-3">
          {error}
        </AuthNote>
      )}
      {devLink && <DemoLink href={devLink} label="Buka tautan verifikasi" />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            label="Nama lengkap *"
            name="fullName"
            placeholder="Nama sesuai identitas"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
          <AuthField
            label="NIP *"
            name="nip"
            placeholder="Masukkan NIP"
            value={form.nip}
            onChange={set('nip')}
            required
          />
        </div>

        <AuthField
          label="Nama instansi *"
          name="institution"
          placeholder="Disbudparekraf"
          value={form.institution}
          onChange={set('institution')}
          required
        />

        <AuthSelect
          label="Wilayah tugas *"
          name="regency"
          placeholder="Pilih kabupaten / kota"
          value={form.regency}
          onChange={set('regency')}
          options={regencies.map((r) => ({ value: r, label: r }))}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            label="Email dinas *"
            name="email"
            type="email"
            placeholder="nama@instansi.go.id"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
          <AuthField
            label="Nomor WhatsApp *"
            name="whatsapp"
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            autoComplete="tel"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            label="Kata sandi *"
            name="password"
            type="password"
            placeholder="Minimal 12 karakter"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            revealable
            required
          />
          <AuthField
            label="Ulangi kata sandi *"
            name="confirmPassword"
            type="password"
            placeholder="Ulangi kata sandi"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            autoComplete="new-password"
            revealable
            required
          />
        </div>

        <p className="text-[11px] text-[#64748B] leading-[1.5]">
          Gunakan minimal 12 karakter dengan huruf, angka, dan simbol.
        </p>

        <AuthCheckbox
          name="agree"
          checked={agree}
          onChange={setAgree}
          label="Saya menyetujui ketentuan penggunaan dan kebijakan privasi DEWI JATENG."
          required
        />

        <AuthNote>
          Pendaftaran tidak langsung memberikan akses admin. Verifikasi email dan persetujuan
          administrator diperlukan.
        </AuthNote>

        <AuthButton type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Daftar akun dinas'}
        </AuthButton>
      </form>

      <p className="text-[12px] font-medium text-[#0D2453] text-center">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="font-semibold">
          Masuk
        </Link>
      </p>
    </AuthCard>
  );
}
