'use client';

import React, { useId } from 'react';

interface AuthCheckboxProps {
  label: React.ReactNode;
  name: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  required?: boolean;
  className?: string;
}

/** Checkbox 18px radius 4 dengan label 12px. */
export default function AuthCheckbox({
  label,
  name,
  checked,
  onChange,
  required,
  className = '',
}: AuthCheckboxProps) {
  const id = useId();

  return (
    <div className={`flex items-start gap-[10px] ${className}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        required={required}
        className="mt-[1px] w-[18px] h-[18px] shrink-0 rounded-[4px] border border-[#B9B9B9] accent-[#0D2453]"
      />
      <label htmlFor={id} className="text-[12px] text-[#64748B] leading-[1.5] cursor-pointer">
        {label}
      </label>
    </div>
  );
}
