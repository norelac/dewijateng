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
          <p className="text-xs sm:text-sm text-[#64748B] font-normal max-w-2xl">
            Hak warga atas informasi anggaran, prosedur penanganan aduan, dan syarat kelaikan fasilitas wisata.
          </p>
        </div>

        <div className="flex flex-col gap-6">

          {/* ── Modul 1: UU KIP — dua kolom horizontal ── */}
          <div className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.07)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
              {/* Kiri: narasi */}
              <div className="p-7 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-[#E6ECF5]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#0D2453]">
                    Hak warga atas informasi anggaran desa
                  </h3>
                </div>
                <p className="text-sm text-[#475569] leading-relaxed">
                  UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik memberi setiap warga hak memperoleh informasi tentang perencanaan, pelaksanaan, dan pertanggungjawaban anggaran desa — termasuk bantuan keuangan dari Pemprov dan APBDes.
                </p>
                <div className="pt-1 border-t border-[#F1F5F9]">
                  <p className="text-[11px] text-[#64748B]">
                    <span className="font-semibold text-[#0D2453]">Rujukan:</span>{' '}
                    UU No. 14/2008 Ps. 4, 7, 9 · PP No. 61/2010 · Permendagri No. 20/2020
                  </p>
                </div>
              </div>
              {/* Kanan: tiga hak ringkas */}
              <div className="p-7 bg-[#F7F9FC] flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#64748B]">Tiga hak utama warga</span>
                {[
                  { label: 'Minta LPJ', desc: 'BPMD wajib mempublikasikan LPJ bantuan sarana prasarana ≥ Rp 100 juta per desa.' },
                  { label: 'Ajukan keberatan', desc: 'Jika dokumen ditolak tanpa alasan sah, warga dapat melapor ke Komisi Informasi Provinsi.' },
                  { label: 'Sanksi pelanggaran', desc: 'Pelanggaran KIP dapat berujung sanksi administratif hingga pencabutan izin usaha wisata.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0D2453] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#0D2453] block">{item.label}</span>
                      <span className="text-[11px] text-[#64748B] leading-relaxed">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Modul 2: SOP 4-Tahap — horizontal stepper ── */}
          <div className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.07)] p-7 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#EDF3FC] flex items-center justify-center text-[#0D2453] shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D2453] leading-snug">
                  SOP penanganan aduan Pokdarwis
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Dari laporan masuk hingga bukti fisik perbaikan terunggah.</p>
              </div>
            </div>

            {/* Stepper horisontal */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-0">
              {/* connector line — desktop only */}
              <div className="hidden sm:block absolute top-5 left-[2.75rem] right-[2.75rem] h-px bg-[#E6ECF5]" />
              {[
                { n: 1, title: 'Verifikasi', sub: '< 24 jam setelah laporan masuk' },
                { n: 2, title: 'Pengadaan SSH', sub: 'Acuan Standar Satuan Harga Pemprov' },
                { n: 3, title: 'Pengerjaan fisik', sub: 'Dokumentasi progres lapangan' },
                { n: 4, title: 'Proof-of-Fix', sub: 'Foto sesudah + verifikasi EXIF' },
              ].map((s) => (
                <div key={s.n} className="relative z-10 flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-2 flex-1">
                  <span className="w-10 h-10 rounded-full bg-[#0D2453] text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {s.n}
                  </span>
                  <div className="sm:text-center">
                    <span className="text-xs font-bold text-[#0D2453] block">{s.title}</span>
                    <span className="text-[11px] text-[#64748B] leading-relaxed block max-w-[120px] sm:mx-auto">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Modul 3 & 4 — dua kolom bawah ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Modul 3: K3 — pull-quote + tabel standar */}
            <div className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.07)] p-7 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#FEF2F2] flex items-center justify-center text-[#B91C1C] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D2453]">Standar K3 wisata buatan</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">The Geong, Limpakuwus — insiden 2023</p>
                </div>
              </div>

              {/* Pull-quote */}
              <blockquote className="border-l-2 border-[#B91C1C] pl-4 py-1">
                <p className="text-sm text-[#0D2453] leading-relaxed">
                  Jembatan kaca di The Geong runtuh karena kaca tempered tidak memenuhi standar ketebalan. Investigasi menemukan pemasangan struktural tidak sesuai spesifikasi SNI.
                </p>
              </blockquote>

              {/* Tabel standar minimum */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F7F9FC] text-[#0D2453]">
                    <th className="px-3 py-2 rounded-l-lg font-semibold">Komponen</th>
                    <th className="px-3 py-2 rounded-r-lg font-semibold">Standar minimum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {[
                    ['Kaca lantai vertikal', 'Laminated tempered ≥ 25 mm'],
                    ['Railing', 'Galvanis, tahan 100 kg/m'],
                    ['Pelampung', 'SNI — wajib di curug & kolam'],
                    ['Inspeksi berkala', 'Tiap 6 bulan oleh ahli teknik'],
                    ['Asuransi', 'Min. Rp 50 juta / kejadian'],
                  ].map(([k, v], i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-[#475569]">{k}</td>
                      <td className="px-3 py-2 font-medium text-[#0D2453]">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-[11px] text-[#64748B]">
                Dasar hukum: PP No. 50/2012, Permenpar No. 17/2015, SNI 03-4432-1997
              </p>
            </div>

            {/* Modul 4: Direktori Darurat — nomor besar, baris penuh */}
            <div className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0_1px_2px_rgba(13,36,83,0.04),0_8px_16px_-6px_rgba(13,36,83,0.07)] p-7 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-[#15803D] shrink-0">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D2453]">Kontak darurat Jawa Tengah</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Ketuk nomor untuk memanggil langsung.</p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-[#F1F5F9]">
                {[
                  { name: 'Basarnas Jateng', num: '(024) 760-7777', desc: 'Pencarian & pertolongan' },
                  { name: 'PMI Jawa Tengah', num: '(024) 354-3500', desc: 'Donor darah & ambulans' },
                  { name: 'Call Center Darurat', num: '112', desc: 'Gratis, terpadu, 24 jam' },
                  { name: 'Disporapar Jateng', num: '(024) 354-6681', desc: 'Pengaduan wisata' },
                ].map((c) => (
                  <a
                    key={c.num}
                    href={`tel:${c.num.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center justify-between py-3.5 group focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2 rounded"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#0D2453] block">{c.name}</span>
                      <span className="text-[11px] text-[#64748B]">{c.desc}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-extrabold text-[#0D2453] font-mono tracking-tight">
                        {c.num}
                      </span>
                      <Phone className="w-4 h-4 text-[#15803D] group-hover:scale-110 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>

              <p className="text-[11px] text-[#64748B] text-center bg-[#F7F9FC] rounded-lg py-2">
                Nomor di atas terhubung langsung via ponsel Anda.
              </p>
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
