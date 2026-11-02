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
  const isInView = useInView(ref, { once: true, margin: '-50px' });

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
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          className="bg-white rounded-2xl border border-[#EBEBEB] p-6 shadow-xs flex flex-col justify-center items-center text-center h-32 hover:shadow-sm hover:border-slate-300 transition-all group"
        >
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0D2453] tracking-tight font-sans">
            <Counter
              isInView={isInView}
              target={item.targetNumber || 0}
              prefix={item.prefix || ''}
              suffix={item.suffix || ''}
              decimals={item.decimals || 0}
              fallback={item.value}
            />
          </div>
          <div className="text-xs text-[#767676] mt-1 font-medium group-hover:text-slate-900 transition-colors">
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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || target === 0) return;

    let start = 0;
    const duration = 1200; // ms
    const stepTime = 20; // 50 fps
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target]);

  if (!isInView) {
    return <span>{prefix}0{suffix}</span>;
  }

  const formattedNumber =
    decimals > 0
      ? count.toFixed(decimals).replace('.', ',')
      : Math.floor(count).toLocaleString('id-ID');

  return (
    <span>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
