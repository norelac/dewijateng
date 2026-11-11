'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Search,
  Building2,
  Clock,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { reviewLpjAction } from '@/app/actions/villageActions';

export interface LpjItem {
  grantId: string;
  villageName: string;
  regency: string;
  fiscalYear: number;
  totalAllocated: number;
  totalRealized: number;
  lpjStatus: 'PENDING_UPLOAD' | 'SUBMITTED' | 'VERIFIED' | 'REVISION';
  lpjDocumentUrl?: string | null;
  uploadedAt?: string | null;
  lpjReviewNotes?: string | null;
  hasAnomaly?: boolean;
}

interface LpjVerificationQueueProps {
  initialItems?: LpjItem[];
  onStatusChange?: () => void;
}

/** Jumlah baris per halaman antrean LPJ. */
const PAGE_SIZE = 25;

/**
 * Data cadangan bila komponen dipakai tanpa `initialItems` (mis. pratinjau).
 * Sumber utama antrean adalah `listLpjQueue()` di server (lihat
 * `app/disbudparekraf/aktivitas/page.tsx`). ID grant di bawah harus cocok
 * dengan baris nyata pada `village_grants` agar aksi Setujui/Revisi tidak
 * diam-diam tidak mengubah apa pun.
 */
const DEFAULT_LPJ_ITEMS: LpjItem[] = [
  {
    grantId: 'b0000000-0000-0000-0000-000000000002',
    villageName: 'Desa Wisata Candirejo',
    regency: 'Kabupaten Magelang',
    fiscalYear: 2026,
    totalAllocated: 150000000,
    totalRealized: 142000000,
    lpjStatus: 'SUBMITTED',
    lpjDocumentUrl: '/documents/lpj-candirejo-magelang-2026.pdf',
    uploadedAt: '2026-10-26T10:30:00Z',
    hasAnomaly: true,
  },
  {
    grantId: 'b0000006-0000-0000-0000-000000000000',
    villageName: 'Desa Wisata Dieng Kulon',
    regency: 'Kabupaten Banjarnegara',
    fiscalYear: 2026,
    totalAllocated: 1000000000,
    totalRealized: 850000000,
    lpjStatus: 'VERIFIED',
    lpjDocumentUrl: '/documents/lpj-dieng-kulon-banjarnegara-2026.pdf',
    uploadedAt: '2026-11-05T14:15:00Z',
    hasAnomaly: false,
  },
  {
    grantId: 'b0000004-0000-0000-0000-000000000000',
    villageName: 'Desa Wisata Dawuhan',
    regency: 'Kabupaten Banjarnegara',
    fiscalYear: 2026,
    totalAllocated: 500000000,
    totalRealized: 425000000,
    lpjStatus: 'SUBMITTED',
    lpjDocumentUrl: '/documents/lpj-dawuhan-banjarnegara-2026.pdf',
    uploadedAt: '2026-10-27T09:00:00Z',
    hasAnomaly: false,
  },
  {
    grantId: 'b0000000-0000-0000-0000-000000000001',
    villageName: 'Desa Wisata Getas (Curug Kembar)',
    regency: 'Kabupaten Semarang',
    fiscalYear: 2026,
    totalAllocated: 100000000,
    totalRealized: 70500000,
    lpjStatus: 'REVISION',
    lpjDocumentUrl: '/documents/lpj-getas-semarang-2026.pdf',
    uploadedAt: '2026-10-31T11:00:00Z',
    hasAnomaly: true,
  },
];

