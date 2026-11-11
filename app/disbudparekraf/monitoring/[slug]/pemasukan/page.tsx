import React from 'react';
import TransactionListScreen from '@/components/disbudparekraf/monitoring/TransactionListScreen';

export const metadata = {
  title: 'Pemasukan desa · DEWI JATENG',
};

export const dynamic = 'force-dynamic';

/** Layar "Pemasukan Desa" (Figma 422:726). */
export default async function PemasukanPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { periode?: string; q?: string; kategori?: string; bukti?: string; page?: string };
}) {
  return (
    <TransactionListScreen slug={params.slug} type="PEMASUKAN" searchParams={searchParams} />
  );
}
