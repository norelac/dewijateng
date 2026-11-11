'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import {
  createVillageAccountAction,
  listDistrictsAction,
  listVillagesForAccountAction,
  type VillageOption,
} from '@/app/actions/villageAccountActions';

const FIELD =
  'w-full h-[46px] px-3 rounded-[8px] border border-[#E6ECF5] bg-white text-[13px] text-[#0D2453] placeholder:text-[#64748B] focus:outline-none focus:border-[#0D2453] transition-colors';
const LABEL = 'text-[12px] font-semibold text-[#0D2453] leading-[1.5]';

interface CreateVillageAccountFormProps {
  regencies: string[];
}

/** Form "Buat akun desa wisata" (Figma 418:569). */
export default function CreateVillageAccountForm({
  regencies,
}: CreateVillageAccountFormProps) {
  const router = useRouter();

  const [regency, setRegency] = useState('');
  const [district, setDistrict] = useState('');
  const [villageId, setVillageId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);

  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDistricts = useCallback(async (nextRegency: string) => {
    if (!nextRegency) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      setDistricts(await listDistrictsAction(nextRegency));
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadVillages = useCallback(async (nextRegency: string, nextDistrict: string) => {
    if (!nextRegency || !nextDistrict) {
      setVillages([]);
      return;
    }
    setLoadingVillages(true);
    try {
      setVillages(await listVillagesForAccountAction(nextRegency, nextDistrict));
    } catch {
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  useEffect(() => {
    void loadDistricts(regency);
    setDistrict('');
    setVillageId('');
    setVillages([]);
  }, [regency, loadDistricts]);

  useEffect(() => {
    void loadVillages(regency, district);
    setVillageId('');
  }, [district, regency, loadVillages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!villageId) return setError('Pilih desa wisata terlebih dahulu.');
    if (!consent) {
      return setError('Centang pernyataan penunjukan pengelola sebelum mengirim undangan.');
    }

    setSubmitting(true);
    try {
      const res = await createVillageAccountAction({ villageId, fullName, email, phone });
      if (!res.success || !res.userId) {
        setError(res.message || 'Gagal membuat akun.');
        return;
      }
      const params = new URLSearchParams({ created: '1' });
      if (res.devLink) params.set('demo', res.devLink);
      router.push(`/disbudparekraf/akun/${res.userId}?${params.toString()}`);
    } catch {
      setError('Terjadi kesalahan sistem. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVillage = villages.find((v) => v.id === villageId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/disbudparekraf/akun"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0D2453] hover:underline w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke akun desa wisata
        </Link>
        <h1 className="text-[#0D2453] text-[28px] font-semibold leading-[1.5] tracking-[-0.5px]">
          Buat akun desa wisata
        </h1>
        <p className="text-[#64748B] text-[13px] leading-[1.5]">
          Undang pengelola resmi untuk mengelola informasi dan laporan desa.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Kartu form */}
        <div className="flex-1 bg-white rounded-[14px] shadow-[0px_2px_1.5px_rgba(0,0,0,0.10),0px_6px_3px_rgba(0,0,0,0.09),0px_14px_4px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Informasi akun
            </h2>
            <p className="text-[#64748B] text-[12px] leading-[1.5]">
              Semua kolom bertanda * wajib diisi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="regency" className={LABEL}>
                Kabupaten / kota *
              </label>
              <select
                id="regency"
                value={regency}
                onChange={(e) => setRegency(e.target.value)}
                required
                className={`${FIELD} appearance-none`}
              >
                <option value="">Pilih kabupaten / kota</option>
                {regencies.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="district" className={LABEL}>
                Kecamatan *
              </label>
              <select
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!regency || loadingDistricts}
                required
                className={`${FIELD} appearance-none disabled:bg-slate-50 disabled:text-[#94A3B8]`}
              >
                <option value="">
                  {loadingDistricts ? 'Memuat kecamatan…' : 'Pilih kecamatan'}
                </option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="village" className={LABEL}>
              Desa wisata *
            </label>
            <select
              id="village"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              disabled={!district || loadingVillages}
              required
              className={`${FIELD} appearance-none disabled:bg-slate-50 disabled:text-[#94A3B8]`}
            >
              <option value="">
                {loadingVillages ? 'Memuat desa wisata…' : 'Pilih desa wisata terdaftar'}
              </option>
              {villages.map((v) => (
                <option key={v.id} value={v.id} disabled={v.hasAccount}>
                  {v.name}
                  {v.hasAccount ? ' — sudah punya akun' : ''}
                </option>
              ))}
            </select>
            <p className="text-[#64748B] text-[11px] leading-[1.5]">
              {selectedVillage?.hasAccount
                ? 'Desa ini sudah memiliki akun pengelola utama.'
                : 'Satu desa hanya memiliki satu akun pengelola utama.'}
            </p>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="fullName" className={LABEL}>
              Nama lengkap pengelola *
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama sesuai surat penunjukan"
              required
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="email" className={LABEL}>
              Email pengelola *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email aktif pengelola"
              required
              className={FIELD}
            />
            <p className="text-[#64748B] text-[11px] leading-[1.5]">
              Undangan aktivasi akan dikirim ke alamat email ini.
            </p>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="phone" className={LABEL}>
              Nomor WhatsApp *
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
              className={FIELD}
            />
          </div>
        </div>

        {/* Kartu samping */}
        <div className="flex flex-col gap-6 lg:w-[364px] shrink-0">
          <div className="bg-[#EDF3FC] rounded-[14px] p-6 flex flex-col gap-4">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Hak akses pengelola
            </h2>
            <div className="flex flex-col gap-2">
              <p className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                Akun pengelola desa
              </p>
              <ul className="text-[#64748B] text-[13px] leading-[1.6] list-none flex flex-col gap-1">
                <li>• Mengelola profil desa wisata</li>
                <li>• Memverifikasi dan menangani aduan</li>
                <li>• Memperbarui anggaran desa</li>
                <li>• Mencatat pengeluaran dan bukti</li>
              </ul>
            </div>
            <p className="text-[#0D2453] text-[12px] leading-[1.5]">
              Akun hanya dapat mengakses data desanya sendiri.
            </p>
          </div>

          <div className="bg-white rounded-[14px] shadow-[0px_1px_1px_rgba(0,0,0,0.10),0px_3px_1.5px_rgba(0,0,0,0.09),0px_7px_2px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
            <h2 className="text-[#0D2453] text-[16px] font-semibold leading-[1.5]">
              Tanpa berbagi kata sandi
            </h2>
            <ol className="text-[#64748B] text-[13px] leading-[1.6] list-none flex flex-col gap-1">
              <li>1. Dinas mengirim undangan.</li>
              <li>2. Pengelola membuka tautan email.</li>
              <li>3. Pengelola membuat kata sandi.</li>
              <li>4. Akun siap digunakan.</li>
            </ol>
            <p className="text-[#0D2453] text-[12px] leading-[1.5]">
              Tautan aktivasi berlaku selama 24 jam.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-4 text-[13px] text-[#991B1B]">
          {error}
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border border-[#E6ECF5] accent-[#0D2453] cursor-pointer"
        />
        <span className="text-[#0D2453] text-[13px] leading-[1.5]">
          Saya memastikan pengelola telah ditunjuk oleh desa dan email penerima sudah benar.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="h-[40px] px-6 inline-flex items-center justify-center gap-2 rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#163B80] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Mengirim undangan…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" /> Buat &amp; kirim undangan
            </>
          )}
        </button>
        <Link
          href="/disbudparekraf/akun"
          className="h-[40px] px-5 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
