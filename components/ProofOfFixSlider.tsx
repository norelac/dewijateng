'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Clock, MapPin, ChevronLeft, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react';
import { RESOLVED_REPORTS } from '@/lib/mockData';
import { formatDateIndo } from '@/lib/utils';
import type { IncidentReport } from '@/types';

export default function ProofOfFixSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100

  const report: IncidentReport = RESOLVED_REPORTS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? RESOLVED_REPORTS.length - 1 : prev - 1));
    setSliderPosition(50);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === RESOLVED_REPORTS.length - 1 ? 0 : prev + 1));
    setSliderPosition(50);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garansi Proof-of-Fix Terverifikasi</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Feed Bukti Nyata Perbaikan Fisik & Integritas Kas
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Setiap aduan warga wajib disertai dokumentasi perbaikan fisik sebelum tiket dinyatakan tuntas.
          </p>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Laporan sebelumnya"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-semibold text-slate-400 px-2">
            {currentIndex + 1} / {RESOLVED_REPORTS.length}
          </span>
          <button
            onClick={handleNext}
            aria-label="Laporan berikutnya"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Interactive Before-After Comparison Image */}
          <div className="lg:col-span-7">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden select-none border border-slate-700/80 shadow-2xl bg-slate-950">
              {/* After Image (Background) */}
              <img
                src={report.proofOfFix?.photoAfterUrl || report.photoBeforeUrl}
                alt="Kondisi Setelah Perbaikan"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-md bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SETELAH (FIXED)</span>
              </div>

              {/* Before Image (Foreground Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={report.photoBeforeUrl}
                  alt="Kondisi Sebelum Perbaikan"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ width: '100%', minWidth: '100%' }}
                />
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-md bg-red-600/90 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>SEBELUM (ADUAN)</span>
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg border-2 border-blue-600">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
                    <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Range Input Overlay for Drag Physics */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                aria-label="Geser untuk perbandingan sebelum dan sesudah"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-2.5">
              ← Geser slider horizontal untuk membandingkan foto fisik Sebelum & Sesudah →
            </p>
          </div>

          {/* Ticket Information & SLA Metadata */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                {report.ticketCode}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tuntas Memenuhi SLA</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{report.villageName}</span>
              </div>
              <h4 className="text-lg font-bold text-white leading-snug">
                {report.title}
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                &ldquo;{report.description}&rdquo;
              </p>
            </div>

            {/* Proof of Fix Summary Box */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Tindakan Resolusi Fisik</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {report.proofOfFix?.actionSummary}
              </p>
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{report.proofOfFix?.officerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{report.proofOfFix ? formatDateIndo(report.proofOfFix.resolvedAt) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block text-[11px]">Batas SLA</span>
                <span className="font-bold text-white mt-0.5 block">{report.slaHours} Jam Max</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 block text-[11px]">Status Kepatuhan</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">Audit Lolos</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
