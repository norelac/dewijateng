'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, FileText, ArrowRight, CheckCircle2, TrendingUp, Building2, AlertTriangle } from 'lucide-react';
import { MACRO_STATS } from '@/lib/mockData';
import { formatRupiah } from '@/lib/utils';

export default function HeroMotion() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 text-white">
      {/* Background glow decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          {/* Subtheme Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-semibold backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>WIA 2026: Sub-tema Powering Public Transparency</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Kawal Transparansi Kas & Keselamatan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-teal-200">
              776 Desa Wisata
            </span>{' '}
            Jawa Tengah
          </motion.h1>

          {/* Sub-headline */}
          <motion.p variants={itemVariants} className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Platform terpadu pembukuan kas riil berbukti kuitansi nota, pengawasan fasilitas publik berkoordinat GPS, serta garansi penanganan aduan berbasis SLA dan verifikasi fisik <em>Proof-of-Fix</em>.
          </motion.p>

          {/* Dual Action CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="/transparansi"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Periksa Buku Kas & Nota</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="/lapor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Laporkan Pungli / Bahaya K3</span>
            </motion.a>
          </motion.div>
        </motion.div>

        {/* 4 Staggered KPI Metric Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16"
        >
          {/* KPI 1 */}
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 backdrop-blur-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Desa Wisata Binaan</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {MACRO_STATS.totalVillages}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              583 Rintisan (75.1%) • 159 Berkembang • 34 Maju
            </div>
          </motion.div>

          {/* KPI 2 */}
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 backdrop-blur-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Realisasi Bankeu</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
              Rp 83,1 M
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Dari Rp87,5 M Alokasi ke 592 Desa Wisata
            </div>
          </motion.div>

          {/* KPI 3 */}
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 backdrop-blur-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Tingkat Taat SLA</span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-teal-300 font-mono">
              {MACRO_STATS.slaComplianceRate}%
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              1.420 Tiket Tuntas dengan Proof-of-Fix
            </div>
          </motion.div>

          {/* KPI 4 */}
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 backdrop-blur-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Rerata Trust Score</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
              {MACRO_STATS.averageTrustScore}
              <span className="text-sm text-slate-400 font-normal"> / 100</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Kepatuhan K3 & Integritas Kas Terbuka
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
