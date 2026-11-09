'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import {
  ActivityHistoryEvent,
  ActivityType,
  HandlingStage,
  INITIAL_ACTIVITY_HISTORY,
  INITIAL_HANDLING_STAGES,
} from './types';

interface AktivitasPengelolaanViewProps {
  events?: ActivityHistoryEvent[];
  stages?: HandlingStage[];
  traceSubject?: string;
  /** Navigasi ke tab laporan (opsional membawa id tiket) atau anggaran. */
  onNavigate?: (tab: 'laporan' | 'anggaran', ticketId?: string) => void;
}

const PERIOD_OPTIONS = [
  { label: '1–28 Oktober 2026', month: 'Okt' },
  { label: '1–30 September 2026', month: 'Sep' },
  { label: '1–31 Agustus 2026', month: 'Ags' },
];

const TYPE_OPTIONS: ActivityType[] = ['Semua', 'Laporan', 'Anggaran'];

export default function AktivitasPengelolaanView({
  events = INITIAL_ACTIVITY_HISTORY,
  stages = INITIAL_HANDLING_STAGES,
  traceSubject = 'Akses ke curug buruk · DS-JTG-2026-0891',
  onNavigate,
}: AktivitasPengelolaanViewProps) {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [type, setType] = useState<ActivityType>('Semua');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const filtered = useMemo(
    () =>
      events.filter(
        (ev) =>
          ev.date.includes(period.month) &&
          (type === 'Semua' || ev.type === type)
      ),
    [events, period.month, type]
  );

  return (
    <div
      className="flex flex-col gap-[24px] w-full"
      data-node-id="352:13381"
    >
      {/* 1. Pengantar halaman */}
      <div className="flex items-center w-full">
        <div className="flex flex-1 flex-col gap-[7px] min-w-px">
          <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal w-full">
            Aktivitas pengelolaan
          </h1>
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
            Riwayat pembaruan laporan dan anggaran Desa Candirejo.
          </p>
        </div>
      </div>

      {/* 2. Filter riwayat */}
      <div className="bg-white rounded-[16px] p-[24px] shadow-xs w-full">
        <div className="flex flex-wrap gap-[12px] items-center w-full">
          {/* Dropdown periode */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodOpen((v) => !v)}
              className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] flex gap-[10px] items-center justify-center px-[10px] text-[#0d2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{period.label}</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#64748b] shrink-0" />
            </button>
            {periodOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setPeriodOpen(false)}
                />
                <div className="absolute left-0 top-[46px] bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 w-[220px]">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setPeriod(opt);
                        setPeriodOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[12px] hover:bg-slate-50 cursor-pointer ${
                        period.label === opt.label
                          ? 'text-[#0d2453] font-semibold bg-slate-50'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dropdown jenis */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeOpen((v) => !v)}
              className="bg-white border-2 border-[#e6ecf5] rounded-full h-[40px] flex gap-[10px] items-center justify-center px-[10px] text-[#0d2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{type === 'Semua' ? 'Semua jenis' : type}</span>
              <ChevronDown className="w-[16px] h-[16px] text-[#64748b] shrink-0" />
            </button>
            {typeOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setTypeOpen(false)}
                />
                <div className="absolute left-0 top-[46px] bg-white border border-[#e6ecf5] rounded-xl shadow-lg py-1.5 z-40 w-[160px]">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setType(opt);
                        setTypeOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[12px] hover:bg-slate-50 cursor-pointer ${
                        type === opt
                          ? 'text-[#0d2453] font-semibold bg-slate-50'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {opt === 'Semua' ? 'Semua jenis' : opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className="flex-1 min-w-px text-[#64748b] text-[11px] font-normal leading-[1.5]">
            {filtered.length} aktivitas pada periode ini
          </p>
        </div>
      </div>

      {/* 3. Riwayat terbaru */}
      <div className="bg-white rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs w-full">
        <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
          Riwayat terbaru
        </p>
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
          Perubahan tersimpan ditampilkan dari yang paling baru.
        </p>

        {filtered.length === 0 ? (
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] py-[18px]">
            Tidak ada aktivitas pada periode dan jenis ini.
          </p>
        ) : (
          filtered.map((ev) => (
            <div
              key={ev.id}
              className="border-b border-[#e6ecf5] flex flex-col sm:flex-row gap-[14px] sm:gap-[24px] items-start py-[18px] w-full"
            >
              <div className="flex flex-col gap-[8px] items-start w-full sm:w-[120px] shrink-0">
                <p className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                  {ev.date}
                </p>
                <div className="bg-[#edf3fc] flex items-start px-[10px] py-[5px] rounded-full">
                  <p className="text-[#0d2453] text-[11px] font-medium leading-normal whitespace-nowrap">
                    {ev.type}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-[7px] items-start min-w-px">
                <p className="text-[#0d2453] text-[16px] font-semibold leading-[1.5]">
                  {ev.title}
                </p>
                <p className="text-[#0d2453] text-[13px] font-normal leading-[1.5]">
                  {ev.subject}
                </p>
                <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
                  {ev.desc}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate?.(ev.actionTab, ev.ticketId)}
                  className="text-[#0d2453] text-[12px] font-semibold leading-normal whitespace-nowrap hover:underline cursor-pointer"
                >
                  {ev.actionLabel}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Jejak penanganan laporan selesai */}
      <div className="bg-white rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs w-full">
        <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
          Jejak penanganan laporan selesai
        </p>
        <p className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full">
          {traceSubject}
        </p>
        <div className="flex flex-col sm:flex-row gap-[14px] sm:gap-[20px] items-stretch w-full">
          {stages.map((stage, idx) => (
            <div
              key={`${stage.label}-${idx}`}
              className="bg-[#f3f5f8] flex flex-1 flex-col gap-[5px] items-start p-[14px] rounded-[8px] min-w-0"
            >
              <p className="text-[#64748b] text-[11px] font-normal leading-normal w-full">
                {stage.date}
              </p>
              <p className="text-[#0d2453] text-[13px] font-semibold leading-normal w-full">
                {stage.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Catatan informasi */}
      <div className="bg-[#edf3fc] flex gap-[10px] items-start p-[16px] rounded-[10px] w-full">
        <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
        <p className="flex-1 min-w-px text-[#0d2453] text-[13px] font-normal leading-[1.5]">
          Riwayat menggunakan kode laporan. Nama, kontak, dan identitas pribadi
          pelapor tidak ditampilkan.
        </p>
      </div>

      {/* 6. Catatan layanan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] font-normal leading-[1.5] w-full">
        <p>© 2026 DEWI JATENG</p>
        <p>Desa Candirejo · Per 28 Oktober 2026</p>
      </div>
    </div>
  );
}
