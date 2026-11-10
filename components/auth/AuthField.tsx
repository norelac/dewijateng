'use client';

import React, { useId, useState } from 'react';

interface AuthFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  /** Tampilkan tombol "Tampilkan" di dalam input (khusus kata sandi). */
  revealable?: boolean;
  className?: string;
}

/**
 * Label 12px semibold + input 44px radius 8 sesuai desain Figma.
 */
export default function AuthField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
  hint,
  revealable,
  className = '',
}: AuthFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const inputType = revealable && revealed ? 'text' : type;

  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      <label htmlFor={id} className="text-[12px] font-semibold text-[#0D2453] leading-[1.5]">
        {label}
      </label>
      <div className="flex items-center gap-2 h-[44px] px-3 rounded-[8px] border border-[#E6ECF5] bg-white focus-within:border-[#0D2453] focus-within:ring-1 focus-within:ring-[#0D2453] transition-colors">
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="flex-1 min-w-0 bg-transparent text-[13px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none"
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="text-[11px] font-medium text-[#0D2453] shrink-0"
            aria-label={revealed ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            {revealed ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-[#64748B] leading-[1.5]">{hint}</p>}
    </div>
  );
}
