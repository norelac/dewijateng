import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import HomeKpiCounters from '@/components/HomeKpiCounters';
import HomeReportForm from '@/components/HomeReportForm';
import HomeReportFeed from '@/components/HomeReportFeed';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 mt-4">
      {/* 1. Hero Section Banner Card with Terrace Mountain Background */}
      <section className="relative rounded-[32px] overflow-hidden shadow-sm border border-[#EBEBEB]">
        {/* Landscape Background Image with Navy Overlay matching Figma */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80"
            alt="Desa Wisata Jawa Tengah - Lanskap Pegunungan & Sawah Berundak"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-[#0D2453]/50"></div>
        </div>

        <div className="relative z-10 px-6 sm:px-12 lg:px-14 py-14 sm:py-20 max-w-3xl text-white">
          {/* Script / Cursive Subtitle (MonteCarlo) */}
          <p className="font-cursive text-white text-3xl sm:text-4xl lg:text-[42px] leading-tight mb-2 tracking-normal drop-shadow-sm font-normal">
            Desa Wisata Jawa Tengah
          </p>

          {/* Main Headline (Montserrat Bold) */}
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-heading font-bold tracking-tight leading-[1.08] text-white drop-shadow-sm">
            Dari Laporan,<br />Menjadi Perbaikan
          </h1>

          {/* Sub-headline */}
          <p className="text-white/80 text-sm sm:text-base mt-4 max-w-xl leading-relaxed drop-shadow-sm font-normal">
            Pantau penggunaan dana desa secara terbuka dan laporkan kendala fasilitas wisata secara cepat
          </p>

          {/* Dual CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 mt-8">
            <a
              href="#buat-laporan"
              className="px-6 py-3 rounded-full bg-white text-[#0D2453] hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              Buat Laporan
            </a>
            <Link
              href="/transparansi"
              className="px-6 py-3 rounded-full bg-white text-[#0D2453] hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              Lihat Transparansi Dana Desa
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Four Metric KPI Cards */}
      <section>
        <HomeKpiCounters />
      </section>

      {/* 3. Section Buat Laporan Card */}
      <section id="buat-laporan" className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-10 shadow-xs">
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[#0D2453]">
            <FileText className="w-5 h-5 text-[#0D2453]" />
            <h2 className="text-xl font-bold tracking-tight text-[#0D2453]">
              Buat Laporan
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#767676] mt-1">
            Sampaikan pengaduan Anda secara mudah dan cepat.
          </p>
        </div>

        <HomeReportForm />
      </section>

      {/* 4. Section Dari Laporan, Menjadi Perbaikan */}
      <section className="pt-8 sm:pt-10 space-y-8">
        <div className="mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0D2453] tracking-tight">
            Dari Laporan, Menjadi Perbaikan
          </h2>
          <p className="text-xs sm:text-sm text-[#767676] mt-1.5">
            Ikuti kabar penggunaan dana dan fasilitas desa.
          </p>
        </div>

        {/* Interactive Report Feed Component */}
        <HomeReportFeed />

        {/* Lihat Lainnya CTA Button */}
        <div className="flex justify-end pt-2 pb-8">
          <Link
            href="/#buat-laporan"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-[#EBEBEB] text-[#0D2453] hover:bg-slate-50 text-xs font-bold shadow-xs transition-colors"
          >
            <span>Lihat Lainnya</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
