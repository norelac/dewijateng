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
