'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ChevronRight } from 'lucide-react';
import HomeHeroBanner from '@/components/HomeHeroBanner';
import HomeLiveTicker from '@/components/HomeLiveTicker';
import HomeKpiCounters from '@/components/HomeKpiCounters';
import HomeReportForm from '@/components/HomeReportForm';
import HomeReportFeed from '@/components/HomeReportFeed';

export default function HomePage() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 flex flex-col items-start gap-[36px] mt-[36px] mb-24">
      {/* 1. Dynamic Hero Banner with Slideshow & Entrance Animations */}
      <HomeHeroBanner />

      {/* 2. Live Activity Ticker (Proof-of-Fix & Update Real-time) */}
      <section className="w-full">
        <HomeLiveTicker />
      </section>

      {/* 3. Unified Navy KPI Counters */}
      <section className="w-full">
        <HomeKpiCounters />
      </section>

      {/* 3. Section Buat Laporan */}
      <section
        id="buat-laporan"
        className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 text-[#0D2453]">
            <Newspaper className="w-5 h-5 text-[#0D2453]" />
            <h2 className="text-xl sm:text-[22px] font-semibold text-[#0D2453] tracking-tight">
              Buat Laporan
            </h2>
          </div>
          <p className="text-sm sm:text-[17px] text-[#767676] mt-1.5 font-normal">
            Sampaikan pengaduan Anda secara mudah dan cepat.
          </p>
        </div>

        {/* 2-Column Form with Leaflet Map */}
        <HomeReportForm />
      </section>

      {/* 4. Section Dari Laporan, Menjadi Perbaikan */}
      <section className="w-full space-y-6">
        {/* Animated Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-xl sm:text-[22px] font-semibold text-[#0D2453] tracking-tight">
            Dari Laporan, Menjadi Perbaikan
          </h2>
          <p className="text-xs sm:text-[14px] text-[#64748B] mt-1">
            Ikuti kabar penggunaan dana dan fasilitas desa.
          </p>
        </motion.div>

        {/* 2-Row Feed with Before/After Drag Slider and Lightbox */}
        <HomeReportFeed />

        {/* Action Button: Solid Navy Button matching user request */}
        <div className="flex justify-end pt-2 w-full">
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0D2453] hover:bg-[#163574] text-white text-[13px] font-semibold transition-all shadow-sm active:scale-95 group"
          >
            <span>Lihat Lainnya</span>
            <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
