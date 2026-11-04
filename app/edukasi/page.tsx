'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Plus,
  FilePlus2,
  BarChart2,
  Receipt,
  ShieldCheck,
  Ticket,
  Minus,
  Check,
  X,
  MessagesSquare,
  Scale,
  AlertTriangle,
  Phone,
  HeartPulse,
} from 'lucide-react';

interface GuideItem {
  id: string;
  category: 'Pelaporan' | 'Transparansi dana' | 'Privasi';
  tag: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GUIDE_CARDS: GuideItem[] = [
  {
    id: 'g-1',
    category: 'Pelaporan',
    tag: 'PELAPORAN',
    title: 'Cara Membuat Laporan',
    description:
      'Tentukan lokasi dan kategori, jelaskan kejadian, lalu tambahkan foto yang relevan. Periksa pilihan privasi sebelum mengirim dan simpan kode tiketnya.',
    icon: FilePlus2,
  },
  {
    id: 'g-2',
    category: 'Pelaporan',
    tag: 'PELAPORAN',
    title: 'Melacak Status Laporan',
    description:
      'Masukkan kode DS-JTG-2026-XXXX di Telusuri Laporan. Buka detail untuk melihat verifikasi desa, proses perbaikan, dan foto penyelesaian.',
    icon: Search,
  },
  {
    id: 'g-3',
    category: 'Transparansi dana',
    tag: 'TRANSPARANSI DANA',
    title: 'Memahami Transparansi Dana Desa',
    description:
      'Pilih desa dan tahun anggaran. Bandingkan sumber pendanaan, dana terpakai, serta saldo sebelum menelusuri rincian pengeluaran per kegiatan.',
    icon: BarChart2,
  },
  {
    id: 'g-4',
    category: 'Transparansi dana',
    tag: 'TRANSPARANSI DANA',
    title: 'Membaca Bukti Nota & Foto Fisik',
    description:
      'Cocokkan tanggal, kegiatan, dan nominal pada nota dengan baris pengeluaran. Gunakan foto fisik untuk memahami hasil kegiatan, bukan sebagai satu-satunya bukti.',
    icon: Receipt,
  },
  {
    id: 'g-5',
    category: 'Privasi',
    tag: 'PRIVASI',
    title: 'Privasi Pelapor',
    description:
      'Gunakan pilihan Anonim / Privat jika tidak ingin identitas tampil pada laporan publik. Hindari menulis nomor telepon, alamat pribadi, atau data sensitif di uraian dan foto.',
    icon: ShieldCheck,
  },
];

const STEPS = [
  { step: 1, title: 'Tulis Judul Laporan' },
  { step: 2, title: 'Pilih lokasi' },
  { step: 3, title: 'Ceritakan & beri bukti' },
  { step: 4, title: 'Periksa privasi' },
  { step: 5, title: 'Kirim & simpan kode laporan' },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Apakah saya bisa membuat laporan anonim?',
    answer:
      'Gunakan pilihan Laporan Anonim / Privat pada formulir. Jangan cantumkan identitas, nomor telepon, atau data sensitif dalam uraian maupun foto yang mungkin tampil publik.',
  },
  {
    id: 'faq-2',
    question: 'Bagaimana jika kode laporan saya hilang?',
    answer:
      'Periksa tangkapan layar atau catatan yang Anda simpan setelah mengirim. Jika tidak ditemukan, coba telusuri dengan kata kunci, lokasi, dan tanggal kejadian. Penelusuran publik tidak menjamin semua laporan dapat ditemukan.',
  },
  {
    id: 'faq-3',
    question: 'Bukti apa yang perlu saya sertakan?',
    answer:
      'Gunakan foto kondisi fasilitas, titik lokasi yang jelas, dan waktu kejadian. Untuk persoalan tarif, sertakan papan harga atau bukti pembayaran jika ada. Ambil bukti dengan aman dan hindari data pribadi orang lain.',
  },
  {
    id: 'faq-4',
    question: 'Apa arti status pada laporan?',
    answer:
      'Masuk: laporan terkirim. Diverifikasi: desa telah memeriksa laporan. Diproses: penanganan lapangan berlangsung. Selesai: penanganan ditutup dengan dokumentasi perbaikan. Lihat detail untuk tanggal dan catatan tiap tahap.',
  },
  {
    id: 'faq-5',
    question: 'Mengapa data dana atau bukti belum tersedia?',
    answer:
      'Data untuk desa atau tahun yang dipilih mungkin belum dipublikasikan atau belum dilengkapi. Periksa kembali pilihan wilayah dan tahun. Jangan mengartikan kolom kosong sebagai nilai nol atau bukti penyimpangan.',
  },
];

