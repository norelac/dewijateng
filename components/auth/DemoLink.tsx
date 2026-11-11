'use client';

import React from 'react';
import AuthNote from './AuthNote';

interface DemoLinkProps {
  href: string;
  label: string;
}

/**
 * Tautan aksi langsung (aktivasi, verifikasi, atau pemulihan kata sandi)
 * untuk akses cepat tanpa ketergantungan mail server eksternal.
 */
export default function DemoLink({ href, label }: DemoLinkProps) {
  return (
    <AuthNote tone="info" title="Tautan Aksi Langsung">
      <p className="mb-2">
        Akses tautan verifikasi/pemulihan langsung melalui tombol di bawah:
      </p>
      <a
        href={href}
        className="inline-flex items-center justify-center h-[36px] px-4 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#1a387a] transition-colors"
      >
        {label}
      </a>
    </AuthNote>
  );
}
