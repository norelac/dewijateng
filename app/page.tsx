import Link from 'next/link';
import { Newspaper, ChevronRight } from 'lucide-react';
import HomeHeroBanner from '@/components/HomeHeroBanner';
import HomeKpiCounters from '@/components/HomeKpiCounters';
import HomeReportForm from '@/components/HomeReportForm';
import HomeReportFeed from '@/components/HomeReportFeed';

export default function HomePage() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col items-start gap-[44px] mt-[44px] mb-24">
      {/* 1. Dynamic Hero Banner with Slideshow & Entrance Animations */}
      <HomeHeroBanner />

      {/* 2. Stats KPI Strip (Original Style with Category Badges & Counter) */}
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
        <div className="flex justify-end pt-2 w-full">
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#EBEBEB] text-[#0D2453] text-[13px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs group"
          >
            <span>Lihat Lainnya</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0D2453] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
