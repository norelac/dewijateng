'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  FileImage,
  Upload,
  ChevronDown,
  ShieldCheck,
  Check,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { DashboardTicket } from './types';

interface PerbaruiPenangananViewProps {
  ticket: DashboardTicket;
  onBack: () => void;
  onSaveProgress: (
    ticketId: string,
    notes: string,
    markCompleted: boolean,
    resolvedImage?: string
  ) => void;
}

export default function PerbaruiPenangananView({
  ticket,
  onBack,
  onSaveProgress,
}: PerbaruiPenangananViewProps) {
  const [stage, setStage] = useState<'Diproses' | 'Selesai'>(
    ticket.status === 'Selesai' ? 'Selesai' : 'Diproses'
  );
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [notes, setNotes] = useState(ticket.notes || '');
  const [markCompleted, setMarkCompleted] = useState(
    ticket.status === 'Selesai'
  );
  const [resolvedImage, setResolvedImage] = useState<string | null>(
    ticket.resolvedImage || null
  );
  const [showBeforeModal, setShowBeforeModal] = useState(false);
  const [showAfterModal, setShowAfterModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setResolvedImage(url);
    }
  };

  const handleUseSampleImage = () => {
    // Pick sample proof-of-fix image from local assets
    setResolvedImage('/img/figma/aduan-curug-sesudah.png');
  };

  const handleToggleComplete = () => {
    const nextVal = !markCompleted;
    setMarkCompleted(nextVal);
    if (nextVal) {
      setStage('Selesai');
    } else {
      setStage('Diproses');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProgress(
      ticket.id,
      notes,
      markCompleted,
      resolvedImage || undefined
    );
    setSaveSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1200);
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
          Perbarui penanganan
        </h1>
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
          {ticket.title} · {ticket.code}
        </p>
      </div>

      {/* 3. Konteks Laporan Bar */}
      <div className="flex items-center gap-[16px] w-full">
        <span
          className={`text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal ${
            ticket.status === 'Selesai'
              ? 'bg-[#e7f5ed] text-[#16725c]'
              : 'bg-[#fff4dd] text-[#99620e]'
          }`}
        >
          {ticket.status}
        </span>
        <p className="text-[#64748b] text-[13px] leading-[1.5]">
          {ticket.fullDate || `Diterima ${ticket.date}`} · Candirejo ·{' '}
          {ticket.status === 'Selesai'
            ? 'Status selesai'
            : 'Status saat ini, belum selesai'}
        </p>
      </div>

      {/* 4. Formulir dan Panduan 2-Kolom Grid */}
      <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Kolom Kiri: Formulir Progres */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-w-px flex flex-col gap-[24px] w-full"
        >
          {/* Card: Progres Penanganan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Progres penanganan
            </h2>

            {/* Tahap Saat Ini */}
            <div className="flex flex-col gap-[7px] relative">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                Tahap saat ini
              </label>
              <button
                type="button"
                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                className="bg-white border border-[#e6ecf5] rounded-[8px] min-h-[44px] p-[12px] flex items-center justify-between text-left text-[13px] text-[#0d2453] hover:border-slate-400 transition-colors"
              >
                <span>{stage}</span>
                <ChevronDown className="w-[16px] h-[16px] text-[#64748b] shrink-0" />
              </button>

              {stageDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setStageDropdownOpen(false)}
                  />
                  <div className="absolute top-[72px] left-0 right-0 bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setStage('Diproses');
                        setMarkCompleted(false);
                        setStageDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#0d2453] hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Diproses</span>
                      {stage === 'Diproses' && (
                        <Check className="w-4 h-4 text-[#0d2453]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStage('Selesai');
                        setMarkCompleted(true);
                        setStageDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-[13px] text-[#0d2453] hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Selesai</span>
                      {stage === 'Selesai' && (
                        <Check className="w-4 h-4 text-[#0d2453]" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Catatan Penanganan */}
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                Catatan penanganan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis pekerjaan yang sudah dilakukan, kondisi terkini, dan rencana lanjutan…"
                className="bg-white border border-[#e6ecf5] rounded-[8px] min-h-[92px] p-[12px] text-[13px] text-[#0d2453] placeholder:text-[#64748b] outline-none focus:ring-1 focus:ring-[#0d2453] resize-none"
              />
              <p className="text-[#64748b] text-[11px] leading-[1.5]">
                Catatan belum disimpan. Jangan sertakan data pribadi pelapor.
              </p>
            </div>
          </div>

          {/* Card: Dokumentasi Sebelum & Sesudah */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Dokumentasi sebelum &amp; sesudah
            </h2>

            {/* Kotak Lampiran Sebelum */}
            <div className="bg-[#f3f5f8] border border-[#e6ecf5] rounded-[10px] p-[16px] flex items-center justify-between gap-[12px] w-full">
              <div className="flex items-center gap-[12px] min-w-0 flex-1">
                <FileImage className="w-[18px] h-[18px] text-[#0d2453] shrink-0" />
                <div className="flex flex-col gap-[3px] min-w-0 leading-[1.5]">
                  <p className="text-[#0d2453] text-[13px] font-semibold truncate">
                    Sebelum penanganan
                  </p>
                  <p className="text-[#64748b] text-[11px] font-normal truncate">
                    Representasi lampiran laporan · kondisi {ticket.title.toLowerCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBeforeModal(true)}
                className="font-semibold text-[#0d2453] text-[12px] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Lihat
              </button>
            </div>

            {/* Kotak Lampiran Sesudah */}
            <div className="bg-[#f3f5f8] border border-[#e6ecf5] rounded-[10px] p-[16px] flex items-center justify-between gap-[12px] w-full">
              <div className="flex items-center gap-[12px] min-w-0 flex-1">
                <Upload className="w-[18px] h-[18px] text-[#0d2453] shrink-0" />
                <div className="flex flex-col gap-[3px] min-w-0 leading-[1.5]">
                  <p className="text-[#0d2453] text-[13px] font-semibold truncate">
                    Sesudah penanganan
                  </p>
                  <p className="text-[#64748b] text-[11px] font-normal truncate">
                    {resolvedImage
                      ? 'Foto bukti fisik terlampir (Proof-of-Fix)'
                      : 'Unggah JPG atau PNG · maksimal 10 MB'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {resolvedImage ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAfterModal(true)}
                      className="font-semibold text-[#0d2453] text-[12px] hover:underline cursor-pointer"
                    >
                      Lihat
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolvedImage(null)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-semibold text-[#0d2453] text-[12px] hover:underline cursor-pointer"
                    >
                      Unggah
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSampleImage}
                      className="text-[11px] text-blue-700 font-semibold hover:underline bg-blue-50 px-2 py-1 rounded"
                      title="Pakai foto sampel sesudah perbaikan"
                    >
                      + Sampel
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-[#64748b] text-[11px] leading-[1.5]">
              Representasi lampiran bukan bukti asli yang telah ditinjau. Foto sesudah wajib tersedia untuk menandai laporan selesai.
            </p>
          </div>

          {/* Card: Penyelesaian Laporan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Penyelesaian laporan
            </h2>

            {/* Checkbox Tandai Selesai */}
            <div
              onClick={handleToggleComplete}
              className="flex items-center gap-[10px] cursor-pointer select-none"
            >
              <div
                className={`size-[20px] rounded-[4px] border flex items-center justify-center transition-colors ${
                  markCompleted
                    ? 'bg-[#0d2453] border-[#0d2453] text-white'
                    : 'bg-white border-[#b9b9b9]'
                }`}
              >
                {markCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-[#0d2453] text-[13px] leading-[1.5]">
                Tandai selesai setelah progres disimpan
              </span>
            </div>

            <p className="text-[#64748b] text-[13px] leading-[1.5]">
              {markCompleted
                ? 'Laporan akan diperbarui menjadi status Selesai.'
                : 'Belum dipilih. Laporan tetap berstatus Diproses.'}
            </p>

            <p className="text-[#64748b] text-[11px] leading-[1.5]">
              Untuk menyelesaikan: lampirkan foto sesudah, isi hasil penanganan, dan pastikan masalah sudah tertangani. Perubahan status berlaku hanya setelah Simpan progres.
            </p>

            {/* Tindakan Formulir */}
            <div className="flex items-center gap-[10px] pt-[6px]">
              <button
                type="submit"
                className="bg-[#0d2453] border-2 border-[#0d2453] text-white text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-[#132d66] transition-all active:scale-95 cursor-pointer"
              >
                {saveSuccess ? 'Tersimpan!' : 'Simpan progres'}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="bg-white border-2 border-[#e6ecf5] text-[#0d2453] text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </form>

        {/* Kolom Kanan: Petunjuk Penanganan & Callout */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-[20px]">
          {/* Card: Petunjuk Penanganan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs text-[#0d2453]">
            <h2 className="text-[17px] font-semibold leading-[1.5]">
              Catat perubahan yang nyata
            </h2>
            <div className="flex flex-col gap-[12px] text-[13px] leading-[1.5]">
              <p>1. Jelaskan pekerjaan yang telah dilakukan.</p>
              <p>2. Tambahkan dokumentasi kondisi terbaru.</p>
              <p>3. Selesaikan laporan hanya jika masalah telah tertangani.</p>
            </div>
          </div>

          {/* Card: Catatan Informasi */}
          <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px]">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="text-[#0d2453] text-[13px] leading-[1.5]">
              Jangan menutup laporan hanya karena petugas sudah dijadwalkan. Catat jadwal sebagai progres.
            </p>
          </div>

          <p className="text-[#64748b] text-[11px] leading-[1.5]">
            Alur penanganan: Masuk → Diverifikasi → Diproses → Selesai
          </p>
        </div>
      </div>

      {/* 5. Sub-Footer Layanan */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>Desa Candirejo · Per 28 Oktober 2026</span>
      </div>

      {/* Modal Foto Sebelum */}
      {showBeforeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowBeforeModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e6ecf5] shadow-2xl w-full max-w-lg p-5 z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6ecf5]">
              <div>
                <span className="text-sm font-semibold text-[#0d2453]">
                  Foto Sebelum Penanganan
                </span>
                <p className="text-[11px] text-[#64748b] font-mono">{ticket.code}</p>
              </div>
              <button
                onClick={() => setShowBeforeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-slate-100 border border-[#e6ecf5]">
              <Image
                src={ticket.image}
                alt="Sebelum penanganan"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowBeforeModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-slate-100 rounded-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Foto Sesudah */}
      {showAfterModal && resolvedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowAfterModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e6ecf5] shadow-2xl w-full max-w-lg p-5 z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6ecf5]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-[#0d2453]">
                  Foto Sesudah Penanganan (Proof-of-Fix)
                </span>
              </div>
              <button
                onClick={() => setShowAfterModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-slate-100 border border-[#e6ecf5]">
              <Image
                src={resolvedImage}
                alt="Sesudah penanganan"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAfterModal(false)}
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
