---
type: project-note
project_id: "DEWI-JATENG"
status: active
created: 2026-10-23
updated: 2026-11-02
tags:
  - dewi-jateng
  - prd
  - product-requirements
  - user-stories
  - specifications
  - nextjs-app-router
  - framer-motion
  - fiscal-transparency
  - civic-reporting
---

# Product Requirements Document (PRD)
## Platform DEWI JATENG
### Spesifikasi Teknis Produk, Rekayasa Fitur, dan Kebutuhan Antarmuka Sistem

---

**Identifikasi Dokumen:**
- **Nama Produk:** DEWI JATENG (*Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah*)
- **Nomor Dokumen:** PRD-DEWIJATENG-2026-V3.1
- **Versi:** 3.1 (Next.js 14/15 App Router, React Server Components, Client Components `'use client'`, Framer Motion, Supabase, PostGIS, Zero POS/Booking)
- **Status:** Disetujui (Approved)
- **Lead Frontend & System Analyst:** Muhammad Iqbal Junialdi (*Hustler & Frontend Developer, Tim sotodiensracing UDINUS*)
- **Lead Backend & System Architecture:** Muhammad Ilham Maulana (*Hacker & Backend Developer*)
- **Lead UI/UX & Product Designer:** Delvia Mareta Dealova (*Hipster & Product Designer*)
- **Dokumen Induk:** Business Requirements Document (BRD-DEWIJATENG-2026-V3.1)
- **Dokumen Terkait:** Database Schema & Models, System Architecture Specification, UI/UX Guidelines (DESIGN.md)

---

## 1. Ikhtisar Produk (Product Overview)

**DEWI JATENG** adalah platform tata kelola terpadu berbasis web modern (**Next.js 14/15 App Router Fullstack Architecture**) yang menghubungkan transparansi pendanaan desa wisata (Bantuan Keuangan Pemprov Jateng, APBDes, dan PADes) dengan sistem pengawasan fasilitas publik partisipatif berbasis geolokasi dan mekanisme garansi perbaikan fisik (*Proof-of-Fix*).

Platform ini dibangun di atas arsitektur **Next.js 14/15 (App Router, React Server Components, Server Actions, Route Handlers, TypeScript), React 18, Framer Motion 11 (`framer-motion`), Tailwind CSS 3.4, Lucide React, Leaflet.js / React-Leaflet, PostgreSQL + PostGIS, dan Supabase BaaS**, dengan pengayaan layanan AI (OCR Receipt Audit vs SSH Jateng, EXIF Validator, Whisper Voice Transcription, serta Dynamic Trust Score Engine).

### Pembagian Domain Pengembangan (Tim sotodiensracing):
- **Frontend Domain (Muhammad Iqbal Junialdi):** Mengembangkan seluruh antarmuka pengguna (`app/**/page.tsx`, `components/**`), micro-interactions Framer Motion (animated counter, before-after slider, lightbox zoom, interactive map pins), integrasi form, dan implementasi presisi 1:1 token Figma MBG (`#0D2453`, `#F7F9FC`, `#FFFFFF`, `#EBEBEB`, `#767676`).
- **Backend & Database Domain (Muhammad Ilham Maulana):** Mengembangkan arsitektur basis data PostgreSQL/PostGIS di Supabase, Row-Level Security (RLS), endpoint API / Route Handlers (`app/api/**/route.ts`), Server Actions untuk mutasi data, dan pipeline AI OCR kuitansi.

### Nilai Diferensiasi Kunci:
1. **Transparansi Fiskal Baris-demi-Baris:** Membuka buku kas desa wisata beserta foto nota fisik kuitansi belanja riil yang diaudit terhadap Standar Satuan Harga (SSH) Pemprov Jawa Tengah.
2. **Closed-Loop Civic Reporting Berbasis SLA:** Setiap aduan warga dan wisatawan tercatat dengan koordinat GPS presisi dan dikawal timer countdown SLA dinamis (24 Jam untuk Pungli, 7 Hari untuk Kerusakan Fasilitas Fisik).
3. **Mekanisme Proof-of-Fix Tanpa Kompromi:** Tiket aduan tidak dapat ditutup (*Resolved*) tanpa unggahan foto fisik hasil perbaikan (*After*) yang tervalidasi.
4. **Dynamic Trust Score Engine:** Menghitung skor kepatuhan dan keselamatan desa wisata (skala 0–100) secara otomatis berdasarkan realisasi belanja, ketepatan SLA, dan ketiadaan insiden K3.

