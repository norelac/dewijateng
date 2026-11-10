'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import {
  resendInvitationAction,
  setVillageAccountStatusAction,
  updateVillageAccountAction,
  type VillageAccountDetail,
} from '@/app/actions/villageAccountActions';

const FIELD =
  'w-full h-[40px] px-3 rounded-[8px] border border-[#E6ECF5] bg-white text-[13px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none focus:border-[#0D2453] transition-colors';

const BADGE: Record<string, string> = {
  AKTIF: 'bg-[#E5F4ED] text-[#216B55]',
  MENUNGGU_AKTIVASI: 'bg-[#FFF4DB] text-[#875B12]',
  NONAKTIF: 'bg-[#EDF3FC] text-[#0D2453]',
};

function waktu(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d) + ' WIB';
}

function waktuSingkat(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d) + ' WIB';
}

function wilayah(district: string, regency: string) {
  return `${district.replace(/^Kecamatan\s+/i, '')}, ${regency}`;
}

interface VillageAccountDetailViewProps {
  detail: VillageAccountDetail;
  justCreated: boolean;
  demoLink: string | null;
}

export default function VillageAccountDetailView({
  detail,
  justCreated,
  demoLink,
}: VillageAccountDetailViewProps) {
  const router = useRouter();
  const { account, events } = detail;

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(account.fullName);
  const [email, setEmail] = useState(account.email || '');
  const [phone, setPhone] = useState(account.phone || '');

  const [busy, setBusy] = useState<'resend' | 'status' | 'save' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [resendLink, setResendLink] = useState<string | null>(null);

  const showNotice = (tone: 'ok' | 'err', text: string) => setNotice({ tone, text });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('save');
    try {
      const res = await updateVillageAccountAction({
        userId: account.userId,
        fullName,
        email,
        phone,
      });
      if (res.success) {
        setEditing(false);
        showNotice('ok', res.message || 'Informasi akun diperbarui.');
        router.refresh();
      } else {
        showNotice('err', res.message || 'Gagal memperbarui informasi akun.');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    setBusy('resend');
    try {
      const res = await resendInvitationAction(account.userId);
      if (res.success) {
        setResendLink(res.devLink ?? null);
        showNotice('ok', res.message || 'Undangan dikirim ulang.');
        router.refresh();
      } else {
        showNotice('err', res.message || 'Gagal mengirim ulang undangan.');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleToggleStatus = async () => {
    setBusy('status');
    try {
      const next = account.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      const res = await setVillageAccountStatusAction(account.userId, next);
      if (res.success) {
        showNotice('ok', res.message || 'Status akun diperbarui.');
        router.refresh();
      } else {
        showNotice('err', res.message || 'Gagal mengubah status akun.');
      }
    } finally {
      setBusy(null);
    }
  };

  const villageShort = account.villageName.replace(/^Desa Wisata\s+/i, '');
  const canResend = account.status === 'MENUNGGU_AKTIVASI';
  const linkToShow = demoLink || resendLink;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Detail akun desa wisata
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Desa {villageShort} · {wilayah(account.district, account.regency)}
        </p>
      </div>

      {justCreated && (
        <div className="bg-[#E5F4ED] rounded-[14px] px-5 py-3 flex flex-col gap-1">
          <p className="text-[#216B55] text-[14px] font-semibold leading-[1.5]">
            Akun berhasil dibuat. Undangan aktivasi telah dikirim.
          </p>
          <p className="text-[#216B55] text-[12px] leading-[1.5]">
            Pengelola perlu membuka email undangan untuk menetapkan kata sandi dan mengaktifkan
            akun.
          </p>
        </div>
      )}

      {linkToShow && (
        <div className="bg-[#FFF4DB] rounded-[14px] px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-[#875B12] text-[12px] font-semibold">
              Mode demo — email tidak benar-benar dikirim
            </p>
            <p className="text-[#875B12] text-[12px] leading-[1.5] break-all">
              Tautan aktivasi untuk pengelola: {linkToShow}
            </p>
          </div>
          <a
            href={linkToShow}
            className="h-[36px] px-4 shrink-0 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold"
          >
            Buka tautan aktivasi
          </a>
        </div>
      )}

      {notice && (
        <div
          className={`rounded-[10px] px-4 py-3 text-[13px] ${
            notice.tone === 'ok'
              ? 'bg-[#E5F4ED] text-[#216B55]'
              : 'bg-[#FEF2F2] text-[#991B1B]'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,732px)_minmax(0,388px)] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {/* Informasi akun */}
          <div className="bg-white rounded-[14px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.10),0px_6px_3px_rgba(0,0,0,0.09),0px_13px_4px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5] mb-5">
              Informasi akun
            </h2>

            {editing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">Nama pengelola</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={FIELD}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">Email akun</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={FIELD}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-semibold text-[#0D2453]">WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className={FIELD}
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy === 'save'}
                    className="h-[40px] px-5 inline-flex items-center gap-2 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {busy === 'save' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Simpan perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="h-[40px] px-5 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="flex flex-col gap-[10px]">
                  {[
                    ['Desa wisata', villageShort],
                    ['Wilayah', wilayah(account.district, account.regency)],
                    ['Nama pengelola', account.fullName],
                    ['Email akun', account.email || '—'],
                    ['WhatsApp', account.phone || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                      <dt className="text-[#64748B] text-[12px] leading-[1.5] sm:w-[200px] shrink-0">
                        {label}
                      </dt>
                      <dd className="text-[#0D2453] text-[13px] font-medium leading-[1.5] break-all">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-6 h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Ubah informasi akun
                </button>
              </>
            )}
          </div>

          {/* Riwayat aktivitas akun */}
          <div className="bg-white rounded-[14px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.10),0px_6px_3px_rgba(0,0,0,0.09),0px_13px_4px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5] mb-4">
              Riwayat aktivitas akun
            </h2>

            {events.length === 0 ? (
              <p className="text-[#64748B] text-[12px]">Belum ada aktivitas tercatat.</p>
            ) : (
              <div className="flex flex-col">
                {events.map((event, index) => (
                  <div key={`${event.at}-${event.title}-${index}`}>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 py-3">
                      <span className="text-[#64748B] text-[12px] leading-[1.5] sm:w-[240px] shrink-0">
                        {waktuSingkat(event.at)}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                          {event.title}
                        </span>
                        <span className="text-[#64748B] text-[12px] leading-[1.5]">
                          {event.detail}
                        </span>
                      </div>
                    </div>
                    {index < events.length - 1 && <div className="h-px bg-[#E6ECF5]" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          {/* Status akun */}
          <div className="bg-white rounded-[14px] shadow-[0px_1px_1px_rgba(0,0,0,0.10),0px_3px_1.5px_rgba(0,0,0,0.09),0px_7px_2px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Status akun
            </h2>

            <span
              className={`inline-flex items-center h-[28px] px-3 rounded-[999px] text-[12px] font-medium w-fit ${BADGE[account.status]}`}
            >
              {account.statusLabel}
            </span>

            {account.status === 'MENUNGGU_AKTIVASI' ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px]">Undangan dikirim</span>
                  <span className="text-[#0D2453] text-[13px] font-medium">
                    {account.invitationSentAt ? waktu(account.invitationSentAt) : 'Belum ada undangan aktif'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px]">Tautan berlaku sampai</span>
                  <span className="text-[#64748B] text-[12px]">
                    {account.invitationExpiresAt ? waktu(account.invitationExpiresAt) : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy === 'resend'}
                  className="mt-2 h-[40px] w-full inline-flex items-center justify-center gap-2 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#163B80] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busy === 'resend' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MailCheck className="w-4 h-4" />
                  )}
                  Kirim ulang undangan
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px]">Diaktifkan</span>
                  <span className="text-[#0D2453] text-[13px] font-medium">
                    {waktu(account.activatedAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#64748B] text-[12px]">Masuk terakhir</span>
                  <span className="text-[#0D2453] text-[13px] font-medium">
                    {waktu(account.lastLoginAt)}
                  </span>
                </div>
                {account.deactivatedAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[#64748B] text-[12px]">Dinonaktifkan</span>
                    <span className="text-[#0D2453] text-[13px] font-medium">
                      {waktu(account.deactivatedAt)}
                    </span>
                  </div>
                )}
                {canResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={busy === 'resend'}
                    className="mt-2 h-[40px] w-full inline-flex items-center justify-center gap-2 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    Kirim ulang undangan
                  </button>
                )}
              </>
            )}
          </div>

          {/* Keamanan akun */}
          <div className="bg-[#EDF3FC] rounded-[14px] shadow-[0px_1px_1px_rgba(0,0,0,0.10),0px_3px_1.5px_rgba(0,0,0,0.09),0px_7px_2px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Keamanan akun
            </h2>
            <p className="text-[#64748B] text-[13px] leading-[1.5]">
              Dinas tidak dapat melihat kata sandi pengelola. Pemulihan dilakukan melalui email
              akun.
            </p>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={busy === 'status' || account.status === 'MENUNGGU_AKTIVASI'}
              className="mt-2 h-[40px] w-full inline-flex items-center justify-center gap-2 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy === 'status' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              {account.status === 'AKTIF' ? 'Nonaktifkan akun' : 'Aktifkan kembali'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
