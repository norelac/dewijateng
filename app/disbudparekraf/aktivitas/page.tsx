import React from 'react';
import LpjVerificationQueue from '@/components/disbudparekraf/LpjVerificationQueue';

export const metadata = {
  title: 'Aktivitas · DEWI JATENG',
};

/**
 * Layar "Aktivitas" — antrean verifikasi LPJ desa.
 *
 * ponytail: desain `418:565` dkk. belum mencakup layar ini; antrean LPJ dari
 * Fase 1 dipindahkan ke sini agar fitur verifikasi tetap dapat diakses.
 */
export default function AktivitasPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Aktivitas
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Antrean verifikasi dokumen LPJ dan catatan pengawasan terbaru.
        </p>
      </div>

      <LpjVerificationQueue />
    </div>
  );
}
