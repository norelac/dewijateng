'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface GuideItem {
  title: string;
  body: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: 'Verifikasi laporan',
    body: 'Buka Kelola aduan → Lihat detail. Periksa lokasi, uraian, dan lampiran. Isi catatan, konfirmasi pemeriksaan, lalu pilih Verifikasi laporan.',
  },
  {
    title: 'Progres & penyelesaian',
    body: 'Buka Perbarui progres pada laporan Diproses. Catat pekerjaan dan unggah foto sesudah. Tandai selesai hanya jika masalah tertangani, lalu Simpan progres.',
  },
  {
    title: 'Anggaran desa',
    body: 'Buka Anggaran desa → Ubah anggaran. Periksa tahun dan nominal ketiga sumber. Total dihitung otomatis; Simpan perubahan memperbarui informasi publik.',
  },
  {
    title: 'Bukti & publikasi',
    body: 'Buka Pengeluaran & bukti. Tambah atau ubah kegiatan, isi nominal dan tanggal, lalu lampirkan nota serta foto fisik. Pilih Draf atau Terpublikasi sebelum menyimpan.',
  },
  {
    title: 'Privasi pelapor',
    body: 'Gunakan kode laporan, bukan nama pelapor. Samarkan data pribadi pada foto dan nota. Jangan masukkan kontak pribadi ke catatan yang akan dipublikasikan.',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Kapan laporan boleh diselesaikan?',
    answer: 'Setelah masalah tertangani, catatan hasil diisi, dan dokumentasi sesudah tersedia. Status berubah setelah Simpan progres.',
  },
  {
    question: 'Apakah Draf tampil di situs publik?',
    answer: 'Tidak. Draf tetap tersimpan untuk pengelola. Pilih Terpublikasi dan simpan setelah bukti diperiksa serta aman dibagikan.',
  },
  {
    question: 'Mengapa total belanja belum berubah?',
    answer: 'Formulir yang belum disimpan tidak masuk buku kas. Mengubah kegiatan yang sudah ada memperbarui data tersebut, bukan menambah salinan.',
  },
  {
    question: 'Apakah identitas pelapor boleh dicantumkan?',
    answer: 'Tidak. Gunakan kode DS-JTG pada komunikasi dan catatan. Identitas serta kontak pelapor harus tetap dilindungi.',
  },
];

export default function PusatBantuanView() {
  return (
    <div
      className="flex flex-col gap-[24px] w-full"
      data-node-id="352:13510"
    >
      {/* 1. Pengantar halaman */}
      <div className="flex items-center w-full">
        <div className="flex flex-1 flex-col gap-[7px] min-w-px">
          <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal w-full">
            Pusat bantuan
          </h1>
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
            Panduan singkat untuk mengelola layanan Desa Candirejo dengan aman.
          </p>
        </div>
      </div>

      {/* 2. Panduan dan pertanyaan */}
      <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Panduan tugas admin */}
        <div className="flex flex-1 min-w-px w-full">
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Panduan tugas admin
            </p>
            {GUIDE_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-[8px] items-start w-full"
              >
                <p className="text-[#0d2453] text-[16px] font-semibold leading-[1.5] w-full">
                  {item.title}
                </p>
                <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
                  {item.body}
                </p>
                <div className="bg-[#e6ecf5] h-px w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Pertanyaan umum */}
        <div className="flex flex-col gap-[20px] items-start w-full lg:w-[390px] lg:shrink-0">
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Pertanyaan yang sering diajukan
            </p>
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="flex flex-col gap-[8px] items-start w-full"
              >
                <p className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full">
                  {item.question}
                </p>
                <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
                  {item.answer}
                </p>
                <div className="bg-[#e6ecf5] h-px w-full" />
              </div>
            ))}
          </div>

          {/* Catatan informasi */}
          <div className="bg-[#edf3fc] flex gap-[10px] items-start p-[16px] rounded-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="flex-1 min-w-px text-[#0d2453] text-[13px] font-normal leading-[1.5]">
              Akses Anda hanya untuk Desa Candirejo. Pengaturan ini tidak mencakup
              pengelolaan pengguna tingkat provinsi.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Catatan layanan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] font-normal leading-[1.5] w-full">
        <p>© 2026 DEWI JATENG</p>
        <p>Desa Candirejo · Per 28 Oktober 2026</p>
      </div>
    </div>
  );
}
