---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-05"
title: "Halaman Edukasi Hak Warga, Standar K3 & Direktori Darurat"
status: completed
priority: medium
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - public-literacy
  - safety-k3
  - figma-section-04
---

# ISSUE-FE-05: Halaman Edukasi Hak Warga, Standar K3 & Direktori Darurat

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan halaman edukasi hukum dan panduan keselamatan publik (`app/edukasi/page.tsx`) persis sesuai **Section [04] Edukasi Hak Warga & Standar K3** pada kanvas Figma MBG. Halaman ini memuat pusat pengetahuan kewargaan yang tersusun atas **4 modul literasi komprehensif**: pemahaman hak keterbukaan informasi anggaran desa (UU KIP No. 14/2008), SOP penanganan aduan 4-tahap Pokdarwis, pedoman kelaikan teknis sarana wisata buatan (K3), serta direktori cepat tanggap darurat se-Jawa Tengah dengan integrasi *Click-to-Call*.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 04] Edukasi Hak Warga & Standar K3`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Product-Requirements-Document-PRD]]
- **Token Desain Section 04:**
  - Background Canvas: `#F7F9FC`
  - Kontainer Modul: Kartu putih `#FFFFFF`, border netral `#EBEBEB`, radius `rounded-3xl`
  - Ikon & Header Aksen: Navy `#0D2453`, Accent Blue `#3B82F6`, Emerald `#319795`
  - Tag Eyebrow: Background `#DCE7F5`, teks `#0D2453`, font bold

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Page Entry | `app/edukasi/page.tsx` | Halaman utama pilar 4: Header edukasi, 4 grid modul literasi, dan direktori tanggap darurat |
| UU KIP Accordion | `app/edukasi/page.tsx` | Modul literasi hak hukum warga atas dokumen LPJ dan APBDes |
| SOP Stepper Card | `app/edukasi/page.tsx` | Diagram interaktif 4-tahap respon penanganan aduan oleh Pokdarwis |
| K3 Safety Checklist | `app/edukasi/page.tsx` | Kartu spesifikasi teknis kelaikan sarana wisata buatan (kaca tempered, sling, railing tebing) |
| Emergency Directory | `app/edukasi/page.tsx` | Grid kontak darurat Basarnas, PMI, Call Center 112, dan Disporapar Jateng |

## 4. Spesifikasi Fungsional 4 Modul Edukasi Figma

### A. Modul 1: Hak Keterbukaan Informasi Warga (UU KIP No. 14/2008)
- Menjelaskan bahwa dana Bantuan Keuangan Sarpras Provinsi (Rp100.000.000,-) dan APBDes adalah uang publik (*public trust funds*).
- Menegaskan hak setiap warga desa dan wisatawan untuk mengetahui rincian pos belanja modal, nama penyedia/toko, harga satuan, dan sisa kas kas desa tanpa rasa takut atau intimidasi.
- Prosedur permintaan klarifikasi resmi kepada Balai Desa dan Badan Permusyawaratan Desa (BPD).

### B. Modul 2: SOP 4-Tahap Penanganan Aduan oleh Pokdarwis
Alur standar operasional respon cepat yang wajib dijalankan pengurus desa wisata:
1. **Tahap 1 — Verifikasi Cepat ($< 24$ Jam):** Koordinator Pokdarwis memeriksa lokasi aduan fisik yang dilaporkan warga.
2. **Tahap 2 — Pengadaan Material Standar SSH:** Pembelian material konstruksi dengan acuan batas atas Standar Satuan Harga Jawa Tengah guna mencegah markup.
3. **Tahap 3 — Pengerjaan Fisik:** Pelaksanaan perbaikan di lapangan oleh tukang desa atau tim teknis Pokdarwis.
4. **Tahap 4 — Unggah Proof-of-Fix:** Mengunggah foto hasil akhir perbaikan ber-EXIF timestamp untuk menutup tiket laporan.

### C. Modul 3: Standar K3 & Mitigasi Risiko Fasilitas Wisata
Mengangkat pelajaran nyata dari insiden runtuhnya jembatan kaca The Geong Banyumas (2023) untuk mencegah kelalaian teknis:
- **Jembatan Kaca / Gardu Pandang:** Wajib memakai kaca *laminated tempered* minimal 3 lapis (ketebalan total $> 25\text{ mm}$), batas kapasitas maksimal 10 orang per bentang, dan sertifikasi uji beban berkala.
- **Pagar Pengaman Jurang / Railing Trekking:** Struktur pipa galvanis tahan karat berdiameter minimal 2 inci dengan daya tahan beban horizontal minimal 100 kg/m.
- **Wahana Susur Sungai / Curug:** Kewajiban penyediaan rompi pelampung berstandar SNI dan sistem deteksi dini banjir bandang di hulu.

### D. Modul 4: Direktori Cepat Tanggap Darurat Jawa Tengah
Grid kartu kontak darurat yang siap dipanggil wisatawan sewaktu-waktu:
- **Basarnas Kantor SAR Semarang / Solo:** `(024) 760-7777` (Penyelamatan kecelakaan wisata air/gunung).
- **PMI Provinsi Jawa Tengah:** `(024) 354-3500` (Penanganan medis pertama & ambulans darurat).
- **Layanan Panggilan Darurat Nasional:** `112` (Bebas pulsa se-Jawa Tengah).
- **Disporapar Pemprov Jawa Tengah:** `(024) 354-6681` (Pengaduan langsung ke dinas provinsi).
- Fitur *Click-to-Call*: Tautan `tel:` aktif yang langsung membuka dialer ponsel saat diklik.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Tampilan halaman Edukasi selaras 1:1 dengan Section 04 Figma MBG (node `82:3`).
- [x] AC-2: Teks materi hukum UU KIP disajikan dengan tata bahasa yang lugas, jelas, dan memberdayakan warga.
- [x] AC-3: SOP 4-tahap penanganan aduan terilustrasikan dengan urutan langkah yang mudah dipahami pengurus desa.
- [x] AC-4: Parameter teknis K3 memuat kriteria spesifik ketebalan kaca, railing, dan standar perlengkapan keselamatan.
- [x] AC-5: Seluruh tombol kontak darurat memicu aksi panggilan telepon langsung (`tel:`) pada perangkat mobile.
- [x] AC-6: Konten halaman sepenuhnya responsif dan rapi pada semua ukuran layar.
