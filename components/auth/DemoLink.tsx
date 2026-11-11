'use client';

import React from 'react';
import AuthNote from './AuthNote';

interface DemoLinkProps {
  href: string;
  label: string;
}

/**
 * Pengganti kotak masuk email bila pengiriman tidak terjadi (SMTP belum
 * dikonfigurasi atau gagal). Tautan di sini persis tautan yang seharusnya
 * dibuka penerima email.
 */
export default function DemoLink({ href, label }: DemoLinkProps) {
  return (
    <AuthNote tone="warning" title="Email belum terkirim — tautan ditampilkan di sini">
      <p className="mb-2">
        Tautan yang sama sudah kami siapkan. Buka langsung dari tombol di bawah.
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
