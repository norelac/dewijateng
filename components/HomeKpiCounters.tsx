'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  label: string;
  icon: LucideIcon;
  delayOffset: number;
}

export default function HomeKpiCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const metrics: MetricItem[] = [
    {
      value: 'Rp 185 Miliar',
      label: 'Total Dana Desa',
      icon: Landmark,
      delayOffset: 100,
    },
    {
      value: '9.607',
      label: 'Total Laporan',
      icon: FileText,
      delayOffset: 250,
    },
    {
      value: '889',
      label: 'Desa Wisata',
      icon: MapPin,
      delayOffset: 400,
    },
    {
      value: '94,2%',
      label: 'Tingkat Penyelesaian Laporan',
      icon: CheckCheck,
      delayOffset: 550,
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

          {/* Typewriter Value & Slate Label */}
          <div className="text-left min-w-0 flex-1">
            <div className="text-2xl sm:text-[26px] font-extrabold text-[#0D2453] tracking-tight font-sans leading-tight min-h-[32px] sm:min-h-[36px] flex items-center">
              <TypewriterNumber
                text={item.value}
                isInView={isInView}
                startDelay={item.delayOffset}
                speed={50}
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4, delay: item.delayOffset / 1000 + 0.3 }}
              className="text-xs text-[#64748B] mt-0.5 font-medium leading-snug group-hover:text-slate-900 transition-colors truncate"
            >
              {item.label}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TypewriterNumber({
  text,
  isInView,
  startDelay = 100,
  speed = 50,
}: {
  text: string;
  isInView: boolean;
  startDelay?: number;
  speed?: number;
}) {
  const [length, setLength] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // ponytail: interval typewriter. Upgrade to requestAnimationFrame if variable glyph timing needed.
    if (!isInView) return;

    let intervalId: NodeJS.Timeout;
    const timeoutId = setTimeout(() => {
      setIsTyping(true);
      let current = 0;
      intervalId = setInterval(() => {
        current++;
        setLength(current);
        if (current >= text.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isInView, text, startDelay, speed]);

  if (!isInView) return <span className="opacity-0">{text}</span>;

  return (
    <span className="inline-flex items-baseline select-none">
      <span>{text.slice(0, length)}</span>
      {isTyping && (
        <span className="inline-block w-[2px] h-[0.85em] ml-0.5 bg-[#0D2453] align-baseline animate-pulse" />
      )}
    </span>
  );
}
