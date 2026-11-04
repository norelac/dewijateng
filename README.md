# DEWI JATENG

Platform terpadu transparansi dokumen LPJ bantuan keuangan desa wisata, pengawasan fasilitas publik, dan mitigasi risiko kepatuhan bagi 1.000 desa wisata di Jawa Tengah tahun 2027. Sistem ini menghubungkan keterbukaan dokumen pertanggungjawaban anggaran bantuan sarana prasarana dengan penanganan pengaduan kerusakan fisik berbasis verifikasi foto perbaikan nyata (Proof-of-Fix).

Repository ini dikembangkan oleh Tim sotodiensracing (Universitas Dian Nuswantoro) dalam rangka kompetisi Web In Action (WIA) 2026 / Multimedia In Action (MIA) 2026, Universitas Pembangunan Nasional "Veteran" Jakarta.

---

## Tech Stack

### Frontend & Core Platform
- **Framework**: Next.js 14 (App Router) & React 18
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 3.4 & PostCSS
- **Animasi & Interaktivitas**: Framer Motion 11.x
- **Ikon**: Lucide React
- **Peta & Geospasial**: Leaflet.js & react-leaflet (Pinpoint GPS & Sebaran Titik 35 Kab/Kota)
- **Fonts**: Plus Jakarta Sans, Inter, JetBrains Mono

### Basis Data & Penyimpanan
- **Database**: PostgreSQL 16 (Relational Database Management System)
- **Ekstensi Spasial**: PostGIS 3.4 (Data spasial koordinat desa wisata)
- **Layanan BaaS & Auth**: Supabase (PostgreSQL, Row-Level Security, Database Webhooks)
- **Penyimpanan Berkas**: Supabase Storage (Dokumen LPJ PDF resmi, foto laporan awal, foto bukti hasil perbaikan)

### Layanan Kecerdasan Buatan (AI Engine)
- **AI Document Table Extractor**: Ekstraksi otomatis tabel dokumen LPJ bantuan sarpras (PDF) menjadi tabel web interaktif (Pagu, Belanja Modal, Realisasi, Sisa Saldo).
- **AI Anomaly Price Checker**: Pembanding otomatis nilai pos belanja fisik terhadap data acuan Standar Satuan Harga (SSH) Pemprov Jateng (penanda anomali jika deviasi >+40%).
- **AI Metadata & Timestamp Validator**: Validasi metadata tanggal pemotretan asli (EXIF DateTimeOriginal) pada foto hasil perbaikan (*Proof-of-Fix*) untuk mencegah penggunaan foto arsip lama.
- **Dynamic Trust Score Engine**: Formula matematis transparan 50/50 (50% Kepatuhan Unggah LPJ + 50% Rasio Ketuntasan Aduan Berbukti) pada Peta Kendali Disporapar.

---

## Struktur Direktori

```text
dewi-jateng/
├── app/                  # Next.js 14 App Router
│   ├── admin/            # Portal administrasi & pengawasan
│   │   ├── balai-desa/   # Portal unggah & verifikasi dokumen LPJ PDF
│   │   └── command-center/ # Peta kendali Disporapar 35 Kab/Kota & Trust Score
│   ├── edukasi/          # Pilar 4: Literasi UU KIP, SOP Pokdarwis, K3 & kontak darurat
│   ├── lapor/            # Pilar 3: Telusuri aduan warga, linimasa & slider Proof-of-Fix
│   ├── pengelola/        # Papan kerja Pokdarwis & unggah foto perbaikan
│   ├── transparansi/     # Pilar 2: Transparansi dokumen LPJ bantuan desa & analisis SSH
│   ├── globals.css       # Style global & token desain
│   ├── layout.tsx        # Root layout, font Plus Jakarta Sans, & metadata
│   └── page.tsx          # Pilar 1: Beranda, hero, form lapor terpadu, KPI & mini GIS
├── components/           # Komponen UI React
│   ├── CashbookTable.tsx
│   ├── Footer.tsx
│   ├── HeroMotion.tsx
│   ├── HomeKpiCounters.tsx
│   ├── HomeReportFeed.tsx
│   ├── HomeReportForm.tsx
│   ├── Navbar.tsx
│   ├── PengelolaTicketBoard.tsx
│   ├── ProofOfFixSlider.tsx
│   └── ReportFormMotion.tsx
├── docs/                 # Dokumentasi arsitektur, BRD, PRD, & desain sistem
├── lib/                  # Helper utilities & mock dataset desa wisata
├── public/               # Asset statis, logo Pemprov Jateng, favicon
├── types/                # Definisi antarmuka TypeScript
├── next.config.mjs       # Konfigurasi Next.js
├── tailwind.config.mjs   # Konfigurasi Tailwind & token desain
└── tsconfig.json         # Konfigurasi TypeScript compiler & alias path (@/*)
```

