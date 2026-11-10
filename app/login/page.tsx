'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  UserCheck,
  Lock,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { loginAction } from '@/app/actions/authActions';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'disbudparekraf' | 'desa' | 'custom'>('disbudparekraf');
  const [username, setUsername] = useState('disbudparekraf');
  const [password, setPassword] = useState('disbudparekraf2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: 'disbudparekraf' | 'desa') => {
    setSelectedRole(role);
    if (role === 'disbudparekraf') {
      setUsername('disbudparekraf');
      setPassword('disbudparekraf2026');
    } else {
      setUsername('desa-candirejo');
      setPassword('candirejo2026');
    }
    setError(null);
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (val !== 'disbudparekraf' && val !== 'desa-candirejo') {
      setSelectedRole('custom');
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (username !== 'disbudparekraf' && username !== 'desa-candirejo') {
      setSelectedRole('custom');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('username', username);
      formData.set('password', password);

      const res = await loginAction(null, formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.message || 'Nama pengguna atau kata sandi tidak sesuai');
      }
    } catch {
      setError('Terjadi kendala jaringan saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#F7F9FC] flex flex-col justify-between items-center px-4 py-6 selection:bg-blue-100 selection:text-[#0D2453]">
      {/* Top Bar Link */}
      <div className="w-full max-w-[420px] flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0D2453] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Beranda Publik</span>
        </Link>
        <span className="text-[11px] text-[#94A3B8] font-medium">DEWI JATENG · 2026</span>
      </div>

      {/* Main Login Card (Fixed Height, No Scroll) */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E6ECF5] shadow-xs p-6 sm:p-7 flex flex-col gap-5">
        {/* Branding & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-10 h-11 mb-2">
            <Image
              src="/img/logo-pemprov-jateng.png"
              alt="Logo Pemprov Jateng"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-[#0D2453] tracking-tight">Portal Akses Pengguna</h1>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-xs">
            Masuk sebagai Verifikator Disbudparekraf atau Pengelola Desa Wisata
          </p>
        </div>

        {/* Segmented Quick-Fill Switch */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Pilih Akun Demo (1-Klik):
            </span>
            <span className="text-[10px] text-[#94A3B8]">atau ketik manual akun baru</span>
          </div>
          <div className="bg-[#F1F5F9] p-1 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleRoleSelect('disbudparekraf')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'disbudparekraf'
                  ? 'bg-[#0D2453] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0D2453]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Disbudparekraf</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('desa')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'desa'
                  ? 'bg-[#0D2453] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0D2453]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Desa Candirejo</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#0D2453] uppercase tracking-wider mb-1.5">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. desa-nama-desa atau disbudparekraf"
                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-white border border-[#E6ECF5] text-xs text-[#0D2453] placeholder-slate-400 focus:outline-none focus:border-[#0D2453] focus:ring-1 focus:ring-[#0D2453] transition-all"
              />
              <UserCheck className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-[#0D2453] uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 pl-10 pr-10 rounded-xl bg-white border border-[#E6ECF5] text-xs text-[#0D2453] placeholder-slate-400 focus:outline-none focus:border-[#0D2453] focus:ring-1 focus:ring-[#0D2453] transition-all"
              />
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#0D2453] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 rounded-xl bg-[#0D2453] hover:bg-[#163B80] active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-3 border-t border-[#F1F5F9] text-center">
          <p className="text-[11px] text-[#64748B] leading-tight">
            Penerbitan akun desa resmi dikelola langsung oleh{' '}
            <span className="font-semibold text-[#0D2453]">Disbudparekraf Jateng</span>.
          </p>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="text-center">
        <p className="text-[11px] text-[#94A3B8]">
          © 2026 Pemerintah Provinsi Jawa Tengah · Hak Cipta Dilindungi
        </p>
      </div>
    </div>
  );
}
