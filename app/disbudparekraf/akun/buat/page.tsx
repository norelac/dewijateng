import React from 'react';
import CreateVillageAccountForm from '@/components/disbudparekraf/akun/CreateVillageAccountForm';
import { listRegenciesAction } from '@/app/actions/villageAccountActions';

export const metadata = {
  title: 'Buat akun desa wisata',
};

export const dynamic = 'force-dynamic';

/** Layar "Buat akun desa wisata" (Figma 418:569). */
export default async function BuatAkunDesaPage() {
  const regencies = await listRegenciesAction();

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
      <CreateVillageAccountForm regencies={regencies} />
    </div>
  );
}
