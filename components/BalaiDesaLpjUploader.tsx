'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Lock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { processLpjUploadAction } from '@/app/actions/lpjActions';
import type { SaveLpjResult } from '@/lib/services/lpjService';
import FiscalYearSelect from '@/components/pengelola/FiscalYearSelect';
import { useBudgetData, useVillageName } from '@/components/pengelola/usePengelolaData';

interface BalaiDesaLpjUploaderProps {
  fiscalYear?: number;
  onYearChange?: (year: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL_FISIK: 'Material fisik',
  UPAH_TENAGA: 'Upah tenaga',
  KESELAMATAN_K3: 'Keselamatan K3',
  OPERASIONAL: 'Operasional',
};

const LPJ_STATUS_META: Record<string, { label: string; cls: string }> = {
  VERIFIED: { label: 'Disetujui', cls: 'bg-[#E7F5ED] text-[#16725C]' },
  SUBMITTED: { label: 'Menunggu verifikasi', cls: 'bg-[#EDF3FC] text-[#0D2453]' },
  REVISION: { label: 'Perlu revisi', cls: 'bg-[#FDECEA] text-[#B3261E]' },
  PENDING_UPLOAD: { label: 'Belum diunggah', cls: 'bg-[#F3F5F8] text-[#64748B]' },
};

function formatNumberInput(val: number | string): string {
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '0';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

function parseNumberInput(str: string): number {
  const digits = str.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export default function BalaiDesaLpjUploader({
  fiscalYear: controlledYear,
  onYearChange,
}: BalaiDesaLpjUploaderProps) {
  const [internalYear, setInternalYear] = useState<number>(2026);
  const selectedYear = controlledYear ?? internalYear;

  const handleYearChange = (year: number) => {
    if (onYearChange) {
      onYearChange(year);
    } else {
      setInternalYear(year);
    }
    setIsDirty(false);
    setStatusMessage(null);
  };

  const { village, grant, loading, session, reload } = useBudgetData(selectedYear);
  const cachedVillageName = useVillageName('');

  const [fundingSource, setFundingSource] = useState(
    `Bantuan Keuangan Khusus Sarpras Pemprov Jateng ${selectedYear}`
  );
  const [totalAllocatedStr, setTotalAllocatedStr] = useState('100.000.000');
  const [isDirty, setIsDirty] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<SaveLpjResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan default sumber dana & pagu dengan data tahun anggaran aktif selama form belum diubah.
  useEffect(() => {
    if (isDirty) return;
    setFundingSource(
      grant?.funding_source ||
        `Bantuan Keuangan Khusus Sarpras Pemprov Jateng ${selectedYear}`
    );
    setTotalAllocatedStr(
      formatNumberInput(grant?.total_allocated || 100_000_000)
    );
  }, [selectedYear, grant?.funding_source, grant?.total_allocated, isDirty]);

  const resolvedVillageId = session?.villageId || village?.id || '';
  const villageDisplayName =
    village?.name || cachedVillageName || session?.fullName || 'Desa wisata';
  const villageFieldLabel = village
    ? `${village.name} · ${village.regency}`
    : villageDisplayName;

  const validateAndSelectFile = (selected: File | undefined | null) => {
    if (!selected) return;
    const isPdf =
      selected.type === 'application/pdf' ||
      selected.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setStatusMessage({
        type: 'error',
        text: 'Berkas wajib berformat PDF dokumen resmi LPJ.',
      });
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ukuran berkas PDF melebihi batas 25 MB.',
      });
      return;
    }
    setFile(selected);
    setStatusMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSelectFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSelectFile(e.dataTransfer.files?.[0]);
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAllocatedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setIsDirty(true);
    setTotalAllocatedStr(
      raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '0'
    );
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedVillageId) {
      setStatusMessage({
        type: 'error',
        text: 'Identitas desa belum tersedia. Muat ulang halaman jika masalah berlanjut.',
      });
      return;
    }

    const allocatedNum = parseNumberInput(totalAllocatedStr);
    if (allocatedNum <= 0) {
      setStatusMessage({
        type: 'error',
        text: 'Total pagu bantuan harus lebih dari Rp0.',
      });
      return;
    }

