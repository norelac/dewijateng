'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TrustStatus = 'GREEN' | 'YELLOW' | 'RED';

interface RegencyStatus {
  regency: string;
  total_villages: number;
  average_score: number;
  status: TrustStatus;
}

interface GrantPriority {
  village_id: string;
  name: string;
  regency: string;
  trust_score: number;
  recommendation: string;
}

interface OverviewPayload {
  macro_metrics?: { average_trust_score?: number };
  regency_status?: RegencyStatus[];
  grant_priorities?: GrantPriority[];
}

/** Token warna semaphore sesuai Issue-FE-08. */
const TONE: Record<TrustStatus, { label: string; dot: string; bg: string; text: string }> = {
  GREEN: { label: 'Patuh', dot: '#10B981', bg: '#ECFDF5', text: '#047857' },
  YELLOW: { label: 'Perlu pemantauan', dot: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  RED: { label: 'Kritis', dot: '#F43F5E', bg: '#FFF1F2', text: '#BE123C' },
};

function statusOf(score: number): TrustStatus {
  if (score < 60) return 'RED';
  if (score < 80) return 'YELLOW';
  return 'GREEN';
}

const RECOMMENDATION_LABEL: Record<string, string> = {
  PRIORITAS_UTAMA_HIBAH_2027: 'Prioritas utama APBD 2027',
  DIPERTIMBANGKAN_HIBAH_2027: 'Dipertimbangkan APBD 2027',
  EVALUASI_KINERJA: 'Perlu evaluasi kinerja',
};

const REGENCY_LIMIT = 8;

/**
 * Peta kendali kepatuhan: rerata Trust Score Jateng, sebaran semaphore per
 * kabupaten/kota, dan usulan prioritas hibah. Data diambil dari endpoint
 * agregasi yang sudah ada (`GET /api/disbudparekraf/overview`), tanpa query baru.
 */
export default function TrustScoreSection() {
  const [data, setData] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/disbudparekraf/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) setData(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const avg = data?.macro_metrics?.average_trust_score;
  const regencies = useMemo(() => data?.regency_status ?? [], [data]);
  const priorities = useMemo(() => (data?.grant_priorities ?? []).slice(0, 5), [data]);

  const counts = useMemo(() => {
    const acc: Record<TrustStatus, number> = { GREEN: 0, YELLOW: 0, RED: 0 };
    regencies.forEach((r) => {
      acc[r.status] += 1;
    });
    return acc;
  }, [regencies]);

  const loading = !data;
  const avgTone = avg === undefined ? null : TONE[statusOf(avg)];
  const shown = regencies.slice(0, REGENCY_LIMIT);

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[#0D2453] text-[22px] font-semibold leading-[1.5]">
          Peta kendali kepatuhan
        </h2>
        <p className="text-[#64748B] text-[12px] leading-[1.5]">
          Trust Score = 50% kepatuhan LPJ + 50% penyelesaian aduan warga.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Rerata + sebaran wilayah */}
        <div className="lg:col-span-7 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-[#64748B]">Rerata Trust Score Jateng</span>
              <span className="text-[36px] font-semibold leading-[1.1] tracking-[-1px] text-[#0D2453] font-mono">
                {loading ? '—' : avg?.toFixed(1).replace('.', ',')}
              </span>
            </div>
            {avgTone && (
              <span
                className="inline-flex items-center gap-2 px-3 h-[30px] rounded-full text-[12px] font-semibold"
                style={{ backgroundColor: avgTone.bg, color: avgTone.text }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: avgTone.dot }} />
                {avgTone.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap text-[12px] font-medium">
            {(['GREEN', 'YELLOW', 'RED'] as TrustStatus[]).map((status) => (
              <span key={status} className="inline-flex items-center gap-2" style={{ color: TONE[status].text }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TONE[status].dot }} />
                {TONE[status].label} · {loading ? '—' : counts[status]}
              </span>
            ))}
            <span className="text-[#64748B] font-normal">
              {regencies.length} kabupaten/kota
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#EEF2F8]">
            {loading && <span className="text-[12px] text-[#64748B] py-3">Memuat data kepatuhan…</span>}
            {!loading && shown.length === 0 && (
              <span className="text-[12px] text-[#64748B] py-3">Belum ada data wilayah.</span>
            )}
            {shown.map((r) => {
              const tone = TONE[r.status];
              return (
                <div key={r.regency} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tone.dot }} />
                    <span className="text-[13px] font-medium text-[#0D2453] truncate">{r.regency}</span>
                    <span className="text-[11px] text-[#64748B] shrink-0">{r.total_villages} desa</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#0D2453] font-mono shrink-0">
                    {r.average_score.toFixed(1).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>

          {!loading && regencies.length > shown.length && (
            <span className="text-[11px] text-[#94A3B8]">
              Menampilkan {shown.length} dari {regencies.length} kabupaten/kota (skor tertinggi).
            </span>
          )}
        </div>

        {/* Usulan prioritas hibah */}
        <div className="lg:col-span-5 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Usulan prioritas hibah 2027
            </h3>
            <p className="text-[#64748B] text-[12px] leading-[1.5]">
              Desa dengan skor tertinggi dan LPJ tertib.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {loading && <span className="text-[12px] text-[#64748B]">Memuat usulan…</span>}
            {!loading && priorities.length === 0 && (
              <span className="text-[12px] text-[#64748B]">Belum ada desa yang memenuhi kriteria.</span>
            )}
            {priorities.map((v, index) => (
              <div key={v.village_id} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#0D2453] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[13px] font-semibold text-[#0D2453] truncate">{v.name}</span>
                  <span className="text-[11px] text-[#64748B] truncate">{v.regency}</span>
                  <span className="text-[11px] text-[#047857] font-medium">
                    Skor {v.trust_score.toFixed(2)} · {RECOMMENDATION_LABEL[v.recommendation] ?? 'Perlu evaluasi'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/transparansi"
            className="mt-auto h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold self-start"
          >
            Cek LPJ di transparansi
          </Link>
        </div>
      </div>
    </section>
  );
}
