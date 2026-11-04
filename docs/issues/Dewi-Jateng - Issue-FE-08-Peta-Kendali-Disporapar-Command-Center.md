---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-08"
title: "Peta Kendali Disporapar Pemprov Jateng (Executive Command Center)"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - command-center
  - disporapar-jateng
  - decision-support
  - figma-section-07
---

# ISSUE-FE-08: Peta Kendali Disporapar Pemprov Jateng (Executive Command Center)

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan layar kendali eksekutif Disporapar Provinsi Jawa Tengah (`app/disporapar/page.tsx`) persis sesuai **Section [07] Peta Kendali Disporapar - Command Center** pada kanvas Figma MBG. Layar pantau ini menyajikan instrumen pengawasan terpadu untuk mencapai target RPJMD **1.000 Desa Wisata Jawa Tengah 2027**: mencakup **4 Macro KPI Bars**, **Radar Kepatuhan Teritori 35 Kabupaten/Kota** berbasis sinyal semaphore (🟢 Patuh, 🟡 Perhatian, 🔴 Kritis), serta **Decision Support System (DSS)** yang menerbitkan rekomendasi prioritas penerima Bantuan Keuangan Khusus Sarpras APBD 2027 berdasarkan skor kepatuhan (*Trust Score*) faktual.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 07] Peta Kendali Disporapar - Command Center`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Command-Center-and-Admin-Flow]]
- **Token Desain Section 07:**
  - Executive Header: Gradient gelap `from-slate-950 via-[#080E21] to-[#0D2453]` border `slate-800`
  - Kontainer Kartu: Putih `#FFFFFF`, border netral `#E6ECF5`, radius `rounded-3xl`
  - Semaphore Hijau (Patuh): Titik emerald `#10B981` ring `#D1FAE5`, badge bg `#ECFDF5` teks `#047857`
  - Semaphore Kuning (Perhatian): Titik amber `#F59E0B` ring `#FEF3C7`, badge bg `#FFFBEB` teks `#B45309`
  - Semaphore Merah (Kritis): Titik rose `#F43F5E` ring `#FFE4E6`, badge bg `#FFF1F2` teks `#BE123C`

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Page Entry | `app/disporapar/page.tsx` | Halaman Command Center eksekutif Disporapar: Macro KPIs, Radar 35 Kab/Kota, dan DSS Hibah 2027 |
| API Overview Route | `app/api/disporapar/overview/route.ts` | Endpoint agregasi database real-time: metrik makro, status 35 kabupaten, prioritas hibah |
| Trust Score Service | `lib/services/trustScoreCalculator.ts` | Mesin hitung matematis deterministik $0.50 \times S_{\text{LPJ}} + 0.50 \times S_{\text{Aduan}}$ |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Executive Header Card
- Background gradient eksekutif bernuansa navy pekat ke biru malam.
- Tag berkedip (pulsing dot): *"Pusat Kendali Eksekutif Disporapar Pemprov Jateng"*.
- Headline: *"Command Center Evaluasi 1.000 Desa Wisata 2027"*.
- Subtitle: *"Monitoring kepatuhan dokumen LPJ bantuan keuangan khusus sarpras, resolusi aduan fisik (Proof-of-Fix), dan evaluasi skor kepatuhan (Trust Score) 35 Kabupaten/Kota Jawa Tengah."*
- Tombol Sinkronisasi Data dengan ikon putar (`RefreshCw`) dan badge target 1.000 desa.

### B. 4 Macro KPI Cards
1. **Desa Wisata Aktif:** `776` / 1.000 target (Progres 77,6% target RPJMD Pemprov Jateng dengan bar indikator).
2. **Kepatuhan LPJ Sarpras:** `100%` (Tervalidasi standar SSH Jateng, zero markup harga).
3. **Rasio Tuntas Aduan Fisik:** `100%` (Persentase penyelesaian berbukti foto fisik *Proof-of-Fix*).
4. **Rerata Trust Score Jateng:** `86.5` / Kategori A (Sangat Patuh) — hasil formula transparan 50% LPJ + 50% Aduan.

### C. Radar Kepatuhan Teritori 35 Kabupaten / Kota (Kolom Kiri - Span 7)
- **Filter Status Semaphore:** Tombol filter cepat `Semua`, `🟢 Patuh` ($\ge 80$), `🟡 Perhatian` ($60 - 79$), `🔴 Kritis` ($< 60$).
- **Pencarian Cepat:** Input filter instan berdasarkan nama kabupaten/kota.
- **Daftar Wilayah:**
  - Indikator lingkaran semaphore (hijau/kuning/merah).
  - Nama kabupaten/kota dan total desa wisata aktif di wilayah tersebut.
  - Skor rata-rata teritori dalam font monospaced tebal `#0D2453`.
  - Badge label kepatuhan: *"Status: Patuh"*, *"Perlu Pemantauan"*, atau *"Kritis"*.

### D. Decision Support System: Rekomendasi Hibah Sarpras 2027 (Kolom Kanan - Span 5)
- **Tujuan:** Memberikan rekomendasi berbasis bukti (*evidence-based policy*) untuk alokasi dana bantuan Pemprov Jateng berikutnya.
- **Kriteria Objektif:** Desa dengan Trust Score $\ge 80$, penyelesaian LPJ tertib tanpa deviasi harga berat, dan responsif terhadap aduan wisatawan.
- **Item Rekomendasi:**
  - Nomor urut peringkat lingkaran navy.
  - Nama desa wisata, kabupaten, dan kategori klasifikasi.
  - Badge skor kepatuhan (contoh: `Skor: 96.00`).
  - Label rekomendasi: `PRIORITAS UTAMA APBD 2027` (badge hijau berikon checklist).
  - Tautan langsung *"Cek LPJ"* menuju audit data di halaman `/transparansi`.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Desain Command Center selaras 1:1 dengan Section 07 Figma MBG (node `82:3`).
- [x] AC-2: Seluruh data agregasi berhasil dikonsumsi dari endpoint `GET /api/disporapar/overview`.
- [x] AC-3: Tombol Sinkronisasi Data memicu re-fetch data tanpa memuat ulang seluruh halaman (*no full-page reload*).
- [x] AC-4: Filter status semaphore (🟢, 🟡, 🔴) menyaring daftar 35 kabupaten/kota secara instan di sisi klien.
- [x] AC-5: Pencarian teks kabupaten/kota berfungsi reaktif (*case-insensitive debounce*).
- [x] AC-6: Modul rekomendasi hibah menampilkan daftar desa dengan skor tertinggi beserta status rekomendasi objektif.
- [x] AC-7: Seluruh tata letak responsif pada tampilan monitor layar lebar (1920x1080) maupun layar laptop (1366x768).
