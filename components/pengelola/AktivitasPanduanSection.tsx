'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ActivityItem } from './types';

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    date: '28 Okt',
    title: 'Laporan baru diterima',
    subtitle: 'LP-JTG-2026-0953 · Menunggu verifikasi desa',
  },
  {
    id: 'act-2',
    date: '20 Okt',
    title: 'Sumber dana diperbarui',
    subtitle: 'Bantuan Provinsi Rp 300.000.000 dipublikasikan',
  },
  {
    id: 'act-3',
    date: '12 Okt',
    title: 'Penanganan laporan selesai',
    subtitle: 'LP-JTG-2026-0891 · Dokumentasi perbaikan tersedia',
  },
];

export default function AktivitasPanduanSection({
  activities = ACTIVITIES,
  onViewHistory,
}: {
  activities?: ActivityItem[];
  onViewHistory?: () => void;
} = {}) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 2 Cards Grid */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">
        {/* Kartu Kiri: Aktivitas Terbaru */}
        <div className="bg-white border border-[#E6ECF5] rounded-[18px] p-6 flex flex-col gap-5 flex-1 shadow-xs justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-normal">
              Aktivitas terbaru
            </h2>
            <button
              type="button"
              onClick={onViewHistory}
              className="text-[#0D2453] text-[12px] font-semibold hover:underline"
            >
              Lihat riwayat →
            </button>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {activities.length === 0 ? (
              <p className="text-[#64748B] text-[11px] font-normal">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-4 w-full">
                  <span className="text-[#64748B] text-[10px] font-normal w-12 shrink-0 pt-0.5">
                    {act.date}
                  </span>
                  <div className="flex flex-col gap-1 flex-1 leading-tight min-w-0">
                    <span className="text-[#0D2453] text-[12px] font-medium truncate">
                      {act.title}
                    </span>
                    <span className="text-[#64748B] text-[10px] font-normal">
                      {act.subtitle}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kartu Kanan: Panduan Transparan */}
        <div className="bg-[#0D2453] text-white rounded-[18px] p-6 flex flex-col justify-between gap-4 w-full lg:w-[342px] shrink-0 shadow-xs">
          <div className="flex flex-col gap-3">
            <BookOpen className="w-[22px] h-[22px] text-white shrink-0" />
            <h3 className="text-[17px] font-semibold text-white leading-snug">
              Tindak lanjut yang transparan
            </h3>
            <p className="text-[12px] text-white/70 leading-[1.7]">
              Catat progres di setiap tahap. Lampirkan dokumentasi perbaikan
              sebelum menutup laporan.
            </p>
          </div>

          <Link
            href="/edukasi"
            className="text-[12px] font-semibold text-white hover:underline inline-flex items-center gap-1 self-start pt-1"
          >
            <span>Baca panduan pengelola</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Sub-Footer Dashboard */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[#64748B] text-[10px] font-normal pt-1 px-1 gap-2">
        <span>© 2026 DEWI JATENG</span>
        <div className="flex items-center gap-4">
          <Link href="/edukasi" className="hover:underline">
            Kebijakan Privasi
          </Link>
          <span>·</span>
          <Link href="/edukasi" className="hover:underline">
            Pusat bantuan
          </Link>
        </div>
      </div>
    </div>
  );
}
