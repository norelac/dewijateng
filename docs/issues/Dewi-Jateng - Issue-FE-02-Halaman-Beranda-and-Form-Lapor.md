---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-02"
title: "Halaman Beranda: Hero, 4 KPI Counters, Form Lapor Cepat & Feed Before-After"
status: completed
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - home-page
  - civic-form
  - figma-section-01
---

# ISSUE-FE-02: Halaman Beranda: Hero, 4 KPI Counters, Form Lapor Cepat & Feed Before-After

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan halaman beranda utama (`app/page.tsx`) persis sesuai **Section [01] Beranda** pada kanvas Figma MBG. Halaman ini memadukan **Hero Lanskap Terasering** beraksen tipografi kursif, **4 KPI Counters Teranimasi**, **Formulir Lapor Cepat 2-Kolom (`#buat-laporan`)** sebagai *action center* warga, serta **Feed Dinamis "Dari Laporan, Menjadi Perbaikan"** yang menampilkan komparasi bukti fisik foto Sebelum (*Before*) dan Sesudah (*After*) yang terhubung langsung ke database riil.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 01] Beranda & Form Lapor Cepat`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Citizen-and-Tourist-UI-Flow]]
- **Token Desain Section 01:**
  - Background Canvas: `#F7F9FC`
  - Hero Vignette: Gradient overlay `#0D2453/50` di atas foto panorama terasering
  - Container Card: Putih `#FFFFFF`, border `#EBEBEB`, shadow halus `shadow-sm`
  - Primary Action Button: Pill Navy `#0D2453` teks putih
  - Badge Status Selesai: Background `#E6FFFA`, teks `#319795`, border `#B2F5EA`

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Page Entry | `app/page.tsx` | Layout orkestrator Beranda: Hero, KPI Counters, Form Lapor, dan Live Feed Aduan |
| Hero Section | `components/HeroMotion.tsx` | Hero banner lanskap, tipografi kursif *MonteCarlo*, headline *Montserrat*, dan 2 tombol CTA |
| KPI Counters | `components/HomeKpiCounters.tsx` | 4 Kartu metrik count-up teranimasi (`framer-motion` & `useInView`) |
| Form Lapor Cepat | `components/HomeReportForm.tsx` | Form 2-kolom pelaporan warga: upload foto dropzone, pin GPS Leaflet, dropdown 776 desa, checkbox anonim, dan modal kode tiket |
| Feed Before-After | `components/HomeReportFeed.tsx` | Linimasa aduan tuntas dinamis (`GET /api/reports?status=RESOLVED`), komparasi foto Berdampingan/Slider, dan modal lightbox |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Hero Section (`components/HeroMotion.tsx`)
1. **Latar Belakang:** Foto lanskap sawahan berundak Jawa Tengah dengan vignette navy `#0D2453` semi-transparan.
2. **Tipografi Hirarkis:**
   - *Eyebrow Cursive:* `"Desa Wisata Jawa Tengah"` menggunakan font serif/kursif (`Playfair Display Italic` / `MonteCarlo`).
   - *Headline Utama:* `"Dari Laporan, Menjadi Perbaikan"` menggunakan `Montserrat Bold` / `Plus Jakarta Sans` ukuran `text-3xl sm:text-5xl md:text-6xl text-white`.
   - *Sub-headline:* `"Pantau penggunaan dana desa secara terbuka dan laporkan kendala fasilitas wisata secara cepat"`.
3. **Dua Tombol CTA:**
   - Tombol 1 (Putih Solid): `"Buat Laporan"` $\rightarrow$ smooth scroll ke `#buat-laporan`.
   - Tombol 2 (Outline Putih Transparan): `"Lihat Transparansi Dana Desa"` $\rightarrow$ navigasi ke `/transparansi`.

### B. 4 Animated KPI Counters (`components/HomeKpiCounters.tsx`)
Menggunakan sensor viewport `useInView` dan animasi angka dinamis:
- **Kartu 1:** `Rp 185 Miliar` — *Total Dana Desa*.
- **Kartu 2:** `889` — *Desa Wisata* (terdata aktif).
- **Kartu 3:** `94,2%` — *Tingkat Penyelesaian Laporan*.
- **Kartu 4:** `< 24 Jam` — *Rata-rata Respon Pengelola*.

