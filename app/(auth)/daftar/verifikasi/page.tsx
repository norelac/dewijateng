import React, { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import VerifyEmailClient from '@/components/auth/VerifyEmailClient';

export const metadata = {
  title: 'Verifikasi email',
};

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
