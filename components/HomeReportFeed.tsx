'use client';

import React, { useState, useEffect } from 'react';
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
import { formatDateIndo } from '@/lib/utils';

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

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    ticketCode: 'LP-JTG-2026-0012',
    category: 'Fasilitas & Akses',
    title: 'Pagar Pengaman Bambu Rapuh di Dekat Air Terjun Curug Kembar',
    location: 'Desa Wisata Getas, Kab. Semarang - 30 Okt 2026',
    status: 'Selesai',
    before: {
      title: 'Sebelum Perbaikan',
      label: 'Sebelum • 30 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1000&auto=format&fit=crop&q=80',
      caption: 'Pagar bambu lapuk membahayakan pengunjung di bibir tebing air terjun',
    },
    after: {
      title: 'Sesudah Perbaikan',
      label: 'Sesudah • 31 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1000&auto=format&fit=crop&q=80',
      caption: 'Pagar besi galvanis 2 inci telah terpasang kokoh dengan pondasi cor beton',
    },
    timeline: [
      {
        date: '31 OKT 2026 • 16.30 WIB',
        title: 'Pemasangan Pagar Pipa Galvanis Tuntas',
        desc: 'Pengadaan material pipa galvanis dan upah tukang direalisasikan dari bantuan sarpras.',
        villageLink: 'Desa Wisata Getas - Kab. Semarang',
      },
      {
        date: '30 OKT 2026 • 09.15 WIB',
        title: 'Aduan Kerusakan Diterima Pokdarwis',
        desc: 'Laporan masyarakat terkait pagar pengaman rapuh diverifikasi dan ditindaklanjuti.',
        villageLink: 'Desa Wisata Getas - Kab. Semarang',
      },
    ],
  },
  {
    id: 'rep-2',
    ticketCode: 'LP-JTG-2026-0042',
    category: 'Fasilitas & Sanitasi',
    title: 'Kran Air Toilet Umum Mati & Sanitasi Tersumbat',
    location: 'Desa Wisata Candirejo, Magelang - 28 Okt 2026',
    status: 'Selesai',
    before: {
      title: 'Sebelum Perbaikan',
      label: 'Sebelum • 28 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&auto=format&fit=crop&q=80',
      caption: 'Kran air patah dan saluran air kotor mampet menimbulkan bau tidak sedap',
    },
    after: {
      title: 'Sesudah Perbaikan',
      label: 'Sesudah • 29 Okt 2026',
      photo: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1000&auto=format&fit=crop&q=80',
      caption: 'Kran stainless baru telah terpasang dan saluran sanitasi telah dibersihkan menyeluruh',
    },
    timeline: [
      {
        date: '29 OKT 2026 • 14.00 WIB',
        title: 'Penanganan Sanitasi & Penggantian Kran Tuntas',
        desc: 'Pengurus Pokdarwis menyelesaikan pembetulan saluran dan peremajaan instalasi toilet.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
      {
        date: '28 OKT 2026 • 11.20 WIB',
        title: 'Laporan Kerusakan Diterima Pengelola',
        desc: 'Aduan wisatawan via form beranda langsung diteruskan ke tim pemeliharaan.',
        villageLink: 'Desa Wisata Candirejo - Magelang',
      },
    ],
  },
];

const CATEGORIES = ['Semua', 'Fasilitas & Akses', 'Fasilitas & Sanitasi'];

export default function HomeReportFeed() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sliderModes, setSliderModes] = useState<Record<string, boolean>>({});
  const [sliderPos, setSliderPos] = useState<Record<string, number>>({
    'rep-1': 50,
    'rep-2': 50,
  });
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Ambil data laporan tuntas (RESOLVED) dari database
  useEffect(() => {
    async function fetchResolvedReports() {
      try {
        const res = await fetch('/api/reports?status=RESOLVED');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          const apiReports: ReportItem[] = json.data.map((r: any) => {
            const hasResolution = !!r.resolution_photo_after;
            return {
              id: r.id,
              ticketCode: r.report_code,
              category: r.category === 'FASILITAS_RUSAK' ? 'Fasilitas & Akses' : 'Fasilitas & Sanitasi',
              title: r.title,
              location: `${r.village_name || 'Desa Wisata'}, ${r.village_regency || 'Jateng'} - ${formatDateIndo(r.created_at)}`,
              status: 'Selesai',
              before: {
                title: 'Sebelum Perbaikan',
                label: `Sebelum • ${formatDateIndo(r.created_at)}`,
                photo: r.photo_before_url,
                caption: r.description,
              },
              after: {
                title: 'Sesudah Perbaikan',
                label: `Sesudah • ${formatDateIndo(r.resolved_at || r.created_at)}`,
                photo: r.resolution_photo_after || 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1000&auto=format&fit=crop&q=80',
                caption: r.resolution_summary || 'Telah dituntaskan oleh pengelola dengan dokumentasi fisik (Proof-of-Fix).',
              },
              timeline: [
                {
                  date: `${formatDateIndo(r.resolved_at || r.created_at).toUpperCase()}`,
                  title: 'Perbaikan Fisik Dilaporkan Selesai (Proof-of-Fix)',
                  desc: r.resolution_summary || 'Penanganan teknis lapangan telah tuntas diverifikasi metadata kamera.',
                  villageLink: `${r.village_name || 'Desa Wisata'} - ${r.village_regency || 'Jawa Tengah'}`,
                },
                {
                  date: `${formatDateIndo(r.created_at).toUpperCase()}`,
                  title: 'Aduan Masuk Melalui Portal Publik',
                  desc: r.description,
                  villageLink: `${r.village_name || 'Desa Wisata'} - ${r.village_regency || 'Jawa Tengah'}`,
                },
              ],
            };
          });

          // Gabungkan laporan dari API dengan initial mock jika unik
          const existingCodes = new Set(apiReports.map((item) => item.ticketCode));
          const uniqueInitials = INITIAL_REPORTS.filter((item) => !existingCodes.has(item.ticketCode));
          setReports([...apiReports, ...uniqueInitials]);
        }
      } catch (err) {
        console.error('Gagal mengambil laporan tuntas untuk feed:', err);
      }
    }
    fetchResolvedReports();
  }, []);

  const filteredReports =
    activeCategory === 'Semua'
      ? reports
      : reports.filter((r) => r.category === activeCategory);

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
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                          href={`/lapor?code=${item.ticketCode}`}
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
                          className="px-3 py-1.5 rounded-xl bg-[#F7F9FC] hover:bg-slate-200 border border-[#EBEBEB] text-[#0D2453] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
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
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] mt-1 hover:underline cursor-pointer"
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
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0D2453] flex items-center justify-center transition-colors cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs cursor-pointer"
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
