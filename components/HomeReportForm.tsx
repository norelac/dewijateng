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
  AlertCircle,
  Navigation,
  X
} from 'lucide-react';
import { submitReportAction } from '@/app/actions/reportActions';
import { convertImageToWebP } from '@/lib/utils/imageOptimizer';

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
  const [address, setAddress] = useState('Nama Desa, Kecamatan, Kabupaten');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  const [villages, setVillages] = useState<Array<{ id: string; name: string; regency: string }>>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isReverseGeocodingRef = useRef<boolean>(false);

  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await fetch('/api/villages');
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : json.data?.villages || [];
        if (json.success && list.length > 0) {
          setVillages(list);
        }
      } catch (err) {
        console.warn('Gagal mengambil daftar desa:', err);
      }
    }
    loadVillages();
  }, []);

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
        setLocationLabel('Mencari alamat...');
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setLocationLabel('Mencari alamat...');
        reverseGeocode(e.latlng.lat, e.latlng.lng);
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

  const moveMapTo = (lat: number, lng: number, zoomLevel = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1.2 });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    setCoords({ lat, lng });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const road = a.road || a.pedestrian || a.suburb || a.hamlet || a.neighbourhood || '';
        const village = a.village || a.town || a.municipality || a.city_district || '';
        const city = a.city || a.county || a.regency || a.state_district || '';
        const parts = [road, village, city].filter(Boolean);
        const resolvedName =
          parts.length > 0
            ? parts.join(', ')
            : (data.display_name?.split(',').slice(0, 3).join(', ') || '');
        if (resolvedName) {
          isReverseGeocodingRef.current = true;
          setAddress(resolvedName);
          setLocationLabel(resolvedName);
          return;
        }
      }
    } catch {
      // fallback jika jaringan offline
    }
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    isReverseGeocodingRef.current = true;
    setAddress(`Lokasi Terpilih (${fallback})`);
    setLocationLabel(`Lokasi (${fallback})`);
  };

  const handleGeocode = async (queryText: string) => {
    const clean = queryText.trim().toLowerCase();
    if (!clean || clean === 'nama desa, kecamatan, kabupaten') return;

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
    if (isReverseGeocodingRef.current) {
      isReverseGeocodingRef.current = false;
      return;
    }
    if (!address.trim() || address === 'Nama Desa, Kecamatan, Kabupaten') return;
    const timer = setTimeout(() => {
      handleGeocode(address);
    }, 450);
    return () => clearTimeout(timer);
  }, [address]);

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Fitur geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    setIsSearchingMap(true);
    setErrorMessage(null);
    setLocationLabel('Mencari alamat...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        moveMapTo(latitude, longitude, 16);
        await reverseGeocode(latitude, longitude);
        setIsSearchingMap(false);
      },
      (err) => {
        setIsSearchingMap(false);
        setErrorMessage('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif atau pilih manual pada peta.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const MAX_FILE_BYTES = 15 * 1024 * 1024; // Mendukung foto kamera resolusi tinggi (akan otomatis dikompresi ke WebP)
    const MAX_FILES = 3;
    const incoming = Array.from(e.target.files);

    const tooBig = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setErrorMessage(`Berkas "${tooBig.name}" melebihi batas 15 MB per file.`);
      e.target.value = '';
      return;
    }

    const room = MAX_FILES - rawFiles.length;
    if (room <= 0) {
      setErrorMessage(`Maksimal ${MAX_FILES} berkas bukti.`);
      e.target.value = '';
      return;
    }

    const accepted = incoming.slice(0, room);
    if (incoming.length > room) {
      setErrorMessage(`Hanya ${room} berkas lagi yang dapat ditambahkan (maks ${MAX_FILES}).`);
    }

    // Auto-convert gambar ke format WebP ringan sebelum submit
    const optimizedPromises = accepted.map(async (f) => {
      if (f.type.startsWith('image/')) {
        return await convertImageToWebP(f);
      }
      return f;
    });

    const optimizedFiles = await Promise.all(optimizedPromises);
    setRawFiles((prev) => [...prev, ...optimizedFiles]);
    setUploadedFiles((prev) => [...prev, ...optimizedFiles.map((f) => f.name)]);
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setRawFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = selectedTitle.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle || cleanTitle.length < 5) {
      setErrorMessage('Judul laporan minimal 5 karakter (contoh: "Akses jalan wisata rusak").');
      return;
    }

    if (!cleanDesc || cleanDesc.length < 10) {
      setErrorMessage('Rincian deskripsi aduan minimal 10 karakter agar petugas dapat mengidentifikasi masalah.');
      return;
    }

    setIsSubmitting(true);

    // Buat AbortController baru untuk request ini
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('title', cleanTitle);

      // Kategori otomatis berdasarkan judul
      let category = 'FASILITAS_RUSAK';
      const lowerTitle = cleanTitle.toLowerCase();
      if (lowerTitle.includes('kotor') || lowerTitle.includes('sampah')) {
        category = 'KEBERSIHAN';
      } else if (lowerTitle.includes('pungli') || lowerTitle.includes('tarif') || lowerTitle.includes('parkir liar')) {
        category = 'PUNGLI';
      } else if (lowerTitle.includes('goyang') || lowerTitle.includes('bahaya') || lowerTitle.includes('k3') || lowerTitle.includes('patah')) {
        category = 'BAHAYA_K3';
      }

      formData.append('category', category);
      formData.append('description', cleanDesc);
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('is_anonymous', isAnonymous ? 'true' : 'false');

      // Tentukan village_id jika ada kecocokan eksplisit dari alamat/lokasi
      let targetVillageId = selectedVillageId;
      if (!targetVillageId && villages.length > 0) {
        const searchPool = (address + ' ' + locationLabel).toLowerCase();
        const matched = villages.find((v) => {
          const simplifiedName = v.name.toLowerCase().replace(/desa\s+(wisata\s+)?/, '').trim();
          return simplifiedName.length > 3 && searchPool.includes(simplifiedName);
        });
        if (matched) {
          targetVillageId = matched.id;
        }
      }
      if (targetVillageId) {
        formData.append('village_id', targetVillageId);
      }

      if (rawFiles.length > 0) {
        formData.append('photo', rawFiles[0]);
      }

      const res = await submitReportAction(formData);

      // Cek apakah request di-abort
      if (abortControllerRef.current?.signal.aborted) {
        setErrorMessage('Pengiriman laporan dibatalkan.');
        return;
      }

      if (res.success && res.data) {
        setSuccessTicket(res.data.reportCode);
        setSelectedTitle('');
        setDescription('');
        setUploadedFiles([]);
        setRawFiles([]);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.error || 'Gagal mengirimkan laporan aduan. Silakan coba lagi.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        setErrorMessage('Pengiriman laporan dibatalkan.');
      } else {
        setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memproses laporan aduan.');
      }
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSubmit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (579px in Figma) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Judul Laporan */}
          <div>
            <label className="block text-sm sm:text-[17px] text-black font-normal mb-2">
              Judul Laporan
            </label>
            <input
              type="text"
              required
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              placeholder="Contoh: Pohon tumbang"
              className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 text-xs sm:text-sm text-[#0D2453] placeholder:text-[#767676] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none font-medium"
            />
          </div>

          {/* Alamat Lokasi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm sm:text-[17px] text-black font-normal">
                Alamat Lokasi
              </label>
              {isSearchingMap ? (
                <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Mencari...
                </span>
              ) : null}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onFocus={() => {
                  if (address === 'Nama Desa, Kecamatan, Kabupaten') setAddress('');
                }}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama Desa, Kecamatan, Kabupaten"
                className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 pr-10 text-xs sm:text-sm text-[#0D2453] placeholder:text-[#767676] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tandai di Peta */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm sm:text-[17px] text-black font-normal">
                Tandai di Peta
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0D2453] text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                title="Gunakan lokasi GPS saya saat ini"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-700" />
                <span>Gunakan Lokasi Saya</span>
              </button>
            </div>

            <div className="relative w-full h-[244px] rounded-[17px] overflow-hidden border border-[#EBEBEB] bg-[#E8ECEF] shadow-2xs">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Status Pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs rounded-xl px-3 py-1.5 border border-slate-200/80 shadow-md flex items-center justify-between gap-2 text-xs">
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

        {/* Vertical Divider in Figma */}
        <div className="hidden lg:block lg:col-span-1 self-stretch flex justify-center">
          <div className="w-px h-full bg-[#EBEBEB] mx-auto" />
        </div>

        {/* Right Column (572px in Figma) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Deskripsi */}
          <div>
            <label className="block text-sm sm:text-[17px] text-black font-normal mb-2">
              Deskripsi
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan deskripsi aduan"
              className="w-full bg-[#EBEBEB] border border-[#F5F5F5] rounded-[15px] px-4 py-3 h-[101px] text-xs sm:text-sm text-[#0D2453] placeholder:text-[#767676] focus:ring-1 focus:ring-[#0D2453]/30 focus:outline-none resize-none font-medium"
            />
          </div>

          {/* Foto / Video Bukti */}
          <div>
            <label className="block text-sm sm:text-[17px] text-black font-normal mb-2">
              Foto / Video Bukti
            </label>
            <label className="border border-dashed border-[#0D2453] rounded-[9px] h-[175px] p-4 text-center bg-white cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center justify-center block">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileDrop}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-[#0D2453]" />
              <span className="text-[15px] font-semibold text-[#0D2453] mt-2 block">
                Unggah Foto / Video
              </span>
              <span className="text-[13px] text-[#767676] mt-0.5 block leading-tight">
                JPG, PNG, WEBP, MP4, MOV (maks 5 MB per file,<br />maksimal 3 file)
              </span>
            </label>

            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uploadedFiles.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="max-w-[180px] sm:max-w-[240px] truncate">{name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(i);
                      }}
                      className="p-0.5 hover:bg-blue-200/80 rounded-full text-blue-900 transition-colors cursor-pointer"
                      title="Hapus berkas"
                      aria-label={`Hapus berkas ${name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox Anonim / Privat */}
          <div className="flex items-center gap-3 pt-1">
            <input
              id="anon-check"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded bg-[#2D68FE] text-[#2D68FE] accent-[#2D68FE] cursor-pointer"
            />
            <label htmlFor="anon-check" className="text-sm sm:text-[16px] text-[#181818] font-normal cursor-pointer select-none">
              Laporan Anonim / Privat
            </label>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-[14px] bg-[#0D2453] hover:bg-[#132d66] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
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
            {isSubmitting && (
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="px-5 py-3 rounded-[14px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
              >
                Batal
              </button>
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
                  KODE RESMI DISPOSISI:
                </span>
                <span className="text-base font-extrabold text-[#0D2453] tracking-wider font-mono">
                  {successTicket}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Link
                  href={`/lapor?code=${successTicket}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Telusuri Status Aduan</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessTicket(null);
                    setSelectedTitle('');
                    setDescription('');
                    setUploadedFiles([]);
                    setRawFiles([]);
                  }}
                  className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
