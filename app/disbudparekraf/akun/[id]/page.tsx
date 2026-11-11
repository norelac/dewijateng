import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import VillageAccountDetailView from '@/components/disbudparekraf/akun/VillageAccountDetailView';
import { getVillageAccountDetail } from '@/app/actions/villageAccountActions';

export const metadata = {
  title: 'Detail akun desa wisata',
};

export const dynamic = 'force-dynamic';

/** Layar "Detail akun desa wisata" (Figma 418:573). */
export default async function DetailAkunDesaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; demo?: string };
}) {
  const detail = await getVillageAccountDetail(params.id);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <Link
        href="/disbudparekraf/akun"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0D2453] hover:underline w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke akun desa wisata
      </Link>

      <VillageAccountDetailView
        detail={detail}
        justCreated={searchParams.created === '1'}
        demoLink={searchParams.demo || null}
      />
    </div>
  );
}
