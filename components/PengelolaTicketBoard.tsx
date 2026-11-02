'use client';

import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { RESOLVED_REPORTS } from '@/lib/mockData';
import { formatDateIndo } from '@/lib/utils';
import type { IncidentReport } from '@/types';

export default function PengelolaTicketBoard() {
  const [tickets, setTickets] = useState<IncidentReport[]>([
    ...RESOLVED_REPORTS,
    {
      id: 'rep-open-01',
      ticketCode: 'DWJ-BMY-202611-0031',
      villageId: 'c3b88934-2e91-4e4b-97e3-0d55e2d5cb11',
      villageName: 'Desa Wisata Limpakuwus',
      category: 'BAHAYA_K3',
      title: 'Kabel sling penahan anjungan pandang kendur setelah hujan lebat',
      description: 'Perlu pengencangan turnbuckle dan penggantian klem kabel sling baja 16mm.',
      photoBeforeUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
      latitude: -7.3189,
      longitude: 109.2435,
      isAnonymous: false,
      status: 'IN_PROGRESS',
      slaHours: 168,
      createdAt: '2026-11-01T08:00:00Z',
      deadlineAt: '2026-11-08T08:00:00Z',
    },
    {
      id: 'rep-open-02',
      ticketCode: 'DWJ-KND-202611-0075',
      villageId: 'f4d99821-1b82-4f3c-86d2-1e44f1c4ba22',
      villageName: 'Desa Wisata Getas (Tubing Genting)',
      category: 'PUNGLI',
      title: 'Pungutan sewa rompi pelampung tambahan di pos dermaga 2',
      description: 'Pengunjung diminta Rp 15.000 tambahan padahal sudah termasuk paket tiket terusan.',
      photoBeforeUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
      latitude: -7.1145,
      longitude: 110.2789,
      isAnonymous: true,
      status: 'IN_PROGRESS',
      slaHours: 24,
      createdAt: '2026-11-01T09:15:00Z',
      deadlineAt: '2026-11-02T09:15:00Z',
    },
  ]);

  const [activeResolvingTicket, setActiveResolvingTicket] = useState<IncidentReport | null>(null);
  const [actionSummary, setActionSummary] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolvingTicket || !actionSummary || !officerName) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeResolvingTicket.id) {
          return {
            ...t,
            status: 'RESOLVED',
            proofOfFix: {
              photoAfterUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
              actionSummary,
              officerName,
              resolvedAt: new Date().toISOString(),
            },
          };
        }
        return t;
      })
    );

    setIsSuccessModal(true);
    setActiveResolvingTicket(null);
  };

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
              {tickets.filter((t) => t.status === 'IN_PROGRESS').length} Tiket
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
              {tickets.filter((t) => t.status === 'RESOLVED').length} Tiket
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Kepatuhan Waktu SLA</div>
            <div className="text-xl font-mono font-extrabold text-emerald-600">
              100% On-Time
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Daftar Tiket Aduan &amp; Penugasan Lapangan
          </h3>
          <span className="text-xs text-slate-500">
            Mandat Perda Jateng No. 2/2019
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tickets.map((ticket) => {
            const isResolved = ticket.status === 'RESOLVED';
            const isPungli = ticket.category === 'PUNGLI';

            return (
              <div
                key={ticket.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {ticket.ticketCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPungli
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ticket.category.replace('_', ' ')} • SLA {ticket.slaHours} Jam
                    </span>
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Proof-of-Fix Disetujui
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full animate-pulse">
                        <Clock className="w-3 h-3" />
                        Dalam Penanganan
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {ticket.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    &ldquo;{ticket.description}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-700" />
                      {ticket.villageName}
                    </span>
                    <span>•</span>
                    <span>Masuk: {formatDateIndo(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Resolution CTA Button */}
                <div className="flex items-center gap-3 self-end lg:self-auto">
                  {isResolved ? (
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-600 block">
                        Telah Dituntaskan
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {ticket.proofOfFix?.officerName}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveResolvingTicket(ticket);
                        setActionSummary('');
                        setOfficerName('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                    >
                      <span>Unggah Bukti Selesai (Proof-of-Fix)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold">Formulir Resolusi Bukti Fisik (Proof-of-Fix)</h4>
                  <p className="text-xs text-slate-400">{activeResolvingTicket.ticketCode} • {activeResolvingTicket.villageName}</p>
                </div>
                <button
                  onClick={() => setActiveResolvingTicket(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="text-slate-500 font-bold block">Aduan Masuk:</span>
                  <p className="text-slate-800 font-medium">{activeResolvingTicket.title}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unggah Foto Hasil Perbaikan Fisik (Foto After)
                  </label>
                  <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-emerald-50/40 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-900">
                      Klik untuk unggah foto hasil penanganan
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Wajib menampilkan objek yang sama dengan foto aduan
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ringkasan Tindakan Teknis Penuntasan
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: Penggantian klem kabel baja sling 16mm, pengelasan ulang gusset plate, dan uji beban 500kg aman..."
                    value={actionSummary}
                    onChange={(e) => setActionSummary(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama Petugas / Pejabat Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso (Ketua Pokdarwis / Tim Teknis Desa)"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveResolvingTicket(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terbitkan Bukti Fisik &amp; Tuntaskan Tiket</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
