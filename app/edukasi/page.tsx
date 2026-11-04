import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Clock,
  Camera,
  CheckCircle2,
  FileCheck2,
  PhoneCall,
  HardHat,
  Info,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Edukasi & Panduan Warga - DEWI JATENG',
  description:
    'Pusat literasi hukum keterbukaan informasi dana desa (UU KIP), SOP penanganan aduan Pokdarwis, standar keselamatan K3 wahana wisata, dan direktori darurat Jawa Tengah.',
};

export default function EdukasiPage() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 space-y-12 py-8 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-[#0D2453] to-slate-900 text-white py-14 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pusat Literasi Hukum &amp; Pedoman Teknis K3</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Edukasi, Hak Warga &amp; Standar Keselamatan
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            Panduan lengkap mengenai hak keterbukaan informasi dana desa (UU KIP), SOP respon perbaikan Pokdarwis, checklist pencegahan bahaya K3 fasilitas wisata, serta kontak bantuan cepat Jawa Tengah.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href="#hak-warga"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition-colors"
            >
              1. Hak Informasi (UU KIP)
            </a>
            <a
              href="#sop-pokdarwis"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition-colors"
            >
              2. SOP Respon Pokdarwis
            </a>
            <a
              href="#standar-k3"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition-colors"
            >
              3. Standar K3 Wisata
            </a>
            <a
              href="#kontak-darurat"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition-colors"
            >
              4. Kontak Bantuan Cepat
            </a>
          </div>
        </div>
      </section>

      {/* MODUL 1: HAK KETERBUKAAN INFORMASI PUBLIK (UU KIP) */}
      <section id="hak-warga" className="bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0D2453] flex items-center justify-center shrink-0 border border-blue-100">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D2453]">Modul Literasi 01</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
              Hak Warga &amp; Keterbukaan Informasi Dana Desa
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] space-y-2.5">
            <div className="text-xs font-bold text-[#0D2453] uppercase tracking-wide">
              Landasan Yuridis
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              UU No. 14 Tahun 2008
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tentang Keterbukaan Informasi Publik (KIP). Setiap warga negara berhak memperoleh informasi publik secara cepat, tepat waktu, dan biaya ringan, termasuk pengelolaan anggaran pemerintah desa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] space-y-2.5">
            <div className="text-xs font-bold text-[#0D2453] uppercase tracking-wide">
              Regulasi Desa
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Permendagri No. 20 Tahun 2018
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tentang Pengelolaan Keuangan Desa. Pemerintah Desa wajib menginformasikan APBDes dan realisasi anggaran kepada masyarakat melalui media informasi yang mudah diakses.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] space-y-2.5">
            <div className="text-xs font-bold text-[#0D2453] uppercase tracking-wide">
              Pergub Jateng
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Bantuan Keuangan Sarpras
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bantuan Khusus Pengembangan Desa Wisata wajib dipertanggungjawabkan melalui Laporan Pertanggungjawaban (LPJ) fisik dan keuangan yang transparan serta bebas dari penggelembungan harga (markup).
            </p>
          </div>
        </div>

        {/* Highlight Banner Hak Warga */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Prinsip Kedaulatan Warga:</strong> Dana bantuan pemerintah dan dana desa adalah uang rakyat. Warga berhak mengetahui rincian belanja sarpras, mengunduh salinan LPJ resmi, dan melaporkan fasilitas yang tidak sesuai spesifikasi tanpa rasa takut.
            </div>
          </div>
          <Link
            href="/transparansi"
            className="px-4 py-2 rounded-xl bg-[#0D2453] text-white text-xs font-bold shrink-0 hover:bg-[#132d66] transition-colors"
          >
            Lihat Transparansi LPJ
          </Link>
        </div>
      </section>

      {/* MODUL 2: SOP PENANGANAN KELUHAN POKDARWIS */}
      <section id="sop-pokdarwis" className="bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Modul Operasional 02</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
              SOP Penanganan Keluhan &amp; Tangga Respons Pokdarwis
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Setiap aduan yang masuk melalui DEWI JATENG mengikat pengelola desa wisata (Pokdarwis) untuk melakukan tindak lanjut terukur dalam 4 tahap berstandar:
        </p>

        {/* 4 Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <span className="w-6 h-6 rounded-full bg-[#0D2453] text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-[#0D2453]">Verifikasi Lapangan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengurus Pokdarwis wajib memeriksa kondisi fisik lokasi aduan dalam waktu maksimal <strong>1x24 jam</strong> sejak laporan diterbitkan.
            </p>
            <span className="inline-block text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Maks. 24 Jam
            </span>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <span className="w-6 h-6 rounded-full bg-[#0D2453] text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-[#0D2453]">Isolasi &amp; Rambu K3</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika aduan menyangkut bahaya fisik (pagar ambruk, jembatan retak), segera pasang tanda bahaya darurat atau barikade sementara.
            </p>
            <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Mitigasi Darurat
            </span>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <span className="w-6 h-6 rounded-full bg-[#0D2453] text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-bold text-[#0D2453]">Eksekusi Perbaikan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Perbaikan sarana dilaksanakan memakai pos kas pemeliharaan sarpras desa dengan material berstandar mutu dan tukang setempat.
            </p>
            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Pekerjaan Fisik
            </span>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-sm font-bold text-emerald-950">Proof-of-Fix &amp; EXIF</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Ambil foto fisik kondisi sesudah perbaikan. Sistem memverifikasi timestamp kamera digital untuk memastikan perbaikan sah.
            </p>
            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              Tiket Tuntas
            </span>
          </div>
        </div>
      </section>

      {/* MODUL 3: STANDAR KESELAMATAN K3 WAHANA WISATA */}
      <section id="standar-k3" className="bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Modul Keselamatan 03</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
              Standar Kelaikan Sarana &amp; Mitigasi Risiko Bahaya K3
            </h2>
          </div>
        </div>

        {/* Case Study Box */}
        <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 text-rose-950 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Pelajaran Kasus K3 Wisata Buatan</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            Tragedi pecahnya jembatan kaca The Geong di Limpakuwus Banyumas (Oktober 2023) menjadi pengingat kritis bahwa wahana buatan di desa wisata <strong>wajib menjalani uji kelaikan teknis struktural</strong>, tidak boleh dibangun secara amatir tanpa perhitungan beban dan izin uji kelayakan.
          </p>
        </div>

        {/* Checklist K3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">Uji Beban &amp; Struktur Berkala</h3>
              <p className="text-xs text-slate-600">
                Jembatan gantung, dek pandang ketinggian, dan wahana flying fox wajib memiliki sertifikat uji beban berkala setiap 6 bulan sekali.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">Material Tahan Cuaca Ekstrem</h3>
              <p className="text-xs text-slate-600">
                Di area lembap seperti bibir air terjun (curug), pagar pengaman wajib menggunakan pipa besi galvanis anti-karat berpondasi cor beton, bukan bambu lapuk.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">Rambu Kedalaman &amp; Jalur Evakuasi</h3>
              <p className="text-xs text-slate-600">
                Pemasangan rambu kedalaman air di kolam alami, penanda zona bahaya arus deras, serta petunjuk jalur evakuasi bencana alam yang jelas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">Kesiapan Alat Penolong &amp; P3K</h3>
              <p className="text-xs text-slate-600">
                Ketersediaan pelampung (life jacket), ring buoy penolong air, kotak P3K lengkap obat darurat, serta petugas jaga bersertifikasi water rescue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MODUL 4: DIREKTORI CEPAT BANTUAN DARURAT JAWA TENGAH */}
      <section id="kontak-darurat" className="bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Modul Kesiapsiagaan 04</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
              Direktori Cepat Bantuan Darurat Jawa Tengah
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Simpan dan hubungi nomor darurat terpadu berikut saat terjadi kecelakaan wisatawan, insiden kegagalan wahana, atau kondisi darurat bencana alam di lokasi desa wisata:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Basarnas */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-[#0D2453] uppercase tracking-wider">
              Basarnas Jawa Tengah
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              115 / (024) 7629192
            </div>
            <p className="text-[11px] text-slate-500">
              Penyelamatan kecelakaan air, tebing, dan pencarian korban hilang di alam liar.
            </p>
          </div>

          {/* PMI */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              PMI Jawa Tengah
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              (024) 8313411
            </div>
            <p className="text-[11px] text-slate-500">
              Layanan ambulans gawat darurat dan pertolongan pertama korban cedera fisik.
            </p>
          </div>

          {/* Kepolisian */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Call Center Polri
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              110
            </div>
            <p className="text-[11px] text-slate-500">
              Bebas pulsa 24 jam untuk laporan gangguan keamanan, pungli, atau tindak kriminal.
            </p>
          </div>

          {/* Disporapar Jateng */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Disporapar Pemprov Jateng
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              (024) 3546048
            </div>
            <p className="text-[11px] text-slate-500">
              Posko Pengawasan &amp; Kemitraan Desa Wisata Dinas Kepemudaan, Olahraga dan Pariwisata.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
