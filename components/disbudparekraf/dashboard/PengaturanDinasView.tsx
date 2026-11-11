'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { changePasswordAction, getSessionAction } from '@/app/actions/authActions';
import type { SessionUser } from '@/lib/auth';

const INPUT =
  'w-full min-h-[44px] px-3 py-3 bg-white border border-[#E6ECF5] rounded-[8px] text-[#0D2453] text-[13px] placeholder:text-[#64748B] focus:outline-none focus:border-[#0D2453]';

/** Halaman "Pengaturan" ruang admin dinas: identitas akun + ubah kata sandi. */
export default function PengaturanDinasView() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSessionAction().then(setSession);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword && !confirmPassword) {
      setNotice({ type: 'error', text: 'Isi kata sandi baru untuk menyimpan perubahan.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.set('oldPassword', oldPassword);
      fd.set('newPassword', newPassword);
      fd.set('confirmPassword', confirmPassword);
      const res = await changePasswordAction(null, fd);
      if (!res.success) {
        setNotice({ type: 'error', text: res.message || 'Gagal mengubah kata sandi.' });
        return;
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ type: 'ok', text: 'Kata sandi akun dinas berhasil diperbarui.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Pengaturan
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Kelola akun dinas dan keamanan akses ruang admin.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        <div className="flex flex-1 min-w-0 flex-col gap-6 w-full">
          <div className="bg-white rounded-[16px] p-6 shadow-xs flex flex-col gap-4 w-full">
            <p className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">Akun dinas</p>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#64748B]">NAMA PENGGUNA</span>
              <span className="text-[#0D2453] text-[13px] font-semibold">
                {session?.fullName || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#64748B]">EMAIL DINAS</span>
              <span className="text-[#0D2453] text-[13px] font-semibold break-all">
                {session?.email || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#64748B]">PERAN</span>
              <span className="text-[#0D2453] text-[13px] font-semibold">
                Admin Disbudparekraf
              </span>
            </div>
            <p className="text-[#64748B] text-[11px] leading-[1.5]">
              Nama, email, dan peran akun dinas dikelola oleh administrator sistem.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="bg-white rounded-[16px] p-6 shadow-xs flex flex-col gap-4 w-full"
          >
            <p className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Keamanan & kata sandi
            </p>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="oldPassword" className="text-[12px] font-semibold text-[#0D2453]">
                Kata sandi saat ini
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                className={INPUT}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-1 flex-col gap-[6px]">
                <label htmlFor="newPassword" className="text-[12px] font-semibold text-[#0D2453]">
                  Kata sandi baru
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 12 karakter"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-1 flex-col gap-[6px]">
                <label
                  htmlFor="confirmPassword"
                  className="text-[12px] font-semibold text-[#0D2453]"
                >
                  Ulangi kata sandi baru
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi kata sandi baru"
                  className={INPUT}
                />
              </div>
            </div>
            <p className="text-[#64748B] text-[11px] leading-[1.5]">
              Gunakan minimal 12 karakter dengan kombinasi huruf, angka, dan simbol.
            </p>

            {notice && (
              <p
                className={`text-[11px] font-medium ${
                  notice.type === 'ok' ? 'text-[#16725C]' : 'text-red-600'
                }`}
              >
                {notice.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-[40px] px-5 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold self-start disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Menyimpan…' : 'Simpan kata sandi'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-5 w-full lg:w-[370px] lg:shrink-0">
          <div className="bg-[#EDF3FC] flex gap-[10px] items-start p-4 rounded-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0D2453] shrink-0 mt-0.5" />
            <p className="flex-1 min-w-0 text-[#0D2453] text-[13px] leading-[1.5]">
              Jangan bagikan kata sandi akun dinas. Gunakan perangkat tepercaya dan keluar
              setelah selesai bekerja.
            </p>
          </div>
          <p className="text-[#64748B] text-[11px] leading-[1.5]">
            Preferensi notifikasi dan pengelolaan akun desa diatur pada menu masing-masing.
          </p>
        </div>
      </div>
    </div>
  );
}
