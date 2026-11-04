---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-03"
title: "Halaman Transparansi Dana Desa & Dokumen LPJ Bantuan Wisata"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - open-government-data
  - lpj-transparency
  - figma-section-02
---

# ISSUE-FE-03: Halaman Transparansi Dana Desa & Dokumen LPJ Bantuan Wisata

## 1. Deskripsi Fitur & Konteks
Mengimplementasikan halaman transparansi anggaran publik (`app/transparansi/page.tsx`) persis sesuai **Section [02] Transparansi Dana Desa & Dokumen LPJ** pada kanvas Figma MBG. Halaman ini menyajikan visualisasi data terbuka penggunaan dana desa dan bantuan keuangan Pemprov Jateng secara interaktif: mulai dari bilah filter 35 Kabupaten/Kota, banner total pendanaan desa, **SVG Donut Chart 3-segmen komposisi sumber dana**, kartu serapan dana terpakai vs sisa kas, serta **Tabel Pos Belanja Modal LPJ** dengan audit kesesuaian Standar Satuan Harga (SSH) dan pratinjau bukti ganda (kuitansi dan foto fisik).

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 02] Transparansi Dana Desa & Dokumen LPJ`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]], `docs/DESIGN.md`, dan [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]]
- **Token Desain Section 02:**
  - Background Canvas: `#F7F9FC`
  - Card Container: Putih `#FFFFFF`, border `#EBEBEB`, radius `rounded-3xl`
  - Header Tabel Belanja: Soft Blue `#DCE7F5` dengan teks navy `#0D2453`
  - Donut Chart Segments:
    - Segmen 1 (APBDes 60%): `#0D2453` (Primary Navy)
    - Segmen 2 (Bantuan Provinsi 25%): `#3B82F6` (Brand Accent Blue)
    - Segmen 3 (PADes Wisata 15%): `#93C5FD` (Light Blue)
  - Badge Status Wajar: Background `#E6FFFA`, teks `#319795`, border `#B2F5EA`
  - Badge Anomali Deviasi SSH: Background `#FEE2E2`, teks `#DC2626`, border `#FECACA`

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Page Entry | `app/transparansi/page.tsx` | Server Component: fetch data desa, pagu bantuan, rincian belanja, dan status audit SSH |
| Filter Bar | `components/TransparansiFilterBar.tsx` | Filter dropdown 35 Kabupaten/Kota, pilihan desa wisata, tahun anggaran, dan tombol `Tampilkan` |
| Donut Chart SVG | `components/DonutBudgetChart.tsx` | SVG Donut Chart native 3 segmen sumber dana (APBDes, Bankeu Jateng, PADes) + Legend |
| Balance Card | `components/GrantBalanceCard.tsx` | Kartu serapan dana terpakai (persentase progress ring), nominal realisasi, dan sisa kas |
| Cashbook Table | `components/CashbookTable.tsx` | Tabel belanja modal LPJ ber-header `#DCE7F5`, thumbnail kuitansi + foto fisik, dan pagination |
| Anomaly Badge | `components/PriceAnomalyBadge.tsx` | Badge indikator audit otomatis deviasi harga klaim LPJ terhadap SSH Pemprov Jateng |
| Official PDF Viewer | `components/OfficialPdfDownloadButton.tsx` | Tombol akses unduh berkas salinan resmi LPJ PDF bertandatangan Kades dan cap basah |

## 4. Spesifikasi Fungsional Per Komponen Figma

### A. Filter Wilayah & Desa
- Dropdown Kabupaten/Kota (35 daerah di Jawa Tengah, contoh: *Kabupaten Magelang*).
- Dropdown Desa Wisata aktif (contoh: *Desa Wisata Candirejo*).
- Dropdown Tahun Anggaran (contoh: *2026*).
- Tombol Primer Navy `#0D2453`: *"Tampilkan"* untuk memicu query data secara dinamis.

