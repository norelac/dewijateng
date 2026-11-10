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
  Sparkles,
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

const DEFAULT_LPJ_ITEMS: LpjItem[] = [
  {
    grantId: 'b0000000-0000-0000-0000-000000000002',
    villageName: 'Desa Wisata Candirejo',
    regency: 'Kabupaten Magelang',
    fiscalYear: 2026,
    totalAllocated: 150000000,
    totalRealized: 142000000,
    lpjStatus: 'SUBMITTED',
    uploadedAt: '2026-11-04T10:30:00Z',
    hasAnomaly: true,
  },
  {
    grantId: 'b0000000-0000-0000-0000-000000000004',
    villageName: 'Desa Wisata Dieng Kulon',
    regency: 'Kabupaten Banjarnegara',
    fiscalYear: 2026,
    totalAllocated: 150000000,
    totalRealized: 148500000,
    lpjStatus: 'VERIFIED',
    uploadedAt: '2026-10-28T14:15:00Z',
    hasAnomaly: false,
  },
  {
    grantId: 'b0000000-0000-0000-0000-000000000007',
    villageName: 'Desa Wisata Lerep',
    regency: 'Kabupaten Semarang',
    fiscalYear: 2026,
    totalAllocated: 150000000,
    totalRealized: 145000000,
    lpjStatus: 'SUBMITTED',
    uploadedAt: '2026-11-08T09:00:00Z',
    hasAnomaly: false,
  },
];

export default function LpjVerificationQueue({
  initialItems = DEFAULT_LPJ_ITEMS,
  onStatusChange,
}: LpjVerificationQueueProps) {
  const [items, setItems] = useState<LpjItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'VERIFIED' | 'REVISION'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal revisi
  const [revisionModal, setRevisionModal] = useState<{
    grantId: string;
    villageName: string;
  } | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const handleApprove = async (grantId: string) => {
    setActionLoading(grantId);
    try {
      const res = await reviewLpjAction({ grantId, status: 'VERIFIED' });
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.grantId === grantId ? { ...i, lpjStatus: 'VERIFIED' } : i))
        );
        if (onStatusChange) onStatusChange();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRevision = (grantId: string, villageName: string) => {
    setRevisionModal({ grantId, villageName });
    setRevisionNote('Terdapat deviasi harga pada pos belanja modal yang melebihi pagu SSH Pemprov Jateng.');
  };

  const handleConfirmRevision = async () => {
    if (!revisionModal) return;
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
        if (onStatusChange) onStatusChange();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.villageName.toLowerCase().includes(search.toLowerCase()) ||
      item.regency.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || item.lpjStatus === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#E6ECF5] p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>Fungsi Pengawasan Fiskal Dispora</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Antrean Verifikasi Dokumen LPJ Desa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menyetujui atau mengembalikan berkas LPJ realisasi bantuan keuangan APBD/APBDes.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari desa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 pl-8 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {(['ALL', 'SUBMITTED', 'VERIFIED', 'REVISION'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === st
                  ? 'bg-[#0D2453] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Semua'
                : st === 'SUBMITTED'
                ? 'Menunggu Review'
                : st === 'VERIFIED'
                ? 'Disetujui'
                : 'Perlu Revisi'}
            </button>
          ))}
        </div>
      </div>

      {/* LPJ Table / Cards */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.grantId}
              className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.villageName}
                  </h4>
                  <span className="text-xs text-slate-500">
                    ({item.regency})
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.lpjStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.lpjStatus === 'REVISION'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.lpjStatus === 'VERIFIED'
                      ? 'VERIFIED (Lolos)'
                      : item.lpjStatus === 'REVISION'
                      ? 'REVISION (Dikembalikan)'
                      : 'SUBMITTED (Antre Verifikasi)'}
                  </span>

                  {/* Anomaly Badge */}
                  {item.hasAnomaly && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Anomali Harga vs SSH (&gt;+40%)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span>
                    Pagu: <strong>{formatRupiah(item.totalAllocated)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Realisasi Belanja: <strong>{formatRupiah(item.totalRealized)}</strong>
                  </span>
                  <span>•</span>
                  <span>Tahun: {item.fiscalYear}</span>
                </div>

                {item.lpjReviewNotes && item.lpjStatus === 'REVISION' && (
                  <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <strong>Catatan Revisi:</strong> {item.lpjReviewNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/transparansi"
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lihat Rincian</span>
                </a>

                {item.lpjStatus === 'SUBMITTED' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading === item.grantId}
                      onClick={() => handleApprove(item.grantId)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading === item.grantId}
                      onClick={() => handleOpenRevision(item.grantId, item.villageName)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada dokumen LPJ yang sesuai dengan kriteria filter.
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Kembalikan Dokumen LPJ untuk Revisi
              </h3>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">
                Desa: <strong>{revisionModal.villageName}</strong>
              </p>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Temuan / Instruksi Perbaikan:
              </label>
              <textarea
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Tuliskan alasan pengembalian agar dapat diperbaiki pengelola desa..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModal(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading === revisionModal.grantId}
                onClick={handleConfirmRevision}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionLoading === revisionModal.grantId
                  ? 'Memproses...'
                  : 'Kirim Instruksi Revisi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