---

## Cara Menjalankan Project

### Prasyarat Sistem
- Node.js versi 18.18.0 atau versi 20 LTS ke atas
- Package manager: npm, pnpm, atau yarn
- Instansi Supabase / PostgreSQL lokal atau cloud

### Langkah Instalasi

1. Klon repositori ke komputer lokal:
```bash
git clone https://github.com/norelac/dewijateng.git
cd dewijateng
```

2. Pasang dependensi proyek:
```bash
npm install
```

3. Konfigurasi berkas environment:
Salin berkas template lingkungan dan sesuaikan variabel koneksi database serta kunci API:
```bash
cp .env.example .env.local
```

Isi variabel konfigurasi di dalam `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Konfigurasi Basis Data (Murni PostgreSQL 16 + PostGIS 3.4 & Drizzle ORM)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dewijateng
UPLOAD_DIR=./public/uploads
```

4. Jalankan server pengembangan lokal:
```bash
npm run dev
```

Aplikasi dapat diakses melalui peramban di `http://localhost:3000`.

5. Build produksi dan verifikasi tipe:
```bash
npm run build
```

---

## Roadmap Pengembangan

- [x] **Perancangan Sistem & Dokumen Teknis**: Penyusunan PRD, BRD, Desain Sistem, dan Arsitektur Aplikasi.
- [x] **Desain UI/UX**: Mockup antarmuka multi-peran dan prototipe interaktif di Figma.
- [x] **Setup Repositori & Arsitektur Kode**: Konfigurasi Next.js 14 App Router, TypeScript, dan Tailwind CSS.
- [x] **Halaman Beranda (`/`)**:
  - Hero banner visi 1.000 Desa Wisata Jateng 2027.
  - Formulir Pelaporan Aduan Warga Cepat (`HomeReportForm`) terintegrasi peta Leaflet, pengambilan foto langsung, pemilihan 4 kategori, mode anonim, dan modal terbit Kode Pelaporan (`LP-JTG-2026-XXXX`).
  - KPI Counter statistik makro (776 desa wisata resmi, Rp 87,5 miliar bantuan keuangan sarpras, 100% wajib bukti fisik, formula 50/50 Trust Score).
  - Ticker aduan selesai dengan bukti perbaikan (*Proof-of-Fix*).
  - Mini GIS sebaran kepatuhan desa wisata di 35 Kabupaten/Kota.
- [x] **Halaman Transparansi Dana (`/transparansi`)**:
  - Filter pencarian desa wisata dan 35 Kabupaten/Kota.
  - Kartu neraca pagu bantuan, realisasi belanja modal, dan sisa saldo kas anggaran.
  - Tabel penjabaran pos belanja modal hasil ekstraksi dokumen LPJ dengan lencana deviasi Standar Satuan Harga (SSH) Jateng.
  - Tautan unduh salinan dokumen LPJ resmi bertandatangan Kepala Desa (PDF).
- [ ] **Halaman Telusuri Aduan (`/lapor`)**:
  - Bilah pencarian Kode Pelaporan unik.
  - Linimasa milestone 3 tahap (Diterima, Sedang Dikerjakan, Selesai).
  - Slider interaktif komparasi foto *Before-After* (*Proof-of-Fix*) dan kartu validasi timestamp EXIF.
- [ ] **Halaman Edukasi & Panduan (`/edukasi`)**:
  - Modul literasi hak keterbukaan informasi publik (UU KIP No. 14/2008 & Permendagri No. 20/2018).
  - SOP tangga respon penanganan pengaduan Pokdarwis.
  - Panduan standar K3 sarana buatan dan direktori kontak darurat Jawa Tengah.
- [ ] **Halaman Pengelola Desa & Disporapar**:
  - Papan kerja Pokdarwis (`/pengelola`) dengan syarat wajib unggah foto *Proof-of-Fix* sebelum tiket ditutup.
  - Portal Balai Desa (`/admin/balai-desa`) untuk unggah berkas dokumen LPJ bantuan (PDF).
  - Peta Kendali Disporapar Pemprov Jateng (`/admin/command-center`) format Widescreen 16:9 Dark Mode dengan pemeringkatan Trust Score matematis.

---

## Tim Pengembang

Tim sotodiensracing - Universitas Dian Nuswantoro, Semarang:
1. **Muhammad Ilham Maulana** - Hacker (Lead Fullstack Developer)
2. **Delvia Mareta Dealova** - Hipster (UI/UX & Product Designer)
3. **Muhammad Iqbal Junialdi** - Hustler (System Analyst & Project Strategist)
