'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Landmark, MapPin, CheckCheck, Clock, LucideIcon } from 'lucide-react';

interface MetricItem {
  value: string;
  targetNumber?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  icon: LucideIcon;
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
      icon: Landmark,
    },
    {
      value: '889',
      targetNumber: 889,
      label: 'Desa Wisata',
      icon: MapPin,
    },
    {
      value: '94,2%',
      targetNumber: 94.2,
      suffix: '%',
      decimals: 1,
      label: 'Tingkat Penyelesaian Laporan',
      icon: CheckCheck,
    },
    {
      value: '< 24 Jam',
      prefix: '< ',
      targetNumber: 24,
      suffix: ' Jam',
      label: 'Rata-rata Respon oleh Dinas',
      icon: Clock,
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {metrics.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          className="bg-white rounded-2xl border border-[#EBEBEB] p-4 sm:p-5 shadow-xs flex items-center gap-3.5 sm:gap-4 hover:shadow-sm hover:border-slate-300 transition-all group"
        >
          {/* ponytail: squircle icon box, swap to category-specific tints if requested */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <item.icon className="w-5 h-5 text-[#0D2453]" />
          </div>

          <div className="text-left min-w-0 flex-1">
            <div className="text-xl sm:text-2xl font-extrabold text-[#0D2453] tracking-tight font-sans leading-tight">
              <Counter
                isInView={isInView}
                target={item.targetNumber || 0}
                prefix={item.prefix || ''}
                suffix={item.suffix || ''}
                decimals={item.decimals || 0}
                fallback={item.value}
              />
            </div>
            <div className="text-xs text-[#767676] mt-1 font-medium group-hover:text-slate-900 transition-colors line-clamp-1">
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
