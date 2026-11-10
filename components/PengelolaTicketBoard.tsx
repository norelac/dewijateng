'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { formatDateIndo, calculateSLARemaining } from '@/lib/utils';
import { getPublicReportsAction } from '@/app/actions/reportActions';

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
  deadline_at?: string | null;
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

/**
 * Papan pantau penanganan lapangan.
 * ponytail: board ini hanya membaca + mengarahkan; aksi verifikasi/progres
 * dijalankan di /pengelola/laporan supaya tidak ada dua alur tulis.
 */
export default function PengelolaTicketBoard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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
          deadline_at: r.deadlineAt
            ? typeof r.deadlineAt === 'string'
              ? r.deadlineAt
              : r.deadlineAt.toISOString()
            : null,
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

  const activeCount = tickets.filter((t) => t.status !== 'RESOLVED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const complianceRate =
    tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;

  const filteredTickets = tickets
    .filter((t) => {
      if (filterStatus === 'ACTIVE') return t.status !== 'RESOLVED';
      if (filterStatus === 'RESOLVED') return t.status === 'RESOLVED';
      return true;
    })
    // Urutkan tiket aktif berdasarkan tenggat SLA terdekat; tiket selesai/tanpa tenggat di akhir.
    .sort((a, b) => {
      if (!a.deadline_at && !b.deadline_at) return 0;
      if (!a.deadline_at) return 1;
      if (!b.deadline_at) return -1;
      return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
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

  /** Laporan masuk → verifikasi; sisanya → progres. Aksi ditangani di Kelola laporan. */
  const actionFor = (ticket: TicketData) =>
    ticket.status === 'SUBMITTED'
      ? { href: `/pengelola/laporan?view=detail&id=${ticket.id}`, label: 'Verifikasi laporan' }
      : { href: `/pengelola/laporan?view=progres&id=${ticket.id}`, label: 'Perbarui progres' };

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
              Pantau tiket yang berjalan. Verifikasi dan bukti perbaikan diisi di Kelola laporan.
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
              const action = actionFor(ticket);
              const sla =
                !isResolved && ticket.deadline_at
                  ? calculateSLARemaining(ticket.deadline_at)
                  : null;
              const slaClass =
                sla?.statusColor === 'crimson'
                  ? 'text-[#B3261E]'
                  : sla?.statusColor === 'amber'
                    ? 'text-[#936015]'
                    : 'text-[#16725C]';

              return (
                <div
                  key={ticket.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
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
                        {sla && (
                          <span className={`flex items-center gap-1 font-semibold ${slaClass}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {sla.label}
                          </span>
                        )}
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
                      <Link
                        href={action.href}
                        className="h-[40px] px-4 rounded-full bg-[#0D2453] text-white text-[12px] font-semibold inline-flex items-center gap-2"
                      >
                        <span>{action.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}