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
      value: '9.607',
      targetNumber: 9607,
      label: 'Total Laporan',
      icon: FileText,
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
  holdDuration = 6000,
}: {
  isInView: boolean;
  target: number;
  prefix: string;
  suffix: string;
  decimals?: number;
  fallback: string;
  holdDuration?: number;
}) {
  const [current, setCurrent] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // ponytail: repeating rolling count-up loop with gentle fade reset. Upgrade to Framer Motion animate() if spring dampening needed.
    if (!isInView || target === 0) return;

    let timer: NodeJS.Timeout;
    let frameTimer: NodeJS.Timeout;
    let isActive = true;

    const runCount = () => {
      setIsFading(false);
      const duration = 2800;
      const frameRate = 1000 / 60;
      const totalFrames = Math.round(duration / frameRate);
      let frame = 0;

      frameTimer = setInterval(() => {
        if (!isActive) return;
        frame++;
        const progress = frame / totalFrames;
        // Smooth cubic ease-out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const val = target * easeProgress;

        if (frame >= totalFrames) {
          setCurrent(target);
          clearInterval(frameTimer);
          timer = setTimeout(() => {
            if (!isActive) return;
            // Soft fade-out before resetting number
            setIsFading(true);
            timer = setTimeout(() => {
              if (!isActive) return;
              setCurrent(0);
              timer = setTimeout(() => {
                if (!isActive) return;
                runCount();
              }, 200);
            }, 350);
          }, holdDuration);
        } else {
          setCurrent(val);
        }
      }, frameRate);
    };

    runCount();

    return () => {
      isActive = false;
      clearInterval(frameTimer);
      clearTimeout(timer);
    };
  }, [isInView, target, holdDuration]);

  if (!isInView) return <span>{fallback}</span>;

  const formatted =
    decimals > 0
      ? current.toFixed(decimals).replace('.', ',')
      : Math.floor(current).toLocaleString('id-ID');

  return (
    <span
      className={`inline-block transition-opacity duration-300 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
