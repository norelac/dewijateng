'use client';

import React from 'react';
import Link from 'next/link';

interface AuthButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  type?: 'submit' | 'button';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const BASE =
  'h-[44px] px-[10px] rounded-[999px] inline-flex items-center justify-center text-[12px] font-semibold transition-colors w-full disabled:opacity-50';
const VARIANTS = {
  primary: 'bg-[#0D2453] text-white hover:bg-[#163B80]',
  secondary: 'bg-white text-[#0D2453] border border-[#E6ECF5] hover:bg-slate-50',
};

/** Tombol pil 44px: primer navy, sekunder putih bertepi. */
export default function AuthButton({
  children,
  variant = 'primary',
  type = 'button',
  href,
  onClick,
  disabled,
  className = '',
}: AuthButtonProps) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
