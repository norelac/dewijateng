'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { VillageBudgetData } from './types';
import { useVillageName } from './usePengelolaData';
import FiscalYearSelect from './FiscalYearSelect';

interface UbahAnggaranViewProps {
  budget: VillageBudgetData;
  onBack: () => void;
  onSaveBudget: (
    updated: Partial<VillageBudgetData>
  ) => Promise<{ success: boolean; error?: string } | void> | void;
  /** Aktifkan tombol simpan; backend tulis anggaran sudah tersedia. */
  saveEnabled?: boolean;
  /** Tahun anggaran yang sedang diedit (dikendalikan halaman). */
  fiscalYear?: number;
  onYearChange?: (year: number) => void;
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp');
}

function formatNumberInput(val: number | string): string {
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '0';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

function parseNumberInput(str: string): number {
  const digits = str.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export default function UbahAnggaranView({
  budget,
  onBack,
  onSaveBudget,
  saveEnabled = true,
  fiscalYear,
  onYearChange,
}: UbahAnggaranViewProps) {
  const selectedYear = fiscalYear ?? budget.year ?? 2026;
  const villageName = useVillageName();

  const [apbdesStr, setApbdesStr] = useState<string>(
    formatNumberInput(budget.apbdes)
  );
  const [banprovStr, setBanprovStr] = useState<string>(
    formatNumberInput(budget.banprov)
  );
  const [padesStr, setPadesStr] = useState<string>(
    formatNumberInput(budget.pades)
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Data anggaran dimuat asinkron (INITIAL_BUDGET_DATA → data grant asli).
  // Sinkronkan nilai form selama pengguna belum mengubah apa pun, agar tidak
  // tersimpan dengan angka placeholder.
  useEffect(() => {
    if (isDirty) return;
    setApbdesStr(formatNumberInput(budget.apbdes));
    setBanprovStr(formatNumberInput(budget.banprov));
    setPadesStr(formatNumberInput(budget.pades));
  }, [budget.year, budget.apbdes, budget.banprov, budget.pades, isDirty]);

  // Live dynamic calculations
  const apbdesNum = parseNumberInput(apbdesStr);
  const banprovNum = parseNumberInput(banprovStr);
  const padesNum = parseNumberInput(padesStr);

  const totalPendanaan = apbdesNum + banprovNum + padesNum;
  const danaTerpakaiTetap = budget.usedAmount;
  const sisaKasSaatIni = totalPendanaan - danaTerpakaiTetap;

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      setIsDirty(true);
      if (!raw) {
        setter('0');
      } else {
        setter(new Intl.NumberFormat('id-ID').format(Number(raw)));
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveEnabled || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const result = await onSaveBudget({
        year: selectedYear,
        apbdes: apbdesNum,
        banprov: banprovNum,
        pades: padesNum,
        lastUpdatedStr: `Diperbarui TA ${selectedYear} · Total ${formatRupiah(totalPendanaan)} dipublikasikan.`,
      });
      if (result && result.success === false) {
        setSaveError(result.error || 'Gagal menyimpan anggaran.');
        return;
      }
      setIsSaved(true);
      setTimeout(() => {
        onBack();
      }, 600);
    } catch {
      setSaveError('Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-[24px] w-full" data-node-id="371:1034">
      {/* 1. Tombol Kembali */}
      <button
        type="button"
        onClick={onBack}
        className="font-semibold text-[#0d2453] text-[12px] leading-normal self-start hover:underline cursor-pointer flex items-center gap-1.5"
      >
        <span>←</span>
        <span>Kembali ke Anggaran desa</span>
      </button>

      {/* 2. Pengantar Halaman (Judul & Subtitle) */}
      <div className="flex flex-col gap-[7px] w-full">
        <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal">
          Ubah anggaran
        </h1>
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
          Perbarui sumber pendanaan {villageName}. Nilai awal sesuai anggaran tersimpan.
        </p>
      </div>

      {/* 3. Formulir Anggaran (Layout 2 Kolom) */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col lg:flex-row gap-[24px] items-start w-full"
      >
        {/* Kolom Kiri: Isian Pendanaan */}
        <div className="flex-1 min-w-px flex flex-col gap-[24px] w-full">
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Tahun &amp; sumber dana
            </h2>

            {/* Isian: Tahun Anggaran Dropdown */}
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                Tahun anggaran
              </label>
              <div className="relative">
                <FiscalYearSelect
                  value={selectedYear}
                  onChange={(year) => onYearChange?.(year)}
                  variant="button"
                  labelPrefix=""
                  align="left"
                  fullWidth
                  disabled={!onYearChange}
                />
              </div>
            </div>

            {/* Isian: APBDes (Rp) */}
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                APBDes (Rp)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={apbdesStr}
                  onChange={handleInputChange(setApbdesStr)}
                  className="w-full bg-white border border-[#e6ecf5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] tabular-nums text-[#0d2453] outline-none focus:ring-1 focus:ring-[#0d2453] focus:border-[#0d2453] transition-colors"
                />
              </div>
            </div>

            {/* Isian: Bantuan Provinsi (Rp) */}
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                Bantuan Provinsi (Rp)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={banprovStr}
                  onChange={handleInputChange(setBanprovStr)}
                  className="w-full bg-white border border-[#e6ecf5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] tabular-nums text-[#0d2453] outline-none focus:ring-1 focus:ring-[#0d2453] focus:border-[#0d2453] transition-colors"
                />
              </div>
            </div>

            {/* Isian: PADes Wisata (Rp) */}
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#0d2453] text-[13px] font-semibold leading-[1.5]">
                PADes Wisata (Rp)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={padesStr}
                  onChange={handleInputChange(setPadesStr)}
                  className="w-full bg-white border border-[#e6ecf5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] tabular-nums text-[#0d2453] outline-none focus:ring-1 focus:ring-[#0d2453] focus:border-[#0d2453] transition-colors"
                />
              </div>
            </div>

            {/* Pemisah Garis */}
            <div className="bg-[#e6ecf5] h-px w-full my-1" />

            {/* Total Pendanaan Dinamis */}
            <div className="flex items-center justify-between text-[#0d2453] leading-[1.5] w-full">
              <span className="text-[13px] font-semibold">Total pendanaan</span>
              <span className="text-[22px] font-semibold tracking-tight tabular-nums">
                {formatRupiah(totalPendanaan)}
              </span>
            </div>

            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
              Total adalah penjumlahan ketiga sumber dana.
            </p>

            {saveError && (
              <p className="text-[12px] text-[#B3261E] bg-[#FDECEA] border border-[#F7C9C4] rounded-[8px] px-3 py-2">
                {saveError}
              </p>
            )}

            {/* Tindakan Formulir */}
            <div className="flex items-center gap-[10px] pt-[6px]">
              <button
                type="submit"
                disabled={!saveEnabled || isSaving}
                title={saveEnabled ? undefined : 'Penyimpanan anggaran belum tersedia'}
                className={`border-2 rounded-full h-[40px] px-[18px] text-[12px] font-semibold transition-all shadow-2xs ${
                  saveEnabled
                    ? 'bg-[#0d2453] border-[#0d2453] text-white hover:bg-[#132d66] active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                    : 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {!saveEnabled
                  ? 'Belum tersedia'
                  : isSaving
                    ? 'Menyimpan...'
                    : isSaved
                      ? 'Tersimpan!'
                      : 'Simpan perubahan'}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="bg-white border-2 border-[#e6ecf5] text-[#0d2453] text-[12px] font-semibold rounded-full h-[40px] px-[18px] hover:bg-slate-50 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                Batal
              </button>
            </div>
            {!saveEnabled && (
              <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
                Penyimpanan perubahan anggaran belum tersedia sampai endpoint tulis anggaran disiapkan di backend.
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Dampak Perubahan */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-[20px]">
          {/* Card: Sebelum Menyimpan */}
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] flex flex-col gap-[18px] shadow-xs">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Sebelum menyimpan
            </h2>
            <p className="text-[#0d2453] text-[13px] font-normal leading-[1.5]">
              Nilai sumber dana dan total pendanaan pada situs publik akan diperbarui setelah perubahan disimpan.
            </p>

            <div className="bg-[#e6ecf5] h-px w-full" />

            {/* Dana Terpakai Tetap */}
            <div className="flex flex-col gap-[4px]">
              <span className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
                Dana terpakai tetap
              </span>
              <span className="text-[#0d2453] text-[20px] font-semibold leading-[1.5] tabular-nums">
                {formatRupiah(danaTerpakaiTetap)}
              </span>
            </div>

            {/* Sisa Kas dengan Isian Saat Ini */}
            <div className="flex flex-col gap-[4px]">
              <span className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
                Sisa kas dengan isian saat ini
              </span>
              <span
                className={`text-[20px] font-semibold leading-[1.5] tabular-nums ${
                  sisaKasSaatIni < 0 ? 'text-red-600' : 'text-[#0d2453]'
                }`}
              >
                {formatRupiah(sisaKasSaatIni)}
              </span>
            </div>

            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5]">
              Sisa kas dihitung dari total pendanaan dikurangi pengeluaran yang tersimpan.
            </p>
          </div>

          {/* Card Catatan Informasi */}
          <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="text-[#0d2453] text-[13px] font-normal leading-[1.5] flex-1">
              Periksa nominal sebelum menyimpan. Batal mengembalikan Anda tanpa menerapkan perubahan.
            </p>
          </div>
        </div>
      </form>

      {/* 4. Sub-Footer Layanan */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] leading-[1.5]">
        <span>© 2026 DEWI JATENG</span>
        <span>{villageName} · Per 28 Oktober 2026</span>
      </div>
    </div>
  );
}