export default function LpjVerificationQueue({
  initialItems = DEFAULT_LPJ_ITEMS,
  onStatusChange,
}: LpjVerificationQueueProps) {
  const [items, setItems] = useState<LpjItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'VERIFIED' | 'REVISION'>('ALL');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [revisionModal, setRevisionModal] = useState<{
    grantId: string;
    villageName: string;
  } | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const handleApprove = async (grantId: string) => {
    setActionError(null);
    setActionLoading(grantId);
    try {
      const res = await reviewLpjAction({ grantId, status: 'VERIFIED' });
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.grantId === grantId ? { ...i, lpjStatus: 'VERIFIED' } : i))
        );
        if (onStatusChange) onStatusChange();
      } else {
        setActionError(res.message || 'Gagal menyetujui dokumen LPJ.');
      }
    } catch {
      setActionError('Terjadi kendala saat menyetujui dokumen LPJ.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionModal) return;
    setActionError(null);
    setActionLoading(revisionModal.grantId);
    try {
      const res = await reviewLpjAction({
        grantId: revisionModal.grantId,
        status: 'REVISION',
        reviewNotes: revisionNote,
      });
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.grantId === revisionModal.grantId
              ? { ...i, lpjStatus: 'REVISION', lpjReviewNotes: revisionNote }
              : i
          )
        );
        setRevisionModal(null);
        setRevisionNote('');
        if (onStatusChange) onStatusChange();
      } else {
        setActionError(res.message || 'Gagal mengirim catatan revisi LPJ.');
      }
    } catch {
      setActionError('Terjadi kendala saat mengirim catatan revisi LPJ.');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    total: items.length,
    submitted: items.filter((i) => i.lpjStatus === 'SUBMITTED').length,
    verified: items.filter((i) => i.lpjStatus === 'VERIFIED').length,
    revision: items.filter((i) => i.lpjStatus === 'REVISION').length,
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.villageName.toLowerCase().includes(search.toLowerCase()) ||
      item.regency.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || item.lpjStatus === filter;
    return matchesSearch && matchesFilter;
  });

  // Antrean bisa ratusan baris; tampilkan 25 per halaman agar tetap ringan.
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-5 sm:p-7 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-[#0D2453] text-[18px] sm:text-[20px] font-semibold tracking-[-0.5px]">
            Antrean verifikasi dokumen LPJ desa
          </h2>
          <p className="text-[#64748B] text-[12px] mt-0.5">
            Prioritaskan telaah berkas baru, verifikasi nota belanja vs HSD MAS PETRUK, dan perbarui status.
          </p>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700"
            aria-label="Tutup pesan galat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setFilter('ALL');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#0D2453] text-white'
                : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#0D2453]'
            }`}
          >
            Semua · {counts.total}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('SUBMITTED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'SUBMITTED'
                ? 'bg-[#0D2453] text-white'
                : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#0D2453]'
            }`}
          >
            Menunggu Telaah · {counts.submitted}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('VERIFIED');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'VERIFIED'
                ? 'bg-[#0D2453] text-white'
                : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#0D2453]'
            }`}
          >
            Disetujui · {counts.verified}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('REVISION');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'REVISION'
                ? 'bg-[#0D2453] text-white'
                : 'bg-[#F3F5F8] text-[#64748B] hover:text-[#0D2453]'
            }`}
          >
            Perlu Revisi · {counts.revision}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari desa atau nomor LPJ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-3 pl-8 rounded-xl bg-white border border-[#E6ECF5] text-xs text-[#0D2453] placeholder-slate-400 focus:outline-none focus:border-[#0D2453] transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Clean Table matching Figma image */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#F1F5F9] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              <th className="py-2.5 px-3">Desa & Alokasi</th>
              <th className="py-2.5 px-3">Tanggal Masuk</th>
              <th className="py-2.5 px-3">Realisasi / Pagu</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8FAFC] text-xs">
            {pageItems.map((item) => {
              const isPending = item.lpjStatus === 'SUBMITTED';
              const isVerified = item.lpjStatus === 'VERIFIED';
              const isRevision = item.lpjStatus === 'REVISION';

              return (
                <tr key={item.grantId} className="hover:bg-slate-50/70 transition-colors">
                  {/* Desa info */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-[#0D2453]" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0D2453] text-[13px]">
                            {item.villageName}
                          </span>
                          {item.hasAnomaly && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Anomali Harga
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {item.regency} · TA {item.fiscalYear}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Tanggal Masuk */}
                  <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                    {item.uploadedAt
                      ? new Intl.DateTimeFormat('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(item.uploadedAt))
                      : '—'}
                  </td>

                  {/* Realisasi vs Pagu */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#0D2453]">
                        {formatRupiah(item.totalRealized)}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        Pagu {formatRupiah(item.totalAllocated)}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Menunggu Telaah
                      </span>
                    )}
                    {isVerified && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Disetujui
                      </span>
                    )}
                    {isRevision && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Perlu Revisi
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(item.grantId)}
                            disabled={actionLoading === item.grantId}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRevisionModal({
                                grantId: item.grantId,
                                villageName: item.villageName,
                              })
                            }
                            disabled={actionLoading === item.grantId}
                            className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Revisi
                          </button>
                        </>
                      )}
                      {item.lpjDocumentUrl ? (
                        <a
                          href={item.lpjDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0D2453] font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Berkas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-[#94A3B8] font-semibold text-[11px] inline-flex items-center gap-1 cursor-not-allowed">
                          <span>Belum ada berkas</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginasi antrean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-[#64748B]">
          {filteredItems.length === 0
            ? 'Tidak ada LPJ yang cocok dengan filter.'
            : `Menampilkan ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                currentPage * PAGE_SIZE,
                filteredItems.length
              )} dari ${filteredItems.length} LPJ`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-[#E6ECF5] bg-white text-[11px] font-semibold text-[#0D2453] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Sebelumnya
          </button>
          <span className="text-[11px] text-[#64748B] whitespace-nowrap">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-[#E6ECF5] bg-white text-[11px] font-semibold text-[#0D2453] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Berikutnya
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Dialog: Kirim Catatan Revisi ke Desa */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6ECF5] shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0D2453]">
                Kembalikan Dokumen LPJ ({revisionModal.villageName})
              </h3>
              <button
                type="button"
                onClick={() => setRevisionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Berikan catatan pos belanja yang wajib diperbaiki oleh bendahara desa (misalnya lampiran nota tidak lengkap atau indikasi selisih harga HSD).
            </p>

            <textarea
              rows={3}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Contoh: Pos belanja semen terindikasi deviasi +44% dari HSD Magelang. Lampirkan nota toko asli."
              className="w-full p-3 rounded-xl border border-[#E6ECF5] text-xs text-[#0D2453] focus:outline-none focus:border-[#0D2453]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModal(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRevisionSubmit}
                disabled={actionLoading === revisionModal.grantId}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Kirim Catatan Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
