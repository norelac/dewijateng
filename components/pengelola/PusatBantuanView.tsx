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
    body: 'Buka Kelola laporan → pilih laporan berstatus Masuk. Periksa lokasi, uraian, dan lampiran. Isi catatan, centang konfirmasi pemeriksaan, lalu pilih Verifikasi laporan.',
  },
  {
    title: 'Progres & penyelesaian',
    body: 'Buka Perbarui progres pada laporan yang sedang ditangani. Lampirkan foto sesudah penanganan dan tandai selesai agar laporan tertutup dengan bukti. Catatan progres bertahap belum tersimpan sampai endpoint catatan tersedia di backend.',
  },
  {
    title: 'Anggaran desa',
    body: 'Buka Anggaran desa untuk melihat alokasi dan realisasi. Form ubah anggaran sudah mengikuti desain, tetapi tombol simpan belum aktif karena endpoint tulis anggaran belum ada.',
  },
  {
    title: 'Pengeluaran & bukti',
    body: 'Buka Pengeluaran & bukti untuk melihat buku kas dari pos belanja LPJ yang diunggah. Form tambah dan ubah pengeluaran menunggu endpoint tulis; nota dan foto per pos tampil setelah kolom lampiran tersedia.',
  },
  {
    title: 'Unggah LPJ',
    body: 'Buka Unggah LPJ, pilih berkas PDF resmi, lalu unggah. Pos belanja hasil ekstraksi langsung mengisi buku kas dan ringkasan anggaran desa.',
  },
  {
    title: 'Privasi pelapor',
    body: 'Gunakan kode laporan, bukan nama pelapor. Samarkan data pribadi pada foto dan nota. Jangan masukkan kontak pribadi ke catatan yang akan dipublikasikan.',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Kapan laporan boleh diselesaikan?',
    answer:
      'Setelah masalah tertangani, ringkasan tindakan diisi, dan foto sesudah penanganan dilampirkan. Status berubah setelah bukti disimpan.',
  },
  {
    question: 'Mengapa tombol simpan pengeluaran belum aktif?',
    answer:
      'Endpoint tulis pengeluaran belum tersedia. Selama itu, buku kas hanya membaca pos belanja yang masuk dari unggahan LPJ.',
  },
  {
    question: 'Mengapa total belanja belum berubah?',
    answer:
      'Buku kas mengikuti pos belanja yang tersimpan di basis data. Perubahan baru terlihat setelah pos belanja tersimpan, bukan saat form masih diisi.',
  },
  {
    question: 'Apakah identitas pelapor boleh dicantumkan?',
    answer:
      'Tidak. Gunakan kode DS-JTG pada komunikasi dan catatan. Identitas serta kontak pelapor harus tetap dilindungi.',
  },
];

export default function PusatBantuanView({ villageName = 'desa' }: { villageName?: string }) {
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
            Panduan singkat untuk mengelola layanan {villageName} dengan aman.
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
              Akses Anda hanya untuk {villageName}. Pengaturan ini tidak mencakup
              pengelolaan pengguna tingkat provinsi.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Catatan layanan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] font-normal leading-[1.5] w-full">
        <p>© 2026 DEWI JATENG</p>
        <p>{villageName}</p>
      </div>
    </div>
  );
}
