import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "Rp 120 juta" / "Rp 2,40 miliar" �" dipakai kartu ringkasan. */
export function formatRupiahShort(amount: number): string {
  const jt = amount / 1_000_000;
  if (jt >= 1000) {
    return `Rp ${(jt / 1000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} miliar`;
  }
  return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 0 })} juta`;
}

/** "Rp 120 jt" / "Rp 2,40 M" �" dipakai sel tabel dan baris total. */
export function formatRupiahCompact(amount: number): string {
  const jt = amount / 1_000_000;
  if (jt >= 1000) {
    return `Rp ${(jt / 1000).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} M`;
  }
  return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 0 })} jt`;
}

export function formatDateIndo(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function calculateSLARemaining(deadlineAt: string): {
  hoursLeft: number;
  isOverdue: boolean;
  statusColor: 'emerald' | 'amber' | 'crimson';
  label: string;
} {
  const now = new Date().getTime();
  const deadline = new Date(deadlineAt).getTime();
  const diffMs = deadline - now;
  const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

  if (hoursLeft <= 0) {
    return {
      hoursLeft: 0,
      isOverdue: true,
      statusColor: 'crimson',
      label: 'SLA Melewati Batas (Overdue)',
    };
  }

  if (hoursLeft <= 24) {
    return {
      hoursLeft,
      isOverdue: false,
      statusColor: 'amber',
      label: `Sisa ${hoursLeft} Jam (Mendekati Tenggat)`,
    };
  }

  const daysLeft = Math.ceil(hoursLeft / 24);
  return {
    hoursLeft,
    isOverdue: false,
    statusColor: 'emerald',
    label: `Sisa ${daysLeft} Hari (Aman)`,
  };
}
