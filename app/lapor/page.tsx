'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Camera,
  Share2,
  Calendar,
  Building2,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

interface ReportDetail {
  id: string;
  report_code: string;
  village: {
    id: string;
    name: string;
    regency: string;
    district: string;
    pokdarwis_name: string;
    contact_phone: string;
    trust_score: number;
  };
  category: string;
  title: string;
  description: string;
  photo_before_url: string;
  latitude: number;
  longitude: number;
  is_anonymous: boolean;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  resolution: {
    action_summary: string;
    photo_after_url: string;
    officer_name: string;
    exif_timestamp_verified: boolean;
    exif_photo_date: string | null;
    resolved_at: string;
  } | null;
}

function TrackReportContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState(initialCode);
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [copied, setCopied] = useState(false);

  // Fetch report by code
  const fetchReport = async (codeToFetch: string) => {
    if (!codeToFetch.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(codeToFetch.trim())}`);
      const json = await res.json();

      if (json.success && json.data) {
        setReport(json.data);
        setCurrentCode(codeToFetch.trim().toUpperCase());
      } else {
        setReport(null);
        setErrorMsg(json.error || `Laporan dengan kode "${codeToFetch}" tidak ditemukan.`);
      }
    } catch (err: any) {
      setReport(null);
      setErrorMsg('Gagal menghubungkan ke server. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchReport(initialCode);
    }
  }, [initialCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      fetchReport(inputCode);
    }
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Pantau penanganan aduan fasilitas ${report?.report_code} di DEWI JATENG: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const sampleCodes = ['LP-JTG-2026-0012', 'LP-JTG-2026-0001', 'LP-JTG-2026-0002'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header Page */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
          <span>Closed-Loop Civic Tracking &amp; Proof-of-Fix</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0D2453] tracking-tight">
          Telusuri Aduan Publik
        </h1>
        <p className="text-xs sm:text-sm text-[#767676]">
          Setiap aduan warga wajib disertai dokumentasi fisik perbaikan sebelum tiket dinyatakan tuntas.
          Masukkan Kode Pelaporan Anda di bawah ini.
        </p>
      </div>

      {/* 2. Search Box Card */}
      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-3xl border border-[#EBEBEB] shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Contoh: LP-JTG-2026-0012"
              className="w-full pl-11 pr-4 py-3 bg-[#F5F5F5] border-0 rounded-2xl text-xs sm:text-sm text-[#0D2453] font-mono font-bold tracking-wider placeholder:font-normal placeholder:tracking-normal focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputCode.trim()}
            className="py-3 px-6 rounded-2xl bg-[#0D2453] hover:bg-[#132d66] text-white text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Mencari...</span>
            ) : (
              <>
                <span>Lacak Aduan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
          <span className="font-medium text-slate-400">Contoh kode tiket:</span>
          {sampleCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setInputCode(code);
                fetchReport(code);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-700 font-mono font-semibold transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Error Message */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aduan Tidak Ditemukan</p>
            <p className="text-red-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 4. Report Details View */}
      {report && (
        <div className="space-y-6">
          {/* Main Ticket Summary Card */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#0D2453]">
                    {report.report_code}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      report.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : report.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {report.status === 'RESOLVED'
                      ? 'SELESAI (BERBUKTI)'
                      : report.status === 'IN_PROGRESS'
                      ? 'SEDANG DIKERJAKAN'
                      : 'LAPORAN DITERIMA'}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-800 mt-2">
                  {report.title}
                </h2>

                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{report.village.name}</strong>, {report.village.regency}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Dilaporkan {formatDateIndo(report.created_at)}
                  </span>
                </div>
              </div>

              {/* Share & Quick Actions */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors shrink-0"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bagikan ke WhatsApp</span>
              </button>
            </div>

            {/* 3-Stage Progress Timeline */}
            <div className="py-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Linimasa Penanganan Terverifikasi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step 1: Diterima */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    report.status === 'SUBMITTED' || report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>1. Laporan Masuk</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tercatat resmi di radar monitoring &amp; geo-tagging Jateng.
                  </p>
                </div>

                {/* Step 2: Dikerjakan */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Clock
                      className={`w-4 h-4 ${
                        report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>2. Ditindaklanjuti</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Pokdarwis desa setempat mengalokasikan tenaga &amp; bahan fisik.
                  </p>
                </div>

                {/* Step 3: Selesai */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    report.status === 'RESOLVED'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldCheck
                      className={`w-4 h-4 ${
                        report.status === 'RESOLVED' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>3. Selesai (Proof-of-Fix)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Dokumentasi foto perbaikan fisik terverifikasi kamera.
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h5 className="text-xs font-bold text-[#0D2453] mb-1">Deskripsi Aduan Warga</h5>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            </div>
          </div>

          {/* Proof-of-Fix Verification Section */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Bukti Nyata Fisik (Proof-of-Fix)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0D2453]">
                  {report.status === 'RESOLVED'
                    ? 'Komparasi Sebelum & Sesudah Perbaikan'
                    : 'Dokumentasi Kondisi Lapangan'}
                </h3>
              </div>
            </div>

            {/* Interactive Before-After Slider if RESOLVED */}
            {report.status === 'RESOLVED' && report.resolution ? (
              <div className="space-y-6">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[480px] rounded-3xl overflow-hidden select-none border border-slate-200 shadow-md bg-slate-950">
                  {/* After Image (Background) */}
                  <img
                    src={report.resolution.photo_after_url}
                    alt="Foto Setelah Perbaikan"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SETELAH (FIXED)</span>
                  </div>

                  {/* Before Image (Foreground Clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={report.photo_before_url}
                      alt="Foto Sebelum Perbaikan"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: '100%', minWidth: '100%' }}
                    />
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SEBELUM (RUSAK)</span>
                    </div>
                  </div>

                  {/* Slider Control Line & Handle */}
                  <div
                    className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-[#0D2453] shadow-xl border-2 border-[#0D2453] flex items-center justify-center font-bold text-xs select-none">
                      ↔
                    </div>
                  </div>

                  {/* Range Input for touch/mouse */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  />
                </div>
                <p className="text-center text-xs text-slate-500 font-medium">
                  ← Geser garis tengah untuk melihat perbandingan fisik sebelum dan sesudah perbaikan →
                </p>

                {/* Resolution Summary Card */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Rincian Tindakan Penanganan Pokdarwis
                      </span>
                    </div>
                    {report.resolution.exif_timestamp_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-bold">
                        ● Terverifikasi EXIF Kamera (Foto Diambil Pasca Laporan)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-medium">
                        Verifikasi Manual
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {report.resolution.action_summary}
                  </p>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900/80 flex-wrap gap-2">
                    <span>
                      Petugas Pelaksana: <strong>{report.resolution.officer_name}</strong>
                    </span>
                    <span>
                      Diselesaikan: {formatDateIndo(report.resolution.resolved_at)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* If not resolved yet: show single photo before */
              <div className="space-y-4">
                <div className="relative w-full aspect-[16/9] max-h-[400px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={report.photo_before_url}
                    alt="Foto Kerusakan Awal"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>DOKUMENTASI AWAL WARGA</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Menunggu Bukti Fisik Perbaikan</p>
                    <p className="text-amber-800 mt-0.5">
                      Tiket aduan ini belum dapat ditutup sebelum pengurus Pokdarwis desa setempat mengunggah foto fisik sarana yang telah selesai diperbaiki beserta data verifikasi waktu kamera.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-sm text-slate-500 font-semibold">Memuat data pelacakan aduan...</p>
        </div>
      }
    >
      <TrackReportContent />
    </Suspense>
  );
}
