'use client';

import React, { useEffect, useState } from 'react';
import { Landmark, ShieldCheck, MapPin, Award } from 'lucide-react';

interface VillageProfile {
  name: string;
  slug: string;
  regency: string;
  district: string;
  category: string;
  pokdarwis_name: string;
  trust_score: number;
}

interface Tariff {
  id: string;
  item_name: string;
  tariff_type: string;
  price: string | number;
}

function formatRupiah(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ProfilDesaView() {
  const [village, setVillage] = useState<VillageProfile | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/transparansi?fiscal_year=2026')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success && json.data?.village) {
          setVillage(json.data.village);
          setTariffs(Array.isArray(json.data.tariffs) ? json.data.tariffs : []);
        } else {
          setError('Data profil desa belum tersedia.');
        }
      })
      .catch((err) => {
        console.error('[ProfilDesaView]', err);
        if (!cancelled) setError('Gagal memuat profil desa.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <div className="flex flex-col gap-[7px] w-full">
        <h1 className="text-[#0d2453] text-[28px] font-semibold tracking-[-0.7px] leading-normal">
          Profil desa
        </h1>
        <p className="text-[#64748b] text-[13px] font-normal leading-[1.5]">
          Identitas desa wisata dan tarif resmi yang dipublikasikan ke portal publik.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] shadow-xs text-[#64748b] text-[13px]">
          Memuat profil desa...
        </div>
      ) : error || !village ? (
        <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] shadow-xs text-[#64748b] text-[13px]">
          {error || 'Data profil desa belum tersedia.'}
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px]">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-[20px] h-[20px] text-[#0d2453]" />
              <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
                Identitas desa wisata
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Nama desa</span>
                <span className="text-[#0d2453] text-[15px] font-semibold">{village.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Kategori</span>
                <span className="text-[#0d2453] text-[15px] font-semibold">
                  {village.category || '-'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Kecamatan</span>
                <span className="text-[#0d2453] text-[13px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#64748b]" />
                  {village.district || '-'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Kabupaten</span>
                <span className="text-[#0d2453] text-[13px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#64748b]" />
                  {village.regency || '-'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Pokdarwis</span>
                <span className="text-[#0d2453] text-[13px]">
                  {village.pokdarwis_name || '-'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#64748b] text-[11px] uppercase tracking-wide">Trust score</span>
                <span className="text-[#0d2453] text-[13px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#64748b]" />
                  {village.trust_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e6ecf5] rounded-[16px] p-[24px] shadow-xs flex flex-col gap-[18px]">
            <h2 className="text-[#0d2453] text-[17px] font-semibold leading-[1.5]">
              Tarif resmi
            </h2>
            {tariffs.length === 0 ? (
              <p className="text-[#64748b] text-[13px]">Belum ada tarif resmi yang dipublikasikan.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[480px] flex flex-col">
                  <div className="bg-[#f3f5f8] rounded-t-[8px] p-[14px] flex items-center gap-[20px] text-[#64748b] text-[13px]">
                    <div className="flex-1">Item</div>
                    <div className="w-[160px] shrink-0">Jenis</div>
                    <div className="w-[160px] shrink-0">Tarif</div>
                  </div>
                  {tariffs.map((t) => (
                    <div
                      key={t.id}
                      className="border-b border-[#e6ecf5] px-[14px] py-[14px] flex items-center gap-[20px] text-[#0d2453] text-[13px]"
                    >
                      <div className="flex-1 font-semibold">{t.item_name}</div>
                      <div className="w-[160px] shrink-0 text-[#64748b]">{t.tariff_type}</div>
                      <div className="w-[160px] shrink-0 font-mono">{formatRupiah(t.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#edf3fc] rounded-[10px] p-[16px] flex items-start gap-[10px]">
            <ShieldCheck className="w-[18px] h-[18px] text-[#0d2453] shrink-0 mt-0.5" />
            <p className="text-[#0d2453] text-[13px] normal leading-[1.5]">
              Perubahan identitas dan tarif resmi dikelola oleh Dinas Pariwisata Provinsi. Halaman ini
              bersifat baca-saja bagi pengelola desa.
            </p>
          </div>
        </>
      )}
    </div>
  );
}