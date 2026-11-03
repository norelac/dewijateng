'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  MapPin,
  UploadCloud,
  Search,
  ChevronDown,
  ArrowUpRight,
  Lock,
  FileCheck2,
  X,
  Copy,
  Check,
  AlertTriangle,
  Landmark,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface LocationCoord {
  lat: number;
  lng: number;
  displayName: string;
}

const KNOWN_LOCATIONS: Record<string, LocationCoord> = {
  candirejo: {
    lat: -7.6186,
    lng: 110.2317,
    displayName: 'Desa Wisata Candirejo, Borobudur, Kabupaten Magelang',
  },
  magelang: {
    lat: -7.6186,
    lng: 110.2317,
    displayName: 'Desa Wisata Candirejo, Borobudur, Kabupaten Magelang',
  },
  limpakuwus: {
    lat: -7.3197,
    lng: 109.2394,
    displayName: 'Desa Limpakuwus (The Geong), Sumbang, Kabupaten Banyumas',
  },
  banyumas: {
    lat: -7.3197,
    lng: 109.2394,
    displayName: 'Desa Limpakuwus (The Geong), Sumbang, Kabupaten Banyumas',
  },
  getas: {
    lat: -7.1124,
    lng: 110.2831,
    displayName: 'Desa Wisata Getas (Tubing Genting), Singorojo, Kabupaten Kendal',
  },
  kendal: {
    lat: -7.1124,
    lng: 110.2831,
    displayName: 'Desa Wisata Getas (Tubing Genting), Singorojo, Kabupaten Kendal',
  },
  berjo: {
    lat: -7.6253,
    lng: 111.1278,
    displayName: 'Desa Berjo (Air Terjun Jumog), Ngargoyoso, Kabupaten Karanganyar',
  },
  karanganyar: {
    lat: -7.6253,
    lng: 111.1278,
    displayName: 'Desa Berjo (Air Terjun Jumog), Ngargoyoso, Kabupaten Karanganyar',
  },
  dieng: {
    lat: -7.2062,
    lng: 109.9042,
    displayName: 'Desa Dieng Kulon, Batur, Kabupaten Banjarnegara',
  },
  banjarnegara: {
    lat: -7.2062,
    lng: 109.9042,
    displayName: 'Desa Dieng Kulon, Batur, Kabupaten Banjarnegara',
  },
  wonosobo: {
    lat: -7.3601,
    lng: 109.9015,
    displayName: 'Kawasan Wisata Telaga Menjer, Garung, Kabupaten Wonosobo',
  },
  pamularsih: {
    lat: -6.9928,
    lng: 110.3957,
    displayName: 'Jl. Pamularsih Raya, Bongsari, Semarang Barat, Kota Semarang',
  },
};

const CATEGORIES = [
  {
    id: 'pungli',
    label: 'Pungutan Liar & Tarif Wisata',
    sla: '24 Jam Kerja',
    slaType: 'urgent',
    desc: 'Getok harga tiket masuk, karcis parkir tak resmi, atau pungutan tanpa dasar hukum.',
  },
  {
    id: 'fasilitas',
    label: 'Kerusakan Fasilitas Fisik',
    sla: '7 Hari Kerja',
    slaType: 'standard',
    desc: 'Akses jalan berlubang, pagar pengaman ambrol, jembatan retak, atau sarana umum rusak.',
  },
  {
    id: 'k3',
    label: 'Bahaya Keselamatan (K3)',
    sla: '48 Jam Kerja',
    slaType: 'urgent',
    desc: 'Wahana tanpa sertifikasi uji kelayakan, titik rawan longsor tanpa rambu, atau nihil P3K.',
  },
  {
    id: 'sanitasi',
    label: 'Sanitasi & Kebersihan',
    sla: '7 Hari Kerja',
    slaType: 'standard',
    desc: 'Toilet mampet tidak terawat, air tidak mengalir, atau tumpukan sampah di area wisata.',
  },
  {
    id: 'keuangan',
    label: 'Penyalahgunaan Dana Desa',
    sla: '14 Hari Kerja',
    slaType: 'audit',
    desc: 'Proyek fisik fiktif, belanja material tak sesuai nota kasir, atau dana mangkrak.',
  },
];