---

## 2. Struktur Arsitektur Navigasi & Sitemap (5 Halaman Terpadu)

Sitemap resmi DEWI JATENG dirancang presisi dengan 5 rute halaman tanpa modul e-commerce atau booking komersial:

```text
DEWI JATENG PLATFORM (Next.js 14/15 App Router Architecture)
│
├── 1.0 BERANDA PUBLIK (app/page.tsx) [Route: /]
│   ├── Hero Akuntabilitas & Transparansi Tata Kelola Wisata Jateng (Framer Motion)
│   ├── KPI Makro Jawa Tengah (776 Desa Wisata, Realisasi Rp83,1 M Bankeu, Avg Trust Score)
│   ├── Quick Report Box (Form Aduan Cepat)
│   └── Feed Proof-of-Fix (Galeri Komparasi Before-After Hasil Perbaikan Nyata - Motion Slider)
│
├── 2.0 TRANSPARANSI DANA DESA (app/transparansi/page.tsx) [Route: /transparansi]
│   ├── Filter Interaktif 35 Kabupaten/Kota Jawa Tengah
│   ├── Visualisasi Komposisi Anggaran (APBDes, Bankeu Provinsi, PADes Wisata)
│   ├── Progress Bar Serapan Anggaran & Realisasi Fisik
│   ├── Buku Kas Terbuka Baris-demi-Baris (Pemasukan & Pengeluaran Kas Riil)
│   └── Modal Inspeksi Kuitansi & Nota Belanja Riil (dengan Audit AI OCR vs SSH Jateng)
│
├── 3.0 KANAL LAPOR ADUAN (app/lapor/page.tsx) [Route: /lapor]
│   ├── Formulir Pelaporan Berstandar (Pungli, Fasilitas Rusak, Bahaya K3, Kebersihan)
│   ├── Peta Penentuan Koordinat GPS Interaktif (Leaflet.js + OpenStreetMap 'use client')
│   ├── Unggah Bukti Foto/Video & Input Suara (Whisper Voice-to-Text)
│   ├── Dynamic SLA Countdown Preview (24 Jam Pungli / 7 Hari Fasilitas - Framer Motion Badge)
│   └── Opsi Perlindungan Whistleblower Anonim
│
├── 4.0 PUSAT EDUKASI & PANDUAN (app/edukasi/page.tsx) [Route: /edukasi]
│   ├── Panduan Hak Keterbukaan Informasi Publik (UU KIP No. 14/2008)
│   ├── Sosialisasi Klasifikasi & Tata Kelola Desa Wisata (Perda Jateng No. 2/2019)
│   ├── Standard Operating Procedure (SOP) Keselamatan Wahana & Mitigasi Risiko K3
│   └── Diagram Alur Penanganan Aduan (Closed-Loop Workflow)
│
└── 5.0 PORTAL PENGELOLA DESA (app/pengelola/page.tsx) [Route: /pengelola]
    ├── Verifikasi & Input Nota Belanja Kasir/Material
    ├── Papan Disposisi Tiket Aduan Berdasarkan Urgensi SLA (Merah, Kuning, Hijau)
    ├── Modal Eksekusi Tiket & Wajib Unggah Foto Hasil Perbaikan (Proof-of-Fix)
    └── Metrik Kinerja Kepatuhan & Dynamic Trust Score Desa
```

---

## 3. Matriks Peran Pengguna (User Personas & Access Control)

| Peran Pengguna | Deskripsi Persona | Hak Akses Utama |
| :--- | :--- | :--- |
| **Wisatawan & Publik** | Wisatawan domestik/mancanegara yang berkunjung ke desa wisata di Jateng. | Membaca transparansi dana, membuat aduan bergeolokasi, melihat linimasa SLA aduan, melihat komparasi Before-After. |
| **Warga Desa Lokal** | Penduduk lokal yang tinggal di sekitar kawasan desa wisata. | Mengakses buku kas terbuka, memeriksa nota toko material, mengaudit keberadaan fisik aset (*Citizen Proof-of-Reality*). |
| **Pengelola Pokdarwis / BUMDes** | Tim operasional lapangan yang mengelola unit wisata desa. | Mengunggah nota belanja riil, menerima disposisi tiket aduan, mengunggah foto perbaikan (*Proof-of-Fix*). |
| **Pemerintah Desa & BPD** | Kepala Desa, Perangkat Desa, dan Badan Permusyawaratan Desa. | Memantau mutasi buku kas desa wisata, evaluasi SLA aduan warganya, memvalidasi kepatuhan tata kelola. |
| **Disporapar Pemprov Jateng** | Pejabat pengambil kebijakan pariwisata tingkat provinsi Jawa Tengah. | Akses agregat data 35 kab/kota, pemantauan status risiko desa, penentuan evaluasi Bantuan Keuangan (Bankeu). |

