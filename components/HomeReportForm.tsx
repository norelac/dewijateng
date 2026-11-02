'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  ChevronDown,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Search,
  Check
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
  const [address, setAddress] = useState('Jl. Pamularsih Raya, Semarang Barat');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.9928,
    lng: 110.3957,
  });
  const [locationLabel, setLocationLabel] = useState<string>(
    'Jl. Pamularsih Raya, Bongsari, Semarang Barat, Kota Semarang'
  );
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);

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

      // Create Leaflet Map centered on Pamularsih / Jateng
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom Red Pin Marker
      const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #EA4335; width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #FFFFFF;">
              <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
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

  // Update map position and marker when coords change
  const moveMapTo = (lat: number, lng: number, zoomLevel = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, {
        duration: 1.2,
      });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    setCoords({ lat, lng });
  };

  // Dynamic geocoding when user types an address
  const handleGeocode = async (queryText: string) => {
    const clean = queryText.trim().toLowerCase();
    if (!clean) return;

    setIsSearchingMap(true);

    // 1. Instant check in local dictionary (e.g. pamularsih, candirejo, limpakuwus)
    for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
      if (clean.includes(key)) {
        moveMapTo(val.lat, val.lng, 16);
        setLocationLabel(val.displayName);
        setIsSearchingMap(false);
        return;
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim API for general addresses
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
      } else {
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            queryText
          )}`
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.length > 0) {
          const item = fallbackData[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          moveMapTo(newLat, newLng, 15);
          setLocationLabel(item.display_name.split(',').slice(0, 3).join(', '));
        }
      }
    } catch {
      // Keep existing map position if offline or network error
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Debounced input search
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
      setSuccessTicket(`DS-JTG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 800);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Judul Laporan */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Judul Laporan
            </label>
            <div className="relative">
              <select
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                required
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer font-medium"
              >
                <option value="" disabled>Contoh: Pohon tumbang</option>
                <option value="Akses ke curug buruk">Akses ke curug buruk &amp; pagar pengaman lapuk</option>
                <option value="Wastafel dan toilet kotor sekali">Wastafel dan toilet kotor sekali / kran mati</option>
                <option value="Pungli parkir liar">Pungutan liar parkir tanpa karcis resmi BUMDes</option>
                <option value="Jembatan goyang">Jembatan titian kayu goyang dan berbahaya</option>
                <option value="Tumpukan sampah">Tumpukan sampah plastik di area gardu pandang</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Alamat Lokasi (Interactive Address Input) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0D2453]">
                Alamat Lokasi
              </label>
              {isSearchingMap ? (
                <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Mencari di peta...
                </span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Peta terhubung
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ketik alamat (contoh: pamularsih, candirejo, dll)"
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 pr-10 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#0D2453] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tandai di Peta: Live Leaflet / OpenStreetMap Pin Map */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0D2453]">
                Tandai di Peta (Geser atau klik lokasi pada peta)
              </label>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative w-full h-[260px] rounded-2xl overflow-hidden border border-[#EBEBEB] bg-[#E8ECEF] shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map Floating Status Pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs rounded-xl px-3 py-2 border border-slate-200/80 shadow-md flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="text-[#0D2453] font-semibold truncate text-[11px]">
                    {locationLabel}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden sm:inline">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (No awkward stretched empty gaps) */}
        <div className="space-y-4">
          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Deskripsi
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan deskripsi aduan"
              className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none resize-none font-medium"
            />
          </div>

          {/* Foto / Video Bukti Dropzone */}
          <div>
            <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
              Foto / Video Bukti
            </label>
            <label className="border-2 border-dashed border-[#C1C1C1] hover:border-[#0D2453] rounded-2xl p-5 text-center bg-white cursor-pointer transition-colors flex flex-col items-center justify-center block">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileDrop}
                className="hidden"
              />
              <UploadCloud className="w-7 h-7 text-[#0D2453]" />
              <span className="text-xs font-bold text-[#0D2453] mt-1.5 block">
                Unggah Foto / Video
              </span>
              <span className="text-[11px] text-[#767676] mt-0.5 block">
                JPG, PNG, WEBP, MP4, MOV (maks 5 MB per file, maksimal 3 file)
              </span>
            </label>

            {/* Uploaded File Previews */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadedFiles.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox Laporan Anonim / Privat */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="anon-check"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-[#0D2453] accent-[#0D2453] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="anon-check" className="text-xs font-bold text-[#0D2453] cursor-pointer">
              Laporan Anonim / Privat
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Laporan...</span>
              </>
            ) : (
              <span>Laporkan</span>
            )}
          </button>
        </div>
      </form>

      {/* Submission Success Dialog */}
      <AnimatePresence>
        {successTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0D2453]">Laporan Berhasil Diterbitkan!</h3>
                <p className="text-xs text-[#767676] mt-1">
                  Aduan Anda telah tercatat pada sistem monitoring Pemprov Jateng dan diteruskan ke pengelola desa terkait.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#EBEBEB]">
                <span className="text-[11px] font-bold text-[#767676] uppercase tracking-wider block">
                  Nomor Tiket Aduan Publik
                </span>
                <span className="font-mono text-xl font-extrabold text-[#0D2453] block mt-1">
                  {successTicket}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSuccessTicket(null);
                  setSelectedTitle('');
                  setDescription('');
                  setUploadedFiles([]);
                }}
                className="w-full py-3 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs transition-colors"
              >
                Selesai &amp; Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
