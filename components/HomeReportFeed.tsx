'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface ReportCardItem {
  id: string;
  ticketCode: string;
  title: string;
  status: string;
  beforePhoto: string;
  beforeLabel: string;
  afterPhoto: string;
  afterLabel: string;
  locationDate: string;
  notes: Array<{
    time: string;
    title: string;
    desc: string;
    villageLink: string;
  }>;
}

const REPORT_CARDS: ReportCardItem[] = [
  {
    id: 'rep-1',
    ticketCode: 'DS-JTG-2026-0891',
    title: 'Akses ke curug buruk',
    status: 'Selesai',
    beforePhoto: '/img/figma/curug-sebelum.png',
    beforeLabel: 'Sebelum · 1 Ags 2026',
    afterPhoto: '/img/figma/curug-sesudah.png',
    afterLabel: 'Sesudah · 12 Okt 2026',
    locationDate: 'Desa Candirejo, Magelang - 12 Okt 2026 - 11.30 WIB',
    notes: [
      {
        time: '20 OKT 2026 · 09.15 WIB',
        title: 'Dukungan pembangunan dipublikasikan',
        desc: 'Bantuan Provinsi Rp 300.000.000 masuk dalam sumber dana tahun 2026.',
        villageLink: 'Desa Wisata Candirejo - Magelang ↗',
      },
      {
        time: '16 OKT 2026 · 16.00 WIB',
        title: 'Pemeliharaan ruas jalan tercatat',
        desc: 'Realisasi Rp 100.000.000 dilengkapi contoh nota dan dokumentasi fisik.',
        villageLink: 'Desa Wisata Candirejo - Magelang ↗',
      },
    ],
  },
  {
    id: 'rep-2',
    ticketCode: 'DS-JTG-2026-0744',
    title: 'Wastafel dan toilet kotor sekali',
    status: 'Selesai',
    beforePhoto: '/img/figma/toilet-sebelum.png',
    beforeLabel: 'Sebelum · 6 Okt 2026',
    afterPhoto: '/img/figma/toilet-sesudah.png',
    afterLabel: 'Sesudah · 9 Okt 2026',
    locationDate: 'Desa Candirejo, Magelang - 9 Okt 2026 - 11.30 WIB',
    notes: [
      {
        time: '20 OKT 2026 · 09.15 WIB',
        title: 'Dukungan pembangunan dipublikasikan',
        desc: 'Bantuan Provinsi Rp 300.000.000 masuk dalam sumber dana tahun 2026.',
        villageLink: 'Desa Wisata Candirejo - Magelang ↗',
      },
      {
        time: '16 OKT 2026 · 16.00 WIB',
        title: 'Pemeliharaan ruas jalan tercatat',
        desc: 'Realisasi Rp 100.000.000 dilengkapi contoh nota dan dokumentasi fisik.',
        villageLink: 'Desa Wisata Candirejo - Magelang ↗',
      },
    ],
  },
];

export default function HomeReportFeed() {
  return (
    <div className="space-y-6 w-full">
      {REPORT_CARDS.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: idx * 0.12 }}
          className="flex flex-col lg:flex-row items-stretch justify-between gap-4 w-full"
        >
          {/* Left Card: Evidence Photos */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex-1 flex flex-col justify-between">
            <div>
              {/* Header: Title + Badge */}
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="text-lg sm:text-[20px] font-semibold text-black tracking-tight">
                  {item.title}
                </h3>
                <span className="bg-[#90F18A]/60 text-[#216B55] text-xs sm:text-[14px] font-medium px-3.5 py-1.5 rounded-[16px] shrink-0">
                  {item.status}
                </span>
              </div>

              {/* Ticket Link */}
              <Link
                href="/lapor"
                className="inline-flex items-center gap-1 text-xs sm:text-[12px] font-semibold text-[#0D2453] hover:underline mb-4"
              >
                <span>{item.ticketCode}</span>
                <span className="text-[10px]">↗</span>
              </Link>

              {/* Side-by-side Photos with gentle zoom on hover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Before */}
                <div className="group cursor-pointer">
                  <div className="h-[197px] rounded-[16px] overflow-hidden bg-slate-100 border border-[#EBEBEB]">
                    <img
                      src={item.beforePhoto}
                      alt={item.beforeLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-2 font-normal">
                    {item.beforeLabel}
                  </p>
                </div>

                {/* After */}
                <div className="group cursor-pointer">
                  <div className="h-[197px] rounded-[16px] overflow-hidden bg-slate-100 border border-[#EBEBEB]">
                    <img
                      src={item.afterPhoto}
                      alt={item.afterLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-2 font-normal">
                    {item.afterLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Timestamp Footer */}
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-5 pt-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{item.locationDate}</span>
            </div>
          </div>

          {/* Right Card: Catatan Dari Desa */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all lg:w-[480px] xl:w-[520px] shrink-0 flex flex-col justify-between">
            <div>
              <div className="text-[12px] font-bold tracking-wider text-[#0D2453] uppercase mb-4">
                CATATAN DARI DESA
              </div>

              <div className="space-y-4">
                {item.notes.map((note, noteIdx) => (
                  <div
                    key={noteIdx}
                    className={`space-y-1.5 ${
                      noteIdx !== item.notes.length - 1 ? 'pb-4 border-b border-[#DDE6DF]' : ''
                    }`}
                  >
                    <div className="text-[10px] text-[#64748B] font-medium">
                      {note.time}
                    </div>
                    <div className="text-sm font-bold text-[#0D2453]">
                      {note.title}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {note.desc}
                    </p>
                    <Link
                      href="/transparansi"
                      className="inline-block text-xs font-semibold text-[#0D2453] hover:underline pt-0.5 group"
                    >
                      <span>{note.villageLink}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
