'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ShieldCheck, Building2, ArrowRight, KeyRound } from 'lucide-react';
import { loginAction } from '@/app/actions/authActions';

type Role = 'PENGELOLA' | 'PEMBINA';

const ROLE_OPTIONS: { id: Role; label: string; desc: string; icon: typeof Building2 }[] = [
  {
    id: 'PENGELOLA',
    label: 'Pengelola & Balai Desa',
    desc: 'Kelola laporan, anggaran, dan bukti fisik desa.',
    icon: Building2,
  },
  {
    id: 'PEMBINA',
    label: 'Pembina / Disbudparekraf',
    desc: 'Pantau kepatuhan 35 kab/kota dan rekomendasi hibah.',
    icon: ShieldCheck,
  },
];

const DEMO_CREDENTIALS: { role: Role; password: string }[] = [
  { role: 'PENGELOLA', password: 'pengelola2026' },
  { role: 'PEMBINA', password: 'pembina2026' },
];

function MasukContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '';
  const roleParam = searchParams.get('role');

  const [role, setRole] = useState<Role>(
    roleParam === 'pembina' || roleParam === 'PEMBINA' ? 'PEMBINA' : 'PENGELOLA'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('role', role);
      formData.append('password', password);
      formData.append('next', nextParam);

      const res = await loginAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.error || 'Gagal masuk. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan sistem saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="w-12 h-12 rounded-[16px] bg-[#0D2453] text-white flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </span>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-[#0D2453]">
            Masuk Portal Pengelola
          </h1>
          <p className="text-[13px] text-[#64748B]">
            Akses terbatas untuk pengelola desa dan pembina Disbudparekraf.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] border border-[#E6ECF5] shadow-[0px_8px_24px_rgba(13,36,83,0.08)] p-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-[#0D2453]">Pilih peran</span>
            <div className="grid grid-cols-1 gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRole(opt.id);
                      setError(null);
                    }}
                    className={`flex items-start gap-3 text-left rounded-[14px] border-2 p-3 transition-colors ${
                      active
                        ? 'border-[#0D2453] bg-[#EDF3FC]'
                        : 'border-[#E6ECF5] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
                        active ? 'bg-[#0D2453] text-white' : 'bg-[#F3F5F8] text-[#0D2453]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-semibold text-[#0D2453]">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[#64748B] leading-snug">
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[13px] font-semibold text-[#0D2453]">Kata sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi peran"
              autoComplete="current-password"
              className="w-full bg-white border border-[#E6ECF5] rounded-[8px] min-h-[44px] px-[12px] py-[10px] text-[13px] text-[#0D2453] outline-none focus:ring-1 focus:ring-[#0D2453] focus:border-[#0D2453] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[12px] text-[#B3261E] bg-[#FDECEA] border border-[#F7C9C4] rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[44px] rounded-full bg-[#0D2453] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#132d66] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Memproses...' : 'Masuk'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Panel akun demo (untuk juri/penguji) */}
        <div className="bg-[#EDF3FC] border border-[#DCE7F5] rounded-[16px] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#0D2453]">
            <KeyRound className="w-4 h-4" />
            <span className="text-[13px] font-semibold">Akun demo</span>
          </div>
          <div className="flex flex-col gap-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <div
                key={cred.role}
                className="flex items-center justify-between gap-3 bg-white rounded-[10px] border border-[#E6ECF5] px-3 py-2"
              >
                <span className="text-[12px] text-[#0D2453]">
                  <span className="font-semibold">
                    {cred.role === 'PENGELOLA' ? 'Pengelola' : 'Pembina'}
                  </span>{' '}
                  · <span className="font-mono">{cred.password}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRole(cred.role);
                    setPassword(cred.password);
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-[#0D2453] underline shrink-0"
                >
                  Isi otomatis
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#64748B] leading-snug">
            Kredensial ini hanya untuk keperluan demonstrasi. Ganti lewat variabel
            AUTH_PENGELOLA / AUTH_PEMBINA sebelum dipakai di produksi.
          </p>
        </div>

        <Link
          href="/"
          className="text-center text-[12px] font-semibold text-[#0D2453] hover:underline"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0D2453] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MasukContent />
    </Suspense>
  );
}
