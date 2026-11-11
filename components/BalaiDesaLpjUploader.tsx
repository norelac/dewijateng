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
  ArrowRight,
  Lock,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { processLpjUploadAction } from '@/app/actions/lpjActions';
import { getSessionAction } from '@/app/actions/authActions';

interface VillageItem {
  id: string;
  name: string;
  regency: string;
}

export default function BalaiDesaLpjUploader() {
  const [session, setSession] = useState<{
    id: string;
    username: string;
    fullName: string;
    role: string;
    villageId: string | null;
  } | null>(null);
  const [currentVillageName, setCurrentVillageName] = useState('');
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
    async function init() {
      try {
        const sess = await getSessionAction();
        setSession(sess);

        const res = await fetch('/api/villages?limit=1000');
        const json = await res.json();
        const villageList: VillageItem[] = Array.isArray(json.data)
          ? json.data
          : json.data?.villages || [];
        setVillages(villageList);

        // Jika login sebagai akun desa, kunci otomatis ke desa yang bersangkutan
        if (sess?.role === 'desa' && sess.villageId) {
          setSelectedVillageId(sess.villageId);
          const matched = villageList.find((v) => v.id === sess.villageId);
          if (matched) {
            setCurrentVillageName(`${matched.name} (${matched.regency})`);
          } else {
            setCurrentVillageName(sess.fullName || 'Desa Wisata Anda');
          }
        } else if (villageList.length > 0) {
          setSelectedVillageId(villageList[0].id);
          setCurrentVillageName(`${villageList[0].name} (${villageList[0].regency})`);
        }
      } catch (err) {
        console.error('Gagal mengambil data desa:', err);
      }
    }
    init();
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
      if (selected.size > 25 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: 'Ukuran berkas PDF melebihi batas 25 MB.',
        });
        e.target.value = '';
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

      const res = await processLpjUploadAction(formData);

      if (!res.success || !res.data) {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal mengunggah dokumen LPJ.',
        });
        setUploading(false);
        return;
      }

      setStatusMessage({
        type: 'success',
        text: `Dokumen LPJ resmi berhasil diunggah dan terverifikasi di sistem! Pos belanja modal telah dicocokkan otomatis dengan Katalog Standar Satuan Harga (SSH) Pemprov Jateng.`,
        details: res.data,
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
          {/* Desa Wisata Penerima Hibah */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Desa Wisata Penerima Hibah</span>
              {session?.role === 'desa' && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 normal-case tracking-normal">
                  <Lock className="w-2.5 h-2.5" /> Terkunci Otomatis
                </span>
              )}
            </label>
            {session?.role === 'desa' ? (
              <div
                className="w-full px-3.5 py-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between cursor-not-allowed select-none"
                title="Desa terkunci otomatis sesuai akun pengelola yang sedang login"
              >
                <span className="truncate">{currentVillageName || 'Memuat identitas desa...'}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </div>
            ) : (
              <select
                value={selectedVillageId}
                onChange={(e) => {
                  setSelectedVillageId(e.target.value);
                  const found = villages.find((v) => v.id === e.target.value);
                  if (found) setCurrentVillageName(`${found.name} (${found.regency})`);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D2453]/20"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.regency})
                  </option>
                ))}
              </select>
            )}
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
            className="border-2 border-dashed border-slate-300 hover:border-[#0D2453] rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-colors"
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
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs shadow-xs hover:shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Memproses Ekstraksi...' : 'Unggah & Ekstrak Pos Belanja LPJ'}</span>
          </button>
        </div>
      </form>

      {/* Extracted Expenses Audit Breakdown Table */}
      {statusMessage?.type === 'success' && statusMessage.details?.expenses && (
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Hasil Ekstraksi Pos Belanja Modal ({statusMessage.details.expenses.length} Pos)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pagu: {formatRupiah(statusMessage.details.total_allocated)} • Realisasi:{' '}
                {formatRupiah(statusMessage.details.total_realized)} • Sisa Kas:{' '}
                {formatRupiah(statusMessage.details.remaining_balance)}
              </p>
            </div>
            {statusMessage.details.lpj_document_url && (
              <a
                href={statusMessage.details.lpj_document_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0D2453] hover:bg-slate-50 shrink-0 self-start sm:self-auto shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Salinan PDF LPJ</span>
              </a>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-3">Nama Kegiatan / Bahan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3 text-right">Harga Klaim</th>
                  <th className="px-4 py-3 text-right">Total Realisasi</th>
                  <th className="px-4 py-3 text-center">Status Audit SSH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {statusMessage.details.expenses.map((exp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {exp.activity_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-mono">
                      {exp.volume} {exp.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatRupiah(exp.claimed_unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(exp.amount_realized)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exp.ai_anomaly_flag ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200"
                          title={exp.anomaly_note}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Anomali SSH</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200"
                          title={exp.anomaly_note}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sesuai Batas SSH</span>
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
    </section>
  );
}
