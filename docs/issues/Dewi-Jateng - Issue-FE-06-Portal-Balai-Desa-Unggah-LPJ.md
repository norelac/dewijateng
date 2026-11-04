---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-06"
title: "Portal Balai Desa: Unggah Dokumen LPJ Resmi & Ekstraksi Belanja"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - admin-desa
  - lpj-uploader
  - figma-section-05
---

# ISSUE-FE-06: Portal Balai Desa: Unggah Dokumen LPJ Resmi & Ekstraksi Belanja

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan modul kerja aparatur pemerintahan desa (`app/pengelola/page.tsx` pada tab Balai Desa via `components/BalaiDesaLpjUploader.tsx`) persis sesuai **Section [05] Portal Balai Desa - Unggah LPJ** pada kanvas Figma MBG. Modul ini menyediakan antarmuka bagi sekretaris desa atau kaur keuangan untuk mengunggah dokumen pindaian resmi Laporan Pertanggungjawaban (LPJ) bantuan keuangan sarana prasarana wisata berformat PDF, menginspeksi tabel pos belanja modal hasil ekstraksi, memeriksa kecocokan harga satuan terhadap acuan Standar Satuan Harga (SSH) Pemprov Jateng, serta mempublikasikannya secara terbuka ke portal transparansi warga.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 05] Portal Balai Desa - Unggah LPJ`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Command-Center-and-Admin-Flow]]
- **Token Desain Section 05:**
  - Background Canvas: `#F7F9FC`
  - Dropzone Surface: Background `#F5F5F5` dengan border putus-putus (*dashed*) `#CBD5E1`
  - Kontainer Kartu: Putih `#FFFFFF`, border netral `#EBEBEB`, radius `rounded-3xl`
  - Tombol Primer: Navy `#0D2453` teks putih
  - Badge Status Wajar: Background `#E6FFFA`, teks `#319795`

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Portal Hub | `app/pengelola/page.tsx` | Wadah tab terpadu: Papan Pokdarwis & Portal Balai Desa |
| LPJ Uploader Component | `components/BalaiDesaLpjUploader.tsx` | Dropzone seret-lepas berkas PDF, pilihan jenis bantuan dana, dan tombol terbitkan |
| Route Handler Upload | `app/api/balai-desa/lpj/upload/route.ts` | Endpoint backend penerima berkas multipart PDF dan penyimpanan lokal |
| Compliance Trigger | `app/api/compliance/check-anomaly/route.ts` | Pencocokan otomatis pos belanja hasil ekstraksi terhadap harga acuan SSH |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Dropzone Unggah Berkas LPJ PDF
- Area dropzone modern dengan ikon `FileUp` dan instruksi seret-lepas berkas.
- Validasi format berkas: Hanya menerima berkas resmi berekstensi `.pdf` dengan batas ukuran maksimal $25\text{ MB}$.
- Pilihan Parameter Bantuan:
  - *Desa Wisata:* Dropdown auto-complete 776 desa wisata se-Jawa Tengah.
  - *Tahun Anggaran:* Pilihan tahun (misal: `2026`).
  - *Skema Pendanaan:* Bantuan Keuangan Khusus Sarpras Pemprov Jateng (Rp100.000.000,-), APBDes Murni, atau Hibah Pariwisata.

### B. Pratinjau Ekstraksi & Pencocokan Harga SSH
Setelah berkas berhasil diunggah, sistem menyajikan pratinjau data belanja terstruktur:
1. **Ringkasan Pagu Anggaran:**
   - Total Pagu Diterima: Rp 100.000.000,-
   - Total Belanja Teralokasi: Rp 92.500.000,-
   - Sisa Saldo Kas Desa: Rp 7.500.000,- (wajib dilaporkan ke kas daerah)
2. **Tabel Pos Pengeluaran:**
   - Menampilkan daftar pos belanja fisik yang termuat dalam lembar kuitansi LPJ (misal: semen, pipa galvanis, upah tukang, cat anti-karat).
   - Menampilkan perbandingan langsung harga satuan klaim desa dengan batas acuan Standar Satuan Harga (SSH) Jawa Tengah.

### C. Finalisasi & Terbitkan ke Publik
- Tombol aksi utama: *"Verifikasi & Terbitkan ke Portal Transparansi"*.
- Mengirim data tervalidasi ke tabel `village_grants` dan `grant_expenses`.
- Memperbarui skor kepatuhan dokumen LPJ desa menjadi maksimal ($S_{\text{LPJ}} = 100$).
- Data yang diterbitkan langsung dapat diinspeksi oleh masyarakat luas di halaman `/transparansi`.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Antarmuka unggah dokumen selaras 1:1 dengan Section 05 Figma MBG (node `82:3`).
- [x] AC-2: Dropzone menolak berkas non-PDF atau berkas yang melebihi batas 25 MB secara aman.
- [x] AC-3: Dropdown pilihan desa mendukung pencarian instan nama desa dan kabupaten di Jawa Tengah.
- [x] AC-4: Pratinjau tabel belanja menghitung total belanja dan sisa saldo kas secara otomatis dan akurat.
- [x] AC-5: Submisi penerbitan berhasil menyimpan dokumen PDF ke storage dan mengaktifkan data di halaman `/transparansi`.
- [x] AC-6: Status kepatuhan desa seketika terbarui pada Command Center Disporapar.
