'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  ChevronDown,
  ArrowUpRight,
  FileText,
  X,
  Maximize2,
} from 'lucide-react';

interface ExpenditureItem {
  id: string;
  date: string;
  title: string;
  sub: string;
  amount: string;
  receiptImg: string;
  photoImg: string;
}

const EXPENDITURES: ExpenditureItem[] = [
  {
    id: 'exp-1',
    date: '16 Okt 2026',
    title: 'Perbaikan jalur pejalan kaki',
    sub: 'Akses wisata & pagar pengaman',
    amount: '320.000.000',
    receiptImg: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=1000&auto=format&fit=crop&q=85',
    photoImg: '/img/figma/curug-sesudah.png',
  },
  {
    id: 'exp-2',
    date: '12 Okt 2026',
    title: 'Penataan area parkir wisata',
    sub: 'Permukaan & marka area parkir',
    amount: '240.000.000',
    receiptImg: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=85',
    photoImg: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 'exp-3',
    date: '08 Okt 2026',
    title: 'Pengelolaan kebersihan desa',
    sub: 'Tempat sampah & sarana kebersihan',
    amount: '180.000.000',
    receiptImg: 'https://images.unsplash.com/photo-1554415707-9e4966a6e483?w=1000&auto=format&fit=crop&q=85',
    photoImg: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1000&auto=format&fit=crop&q=85',
  },
  {
    id: 'exp-4',
    date: '05 Okt 2026',
    title: 'Pemeliharaan toilet wisata',
    sub: 'Sanitasi & perbaikan fasilitas',
    amount: '100.000.000',
    receiptImg: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=85',
    photoImg: '/img/figma/toilet-sesudah.png',
  },
];

