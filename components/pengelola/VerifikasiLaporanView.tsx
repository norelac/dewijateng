'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileImage,
  ChevronDown,
  ShieldCheck,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { DashboardTicket, TicketStatus } from './types';

interface VerifikasiLaporanViewProps {
  ticket: DashboardTicket;
  onBack: () => void;
  onConfirmVerification: (
    ticketId: string,
    result: string,
    notes: string
  ) => void;
  onSwitchToProgres?: () => void;
}

export default function VerifikasiLaporanView({
  ticket,
  onBack,
  onConfirmVerification,
  onSwitchToProgres,
}: VerifikasiLaporanViewProps) {
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [resultDropdownOpen, setResultDropdownOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  const isAlreadyVerified = ticket.status !== 'Masuk';

  const verificationOptions = [
    'Sesuai fakta lapangan (Diverifikasi)',
    'Perlu peninjauan ulang lapangan',
    'Bukan kewenangan desa / Dialihkan',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirmVerification(
      ticket.id,
      selectedResult || 'Sesuai fakta lapangan (Diverifikasi)',
      notes
    );
    setVerifiedSuccess(true);
    setTimeout(() => {
      if (onSwitchToProgres) {
        onSwitchToProgres();
      } else {
        onBack();
      }
    }, 700);
  };

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {/* 1. Tombol Kembali */}
      <button
        type="button"
        onClick={onBack}
        className="font-semibold text-[#0d2453] text-[12px] leading-normal self-start hover:underline cursor-pointer flex items-center gap-1.5"
      >
        <span>←</span>
        <span>Kembali ke Kelola laporan</span>
      </button>

      {/* 2. Pengantar Halaman (Judul & Subtitle) */}
      <div className="flex flex-col gap-[7px] w-full">
        <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal">
          {ticket.title}
        </h1>
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
          {ticket.code} · {ticket.fullDate || `Diterima ${ticket.date}`}
        </p>
      </div>

      {/* 3. Detail dan Verifikasi 2-Kolom Grid */}
      <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Kolom Kiri: Informasi Aduan */}
        <div className="flex-1 min-w-px flex flex-col gap-[24px] w-full">
          {/* Bagian: Rincian Laporan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Rincian laporan
            </h2>

            {/* Metadata Laporan */}
            <div className="flex items-center gap-[16px] w-full">
              <span className="bg-[#edf3fc] text-[#0d2453] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal">
                {ticket.status}
              </span>
              <p className="text-[#64748b] text-[13px] leading-[1.5] truncate">
                Lokasi: {ticket.location}
              </p>
            </div>

            {/* Pemisah */}
            <div className="h-px bg-[#e6ecf5] w-full" />

            {/* Deskripsi Laporan */}
            <div className="flex flex-col gap-[6px]">
              <h3 className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                Deskripsi laporan
              </h3>
              <p className="text-[#0d2453] text-[13px] font-normal leading-[1.5]">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Bagian: Bukti Laporan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Bukti laporan
            </h2>

            {/* Lampiran Box */}
            <div className="bg-[#f3f5f8] border border-[#e6ecf5] rounded-[10px] p-[16px] flex items-center justify-between gap-[12px] w-full">
              <div className="flex items-center gap-[12px] min-w-0 flex-1">
                <FileImage className="w-[18px] h-[18px] text-[#0d2453] shrink-0" />
                <div className="flex flex-col gap-[3px] min-w-0 leading-[1.5]">
                  <p className="text-[#0d2453] text-[13px] font-semibold truncate">
                    {ticket.imageLabel || 'Foto kondisi keran'}
                  </p>
                  <p className="text-[#64748b] text-[11px] font-normal truncate">
                    {ticket.imageSub ||
                      'Representasi lampiran · gambar kondisi fasilitas'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="font-semibold text-[#0d2453] text-[12px] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Lihat
              </button>
            </div>
          </div>

          {/* Bagian: Linimasa Laporan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Linimasa laporan
            </h2>

            <div className="flex items-start gap-[20px] w-full">
              <span className="bg-[#edf3fc] text-[#0d2453] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal shrink-0">
                {ticket.status}
              </span>
              <div className="flex flex-col gap-[5px] flex-1 leading-[1.5] text-[13px]">
                <p className="text-[#0d2453] font-semibold">
                  {ticket.date} · Laporan diterima
                </p>
                <p className="text-[#64748b] font-normal">
                  Menunggu pemeriksaan dan verifikasi pengelola desa.
                </p>
              </div>
            </div>

            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
              Tahap berikutnya: Diverifikasi → Diproses → Selesai
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Formulir Verifikasi & Catatan Info */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-[20px]">
          {/* Card Verifikasi Laporan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <div className="flex flex-col gap-[6px]">
              <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
                Verifikasi laporan
              </h2>
              <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
                Pastikan lokasi, uraian, dan bukti sesuai sebelum melanjutkan.
              </p>
            </div>

            {!isAlreadyVerified ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
                {/* Hasil Pemeriksaan Dropdown */}
                <div className="flex flex-col gap-[7px] relative">
                  <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                    Hasil pemeriksaan
                  </label>
                  <button
                    type="button"
                    onClick={() => setResultDropdownOpen(!resultDropdownOpen)}
                    className="bg-white border border-[#e6ecf5] rounded-[8px] min-h-[44px] p-[12px] flex items-center justify-between text-left text-[13px] hover:border-slate-400 transition-colors"
                  >
                    <span
                      className={
                        selectedResult ? 'text-[#0d2453]' : 'text-[#64748b]'
                      }
                    >
                      {selectedResult || 'Pilih hasil pemeriksaan'}
                    </span>
                    <ChevronDown className="w-[16px] h-[16px] text-[#64748b] shrink-0" />
                  </button>

                  {resultDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setResultDropdownOpen(false)}
                      />
                      <div className="absolute top-[72px] left-0 right-0 bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {verificationOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setSelectedResult(opt);
                              setResultDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center justify-between hover:bg-slate-50 ${
                              selectedResult === opt
                                ? 'text-[#0d2453] font-semibold bg-slate-50'
                                : 'text-[#64748b]'
                            }`}
                          >
                            <span>{opt}</span>
                            {selectedResult === opt && (
                              <Check className="w-4 h-4 text-[#0d2453]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Catatan Verifikasi */}
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                    Catatan verifikasi
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tulis hasil pengecekan fasilitas dan rencana tindak lanjut…"
                    className="bg-white border border-[#e6ecf5] rounded-[8px] min-h-[92px] p-[12px] text-[13px] text-[#0d2453] placeholder:text-[#64748b] outline-none focus:ring-1 focus:ring-[#0d2453] resize-none"
                  />
                </div>

                {/* Pilihan Checkbox Konfirmasi */}
                <div
                  onClick={() => setIsConfirmed(!isConfirmed)}
                  className="flex items-center gap-[10px] cursor-pointer select-none pt-1"
                >
                  <div
                    className={`size-[20px] rounded-[4px] border flex items-center justify-center transition-colors ${
                      isConfirmed
                        ? 'bg-[#0d2453] border-[#0d2453] text-white'
                        : 'bg-white border-[#b9b9b9]'
                    }`}
                  >
                    {isConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-[#0d2453] text-[13px] leading-[1.5]">
                    Informasi dan bukti sudah diperiksa
                  </span>
                </div>

                <p className="text-[#64748b] text-[11px] leading-[1.5]">
                  Setelah diverifikasi, status berubah menjadi Diverifikasi. Penanganan dicatat pada tahap berikutnya.
                </p>

                {/* Tindakan Formulir */}
                <div className="flex items-center gap-[10px] pt-[6px]">
                  <button
                    type="submit"
                    disabled={!isConfirmed}
                    className={`border-2 rounded-full h-[40px] px-[18px] text-[12px] font-semibold transition-all ${
                      isConfirmed
                        ? 'bg-[#0d2453] border-[#0d2453] text-white hover:bg-[#132d66] active:scale-95 cursor-pointer'
                        : 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {verifiedSuccess ? 'Terverifikasi!' : 'Verifikasi laporan'}
                  </button>

                  <button
                    type="button"
                    onClick={onBack}
                    className="bg-white border-2 border-[#e6ecf5] text-[#0d2453] text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-[#e7f5ed] border border-[#a3e2cb] rounded-xl p-3.5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#16725c] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-[12px] leading-tight">
                    <span className="font-semibold text-[#16725c]">
                      Status: {ticket.status}
                    </span>
                    <span className="text-[#16725c]/80 text-[11px]">
                      Tahap verifikasi pemeriksaan awal telah selesai.
                    </span>
                  </div>
                </div>

                <p className="text-[#64748b] text-[13px] leading-relaxed">
                  Laporan ini sudah diverifikasi. Silakan buka halaman <strong>Perbarui Penanganan</strong> untuk mencatat perkembangan fisik lapangan dan mengunggah foto bukti setelah perbaikan (Proof-of-Fix).
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchToProgres) onSwitchToProgres();
                    }}
                    className="w-full bg-[#0d2453] text-white text-[12px] font-semibold rounded-full h-[42px] px-[18px] hover:bg-[#132d66] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Lanjut ke Penanganan &amp; Bukti Foto Sesudah</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full bg-white border-2 border-[#e6ecf5] text-[#0d2453] text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-slate-50 transition-all cursor-pointer text-center"
                  >
                    Kembali ke Daftar Laporan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Informasi Privasi */}
          <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px]">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="text-[#0d2453] text-[13px] leading-[1.5]">
              Jangan menulis nama, nomor telepon, atau identitas pelapor dalam catatan publik.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Sub-Footer Layanan */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>Desa Candirejo · Per 28 Oktober 2026</span>
      </div>

      {/* Modal Pratinjau Foto Bukti Aduan */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowImageModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e6ecf5] shadow-2xl w-full max-w-lg p-5 z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6ecf5]">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#0d2453]">
                  {ticket.imageLabel || 'Foto Bukti Aduan'}
                </span>
                <span className="text-[11px] text-[#64748b] font-mono">
                  {ticket.code}
                </span>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-slate-100 border border-[#e6ecf5]">
              <Image
                src={ticket.image}
                alt={ticket.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#64748b]">
                {ticket.location}
              </span>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-slate-100 rounded-full"
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