const SAMPLE_TICKETS: Record<string, {
  code: string;
  category: string;
  title: string;
  location: string;
  submittedAt: string;
  status: 'Selesai' | 'Sedang Ditindaklanjuti';
  slaDeadline: string;
  steps: { title: string; date: string; done: boolean; desc: string }[];
  villageLink?: string;
}> = {
  'DS-JTG-2026-0891': {
    code: 'DS-JTG-2026-0891',
    category: 'Akses & Jalan',
    title: 'Akses ke curug buruk dan pagar lapuk',
    location: 'Desa Candirejo, Kabupaten Magelang',
    submittedAt: '1 Ags 2026',
    status: 'Selesai',
    slaDeadline: '8 Ags 2026 (Tuntas)',
    steps: [
      {
        title: 'Laporan Diterima & Verifikasi GPS',
        date: '1 Ags 2026 • 09.30 WIB',
        done: true,
        desc: 'Verifikasi lokasi fisik dan bukti foto disetujui Inspektorat Daerah.',
      },
      {
        title: 'Disposisi Pekerjaan ke Pemdes',
        date: '2 Ags 2026 • 11.00 WIB',
        done: true,
        desc: 'Penerbitan surat tugas perbaikan rabat jalan dan pagar besi.',
      },
      {
        title: 'Pekerjaan Fisik & Upload Proof-of-Fix',
        date: '12 Okt 2026 • 14.15 WIB',
        done: true,
        desc: 'Rabat beton rampung. Nota belanja Rp 100.000.000 terbit di buku kas.',
      },
    ],
    villageLink: '/transparansi',
  },
  'DS-JTG-2026-0744': {
    code: 'DS-JTG-2026-0744',
    category: 'Fasilitas & Sanitasi',
    title: 'Wastafel dan toilet kotor sekali',
    location: 'Desa Candirejo, Kabupaten Magelang',
    submittedAt: '6 Okt 2026',
    status: 'Selesai',
    slaDeadline: '13 Okt 2026 (Tuntas)',
    steps: [
      {
        title: 'Laporan Divalidasi Tim Lapangan',
        date: '6 Okt 2026 • 13.00 WIB',
        done: true,
        desc: 'Pemeriksaan kondisi pipa air mampet dan kran toilet patah.',
      },
      {
        title: 'Penggantian Pipa & Perlengkapan Sanitasi',
        date: '8 Okt 2026 • 10.00 WIB',
        done: true,
        desc: 'Pengadaan material sanitasi baru dengan anggaran pemeliharaan.',
      },
      {
        title: 'Verifikasi Fisik Akhir Selesai',
        date: '9 Okt 2026 • 11.30 WIB',
        done: true,
        desc: 'Fasilitas aktif kembali. Bukti foto dan kuitansi terarsip di sistem.',
      },
    ],
    villageLink: '/transparansi',
  },
};

