'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ShieldCheck, Check } from 'lucide-react';
import { DashboardTicket, TicketStatus } from './types';

interface KelolaLaporanListViewProps {
  tickets: DashboardTicket[];
  onSelectTicket: (ticket: DashboardTicket, action: 'detail' | 'progres') => void;
}

export default function KelolaLaporanListView({
  tickets,
  onSelectTicket,
}: KelolaLaporanListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua status');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Status counts
  const counts = useMemo(() => {
    const masuk = tickets.filter((t) => t.status === 'Masuk').length;
    const diverifikasi = tickets.filter((t) => t.status === 'Diverifikasi').length;
    const diproses = tickets.filter((t) => t.status === 'Diproses').length;
    const selesai = tickets.filter((t) => t.status === 'Selesai').length;
    const total = tickets.length;
    const perluDitangani = masuk + diverifikasi + diproses;
    return { total, perluDitangani, masuk, diverifikasi, diproses, selesai };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus =
        selectedStatus === 'Semua status' || t.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tickets, selectedStatus, searchQuery]);

  const statusOptions = ['Semua status', 'Masuk', 'Diverifikasi', 'Diproses', 'Selesai'];

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Masuk':
        return (
          <span className="bg-[#edf3fc] text-[#0d2453] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal">
            Masuk
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="bg-[#edf3fc] text-[#0d2453] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal">
            Diverifikasi
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-[#fff4dd] text-[#99620e] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal">
            Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className="bg-[#e7f5ed] text-[#16725c] text-[11px] font-medium px-[10px] py-[5px] rounded-full inline-block leading-normal">
            Selesai
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {/* 1. Judul Halaman */}
      <div className="w-full">
        <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px]">
          Kelola laporan
        </h1>
      </div>

      {/* 2. Ringkasan Status Bar */}
      <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] leading-[1.5]">
          <p className="font-semibold text-[#0d2453]">
            {counts.total} laporan · {counts.perluDitangani} perlu ditangani
          </p>
          <div className="flex flex-wrap items-center gap-[16px] text-[#64748b]">
            <span>Masuk · {counts.masuk}</span>
            <span>Diverifikasi · {counts.diverifikasi}</span>
            <span>Diproses · {counts.diproses}</span>
            <span>Selesai · {counts.selesai}</span>
          </div>
        </div>
      </div>

      {/* 3. Daftar Laporan Card */}
      <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
            Daftar laporan
          </h2>
          <p className="text-[#64748b] text-[13px] leading-[1.5]">
            Urutan terbaru lebih dahulu. Pilih laporan untuk melihat detail atau memperbarui penanganan.
          </p>
        </div>

        {/* Pencarian dan Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[12px] w-full">
          {/* Input Pencarian */}
          <div className="bg-white border border-[#e6ecf5] rounded-[8px] h-[44px] px-[12px] flex items-center gap-[10px] flex-1">
            <Search className="w-[18px] h-[18px] text-[#64748b] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau judul aduan"
              className="w-full bg-transparent text-[13px] text-[#0d2453] placeholder:text-[#64748b] outline-none"
            />
          </div>

          {/* Dropdown Filter Status */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] px-[14px] flex items-center gap-[10px] text-[#0d2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors w-full sm:w-auto justify-between"
            >
              <span>{selectedStatus}</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#64748b] shrink-0" />
            </button>

            {statusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(opt);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[12px] flex items-center justify-between hover:bg-slate-50 ${
                        selectedStatus === opt
                          ? 'text-[#0d2453] font-semibold bg-slate-50'
                          : 'text-[#64748b]'
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedStatus === opt && (
                        <Check className="w-3.5 h-3.5 text-[#0d2453]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabel Laporan */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="min-w-[720px] flex flex-col">
            {/* Header Tabel */}
            <div className="bg-[#f3f5f8] rounded-t-[6px] p-[14px] flex items-center gap-[20px] text-[#64748b] text-[13px] leading-[1.5]">
              <div className="flex-1 min-w-[220px]">Laporan</div>
              <div className="w-[115px] shrink-0">Tanggal masuk</div>
              <div className="w-[120px] shrink-0">Status</div>
              <div className="w-[150px] shrink-0">Tindakan</div>
            </div>

            {/* Baris Tabel */}
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-[#64748b] text-[13px]">
                Tidak ada laporan yang cocok dengan pencarian atau filter status.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isDiproses = ticket.status === 'Diproses';
                return (
                  <div
                    key={ticket.id}
                    className="border-b border-[#e6ecf5] px-[14px] py-[20px] flex items-center gap-[20px] hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Informasi Laporan */}
                    <div className="flex-1 min-w-[220px] flex flex-col gap-[4px]">
                      <span className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                        {ticket.title}
                      </span>
                      <span className="text-[#64748b] text-[11px] font-normal leading-[1.5] font-mono">
                        {ticket.code}
                      </span>
                    </div>

                    {/* Tanggal Masuk */}
                    <div className="w-[115px] shrink-0 text-[#0d2453] text-[13px] leading-[1.5]">
                      {ticket.date}
                    </div>

                    {/* Status */}
                    <div className="w-[120px] shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>

                    {/* Tindakan */}
                    <div className="w-[150px] shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectTicket(
                            ticket,
                            isDiproses ? 'progres' : 'detail'
                          )
                        }
                        className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] px-[14px] flex items-center justify-center text-[#0d2453] text-[12px] font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-2xs whitespace-nowrap cursor-pointer"
                      >
                        {isDiproses ? 'Perbarui progres' : 'Lihat detail'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Keterangan Daftar Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[#64748b] text-[11px] leading-[1.5]">
          <span>Alur: Masuk → Diverifikasi → Diproses → Selesai</span>
          <span>
            Menampilkan {filteredTickets.length} dari {tickets.length} laporan
          </span>
        </div>
      </div>

      {/* 4. Catatan Informasi Keamanan Privasi */}
      <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px]">
        <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
        <p className="text-[#0d2453] text-[13px] leading-[1.5]">
          Identitas dan data pribadi pelapor tidak ditampilkan. Gunakan kode laporan saat mencatat tindak lanjut.
        </p>
      </div>

      {/* 5. Catatan Layanan Sub-Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>Desa Candirejo · Per 28 Oktober 2026</span>
      </div>
    </div>
  );
}
