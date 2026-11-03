import Link from 'next/link';
import { Newspaper, ChevronRight } from 'lucide-react';
import HomeKpiCounters from '@/components/HomeKpiCounters';
import HomeReportForm from '@/components/HomeReportForm';
import HomeReportFeed from '@/components/HomeReportFeed';

export default function HomePage() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 space-y-11 mt-6 mb-24">
      {/* 1. Hero Banner */}
      <section className="relative rounded-[32px] overflow-hidden p-6 sm:p-10 lg:p-[56px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-[#E6ECF5]">
        {/* Landscape Sindoro / Sawah Terasering Background with 42% Navy Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/img/figma/hero.png"
            alt="Desa Wisata Jawa Tengah - Lanskap Pegunungan & Sawah Berundak"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#0D2453]/42"></div>
        </div>

        <div className="relative z-10 max-w-[760px] text-white space-y-5">
          <div className="space-y-1">
            {/* Cursive Subtitle */}
            <p className="font-cursive text-white text-3xl sm:text-4xl lg:text-[40px] leading-tight drop-shadow-sm font-normal">
              Desa Wisata Jawa Tengah
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-heading font-bold tracking-tight leading-[1.05] text-white drop-shadow-sm">
              Dari Laporan,<br />Menjadi Perbaikan
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-white/80 text-sm sm:text-[18px] max-w-[760px] leading-relaxed drop-shadow-sm font-normal">
            Pantau penggunaan dana desa secara terbuka dan laporkan kendala fasilitas wisata secara cepat
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#buat-laporan"
              className="px-[18px] py-[14px] rounded-full bg-white text-[#0D2453] hover:bg-slate-100 font-semibold text-xs sm:text-[14px] shadow-sm transition-all active:scale-95"
            >
              Buat Laporan
            </a>
            <Link
              href="/transparansi"
              className="px-[18px] py-[14px] rounded-full bg-white text-[#0D2453] hover:bg-slate-100 font-semibold text-xs sm:text-[14px] shadow-sm transition-all active:scale-95"
            >
              Lihat Transparansi Dana Desa
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats KPI Strip */}
      <section>
        <HomeKpiCounters />
      </section>

      {/* 3. Section Buat Laporan */}
      <section
        id="buat-laporan"
        className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 text-[#0D2453]">
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
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-[20px] font-semibold text-[#0D2453] tracking-tight">
            Dari Laporan, Menjadi Perbaikan
          </h2>
          <p className="text-xs sm:text-[14px] text-[#64748B] mt-1">
            Ikuti kabar penggunaan dana dan fasilitas desa.
          </p>
        </div>

        {/* 2-Row Feed */}
        <HomeReportFeed />

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#EBEBEB] text-[#0D2453] text-[13px] font-semibold hover:bg-slate-50 transition-all shadow-xs group"
          >
            <span>Lihat Lainnya</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0D2453] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
