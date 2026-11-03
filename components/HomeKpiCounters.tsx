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
  badgeBg: string;
  badgeText: string;
  valueColor: string;
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
      icon: Landmark,
      badgeBg: 'bg-[#EBF2FF]',
      badgeText: 'text-[#1D4ED8]',
      valueColor: 'text-[#0D2453]',
    },
    {
      value: '9607',
      targetNumber: 9607,
      label: 'Total Laporan',
      icon: FileText,
      badgeBg: 'bg-[#FEECEC]',
      badgeText: 'text-[#B91C1C]',
      valueColor: 'text-[#991B1B]',
    },
    {
      value: '889',
      targetNumber: 889,
      label: 'Desa Wisata',
      icon: MapPin,
      badgeBg: 'bg-[#ECFDF5]',
      badgeText: 'text-[#047857]',
      valueColor: 'text-[#065F46]',
    },
    {
      value: '94,2%',
      targetNumber: 94.2,
      suffix: '%',
      decimals: 1,
      label: 'Tingkat Penyelesaian Laporan',
      icon: CheckCheck,
      badgeBg: 'bg-[#EEF2FF]',
      badgeText: 'text-[#4F46E5]',
      valueColor: 'text-[#3730A3]',
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
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white rounded-[20px] border border-[#E6ECF5] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all group flex items-center gap-4 cursor-default"
        >
          {/* Squircle Icon Badge matching Image 3 */}
          <div
            className={`w-12 h-12 rounded-[16px] ${item.badgeBg} ${item.badgeText} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs`}
          >
            <item.icon className="w-5 h-5 stroke-[2.2]" />
          </div>

          {/* Right Text Column: Big bold number on top, label underneath */}
          <div className="text-left min-w-0 flex-1">
            <div
              className={`text-2xl sm:text-[26px] font-extrabold ${item.valueColor} tracking-tight font-sans leading-tight`}
            >
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
