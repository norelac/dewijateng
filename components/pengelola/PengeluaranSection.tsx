'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileText, Image as ImageIcon, X } from 'lucide-react';
import { ExpenseItem } from './types';
import { useVillageName } from './usePengelolaData';

export default function PengeluaranSection({
  expenses = [],
  periodLabel = 'Periode berjalan',
  realisasiPercent,
}: {
  expenses?: ExpenseItem[];
  periodLabel?: string;
  realisasiPercent?: number;
}) {
  const [selectedProof, setSelectedProof] = useState<{
    title: string;
    type: 'nota' | 'foto';
    url: string;
  } | null>(null);
  const villageName = useVillageName();

  const totalTercatat = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalFormatted = new Intl.NumberFormat('id-ID').format(totalTercatat);
  const completeCount = expenses.filter((e) => e.hasReceipt || e.hasPhoto).length;

  return (
    <div className="bg-white border border-[#E6ECF5] rounded-[18px] p-6 flex flex-col gap-5 shadow-xs w-full">
      {/* Pengantar Bagian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-normal">
            Pengeluaran &amp; kelengkapan publikasi
          </h2>
          <p className="text-[#64748B] text-[12px] font-normal leading-relaxed">
            {periodLabel} · {completeCount} dari {expenses.length} pos dilengkapi bukti.
          </p>
        </div>
        <a
          href="/pengelola/pengeluaran"
          className="text-[#0D2453] text-[12px] font-semibold hover:underline self-start sm:self-auto"
        >
          Buka buku kas →
        </a>
      </div>

      {/* Tabel Pengeluaran */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-[760px] flex flex-col">
          {/* Kepala Tabel */}
          <div className="bg-[#EDF3FC] rounded-[6px] h-[38px] px-4 flex items-center gap-5 text-[#0D2453] text-[12px] font-semibold">
            <div className="w-[105px] shrink-0">Tanggal</div>
            <div className="flex-1 min-w-[200px]">Kegiatan</div>
            <div className="w-[155px] shrink-0">Nominal (Rp)</div>
            <div className="w-[205px] shrink-0">Bukti</div>
            <div className="w-[140px] shrink-0">Publikasi</div>
          </div>

          {/* Baris Pengeluaran */}
          {expenses.length === 0 ? (
            <div className="border-b border-[#E6ECF5] px-4 py-6 text-center text-[#64748B] text-[12px]">
              Belum ada pos belanja terpublikasi pada periode ini.
            </div>
          ) : (
          expenses.map((item) => (
            <div
              key={item.id}
              className="border-b border-[#E6ECF5] px-4 py-3.5 flex items-center gap-5 text-[12px] hover:bg-slate-50/70 transition-colors"
            >
              {/* Tanggal */}
              <div className="w-[105px] shrink-0 text-[#0D2453] font-normal">
                {item.date}
              </div>

              {/* Kegiatan */}
              <div className="flex-1 min-w-[200px] flex flex-col gap-1 leading-tight">
                <span className="text-[#0D2453] font-medium">
                  {item.title}
                </span>
                <span className="text-[#64748B] text-[10px] font-normal">
                  {item.subtitle}
                </span>
              </div>

              {/* Nominal */}
              <div className="w-[155px] shrink-0 text-[#0D2453] font-semibold tabular-nums">
                {item.formattedAmount}
              </div>

              {/* Bukti (Nota + Foto) */}
              <div className="w-[205px] shrink-0 flex items-center gap-3.5">
                {item.hasReceipt && item.receiptUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProof({
                        title: `Nota Bukti: ${item.title}`,
                        type: 'nota',
                        url: item.receiptUrl as string,
                      })
                    }
                    className="flex items-center gap-1.5 text-[#0D2453] hover:text-blue-700 transition-colors cursor-pointer group"
                    title="Lihat salinan nota kuitansi"
                  >
                    <CheckCircle2 className="w-[13px] h-[13px] text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-normal group-hover:underline">
                      Nota ↗
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#94a3b8]">Nota —</span>
                )}

                {item.hasPhoto && item.photoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProof({
                        title: `Foto Bukti Fisik: ${item.title}`,
                        type: 'foto',
                        url: item.photoUrl as string,
                      })
                    }
                    className="flex items-center gap-1.5 text-[#0D2453] hover:text-blue-700 transition-colors cursor-pointer group"
                    title="Lihat foto bukti fisik"
                  >
                    <CheckCircle2 className="w-[13px] h-[13px] text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-normal group-hover:underline">
                      Foto fisik ↗
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#94a3b8]">Foto fisik —</span>
                )}
              </div>

              {/* Status Publikasi */}
              <div className="w-[140px] shrink-0">
                <span className="bg-[#E4F6E8] text-[#216B55] text-[11px] font-medium px-2.5 py-1.5 rounded-full inline-flex items-center">
                  {item.status}
                </span>
              </div>
            </div>
          ))
          )}

          {/* Baris Total Belanja Tercatat */}
          <div className="bg-[#F3F5F8] p-4 rounded-[6px] flex items-center justify-between text-[#0D2453] mt-2">
            <span className="text-[12px] font-semibold">
              Total belanja tercatat
            </span>
            <span className="text-[16px] font-semibold tracking-tight">
              Rp {totalFormatted}
            </span>
            <span className="text-[#64748B] text-[11px] font-normal">
              {typeof realisasiPercent === 'number'
                ? `Sesuai realisasi anggaran · ${realisasiPercent}%`
                : 'Sesuai realisasi anggaran terpublikasi'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Quick View Dokumen Bukti */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedProof(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E6ECF5] shadow-2xl w-full max-w-lg p-5 z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF5]">
              <div className="flex items-center gap-2">
                {selectedProof.type === 'nota' ? (
                  <FileText className="w-4 h-4 text-blue-600" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                )}
                <h3 className="text-sm font-semibold text-[#0D2453]">
                  {selectedProof.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[220px] overflow-hidden border border-[#E6ECF5]">
              {selectedProof.type === 'foto' ? (
                <img
                  src={selectedProof.url}
                  alt={selectedProof.title}
                  className="max-h-[300px] w-auto object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-center p-6 gap-3">
                  <FileText className="w-12 h-12 text-[#0D2453]/60" />
                  <p className="text-xs text-[#0D2453] font-medium">
                    Dokumen Salinan Nota LPJ Resmi Tersedia
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Telah diverifikasi oleh Bendahara {villageName}
                  </p>
                  <a
                    href={selectedProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0D2453] text-white text-xs font-semibold hover:bg-[#132d66] transition-colors mt-2"
                  >
                    <span>Buka Berkas PDF</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="px-4 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