### B. Banner Profil Desa & Total Pendanaan
- Menampilkan nama desa dan kabupaten: *"Desa Wisata Candirejo, Kab. Magelang"*.
- Badge kategori desa (Desa Wisata Maju/Berkembang).
- Angka Pagu Utama: *"Total Pendanaan Desa: Rp 1.200.000.000,-"*.

### C. SVG Donut Chart 3 Segmen (`components/DonutBudgetChart.tsx`)
Visualisasi komposisi sumber pendanaan desa berbasis SVG native yang ringan dan interaktif:
1. **APBDes:** `60%` (`#0D2453` — Rp 720.000.000,-)
2. **Bantuan Provinsi Jawa Tengah:** `25%` (`#3B82F6` — Rp 300.000.000,-)
3. **Pendapatan Asli Desa (PADes Wisata):** `15%` (`#93C5FD` — Rp 180.000.000,-)
- Legend di samping chart menampilkan titik warna, nama pos, persentase, dan nominal rupiah.

### D. Kartu Realisasi & Sisa Kas (`components/GrantBalanceCard.tsx`)
- **Circular Progress / Serapan:** `70% Dana Terpakai` (Total Realisasi Rp 840.000.000,-).
- **Sisa Kas Desa:** `Rp 360.000.000,-` berstatus kas aman / belum terbelanjakan.
- Ringkasan kepatuhan: Status verifikasi dokumen LPJ oleh BPD dan Disporapar.

### E. Tabel Rincian Pos Belanja Modal (`components/CashbookTable.tsx`)
- **Styling Header:** Background soft blue `#DCE7F5` dengan teks tebal `#0D2453`.
- **Kolom Tabel:**
  1. `No`
  2. `Pos Pengeluaran / Kegiatan` (contoh: Pengadaan Kayu Ulin Decking, Pipa Besi Galvanis, Semen PC 50kg)
  3. `Kategori` (`Sarpras Fisik`, `Upah Kerja`, `Keselamatan K3`)
  4. `Volume & Satuan` (contoh: 40 Batang, 120 Sak, 25 HOK)
  5. `Harga Satuan Klaim LPJ` (format rupiah)
  6. `Harga Standar SSH Jateng` (batas acuan harga satuan resmi Disporapar/DPU)
  7. `Total Realisasi Biaya` (Volume $\times$ Harga Klaim)
  8. `Bukti Nota & Foto Fisik` (Thumbnail ganda: Salinan Kuitansi Toko + Foto Fisik Terpasang dengan modal pembesar lightbox)
  9. `Status Audit SSH` (Badge hijau `#319795` untuk wajar, atau badge merah `#EA4335` jika terindikasi deviasi $>+40\%$)
- **Baris Total Akumulasi:** Menjumlahkan total belanja modal di baris penutup.
- **Tombol Unduh PDF:** Membuka salinan digital LPJ resmi bersertifikasi.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Antarmuka Transparansi selaras 1:1 dengan Section 02 Figma MBG (node `82:3`).
- [x] AC-2: Filter Kabupaten dan Desa dapat memuat data riil dari 776 desa wisata se-Jawa Tengah.
- [x] AC-3: Donut chart SVG 3 segmen merender warna `#0D2453`, `#3B82F6`, dan `#93C5FD` dengan rasio matematis presisi 100%.
- [x] AC-4: Kartu serapan dana menampilkan persentase realisasi dan sisa saldo kas yang akurat (`Pagu - Realisasi = Saldo`).
- [x] AC-5: Header tabel menggunakan warna `#DCE7F5` dengan kontras tipografi navy `#0D2453`.
- [x] AC-6: Thumbnail nota kuitansi dan foto fisik dapat diklik untuk membuka modal tampilan resolusi penuh (*lightbox*).
- [x] AC-7: Pos belanja dengan selisih harga $>+40\%$ di atas standar SSH secara otomatis diberi badge peringatan anomali.
- [x] AC-8: Tombol unduh berkas LPJ resmi mengarah ke dokumen PDF tersimpan.
- [x] AC-9: Tampilan responsif pada ponsel pintar dengan alternatif tata letak kartu bertumpuk.
