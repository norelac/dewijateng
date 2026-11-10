'use client';

import React from 'react';
import AuthNote from './AuthNote';

interface DemoLinkProps {
  href: string;
  label: string;
}

/**
 * Pengganti kotak masuk email saat SMTP belum dikonfigurasi (mode demo).
 * Tautan di sini persis tautan yang seharusnya dibuka penerima email.
 */
export default function DemoLink({ href, label }: DemoLinkProps) {
  return (
    <AuthNote tone="warning" title="Mode demo — email tidak benar-benar dikirim">
      <p className="mb-2">
        SMTP belum dikonfigurasi, jadi tautan ditampilkan langsung di sini.
      </p>
      <a
        href={href}
        className="inline-flex items-center justify-center h-[36px] px-4 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold"
      >
        {label}
      </a>
    </AuthNote>
  );
}
