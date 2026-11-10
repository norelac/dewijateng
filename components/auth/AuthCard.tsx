import React from 'react';

interface AuthCardProps {
  /** Label kecil di atas judul, mis. "PEMULIHAN AKUN". */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Lebar kartu: 520 (mayoritas layar) atau 600 (form daftar). */
  width?: 520 | 600;
  children?: React.ReactNode;
}

/**
 * Kartu putih radius 16 padding 32 dengan garis pemisah di bawah deskripsi,
 * mengikuti seluruh layar autentikasi pada desain Figma.
 */
export default function AuthCard({
  eyebrow,
  title,
  description,
  width = 520,
  children,
}: AuthCardProps) {
  return (
    <div
      className={`bg-white rounded-[16px] p-6 sm:p-[32px] flex flex-col gap-[18px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.10),0px_5px_2.5px_rgba(0,0,0,0.09),0px_11px_3.5px_rgba(0,0,0,0.05),0px_20px_4px_rgba(0,0,0,0.01)] w-full ${
        width === 600 ? 'max-w-[600px]' : 'max-w-[520px]'
      }`}
    >
      <div className="flex flex-col gap-[6px]">
        {eyebrow && (
          <p className="text-[10px] font-semibold text-[#64748B] leading-[1.5]">{eyebrow}</p>
        )}
        <h1 className="text-[22px] font-semibold text-[#0D2453] leading-[1.5]">{title}</h1>
        {description && (
          <p className="text-[13px] text-[#64748B] leading-[1.5]">{description}</p>
        )}
      </div>

      <div className="h-px w-full bg-[#E6ECF5]" />

      {children}
    </div>
  );
}
