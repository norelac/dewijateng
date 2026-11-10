import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccountApprovalPanel from '@/components/disbudparekraf/AccountApprovalPanel';

export const metadata = {
  title: 'Pengajuan akun dinas · DEWI JATENG',
};

/**
 * Persetujuan akun Disbudparekraf yang mendaftar mandiri (Fase 1).
 *
 * Tidak ada pada desain Fase 3, jadi dipindahkan ke sub-halaman tersendiri agar
 * fungsi persetujuan tetap hidup tanpa mengotori layar daftar akun desa.
 */
export default function PengajuanAkunDinasPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-2">
        <Link
          href="/disbudparekraf/akun"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0D2453] hover:underline w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke akun desa wisata
        </Link>
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Pengajuan akun dinas
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Tinjau pendaftaran akun Disbudparekraf yang masuk lewat halaman daftar.
        </p>
      </div>

      <AccountApprovalPanel />
    </div>
  );
}
