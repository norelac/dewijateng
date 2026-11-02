'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  MapPin,
  SlidersHorizontal,
  Maximize2,
  X,
  Columns
} from 'lucide-react';

interface ReportItem {
  id: string;
  ticketCode: string;
  category: string;
  title: string;
  location: string;
  status: string;
  before: {
    title: string;
    label: string;
    photo: string;
    caption: string;
  };
  after: {
    title: string;
    label: string;
    photo: string;
    caption: string;
  };
  timeline: Array<{
    date: string;
    title: string;
    desc: string;
    villageLink: string;
  }>;
}

const REPORT_DATA: ReportItem[] = [
  {
    id: 'rep-1',
    ticketCode: 'DS-JTG-2026-0891',
    category: 'Akses & Jalan',
    title: 'Akses ke curug buruk',
    location: 'Desa Candirejo, Magelang - 12 Okt 2026 - 11.30 WIB',
    status: 'Selesai',
    before: {
      title: 'Sebelum Perbaikan',
      label: 'Sebelum • 1 Ags 2026',
      photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1000&auto=format&fit=crop&q=80',
      caption: 'Akses jalan setapak curug berlumpur dan pagar pengaman lapuk',
    },
    after: {
      title: 'Sesudah Perbaikan',
      label: 'Sesudah • 12 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1000&auto=format&fit=crop&q=80',
      caption: 'Jalan setapak telah dirabat beton dan dipasang pagar pengaman besi',
    },
    timeline: [
      {
        date: '20 OKT 2026 • 09.15 WIB',
        title: 'Dukungan pembangunan dipublikasikan',
        desc: 'Bantuan Provinsi Rp 300.000.000 masuk dalam sumber dana tahun 2026.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
      {
        date: '16 OKT 2026 • 16.00 WIB',
        title: 'Pemeliharaan ruas jalan tercatat',
        desc: 'Realisasi Rp 100.000.000 dilengkapi contoh nota dan dokumentasi fisik.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
    ],
  },
  {
    id: 'rep-2',
    ticketCode: 'DS-JTG-2026-0744',
    category: 'Fasilitas & Sanitasi',
    title: 'Wastafel dan toilet kotor sekali',
    location: 'Desa Candirejo, Magelang - 9 Okt 2026 - 11.30 WIB',
    status: 'Selesai',
    before: {
      title: 'Sebelum Perbaikan',
      label: 'Sebelum • 6 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&auto=format&fit=crop&q=80',
      caption: 'Wastafel mampet berlumut dan kran air toilet tidak mengalir',
    },
    after: {
      title: 'Sesudah Perbaikan',
      label: 'Sesudah • 9 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1000&auto=format&fit=crop&q=80',
      caption: 'Sanitasi dan kran air diganti baru, higienis dan wangi',
    },
    timeline: [
      {
        date: '20 OKT 2026 • 09.15 WIB',
        title: 'Dukungan pembangunan dipublikasikan',
        desc: 'Bantuan Provinsi Rp 300.000.000 masuk dalam sumber dana tahun 2026.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
      {
        date: '16 OKT 2026 • 16.00 WIB',
        title: 'Pemeliharaan ruas jalan tercatat',
        desc: 'Realisasi Rp 100.000.000 dilengkapi contoh nota dan dokumentasi fisik.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
    ],
  },
];

const CATEGORIES = ['Semua', 'Akses & Jalan', 'Fasilitas & Sanitasi'];

export default function HomeReportFeed() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sliderModes, setSliderModes] = useState<Record<string, boolean>>({});
  const [sliderPos, setSliderPos] = useState<Record<string, number>>({
    'rep-1': 50,
    'rep-2': 50,
  });
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  const filteredReports =
    activeCategory === 'Semua'
      ? REPORT_DATA
      : REPORT_DATA.filter((r) => r.category === activeCategory);

  const toggleSliderMode = (id: string) => {
    setSliderModes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSliderMove = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderPos((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#0D2453] text-white shadow-xs'
                  : 'bg-white border border-[#EBEBEB] text-[#767676] hover:text-[#0D2453] hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Unified Report Cards */}
      <div className="space-y-6">
        {filteredReports.map((item) => {
          const isSlider = !!sliderModes[item.id];
          const pos = sliderPos[item.id] ?? 50;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column (Span 7): Incident Header, Before/After Visuals, Location Meta */}
                <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-5">
                  <div>
                    {/* Header: Title, Ticket Code, Mode Toggle & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0D2453] leading-snug">
                          {item.title}
                        </h3>
                        <Link
                          href="/#buat-laporan"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] mt-1 hover:underline group"
                        >
                          <span>{item.ticketCode}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        {/* Toggle Slider Mode */}
                        <button
                          type="button"
                          onClick={() => toggleSliderMode(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#F7F9FC] hover:bg-slate-200 border border-[#EBEBEB] text-[#0D2453] text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {isSlider ? <Columns className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
                          <span>{isSlider ? 'Berdampingan' : 'Slider'}</span>
                        </button>

                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E6FFFA] text-[#319795] border border-[#B2F5EA] shrink-0">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Photos View: Side-by-side OR Draggable Comparison Slider */}
                    {!isSlider ? (
                      <div className="grid grid-cols-2 gap-4 mt-5">
                        {/* Sebelum Perbaikan */}
                        <div>
                          <div className="text-xs font-bold text-[#0D2453] mb-1.5">
                            {item.before.title}
                          </div>
                          <div
                            onClick={() =>
                              setLightboxImg({
                                url: item.before.photo,
                                title: `${item.title} - ${item.before.title}`,
                                subtitle: item.before.label,
                              })
                            }
                            className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer shadow-2xs"
                          >
                            <img
                              src={item.before.photo}
                              alt={item.before.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#767676] block mt-1.5 font-medium">
                            {item.before.label}
                          </span>
                        </div>

                        {/* Sesudah Perbaikan */}
                        <div>
                          <div className="text-xs font-bold text-[#0D2453] mb-1.5">
                            {item.after.title}
                          </div>
                          <div
                            onClick={() =>
                              setLightboxImg({
                                url: item.after.photo,
                                title: `${item.title} - ${item.after.title}`,
                                subtitle: item.after.label,
                              })
                            }
                            className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-[#EBEBEB] relative group cursor-pointer shadow-2xs"
                          >
                            <img
                              src={item.after.photo}
                              alt={item.after.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#767676] block mt-1.5 font-medium">
                            {item.after.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Draggable Comparison Slider */
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0D2453] mb-1.5">
                          <span>{item.before.title}</span>
                          <span>{item.after.title}</span>
                        </div>
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden select-none border border-[#EBEBEB] shadow-2xs">
                          {/* Sesudah (Full Background Image) */}
                          <img
                            src={item.after.photo}
                            alt="Sesudah Perbaikan"
                            className="absolute inset-0 w-full h-full object-cover"
                          />

                          {/* Sebelum (Clipped Overlay) */}
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${pos}%` }}
                          >
                            <img
                              src={item.before.photo}
                              alt="Sebelum Perbaikan"
                              className="absolute inset-0 w-full h-full object-cover max-w-none"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </div>

                          {/* Divider Line & Central Handle */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none"
                            style={{ left: `${pos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-[#0D2453] border border-slate-200">
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Overlay Badges */}
                          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                            {item.before.label}
                          </span>
                          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                            {item.after.label}
                          </span>

                          {/* Interactive Range Input Slider */}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={pos}
                            onChange={(e) => handleSliderMove(item.id, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                            aria-label="Geser untuk membandingkan foto sebelum dan sesudah perbaikan"
                          />
                        </div>
                        <span className="text-[11px] text-[#767676] block mt-1.5 font-medium text-center">
                          Geser handle ke kiri atau ke kanan untuk membandingkan kondisi fisik
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location & Timestamp Footer */}
                  <div className="flex items-center gap-2 text-xs text-[#767676] pt-4 border-t border-[#EBEBEB]">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* Right Column (Span 5): CATATAN DARI DESA Timeline */}
                <div className="lg:col-span-5 lg:border-l lg:border-[#EBEBEB] lg:pl-8 flex flex-col justify-between h-full pt-6 lg:pt-0 border-t lg:border-t-0 border-[#EBEBEB]">
                  <div>
                    <h4 className="text-[11px] font-bold text-[#767676] uppercase tracking-wider mb-5">
                      CATATAN DARI DESA
                    </h4>

                    <div className="space-y-6">
                      {item.timeline.map((entry, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#767676] block uppercase tracking-wide">
                            {entry.date}
                          </span>
                          <h5 className="text-sm font-bold text-[#0D2453]">
                            {entry.title}
                          </h5>
                          <p className="text-xs text-[#4A5568] leading-relaxed">
                            {entry.desc}
                          </p>
                          <Link
                            href="/transparansi"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] mt-1 hover:underline"
                          >
                            <span>{entry.villageLink}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>

                          {idx < item.timeline.length - 1 && (
                            <div className="border-t border-[#EBEBEB] pt-4"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#0D2453]">
                    {lightboxImg.title}
                  </h3>
                  <span className="text-xs text-[#767676]">
                    {lightboxImg.subtitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0D2453] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-900 max-h-[70vh] flex items-center justify-center overflow-hidden">
                <img
                  src={lightboxImg.url}
                  alt={lightboxImg.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>

              <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#767676]">
                <span>Dokumentasi bukti fisik perbaikan fasilitas desa wisata Jawa Tengah</span>
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