---

## 4. Rincian Kebutuhan Fungsional (Functional Requirements)

### FR-MOD-01: Beranda Akuntabilitas Publik (`/`)
- **FR-01.1 (Agregasi Data 776 Desa):** Sistem menampilkan counter statistik makro Jawa Tengah: 776 total desa wisata (583 rintisan, 159 berkembang, 34 maju), total realisasi dana Bankeu Rp83,1 Miliar, persentase aduan terselesaikan, dan rerata skor kepatuhan.
- **FR-01.2 (Widget Lapor Cepat):** Formulir mini di beranda untuk submit laporan darurat langsung diarahkan ke alur `/lapor`.
- **FR-01.3 (Galeri Proof-of-Fix Before-After):** Komponen slider interaktif yang menampilkan foto sebelum perbaikan vs sesudah perbaikan berserta tanggal penyelesaian dan nama desa.

### FR-MOD-02: Portal Transparansi Dana (`/transparansi`)
- **FR-02.1 (Filter Wilayah Berjenjang):** Pengguna dapat menyaring data berdasarkan 35 Kabupaten/Kota di Jawa Tengah dan memilih desa wisata spesifik.
- **FR-02.2 (Diagram Komposisi Sumber Dana):** Visualisasi porsi APBDes, Bankeu Provinsi, dan PADes Wisata.
- **FR-02.3 (Buku Kas Terbuka Real-Time):** Menampilkan tabel riwayat pengeluaran kas dengan kolom: Tanggal, Deskripsi Pekerjaan/Belanja, Kategori (Material, Upah, Keselamatan K3, Operasional), Nominal, dan Tautan Nota.
- **FR-02.4 (Modal Inspeksi Nota & Audit AI):** Klik pada nota membuka preview dokumen kuitansi beresolusi tinggi, disertai indikator validasi AI OCR yang membandingkan harga semen/besi/kayu terhadap Standar Satuan Harga (SSH) Pemprov Jateng.

### FR-MOD-03: Kanal Pelaporan Aduan Berbasis GPS (`/lapor`)
- **FR-03.1 (Pemilihan Titik Koordinat Peta):** Pengguna dapat memilih lokasi kejadian via antarmuka peta Leaflet.js atau tombol "Gunakan Lokasi Saat Ini" (HTML5 Geolocation).
- **FR-03.2 (Kategorisasi & Bukti Visual):** Pengguna memilih kategori insiden (Pungli Parkir/Karcis, Kerusakan Fasilitas, Bahaya K3/Wahana, Kebersihan) dan wajib mengunggah minimal 1 foto bukti autentik.
- **FR-03.3 (Transkripsi Suara AI):** Opsi perekaman suara pelapor yang ditranskripsikan otomatis menjadi teks deskripsi laporan via Whisper API.
- **FR-03.4 (Penetapan SLA Otomatis):**
  * Kategori Pungli / Tarif Liar: SLA otomatis dikunci **24 Jam**.
  * Kategori Kerusakan Fasilitas / Bahaya K3: SLA otomatis dikunci **168 Jam (7 Hari Kalender)**.
- **FR-03.5 (Penerbitan Kode Unik):** Sistem menerbitkan kode tiket unik berformat `DWJ-{KODE_KAB}-{YYYYMM}-{NOMOR}` (contoh: `DWJ-BMY-202611-0012` untuk Banyumas).

### FR-MOD-04: Pusat Edukasi & Regulasi (`/edukasi`)
- **FR-04.1 (Panduan Regulasi KIP & Perda):** Ringkasan pasal-pasal hak warga atas informasi penggunaan anggaran negara dan dana desa.
- **FR-04.2 (Pedoman Mitigasi Risiko K3):** Panduan teknis pencegahan insiden wahana kaca, jembatan gantung, river tubing, dan flying fox mengacu pada evaluasi tragedi The Geong Limpakuwus.
- **FR-04.3 (Diagram Alur Penanganan):** Infografis interaktif alur penanganan tiket laporan publik dari pengaduan masuk hingga unggah bukti perbaikan.

