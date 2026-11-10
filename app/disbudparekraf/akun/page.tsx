import React from 'react';
import AccountApprovalPanel from '@/components/disbudparekraf/AccountApprovalPanel';

export const metadata = {
  title: 'Akun desa wisata · DEWI JATENG',
};

/**
 * Layar "Akun desa wisata".
 *
 * ponytail: Fase 3 mengganti isi halaman ini dengan desain `418:565` (daftar akun
 * + filter). Untuk sekarang panel persetujuan akun dari Fase 1 dipakai agar
 * fungsi approval tetap hidup dan menu tidak kosong.
 */
export default function AkunDesaPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Akun desa wisata
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Kelola akses pengelola desa wisata dan tinjau pengajuan akun dinas.
        </p>
      </div>

      <AccountApprovalPanel />
    </div>
  );
}
