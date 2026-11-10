import React from 'react';
import TransactionListScreen from '@/components/disbudparekraf/monitoring/TransactionListScreen';

export const metadata = {
  title: 'Pengeluaran desa · DEWI JATENG',
};

export const dynamic = 'force-dynamic';

/** Layar "Pengeluaran Desa" (Figma 422:787). */
export default async function PengeluaranPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { periode?: string; q?: string; kategori?: string; bukti?: string; page?: string };
}) {
  return (
    <TransactionListScreen slug={params.slug} type="PENGELUARAN" searchParams={searchParams} />
  );
}