export default function LaporPage() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [selectedKabupaten, setSelectedKabupaten] = useState('Kabupaten Magelang');
  const [selectedDesa, setSelectedDesa] = useState('Desa Candirejo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressInput, setAddressInput] = useState('Desa Wisata Candirejo, Borobudur, Kabupaten Magelang');
  const [locationLabel, setLocationLabel] = useState('Titik Pin GPS: -7.6186, 110.2317');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -7.6186,
    lng: 110.2317,
  });
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'foto-kondisi-lapangan-1.jpg',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking Ticket State
  const [ticketSearchInput, setTicketSearchInput] = useState('DS-JTG-2026-0891');
  const [trackedTicket, setTrackedTicket] = useState(SAMPLE_TICKETS['DS-JTG-2026-0891']);
  const [ticketError, setTicketError] = useState<string | null>(null);

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

  const handleSearchLocation = (query: string) => {
    const clean = query.trim().toLowerCase();
    let match: LocationCoord | null = null;

    for (const key of Object.keys(KNOWN_LOCATIONS)) {
      if (clean.includes(key)) {
        match = KNOWN_LOCATIONS[key];
        break;
      }
    }

    if (match) {
      setCoords({ lat: match.lat, lng: match.lng });
      setLocationLabel(match.displayName);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([match.lat, match.lng], 15, { animate: true });
        markerRef.current.setLatLng([match.lat, match.lng]);
      }
    }
  };

  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const names = Array.from(e.target.files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names].slice(0, 4));
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `DS-JTG-2026-${randomNum}`;
      setIsSubmitting(false);
      setCreatedTicketCode(generatedCode);
    }, 700);
  };

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketSearchInput.trim().toUpperCase();
    if (SAMPLE_TICKETS[query]) {
      setTrackedTicket(SAMPLE_TICKETS[query]);
      setTicketError(null);
    } else {
      setTicketError(`Tiket "${query}" belum ditemukan di arsip publik.`);
    }
  };

  const handleCopyCode = () => {
    if (!createdTicketCode) return;
    navigator.clipboard.writeText(createdTicketCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-[32px] mt-4 mb-20">
      {/* 1. Header Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5 text-[#0D2453]">
          <ShieldAlert className="w-6 h-6 text-[#0D2453]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D2453]">
            Layanan Pengaduan & Aspirasi Desa
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#767676] mt-1.5 max-w-3xl">
          Sampaikan keluhan fasilitas fisik, pungutan tiket tak wajar, atau kejanggalan realisasi dana desa. Setiap laporan resmi wajib diverifikasi dan dituntaskan dengan bukti dokumentasi.
        </p>
      </div>

      {/* 2. Three SLA Commitment Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pungli SLA */}
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#0D2453]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0D2453]">SLA 24 Jam Pungli</div>
            <p className="text-xs text-[#767676] mt-0.5 leading-snug">
              Respon cepat untuk aduan tiket ganda, parkir liar, dan tarif tak terdaftar.
            </p>
          </div>
        </div>

        {/* Card 2: Fasilitas Fisik SLA */}
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0">
            <BadgeAlert className="w-6 h-6 text-[#0D2453]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0D2453]">SLA 7 Hari Fisik</div>
            <p className="text-xs text-[#767676] mt-0.5 leading-snug">
              Perintah kerja langsung ke Pemdes untuk perbaikan sarana jalan dan wahana.
            </p>
          </div>
        </div>

        {/* Card 3: 100% Bukti Fisik */}
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCE7F5]/70 text-[#0D2453] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#0D2453]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0D2453]">Wajib Bukti Fisik</div>
            <p className="text-xs text-[#767676] mt-0.5 leading-snug">
              Tiket aduan tidak dapat ditutup tanpa foto hasil kerja dan nota belanja riil.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Main Workspace: Form (Col 7) and Tracking/SOP (Col 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Span 7): Complete Report Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-8 shadow-xs">
          <div className="border-b border-[#EBEBEB] pb-5 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#0D2453] tracking-tight">
              Formulir Aduan Publik
            </h2>
            <p className="text-xs text-[#767676] mt-1">
              Isi formulir dengan detail faktual agar tim pengawas dapat langsung memverifikasi ke lapangan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-[#0D2453] mb-2.5">
                Kategori Masalah
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-[#0D2453] bg-[#0D2453]/5 ring-1 ring-[#0D2453]'
                          : 'border-[#EBEBEB] bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0D2453]">
                          {cat.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cat.slaType === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : cat.slaType === 'audit'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cat.sla}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#767676] mt-1 leading-snug line-clamp-2">
                        {cat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region Selectors: Kabupaten & Desa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
                  Kabupaten / Kota
                </label>
                <div className="relative">
                  <select
                    value={selectedKabupaten}
                    onChange={(e) => {
                      setSelectedKabupaten(e.target.value);
                      handleSearchLocation(e.target.value);
                    }}
                    className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option>Kabupaten Magelang</option>
                    <option>Kabupaten Banyumas</option>
                    <option>Kabupaten Kendal</option>
                    <option>Kabupaten Karanganyar</option>
                    <option>Kabupaten Banjarnegara</option>
                    <option>Kabupaten Wonosobo</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
                  Desa Wisata
                </label>
                <div className="relative">
                  <select
                    value={selectedDesa}
                    onChange={(e) => {
                      setSelectedDesa(e.target.value);
                      handleSearchLocation(e.target.value);
                    }}
                    className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option>Desa Candirejo</option>
                    <option>Desa Limpakuwus</option>
                    <option>Desa Getas (Tubing Genting)</option>
                    <option>Desa Berjo</option>
                    <option>Desa Dieng Kulon</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Title / Judul Aduan */}
            <div>
              <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
                Judul Laporan Singkat
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pagar pembatas jurang rapuh di akses air terjun"
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
              />
            </div>

            {/* Description / Deskripsi Detail */}
            <div>
              <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
                Deskripsi Lengkap Kejadian & Titik Masalah
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan kronologi, perkiraan dampak risiko keselamatan, atau detail besaran pungli tanpa kuitansi..."
                className="w-full bg-[#F5F5F5] border-0 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#0D2453] font-medium placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none resize-none"
              />
            </div>

            {/* Address Search & Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0D2453]">
                  Lokasi / Alamat Titik Temuan
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Peta terhubung
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    handleSearchLocation(e.target.value);
                  }}
                  placeholder="Ketik nama jalan, dusun, atau kawasan wisata..."
                  className="w-full bg-[#F5F5F5] border-0 rounded-xl pl-4 pr-10 py-3 text-xs sm:text-sm text-[#0D2453] font-medium focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Interactive Leaflet Map Pin */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0D2453]">
                  Tandai Posisi Presisi di Peta (Geser atau Klik)
                </label>
                <span className="text-[11px] text-[#767676]">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#EBEBEB] relative">
                <div ref={mapContainerRef} className="w-full h-56 z-0 bg-slate-100" />
                <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 border-t border-[#EBEBEB] text-[11px] text-[#767676] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-2">
                    OpenStreetMap GPS
                  </span>
                </div>
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-[#0D2453] mb-1.5">
                Unggah Bukti Lapangan (Foto, Nota, atau Video)
              </label>
              <div className="relative border-2 border-dashed border-[#EBEBEB] hover:border-[#0D2453]/40 rounded-2xl p-6 text-center transition-colors bg-[#F7F9FC]/50 group">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-[#0D2453] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                    <UploadCloud className="w-5 h-5 text-[#0D2453]" />
                  </div>
                  <span className="text-xs font-bold text-[#0D2453]">
                    Pilih Berkas atau Tarik ke Sini
                  </span>
                  <span className="text-[11px] text-[#767676] mt-0.5">
                    JPG, PNG, WEBP, MP4 (maksimal 5 MB per berkas)
                  </span>
                </div>
              </div>

              {/* Uploaded Files Chips */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {uploadedFiles.map((fname, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-[#F5F5F5] px-3 py-1.5 rounded-full text-[11px] font-medium text-[#0D2453] border border-[#EBEBEB]"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="max-w-[180px] truncate">{fname}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-slate-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Whistleblower Protection Checkbox */}
            <div className="bg-[#F7F9FC] border border-[#EBEBEB] rounded-2xl p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="anonim-check"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#0D2453] border-slate-300 focus:ring-[#0D2453]"
              />
              <label htmlFor="anonim-check" className="text-xs text-[#0D2453] cursor-pointer">
                <span className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0D2453]" />
                  Lapor sebagai Pelapor Anonim / Rahasia
                </span>
                <span className="text-[11px] text-[#767676] block mt-0.5">
                  Identitas Anda, nomor kontak, serta alamat IP disamarkan dari dokumen publikasi demi perlindungan keselamatan pelapor.
                </span>
              </label>
            </div>

            {/* Submit Action & SLA notice */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-[#767676] mb-3">
                <span>Garansi Penyelesaian:</span>
                <span className="font-bold text-[#0D2453]">
                  {activeCategoryObj.sla} ({activeCategoryObj.label})
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#0D2453] hover:bg-[#132d66] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menerbitkan Tiket Resmi...</span>
                  </>
                ) : (
                  <span>Kirim Laporan Resmi</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (Span 5): Ticket Tracking & SLA SOP */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card A: Track Existing Ticket */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D2453] uppercase tracking-wider mb-3">
              Lacak Status Tiket Aduan
            </h3>
            <p className="text-xs text-[#767676] mb-4">
              Pantau tahapan verifikasi lapangan dan disposisi penyelesaian secara transparan.
            </p>

            <form onSubmit={handleTrackTicket} className="flex gap-2 mb-4">
              <input
                type="text"
                value={ticketSearchInput}
                onChange={(e) => setTicketSearchInput(e.target.value)}
                placeholder="Contoh: DS-JTG-2026-0891"
                className="flex-1 bg-[#F5F5F5] border-0 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0D2453] uppercase placeholder:normal-case placeholder:font-normal placeholder:text-[#767676] focus:ring-2 focus:ring-[#0D2453]/20 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold transition-all shrink-0"
              >
                Periksa
              </button>
            </form>

            {ticketError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 mb-3">
                {ticketError}
              </div>
            )}

            {trackedTicket && (
              <div className="space-y-4 pt-2 border-t border-[#EBEBEB]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#0D2453] block">
                      {trackedTicket.code}
                    </span>
                    <h4 className="text-xs font-bold text-[#0D2453] mt-0.5">
                      {trackedTicket.title}
                    </h4>
                    <span className="text-[11px] text-[#767676] block mt-0.5">
                      {trackedTicket.location}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E6FFFA] text-[#319795] border border-[#B2F5EA] shrink-0">
                    {trackedTicket.status}
                  </span>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-3 pt-2">
                  {trackedTicket.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-[#0D2453]">{st.title}</div>
                        <div className="text-[10px] text-[#767676] mt-0.5">{st.date}</div>
                        <div className="text-[11px] text-[#4A5568] mt-1 leading-snug">
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {trackedTicket.villageLink && (
                  <div className="pt-2">
                    <Link
                      href={trackedTicket.villageLink}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D2453] hover:underline"
                    >
                      <span>Lihat Nota & Realisasi di Transparansi Dana</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card B: Standard Operating Procedure (SOP) */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-bold text-[#0D2453] uppercase tracking-wider mb-4">
              Alur Garansi Penanganan Aduan
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#DCE7F5] text-[#0D2453] font-extrabold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0D2453]">
                    Verifikasi Administrasi & Titik GPS
                  </h4>
                  <p className="text-[11px] text-[#767676] mt-0.5 leading-relaxed">
                    Sistem memvalidasi keabsahan data GPS dan memastikan laporan bukan klaim palsu dalam tempo &lt; 24 jam.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#DCE7F5] text-[#0D2453] font-extrabold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0D2453]">
                    Surat Perintah Kerja ke Pemdes
                  </h4>
                  <p className="text-[11px] text-[#767676] mt-0.5 leading-relaxed">
                    Notifikasi eskalasi dikirim ke akun Pengelola Desa Wisata dengan batasan countdown SLA aktif.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#DCE7F5] text-[#0D2453] font-extrabold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0D2453]">
                    Wajib Proof-of-Fix & Arsip Kas
                  </h4>
                  <p className="text-[11px] text-[#767676] mt-0.5 leading-relaxed">
                    Status hanya dapat menjadi Selesai setelah pengelola mengunggah foto perbaikan dan nota belanja fisik.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Verified Completed Reports Linked to Transparency */}
      <section className="space-y-[24px] pt-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D2453] tracking-tight">
            Aspirasi yang Selesai Ditindaklanjuti
          </h2>
          <p className="text-xs sm:text-sm text-[#767676] mt-1">
            Daftar perbaikan nyata hasil tindak lanjut aduan masyarakat yang tercatat dalam buku kas terbuka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item 1 */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#0D2453]">DS-JTG-2026-0891</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E6FFFA] text-[#319795] border border-[#B2F5EA]">
                  Selesai
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#0D2453]">
                Akses ke curug buruk dan pagar pengaman lapuk
              </h3>
              <p className="text-xs text-[#4A5568] mt-1.5 leading-relaxed">
                Realisasi rabat beton jalan setapak sepanjang 240 meter dan penggantian pagar pengaman besi di Desa Candirejo, Magelang.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EBEBEB] flex items-center justify-between">
              <span className="text-[11px] text-[#767676]">Realisasi: Rp 100.000.000</span>
              <Link
                href="/transparansi"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] hover:underline"
              >
                <span>Buka Bukti Kuitansi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-white rounded-3xl border border-[#EBEBEB] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#0D2453]">DS-JTG-2026-0744</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E6FFFA] text-[#319795] border border-[#B2F5EA]">
                  Selesai
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#0D2453]">
                Wastafel mampet dan kran air toilet tidak mengalir
              </h3>
              <p className="text-xs text-[#4A5568] mt-1.5 leading-relaxed">
                Penggantian total pipa sanitasi dan instalasi kran air higienis di pos toilet umum Desa Candirejo, Magelang.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EBEBEB] flex items-center justify-between">
              <span className="text-[11px] text-[#767676]">Realisasi: Rp 15.000.000</span>
              <Link
                href="/transparansi"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0D2453] hover:underline"
              >
                <span>Buka Bukti Kuitansi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Success Modal Dialog */}
      <AnimatePresence>
        {createdTicketCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-[#EBEBEB] max-w-md w-full p-6 sm:p-7 shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <h3 className="text-lg font-bold text-[#0D2453]">
                Laporan Berhasil Diajukan
              </h3>
              <p className="text-xs text-[#767676] mt-1.5 leading-relaxed">
                Laporan Anda telah tercatat dalam sistem monitoring pengawasan desa wisata Jawa Tengah. Simpan nomor tiket berikut untuk melacak perkembangan penanganan.
              </p>

              <div className="mt-4 p-3.5 bg-[#F7F9FC] border border-[#EBEBEB] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#767676] block uppercase tracking-wide">
                    Nomor Tiket Aduan
                  </span>
                  <span className="text-base font-extrabold text-[#0D2453] tracking-wider">
                    {createdTicketCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#EBEBEB] text-xs font-bold text-[#0D2453] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTicketSearchInput(createdTicketCode);
                    setCreatedTicketCode(null);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="w-full py-3 rounded-full bg-[#0D2453] hover:bg-[#132d66] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Pantau Tiket Ini Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedTicketCode(null)}
                  className="w-full py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#767676] text-xs font-bold transition-all"
                >
                  Tutup Jendela
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
