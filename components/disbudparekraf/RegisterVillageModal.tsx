'use client';

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { registerVillageAction, RegisterVillageResult } from '@/app/actions/villageActions';

interface RegisterVillageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const KABUPATEN_KOTA_JATENG = [
  'Kabupaten Banjarnegara',
  'Kabupaten Banyumas',
  'Kabupaten Batang',
  'Kabupaten Blora',
  'Kabupaten Boyolali',
  'Kabupaten Brebes',
  'Kabupaten Cilacap',
  'Kabupaten Demak',
  'Kabupaten Grobogan',
  'Kabupaten Jepara',
  'Kabupaten Karanganyar',
  'Kabupaten Kebumen',
  'Kabupaten Kendal',
  'Kabupaten Klaten',
  'Kabupaten Kudus',
  'Kabupaten Magelang',
  'Kabupaten Pati',
  'Kabupaten Pekalongan',
  'Kabupaten Pemalang',
  'Kabupaten Purbalingga',
  'Kabupaten Purworejo',
  'Kabupaten Rembang',
  'Kabupaten Semarang',
  'Kabupaten Sragen',
  'Kabupaten Sukoharjo',
  'Kabupaten Tegal',
  'Kabupaten Temanggung',
  'Kabupaten Wonogiri',
  'Kabupaten Wonosobo',
  'Kota Magelang',
  'Kota Pekalongan',
  'Kota Salatiga',
  'Kota Semarang',
  'Kota Surakarta',
  'Kota Tegal',
];

export default function RegisterVillageModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterVillageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    regency: 'Kabupaten Magelang',
    district: '',
    category: 'BERKEMBANG' as const,
    latitude: -7.5,
    longitude: 110.2,
    pokdarwisName: '',
    contactPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterVillageResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await registerVillageAction(formData);
      if (res.success && res.credentials) {
        setResult(res);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Gagal mendaftarkan desa wisata.');
      }
    } catch {
      setError('Terjadi kendala saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!result?.credentials) return;
    const { username, temporaryPassword, loginUrl } = result.credentials;
    const text = `*KREDENSIAL AKUN RESMI DESA WISATA DEWI JATENG*\nDesa: ${result.village?.name}\nUsername: ${username}\nPassword Sementara: ${temporaryPassword}\nLink Masuk: ${loginUrl}\n\n_Catatan: Harap segera ganti password saat login pertama kali._`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = (phone: string) => {
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    return p;
  };

  const handleSendWa = () => {
    if (!result?.credentials) return;
    const { username, temporaryPassword, contactPhone, loginUrl } = result.credentials;
    const text = encodeURIComponent(
      `Halo Pengelola ${result.village?.name},\n\nAkun portal desa wisata Anda telah terdaftar resmi di Disbudparekraf Jawa Tengah (Platform DEWI JATENG).\n\nBerikut rincian akun Anda:\n• Username: ${username}\n• Kata Sandi Sementara: ${temporaryPassword}\n• Tautan Masuk: ${loginUrl}\n\nSilakan masuk dan lakukan penggantian kata sandi berkala untuk mengelola dokumen LPJ bantuan serta menindaklanjuti aduan sarana publik warga.\n\nSalam,\nDisbudparekraf Provinsi Jawa Tengah`
    );
    window.open(`https://wa.me/${cleanPhone(contactPhone)}?text=${text}`, '_blank');
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      name: '',
      regency: 'Kabupaten Magelang',
      district: '',
      category: 'BERKEMBANG',
      latitude: -7.5,
      longitude: 110.2,
      pokdarwisName: '',
      contactPhone: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-[#080E21] to-[#0D2453] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daftarkan Desa Wisata Baru</h3>
              <p className="text-[11px] text-slate-300">
                Penerbitan entitas desa resmi & akun pengelola otomatis oleh Disbudparekraf Jateng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {result?.credentials ? (
            /* SUCCESS & CREDENTIALS VIEW */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Desa Wisata Berhasil Terdaftar!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Akun desa telah dibuat dengan hak akses pengelola dokumen LPJ dan penanganan aduan masyarakat.
                  </p>
                </div>
              </div>

              {/* Credentials Box */}
              <div className="p-5 rounded-2xl bg-[#080E21] text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Kredensial Akun Desa (Tampil Sekali)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    STATUS: AKTIF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">Nama Desa</span>
                    <span className="font-bold text-white text-sm">
                      {result.village?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">Wilayah</span>
                    <span className="font-medium text-slate-200">
                      {result.village?.regency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">Username Login</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 inline-block">
                      {result.credentials.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">Password Sementara</span>
                    <span className="font-mono font-bold text-amber-300 text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 inline-block">
                      {result.credentials.temporaryPassword}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Password di-hash bcrypt/pbkdf2 di server. Sistem akan meminta pengelola desa mengganti password saat login pertama kali.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>{copied ? 'Berhasil Disalin!' : 'Salin Kredensial'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWa}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Kirim via WhatsApp</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup dan Kembali ke Command Center
                </button>
              </div>
            </div>
          ) : (
            /* FORM INPUT VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Desa Wisata <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Desa Wisata Karangtengah"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kabupaten / Kota <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.regency}
                    onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    {KABUPATEN_KOTA_JATENG.map((kab) => (
                      <option key={kab} value={kab}>
                        {kab}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kecamatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kecamatan Borobudur"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Desa Wisata
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="RINTISAN">RINTISAN (Awal pembinaan)</option>
                    <option value="BERKEMBANG">BERKEMBANG (Mulai aktif)</option>
                    <option value="MAJU">MAJU (Sarana lengkap)</option>
                    <option value="MANDIRI">MANDIRI (Telah mandiri finansial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pokdarwis / Ketua Pengelola <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pokdarwis Manunggal Roso"
                      value={formData.pokdarwisName}
                      onChange={(e) =>
                        setFormData({ ...formData, pokdarwisName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp Pengelola (Untuk Penyerahan Akun) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Kredensial username dan password sementara dapat langsung dikirimkan ke nomor ini setelah pendaftaran selesai.
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D2453] to-blue-900 hover:from-blue-950 hover:to-blue-900 text-white text-xs font-bold shadow-md shadow-blue-950/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{loading ? 'Mendaftarkan & Menerbitkan Akun...' : 'Simpan & Terbitkan Akun'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
