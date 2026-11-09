'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  SlidersHorizontal,
  Columns,
  Maximize2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { getPublicReportsAction } from '@/app/actions/reportActions';
import type { IncidentReportDetail } from '@/lib/services/reportService';

interface ReportCardItem {
  id: string;
  ticketCode: string;
  title: string;
  status: string;
  beforePhoto: string;
  beforeLabel: string;
  beforeCaption: string;
  afterPhoto: string;
  afterLabel: string;
  afterCaption: string;
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
    ticketCode: 'LP-JTG-2026-0891',
    title: 'Akses ke curug buruk',
    status: 'Selesai',
    beforePhoto: '/img/figma/aduan-curug-sebelum.png',
    beforeLabel: 'Sebelum · 1 Ags 2026',
    beforeCaption: 'Jalur curug tergenang air dan becek berlumpur',
    afterPhoto: '/img/figma/aduan-curug-sesudah.png',
    afterLabel: 'Sesudah · 12 Okt 2026',
    afterCaption: 'Jalur wisata telah dirabat beton dan bersih asri',
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
    ticketCode: 'LP-JTG-2026-0744',
    title: 'Wastafel dan toilet kotor sekali',
    status: 'Selesai',
    beforePhoto: '/img/figma/toilet-sebelum.png',
    beforeLabel: 'Sebelum · 6 Okt 2026',
    beforeCaption: 'Kran bocor dinding kotor dan lumut tebal di toilet',
    afterPhoto: '/img/figma/toilet-sesudah.png',
    afterLabel: 'Sesudah · 9 Okt 2026',
    afterCaption: 'Kran & dinding diperbarui rapi serta higienis',
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

const FALLBACK_BEFORE = '/img/figma/aduan-curug-sebelum.png';
const FALLBACK_AFTER = '/img/figma/aduan-curug-sesudah.png';

/** Ganti foto yang gagal dimuat dengan aset contoh agar tidak muncul ikon rusak. */
function handlePhotoError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  const alt = (img.getAttribute('alt') || '').toLowerCase();
  if (alt.includes('sebelum')) {
    img.src = FALLBACK_BEFORE;
  } else {
    img.src = FALLBACK_AFTER;
  }
}

