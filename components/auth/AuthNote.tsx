import React from 'react';

type NoteTone = 'info' | 'warning' | 'success';

interface AuthNoteProps {
  tone?: NoteTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const TONES: Record<NoteTone, { bg: string; title: string; body: string }> = {
  info: { bg: 'bg-[#EDF3FC]', title: 'text-[#0D2453]', body: 'text-[#0D2453]' },
  warning: { bg: 'bg-[#FFF4DB]', title: 'text-[#875B12]', body: 'text-[#875B12]' },
  success: { bg: 'bg-[#E5F4ED]', title: 'text-[#216B55]', body: 'text-[#216B55]' },
};

/** Kotak catatan radius 10 padding 14 — info / peringatan / sukses. */
export default function AuthNote({ tone = 'info', title, children, className = '' }: AuthNoteProps) {
  const t = TONES[tone];

  return (
    <div className={`${t.bg} rounded-[10px] p-[14px] flex flex-col gap-1 ${className}`}>
      {title && (
        <p className={`text-[12px] font-semibold leading-[1.5] ${t.title}`}>{title}</p>
      )}
      <div className={`text-[12px] leading-[1.5] ${t.body}`}>{children}</div>
    </div>
  );
}