    if (!file) {
      setStatusMessage({
        type: 'error',
        text: 'Pilih berkas PDF LPJ resmi sebelum mengunggah.',
      });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('village_id', resolvedVillageId);
      formData.append('fiscal_year', String(selectedYear));
      formData.append('funding_source', fundingSource.trim());
      formData.append('total_allocated', String(allocatedNum));
      formData.append('file', file);

      const res = await processLpjUploadAction(formData);
      if (!res.success || !res.data) {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal mengunggah dokumen LPJ.',
        });
        return;
      }

      setUploadResult(res.data);
      setStatusMessage({
        type: 'success',
        text: `LPJ tahun anggaran ${selectedYear} berhasil disimpan dan pos belanja sudah dicocokkan dengan acuan SSH Jawa Tengah.`,
      });
      handleClearFile();
      setIsDirty(false);
      await reload();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Terjadi gangguan jaringan saat mengunggah dokumen.',
      });
    } finally {
      setUploading(false);
    }
  };

  const activeStatusKey =
    (uploadResult && uploadResult.fiscalYear === selectedYear
      ? uploadResult.lpjStatus
      : grant?.lpj_status) || 'PENDING_UPLOAD';
  const statusMeta = LPJ_STATUS_META[activeStatusKey] || LPJ_STATUS_META.PENDING_UPLOAD;

  const summaryAllocated =
    uploadResult && uploadResult.fiscalYear === selectedYear
      ? uploadResult.totalAllocated
      : grant?.total_allocated ?? 0;
  const summaryRealized =
    uploadResult && uploadResult.fiscalYear === selectedYear
      ? uploadResult.totalRealized
      : grant?.total_realized ?? 0;
  const summaryRemaining =
    uploadResult && uploadResult.fiscalYear === selectedYear
      ? uploadResult.remainingBalance
      : grant?.remaining_balance ?? Math.max(0, summaryAllocated - summaryRealized);
  const summaryPdfUrl =
    uploadResult && uploadResult.fiscalYear === selectedYear
      ? uploadResult.lpjDocumentUrl
      : grant?.lpj_document_url ?? null;

  const inputClass =
    'w-full bg-white border border-[#E6ECF5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] text-[#0D2453] outline-none focus:ring-1 focus:ring-[#0D2453] focus:border-[#0D2453] transition-colors';

  return (
    <div className="flex flex-col gap-[24px] w-full">
      {/* 1. Pengantar halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] w-full">
        <div className="flex flex-col gap-[7px] min-w-0">
          <h1 className="text-[#0D2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal">
            Unggah LPJ
          </h1>
          <p className="text-[#64748B] text-[13px] font-normal leading-[1.5]">
            Salinan resmi laporan pertanggungjawaban {villageDisplayName} · Tahun anggaran {selectedYear}
          </p>
        </div>

        <FiscalYearSelect
          value={selectedYear}
          onChange={handleYearChange}
          variant="button"
          disabled={uploading || loading}
        />
      </div>

      {/* 2. Formulir + ringkasan 2 kolom */}
      <form
        onSubmit={handleUploadSubmit}
        className="flex flex-col lg:flex-row gap-[24px] items-start w-full"
      >
        {/* Kolom kiri */}
        <div className="flex-1 min-w-0 flex flex-col gap-[24px] w-full">
          {/* Identitas & sumber dana */}
          <div className="bg-white border border-[#E6ECF5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Identitas &amp; sumber dana
            </h2>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                Desa wisata
              </label>
              <div
                className="w-full bg-[#F3F5F8] border border-[#E6ECF5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] font-medium text-[#0D2453] flex items-center justify-between gap-2 select-none"
                title="Wilayah desa otomatis mengikuti akun pengelola yang aktif"
              >
                <span className="truncate">{villageFieldLabel}</span>
                <Lock className="w-[15px] h-[15px] text-[#64748B] shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="lpj-funding-source"
                className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]"
              >
                Sumber pendanaan
              </label>
              <input
                id="lpj-funding-source"
                type="text"
                value={fundingSource}
                onChange={(e) => {
                  setIsDirty(true);
                  setFundingSource(e.target.value);
                }}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label
                htmlFor="lpj-total-allocated"
                className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]"
              >
                Total pagu bantuan (Rp)
              </label>
              <input
                id="lpj-total-allocated"
                type="text"
                inputMode="numeric"
                value={totalAllocatedStr}
                onChange={handleAllocatedChange}
                className={`${inputClass} tabular-nums`}
              />
              <p className="text-[#64748B] text-[11px] font-normal leading-[1.5]">
                Menyesuaikan anggaran tersimpan untuk tahun anggaran {selectedYear} dan dapat diubah bila perlu.
              </p>
            </div>
          </div>

          {/* Unggah salinan PDF */}
          <div className="bg-white border border-[#E6ECF5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
                Salinan PDF LPJ
              </h2>
              {file && (
                <span className="bg-[#E7F5ED] text-[#16725C] text-[11px] font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Berkas siap diunggah</span>
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="bg-[#F3F5F8] border border-[#E6ECF5] rounded-[10px] p-[16px] flex items-center justify-between gap-[12px] w-full">
                <div className="flex items-center gap-[12px] min-w-0 flex-1">
                  <FileText className="w-[18px] h-[18px] text-[#0D2453] shrink-0" />
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <p className="text-[#0D2453] text-[13px] font-semibold truncate">
                      {file.name}
                    </p>
                    <p className="text-[#64748B] text-[11px]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · PDF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-[#0D2453] text-[12px] hover:underline cursor-pointer"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-[#B3261E] hover:opacity-80 p-1 cursor-pointer"
                    title="Hapus berkas"
                    aria-label="Hapus berkas PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border border-dashed rounded-[10px] px-5 py-6 flex items-center gap-4 transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-[#0D2453] bg-[#EDF3FC]'
                    : 'border-[#CBD5E1] bg-[#F7F9FC] hover:border-[#0D2453] hover:bg-[#F3F5F8]'
                }`}
              >
                <div className="w-10 h-10 rounded-[10px] bg-white border border-[#E6ECF5] text-[#0D2453] flex items-center justify-center shrink-0">
                  <FileText className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#0D2453]">
                    Pilih atau seret berkas PDF LPJ resmi
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Maksimal 25 MB · Dokumen bertanda tangan Kepala Desa &amp; BPD
                  </p>
                </div>
              </div>
            )}

            {statusMessage && (
              <p
                className={`text-[12px] rounded-[8px] px-3 py-2 border ${
                  statusMessage.type === 'success'
                    ? 'text-[#16725C] bg-[#E7F5ED] border-[#BEE5D0]'
                    : 'text-[#B3261E] bg-[#FDECEA] border-[#F7C9C4]'
                }`}
              >
                {statusMessage.text}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={uploading || !file || !resolvedVillageId}
                className="bg-[#0D2453] border-2 border-[#0D2453] text-white text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-[#132d66] transition-colors shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
              >
                {uploading ? 'Memproses dokumen...' : 'Unggah & proses LPJ'}
              </button>

              <p className="text-[#64748B] text-[11px] leading-[1.5]">
                Salinan yang diunggah langsung tercatat pada portal transparansi publik.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom kanan: ringkasan periode */}
        <div className="w-full lg:w-[370px] shrink-0 flex flex-col gap-[20px]">
          <div className="bg-white border border-[#E6ECF5] rounded-[16px] p-[24px] flex flex-col gap-[16px] shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5] whitespace-nowrap">
                Ringkasan TA {selectedYear}
              </h2>
              <span
                className={`text-[11px] font-medium px-[10px] py-[4px] rounded-full whitespace-nowrap shrink-0 ${statusMeta.cls}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <div className="bg-[#E6ECF5] h-px w-full" />

            <div className="flex flex-col gap-[4px]">
              <span className="text-[#64748B] text-[13px] leading-[1.5]">
                Pagu tercatat
              </span>
              <span className="text-[#0D2453] text-[20px] font-semibold leading-[1.5] tabular-nums">
                {loading ? '—' : formatRupiah(summaryAllocated)}
              </span>
            </div>

            <div className="flex flex-col gap-[4px]">
              <span className="text-[#64748B] text-[13px] leading-[1.5]">
                Realisasi belanja
              </span>
              <span className="text-[#0D2453] text-[20px] font-semibold leading-[1.5] tabular-nums">
                {loading ? '—' : formatRupiah(summaryRealized)}
              </span>
            </div>

            <div className="flex flex-col gap-[4px]">
              <span className="text-[#64748B] text-[13px] leading-[1.5]">
                Sisa saldo
              </span>
              <span className="text-[#0D2453] text-[20px] font-semibold leading-[1.5] tabular-nums">
                {loading ? '—' : formatRupiah(summaryRemaining)}
              </span>
            </div>

            {summaryPdfUrl && (
              <a
                href={summaryPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white border-2 border-[#E6ECF5] rounded-full h-[38px] px-[16px] inline-flex items-center justify-center gap-2 text-[#0D2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors self-start"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh salinan PDF</span>
              </a>
            )}
          </div>

          <div className="bg-[#EDF3FC] rounded-[10px] p-[16px] flex items-start gap-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0D2453] shrink-0 mt-0.5" />
            <p className="text-[#0D2453] text-[13px] font-normal leading-[1.5] flex-1">
              Setiap pos belanja hasil ekstraksi dicocokkan terhadap Standar Satuan Harga Jawa Tengah dan dapat ditinjau ulang di menu Pengeluaran &amp; bukti.
            </p>
          </div>
        </div>
      </form>

      {/* 3. Tabel hasil ekstraksi setelah unggah */}
      {uploadResult?.expenses && uploadResult.expenses.length > 0 && (
        <div className="bg-white border border-[#E6ECF5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
                Hasil ekstraksi pos belanja ({uploadResult.expenses.length} pos)
              </h2>
              <p className="text-[#64748B] text-[12px] mt-0.5 tabular-nums">
                Pagu {formatRupiah(uploadResult.totalAllocated)} · Realisasi{' '}
                {formatRupiah(uploadResult.totalRealized)} · Sisa{' '}
                {formatRupiah(uploadResult.remainingBalance)}
              </p>
            </div>
            {uploadResult.lpjDocumentUrl && (
              <a
                href={uploadResult.lpjDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white border-2 border-[#E6ECF5] rounded-full h-[38px] px-[16px] inline-flex items-center gap-2 text-[#0D2453] text-[12px] font-semibold hover:bg-slate-50 transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh salinan PDF</span>
              </a>
            )}
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F5F8] text-[#64748B] text-[12px] font-normal">
                  <th className="px-[14px] py-[12px] rounded-tl-[8px] font-normal">
                    Nama kegiatan / bahan
                  </th>
                  <th className="px-[14px] py-[12px] font-normal">Kategori</th>
                  <th className="px-[14px] py-[12px] text-right font-normal">
                    Volume
                  </th>
                  <th className="px-[14px] py-[12px] text-right font-normal">
                    Harga satuan
                  </th>
                  <th className="px-[14px] py-[12px] text-right font-normal">
                    Realisasi
                  </th>
                  <th className="px-[14px] py-[12px] rounded-tr-[8px] font-normal">
                    Status SSH
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECF5] text-[13px] text-[#0D2453]">
                {uploadResult.expenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-[14px] py-[16px] font-semibold">
                      {exp.activity_name}
                    </td>
                    <td className="px-[14px] py-[16px] text-[#64748B]">
                      {CATEGORY_LABELS[exp.category] || exp.category}
                    </td>
                    <td className="px-[14px] py-[16px] text-right tabular-nums text-[#64748B]">
                      {exp.volume} {exp.unit}
                    </td>
                    <td className="px-[14px] py-[16px] text-right tabular-nums">
                      {formatRupiah(exp.claimed_unit_price)}
                    </td>
                    <td className="px-[14px] py-[16px] text-right tabular-nums font-semibold">
                      {formatRupiah(exp.amount_realized)}
                    </td>
                    <td className="px-[14px] py-[16px]">
                      {exp.ai_anomaly_flag ? (
                        <span
                          title={exp.anomaly_note}
                          className="inline-flex bg-[#FDECEA] text-[#B3261E] text-[11px] font-medium px-[10px] py-[4px] rounded-full"
                        >
                          Perlu ditinjau
                        </span>
                      ) : (
                        <span
                          title={exp.anomaly_note}
                          className="inline-flex bg-[#E7F5ED] text-[#16725C] text-[11px] font-medium px-[10px] py-[4px] rounded-full"
                        >
                          Wajar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748B] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>
          {villageDisplayName} · Tahun anggaran {selectedYear}
        </span>
      </div>
    </div>
  );
}
