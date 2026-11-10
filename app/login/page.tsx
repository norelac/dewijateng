'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Building2, KeyRound, ArrowRight, UserCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { loginAction } from '@/app/actions/authActions';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(res.message || 'Username atau password salah');
      }
    } catch {
      setError('Terjadi kendala jaringan saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'disbudparekraf' | 'desa') => {
    if (role === 'disbudparekraf') {
      setUsername('disbudparekraf');
      setPassword('disbudparekraf2026');
    } else {
      setUsername('desa-candirejo');
      setPassword('candirejo2026');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080E21] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              DW
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              DEWI <span className="text-emerald-400">JATENG</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Portal Akses Pengguna</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Masuk sebagai Admin Disbudparekraf Jateng atau Pengelola Desa Wisata
          </p>
        </div>

        {/* Demo Quick Fill Badges */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 mb-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pintasan Akses Demo Juri & Penguji:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('disbudparekraf')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-blue-950/80 hover:border-blue-500/40 border border-slate-700/60 text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">Admin Disbudparekraf</p>
                <p className="text-[10px] text-slate-400">Peta Kendali & Verifikasi</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('desa')}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/80 hover:border-emerald-500/40 border border-slate-700/60 text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">Desa Candirejo</p>
                <p className="text-[10px] text-slate-400">Kelola LPJ & Aduan</p>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. disbudparekraf atau desa-candirejo"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Memverifikasi kredensial...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Belum memiliki akun desa?{' '}
              <span className="text-slate-300">
                Pendaftaran akun baru diterbitkan langsung oleh Disbudparekraf Jateng.
              </span>
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Kembali ke Halaman Utama Publik
          </Link>
        </div>
      </div>
    </div>
  );
}
