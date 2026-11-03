'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    src: '/img/hero/hero-1.png',
    alt: 'Desa Wisata Jawa Tengah - Sawah Terasering & Gunung Sindoro',
    caption: 'Kawasan Wisata Lereng Gunung Sindoro, Wonosobo',
  },
  {
    id: 'slide-2',
    src: '/img/hero/hero-2.jpg',
    alt: 'Desa Wisata Candirejo & Borobudur',
    caption: 'Desa Wisata Candirejo, Borobudur, Magelang',
  },
  {
    id: 'slide-3',
    src: '/img/hero/hero-3.jpg',
    alt: 'Dataran Tinggi Dieng & Telaga Warna',
    caption: 'Kawasan Dataran Tinggi Dieng Kulon, Banjarnegara',
  },
  {
    id: 'slide-4',
    src: '/img/hero/hero-4.jpg',
    alt: 'Hutan Pinus Limpakuwus Baturraden',
    caption: 'Desa Wisata Limpakuwus, Sumbang, Banyumas',
  },
];

export default function HomeHeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full rounded-[32px] overflow-hidden p-6 sm:p-10 lg:p-[56px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-[#E6ECF5] min-h-[460px] sm:min-h-[500px] flex flex-col justify-center">
      {/* Background Slideshow with Smooth Crossfade & Slow Ken-Burns */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        <AnimatePresence mode="sync">
          <motion.div
            key={HERO_SLIDES[currentIndex].id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: 'easeInOut' },
              scale: { duration: 6.5, ease: 'easeOut' },
            }}
            className="absolute inset-0"
          >
            <img
              src={HERO_SLIDES[currentIndex].src}
              alt={HERO_SLIDES[currentIndex].alt}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navy Gradient Overlay for guaranteed text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D2453]/85 via-[#0D2453]/60 to-[#0D2453]/30 pointer-events-none" />
      </div>

      {/* Hero Content with Staggered Entrance */}
      <div className="relative z-10 max-w-[760px] text-white space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-1"
        >
          {/* Cursive Subtitle */}
          <p className="font-cursive text-white text-3xl sm:text-4xl lg:text-[40px] leading-tight drop-shadow-sm font-normal">
            Desa Wisata Jawa Tengah
          </p>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-heading font-bold tracking-tight leading-[1.05] text-white drop-shadow-sm">
            Dari Laporan,<br />Menjadi Perbaikan
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-white/85 text-sm sm:text-[18px] max-w-[720px] leading-relaxed drop-shadow-sm font-normal"
        >
          Pantau penggunaan dana desa secara terbuka dan laporkan kendala fasilitas wisata secara cepat
        </motion.p>

        {/* Dual Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center gap-3 pt-2"
        >
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="#buat-laporan"
            className="px-[22px] py-[14px] rounded-full bg-white text-[#0D2453] hover:bg-slate-100 font-semibold text-xs sm:text-[14px] shadow-sm transition-all"
          >
            Buat Laporan
          </motion.a>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/transparansi"
              className="px-[22px] py-[14px] rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/40 font-semibold text-xs sm:text-[14px] shadow-sm transition-all inline-block"
            >
              Lihat Transparansi Dana Desa
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle Slide Indicators & Location Badge at bottom */}
      <div className="absolute bottom-5 right-6 sm:right-10 z-10 flex items-center gap-3">
        {/* Caption */}
        <span className="hidden sm:inline-block text-[11px] text-white/70 font-medium tracking-wide drop-shadow-sm">
          {HERO_SLIDES[currentIndex].caption}
        </span>

        {/* Dots */}
        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Pindah ke slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
