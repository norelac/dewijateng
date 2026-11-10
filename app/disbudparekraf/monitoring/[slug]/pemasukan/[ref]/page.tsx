import React from 'react';
import TransactionDetailScreen from '@/components/disbudparekraf/monitoring/TransactionDetailScreen';

export const metadata = {
  title: 'Detail pemasukan desa · DEWI JATENG',
};

export const dynamic = 'force-dynamic';

/** Layar "Detail pemasukan desa" (Figma 422:848). */
export default async function DetailPemasukanPage({
  params,
  searchParams,
}: {
  params: { slug: string; ref: string };
  searchParams: { periode?: string };
}) {
  return (
    <TransactionDetailScreen
      slug={params.slug}
      type="PEMASUKAN"
      referenceCode={params.ref.toUpperCase()}
      periode={searchParams.periode}
    />
  );
}
