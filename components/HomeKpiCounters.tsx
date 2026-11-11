'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Landmark,
  FileText,
  MapPin,
  CheckCheck,
  LucideIcon,
} from 'lucide-react';

interface MetricItem {
  value: string;
  targetNumber: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  icon: LucideIcon;
}

export default function HomeKpiCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const [dynamicMetrics, setDynamicMetrics] = useState<{
    villages?: number;
    reports?: number;
    resolutionRate?: number;
    allocatedMiliar?: number;
  }>({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/disbudparekraf/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.success || !json.data?.macro_metrics) return;
        const m = json.data.macro_metrics;
        setDynamicMetrics({
          villages: m.total_villages ?? undefined,
          reports: m.total_complaints ?? undefined,
          resolutionRate: m.resolution_rate ?? undefined,
          allocatedMiliar:
            m.total_allocated_sum > 0
              ? Number((Number(m.total_allocated_sum) / 1_000_000_000).toFixed(1))
              : undefined,
        });
      })
      .catch(() => {
        // Fallback ke angka acuan RPJMD Jateng
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalDesa = dynamicMetrics.villages ?? 868;
  const totalLaporan = dynamicMetrics.reports ?? 12;
  const rateSelesai = dynamicMetrics.resolutionRate ?? 100;
  const danaMiliar = dynamicMetrics.allocatedMiliar ?? 87.5;

  const metrics: MetricItem[] = [
    {
      value: `Rp ${danaMiliar.toLocaleString('id-ID')} Miliar`,
      targetNumber: danaMiliar,
      prefix: 'Rp ',
      suffix: ' Miliar',
      decimals: danaMiliar % 1 === 0 ? 0 : 1,
      label: 'Alokasi Bantuan Sarpras',
      icon: Landmark,
    },
    {
      value: totalLaporan.toLocaleString('id-ID'),
      targetNumber: totalLaporan,
      label: 'Aduan Warga Diproses',
      icon: FileText,
    },
    {
      value: totalDesa.toLocaleString('id-ID'),
      targetNumber: totalDesa,
      label: 'Desa Wisata Terdata',
      icon: MapPin,
    },
    {
      value: `${rateSelesai.toLocaleString('id-ID')}%`,
      targetNumber: rateSelesai,
      suffix: '%',
      decimals: rateSelesai % 1 === 0 ? 0 : 1,
      label: 'Tingkat Penyelesaian Laporan',
      icon: CheckCheck,
    },
  ];

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {metrics.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white rounded-[20px] border border-[#E6ECF5] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all group flex items-center gap-4 cursor-default"
        >
          {/* Unified Squircle Icon Badge in Navy / Soft Blue */}
          <div className="w-12 h-12 rounded-[16px] bg-[#EBF2FF] text-[#0D2453] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
            <item.icon className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Rolling Count-up Value & Slate Label */}
          <div className="text-left min-w-0 flex-1">
            <div className="text-2xl sm:text-[26px] font-extrabold text-[#0D2453] tracking-tight font-sans leading-tight">
              <Counter
                isInView={isInView}
                target={item.targetNumber}
                prefix={item.prefix || ''}
                suffix={item.suffix || ''}
                decimals={item.decimals || 0}
                fallback={item.value}
              />
            </div>
            <div className="text-xs text-[#64748B] mt-0.5 font-medium leading-snug group-hover:text-slate-900 transition-colors truncate">
              {item.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Counter({
  isInView,
  target,
  prefix,
  suffix,
  decimals = 0,
  fallback,
}: {
  isInView: boolean;
  target: number;
  prefix: string;
  suffix: string;
  decimals?: number;
  fallback: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Naik sekali ke target lalu berhenti; tidak ada reset/fade berulang.
    if (!isInView || target === 0) return;

    const duration = 2800;
    const frameRate = 1000 / 60;
    const totalFrames = Math.max(1, Math.round(duration / frameRate));
    let frame = 0;
    let cancelled = false;

    const frameTimer = setInterval(() => {
      if (cancelled) return;
      frame++;
      const progress = frame / totalFrames;
      // Smooth cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (frame >= totalFrames) {
        setCurrent(target);
        clearInterval(frameTimer);
      } else {
        setCurrent(target * easeProgress);
      }
    }, frameRate);

    return () => {
      cancelled = true;
      clearInterval(frameTimer);
    };
  }, [isInView, target]);

  if (!isInView) return <span>{fallback}</span>;

  const formatted =
    decimals > 0
      ? current.toFixed(decimals).replace('.', ',')
      : Math.floor(current).toLocaleString('id-ID');

  return (
    <span className="inline-block">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
