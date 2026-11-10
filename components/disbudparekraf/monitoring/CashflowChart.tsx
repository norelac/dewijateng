import React from 'react';
import type { CashflowBucket } from '@/lib/finance';

const CHART_HEIGHT = 168; // px, selaras tinggi area batang pada desain

/** Nilai rupiah -> angka juta tanpa desimal ("84"). */
function juta(value: number): string {
  return (value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

/** Skala sumbu Y dibulatkan ke kelipatan 50 juta agar batang selalu proporsional. */
function scaleMaxOf(buckets: CashflowBucket[]): number {
  const max = Math.max(0, ...buckets.map((b) => Math.max(b.pemasukan, b.pengeluaran)));
  const inJuta = max / 1_000_000;
  return Math.max(50, Math.ceil(inJuta / 50) * 50);
}

/**
 * Grafik arus kas mingguan (batang CSS, tanpa pustaka grafik).
 * Dipakai di dashboard (Figma 422:1026) dan ringkasan desa (Figma 422:665).
 */
export default function CashflowChart({
  title,
  subtitle,
  buckets,
  className,
}: {
  title: string;
  subtitle: string;
  buckets: CashflowBucket[];
  className?: string;
}) {
  const scaleMax = scaleMaxOf(buckets);
  const barHeight = (value: number) =>
    Math.round((value / 1_000_000 / scaleMax) * CHART_HEIGHT);

  return (
    <div
      className={`bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">{title}</h3>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2453]" />
            <span className="text-[12px] text-[#0D2453]">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D2453]/45" />
            <span className="text-[12px] text-[#0D2453]">Pengeluaran</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <div className="flex flex-col justify-between text-[11px] text-[#64748B] shrink-0 h-[168px]">
          <span>{scaleMax}</span>
          <span>{scaleMax / 2}</span>
          <span>0</span>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="relative h-[168px] flex items-end justify-between gap-4 border-b border-[#E6ECF5]">
            {[scaleMax, scaleMax / 2].map((line) => (
              <span
                key={line}
                className="absolute left-0 right-0 border-t border-dashed border-[#F1F5F9]"
                style={{ bottom: `${(line / scaleMax) * 100}%` }}
              />
            ))}

            {buckets.map((bucket) => (
              <div
                key={bucket.label}
                className="relative flex-1 flex items-end justify-center gap-1.5 h-full"
              >
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] text-[#64748B] mb-1">
                    {juta(bucket.pemasukan)}
                  </span>
                  <div
                    className="w-[26px] rounded-t-[6px] bg-[#0D2453]"
                    style={{ height: `${barHeight(bucket.pemasukan)}px` }}
                  />
                </div>
                <div className="flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] text-[#64748B] mb-1">
                    {juta(bucket.pengeluaran)}
                  </span>
                  <div
                    className="w-[26px] rounded-t-[6px] bg-[#0D2453]/45"
                    style={{ height: `${barHeight(bucket.pengeluaran)}px` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4 mt-2">
            {buckets.map((bucket) => (
              <span key={bucket.label} className="flex-1 text-center text-[11px] text-[#64748B]">
                {bucket.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
