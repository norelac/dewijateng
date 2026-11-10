import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import AuthButton from '@/components/auth/AuthButton';
import AuthNote from '@/components/auth/AuthNote';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pengajuan sedang ditinjau',
};

/** Layar "Pengajuan sedang ditinjau" (PENDAFTARAN · LANGKAH 2 DARI 2). */
export default async function PendingReviewPage() {
  const pendingId = cookies().get('dewi_pending')?.value;

  let identity: {
    institution: string | null;
    regency: string | null;
    email: string | null;
  } | null = null;

  if (pendingId) {
    try {
      const rows = await db
        .select({
          institution: users.institution,
          regency: users.regency,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, pendingId))
        .limit(1);
      identity = rows[0] ?? null;
    } catch (err) {
      console.error('[daftar/ditinjau] gagal memuat identitas pengajuan:', err);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="PENDAFTARAN · LANGKAH 2 DARI 2"
        title="Pengajuan sedang ditinjau"
        description="Email Anda telah terverifikasi. Akses admin belum aktif."
      >
        <AuthNote tone="warning" title="Menunggu persetujuan administrator">
          Pemberitahuan hasil pengajuan akan dikirim ke email dinas Anda.
        </AuthNote>

        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-[#0D2453] leading-[1.5]">
            Identitas pengajuan
          </p>
          <div className="text-[13px] text-[#64748B] leading-[1.7]">
            <p>Instansi: {identity?.institution || '—'}</p>
            <p>Wilayah tugas: {identity?.regency || '—'}</p>
            <p className="break-all">Email: {identity?.email || '—'}</p>
          </div>
        </div>

        <div className="h-px w-full bg-[#E6ECF5]" />

        <p className="text-[13px] text-[#64748B] leading-[1.5]">
          Anda dapat masuk ke dashboard setelah pengajuan disetujui. Jika memerlukan bantuan,
          hubungi administrator layanan.
        </p>

        <div className="flex flex-col gap-3">
          <AuthButton href="/login">Kembali ke halaman masuk</AuthButton>
          <a
            href="mailto:dewijateng@jatengprov.go.id"
            className="h-[44px] rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] inline-flex items-center justify-center"
          >
            Hubungi pusat bantuan
          </a>
        </div>

        <p className="text-[11px] text-[#64748B] text-center">
          <Link href="/" className="font-medium text-[#0D2453]">
            Kembali ke beranda publik
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