const CATEGORIES = ['Semua panduan', 'Pelaporan', 'Transparansi dana', 'Privasi'] as const;

export default function EdukasiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('Semua panduan');
  const [isSavedCodeChecked, setIsSavedCodeChecked] = useState(false);
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
    'faq-3': true,
    'faq-4': true,
    'faq-5': true,
  });

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter guides based on category and query
  const filteredGuides = useMemo(() => {
    return GUIDE_CARDS.filter((item) => {
      if (activeCategory !== 'Semua panduan' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTag = item.tag.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Filter FAQs based on query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 flex flex-col items-start gap-[44px] mt-[44px] mb-24">
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#767676] font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-[#0D2453] transition-colors">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-400">/</li>
          <li className="text-[#0D2453] font-semibold" aria-current="page">
            Edukasi &amp; Panduan
          </li>
        </ol>
      </nav>

      {/* 2. Header Section */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center gap-2.5 text-[#0D2453]">
          <BookOpen className="w-6 h-6 text-[#0D2453] stroke-[2.5]" />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0D2453]">
            Edukasi &amp; Panduan
          </h1>
        </div>
        <p className="text-xs sm:text-[15px] text-[#767676] font-normal leading-[1.7] max-w-3xl">
          Panduan untuk wisatawan dan warga. Pelajari cara melapor, pantau perbaikan, dan baca penggunaan dana desa dengan lebih mudah.
        </p>
      </div>

      {/* 3. Search & Filter Card */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.08),0_24px_40px_-12px_rgba(13,36,83,0.10)] flex flex-col gap-5">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-[#F3F5F8] border border-transparent rounded-[14px] h-[50px] px-4 py-3 flex-1 w-full flex items-center gap-3 transition-colors duration-150 focus-within:border-[#0D2453]/25 focus-within:ring-1 focus-within:ring-[#0D2453]/15">
            <Search className="w-5 h-5 text-[#64748B] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan, misalnya: kode tiket, bukti nota, atau privasi"
              className="w-full bg-transparent border-0 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#64748B] placeholder:font-normal focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="w-full sm:w-auto bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-6 py-3 rounded-full text-xs sm:text-[13px] font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            Cari Panduan
          </button>
        </div>

        {/* Categories row */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-[13px] transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0D2453] text-white font-bold shadow-xs'
                    : 'bg-[#F3F5F8] text-[#0D2453] font-semibold hover:bg-[#E6ECF5]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Panduan Dasar Section */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
            Panduan Dasar
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-normal">
            Lima panduan dasar untuk menggunakan DEWI JATENG
          </p>
        </div>

        {/* 6 Cards Grid: 5 standard cards + 1 navy ticket reminder card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredGuides.map((guide) => {
            const IconComponent = guide.icon;
            return (
              <div
                key={guide.id}
                className="bg-white rounded-[24px] border border-[#E6ECF5] p-7 flex flex-col gap-4 shadow-[0_1px_2px_rgba(13,36,83,0.035),0_8px_16px_-6px_rgba(13,36,83,0.08),0_20px_32px_-12px_rgba(13,36,83,0.08)] hover:border-[#CBD5E1] hover:shadow-[0_1px_2px_rgba(13,36,83,0.04),0_12px_24px_-8px_rgba(13,36,83,0.12)] transition-[border-color,box-shadow] duration-200"
              >
                {/* Header Tag & Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] shrink-0">
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.8px] text-[#64748B] uppercase">
                    {guide.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2 mt-1">
                  <h3 className="text-lg font-bold text-[#0D2453] leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-[13px] text-[#64748B] leading-[1.7] font-normal">
                    {guide.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Ticket Code Highlight Card (Card #6) */}
          {(activeCategory === 'Semua panduan' || activeCategory === 'Pelaporan') && (
            <div className="bg-[#0D2453] rounded-[24px] p-7 flex flex-col gap-3.5 text-white shadow-[0_1px_2px_rgba(13,36,83,0.06),0_10px_20px_-8px_rgba(13,36,83,0.20),0_28px_44px_-16px_rgba(13,36,83,0.30)]">
              <div className="size-7 shrink-0 text-white flex items-center justify-center">
                <Ticket className="w-6 h-6 stroke-[2]" />
              </div>

              <h3 className="text-xl font-bold text-white leading-snug">
                Satu kode, jejak perbaikan.
              </h3>

              <p className="text-[13px] text-white/70 leading-[1.7] font-normal">
                Setelah mengirim aduan, salin atau tangkap layar kode tiket di halaman konfirmasi agar mudah ditemukan kembali.
              </p>

              <div className="mt-auto pt-2 flex flex-col gap-1">
                <span className="text-[15px] font-bold text-white tracking-wide">
                  DS-JTG-2026-XXXX
                </span>
                <span className="text-[11px] text-white/60 font-normal">
                  Format kode laporan · simpan untuk penelusuran
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Langkah-langkah Melapor Section */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
            Langkah-langkah Melapor
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-normal">
            Ikuti lima langkah ini sebelum mengirim aduan tentang fasilitas atau pengalaman wisata Anda.
          </p>
        </div>

        <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.08),0_24px_40px_-12px_rgba(13,36,83,0.10)] flex flex-col gap-7">
          {/* 5 Steps horizontal flow */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center gap-3">
                <div className="size-9 rounded-full bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] font-bold text-sm shrink-0">
                  {s.step}
                </div>
                <span className="text-sm sm:text-base font-bold text-[#0D2453] leading-snug">
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#E6ECF5] w-full" />

          {/* Reminder row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 space-y-1.5">
              <h4 className="text-base font-bold text-[#0D2453]">
                Jangan tutup halaman sebelum menyimpan kode
              </h4>
              <p className="text-xs sm:text-[13px] text-[#64748B] leading-[1.7] font-normal max-w-xl">
                Kode Laporan adalah pengenal laporan, bukan data identitas pelapor. Gunakan kode ini saat membuka Telusuri Laporan.
              </p>
            </div>

            {/* Interactive simulated reminder card */}
            <div className="w-full md:w-[393px] shrink-0 flex flex-col gap-2">
              <span className="text-[11px] text-[#64748B] font-medium">
                Contoh pengingat setelah mengirim
              </span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsSavedCodeChecked(!isSavedCodeChecked)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSavedCodeChecked(!isSavedCodeChecked);
                  }
                }}
                className="p-5 rounded-[16px] border border-[#E6ECF5] bg-[#F8FAFC] flex items-start gap-4 cursor-pointer hover:border-[#CBD5E1] transition-colors"
              >
                <div
                  className={`size-6 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                    isSavedCodeChecked
                      ? 'bg-[#0D2453] border-[#0D2453] text-white'
                      : 'bg-white border-[#B9B9B9]'
                  }`}
                >
                  {isSavedCodeChecked && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div className="flex flex-col gap-1 leading-snug">
                  <span className="text-sm sm:text-base font-bold text-[#0D2453]">
                    Simpan kode laporan
                  </span>
                  <span className="text-xs text-[#64748B] leading-relaxed font-normal">
                    Salin kode atau simpan tangkapan layar konfirmasi.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Modul Literasi Hukum & Standar K3 Section */}
      <section className="w-full flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453]">
            Literasi Hukum & Standar K3 Wisata
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-normal">
            Pemahaman hak warga, SOP penanganan, dan standar kelaikan fasilitas wisata.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modul 1: UU KIP No. 14/2008 */}
          <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#EDE9FE] flex items-center justify-center text-[#6D28D9] shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-[#6D28D9] uppercase">
                  Modul 1
                </span>
                <h3 className="text-lg font-bold text-[#0D2453] mt-1 leading-snug">
                  Hak Warga atas Informasi Anggaran Desa
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed font-normal">
                  Berdasarkan UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik (KIP).
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px] text-[#0D2453] leading-relaxed">
              <p>
                Setiap warga berhak memperoleh informasi tentang perencanaan, pelaksanaan, dan pertanggungjawaban anggaran desa, termasuk bantuan keuangan dari Pemerintah Provinsi dan APBDes.
              </p>
              <ul className="space-y-2 pl-4">
                <li className="relative before:content-[''] before:absolute before:left-[-16px] before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#6D28D9]">
                  <strong>Badan Pemberdayaan Masyarakat Desa (BPMD)</strong> wajib mempublikasikan LPJ bantuan sarana prasarana wisata minimal Rp 100 juta per desa.
                </li>
                <li className="relative before:content-[''] before:absolute before:left-[-16px] before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#6D28D9]">
                  Warga dapat mengajukan keberatan kepada <strong>Komisi Informasi Provinsi</strong> jika dokumen ditolak tanpa alasan yang sah.
                </li>
                <li className="relative before:content-[''] before:absolute before:left-[-16px] before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#6D28D9]">
                  Pelanggaran keterbukaan informasi dapat dikenakan sanksi administratif hingga pencabutan izin usaha wisata.
                </li>
              </ul>
            </div>

            <div className="bg-[#F5F3FF] rounded-[14px] p-4 border border-[#E9D5FF]">
              <span className="text-[11px] font-semibold text-[#6D28D9] block mb-1">
                Rujukan Hukum:
              </span>
              <span className="text-xs text-[#4C1D95] font-medium">
                UU No. 14/2008 Pasal 4, 7, 9 · PP No. 61/2010 · Permendagri No. 20/2020
              </span>
            </div>
          </div>

          {/* Modul 2: SOP 4-Tahap Pokdarwis */}
          <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#DBEAFE] flex items-center justify-center text-[#1E40AF] shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-[#1E40AF] uppercase">
                  Modul 2
                </span>
                <h3 className="text-lg font-bold text-[#0D2453] mt-1 leading-snug">
                  SOP 4-Tahap Penanganan Aduan Pokdarwis
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed font-normal">
                  Alur standar dari laporan masuk hingga bukti fisik perbaikan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { num: 1, title: 'Verifikasi < 24 Jam', desc: 'Pokdarwis memeriksa validitas lokasi dan kategori aduan.' },
                { num: 2, title: 'Pengadaan Standar SSH', desc: 'Menggunakan Standar Satuan Harga Pemprov Jateng sebagai acuan.' },
                { num: 3, title: 'Pengerjaan Fisik', desc: 'Pelaksanaan perbaikan dilapangan dengan dokumentasi progres.' },
                { num: 4, title: 'Unggah Proof-of-Fix', desc: 'Foto sesudah wajib diverifikasi EXIF timestamp sebelum tiket ditutup.' },
              ].map((step) => (
                <div key={step.num} className="p-3.5 rounded-[14px] bg-[#F1F5F9] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#0D2453] text-white text-xs font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <span className="text-xs font-bold text-[#0D2453]">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modul 3: K3 Wisata Buatan (The Geong Lesson) */}
          <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#FEE2E2] flex items-center justify-center text-[#991B1B] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-[#991B1B] uppercase">
                  Modul 3
                </span>
                <h3 className="text-lg font-bold text-[#0D2453] mt-1 leading-snug">
                  Standar K3 Wisata Buatan
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed font-normal">
                  Pelajaran dari insiden The Geong Banyumas 2023.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px] text-[#0D2453] leading-relaxed">
              <p>
                Insiden runtuhnya jembatan kaca di The Geong, Limpakuwus, menewaskan pengunjung dan melukai puluhan. Investigasi menemukan kaca tempered tidak memenuhi standar ketebalan dan pemasangan struktural.
              </p>

              <div className="bg-[#FEF2F2] rounded-[14px] p-4 border border-[#FECACA]">
                <span className="text-[11px] font-bold text-[#991B1B] block mb-2">
                  Syarat Minimum K3 Fasilitas Wisata Buatan:
                </span>
                <ul className="space-y-1.5 text-xs text-[#7F1D1D]">
                  <li>• Kaca laminated tempered <strong>min. 25mm</strong> untuk lantai vertikal</li>
                  <li>• Railing galvanis tahan beban <strong>100 kg/m</strong></li>
                  <li>• Pelampung SNI di curug dan kolam renang</li>
                  <li>• Inspeksi berkala tiap 6 bulan oleh ahli teknik</li>
                  <li>• Asuransi pengunjung minimal Rp 50 juta/kejadian</li>
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-[#64748B]">
              <strong>Dasar Hukum:</strong> PP No. 50/2012 tentang K3, Permenpar No. 17/2015, dan SNI 03-4432-1997.
            </div>
          </div>

          {/* Modul 4: Direktori Darurat Jateng */}
          <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#DCFCE7] flex items-center justify-center text-[#166534] shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider text-[#166534] uppercase">
                  Modul 4
                </span>
                <h3 className="text-lg font-bold text-[#0D2453] mt-1 leading-snug">
                  Direktori Cepat Tanggap Darurat Jateng
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed font-normal">
                  Nomor darurat se-Jawa Tengah dengan klik langsung.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Basarnas Jateng', num: '(024) 760-7777', desc: 'Pencarian & pertolongan' },
                { name: 'PMI Jawa Tengah', num: '(024) 354-3500', desc: 'Donor darah & ambulans' },
                { name: 'Call Center 112', num: '112', desc: 'Darurat terpadu (gratis)' },
                { name: 'Disporapar Jateng', num: '(024) 354-6681', desc: 'Pengaduan wisata' },
              ].map((contact) => (
                <a
                  key={contact.num}
                  href={`tel:${contact.num.replace(/[^0-9+]/g, '')}`}
                  className="p-4 rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors cursor-pointer flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#166534]">{contact.name}</span>
                    <Phone className="w-4 h-4 text-[#166534] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm font-extrabold text-[#0D2453] font-mono">{contact.num}</span>
                  <span className="text-[10px] text-[#15803D]">{contact.desc}</span>
                </a>
              ))}
            </div>

            <div className="text-[11px] text-center text-[#64748B] bg-[#F7F9FC] rounded-[12px] py-2.5">
              Tombol di atas akan langsung menghubungi nomor terkait via ponsel Anda.
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="w-full flex flex-col lg:flex-row items-start justify-between gap-8">
        {/* Left Col Intro */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
          <div className="size-12 rounded-[14px] bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] shrink-0">
            <MessagesSquare className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#0D2453] leading-snug">
            Pertanyaan yang sering ditanyakan
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-[1.7] font-normal">
            Jawaban singkat sebelum Anda melapor atau membaca data desa.
          </p>
        </div>

        {/* Right Col List */}
        <div className="w-full lg:flex-1 bg-white rounded-[24px] border border-[#E6ECF5] px-6 sm:px-7 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.08),0_24px_40px_-12px_rgba(13,36,83,0.10)] divide-y divide-[#E6ECF5]">
          {filteredFaqs.length === 0 ? (
            <div className="py-8 text-center text-[#64748B] text-sm font-medium">
              Tidak ada pertanyaan yang sesuai dengan kata kunci pencarian.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqIds[faq.id] ?? false;
              return (
                <div key={faq.id} className="py-5 sm:py-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#0D2453] group-hover:text-blue-900 transition-colors">
                      {faq.question}
                    </span>
                    <div className="size-5 rounded-full bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] shrink-0 transition-transform duration-150">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <p className="text-xs sm:text-[13px] text-[#64748B] leading-[1.8] font-normal pr-4 animate-in fade-in duration-200">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="w-full bg-[#EDF3FC] rounded-[24px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,36,83,0.04),0_10px_20px_-10px_rgba(13,36,83,0.12),0_28px_48px_-24px_rgba(13,36,83,0.14)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-xl sm:text-[22px] font-bold text-[#0D2453]">
            Sudah siap ikut menjaga desa wisata?
          </h3>
          <p className="text-xs sm:text-[14px] text-[#64748B] leading-[1.6] font-normal">
            Mulai dari laporan yang jelas, lalu pantau perkembangannya dengan kode tiket.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/#buat-laporan"
            className="flex-1 sm:flex-initial bg-[#0D2453] border border-[#0D2453] hover:bg-[#132d66] text-white px-[18px] py-[13px] rounded-full text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan</span>
          </Link>
          <Link
            href="/lapor"
            className="flex-1 sm:flex-initial bg-white border border-[#0D2453] hover:bg-[#F8FAFC] text-[#0D2453] px-[18px] py-[13px] rounded-full text-xs sm:text-[13px] font-bold text-center transition-colors duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            Telusuri Laporan
          </Link>
        </div>
      </section>
    </div>
  );
}
