'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface MetricItem {
  value: string;
  targetNumber?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}

export default function HomeKpiCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const metrics: MetricItem[] = [
    {
      value: 'Rp 185 Miliar',
      targetNumber: 185,
      prefix: 'Rp ',
      suffix: ' Miliar',
      label: 'Total Dana Desa',
    },
    {
      value: '889',
      targetNumber: 889,
      label: 'Desa Wisata',
    },
    {
      value: '94,2%',
      targetNumber: 94.2,
      suffix: '%',
      decimals: 1,
      label: 'Tingkat Penyelesaian Laporan',
    },
    {
      value: '< 24 Jam',
      prefix: '< ',
      targetNumber: 24,
      suffix: ' Jam',
      label: 'Rata-rata Respon oleh Dinas',
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
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: idx * 0.08 }}
          className="bg-white rounded-[24px] border border-[#E6ECF5] h-[138px] p-6 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all group"
        >
          <div className="text-2xl sm:text-[28px] font-bold text-[#0D2453] tracking-tight leading-tight">
            <Counter
              isInView={isInView}
              target={item.targetNumber || 0}
              prefix={item.prefix || ''}
              suffix={item.suffix || ''}
              decimals={item.decimals || 0}
              fallback={item.value}
            />
          </div>
          <div className="text-sm text-[#0D2453] mt-2 font-normal leading-snug">
            {item.label}
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
    if (!isInView || target === 0) return;

    let start = 0;
    const duration = 1200;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = target * easeProgress;

      if (frame >= totalFrames) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(val);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [isInView, target]);

  if (!isInView) return <span>{fallback}</span>;

  const formatted =
    decimals > 0
      ? current.toFixed(decimals).replace('.', ',')
      : Math.floor(current).toLocaleString('id-ID');

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
