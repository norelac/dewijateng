'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, ShieldCheck } from 'lucide-react';
import { DashboardTicket, TicketStatus, INITIAL_TICKETS_DATA } from './types';
import TicketActionModal from './TicketActionModal';

interface AntreanLaporanTableProps {
  tickets?: DashboardTicket[];
  onOpenKelolaLaporan?: () => void;
  onOpenTicketView?: (ticket: DashboardTicket, action: 'detail' | 'progres') => void;
  onUpdateStatus?: (ticketId: string, newStatus: TicketStatus) => void;
}

export default function AntreanLaporanTable({
  tickets: propTickets,
  onOpenKelolaLaporan,
  onOpenTicketView,
  onUpdateStatus: propUpdateStatus,
}: AntreanLaporanTableProps) {
  const [internalTickets, setInternalTickets] = useState<DashboardTicket[]>(
    INITIAL_TICKETS_DATA
  );

  const tickets = propTickets || internalTickets;

  const [activeFilter, setActiveFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [activeModalTicket, setActiveModalTicket] = useState<DashboardTicket | null>(
    null
  );

  // Status Counts
  const counts = useMemo(() => {
    return {
      Semua: tickets.length,
      Masuk: tickets.filter((t) => t.status === 'Masuk').length,
      Diverifikasi: tickets.filter((t) => t.status === 'Diverifikasi').length,
      Diproses: tickets.filter((t) => t.status === 'Diproses').length,
      Selesai: tickets.filter((t) => t.status === 'Selesai').length,
    };
  }, [tickets]);

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        activeFilter === 'Semua' || ticket.status === activeFilter;
      const cleanSearch = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        ticket.title.toLowerCase().includes(cleanSearch) ||
        ticket.code.toLowerCase().includes(cleanSearch);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, activeFilter, searchQuery]);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const next: Record<string, boolean> = {};
    if (checked) {
      filteredTickets.forEach((t) => {
        next[t.id] = true;
      });
    }
    setSelectedIds(next);
  };

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isAllSelected =
    filteredTickets.length > 0 &&
    filteredTickets.every((t) => selectedIds[t.id]);

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (propUpdateStatus) {
      propUpdateStatus(ticketId, newStatus);
    } else {
      setInternalTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            const actionLabel =
              newStatus === 'Masuk'
                ? 'Verifikasi laporan'
                : newStatus === 'Diverifikasi'
                ? 'Mulai penanganan'
                : newStatus === 'Diproses'
                ? 'Perbarui progres'
                : 'Lihat detail';
            return { ...t, status: newStatus, actionLabel };
          }
          return t;
        })
      );
    }
  };

  return (
    <div className="bg-white border border-[#E6ECF5] rounded-[18px] p-6 flex flex-col gap-5 shadow-xs w-full">
      {/* Pengantar Bagian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-normal">
            Antrean laporan desa
          </h2>
          <p className="text-[#64748B] text-[12px] font-normal leading-relaxed">
            Prioritaskan laporan baru dan perbarui catatan penanganan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onOpenKelolaLaporan) {
              onOpenKelolaLaporan();
            } else {
              setActiveFilter('Semua');
              setSearchQuery('');
            }
          }}
          className="text-[#0D2453] text-[12px] font-semibold hover:underline self-start sm:self-auto cursor-pointer"
        >
          Kelola semua laporan →
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['Semua', 'Masuk', 'Diverifikasi', 'Diproses', 'Selesai'] as const).map(
            (statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setActiveFilter(statusKey)}
                className={`px-3 py-2 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  activeFilter === statusKey
                    ? 'bg-[#0D2453] text-white font-semibold'
                    : 'bg-[#F3F5F8] text-[#64748B] hover:bg-slate-200'
                }`}
              >
                {statusKey} · {counts[statusKey]}
              </button>
            )
          )}
        </div>

        {/* Search Input */}
        <div className="bg-[#F3F5F8] h-[29px] rounded-full px-4 sm:px-5 py-1.5 flex items-center gap-2 w-full md:w-[260px] shrink-0">
          <Search className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau judul laporan"
            className="w-full bg-transparent border-none text-[11px] text-[#0D2453] placeholder:text-[#64748B] outline-none font-normal"
          />
        </div>
      </div>

      {/* Tabel Aduan */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px] flex flex-col">
          {/* Kepala Tabel */}
          <div className="bg-[#F3F5F8] rounded-[6px] h-[40px] px-3 flex items-center gap-[18px] text-[#64748B] text-[12px] font-normal">
            <div className="w-5 shrink-0 flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="size-[18px] rounded border border-[#B9B9B9] accent-[#0D2453] cursor-pointer"
                aria-label="Pilih semua baris"
              />
            </div>
            <div className="flex-1 min-w-px">Laporan</div>
            <div className="w-[106px] shrink-0">Tanggal masuk</div>
            <div className="w-[115px] shrink-0">Status</div>
            <div className="w-[150px] shrink-0">Tindakan</div>
          </div>

          {/* Baris Tabel */}
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-xs">
              Tidak ada laporan pada filter ini.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = !!selectedIds[ticket.id];
              return (
                <div
                  key={ticket.id}
                  className="border-b border-[#E6ECF5] min-h-[76px] px-3 py-3.5 flex items-center gap-[18px] hover:bg-slate-50/70 transition-colors"
                >
                  {/* Checkbox */}
                  <div className="w-5 shrink-0 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleOne(ticket.id)}
                      className="size-[18px] rounded border border-[#B9B9B9] accent-[#0D2453] cursor-pointer"
                      aria-label={`Pilih laporan ${ticket.title}`}
                    />
                  </div>

                  {/* Info Laporan (Foto + Judul + Kode) */}
                  <div className="flex-1 min-w-px flex items-center gap-3">
                    <div className="relative w-[44px] h-[42px] rounded-[8px] overflow-hidden shrink-0 bg-slate-100 border border-[#E6ECF5]">
                      <Image
                        src={ticket.image}
                        alt={ticket.title}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[#0D2453] text-[12px] font-medium leading-tight truncate">
                        {ticket.title}
                      </p>
                      <p className="text-[#64748B] text-[10px] font-normal leading-none font-mono">
                        {ticket.code}
                      </p>
                    </div>
                  </div>

                  {/* Tanggal Masuk */}
                  <div className="w-[106px] shrink-0 text-[#0D2453] text-[12px] font-normal">
                    {ticket.date}
                  </div>

                  {/* Status Badge */}
                  <div className="w-[115px] shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-[11px] font-medium leading-none ${
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

                  {/* Tombol Tindakan */}
                  <div className="w-[150px] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTicketView) {
                          onOpenTicketView(
                            ticket,
                            ticket.status === 'Diproses' ? 'progres' : 'detail'
                          );
                        } else {
                          setActiveModalTicket(ticket);
                        }
                      }}
                      className="bg-white border border-[#E6ECF5] h-8 px-3 rounded-full text-[#0D2453] text-[11px] font-semibold flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      {ticket.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Catatan Antrean Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-[13px] h-[13px] text-[#64748B] shrink-0" />
          <span className="text-[10px]">
            Identitas dan data pribadi pelapor tidak ditampilkan.
          </span>
        </div>
        <div className="text-[11px] self-end sm:self-auto">
          Menampilkan {filteredTickets.length} dari 16 laporan
        </div>
      </div>

      {/* Interactive Modal (Fallback when opened in modal mode) */}
      <TicketActionModal
        ticket={activeModalTicket}
        isOpen={!!activeModalTicket}
        onClose={() => setActiveModalTicket(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
