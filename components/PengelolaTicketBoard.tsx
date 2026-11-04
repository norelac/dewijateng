'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  UserCheck,
  X,
  MapPin,
  ExternalLink,
  Lock,
  ChevronRight,
  Camera,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';
import { getPublicReportsAction } from '@/app/actions/reportActions';
import { resolveReportAction } from '@/app/actions/resolutionActions';

interface TicketData {
  id: string;
  report_code: string;
  village_id: string;
  village_name: string;
  village_regency: string;
  category: string;
  title: string;
  description: string;
  photo_before_url: string;
  latitude: number;
  longitude: number;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  resolution_summary?: string | null;
  resolution_photo_after?: string | null;
  resolution_officer?: string | null;
  exif_timestamp_verified?: boolean | null;
  exif_photo_date?: string | null;
  resolved_at?: string | null;
}

export default function PengelolaTicketBoard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [activeResolvingTicket, setActiveResolvingTicket] = useState<TicketData | null>(null);
  const [actionSummary, setActionSummary] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [photoAfterFile, setPhotoAfterFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<TicketData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil daftar laporan riil dari database via Server Action
  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getPublicReportsAction();
      if (res.success && res.data) {
        const mapped: TicketData[] = res.data.map((r) => ({
          id: r.id,
          report_code: r.reportCode,
          village_id: r.villageId,
          village_name: r.village?.name || 'Desa Wisata Jateng',
          village_regency: r.village?.regency || 'Jawa Tengah',
          category: r.category,
          title: r.title,
          description: r.description,
          photo_before_url: r.photoBeforeUrl,
          latitude: r.latitude,
          longitude: r.longitude,
          is_anonymous: r.isAnonymous,
          status: r.status,
          created_at: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString(),
          resolution_summary: r.resolution?.actionSummary || null,
          resolution_photo_after: r.resolution?.photoAfterUrl || null,
          resolution_officer: r.resolution?.officerName || null,
          exif_timestamp_verified: r.resolution?.exifTimestampVerified ?? null,
          exif_photo_date: r.resolution?.exifPhotoDate ? String(r.resolution.exifPhotoDate) : null,
          resolved_at: r.resolution?.resolvedAt ? String(r.resolution.resolvedAt) : null,
        }));
        setTickets(mapped);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan aduan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoAfterFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolvingTicket) return;

    if (!photoAfterFile) {
      setErrorMessage('Wajib melampirkan foto hasil fisik perbaikan (Proof-of-Fix)');
      return;
    }

    if (!actionSummary.trim() || actionSummary.length < 10) {
      setErrorMessage('Rincian tindakan teknis minimal 10 karakter');
      return;
    }

    if (!officerName.trim()) {
      setErrorMessage('Nama petugas/penanggung jawab wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('report_code', activeResolvingTicket.report_code);
      formData.append('action_summary', actionSummary);
      formData.append('officer_name', officerName);
      formData.append('photo_after', photoAfterFile);

      const res = await resolveReportAction(formData);

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Gagal menyelesaikan laporan');
        setSubmitting(false);
        return;
      }

      // Berhasil
      setSuccessTicket({
        ...activeResolvingTicket,
        status: 'RESOLVED',
        resolution_summary: actionSummary,
        resolution_officer: officerName,
        resolution_photo_after: res.data.photoAfterUrl || photoPreview,
        exif_timestamp_verified: res.data.exifVerified,
      });

      setActiveResolvingTicket(null);
      setActionSummary('');
      setOfficerName('');
      setPhotoAfterFile(null);
      setPhotoPreview(null);

      // Refresh list
      await loadReports();
    } catch (err: any) {
      console.error('Error resolve report:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = tickets.filter((t) => t.status !== 'RESOLVED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const complianceRate = tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 100;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ACTIVE') return t.status !== 'RESOLVED';
    if (filterStatus === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* Board Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Tiket Aktif Berjalan</div>
            <div className="text-xl font-mono font-extrabold text-slate-900">
              {loading ? '...' : `${activeCount} Tiket`}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Tuntas dengan Proof-of-Fix</div>
            <div className="text-xl font-mono font-extrabold text-slate-900">
              {loading ? '...' : `${resolvedCount} Tiket`}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Kepatuhan Penyelesaian</div>
            <div className="text-xl font-mono font-extrabold text-emerald-600">
              {loading ? '...' : `${complianceRate}% Selesai`}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Tiket Aduan &amp; Penugasan Lapangan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap penutupan tiket wajib mengunggah foto fisik setelah perbaikan (Proof-of-Fix).
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'ACTIVE'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perlu Penanganan ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'RESOLVED'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuntas ({resolvedCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Memuat daftar aduan dari database PostgreSQL...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Tidak ada tiket aduan pada kategori ini.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED';
              const isPungli = ticket.category === 'PUNGLI';

              return (
                <div
                  key={ticket.id}
                  className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                    {/* Thumbnail Foto Aduan */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={ticket.photo_before_url}
                        alt={ticket.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {ticket.report_code}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPungli
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {ticket.category.replace('_', ' ')}
                        </span>
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Proof-of-Fix Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {ticket.status === 'IN_PROGRESS' ? 'Dalam Pengerjaan' : 'Menunggu Tindakan'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {ticket.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        &ldquo;{ticket.description}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-700" />
                          {ticket.village_name || 'Desa Wisata'}, {ticket.village_regency || 'Jawa Tengah'}
                        </span>
                        <span>•</span>
                        <span>Dilaporkan: {formatDateIndo(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Action / Status Result */}
                  <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
                    {isResolved ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                        {ticket.resolution_photo_after && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-300">
                            <img
                              src={ticket.resolution_photo_after}
                              alt="Foto After"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-800 block">
                            Tuntas Terselesaikan
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Petugas: {ticket.resolution_officer || 'Pokdarwis Desa'}
                          </span>
                          {ticket.exif_timestamp_verified && (
                            <span className="text-[10px] text-emerald-600 font-mono font-semibold block">
                              ✓ Metadata Kamera Tervalidasi
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveResolvingTicket(ticket);
                          setActionSummary('');
                          setOfficerName('');
                          setPhotoAfterFile(null);
                          setPhotoPreview(null);
                          setErrorMessage(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Unggah Bukti Selesai (Proof-of-Fix)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Resolution Modal Form */}
      <AnimatePresence>
        {activeResolvingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold">
                    Formulir Bukti Fisik Perbaikan (Proof-of-Fix)
                  </h4>
                  <p className="text-xs text-slate-300">
                    {activeResolvingTicket.report_code} • {activeResolvingTicket.village_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveResolvingTicket(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
                {/* Alert jika ada error validasi EXIF / input */}
                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block">Gagal Menyimpan Bukti:</span>
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="text-slate-500 font-bold block">Objek Aduan:</span>
                  <p className="text-slate-800 font-medium">{activeResolvingTicket.title}</p>
                </div>

                {/* Upload Foto After */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unggah Foto Bukti Fisik Selesai (Foto After)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-100 aspect-video flex items-center justify-center group">
                      <img
                        src={photoPreview}
                        alt="Preview Foto After"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <Camera className="w-6 h-6" />
                        <span>Ganti Foto Bukti</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-emerald-50/40 cursor-pointer transition-colors"
                    >
                      <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-emerald-900">
                        Klik untuk unggah foto hasil penanganan
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Sistem otomatis memeriksa metadata tanggal &amp; waktu kamera (EXIF Timestamp)
                      </p>
                    </div>
                  )}
                </div>

                {/* Ringkasan Tindakan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ringkasan Tindakan Teknis Penuntasan
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: Telah dilakukan pembetulan pipa saluran, penggantian kran stainless steel, dan pembersihan menyeluruh area sanitasi..."
                    value={actionSummary}
                    onChange={(e) => setActionSummary(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20"
                  />
                </div>

                {/* Nama Petugas */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama Petugas / Pejabat Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso (Ketua Pokdarwis / Tim Sarpras)"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveResolvingTicket(null)}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'Memproses EXIF...' : 'Terbitkan Proof-of-Fix & Selesaikan'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification Modal */}
      <AnimatePresence>
        {successTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Laporan Sukses Diselesaikan!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bukti fisik perbaikan (Proof-of-Fix) untuk tiket{' '}
                  <strong className="text-slate-800">{successTicket.report_code}</strong> telah dipublikasikan ke portal transparansi warga.
                </p>
              </div>

              {successTicket.exif_timestamp_verified && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                  ✓ Validasi EXIF Sukses: Foto terbukti asli diambil setelah aduan dibuat.
                </div>
              )}

              <button
                type="button"
                onClick={() => setSuccessTicket(null)}
                className="w-full py-3 rounded-xl bg-[#0D2453] text-white text-xs font-bold hover:bg-[#132d66] transition-colors cursor-pointer"
              >
                Kembali ke Papan Tiket
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