### FR-MOD-05: Portal Pengelola & Verifikasi Proof-of-Fix (`/pengelola`)
- **FR-05.1 (Unggah & Pencatatan Nota Belanja):** Pengelola memasukkan pengeluaran kas dengan mengunggah foto kuitansi/nota toko.
- **FR-05.2 (Papan Eskalasi Tiket SLA):** Menampilkan daftar antrean aduan aktif yang diurutkan berdasarkan sisa waktu SLA (Hijau: Aman, Kuning: Mendekati tenggat <25% waktu, Merah: Terlewat / Overdue).
- **FR-05.3 (Validasi Mutlak Proof-of-Fix):** Sistem memblokir penutupan tiket jika pengelola tidak melampirkan foto hasil perbaikan (*After Photo*), tanggal perbaikan, dan ringkasan tindakan teknis.
- **FR-05.4 (Kalkulasi Dynamic Trust Score):** Sistem menghitung ulang skor kepercayaan desa wisata (0–100) secara dinamis tiap kali ada transaksi kas terverifikasi atau tiket terselesaikan tepat waktu.

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kecepatan & Responsivitas (Performance):**
   - First Contentful Paint < 1.2 detik menggunakan React Server Components.
   - Peta Leaflet.js di-load secara dinamis dengan Next.js `dynamic(() => import(...), { ssr: false })`.
2. **Ketersediaan & Skalabilitas (Scalability):**
   - Mendukung akses serentak publik di seluruh Jawa Tengah melalui arsitektur Next.js Edge / Node.js Serverless runtime dan Supabase Connection Pooling.
3. **Integritas Spasial & Keamanan (Security & GIS):**
   - Validasi batas wilayah Jawa Tengah pada koordinat laporan menggunakan kueri PostGIS `ST_Contains`.
   - Penerapan Row-Level Security (RLS) pada tabel basis data Supabase sehingga pengelola hanya dapat mengedit data desa masing-masing.
   - Perlindungan data pribadi pelapor (*whistleblower encryption*).

---

## 6. Skenario Penerimaan Sistem (Gherkin Acceptance Criteria)

```gherkin
Feature: Transparansi Anggaran dan Inspeksi Nota Belanja
  Scenario: Warga menginspeksi nota belanja pembangunan fasilitas desa
    Given Warga membuka halaman "/transparansi"
    When Warga memilih kabupaten "Banyumas" dan desa "Limpakuwus"
    Then Sistem menampilkan grafik serapan APBDes dan Bankeu Provinsi
    And Tabel buku kas menampilkan transaksi "Pengadaan Kaca Tempered Jembatan" senilai "Rp 45.000.000"
    When Warga menekan tombol "Lihat Nota"
    Then Modal menampilkan foto kuitansi resmi toko material dengan status verifikasi AI OCR

Feature: Pelaporan Kerusakan Fasilitas dengan SLA Bergaransi
  Scenario: Wisatawan melaporkan baut jembatan longgar di lokasi wisata
    Given Wisatawan berada di lokasi dan membuka "/lapor"
    When Wisatawan memilih kategori "Bahaya Keselamatan K3"
    And Memilih koordinat pada peta Leaflet
    And Mengunggah 1 foto baut longgar
    And Menekan tombol "Kirim Laporan"
    Then Sistem menerbitkan kode tiket unik "DWJ-BMY-202611-0024"
    And Sistem mengaktifkan hitung mundur SLA 7 hari kalender
    And Laporan langsung tampil pada feed pengawasan publik

Feature: Penutupan Tiket Wajib Proof-of-Fix
  Scenario: Pengelola desa mencoba menutup laporan tanpa melampirkan bukti perbaikan
    Given Pengelola masuk ke "/pengelola" dan membuka tiket "DWJ-BMY-202611-0024"
    When Pengelola memilih status "Selesai / Resolved" tanpa mengunggah foto perbaikan
    Then Sistem menampilkan pesan error "Wajib mengunggah foto bukti fisik perbaikan (Proof-of-Fix)"
    And Status tiket tetap "In Progress"
    When Pengelola mengunggah foto perbaikan baut yang telah diperkuat dan mengisi catatan teknis
    Then Status tiket berhasil diperbarui menjadi "Resolved"
    And Foto Before-After otomatis terbit di galeri Beranda
```
