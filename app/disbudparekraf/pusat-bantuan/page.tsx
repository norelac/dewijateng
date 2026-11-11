import React from 'react';
import PusatBantuanView from '@/components/pengelola/PusatBantuanView';

export const metadata = {
  title: 'Pusat bantuan',
};

/** Pusat bantuan untuk akun Disbudparekraf (ruang admin dinas). */
export default function PusatBantuanDinasPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <PusatBantuanView variant="admin" />
    </div>
  );
}
