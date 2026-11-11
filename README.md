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
- **Fonts**: Inter & MonteCarlo (`next/font/google`)

### Basis Data & Penyimpanan
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Ekstensi Spasial**: PostGIS 3.4 (Data spasial koordinat 868 desa wisata)
- **Penyimpanan Berkas**: Penyimpanan lokal (`UPLOAD_DIR=./public/uploads`) serta generator PDF/SVG dinamis (`/documents/*`) untuk dokumen LPJ, bukti transaksi, dan nota belanja

### Layanan Audit & Kepatuhan
- **Document Table Extractor**: Ekstraksi tabel dokumen LPJ bantuan sarpras (PDF) menjadi pos belanja modal terstruktur (Pagu, Belanja Modal, Realisasi, Sisa Saldo).
- **Anomaly Price Checker**: Pembanding otomatis nilai pos belanja fisik terhadap katalog Standar Satuan Harga / HSD MAS PETRUK Jateng (penanda anomali jika deviasi >+40%).
- **Metadata & Timestamp Validator**: Validasi metadata EXIF pada foto hasil perbaikan (*Proof-of-Fix*) untuk mencegah penggunaan foto arsip lama.
- **Dynamic Trust Score Engine**: Formula matematis transparan 50/50 (50% Kepatuhan Unggah LPJ + 50% Rasio Ketuntasan Aduan Berbukti).

---

## Struktur Direktori

```text
dewi-jateng/
├── app/                   # Next.js 14 App Router
│   ├── (auth)/            # Login, pendaftaran dinas, aktivasi akun, reset sandi
│   ├── actions/           # Server Actions terotentikasi
│   ├── api/               # REST API routes (villages, reports, transparansi, LPJ, compliance)
│   ├── disbudparekraf/    # Command center, verifikasi LPJ, akun desa wisata, monitoring keuangan & ekspor CSV
│   ├── documents/[file]/  # Generator dinamis dokumen LPJ (PDF), bukti kas (PDF), & nota (SVG)
│   ├── edukasi/           # Pilar 4: Literasi UU KIP, SOP Pokdarwis, K3 & kontak darurat
│   ├── lapor/             # Pilar 3: Telusuri aduan warga, linimasa & slider Proof-of-Fix
│   ├── pengelola/         # Portal pengelola & balai desa (aduan, anggaran, pengeluaran, unggah LPJ)
│   ├── transparansi/      # Pilar 2: Transparansi kas desa wisata & analisis SSH
│   ├── globals.css        # Style global & token desain
│   ├── layout.tsx         # Root layout, font Inter, & metadata
│   └── page.tsx           # Pilar 1: Beranda, hero, form lapor terpadu, & KPI
├── components/            # Komponen UI publik, pengelola, & disbudparekraf
├── data/                  # Dataset master 868 desa wisata & katalog HSD MAS PETRUK
├── docs/                  # Dokumentasi arsitektur, BRD, PRD, & desain sistem
├── lib/                   # Koneksi DB, auth HMAC, & domain services
├── public/                # Aset statis, regulasi PDF, logo Pemprov Jateng, favicon
├── scripts/               # Seeder & skrip verifikasi alur backend
├── types/                 # Definisi tipe TypeScript
├── next.config.mjs        # Konfigurasi Next.js
├── tailwind.config.mjs    # Konfigurasi Tailwind & token desain
└── tsconfig.json          # Konfigurasi TypeScript compiler & alias path (@/*)
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
  - Hero banner visi Desa Wisata Jawa Tengah.
  - Formulir Pelaporan Aduan Warga Cepat (`HomeReportForm`) terintegrasi peta Leaflet, unggah foto kompresi WebP, pilihan 4 kategori, mode anonim, dan modal terbit Kode Pelaporan (`LP-JTG-2026-XXXX`).
  - KPI Counter statistik makro langsung dari database (868 desa wisata terdata, realisasi & alokasi bantuan sarpras, tingkat penyelesaian laporan).
  - Ticker aduan selesai dengan bukti perbaikan (*Proof-of-Fix*).
- [x] **Halaman Transparansi Dana (`/transparansi`)**:
  - Filter pencarian 868 desa wisata dan Kabupaten/Kota Jawa Tengah.
  - Kartu neraca pagu bantuan, realisasi belanja modal, dan sisa saldo kas anggaran.
  - Tabel penjabaran pos belanja modal hasil ekstraksi dokumen LPJ dengan lencana deviasi Standar Satuan Harga (SSH) Jateng.
  - Tautan unduh salinan dokumen LPJ resmi (PDF) dan nota pos belanja.
- [x] **Halaman Telusuri Aduan (`/lapor`)**:
  - Bilah pencarian Kode Pelaporan unik, filter wilayah, status, kategori, dan pagination berjendela.
  - Linimasa milestone 3 tahap (Diterima, Sedang Dikerjakan, Selesai) dan lencana tenggat SLA.
  - Slider interaktif komparasi foto *Before-After* (*Proof-of-Fix*) dan tampilan berdampingan.
- [x] **Halaman Edukasi & Panduan (`/edukasi`)**:
  - Modul literasi hak keterbukaan informasi publik (UU KIP No. 14/2008 & Permendagri No. 20/2018).
  - SOP tangga respon penanganan pengaduan Pokdarwis.
  - Panduan pelaporan, transparansi dana, privasi pelapor, FAQ, dan direktori kontak darurat Jawa Tengah.
- [x] **Portal Pengelola Desa (`/pengelola`) & Disbudparekraf (`/disbudparekraf`)**:
  - Portal Pengelola Desa (`/pengelola`, `/pengelola/laporan`, `/pengelola/anggaran`, `/pengelola/pengeluaran`, `/pengelola/lpj`) dengan unggah foto *Proof-of-Fix* wajib sebelum tiket ditutup dan pengelolaan buku kas/LPJ.
  - Command Center Disbudparekraf (`/disbudparekraf`, `/disbudparekraf/akun`, `/disbudparekraf/monitoring`, `/disbudparekraf/aktivitas`) untuk pengelolaan akun desa wisata, verifikasi antrean LPJ, monitoring keuangan per periode, dan ekspor CSV.

---

## Tim Pengembang

Tim sotodiensracing - Universitas Dian Nuswantoro, Semarang:
1. **Muhammad Ilham Maulana** - Hacker (Lead Fullstack Developer)
2. **Delvia Mareta Dealova** - Hipster (UI/UX & Product Designer)
3. **Muhammad Iqbal Junialdi** - Hustler (System Analyst & Project Strategist)
