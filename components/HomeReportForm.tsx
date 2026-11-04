'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  ChevronDown,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Search,
  Check,
  Navigation
} from 'lucide-react';

interface LocationCoord {
  lat: number;
  lng: number;
  displayName: string;
}

const KNOWN_LOCATIONS: Record<string, LocationCoord> = {
  pamularsih: {
    lat: -6.9928,
    lng: 110.3957,
    displayName: 'Jl. Pamularsih Raya, Bongsari, Semarang Barat, Kota Semarang',
  },
  'jl pamularsih': {
    lat: -6.9928,
    lng: 110.3957,
    displayName: 'Jl. Pamularsih Raya, Bongsari, Semarang Barat, Kota Semarang',
  },
  candirejo: {
    lat: -7.6186,
    lng: 110.2317,
    displayName: 'Desa Candirejo, Borobudur, Kabupaten Magelang',
  },
  borobudur: {
    lat: -7.6079,
    lng: 110.2038,
    displayName: 'Kawasan Wisata Borobudur, Kabupaten Magelang',
  },
  limpakuwus: {
    lat: -7.3197,
    lng: 109.2394,
    displayName: 'Desa Limpakuwus (The Geong), Sumbang, Kabupaten Banyumas',
  },
  getas: {
    lat: -7.1124,
    lng: 110.2831,
    displayName: 'Desa Wisata Getas (Tubing Genting), Singorojo, Kabupaten Kendal',
  },
  berjo: {
    lat: -7.6253,
    lng: 111.1278,
    displayName: 'Desa Berjo (Air Terjun Jumog), Ngargoyoso, Kabupaten Karanganyar',
  },
  dieng: {
    lat: -7.2062,
    lng: 109.9042,
    displayName: 'Desa Dieng Kulon, Batur, Kabupaten Banjarnegara',
  },
  semarang: {
    lat: -6.9932,
    lng: 110.4203,
    displayName: 'Kota Semarang, Jawa Tengah',
  },
  'simpang lima': {
    lat: -6.9904,
    lng: 110.4229,
    displayName: 'Simpang Lima, Kota Semarang',
  },
};

