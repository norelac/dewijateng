'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Info, Search } from 'lucide-react';
import { useBudgetData } from './usePengelolaData';
import { mapGrantExpenseToExpenseItem } from './mapReports';

function monthKey(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function monthLabel(key: string): string {
  if (!key) return 'Semua bulan';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

/** Halaman buku kas: daftar pos belanja + status kelengkapan bukti. */
export default function PengeluaranView() {
  const { village, grant, expenses, budget, loading } = useBudgetData();

  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('');
  const [publikasi, setPublikasi] = useState('all');

  // ponytail: bukti per pos belum ada kolomnya di BE, jadi nimpa receiptUrl
  // jadi undefined; tampilkan "Belum tersedia" sampai kolom bukti tersedia.
  const items = useMemo(
    () => expenses.map((exp) => mapGrantExpenseToExpenseItem(exp)),
    [expenses]
  );

  const months = useMemo(
    () => Array.from(new Set(expenses.map((e) => monthKey(e.created_at)).filter(Boolean))).sort(),
    [expenses]
  );

  const filtered = items.filter((item) => {
    if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }).filter((item) => {
    if (!month) return true;
    const src = expenses.find((e) => e.id === item.id);
    return monthKey(src?.created_at) === month;
  }).filter((item) => {
    if (publikasi === 'all') return true;
    return publikasi === 'published'
      ? item.status === 'Terpublikasi'
      : item.status === 'Draft';
  });

  const total = filtered.reduce((sum, item) => sum + item.amount, 0);
  const complete = filtered.filter((e) => e.hasReceipt || e.hasPhoto).length;
  const realisasi =
    grant && grant.total_allocated > 0
      ? Math.round((grant.total_realized / grant.total_allocated) * 100)
      : undefined;

  const villageName = village?.name || 'Desa Candirejo';
  const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

  const pill =
    'h-[40px] px-[10px] rounded-full border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] inline-flex items-center gap-[10px] cursor-pointer';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Pengantar halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
        <div className="flex-1 min-w-0 flex flex-col gap-[7px]">
          <h1 className="text-[28px] font-semibold tracking-[-0.7px] text-[#0D2453] break-words">
            Pengeluaran &amp; bukti
          </h1>
          <p className="text-[13px] text-[#64748B]">
            Buku kas {villageName} · Tahun anggaran {budget.year}
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Form tambah pengeluaran menunggu endpoint tulis dari backend"
          className="self-start sm:self-auto shrink-0 h-[40px] px-[10px] rounded-full bg-[#0D2453] text-white text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Tambah pengeluaran
        </button>
      </div>

      <p className="text-[11px] text-[#64748B] -mt-3">
        Form tambah dan ubah pengeluaran belum tersedia: menunggu endpoint tulis dari backend.
      </p>

      {/* Ringkasan buku kas */}
      <div className="bg-white rounded-[16px] p-6 shadow-[0px_1px_2px_rgba(13,36,83,0.04),0px_8px_24px_rgba(13,36,83,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-[5px]">
            <span className="text-[13px] text-[#64748B]">Total belanja tercatat</span>
            <span className="text-[26px] font-semibold text-[#0D2453]">
              {loading ? '—' : rupiah(total)}
            </span>
          </div>
          <div className="flex flex-col gap-[5px] sm:text-right">
            <span className="text-[13px] font-semibold text-[#0D2453]">
              {filtered.length} kegiatan · seluruhnya terpublikasi
            </span>
            <span className="text-[11px] text-[#64748B]">
              {complete} dari {filtered.length} dilengkapi nota dan foto fisik
              {typeof realisasi === 'number' ? ` · realisasi ${realisasi}%` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Buku kas kegiatan */}
      <div className="bg-white rounded-[16px] p-6 flex flex-col gap-[18px] shadow-[0px_1px_2px_rgba(13,36,83,0.04),0px_8px_24px_rgba(13,36,83,0.06)]">
        <h2 className="text-[17px] font-semibold text-[#0D2453]">Buku kas kegiatan</h2>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 min-w-0 flex items-center gap-[10px] h-[44px] px-3 rounded-[8px] border border-[#E6ECF5] bg-white">
            <Search className="w-[18px] h-[18px] text-[#64748B] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kegiatan"
              className="flex-1 min-w-0 text-[13px] text-[#0D2453] placeholder:text-[#64748B] bg-transparent focus:outline-none"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Filter bulan"
              className={`${pill} appearance-none pr-8`}
            >
              <option value="">Semua bulan</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#0D2453] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="relative shrink-0">
            <select
              value={publikasi}
              onChange={(e) => setPublikasi(e.target.value)}
              aria-label="Filter publikasi"
              className={`${pill} appearance-none pr-8`}
            >
              <option value="all">Semua publikasi</option>
              <option value="published">Terpublikasi</option>
              <option value="draft">Belum terpublikasi</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#0D2453] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="flex-1 min-w-0 text-[11px] text-[#64748B]">
            Menampilkan {filtered.length} dari {items.length} kegiatan
          </p>
        </div>

        {/* Tabel pengeluaran */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[860px] flex flex-col">
            <div className="bg-[#F3F5F8] rounded-[6px] p-3 flex gap-4 text-[13px] text-[#64748B]">
              <span className="w-[100px] shrink-0">Tanggal</span>
              <span className="flex-1 min-w-0">Kegiatan</span>
              <span className="w-[135px] shrink-0">Nominal (Rp)</span>
              <span className="w-[142px] shrink-0">Bukti</span>
              <span className="w-[112px] shrink-0">Publikasi</span>
              <span className="w-[72px] shrink-0">Tindakan</span>
            </div>

            {loading ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#64748B]">
                Memuat buku kas…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#64748B]">
                Belum ada pos belanja terpublikasi pada periode ini.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-[#E6ECF5] px-3 py-[22px] flex gap-4 items-center"
                >
                  <span className="w-[100px] shrink-0 text-[13px] text-[#0D2453]">
                    {item.date}
                  </span>

                  <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                    <span className="text-[13px] font-semibold text-[#0D2453] break-words">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#64748B] break-words">
                      {item.subtitle}
                    </span>
                  </div>

                  <span className="w-[135px] shrink-0 text-[13px] font-semibold text-[#0D2453] tabular-nums">
                    {item.formattedAmount}
                  </span>

                  <span className="w-[142px] shrink-0 text-[12px] text-[#94A3B8]">
                    Belum tersedia
                  </span>

                  <div className="w-[112px] shrink-0">
                    <span className="inline-flex bg-[#E7F5ED] text-[#16725C] text-[11px] font-medium px-[10px] py-[5px] rounded-full">
                      {item.status}
                    </span>
                  </div>

                  <div className="w-[72px] shrink-0">
                    <button
                      type="button"
                      disabled
                      title="Ubah pengeluaran menunggu endpoint tulis dari backend"
                      className="h-[40px] px-[10px] rounded-full bg-white border-2 border-[#E6ECF5] text-[12px] font-semibold text-[#0D2453] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="bg-[#F3F5F8] rounded-[6px] p-4 mt-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#0D2453]">
                Total belanja tercatat
              </span>
              <span className="text-[22px] font-semibold text-[#0D2453] tabular-nums">
                {rupiah(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#EDF3FC] rounded-[12px] p-4 flex items-start gap-3">
        <Info className="w-[18px] h-[18px] text-[#0D2453] shrink-0" />
        <p className="text-[12px] text-[#64748B] leading-[1.6]">
          Lampiran nota dan foto per pos belum tersedia. Bukti akan tampil setelah pengelola
          mengunggahnya dan backend menyediakan kolom lampiran.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-2 text-[10px] text-[#64748B]">
        <span>© 2026 DEWI JATENG</span>
        <span>
          {villageName} · Per {budget.dateStr}
        </span>
      </div>
    </div>
  );
}
