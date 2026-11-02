'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  TrendingUp,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { SAMPLE_CASHBOOK, REGENCIES_JATENG, SAMPLE_VILLAGES } from '@/lib/mockData';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import type { CashbookEntry } from '@/types';

export default function CashbookTable() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeReceipt, setActiveReceipt] = useState<CashbookEntry | null>(null);

  const categories = [
    { key: 'ALL', label: 'Semua Kategori' },
    { key: 'KESELAMATAN_K3', label: 'Keselamatan K3' },
    { key: 'MATERIAL', label: 'Material Fisik' },
    { key: 'UPAH_KERJA', label: 'Upah Tukang (HOK)' },
    { key: 'OPERASIONAL', label: 'Operasional' },
  ];

  const filteredEntries = SAMPLE_CASHBOOK.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(search.toLowerCase()) ||
      entry.villageName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || entry.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full space-y-6">
      {/* Control Bar: Search & Filter Chips */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi, desa, atau jenis pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all text-slate-800"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cashbook Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Tanggal &amp; Desa</th>
                <th scope="col" className="px-6 py-4">Uraian Transaksi Kas</th>
                <th scope="col" className="px-6 py-4">Kategori</th>
                <th scope="col" className="px-6 py-4 text-right">Nominal (Rp)</th>
                <th scope="col" className="px-6 py-4 text-center">Audit OCR SSH</th>
                <th scope="col" className="px-6 py-4 text-center">Bukti Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Tidak ditemukan transaksi kas yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isAnomaly = entry.ocrAudit.status === 'FLAG_ANOMALI_MARKUP';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{entry.villageName}</div>
                        <div className="text-xs text-slate-500">{formatDateIndo(entry.date)}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="line-clamp-2 text-xs sm:text-sm font-medium text-slate-800">
                          {entry.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {entry.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(entry.amount)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {isAnomaly ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Deviasi +{entry.ocrAudit.deviationPercentage}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Wajar SSH Jateng</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveReceipt(entry)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-800" />
                          <span>Lihat Nota</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AnimatePresence Receipt Modal */}
      <AnimatePresence>
        {activeReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-base font-bold">Audit Kuitansi &amp; Faktur Nota Belanja</h4>
                    <p className="text-xs text-slate-400">{activeReceipt.villageName} • {formatDateIndo(activeReceipt.date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Photo Preview Container */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9]">
                  <img
                    src={activeReceipt.receiptUrl}
                    alt="Foto Kuitansi Belanja"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                    Merchant: {activeReceipt.ocrAudit.merchant}
                  </div>
                </div>

                {/* Audit Comparison Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Hasil Analisis OCR vs Standar SSH Pemprov Jateng
                    </span>
                    {activeReceipt.ocrAudit.status === 'FLAG_ANOMALI_MARKUP' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Terindikasi Markup
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sesuai Standar Harga
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 font-medium">
                    {activeReceipt.ocrAudit.notes}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Nominal Dicatat:</span>
                      <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                        {formatRupiah(activeReceipt.amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Selisih Standar Satuan:</span>
                      <p className={`font-mono font-bold text-sm mt-0.5 ${
                        activeReceipt.ocrAudit.deviationPercentage > 15 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {activeReceipt.ocrAudit.deviationPercentage > 0 ? '+' : ''}
                        {activeReceipt.ocrAudit.deviationPercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    Data diverifikasi secara otomatis melalui perbandingan harga katalog Standar Satuan Harga (SSH) Dinas Perumahan Rakyat dan Kawasan Permukiman (Disperakim) Pemprov Jawa Tengah.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
