import React from 'react';
import Link from 'next/link';
import VillageAccountTable from '@/components/disbudparekraf/akun/VillageAccountTable';
import {
  listVillageAccounts,
  type VillageAccountStatus,
} from '@/app/actions/villageAccountActions';

export const metadata = {
  title: 'Akun desa wisata · DEWI JATENG',
};

// Daftar akun + hitungan filter dibaca dari database setiap permintaan.
export const dynamic = 'force-dynamic';

const VALID_STATUS: (VillageAccountStatus | 'SEMUA')[] = [
  'SEMUA',
  'AKTIF',
  'MENUNGGU_AKTIVASI',
  'NONAKTIF',
];

/** Layar "Kelola akun desa wisata" (Figma 418:565). */
export default async function AkunDesaPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; kabupaten?: string; page?: string };
}) {
  const rawStatus = (searchParams.status || 'SEMUA').toUpperCase();
  const status = VALID_STATUS.includes(rawStatus as VillageAccountStatus | 'SEMUA')
    ? (rawStatus as VillageAccountStatus | 'SEMUA')
    : 'SEMUA';
  const q = searchParams.q || '';
  const kabupaten = searchParams.kabupaten || '';
  const page = Number.parseInt(searchParams.page || '1', 10) || 1;

  const data = await listVillageAccounts({ status, q, kabupaten, page });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
            Kelola akun desa wisata
          </h1>
          <p className="text-[#64748B] text-[13px] leading-[1.5]">
            Buat dan kelola akun resmi pengelola desa wisata.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/disbudparekraf/akun/pengajuan-dinas"
            className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors"
          >
            Pengajuan akun dinas
          </Link>
          <Link
            href="/disbudparekraf/akun/buat"
            className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#163B80] transition-colors"
          >
            Buat akun desa
          </Link>
        </div>
      </div>

      <VillageAccountTable
        data={data}
        activeStatus={status}
        activeQuery={q}
        activeKabupaten={kabupaten}
      />

      {/* Kebijakan pengelolaan akun */}
      <div className="bg-[#EDF3FC] rounded-[14px] px-6 py-[18px] flex flex-col gap-2">
        <p className="text-[#0D2453] text-[14px] font-semibold leading-[1.5]">
          Akses terpusat, pengelolaan tetap di desa
        </p>
        <p className="text-[#64748B] text-[13px] leading-[1.5] max-w-[1000px]">
          Disbudparekraf membuat akun dan mengirim undangan. Pengelola menetapkan kata sandi
          sendiri; dinas tidak perlu mengetahui kata sandi akun desa.
        </p>
      </div>

      <div className="w-full flex items-center justify-between text-[11px] text-[#94A3B8] border-t border-[#E6ECF5] pt-4 pb-2">
        <span>© 2026 DEWI JATENG</span>
        <span>
          Diperbarui{' '}
          {new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
          }).format(new Date())}
        </span>
      </div>
    </div>
  );
}