export default function TransparansiPage() {
  const [selectedKabupaten, setSelectedKabupaten] = useState('Kabupaten Magelang');
  const [selectedDesa, setSelectedDesa] = useState('Desa Candirejo');
  const [selectedTahun, setSelectedTahun] = useState('2026');

  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
    type: 'Nota' | 'Foto Fisik';
  } | null>(null);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 min-[1328px]:px-0 flex flex-col items-start gap-[44px] mt-[44px] mb-24">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#767676] font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-[#0D2453] transition-colors">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-400">/</li>
          <li className="text-[#0D2453] font-semibold" aria-current="page">
            Transparansi Dana
          </li>
        </ol>
      </nav>

      {/* 2. Header Section */}
      <div className="w-full">
        <div className="flex items-center gap-2.5 text-[#0D2453]">
          <Landmark className="w-6 h-6 text-[#0D2453]" />
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0D2453]">
            Transparansi Dana Desa
          </h1>
        </div>
        <p className="text-xs sm:text-[15px] text-[#767676] mt-1.5 font-normal">
          Dari mana dana berasal dan untuk apa dibelanjakan? Telusuri anggaran hingga bukti penggunaannya.
        </p>
      </div>

      {/* 3. Filter Bar Card */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
        >
          {/* Pilih Kabupaten */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Pilih Kabupaten
            </label>
            <div className="relative">
              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Kabupaten Magelang">Kabupaten Magelang</option>
                <option value="Kabupaten Banyumas">Kabupaten Banyumas</option>
                <option value="Kabupaten Kendal">Kabupaten Kendal</option>
                <option value="Kabupaten Karanganyar">Kabupaten Karanganyar</option>
                <option value="Kabupaten Banjarnegara">Kabupaten Banjarnegara</option>
                <option value="Kabupaten Wonosobo">Kabupaten Wonosobo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pilih Desa */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Pilih Desa
            </label>
            <div className="relative">
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Desa Candirejo">Desa Candirejo</option>
                <option value="Desa Limpakuwus">Desa Limpakuwus</option>
                <option value="Desa Dieng Kulon">Desa Dieng Kulon</option>
                <option value="Desa Berjo">Desa Berjo</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tahun Anggaran */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-[#0D2453]">
              Tahun Anggaran
            </label>
            <div className="relative">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#767676] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tombol Tampilkan */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Tampilkan
            </button>
          </div>
        </form>
      </section>

      {/* 3. Village Header Banner Card */}
      <section className="w-full bg-[#0D2453] rounded-[24px] p-6 sm:p-8 text-white shadow-[0_4px_24px_rgba(13,36,83,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-bold tracking-tight">
            {selectedDesa}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-normal">
            Borobudur, {selectedKabupaten} ┬╖ Tahun anggaran {selectedTahun}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-300 font-medium block">
            Total Pendanaan
          </span>
          <span className="text-2xl sm:text-[34px] font-extrabold text-white tracking-tight block mt-0.5">
            Rp 1.200.000.000
          </span>
        </div>
      </section>

      {/* 4. Two Comparison Cards: Sumber Pendanaan vs Dana Terpakai */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card A: Sumber Pendanaan Desa (Donut Chart) */}
        <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
              Sumber Pendanaan Desa
            </h3>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Beberapa sumber pendapatan desa wisata.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Donut Chart Canvas SVG */}
            <div className="sm:col-span-6 flex items-center justify-center relative">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                {/* Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#E2E8F0"
                  strokeWidth="24"
                  fill="transparent"
                />
                {/* APBDes (60%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#0D2453"
                  strokeWidth="24"
                  strokeDasharray="233.74 389.56"
                  strokeDashoffset="0"
                  fill="transparent"
                />
                {/* Bantuan Provinsi (25%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#5A8CD4"
                  strokeWidth="24"
                  strokeDasharray="97.39 389.56"
                  strokeDashoffset="-233.74"
                  fill="transparent"
                />
                {/* PADes Wisata (15%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#B8D3F7"
                  strokeWidth="24"
                  strokeDasharray="58.43 389.56"
                  strokeDashoffset="-331.13"
                  fill="transparent"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base sm:text-lg font-bold text-[#0D2453] leading-tight">
                  Rp 1,2 Miliar
                </span>
                <span className="text-[10px] text-[#767676] font-medium">
                  Total pendanaan
                </span>
              </div>
            </div>

            {/* Legend Items */}
            <div className="sm:col-span-6 space-y-4">
              {/* Legend 1: APBDes */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#0D2453] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      APBDes
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5 font-medium">
                      Rp 720.000.000
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">60%</span>
              </div>

              {/* Legend 2: Bantuan Provinsi */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#5A8CD4] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      Bantuan Provinsi
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5 font-medium">
                      Rp 300.000.000
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">25%</span>
              </div>

              {/* Legend 3: PADes Wisata */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-xs bg-[#B8D3F7] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#0D2453] block leading-tight">
                      PADes Wisata
                    </span>
                    <span className="text-[11px] text-[#767676] block mt-0.5 font-medium">
                      Rp 180.000.000
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0D2453]">15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Dana Terpakai (Progress Bar & Stats) */}
        <div className="bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0D2453]">
              Dana Terpakai
            </h3>
            <p className="text-xs text-[#767676] mt-0.5 mb-6">
              Realisasi belanja dan saldo kas yang tersisa.
            </p>
          </div>

          <div className="space-y-6">
            {/* 70% Big Indicator */}
            <div className="flex items-baseline justify-between">
              <div className="text-5xl font-extrabold text-[#0D2453] tracking-tight">
                70%
              </div>
              <div className="text-xs text-[#767676] font-medium">
                dari total dana telah terpakai
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-4 rounded-full bg-[#DCE7F5] overflow-hidden flex">
              <div className="h-full bg-[#0D2453] rounded-full" style={{ width: '70%' }} />
            </div>

            {/* Bottom Summary (Dana Terpakai vs Sisa Saldo Kas) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0D2453]" />
                  <span>Dana Terpakai ┬╖ 70%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  Rp 840.000.000
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#767676] mb-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#DCE7F5]" />
                  <span>Sisa Saldo Kas ┬╖ 30%</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0D2453]">
                  Rp 360.000.000
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Table Section: Laporan Pengeluaran Desa Wisata */}
      <section className="w-full bg-white rounded-[24px] border border-[#E6ECF5] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0D2453]">
              Laporan Pengeluaran Desa Wisata
            </h3>
            <p className="text-xs text-[#767676] mt-0.5">
              Setiap pengeluaran disertai nota dan dokumentasi fisik. Klik bukti untuk memperbesar.
            </p>
          </div>
          <div className="text-xs text-[#767676] font-medium">
            Oktober 2026
          </div>
        </div>

        {/* Expenditures Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-[#0D2453]">
            {/* Table Head with Soft Blue Tint as in Figma */}
            <thead>
              <tr className="bg-[#DCE7F5]/70 text-[#0D2453] text-xs font-semibold">
                <th scope="col" className="px-5 py-3.5 rounded-l-xl">Tanggal</th>
                <th scope="col" className="px-5 py-3.5">Nama Kegiatan / Fasilitas</th>
                <th scope="col" className="px-5 py-3.5">Nominal (Rp)</th>
                <th scope="col" className="px-5 py-3.5 rounded-r-xl">Foto Bukti Nota &amp; Fisik</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6ECF5]">
              {EXPENDITURES.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Tanggal */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-[#0D2453] font-medium align-middle">
                    {row.date}
                  </td>

                  {/* Kegiatan */}
                  <td className="px-5 py-4 align-middle">
                    <div className="font-bold text-[#0D2453] text-xs sm:text-sm">{row.title}</div>
                    <div className="text-[11px] text-[#767676] mt-0.5">{row.sub}</div>
                  </td>

                  {/* Nominal */}
                  <td className="px-5 py-4 whitespace-nowrap font-bold text-[#0D2453] text-xs sm:text-sm align-middle">
                    {row.amount}
                  </td>

                  {/* Foto Bukti Nota & Fisik */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      {/* Nota Box */}
                      <div className="flex flex-col">
                        <div
                          onClick={() =>
                            setActiveModal({
                              url: row.receiptImg,
                              title: `${row.title} - Nota Kuitansi`,
                              type: 'Nota',
                            })
                          }
                          className="w-16 h-11 rounded-lg bg-[#E2E8F0] border border-slate-300 flex items-center justify-center text-[9px] font-bold text-[#475569] tracking-tighter text-center px-1 leading-tight select-none cursor-pointer hover:border-[#0D2453] hover:shadow-2xs transition-all"
                        >
                          NOTA KUITANSI
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModal({
                              url: row.receiptImg,
                              title: `${row.title} - Nota Kuitansi`,
                              type: 'Nota',
                            })
                          }
                          className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1 hover:underline cursor-pointer"
                        >
                          <span>Nota</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Foto Fisik Box */}
                      <div className="flex flex-col">
                        <div
                          onClick={() =>
                            setActiveModal({
                              url: row.photoImg,
                              title: `${row.title} - Foto Fisik Fasilitas`,
                              type: 'Foto Fisik',
                            })
                          }
                          className="w-16 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-[#0D2453] hover:shadow-2xs transition-all relative group"
                        >
                          <img
                            src={row.photoImg}
                            alt={row.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModal({
                              url: row.photoImg,
                              title: `${row.title} - Foto Fisik Fasilitas`,
                              type: 'Foto Fisik',
                            })
                          }
                          className="inline-flex items-center gap-0.5 text-[10px] text-[#0D2453] font-medium mt-1 hover:underline cursor-pointer"
                        >
                          <span>Foto Fisik</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Table Footer Total Summary */}
            <tfoot>
              <tr className="bg-slate-50/70 border-t border-[#E6ECF5] text-xs font-semibold text-[#0D2453]">
                <td className="px-5 py-4" colSpan={2}>
                  <span className="font-bold text-[#0D2453] text-sm">Total belanja tercatat</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-[#0D2453] text-sm">840.000.000</span>
                </td>
                <td className="px-5 py-4 text-xs text-[#767676] font-normal">
                  Sama dengan dana terpakai ┬╖ 70%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar exactly matching Figma */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-2 text-xs font-semibold text-[#767676] select-none">
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-[#0D2453] transition-colors pr-2 cursor-pointer"
          >
            <span>&larr; Prev 10</span>
          </button>

          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">1</span>
          <span className="px-1 text-slate-400">...</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">11</span>

          {/* Active Page 12 with Blue Underline Indicator */}
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 text-[#0D2453] font-bold">12</span>
            <span className="w-4 h-0.5 bg-[#0D2453] rounded-full" />
          </div>

          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">13</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">14</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">15</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">16</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">17</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">18</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">19</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">20</span>
          <span className="px-1 text-slate-400">...</span>
          <span className="px-1.5 py-1 hover:text-[#0D2453] cursor-pointer">78</span>

          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-[#0D2453] transition-colors pl-2 cursor-pointer"
          >
            <span>Next 10 &rarr;</span>
          </button>
        </div>
      </section>

      {/* Lightbox / Modal for Evidence Preview */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm sm:text-base">{activeModal.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeModal.url}
                alt={activeModal.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-4 bg-[#F7F9FC] flex justify-between items-center text-xs text-[#767676]">
              <span>Dokumentasi transparansi anggaran Desa Candirejo</span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0D2453] text-white font-bold text-xs hover:bg-[#163574] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
