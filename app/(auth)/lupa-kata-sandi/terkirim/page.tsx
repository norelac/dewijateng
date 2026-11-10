import React, { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';
import ResetLinkSentClient from '@/components/auth/ResetLinkSentClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tautan pemulihan terkirim',
};

export default function ResetLinkSentPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetLinkSentClient />
      </Suspense>
    </AuthShell>
  );
}
