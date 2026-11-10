'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import DemoLink from '@/components/auth/DemoLink';
import { requestPasswordResetAction } from '@/app/actions/passwordRecoveryActions';

/**
 * Layar "Buka tautan dari DEWI JATENG" — konfirmasi tautan pemulihan terkirim.
 * Menampilkan tautan demo bila SMTP belum dikonfigurasi.
 */
export default function ResetLinkSentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [devLink, setDevLink] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tautan demo dioper dari langkah sebelumnya lewat sessionStorage.
  useEffect(() => {
    const stored = sessionStorage.getItem('dewi_reset_link');
    if (stored) setDevLink(stored);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('email', email);
      const res = await requestPasswordResetAction(null, formData);
      if (res.success) {
        setNotice(res.message || 'Tautan pemulihan baru sudah dikirim.');
        if (res.devLink) {
          sessionStorage.setItem('dewi_reset_link', res.devLink);
          setDevLink(res.devLink);
        }
      } else {
        setError(res.message || 'Gagal mengirim ulang tautan pemulihan.');
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
      title="Buka tautan dari DEWI JATENG"
      description="Tautan pemulihan kata sandi telah kami kirim ke email terdaftar."
    >
      {error && (
        <AuthNote tone="warning" className="!p-3">
          {error}
        </AuthNote>
      )}
      {notice && <AuthNote tone="success">{notice}</AuthNote>}

      <AuthNote title="Tautan pemulihan terkirim">
        <span className="break-all">{email || 'alamat email terdaftar'}</span>
      </AuthNote>

      <div className="flex flex-col gap-2 text-[13px] text-[#64748B] leading-[1.5]">
        <p>
          Buka email tersebut, lalu pilih &ldquo;Buat kata sandi baru&rdquo;. Tautan berlaku
          selama 30 menit dan hanya dapat dipakai satu kali.
        </p>
        <p>
          Tidak menemukan email? Periksa folder spam, atau kirim ulang tautan di bawah ini.
        </p>
      </div>

      {devLink && <DemoLink href={devLink} label="Buka tautan pemulihan" />}

      <div className="flex flex-col gap-3">
        <AuthButton type="button" onClick={handleResend} disabled={loading || !email}>
          {loading ? 'Mengirim...' : 'Kirim ulang tautan'}
        </AuthButton>
        <AuthButton
          type="button"
          variant="secondary"
          onClick={() => router.push('/lupa-kata-sandi')}
        >
          Gunakan email lain
        </AuthButton>
      </div>

      <div className="h-px w-full bg-[#E6ECF5]" />

      <p className="text-[12px] font-semibold text-[#0D2453] text-center">
        <Link href="/login">Kembali ke halaman masuk</Link>
      </p>
    </AuthCard>
  );
}
