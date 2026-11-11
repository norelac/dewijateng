'use client';

import React from 'react';
import { ShieldCheck, Phone, MessageCircle } from 'lucide-react';

/** Narahubung pendamping desa. */
const CONTACT_PERSON = {
  name: 'Layanan Pendamping Desa',
  initials: 'PD',
  role: 'Pendamping Desa Wisata · Disbudparekraf Jateng',
  phone: '+62 858-1999-7505',
  waUrl: 'https://wa.me/6285819997505',
};

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
    body: 'Buka Perbarui progres pada laporan yang sedang ditangani. Lampirkan foto sesudah penanganan dan tandai selesai agar laporan tertutup dengan bukti.',
  },
  {
    title: 'Anggaran desa',
    body: 'Buka Anggaran desa untuk melihat alokasi dan realisasi. Ubah nilai per sumber dana, lalu pilih Simpan perubahan — total pendanaan dan halaman publik transparansi ikut diperbarui.',
  },
  {
    title: 'Pengeluaran & bukti',
    body: 'Buka Pengeluaran & bukti untuk melihat buku kas dari pos belanja LPJ yang diunggah. Anda bisa menambah, mengubah, dan menghapus pengeluaran; nota dan foto per pos tersedia sebagai bukti pendukung.',
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
    question: 'Bagaimana mengubah nilai anggaran desa?',
    answer:
      'Buka Anggaran desa, sesuaikan nilai per sumber dana, lalu pilih Simpan perubahan. Total pendanaan dan halaman transparansi publik ikut diperbarui.',
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

/** Panduan untuk akun Disbudparekraf (ruang admin dinas). */
const ADMIN_GUIDE_ITEMS: GuideItem[] = [
  {
    title: 'Verifikasi LPJ',
    body: 'Buka Aktivitas, pilih LPJ berstatus Menunggu Telaah. Periksa berkas dan realisasi, lalu Setujui atau kembalikan dengan catatan Revisi.',
  },
  {
    title: 'Monitoring keuangan',
    body: 'Menu Monitoring keuangan menampilkan pemasukan, pengeluaran, dan saldo per desa per periode. Saring menurut wilayah atau desa, lalu buka detail transaksi untuk memeriksa bukti.',
  },
  {
    title: 'Kelola akun desa',
    body: 'Buat akun pengelola di Akun desa wisata. Undangan aktivasi dikirim lewat email; pantau status Menunggu aktivasi dan kirim ulang bila tautan kedaluwarsa.',
  },
  {
    title: 'Anomali harga',
    body: 'Pos belanja yang menyimpang dari acuan SSH ditandai pada antrean LPJ. Minta klarifikasi ke desa sebelum menyetujui berkas.',
  },
];

const ADMIN_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Mengapa angka desa melapor berbeda dengan jumlah akun?',
    answer:
      'Desa melapor dihitung dari transaksi yang dikirim pada periode berjalan, sedangkan akun pengelola adalah akses login yang sudah dibuat.',
  },
  {
    question: 'Apa arti tanda “—” pada tabel?',
    answer:
      'Desa tersebut belum mengirim laporan pada periode itu, jadi nilainya belum diketahui — bukan nol.',
  },
  {
    question: 'Bagaimana mengunduh rekap keuangan?',
    answer:
      'Gunakan tombol Unduh pada halaman Monitoring keuangan. Berkas CSV mengikuti filter periode, wilayah, dan desa yang sedang aktif.',
  },
  {
    question: 'Apakah dinas dapat melihat kata sandi desa?',
    answer:
      'Tidak. Pengelola menetapkan kata sandi sendiri; pemulihan dilakukan lewat email akun desa.',
  },
];

export default function PusatBantuanView({
  villageName = 'desa',
  variant = 'pengelola',
}: {
  villageName?: string;
  variant?: 'pengelola' | 'admin';
}) {
  const isAdmin = variant === 'admin';
  const guideItems = isAdmin ? ADMIN_GUIDE_ITEMS : GUIDE_ITEMS;
  const faqItems = isAdmin ? ADMIN_FAQ_ITEMS : FAQ_ITEMS;
  const scopeLabel = isAdmin ? 'Provinsi Jawa Tengah' : villageName;

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
            {isAdmin
              ? 'Panduan singkat memantau desa wisata dan memverifikasi laporan.'
              : `Panduan singkat untuk mengelola layanan ${villageName} dengan aman.`}
          </p>
        </div>
      </div>

      {/* 2. Panduan dan pertanyaan */}
      <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Panduan tugas pengelola / admin dinas */}
        <div className="flex flex-1 min-w-px w-full">
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              {isAdmin ? 'Panduan tugas admin' : 'Panduan tugas pengelola'}
            </p>
            {guideItems.map((item) => (
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
            {faqItems.map((item) => (
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

          {/* Narahubung pendamping desa */}
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[16px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Narahubung pendamping
            </p>

            <div className="flex items-center gap-[12px] w-full">
              <div className="w-[44px] h-[44px] rounded-full bg-[#0d2453] text-white text-[14px] font-semibold flex items-center justify-center shrink-0">
                {CONTACT_PERSON.initials}
              </div>
              <div className="min-w-0">
                <p className="text-[#0d2453] text-[14px] font-semibold leading-tight">
                  {CONTACT_PERSON.name}
                </p>
                <p className="text-[#64748b] text-[12px] font-normal leading-[1.5]">
                  {CONTACT_PERSON.role}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-[8px] w-full">
              <a
                href={CONTACT_PERSON.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[10px] w-full rounded-[10px] border border-[#e6ecf5] px-[12px] py-[10px] text-[#0d2453] text-[13px] font-medium hover:bg-[#f7f9fc] transition-colors"
              >
                <MessageCircle className="w-[16px] h-[16px] shrink-0" />
                <span className="tabular-nums">{CONTACT_PERSON.phone}</span>
              </a>
            </div>

            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] flex items-start gap-[6px]">
              <Phone className="w-[14px] h-[14px] shrink-0 mt-[1px]" />
              <span>Jam layanan Senin–Jumat, 08.00–16.00 WIB.</span>
            </p>
          </div>

          {/* Catatan informasi */}
          <div className="bg-[#edf3fc] flex gap-[10px] items-start p-[16px] rounded-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="flex-1 min-w-px text-[#0d2453] text-[13px] font-normal leading-[1.5]">
              {isAdmin
                ? 'Akses Anda mencakup seluruh desa wisata Provinsi Jawa Tengah. Perubahan data keuangan tetap dilakukan oleh pengelola desa.'
                : `Akses Anda hanya untuk ${villageName}. Pengaturan ini tidak mencakup pengelolaan pengguna tingkat provinsi.`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Catatan layanan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] font-normal leading-[1.5] w-full">
        <p>© 2026 DEWI JATENG</p>
        <p>{scopeLabel}</p>
      </div>
    </div>
  );
}
