---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-07"
title: "Papan Kerja Operasional Pokdarwis: Manajemen Tiket & Proof-of-Fix"
status: completed
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - pokdarwis
  - proof-of-fix
  - figma-section-06
---

# ISSUE-FE-07: Papan Kerja Operasional Pokdarwis: Manajemen Tiket & Proof-of-Fix

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan modul kerja operasional lapangan pengurus Kelompok Sadar Wisata (`app/pengelola/page.tsx` pada tab Pokdarwis via `components/PengelolaTicketBoard.tsx`) persis sesuai **Section [06] Papan Kerja Pokdarwis - Proof-of-Fix** pada kanvas Figma MBG. Modul ini menyediakan antarmuka bagi tim pengelola desa wisata untuk memantau aduan kerusakan sarana dari warga/wisatawan, mengubah status pengerjaan, dan menyelesaikan tiket secara sah melalui kewajiban mengunggah bukti fisik foto perbaikan (*Proof-of-Fix*) ber-EXIF timestamp serta ringkasan aksi teknis.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 06] Papan Kerja Pokdarwis - Proof-of-Fix`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Command-Center-and-Admin-Flow]]
- **Token Desain Section 06:**
  - Background Canvas: `#F7F9FC`
  - Kontainer Kartu Tiket: Putih `#FFFFFF`, border netral `#EBEBEB`, radius `rounded-2xl`
  - Badge Status Dikerjakan: Background `#FEF3C7`, teks `#D97706`, border `#FDE68A`
  - Badge Status Selesai: Background `#E6FFFA`, teks `#319795`, border `#B2F5EA`
  - Tombol Primer Tindakan: Navy `#0D2453` teks putih

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Portal Hub | `app/pengelola/page.tsx` | Dashboard induk operasional: Tab Papan Pokdarwis & Tab Balai Desa |
| Ticket Board Component | `components/PengelolaTicketBoard.tsx` | Filter status tiket, kartu aduan lapangan, dan tombol pemicu tindakan |
| Resolve Modal | `components/PengelolaTicketBoard.tsx` | Dialog modal penutupan tiket: upload foto perbaikan, catatan teknis, nama petugas |
| API Route Resolve | `app/api/pokdarwis/reports/[report_code]/resolve/route.ts` | Endpoint backend validasi multipart foto perbaikan, parser EXIF, dan status update |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Tab Antrean Tiket Lapangan
- Filter Kategori Status:
  - `Semua` (menampilkan seluruh tiket di desa bersangkutan).
  - `Perlu Tindakan` (`SUBMITTED`) — aduan baru yang menuntut respon tim desa.
  - `Sedang Dikerjakan` (`IN_PROGRESS`) — aduan yang sedang dalam perbaikan fisik.
  - `Selesai` (`RESOLVED`) — aduan tuntas berbukti foto *Proof-of-Fix*.
- Tampilan Kartu Tiket:
  - Kode Pelaporan resmi (format `LP-JTG-2026-XXXX`).
  - Badge Kategori (Prioritas Bahaya K3 dan Pungli ditandai badge merah mencolok).
  - Tanggal dan jam pelaporan masuk.
  - Thumbnail foto kerusakan awal yang dilaporkan warga.
  - Uraian singkat kendala fasilitas dan titik lokasi.

### B. Alur Transisi Status Tiket
1. **Transisi ke Pengerjaan:**
   - Tombol outline *"Mulai Kerjakan"* mengubah status menjadi `IN_PROGRESS`.
   - Menandakan kepada publik di halaman pelacakan bahwa tim Pokdarwis sedang menangani masalah di lokasi.
2. **Transisi ke Penyelesaian (Proof-of-Fix Resolver Modal):**
   - Tombol Navy *"Selesaikan & Unggah Bukti"* memunculkan modal penutupan laporan.

### C. Modal Penutupan Tiket Berbukti Fisik (*Proof-of-Fix*)
- **Upload Foto Hasil Perbaikan (WAJIB):** Pratinjau gambar instan. Sistem memvalidasi metadata EXIF kamera untuk memastikan tanggal pemotretan asli lebih baru daripada tanggal laporan masuk ($T_{\text{foto}} > T_{\text{laporan}}$).
- **Uraian Tindakan Teknis (WAJIB):** Penjelasan langkah teknis perbaikan fisik (misal: *"Penggantian 4 papan jembatan kayu dan perkuatan paku klem anti-karat"*).
- **Nama Petugas Lapangan (WAJIB):** Nama koordinator Pokdarwis yang bertanggung jawab.
- **Pencegahan Fraud:** Tombol *"Simpan & Tuntaskan Aduan"* terkunci jika foto atau catatan teknis belum diisi.

### D. Dampak Terhadap Ekosistem
- Tiket yang ditutup seketika tampil di:
  1. Feed Beranda *"Dari Laporan, Menjadi Perbaikan"* (`HomeReportFeed.tsx`).
  2. Komponen slider komparasi pada halaman telusur `/lapor`.
  3. Kenaikan persentase *Tingkat Penyelesaian Laporan* pada Command Center Disporapar.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Antarmuka papan kerja Pokdarwis selaras 1:1 dengan Section 06 Figma MBG (node `82:3`).
- [x] AC-2: Kartu tiket membedakan status `SUBMITTED`, `IN_PROGRESS`, dan `RESOLVED` secara visual dengan warna token yang konsisten.
- [x] AC-3: Transisi status dari `SUBMITTED` ke `IN_PROGRESS` berjalan instan dengan pembaruan database.
- [x] AC-4: Modal penutupan secara ketat mewajibkan unggahan foto hasil perbaikan dan narasi teknis.
- [x] AC-5: Penutupan tiket berhasil memanggil endpoint `POST /api/pokdarwis/reports/[report_code]/resolve`.
- [x] AC-6: Laporan yang telah diselesaikan langsung muncul di feed aduan tuntas pada Beranda publik.
- [x] AC-7: Antarmuka nyaman digunakan pada layar sentuh ponsel pintar (*mobile touch-friendly*).