function formatTanggal(input?: string | Date | null): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function formatTanggalJam(input?: string | Date | null): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const jam = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${formatTanggal(d)} · ${jam.replace(':', '.')} WIB`;
}

/** Hanya aduan yang sudah punya pasangan foto sebelum & sesudah yang bisa ditampilkan. */
function mapToCard(detail: IncidentReportDetail): ReportCardItem | null {
  const afterUrl = detail.resolution?.photoAfterUrl;
  if (!afterUrl) return null;

  const villageName = detail.village?.name || 'Desa Wisata';
  const regency = detail.village?.regency || 'Jawa Tengah';
  const resolvedAt = detail.resolution?.resolvedAt;
  const villageLabel = `${villageName} - ${regency.replace('Kabupaten ', '')} ↗`;

  const notes: ReportCardItem['notes'] = [
    {
      time: formatTanggalJam(detail.createdAt).toUpperCase(),
      title: 'Laporan warga diterima',
      desc: detail.description,
      villageLink: villageLabel,
    },
  ];

  if (detail.resolution?.actionSummary) {
    notes.unshift({
      time: formatTanggalJam(resolvedAt).toUpperCase(),
      title: 'Perbaikan selesai & terverifikasi',
      desc: detail.resolution.actionSummary,
      villageLink: villageLabel,
    });
  }

  return {
    id: detail.id,
    ticketCode: detail.reportCode,
    title: detail.title,
    status: detail.status === 'RESOLVED' ? 'Selesai' : 'Diproses',
    beforePhoto: detail.photoBeforeUrl || FALLBACK_BEFORE,
    beforeLabel: `Sebelum · ${formatTanggal(detail.createdAt)}`,
    beforeCaption: detail.description,
    afterPhoto: afterUrl,
    afterLabel: `Sesudah · ${formatTanggal(resolvedAt)}`,
    afterCaption: detail.resolution?.actionSummary || 'Perbaikan telah diselesaikan pengelola desa.',
    locationDate: `${villageName}, ${regency} - ${formatTanggal(resolvedAt)} - ${formatTanggalJam(resolvedAt).split('· ')[1] || ''}`,
    notes,
  };
}

export default function HomeReportFeed() {
  const [cards, setCards] = useState<ReportCardItem[]>(REPORT_CARDS);

  const [sliderModes, setSliderModes] = useState<Record<string, boolean>>({
    'rep-1': true,
    'rep-2': true,
  });
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({
    'rep-1': 50,
    'rep-2': 50,
  });
  const [lightboxImg, setLightboxImg] = useState<{
    url: string;
    title: string;
    subtitle: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPublicReportsAction({ status: 'RESOLVED', limit: 20 })
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !Array.isArray(res.data)) return;
        const mapped = res.data
          .map(mapToCard)
          .filter((item): item is ReportCardItem => item !== null);
        if (mapped.length === 0) return;

        setCards(mapped.slice(0, 4));
        setSliderModes(
          Object.fromEntries(mapped.slice(0, 4).map((item) => [item.id, true]))
        );
        setSliderPositions(
          Object.fromEntries(mapped.slice(0, 4).map((item) => [item.id, 50]))
        );
      })
      .catch(() => {
        // Basis data belum siap: pertahankan kartu contoh
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMode = (id: string) => {
    setSliderModes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSliderChange = (id: string, val: number) => {
    setSliderPositions((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-6 w-full">
      {cards.map((item, idx) => {
        const isSlider = !!sliderModes[item.id];
        const pos = sliderPositions[item.id] ?? 50;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="flex flex-col lg:flex-row items-stretch justify-between gap-4 w-full"
          >
            {/* Left Card: Evidence Photos with Slider Option */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-colors flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Title + Mode Toggle + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg sm:text-[20px] font-semibold text-black tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    <Link
                      href={`/lapor?code=${encodeURIComponent(item.ticketCode)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D2453] hover:underline mt-0.5"
                    >
                      <span>{item.ticketCode}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* Toggle Button: Slider vs Side-by-Side */}
                    <button
                      type="button"
                      onClick={() => toggleMode(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#0D2453] transition-colors cursor-pointer shadow-2xs"
                      title={isSlider ? 'Ganti ke tampilan berdampingan' : 'Ganti ke tampilan interaktif slider'}
                    >
                      {isSlider ? (
                        <>
                          <Columns className="w-3.5 h-3.5" />
                          <span>Berdampingan</span>
                        </>
                      ) : (
                        <>
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Mode Slider</span>
                        </>
                      )}
                    </button>

                    {/* Status Badge */}
                    <span className="bg-[#90F18A]/60 text-[#216B55] text-xs sm:text-[14px] font-medium px-3.5 py-1.5 rounded-[16px] shrink-0">
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Photo Viewer: Draggable Comparison Slider OR Side-by-side */}
                {isSlider ? (
                  /* Interactive Comparison Slider */
                  <div className="mt-4">
                    <div className="relative h-[240px] sm:h-[280px] rounded-[18px] overflow-hidden select-none border border-[#EBEBEB] bg-slate-100 group shadow-2xs">
                      {/* Sesudah (Full Background Image) */}
                      <img
                        src={item.afterPhoto}
                        alt="Foto kondisi sesudah perbaikan"
                        onError={handlePhotoError}
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Sebelum (Clipped Overlay Image) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${pos}%` }}
                      >
                        <img
                          src={item.beforePhoto}
                          alt="Foto kondisi sebelum perbaikan"
                          onError={handlePhotoError}
                          className="absolute inset-0 w-full h-full object-cover max-w-none"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>

                      {/* Divider Line & Central Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
                        style={{ left: `${pos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#0D2453] border border-slate-200">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Floating Labels */}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold pointer-events-none">
                        {item.beforeLabel}
                      </span>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold pointer-events-none">
                        {item.afterLabel}
                      </span>

                      {/* Zoom Lightbox Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: item.afterPhoto,
                            title: `${item.title} (Sesudah Perbaikan)`,
                            subtitle: item.afterLabel,
                          })
                        }
                        className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-xs text-white transition-colors"
                        title="Perbesar foto"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      {/* Drag Range Slider */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pos}
                        onChange={(e) => handleSliderChange(item.id, Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                        aria-label="Geser untuk membandingkan kondisi fisik sebelum dan sesudah perbaikan"
                      />
                    </div>
                  </div>
                ) : (
                  /* Side-by-side Photos */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                    {/* Sebelum */}
                    <div
                      className="group cursor-pointer"
                      onClick={() =>
                        setLightboxImg({
                          url: item.beforePhoto,
                          title: `${item.title} (Sebelum)`,
                          subtitle: item.beforeLabel,
                        })
                      }
                    >
                      <div className="h-[197px] rounded-[16px] overflow-hidden bg-slate-100 border border-[#EBEBEB] relative">
                        <img
                          src={item.beforePhoto}
                          alt={item.beforeLabel}
                          onError={handlePhotoError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-2 font-normal">
                        {item.beforeLabel}
                      </p>
                    </div>

                    {/* Sesudah */}
                    <div
                      className="group cursor-pointer"
                      onClick={() =>
                        setLightboxImg({
                          url: item.afterPhoto,
                          title: `${item.title} (Sesudah)`,
                          subtitle: item.afterLabel,
                        })
                      }
                    >
                      <div className="h-[197px] rounded-[16px] overflow-hidden bg-slate-100 border border-[#EBEBEB] relative">
                        <img
                          src={item.afterPhoto}
                          alt={item.afterLabel}
                          onError={handlePhotoError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-2 font-normal">
                        {item.afterLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Timestamp Footer */}
              <div className="flex items-center gap-2 text-xs text-[#64748B] mt-5 pt-3 border-t border-slate-100">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{item.locationDate}</span>
              </div>
            </div>

            {/* Right Card: Catatan Dari Desa */}
            <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E6ECF5] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-colors lg:w-[480px] xl:w-[520px] shrink-0 flex flex-col justify-between">
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
        );
      })}

      {/* Lightbox Modal for Photo Inspection */}
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
              className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#0D2453]">
                    {lightboxImg.title}
                  </h3>
                  <span className="text-xs text-[#64748B]">
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

              <div className="p-3 bg-slate-950 max-h-[75vh] flex items-center justify-center overflow-hidden">
                <img
                  src={lightboxImg.url}
                  alt={lightboxImg.title}
                  onError={handlePhotoError}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>

              <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#64748B]">
                <span>Dokumentasi bukti fisik perbaikan fasilitas desa wisata Jawa Tengah</span>
                <button
                  type="button"
                  onClick={() => setLightboxImg(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs hover:bg-[#163574] transition-colors"
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
