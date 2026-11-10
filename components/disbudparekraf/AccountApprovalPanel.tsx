'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MailCheck, MailWarning, Loader2 } from 'lucide-react';
import {
  listPendingAccountsAction,
  decideAccountAction,
  type PendingAccount,
} from '@/app/actions/registrationActions';

/**
 * Panel sementara untuk menyetujui / menolak akun Disbudparekraf yang mendaftar
 * mandiri (Fase 1). Di Fase 2 panel ini digantikan layar "Akun desa" pada
 * desain dashboard baru.
 */
export default function AccountApprovalPanel() {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPendingAccountsAction();
      setAccounts(rows);
    } catch (err) {
      console.error('[AccountApprovalPanel] gagal memuat akun:', err);
      setError('Gagal memuat daftar pengajuan akun.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, decision: 'SETUJUI' | 'TOLAK') => {
    setBusyId(id);
    setError(null);
    try {
      const res = await decideAccountAction(id, decision);
      if (res.success) {
        await load();
      } else {
        setError(res.message || 'Gagal memproses keputusan akun.');
      }
    } catch (err) {
      console.error('[AccountApprovalPanel] gagal memutuskan akun:', err);
      setError('Gagal memproses keputusan akun.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-[20px] sm:rounded-3xl border border-[#E6ECF5] p-5 sm:p-7 shadow-xs space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[#0D2453] text-[16px] font-semibold">Persetujuan akun dinas</h3>
          <p className="text-[#64748B] text-[11px] mt-0.5">
            Akun hasil pendaftaran mandiri yang sudah memverifikasi email.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="h-9 px-4 rounded-full border border-[#E6ECF5] text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 disabled:opacity-50"
        >
          Muat ulang
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-[#875B12] bg-[#FFF4DB] rounded-[10px] px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[#64748B] text-[13px] py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat pengajuan…
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-[#64748B] text-[13px] py-6">
          Tidak ada pengajuan akun yang menunggu. Akun baru akan muncul di sini.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="border border-[#E6ECF5] rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#0D2453] text-[13px] font-semibold">{acc.fullName}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      acc.emailVerified
                        ? 'bg-[#E5F4ED] text-[#216B55]'
                        : 'bg-[#FFF4DB] text-[#875B12]'
                    }`}
                  >
                    {acc.emailVerified ? (
                      <MailCheck className="w-3 h-3" />
                    ) : (
                      <MailWarning className="w-3 h-3" />
                    )}
                    {acc.emailVerified ? 'Email terverifikasi' : 'Email belum verifikasi'}
                  </span>
                  {acc.approvalStatus === 'DITOLAK' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      <XCircle className="w-3 h-3" />
                      Ditolak
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#64748B] break-all">
                  {acc.institution || '—'} · {acc.regency || '—'}
                </span>
                <span className="text-[11px] text-[#64748B] break-all">
                  NIP {acc.nip || '—'} · {acc.email || '—'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => decide(acc.id, 'SETUJUI')}
                  disabled={busyId === acc.id}
                  className="h-9 px-4 rounded-full bg-[#0D2453] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui
                </button>
                <button
                  type="button"
                  onClick={() => decide(acc.id, 'TOLAK')}
                  disabled={busyId === acc.id}
                  className="h-9 px-4 rounded-full border border-[#E6ECF5] text-[#B91C1C] text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
