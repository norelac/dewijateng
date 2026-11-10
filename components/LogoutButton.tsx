'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/authActions';

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

/** Tombol keluar: hapus cookie sesi lalu kembali ke beranda. */
export default function LogoutButton({ className, label = 'Keluar' }: LogoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutAction();
      router.push('/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className={
        className ||
        'px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-60'
      }
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{busy ? 'Keluar...' : label}</span>
    </button>
  );
}
