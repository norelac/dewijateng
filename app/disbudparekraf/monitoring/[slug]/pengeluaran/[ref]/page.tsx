import React from 'react';
import TransactionDetailScreen from '@/components/disbudparekraf/monitoring/TransactionDetailScreen';

export const metadata = {
  title: 'Detail pengeluaran desa',
};

export const dynamic = 'force-dynamic';

/** Layar "Detail pengeluaran desa" (Figma 422:909). */
export default async function DetailPengeluaranPage({
  params,
  searchParams,
}: {
  params: { slug: string; ref: string };
  searchParams: { periode?: string };
}) {
  return (
    <TransactionDetailScreen
      slug={params.slug}
      type="PENGELUARAN"
      referenceCode={params.ref.toUpperCase()}
      periode={searchParams.periode}
    />
  );
}
