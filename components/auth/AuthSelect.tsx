'use client';

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface AuthSelectProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
}

/** Dropdown 44px radius 8 bergaya sama dengan AuthField. */
export default function AuthSelect({
  label,
  name,
  options,
  placeholder = 'Pilih opsi',
  value,
  onChange,
  required,
  className = '',
}: AuthSelectProps) {
  const id = useId();

  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      <label htmlFor={id} className="text-[12px] font-semibold text-[#0D2453] leading-[1.5]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          className="w-full h-[44px] px-3 pr-9 rounded-[8px] border border-[#E6ECF5] bg-white text-[13px] text-[#0D2453] appearance-none focus:outline-none focus:border-[#0D2453] focus:ring-1 focus:ring-[#0D2453] transition-colors"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