export default function HomeReportForm() {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const KATEGORI = ['Jalan & Akses', 'Fasilitas Wisata', 'Kebersihan', 'K3 & Keselamatan', 'Tarif & Retribusi', 'Lainnya'];

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.9928,
    lng: 110.3957,
  });
  const [locationLabel, setLocationLabel] = useState<string>(
    'Jl. Pamularsih Raya, Bongsari, Semarang Barat, Kota Semarang'
  );
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Leaflet Map on Client
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #EA4335; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #FFFFFF;">
              <svg style="width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        setLocationLabel(`Titik Pin GPS: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setLocationLabel(`Titik Pin GPS: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`
      );
      const data = await res.json();
      if (data?.display_name) {
        const short = data.display_name.split(',').slice(0, 4).join(',').trim();
        setAddress(short);
      }
    } catch {
      // keep existing address on network fail
    }
  };

  const triggerGps = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        moveMapTo(latitude, longitude, 16);
        setLocationLabel('Lokasi GPS Anda terdeteksi');
        await reverseGeocode(latitude, longitude);
        setIsGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setIsGpsLoading(false);
        alert('Gagal mengambil lokasi GPS. Izinkan akses lokasi di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const moveMapTo = (lat: number, lng: number, zoomLevel = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1.2 });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    setCoords({ lat, lng });
  };

  const handleGeocode = async (queryText: string) => {
    const clean = queryText.trim().toLowerCase();
    if (!clean) return;

    setIsSearchingMap(true);

    for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
      if (clean.includes(key)) {
        moveMapTo(val.lat, val.lng, 15);
        setLocationLabel(val.displayName);
        setIsSearchingMap(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          queryText + ', Jawa Tengah, Indonesia'
        )}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        moveMapTo(newLat, newLng, 15);
        setLocationLabel(item.display_name.split(',').slice(0, 3).join(', '));
      }
    } catch {
      // Keep map as is on network issue
    } finally {
      setIsSearchingMap(false);
    }
  };

  useEffect(() => {
    if (!address.trim()) return;
    const timer = setTimeout(() => {
      handleGeocode(address);
    }, 450);
    return () => clearTimeout(timer);
  }, [address]);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles((prev) => [...prev, file.name]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessTicket(`LP-JTG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 800);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 items-start">
        {/* ── Kolom Kiri ── */}
        <div className="flex flex-col gap-5">

          {/* Kategori pill selector */}
          <div>
            <span className="block text-xs text-[#64748B] font-medium mb-2.5">Kategori aduan</span>
            <div className="flex flex-wrap gap-2">
              {KATEGORI.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2 ${
                      active
                        ? 'bg-[#0D2453] border-[#0D2453] text-white'
                        : 'bg-[#F3F5F8] border-[#E6ECF5] text-[#0D2453] hover:bg-[#EDF3FC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Judul Laporan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="form-judul" className="text-sm font-medium text-[#0D2453]">
              Judul laporan
            </label>
            <input
              id="form-judul"
              type="text"
              required
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              placeholder="Contoh: Pohon tumbang di jalur wisata"
              className="w-full bg-[#F3F5F8] border border-[#E6ECF5] rounded-[12px] px-4 py-3 text-sm text-[#0D2453] placeholder:text-[#A0AEC0] focus:ring-2 focus:ring-[#0D2453]/20 focus:border-[#0D2453]/40 focus:outline-none font-normal transition-colors"
            />
          </div>

          {/* Alamat Lokasi — auto-isi dari GPS */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="form-alamat" className="text-sm font-medium text-[#0D2453]">
                Alamat lokasi
              </label>
              {isSearchingMap && (
                <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Mencari...
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="form-alamat"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama Desa, Kecamatan, Kabupaten"
                className="w-full bg-[#F3F5F8] border border-[#E6ECF5] rounded-[12px] px-4 py-3 pr-10 text-sm text-[#0D2453] placeholder:text-[#A0AEC0] focus:ring-2 focus:ring-[#0D2453]/20 focus:border-[#0D2453]/40 focus:outline-none font-normal transition-colors"
              />
              <Search className="w-4 h-4 text-[#A0AEC0] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="form-desc" className="text-sm font-medium text-[#0D2453]">
              Deskripsi
            </label>
            <div className="relative">
              <textarea
                id="form-desc"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                placeholder="Tuliskan kondisi, lokasi tepat, dan waktu kejadian"
                className="w-full bg-[#F3F5F8] border border-[#E6ECF5] rounded-[12px] px-4 py-3 text-sm text-[#0D2453] placeholder:text-[#A0AEC0] focus:ring-2 focus:ring-[#0D2453]/20 focus:border-[#0D2453]/40 focus:outline-none resize-none font-normal transition-colors"
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] text-[#A0AEC0] font-mono select-none">
                {description.length}/300
              </span>
            </div>
          </div>

          {/* Anonim + Submit */}
          <div className="flex items-center justify-between pt-1">
            <label htmlFor="anon-check" className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                id="anon-check"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0D2453] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2"
              />
              <span className="text-sm text-[#64748B] font-normal group-hover:text-[#0D2453] transition-colors">
                Laporan anonim / privat
              </span>
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-sm transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Laporan</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Kolom Kanan: Peta ── */}
        <div className="flex flex-col gap-3">
          {/* Label peta — klik untuk trigger GPS */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={triggerGps}
              className="flex items-center gap-1.5 text-sm font-medium text-[#0D2453] hover:text-[#1a3a7a] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2 rounded"
              title="Ketuk label untuk gunakan GPS"
            >
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              Tandai di Peta
            </button>
            <button
              type="button"
              onClick={triggerGps}
              disabled={isGpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF3FC] hover:bg-[#DCE7F5] text-[#0D2453] text-[11px] font-semibold border border-[#CBD5E1] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0D2453] focus-visible:outline-offset-2"
              title="Gunakan lokasi GPS saat ini"
            >
              {isGpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{isGpsLoading ? 'Mendeteksi...' : 'Gunakan Lokasi Saya'}</span>
            </button>
          </div>

          {/* Peta */}
          <div className="relative w-full h-[260px] rounded-[16px] overflow-hidden border border-[#E6ECF5] bg-[#E8ECEF]">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            <p className="absolute top-2.5 left-2.5 z-10 text-[10px] bg-white/90 backdrop-blur-xs rounded-lg px-2 py-1 text-[#64748B] border border-slate-200/60 select-none">
              Ketuk peta untuk pindah pin
            </p>
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="text-[11px] text-[#0D2453] font-semibold truncate">{locationLabel}</span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono shrink-0 hidden sm:inline">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Upload bukti */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-sm font-medium text-[#0D2453]">Foto / video bukti</span>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#CBD5E1] hover:border-[#0D2453]/40 rounded-[14px] h-[130px] bg-[#F7F9FC] hover:bg-[#EDF3FC]/40 cursor-pointer transition-colors group focus-within:border-[#0D2453]/50">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileDrop}
                className="sr-only"
              />
              <UploadCloud className="w-7 h-7 text-[#94A3B8] group-hover:text-[#0D2453] transition-colors" />
              <span className="text-xs text-[#64748B] group-hover:text-[#0D2453] transition-colors font-medium">
                Unggah foto / video
              </span>
              <span className="text-[10px] text-[#A0AEC0]">JPG, PNG, MP4 — maks 5 MB, 3 file</span>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {uploadedFiles.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDF3FC] text-[#0D2453] text-[11px] font-medium border border-[#CBD5E1]"
                  >
                    <FileCheck2 className="w-3 h-3" />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {successTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-slate-100"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#0D2453]">
                  Laporan Berhasil Diterbitkan!
                </h3>
                <p className="text-xs sm:text-sm text-[#767676] mt-1.5 leading-relaxed">
                  Laporan Anda telah tercatat di buku register desa wisata dan diteruskan ke perangkat desa pengelola.
                </p>
              </div>

              <div className="p-3.5 bg-[#F7F9FC] rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">
                  KODE PELAPORAN RESMI:
                </span>
                <span className="text-base font-extrabold text-[#0D2453] tracking-wider font-mono">
                  {successTicket}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/lapor?code=${successTicket}`}
                  className="w-full py-3 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm transition-all text-center"
                >
                  Pantau Status Laporan
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(successTicket);
                    alert('Kode tiket berhasil disalin!');
                  }}
                  className="w-full py-3 rounded-xl bg-white border border-[#0D2453] text-[#0D2453] font-bold text-xs sm:text-sm transition-all hover:bg-slate-50"
                >
                  Salin Kode Tiket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
