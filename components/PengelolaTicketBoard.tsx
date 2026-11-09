'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';
import { getPublicReportsAction, markReportInProgressAction } from '@/app/actions/reportActions';
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

const CATEGORY_LABELS: Record<string, string> = {
  FASILITAS_RUSAK: 'Fasilitas & sanitasi',
  PUNGLI: 'Pungutan liar',
  BAHAYA_K3: 'Keselamatan (K3)',
  KEBERSIHAN: 'Kebersihan & lingkungan',
};

const CARD =
  'bg-white rounded-[16px] border border-[#E6ECF5] shadow-[0px_1px_2px_rgba(13,36,83,0.04),0px_8px_24px_rgba(13,36,83,0.06)]';
const BTN_PRIMARY =
  'h-[40px] px-4 rounded-full bg-[#0D2453] text-white text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_SECONDARY =
  'h-[40px] px-4 rounded-full bg-white border-2 border-[#E6ECF5] text-[#0D2453] text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
const FIELD =
  'w-full px-3.5 py-2.5 text-[13px] bg-[#F7F9FC] border border-[#E6ECF5] rounded-[10px] text-[#0D2453] placeholder:text-[#94A3B8]';

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
  const [markingInProgress, setMarkingInProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<TicketData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartWork = async (ticketCode: string) => {
    setMarkingInProgress(ticketCode);
    try {
      const res = await markReportInProgressAction(ticketCode);
      if (res.success) {
        await loadReports();
      } else {
        alert(res.error || 'Gagal mengubah status pengerjaan');
      }
    } catch (err: any) {
      console.error('Error starting work:', err);
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setMarkingInProgress(null);
    }
  };

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
      setErrorMessage('Wajib melampirkan foto hasil fisik perbaikan');
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
  const complianceRate =
    tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 100;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ACTIVE') return t.status !== 'RESOLVED';
    if (filterStatus === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const summary = [
    { label: 'Tiket aktif berjalan', value: `${activeCount} tiket`, icon: Clock },
    { label: 'Tuntas dengan bukti fisik', value: `${resolvedCount} tiket`, icon: CheckCircle2 },
    { label: 'Rasio penyelesaian', value: `${complianceRate}% selesai`, icon: ShieldCheck },
  ];

  const filterTabs = [
    { id: 'ALL', label: `Semua (${tickets.length})` },
    { id: 'ACTIVE', label: `Perlu penanganan (${activeCount})` },
    { id: 'RESOLVED', label: `Tuntas (${resolvedCount})` },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Ringkasan tiket */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${CARD} p-4 flex items-center gap-3`}>
            <span className="w-10 h-10 rounded-[12px] bg-[#F3F5F8] text-[#0D2453] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] text-[#64748B]">{label}</span>
              <span className="text-[20px] font-semibold text-[#0D2453] leading-tight">
                {loading ? '—' : value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Daftar tiket */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-[#E6ECF5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-[#0D2453]">
              Daftar tiket aduan &amp; penugasan lapangan
            </h2>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Setiap penutupan tiket wajib mengunggah foto fisik setelah perbaikan.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F3F5F8] p-1 rounded-full shrink-0">
            {filterTabs.map((tab) => {
              const isActive = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`h-[32px] px-3 rounded-full text-[12px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-[#0D2453]'
                      : 'text-[#64748B] hover:text-[#0D2453]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-[#E6ECF5]">
          {loading ? (
            <div className="p-10 text-center text-[#64748B] text-[12px]">
              Memuat daftar aduan…
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center text-[#64748B] text-[12px]">
              Tidak ada tiket aduan pada kategori ini.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED';

              return (
                <div
                  key={ticket.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                    {/* Foto lampiran aduan */}
                    <div className="w-20 h-20 rounded-[12px] overflow-hidden border border-[#E6ECF5] bg-[#F3F5F8] shrink-0">
                      <img
                        src={ticket.photo_before_url}
                        alt={ticket.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/img/figma/aduan-curug-sebelum.png';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#F3F5F8] text-[#64748B]">
                          {ticket.report_code}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-[#F3F5F8] text-[#64748B]">
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isResolved
                              ? 'bg-[#E7F5ED] text-[#16725C]'
                              : 'bg-[#EAF0FA] text-[#0D2453]'
                          }`}
                        >
                          {isResolved
                            ? 'Selesai'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'Dalam pengerjaan'
                            : 'Menunggu tindakan'}
                        </span>
                      </div>

                      <h3 className="text-[15px] font-semibold text-[#0D2453] leading-snug break-words">
                        {ticket.title}
                      </h3>

                      <p className="text-[12px] text-[#64748B] line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#64748B] pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                          {ticket.village_name}, {ticket.village_regency}
                        </span>
                        <span>Dilaporkan {formatDateIndo(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
                    {isResolved ? (
                      <div className="flex items-center gap-3 bg-[#E7F5ED] border border-[#BFE3D0] rounded-[16px] p-3">
                        {ticket.resolution_photo_after && (
                          <div className="w-12 h-12 rounded-[10px] overflow-hidden border border-[#BFE3D0]">
                            <img
                              src={ticket.resolution_photo_after}
                              alt="Foto setelah perbaikan"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/img/figma/aduan-curug-sesudah.png';
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-semibold text-[#16725C]">
                            Tuntas terselesaikan
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            Petugas: {ticket.resolution_officer || 'Pokdarwis desa'}
                          </span>
                          {ticket.exif_timestamp_verified && (
                            <span className="text-[11px] text-[#16725C] font-medium">
                              Metadata kamera tervalidasi
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {ticket.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            disabled={markingInProgress === ticket.report_code}
                            onClick={() => handleStartWork(ticket.report_code)}
                            className={BTN_SECONDARY}
                            title="Tandai tiket sedang ditangani di lapangan"
                          >
                            <Clock className="w-4 h-4" />
                            <span>
                              {markingInProgress === ticket.report_code
                                ? 'Memproses…'
                                : 'Mulai pengerjaan'}
                            </span>
                          </button>
                        )}

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
                          className={BTN_PRIMARY}
                        >
                          <Upload className="w-4 h-4" />
                          <span>Unggah bukti selesai</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Formulir bukti fisik */}
      {activeResolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setActiveResolvingTicket(null)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[16px] border border-[#E6ECF5] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0D2453] text-white flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold">Bukti fisik perbaikan</h3>
                <p className="text-[12px] text-white/70 truncate">
                  {activeResolvingTicket.report_code} · {activeResolvingTicket.village_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveResolvingTicket(null)}
                aria-label="Tutup formulir"
                className="p-1.5 rounded-[10px] text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] flex items-start gap-2.5 text-[12px] text-[#B42318]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Gagal menyimpan bukti</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#F7F9FC] border border-[#E6ECF5] rounded-[10px] text-[12px] flex flex-col gap-1">
                <span className="text-[#64748B] font-semibold">Objek aduan</span>
                <p className="text-[#0D2453]">{activeResolvingTicket.title}</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0D2453] mb-1.5">
                  Foto bukti fisik selesai
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative rounded-[10px] overflow-hidden border border-[#BFE3D0] bg-[#F3F5F8] aspect-video">
                    <img src={photoPreview} alt="Pratinjau foto bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-[12px] font-semibold gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      Ganti foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#E6ECF5] hover:border-[#0D2453] rounded-[10px] p-6 text-center bg-[#F7F9FC]"
                  >
                    <Upload className="w-6 h-6 text-[#64748B] mx-auto mb-2" />
                    <p className="text-[12px] font-semibold text-[#0D2453]">
                      Klik untuk unggah foto hasil penanganan
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Sistem memeriksa metadata tanggal &amp; waktu kamera
                    </p>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0D2453] mb-1.5">
                  Ringkasan tindakan teknis
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: pembetulan pipa saluran, penggantian kran stainless steel, dan pembersihan area sanitasi."
                  value={actionSummary}
                  onChange={(e) => setActionSummary(e.target.value)}
                  className={FIELD}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0D2453] mb-1.5">
                  Nama petugas penanggung jawab
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso (Ketua Pokdarwis)"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className={FIELD}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResolvingTicket(null)}
                  disabled={submitting}
                  className="h-[40px] px-4 rounded-full text-[12px] font-semibold text-[#64748B] hover:bg-[#F3F5F8] disabled:opacity-50"
                >
                  Batal
                </button>
                <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Memproses…' : 'Terbitkan & selesaikan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Konfirmasi selesai */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setSuccessTicket(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[16px] border border-[#E6ECF5] shadow-2xl p-6 flex flex-col gap-4 text-center">
            <span className="w-14 h-14 rounded-full bg-[#E7F5ED] text-[#16725C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </span>

            <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-semibold text-[#0D2453]">
                Laporan selesai ditangani
              </h3>
              <p className="text-[12px] text-[#64748B]">
                Bukti fisik perbaikan untuk tiket{' '}
                <strong className="text-[#0D2453] font-semibold">
                  {successTicket.report_code}
                </strong>{' '}
                telah dipublikasikan ke portal transparansi warga.
              </p>
            </div>

            {successTicket.exif_timestamp_verified && (
              <div className="p-3 bg-[#E7F5ED] border border-[#BFE3D0] rounded-[10px] text-[12px] text-[#16725C]">
                Foto terbukti asli diambil setelah aduan dibuat.
              </div>
            )}

            <button
              type="button"
              onClick={() => setSuccessTicket(null)}
              className={`${BTN_PRIMARY} w-full justify-center`}
            >
              Kembali ke daftar tiket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
