'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { DashboardTicket, TicketStatus } from './types';

interface TicketActionModalProps {
  ticket: DashboardTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
}

export default function TicketActionModal({
  ticket,
  isOpen,
  onClose,
  onUpdateStatus,
}: TicketActionModalProps) {
  if (!isOpen || !ticket) return null;

  const [notes, setNotes] = useState('');
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(
    ticket.resolvedImage || null
  );

  const getNextStatus = (current: TicketStatus): TicketStatus | null => {
    switch (current) {
      case 'Masuk':
        return 'Diverifikasi';
      case 'Diverifikasi':
        return 'Diproses';
      case 'Diproses':
        return 'Selesai';
      case 'Selesai':
        return null;
    }
  };

  const nextStatus = getNextStatus(ticket.status);

  const handleStatusChange = () => {
    if (nextStatus) {
      onUpdateStatus(ticket.id, nextStatus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <div className="relative bg-white rounded-2xl border border-[#E6ECF5] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E6ECF5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0D2453]">
                {ticket.code}
              </span>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  ticket.status === 'Masuk'
                    ? 'bg-[#EDF3FC] text-[#0D2453]'
                    : ticket.status === 'Diverifikasi'
                    ? 'bg-[#EDF3FC] text-[#0D2453]'
                    : ticket.status === 'Diproses'
                    ? 'bg-[#FFF4DC] text-[#936015]'
                    : 'bg-[#E4F6E8] text-[#216B55]'
                }`}
              >
                {ticket.status}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-[#0D2453]">
              {ticket.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="py-4 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-[12px] bg-[#F7F9FC] p-3.5 rounded-xl border border-[#E6ECF5]">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Calendar className="w-4 h-4 text-[#0D2453]" />
              <span>Tanggal Masuk: <strong className="text-[#0D2453]">{ticket.date}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-[#64748B]">
              <MapPin className="w-4 h-4 text-[#0D2453]" />
              <span className="truncate">Lokasi: <strong className="text-[#0D2453]">{ticket.location}</strong></span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#0D2453] block mb-1">
              Rincian Aduan Warga
            </label>
            <p className="text-xs text-[#64748B] leading-relaxed bg-white border border-[#E6ECF5] p-3 rounded-lg">
              {ticket.description}
            </p>
          </div>

          {/* Photo Evidence Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0D2453] block mb-1">
                Foto Bukti Aduan (Sebelum)
              </label>
              <div className="relative h-44 rounded-xl overflow-hidden border border-[#E6ECF5] bg-slate-100">
                <Image
                  src={ticket.image}
                  alt={ticket.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0D2453] block mb-1">
                Foto Bukti Fisik (Sesudah / Proof-of-Fix)
              </label>
              {ticket.resolvedImage || selectedProofPhoto ? (
                <div className="relative h-44 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50">
                  <Image
                    src={ticket.resolvedImage || selectedProofPhoto || ''}
                    alt="Proof of Fix"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-emerald-950/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Proof-of-Fix Terverifikasi
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-44 rounded-xl border border-dashed border-[#0D2453]/40 bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                  <Upload className="w-6 h-6 text-[#0D2453] mb-2 opacity-60" />
                  <p className="text-xs font-medium text-[#0D2453]">
                    Unggah Bukti Selesai
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    Wajib foto fisik sesudah perbaikan
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProofPhoto('/img/figma/toilet-sesudah.png')
                    }
                    className="mt-2 text-[11px] text-blue-700 font-semibold hover:underline"
                  >
                    + Pakai Sampel Bukti Fix
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Note Form */}
          {nextStatus && (
            <div>
              <label className="text-xs font-semibold text-[#0D2453] block mb-1">
                Catatan Penanganan Desa
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan teknis verifikasi / progres perbaikan fisik di lokasi..."
                className="w-full bg-[#F3F5F8] border border-[#E6ECF5] rounded-xl p-3 text-xs text-[#0D2453] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#0D2453] resize-none h-20"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E6ECF5] mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Transparansi audit Pemprov Jawa Tengah</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#E6ECF5] text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>

            {nextStatus && (
              <button
                type="button"
                onClick={handleStatusChange}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0D2453] text-white text-xs font-semibold hover:bg-[#132d66] transition-all shadow-xs"
              >
                <span>Ubah Status ke {nextStatus}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
