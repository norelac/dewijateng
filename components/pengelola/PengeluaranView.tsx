'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Info, Search, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { useBudgetData } from './usePengelolaData';
import { mapGrantExpenseToExpenseItem, type TransparansiExpense } from './mapReports';
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from '@/app/actions/expenseActions';

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

const CATEGORY_OPTIONS = [
  { value: 'MATERIAL_FISIK', label: 'Material fisik' },
  { value: 'OPERASIONAL', label: 'Operasional' },
  { value: 'UPAH_TENAGA', label: 'Upah tenaga' },
  { value: 'KESELAMATAN_K3', label: 'Keselamatan (K3)' },
  { value: 'PERALATAN', label: 'Peralatan' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

interface ExpenseFormState {
  activityName: string;
  category: string;
  volume: string;
  unit: string;
  claimedUnitPrice: string;
  budgetAllocated: string;
  amountRealized: string;
}

const EMPTY_FORM: ExpenseFormState = {
  activityName: '',
  category: 'MATERIAL_FISIK',
  volume: '',
  unit: 'unit',
  claimedUnitPrice: '',
  budgetAllocated: '',
  amountRealized: '',
};

function toNumberInput(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  return isNaN(n) ? '' : String(n);
}

/** Halaman buku kas: daftar pos belanja + tambah/ubah/hapus pos. */
export default function PengeluaranView() {
  const { village, grant, expenses, budget, loading, reload } = useBudgetData();

  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('');
  const [publikasi, setPublikasi] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const villageName = village?.name || 'Desa wisata';
  const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
  const canWrite = Boolean(grant?.id);

  const pill =
    'h-[40px] px-[10px] rounded-full border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] inline-flex items-center gap-[10px] cursor-pointer';

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (exp: TransparansiExpense) => {
    setEditingId(exp.id);
    setForm({
      activityName: exp.activity_name || '',
      category: exp.category || 'MATERIAL_FISIK',
      volume: toNumberInput(exp.volume),
      unit: exp.unit || 'unit',
      claimedUnitPrice: toNumberInput(exp.claimed_unit_price),
      budgetAllocated: toNumberInput(exp.budget_allocated),
      amountRealized: toNumberInput(exp.amount_realized),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grant?.id) {
      setFormError('Data bantuan tidak tersedia.');
      return;
    }
    setFormError(null);

    const payload = {
      grantId: grant.id,
      activityName: form.activityName.trim(),
      category: form.category,
      volume: Number(form.volume),
      unit: form.unit.trim() || 'unit',
      claimedUnitPrice: Number(form.claimedUnitPrice),
      budgetAllocated: form.budgetAllocated === '' ? undefined : Number(form.budgetAllocated),
      amountRealized: form.amountRealized === '' ? undefined : Number(form.amountRealized),
    };

    if (payload.activityName.length < 3) {
      setFormError('Nama kegiatan minimal 3 karakter.');
      return;
    }
    if (!(payload.volume > 0)) {
      setFormError('Volume harus lebih besar dari 0.');
      return;
    }
    if (!(payload.claimedUnitPrice >= 0) || Number.isNaN(payload.claimedUnitPrice)) {
      setFormError('Harga satuan tidak boleh negatif.');
      return;
    }

    setSaving(true);
    try {
      const res = editingId
        ? await updateExpenseAction(editingId, payload)
        : await createExpenseAction(payload);
      if (res.success) {
        setFormOpen(false);
        setEditingId(null);
        await reload();
      } else {
        setFormError(res.error || 'Gagal menyimpan pengeluaran.');
      }
    } catch {
      setFormError('Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exp: TransparansiExpense) => {
    const ok = window.confirm(`Hapus pos belanja "${exp.activity_name}"?`);
    if (!ok) return;
    setBusyId(exp.id);
    try {
      const res = await deleteExpenseAction(exp.id);
      if (res.success) {
        await reload();
      } else {
        window.alert(res.error || 'Gagal menghapus pengeluaran.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const inputClass =
    'w-full bg-white border border-[#E6ECF5] rounded-[8px] min-h-[42px] px-[12px] py-[9px] text-[13px] text-[#0D2453] outline-none focus:ring-1 focus:ring-[#0D2453] focus:border-[#0D2453] transition-colors';

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
          onClick={openCreate}
          disabled={!canWrite}
          title={canWrite ? undefined : 'Data bantuan belum tersedia'}
          className="self-start sm:self-auto shrink-0 h-[40px] px-[14px] rounded-full bg-[#0D2453] text-white text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Tambah pengeluaran
        </button>
      </div>

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
          <div className="min-w-[940px] flex flex-col">
            <div className="bg-[#F3F5F8] rounded-[6px] p-3 flex gap-4 text-[13px] text-[#64748B]">
              <span className="w-[100px] shrink-0">Tanggal</span>
              <span className="flex-1 min-w-0">Kegiatan</span>
              <span className="w-[135px] shrink-0">Nominal (Rp)</span>
              <span className="w-[110px] shrink-0">Anomali</span>
              <span className="w-[112px] shrink-0">Publikasi</span>
              <span className="w-[120px] shrink-0">Tindakan</span>
            </div>

            {loading ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#64748B]">
                Memuat buku kas...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#64748B]">
                Belum ada pos belanja terpublikasi pada periode ini.
              </div>
            ) : (
              filtered.map((item) => {
                const exp = expenses.find((e) => e.id === item.id);
                const isAnomaly = Boolean(exp?.ai_anomaly_flag);
                return (
                  <div
                    key={item.id}
                    className="border-b border-[#E6ECF5] px-3 py-[18px] flex gap-4 items-center"
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

                    <div className="w-[110px] shrink-0">
                      {isAnomaly ? (
                        <span
                          title={exp?.anomaly_note || undefined}
                          className="inline-flex bg-[#FDECEA] text-[#B3261E] text-[11px] font-medium px-[10px] py-[5px] rounded-full"
                        >
                          Perlu ditinjau
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8]">Wajar</span>
                      )}
                    </div>

                    <div className="w-[112px] shrink-0">
                      <span className="inline-flex bg-[#E7F5ED] text-[#16725C] text-[11px] font-medium px-[10px] py-[5px] rounded-full">
                        {item.status}
                      </span>
                    </div>

                    <div className="w-[120px] shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exp && openEdit(exp)}
                        disabled={!canWrite}
                        title="Ubah pengeluaran"
                        className="h-[36px] w-[36px] rounded-full bg-white border-2 border-[#E6ECF5] text-[#0D2453] inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#CBD5E1]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => exp && handleDelete(exp)}
                        disabled={!canWrite || busyId === item.id}
                        title="Hapus pengeluaran"
                        className="h-[36px] w-[36px] rounded-full bg-white border-2 border-[#FDECEA] text-[#B3261E] inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#F7C9C4]"
                      >
                        {busyId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
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
          Setiap pos belanja diuji otomatis terhadap katalog Standar Satuan Harga (SSH) Pemprov
          Jateng. Pos dengan deviasi harga di atas +40% ditandai &ldquo;Perlu ditinjau&rdquo;.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-2 text-[10px] text-[#64748B]">
        <span>© 2026 DEWI JATENG</span>
        <span>
          {villageName} · Per {budget.dateStr}
        </span>
      </div>

      {/* Modal Tambah/Ubah Pengeluaran */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-[520px] bg-white rounded-[20px] shadow-2xl border border-[#E6ECF5] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6ECF5] flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[#0D2453]">
                {editingId ? 'Ubah pengeluaran' : 'Tambah pengeluaran'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#64748B]"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[12px] font-semibold text-[#0D2453]">
                  Nama kegiatan
                </label>
                <input
                  type="text"
                  value={form.activityName}
                  onChange={(e) => setForm({ ...form, activityName: e.target.value })}
                  placeholder="Contoh: Pengadaan pipa besi galvanis pagar curug"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">Satuan</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="Batang / Sak / M3"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">Volume</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.volume}
                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">
                    Harga satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.claimedUnitPrice}
                    onChange={(e) => setForm({ ...form, claimedUnitPrice: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">
                    Pagu pos (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.budgetAllocated}
                    onChange={(e) => setForm({ ...form, budgetAllocated: e.target.value })}
                    placeholder="Kosongkan = sama dengan realisasi"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">
                    Realisasi (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.amountRealized}
                    onChange={(e) => setForm({ ...form, amountRealized: e.target.value })}
                    placeholder="Kosongkan = volume × harga"
                    className={inputClass}
                  />
                </div>
              </div>

              {formError && (
                <p className="text-[12px] text-[#B3261E] bg-[#FDECEA] border border-[#F7C9C4] rounded-[8px] px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="h-[40px] px-[18px] rounded-full bg-white border-2 border-[#E6ECF5] text-[#0D2453] text-[12px] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[40px] px-[18px] rounded-full bg-[#0D2453] text-white text-[12px] font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? 'Simpan perubahan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
