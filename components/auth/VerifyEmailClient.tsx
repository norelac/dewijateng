'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import DemoLink from '@/components/auth/DemoLink';
import {
  verifyEmailAction,
  resendVerificationAction,
} from '@/app/actions/registrationActions';

/**
 * Layar "Verifikasi email Anda" (PENDAFTARAN · LANGKAH 1 DARI 2).
 * - Tanpa token: menunggu pengguna membuka tautan di email.
 * - Dengan token: memverifikasi lalu lanjut ke layar "Pengajuan sedang ditinjau".
 */
export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [changingEmail, setChangingEmail] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(token));

  // Tautan demo dari langkah daftar (mode tanpa SMTP).
  useEffect(() => {
    const stored = sessionStorage.getItem('dewi_dev_link');
    if (stored) setDevLink(stored);
  }, []);

  // Bila halaman dibuka dari tautan email, langsung verifikasi.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      const res = await verifyEmailAction(token);
      if (cancelled) return;
      if (res.success) {
        sessionStorage.removeItem('dewi_dev_link');
        router.replace('/daftar/ditinjau');
      } else {
        setError(res.message || 'Tautan verifikasi tidak valid.');
        setVerifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('email', email);
      const res = await resendVerificationAction(null, formData);
      if (res.success) {
        setNotice(res.message || 'Tautan verifikasi baru sudah dikirim.');
        if (res.devLink) setDevLink(res.devLink);
      } else {
        setError(res.message || 'Gagal mengirim ulang email verifikasi.');
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthCard
        eyebrow="PENDAFTARAN · LANGKAH 1 DARI 2"
        title="Memverifikasi email Anda"
        description="Mohon tunggu, kami sedang memeriksa tautan verifikasi."
      >
        <AuthNote>Jangan tutup halaman ini.</AuthNote>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="PENDAFTARAN · LANGKAH 1 DARI 2"
      title="Verifikasi email Anda"
      description="Satu langkah lagi untuk mengajukan akses admin dinas."
    >
      {error && (
        <AuthNote tone="warning" title="Verifikasi belum berhasil">
          {error}
        </AuthNote>
      )}
      {notice && <AuthNote tone="success">{notice}</AuthNote>}

      <AuthNote title="Tautan verifikasi telah dikirim">
        <span className="break-all">{email || 'alamat email Anda'}</span>
      </AuthNote>

      <div className="flex flex-col gap-2 text-[13px] text-[#64748B] leading-[1.5]">
        <p>
          Buka email dari DEWI JATENG, lalu pilih &ldquo;Verifikasi email&rdquo;. Tautan berlaku
          selama 24 jam.
        </p>
        <p>
          Belum menerima email? Periksa folder spam dan pastikan alamat email yang digunakan sudah
          benar.
        </p>
      </div>

      {devLink && <DemoLink href={devLink} label="Buka tautan verifikasi" />}

      {changingEmail ? (
        <form onSubmit={handleResend} className="flex flex-col gap-[18px]">
          <AuthField
            label="Alamat email"
            name="email"
            type="email"
            placeholder="nama@instansi.go.id"
            value={email}
            onChange={setEmail}
            required
          />
          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
          </AuthButton>
          <button
            type="button"
            onClick={() => setChangingEmail(false)}
            className="text-[12px] font-semibold text-[#0D2453]"
          >
            Batal
          </button>
        </form>
      ) : (
        <form onSubmit={handleResend} className="flex flex-col gap-3">
          <AuthButton type="submit" disabled={loading || !email}>
            {loading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
          </AuthButton>
          <button
            type="button"
            onClick={() => setChangingEmail(true)}
            className="text-[12px] font-semibold text-[#0D2453] py-1"
          >
            Gunakan alamat email lain
          </button>
        </form>
      )}

      <div className="h-px w-full bg-[#E6ECF5]" />

      <p className="text-[12px] text-[#64748B] leading-[1.5]">
        Email terverifikasi akan diteruskan ke proses persetujuan administrator.
      </p>

      <p className="text-[12px] text-center text-[#0D2453] font-medium">
        <Link href="/login" className="font-semibold">
          Kembali ke halaman masuk
        </Link>
      </p>
    </AuthCard>
  );
}