### C. Form Buat Laporan Cepat (`components/HomeReportForm.tsx` / `#buat-laporan`)
- **Header Card:** Ikon `FileText`, judul *"Buat Laporan"*, sub-judul *"Sampaikan pengaduan Anda secara mudah dan cepat."*
- **Layout Grid 2 Kolom:**
  - **Kolom Kiri (Data Masukan):**
    - Input: *Judul Aduan* (placeholder: `"cth: Jembatan kayu retak di Curug Sewu"`).
    - Input: *Alamat / Lokasi Kerusakan* + Tombol Deteksi GPS / Pin Leaflet Map.
    - Dropdown: *Desa Wisata* (Searchable auto-complete 776 desa se-Jateng).
    - Dropdown / Tab Kategori: *Fasilitas Rusak*, *Pungli & Getok Tarif*, *Bahaya K3*, *Kebersihan*.
    - Textarea: *Deskripsi Kejadian / Kerusakan*.
    - Checkbox: *"Lapor secara Anonim (Sembunyikan nomor WhatsApp & identitas saya)"*.
  - **Kolom Kanan (Unggah Bukti & Aksi):**
    - Dropzone Drag & Drop Foto Bukti: Mendukung JPG, PNG, WebP (maks 10MB) dengan pratinjau thumbnail instan dan tombol hapus.
    - Tombol Submisi: Pill Navy `#0D2453` *"Kirim Laporan Sekarang"*.
- **Hasil Submisi:** Modal popup menampilkan **Kode Pelaporan** unik format `LP-JTG-2026-XXXX` dengan tombol salin dan tautan instan ke rute `/lapor?tiket=LP-JTG-2026-XXXX`.

### D. Section Feed "Dari Laporan, Menjadi Perbaikan" (`components/HomeReportFeed.tsx`)
- **Judul Section:** *"Dari Laporan, Menjadi Perbaikan"*
- **Deskripsi:** *"Bukti nyata tindak lanjut laporan warga dan wisatawan oleh pengelola desa wisata."*
- **Filter Pills Kategori:** Tombol pill filter (`Semua`, `Fasilitas & Akses`, `Fasilitas & Sanitasi`).
- **Mode Toggle:** Pilihan tampilan *"Berdampingan"* (dua kartu foto side-by-side) atau *"Slider"* (interaktif draggable).
- **Komparasi Foto Before-After:**
  - Sisi Kiri: Foto Sebelum Perbaikan + Label Tanggal Lapor & Keterangan Kerusakan Awal.
  - Sisi Kanan: Foto Sesudah Perbaikan (Proof-of-Fix) + Label Tanggal Selesai & Tindakan Teknis Pokdarwis.
  - Lightbox: Klik gambar untuk memperbesar resolusi tinggi.
- **Catatan Dari Desa:** Menampilkan riwayat linimasa tanggal perbaikan, narasi solusi dari Pokdarwis, dan tautan profil desa terkait.
- **Dukungan Data Riil:** Fetching dinamis via `GET /api/reports?status=RESOLVED` dengan fallback gracefully.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Desain visual Beranda persis mencerminkan Section 01 Figma MBG (node `82:3`) dengan canvas `#F7F9FC` dan palet navy `#0D2453`.
- [x] AC-2: Hero Section memuat tipografi kursif `"Desa Wisata Jawa Tengah"` dan headline bold `"Dari Laporan, Menjadi Perbaikan"`.
- [x] AC-3: 4 Kartu KPI mengiterasi angka secara halus saat elemen masuk ke dalam viewport layar.
- [x] AC-4: Form Lapor berada langsung di Beranda pada `#buat-laporan` dan mendukung unggahan foto drag-and-drop dengan pratinjau thumbnail.
- [x] AC-5: Submisi form berhasil memanggil API `POST /api/reports` dan menerbitkan modal Kode Pelaporan `LP-JTG-2026-XXXX`.
- [x] AC-6: Komponen feed berhasil memuat data laporan tuntas dari API `GET /api/reports?status=RESOLVED` dengan komparasi visual Before-After.
- [x] AC-7: Seluruh tata letak responsif pada perangkat seluler (`375px`), tablet (`768px`), dan desktop (`1280px`).
