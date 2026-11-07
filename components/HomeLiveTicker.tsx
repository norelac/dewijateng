'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getPublicReportsAction } from '@/app/actions/reportActions';
import type { IncidentReportDetail } from '@/lib/services/reportService';

interface TickerItem {
  id: string | number;
  tag: string;
  ticket: string;
  text: string;
  time: string;
  link: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 1,
    tag: 'Selesai Ditangani',
    ticket: 'LP-JTG-2026-0891',
    text: 'Akses ke curug di Desa Wisata Candirejo telah selesai dirabat beton oleh Pokdarwis.',
    time: '15 menit lalu',
    link: '/lapor',
  },
  {
    id: 2,
    tag: 'Transparansi Dana',
    ticket: 'Bantuan Provinsi 2026',
    text: 'Realisasi Rp 100.000.000 pemeliharaan jalan Desa Candirejo tercatat lengkap dengan kuitansi.',
    time: '45 menit lalu',
    link: '/transparansi',
  },
  {
    id: 3,
    tag: 'Tindak Lanjut',
    ticket: 'LP-JTG-2026-0744',
    text: 'Perbaikan sanitasi wastafel & toilet Desa Candirejo telah terverifikasi Proof-of-Fix.',
    time: '2 jam lalu',
    link: '/lapor',
  },
];

function relativeTime(input?: string | Date | null): string {
  if (!input) return 'baru saja';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return 'baru saja';

  const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMinutes < 1) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function mapToTicker(detail: IncidentReportDetail): TickerItem {
  const isResolved = detail.status === 'RESOLVED';
  return {
    id: detail.id,
    tag: isResolved ? 'Selesai Ditangani' : 'Tindak Lanjut',
    ticket: detail.reportCode,
    text: isResolved
      ? `${detail.title} di ${detail.village?.name || 'desa wisata'} telah selesai ditindaklanjuti.`
      : `${detail.title} di ${detail.village?.name || 'desa wisata'} sedang ditindaklanjuti.`,
    time: relativeTime(detail.updatedAt || detail.createdAt),
    link: `/lapor?code=${encodeURIComponent(detail.reportCode)}`,
  };
}

export default function HomeLiveTicker() {
  const [items, setItems] = useState<TickerItem[]>(TICKER_ITEMS);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getPublicReportsAction({ limit: 5 })
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setItems(res.data.map(mapToTicker));
          setIndex(0);
        }
      })
      .catch(() => {
        // Basis data belum siap: pertahankan item contoh
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index % items.length];

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E6ECF5] px-4 sm:px-5 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden">
      {/* Left Badge with Pulse Dot */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold tracking-wider text-[#0D2453] uppercase">
          Aktivitas Terkini
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
      </div>

      {/* Center Animated Message */}
      <div className="min-w-0 flex-1 relative h-6 overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-xs text-[#0D2453] truncate"
          >
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[11px] shrink-0 border border-blue-100">
              {current.ticket}
            </span>
            <span className="truncate font-normal text-slate-700">
              {current.text}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0 hidden md:inline">
              • {current.time}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Link */}
      <Link
        href={current.link}
        className="text-[11px] font-bold text-[#0D2453] hover:text-blue-900 flex items-center gap-1 shrink-0 group transition-colors"
      >
        <span>Lihat Detail</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
