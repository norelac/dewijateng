'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface VillageItem {
  id: string;
  name: string;
  regency: string;
}

export default function BalaiDesaLpjUploader() {
  const [villages, setVillages] = useState<VillageItem[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [fundingSource, setFundingSource] = useState('Bantuan Keuangan Khusus Sarpras Pemprov Jateng 2026');
  const [totalAllocated, setTotalAllocated] = useState('100000000');
  const [fiscalYear, setFiscalYear] = useState('2026');
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await fetch('/api/villages');
        const json = await res.json();
        if (json.success && json.data?.villages) {
          setVillages(json.data.villages);
          if (json.data.villages.length > 0) {
            setSelectedVillageId(json.data.villages[0].id);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil daftar desa:', err);
      }
    }
    loadVillages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setStatusMessage({
          type: 'error',
          text: 'Berkas wajib berformat PDF dokumen resmi LPJ Balai Desa.',
        });
        return;
      }
      setFile(selected);
      setStatusMessage(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillageId) {
      setStatusMessage({ type: 'error', text: 'Pilih desa wisata terlebih dahulu.' });
      return;
    }

    if (!file) {
      setStatusMessage({ type: 'error', text: 'Silakan pilih berkas PDF LPJ resmi untuk diunggah.' });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('village_id', selectedVillageId);
      formData.append('fiscal_year', fiscalYear);
      formData.append('funding_source', fundingSource);
      formData.append('total_allocated', totalAllocated);
      formData.append('file', file);

      const res = await fetch('/api/balai-desa/lpj/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Gagal mengunggah dokumen LPJ.',
        });
        setUploading(false);
        return;
      }

      setStatusMessage({
        type: 'success',
        text: `Dokumen LPJ resmi berhasil diunggah dan terverifikasi di sistem! Pos belanja modal telah dicocokkan otomatis dengan Katalog Standar Satuan Harga (SSH) Pemprov Jateng.`,
        details: json.data,
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error uploading LPJ:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi gangguan jaringan saat mengunggah dokumen.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D2453] mb-1">
            <Building2 className="w-4 h-4 text-[#0D2453]" />
            <span>Alur Resmi Balai Desa</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Unggah Salinan LPJ Bantuan Keuangan Sarpras
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Balai Desa mengunggah salinan resmi PDF Laporan Pertanggungjawaban (LPJ). Sistem otomatis mengekstrak pos belanja dan memvalidasi batas deviasi harga terhadap Standar Satuan Harga (SSH) Pemprov Jateng.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#0D2453] text-xs font-bold border border-blue-100 shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Audit SSH Otomatis</span>
        </span>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block">
                {statusMessage.type === 'success' ? 'Berhasil Diunggah' : 'Gagal Mengunggah'}
              </span>
              <p className="leading-relaxed">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pilih Desa Wisata */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Desa Wisata Penerima Hibah
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.regency})
                </option>
              ))}
            </select>
          </div>

          {/* Sumber Pendanaan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Sumber Alokasi Anggaran
            </label>
            <input
              type="text"
              value={fundingSource}
              onChange={(e) => setFundingSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20 font-medium"
            />
          </div>

          {/* Pagu Bantuan (Nominal) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Total Pagu Bantuan (Rp)
            </label>
            <input
              type="number"
              value={totalAllocated}
              onChange={(e) => setTotalAllocated(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20 font-mono font-bold"
            />
          </div>
        </div>

        {/* Upload Box PDF */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Dokumen Salinan Asli LPJ (Format .PDF)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#0D2453] rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0D2453] flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6" />
            </div>

            {file ? (
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {file.name}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Siap diproses
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Pilih berkas dokumen PDF resmi LPJ
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Maksimal 25MB • Dokumen resmi bertanda tangan Kepala Desa &amp; BPD
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-slate-400">
            Salinan LPJ yang diunggah akan otomatis dipublikasikan secara terbuka pada portal Transparansi Dana.
          </p>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Memproses Ekstraksi...' : 'Unggah & Ekstrak Pos Belanja LPJ'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
