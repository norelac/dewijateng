import React, { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import AuthCard from '@/components/auth/AuthCard';
import ActivationForm from '@/components/auth/ActivationForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Aktivasi akun pengelola desa',
};

/** Layar aktivasi akun dari tautan undangan Disbudparekraf. */
export default function AktivasiPage() {
  return (
    <AuthShell
      headerRight={
        <a
          href="mailto:dewijateng@jatengprov.go.id"
          className="text-[13px] text-[#64748B] hover:text-[#0D2453]"
        >
          Butuh bantuan?
        </a>
      }
    >
      <Suspense
        fallback={
          <AuthCard
            eyebrow="AKTIVASI AKUN"
            title="Memeriksa tautan undangan"
            description="Mohon tunggu sebentar."
          >
            <div className="h-[44px]" />
          </AuthCard>
        }
      >
        <ActivationForm />
      </Suspense>
    </AuthShell>
  );
}
