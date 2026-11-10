import React from 'react';
import Link from 'next/link';
import type { VillageAccountStats } from '@/app/actions/villageAccountActions';

type AksesCard = {
  label: string;
  value: string;
  note: string;
  variant: 'navy' | 'white';
};

function Card({ card }: { card: AksesCard }) {
  const navy = card.variant === 'navy';
  return (
    <div
      className={`rounded-[14px] h-[130px] p-5 flex flex-col justify-between ${
        navy ? 'bg-[#0D2453] text-white' : 'bg-white border border-[#E6ECF5] shadow-xs'
      }`}
    >
      <span className={`text-[12px] ${navy ? 'text-white' : 'text-[#64748B]'}`}>{card.label}</span>
      <span
        className={`text-[32px] font-semibold leading-[1.2] tracking-[-0.8px] ${
          navy ? 'text-white' : 'text-[#0D2453]'
        }`}
      >
        {card.value}
      </span>
      <span className={`text-[11px] ${navy ? 'text-white/90' : 'text-[#64748B]'}`}>{card.note}</span>
    </div>
  );
}

/**
 * Bagian "Pengelolaan akun desa": 4 kartu, ringkasan kesiapan, tindak lanjut
 * (Figma 422:1000–418:1068). Angka dibaca dari database via
 * `getVillageAccountStats()`.
 */
export default function PengelolaanAkunSection({ stats }: { stats: VillageAccountStats }) {
  const { aktif, menunggu, nonaktif, total, regencyCount } = stats;
  const aktifPct = total > 0 ? Math.round((aktif / total) * 100) : 0;

  const cards: AksesCard[] = [
    {
      label: 'Desa terdaftar',
      value: String(total),
      note: `Cakupan ${regencyCount} kabupaten / kota`,
      variant: 'navy',
    },
    {
      label: 'Akun aktif',
      value: String(aktif),
      note: total > 0 ? `${aktifPct}% dari seluruh akun` : 'Belum ada akun',
      variant: 'white',
    },
    {
      label: 'Menunggu aktivasi',
      value: String(menunggu),
      note: 'Kirim ulang undangan bila perlu',
      variant: 'white',
    },
    {
      label: 'Akun nonaktif',
      value: String(nonaktif),
      note: 'Akses pengelola dinonaktifkan',
      variant: 'white',
    },
  ];

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[#0D2453] text-[22px] font-semibold leading-[1.5]">Pengelolaan akun desa</h2>
        <p className="text-[#64748B] text-[12px] leading-[1.5]">
          Kelola akses pengelola tanpa mengubah data keuangan desa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {cards.map((card) => (
          <Card key={card.label} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Kesiapan akses */}
        <div className="lg:col-span-7 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col gap-3">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Kesiapan akses pengelola
          </h3>
          <p className="text-[#64748B] text-[13px] leading-[1.5]">
            {aktif} dari {total} desa sudah memiliki akun aktif.
          </p>

          <div className="h-4 w-full rounded-[8px] bg-[#EDF3FC] overflow-hidden">
            <div className="h-full rounded-[8px] bg-[#0D2453]" style={{ width: `${aktifPct}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-[12px] font-medium text-[#216B55]">Aktif · {aktif}</span>
            <span className="text-[12px] font-medium text-[#875B12]">Menunggu · {menunggu}</span>
            <span className="text-[12px] font-medium text-[#64748B]">Nonaktif · {nonaktif}</span>
          </div>

          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            {menunggu > 0
              ? 'Prioritas: tindak lanjuti undangan yang belum diaktifkan.'
              : 'Semua undangan aktivasi sudah ditindaklanjuti.'}
          </p>
        </div>

        {/* Tindak lanjut akun */}
        <div className="lg:col-span-5 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Tindak lanjut akun</h3>
          <p className="text-[#0D2453] text-[14px] font-semibold mt-4">
            {menunggu} undangan belum diaktifkan
          </p>
          <p className="text-[#64748B] text-[12px] leading-[1.5] mt-1">
            Pastikan email pengelola benar sebelum mengirim ulang undangan aktivasi.
          </p>

          <Link
            href="/disbudparekraf/akun"
            className="mt-auto h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold self-start"
          >
            Tinjau undangan
          </Link>
        </div>
      </div>
    </section>
  );
}
