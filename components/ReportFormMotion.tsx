'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Clock,
  MapPin,
  Upload,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Send,
  Info
} from 'lucide-react';
import { SAMPLE_VILLAGES } from '@/lib/mockData';
import type { ReportCategory } from '@/types';

export default function ReportFormMotion() {
  const [category, setCategory] = useState<ReportCategory>('PUNGLI');
  const [villageId, setVillageId] = useState(SAMPLE_VILLAGES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Dynamic SLA according to category
  const getSLAInfo = (cat: ReportCategory) => {
    switch (cat) {
      case 'PUNGLI':
        return {
          hours: 24,
          label: '24 Jam Maksimal (Prioritas Penertiban Instan)',
          badgeColor: 'bg-red-50 border-red-200 text-red-900',
          pillColor: 'bg-red-100 text-red-800 border-red-300',
        };
      case 'BAHAYA_K3':
        return {
          hours: 168,
          label: '7 Hari (168 Jam) dengan Mandat Penutupan Sementara',
          badgeColor: 'bg-amber-50 border-amber-200 text-amber-900',
          pillColor: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'FASILITAS_RUSAK':
        return {
          hours: 168,
          label: '7 Hari (168 Jam) Pembenahan Fisik & Uji Beban',
          badgeColor: 'bg-blue-50 border-blue-200 text-[#0D2453]',
          pillColor: 'bg-blue-100 text-[#0D2453] border-blue-300',
        };
      case 'KEBERSIHAN':
        return {
          hours: 48,
          label: '48 Jam Pembersihan Sanitasi',
          badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          pillColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      default:
        return {
          hours: 168,
          label: '7 Hari Garansi SLA',
          badgeColor: 'bg-slate-50 border-slate-200 text-slate-800',
          pillColor: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  const currentSLA = getSLAInfo(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    // Generate ticket code e.g. DWJ-JTG-202611-9821
    const randomCode = `DWJ-JTG-202611-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedTicket(randomCode);
  };

  return (
    <div className="w-full">
      {/* Main Form Box matching Beranda & Transparansi Card Style */}
      <div className="bg-white rounded-3xl border border-[#EBEBEB] shadow-xs p-6 sm:p-10">

        {/* Dynamic SLA Countdown Banner */}
        <motion.div
          layout
          className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${currentSLA.badgeColor}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/80 shadow-2xs">
              <Clock className="w-5 h-5 text-[#0D2453]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#767676]">
                Garansi Waktu Penanganan (SLA)
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#0D2453]">{currentSLA.label}</div>
            </div>
          </div>
          <div className={`text-xs font-mono px-3 py-1.5 rounded-xl border font-bold self-end sm:self-auto ${currentSLA.pillColor}`}>
            SLA {currentSLA.hours} JAM
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-2">
              Pilih Kategori Aduan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'PUNGLI', label: 'Pungli & Parkir', icon: ShieldAlert },
                { key: 'BAHAYA_K3', label: 'Bahaya K3 Fisik', icon: AlertTriangle },
                { key: 'FASILITAS_RUSAK', label: 'Fasilitas Rusak', icon: MapPin },
                { key: 'KEBERSIHAN', label: 'Sanitasi Lingkungan', icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key as ReportCategory)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'border-[#0D2453] bg-blue-50/50 text-[#0D2453] ring-2 ring-[#0D2453]/15 font-bold shadow-xs'
                        : 'border-[#EBEBEB] bg-[#F7F9FC] hover:bg-slate-100 text-[#767676]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0D2453]' : 'text-[#767676]'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Lokasi Desa Wisata
            </label>
            <div className="relative">
              <select
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
              >
                {SAMPLE_VILLAGES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.regency} - Kec. {v.district})
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#767676]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Koordinat GPS diverifikasi presisi via geofencing desa wisata</span>
            </div>
          </div>

          {/* Judul Aduan */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Judul Temuan Masalah
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Karcis parkir tidak bertanda cap BUMDes di area pintu 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Deskripsi Kronologi & Lokasi Spesifik
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan detail waktu kejadian, oknum/titik kerusakan spesifik, atau potensi dampak kecelakaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none resize-none font-medium"
            />
          </div>

          {/* Photo Before Upload Mock */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Unggah Foto Bukti Fisik Awal (Foto Before)
            </label>
            <div className="border-2 border-dashed border-[#C1C1C1] hover:border-[#0D2453] rounded-2xl p-6 text-center bg-white cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-[#0D2453] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0D2453]">
                Klik untuk unggah foto kamera atau seret file ke sini
              </p>
              <p className="text-[11px] text-[#767676] mt-0.5">
                Metadata EXIF koordinat GPS & timestamp otomatis diekstraksi
              </p>
            </div>
          </div>

          {/* Anonymous Whistleblower Switch */}
          <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-[#0D2453]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0D2453] block">
                  Mode Anonim Whistleblower Terlindungi
                </span>
                <span className="text-[11px] text-[#767676] block">
                  Identitas Anda dienkripsi dan dilindungi mandat UU KIP & LPSK
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D2453]" />
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>Kirimkan Aduan Publik Bergaransi SLA</span>
          </motion.button>
        </form>
      </div>

      {/* Submission Success Dialog */}
      <AnimatePresence>
        {submittedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#0D2453]">Aduan Berhasil Didistribusikan!</h4>
                <p className="text-xs text-[#767676] mt-1">
                  Tiket telah diteruskan ke Pengelola Desa Wisata dan Dinas Pariwisata Jateng dengan garansi SLA waktu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB]">
                <span className="text-[11px] font-bold text-[#767676] block uppercase tracking-wider">
                  Kode Tiket Pelacakan Anda
                </span>
                <span className="font-mono text-xl font-extrabold text-[#0D2453] block mt-1">
                  {submittedTicket}
                </span>
              </div>

              <div className="text-xs text-[#767676] bg-amber-50 p-3 rounded-xl border border-amber-200 text-left flex gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Tiket tidak dapat ditutup secara sepihak tanpa unggahan <strong>Foto Bukti Perbaikan (Proof-of-Fix)</strong> oleh pengelola.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmittedTicket(null);
                  setTitle('');
                  setDescription('');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs transition-colors"
              >
                Selesai & Salin Kode Tiket
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
