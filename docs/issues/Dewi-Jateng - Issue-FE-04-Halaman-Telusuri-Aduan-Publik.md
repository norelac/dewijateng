---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-04"
title: "Halaman Telusuri Aduan Publik & Proof-of-Fix Slider Interaktif"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - civic-tracking
  - proof-of-fix
  - figma-section-03
---

# ISSUE-FE-04: Halaman Telusuri Aduan Publik & Proof-of-Fix Slider Interaktif

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan halaman penelusuran status aduan masyarakat dan wisatawan (`app/lapor/page.tsx`) persis sesuai **Section [03] Telusuri Aduan & Proof-of-Fix Slider** pada kanvas Figma MBG. Halaman ini berfungsi sebagai gerbang transparansi penanganan keluhan fisik di desa wisata: mulai dari pencarian kode tiket unik `LP-JTG-2026-XXXX`, **stepper linimasa 3 tahap**, **slider interaktif Before-After (*Proof-of-Fix*)** dengan pegangan geser (*drag handle*), hingga kartu validasi metadata kamera EXIF timestamp yang membuktikan pekerjaan fisik benar-benar telah selesai.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 03] Telusuri Aduan & Proof-of-Fix Slider`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Citizen-and-Tourist-UI-Flow]]
- **Token Desain Section 03:**
  - Background Canvas: `#F7F9FC`
  - Kontainer Kartu: Putih `#FFFFFF`, border netral `#EBEBEB`, radius `rounded-3xl`
  - Search Input: Background `#F5F5F5`, border `#EBEBEB`, teks navy `#0D2453`
  - Slider Divider Handle: Lingkaran putih `#FFFFFF` berbayangan `shadow-lg` dengan ikon panah ganda `↔`
  - Badge Status Selesai: Background `#E6FFFA`, teks `#319795`, border `#B2F5EA`
  - Badge Status Pengerjaan: Background `#FEF3C7`, teks `#D97706`, border `#FDE68A`

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Page Entry | `app/lapor/page.tsx` | Halaman utama pelacakan tiket, form pencarian, fetch status aduan dari API |
| Search Box | `components/ReportSearchBox.tsx` | Bilah input kode tiket berformat `LP-JTG-2026-XXXX` dengan tombol cari navy `#0D2453` |
| Status Stepper | `components/ReportTimeline.tsx` | Stepper visual 3 tahap status: `SUBMITTED`, `IN_PROGRESS`, `RESOLVED` |
| Proof-of-Fix Slider | `components/ProofOfFixSlider.tsx` | Komponen slider geser foto Before (kerusakan) vs After (perbaikan fisik) |
| EXIF Metadata Card | `components/ReportResolutionCard.tsx` | Kartu rincian tindakan Pokdarwis, penanggung jawab, dan badge validasi EXIF kamera |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Bilah Pencarian Tiket (`ReportSearchBox.tsx`)
- Input teks di tengah layar dengan background `#F5F5F5` dan border `#EBEBEB`.
- Ikon pencarian (*Search*) di sisi kiri.
- Placeholder informatif: `"Ketik Kode Pelaporan, contoh: LP-JTG-2026-0042"`.
- Auto-uppercase dan validasi format regex `^LP-JTG-\d{4}-\d{4}$`.
- Tombol aksi Navy `#0D2453`: *"Cari Aduan"*.
- Mendukung direct link dari URL query parameter: `/lapor?code=LP-JTG-2026-0012` atau `/lapor?tiket=...`.

### B. Header Kartu Aduan & Stepper Milestone 3 Tahap
- Menampilkan judul aduan, nama desa wisata, tanggal pelaporan, dan badge status:
  - **Tahap 1: Diterima (`SUBMITTED`)** — Badge biru muda `#DCE7F5` / teks `#0D2453`.
  - **Tahap 2: Dikerjakan (`IN_PROGRESS`)** — Badge amber `#FEF3C7` / teks `#D97706`.
  - **Tahap 3: Selesai (`RESOLVED`)** — Badge hijau `#E6FFFA` / teks `#319795`.
- Stepper 3 Tahap Horizontal:
  1. *Laporan Masuk & Diverifikasi* (tanggal & jam tercatat).
  2. *Penanganan Lapangan oleh Pokdarwis* (alokasi tukang & material).
  3. *Tuntas Berbukti Fisik (Proof-of-Fix)* (terverifikasi sistem).

### C. Komponen Interaktif Proof-of-Fix Slider (`ProofOfFixSlider.tsx`)
- Menampilkan dua foto bertumpuk (*stacked layers*) dengan batas pemisah vertikal:
  - **Foto Kiri (Sebelum / Before):** Foto kerusakan fisik saat pertama kali dilaporkan warga.
  - **Foto Kanan (Sesudah / After):** Foto sarana yang telah selesai diperbaiki oleh Pokdarwis.
- **Draggable Center Handle:**
  - Tombol lingkaran putih di tengah garis pembatas dengan ikon panah ganda `↔`.
  - Mendukung interaksi sentuhan jari pada layar ponsel pintar (*touch drag*) dan drag mouse pada desktop secara mulus (*smooth 60fps*).
  - Label pill mengambang: *"Sebelum"* di sudut kiri atas dan *"Sesudah"* di sudut kanan atas.
- State Khusus: Jika laporan masih `SUBMITTED` atau `IN_PROGRESS`, komponen menampilkan foto awal dengan banner informatif *"Menunggu Tindak Lanjut Pokdarwis"*.

### D. Kartu Rincian Validasi EXIF & Narasi Teknis (`ReportResolutionCard.tsx`)
- **Badge Verifikasi EXIF Kamera:**
  - Kontainer hijau soft `#E6FFFA` border `#B2F5EA`.
  - Ikon `ShieldCheck` dengan teks bold: *"Bukti Fisik Terverifikasi Otomatis"*.
  - Parameter EXIF yang divalidasi: Tanggal pemotretan asli kamera (`DateTimeOriginal`), status waktu ($T_{\text{foto}} > T_{\text{laporan}}$), dan model perangkat.
- **Rincian Tindakan Fisik:** Narasi perbaikan dari Pokdarwis (contoh: *"Penggantian 4 batang pipa galvanis 2 inci dan pengelasan ulang pengaman jurang"*).
- **Petugas Penanggung Jawab:** Nama koordinator lapangan Pokdarwis.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Antarmuka pelacakan aduan selaras 1:1 dengan Section 03 Figma MBG (node `82:3`).
- [x] AC-2: Input pencarian otomatis mengonversi teks input menjadi huruf kapital sesuai format `LP-JTG-2026-XXXX`.
- [x] AC-3: Query URL `?code=...` otomatis memicu pengambilan data status laporan dari API `GET /api/reports/[code]`.
- [x] AC-4: Stepper 3 tahap menampilkan milestone yang aktif dengan indikator warna yang sesuai.
- [x] AC-5: Slider Before-After dapat digeser secara interaktif baik melalui mouse desktop maupun gesture sentuh smartphone.
- [x] AC-6: Kartu verifikasi EXIF menampilkan tanggal pemotretan asli foto sesudah perbaikan dan memastikan foto tidak dipalsukan.
- [x] AC-7: Tersedia tombol salin tautan dan bagikan ke WhatsApp untuk kemudahan pelapor memantau aduannya.
