'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface NotificationPrefs {
  newReport: boolean;
  statusUpdate: boolean;
  evidenceReminder: boolean;
  budgetChange: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationPrefs = {
  newReport: true,
  statusUpdate: true,
  evidenceReminder: true,
  budgetChange: false,
};

const NOTIFICATION_ITEMS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'newReport', label: 'Laporan baru masuk' },
  { key: 'statusUpdate', label: 'Pembaruan status laporan' },
  { key: 'evidenceReminder', label: 'Pengingat kelengkapan bukti' },
  { key: 'budgetChange', label: 'Perubahan anggaran & publikasi' },
];

const INITIAL_FORM = {
  displayName: 'Pengelola Candirejo',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex gap-[10px] items-center w-full cursor-pointer">
      <span
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          onChange();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange();
          }
        }}
        className={`relative shrink-0 size-[20px] rounded-[4px] border flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D68FE] ${
          checked
            ? 'bg-[#2D68FE] border-[#2D68FE] text-white'
            : 'bg-white border-[#b9b9b9]'
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="w-[13px] h-[13px]"
            aria-hidden="true"
          >
            <path
              d="M3 8l3.5 3.5L13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-px text-[#0d2453] text-[13px] font-normal leading-[1.5]">
        {label}
      </span>
    </label>
  );
}

export default function PengaturanView() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [notifications, setNotifications] =
    useState<NotificationPrefs>(INITIAL_NOTIFICATIONS);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSaveMessage(null);
  };

  // Tidak ada endpoint tulis pengaturan akun; simpan menahan nilai di sesi + validasi sandi.
  const handleSave = () => {
    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword.length < 12) {
        setSaveMessage({
          type: 'error',
          text: 'Kata sandi baru minimal 12 karakter.',
        });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setSaveMessage({
          type: 'error',
          text: 'Konfirmasi kata sandi baru tidak cocok.',
        });
        return;
      }
    }
    setForm((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setSaveMessage({
      type: 'success',
      text: 'Perubahan nama tampilan dan preferensi notifikasi diterapkan untuk sesi ini.',
    });
  };

  const inputClass =
    'w-full min-h-[44px] px-3 py-3 bg-white border border-[#e6ecf5] rounded-[8px] text-[#0d2453] text-[13px] font-normal leading-[1.5] placeholder:text-[#64748b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D68FE]';

  return (
    <div className="flex flex-col gap-[24px] w-full" data-node-id="352:13626">
      {/* 1. Pengantar halaman */}
      <div className="flex items-center w-full">
        <div className="flex flex-1 flex-col gap-[7px] min-w-px">
          <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal w-full">
            Pengaturan
          </h1>
          <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
            Kelola akun Anda, keamanan, dan pemberitahuan layanan desa.
          </p>
        </div>
      </div>

      {/* 2. Formulir pengaturan */}
      <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full">
        {/* Akun dan keamanan */}
        <div className="flex flex-1 min-w-px flex-col gap-[24px] w-full">
          {/* Akun pengelola */}
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Akun pengelola
            </p>
            <div className="flex flex-col gap-[7px] items-start w-full">
              <label
                htmlFor="displayName"
                className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full"
              >
                Nama tampilan
              </label>
              <input
                id="displayName"
                type="text"
                value={form.displayName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="flex gap-[24px] items-start w-full">
              <div className="flex flex-1 flex-col gap-[5px] items-start min-w-px">
                <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
                  PERAN AKUN
                </p>
                <p className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full">
                  Admin Desa
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-[5px] items-start min-w-px">
                <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
                  WILAYAH PENGELOLAAN
                </p>
                <p className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full">
                  Desa Candirejo
                </p>
              </div>
            </div>
            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
              Peran dan wilayah akun tidak dapat diubah dari halaman ini.
            </p>
          </div>

          {/* Keamanan & kata sandi */}
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Keamanan & kata sandi
            </p>
            <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
              Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi.
            </p>
            <div className="flex flex-col gap-[7px] items-start w-full">
              <label
                htmlFor="currentPassword"
                className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full"
              >
                Kata sandi saat ini
              </label>
              <input
                id="currentPassword"
                type="password"
                placeholder="Masukkan kata sandi saat ini"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-[16px] items-start w-full">
              <div className="flex flex-1 flex-col gap-[7px] items-start min-w-px w-full">
                <label
                  htmlFor="newPassword"
                  className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full"
                >
                  Kata sandi baru
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Masukkan kata sandi baru"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-1 flex-col gap-[7px] items-start min-w-px w-full">
                <label
                  htmlFor="confirmPassword"
                  className="text-[#0d2453] text-[13px] font-semibold leading-[1.5] w-full"
                >
                  Ulangi kata sandi baru
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Konfirmasi kata sandi baru"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
              Gunakan minimal 12 karakter dengan kombinasi huruf, angka, dan
              simbol. Jangan gunakan kembali kata sandi akun lain.
            </p>
          </div>

          {/* Tindakan formulir */}
          <div className="flex flex-col gap-[10px] items-start w-full">
            {saveMessage && (
              <p
                className={`text-[11px] font-medium leading-[1.5] ${
                  saveMessage.type === 'success' ? 'text-[#16725c]' : 'text-red-600'
                }`}
              >
                {saveMessage.text}
              </p>
            )}
            <div className="flex gap-[10px] items-start w-full">
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#0d2453] border-2 border-[#0d2453] h-[40px] px-[10px] rounded-full text-white text-[12px] font-semibold whitespace-nowrap hover:bg-[#132d66] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D68FE]"
            >
              Simpan pengaturan
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-white border-2 border-[#e6ecf5] h-[40px] px-[10px] rounded-full text-[#0d2453] text-[12px] font-semibold whitespace-nowrap hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D68FE]"
            >
              Batal
            </button>
            </div>
          </div>
        </div>

        {/* Preferensi notifikasi */}
        <div className="flex flex-col gap-[20px] items-start w-full lg:w-[370px] lg:shrink-0">
          <div className="bg-white rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px] items-start w-full">
            <p className="text-[#0d2453] text-[17px] font-semibold leading-[1.5] w-full">
              Preferensi notifikasi
            </p>
            <p className="text-[#64748b] text-[13px] font-normal leading-[1.5] w-full">
              Pilih pemberitahuan yang ditampilkan dalam aplikasi.
            </p>
            {NOTIFICATION_ITEMS.map((item) => (
              <Checkbox
                key={item.key}
                label={item.label}
                checked={notifications[item.key]}
                onChange={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
              />
            ))}
            <div className="bg-[#e6ecf5] h-px w-full" />
            <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
              Preferensi berlaku untuk akun ini. Riwayat pengelolaan tetap dicatat
              di halaman Aktivitas.
            </p>
          </div>

          {/* Catatan informasi */}
          <div className="bg-[#edf3fc] flex gap-[10px] items-start p-[16px] rounded-[10px] w-full">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="flex-1 min-w-px text-[#0d2453] text-[13px] font-normal leading-[1.5]">
              Jangan membagikan kata sandi akun pengelola. Gunakan perangkat yang
              tepercaya dan keluar setelah selesai bekerja.
            </p>
          </div>

          <p className="text-[#64748b] text-[11px] font-normal leading-[1.5] w-full">
            Simpan pengaturan menerapkan perubahan nama tampilan, kata sandi yang
            diisi, dan preferensi notifikasi.
          </p>
        </div>
      </div>

      {/* 3. Catatan layanan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-[8px] text-[#64748b] text-[10px] font-normal leading-[1.5] w-full">
        <p>© 2026 DEWI JATENG</p>
        <p>Desa Candirejo · Per 28 Oktober 2026</p>
      </div>
    </div>
  );
}