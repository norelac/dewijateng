import React from 'react';
import PengaturanDinasView from '@/components/disbudparekraf/dashboard/PengaturanDinasView';

export const metadata = {
  title: 'Pengaturan · DEWI JATENG',
};

/** Layar "Pengaturan" ruang admin dinas. */
export default function PengaturanDinasPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <PengaturanDinasView />
    </div>
  );
}
