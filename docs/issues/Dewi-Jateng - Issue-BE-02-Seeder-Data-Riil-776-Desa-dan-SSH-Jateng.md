---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "be_dewijateng"
issue_id: "BE-02"
title: "Kompilasi & Injeksi Seeder 776 Desa Wisata & SSH Jateng"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - seeders
  - open-data
  - ssh-jateng
---
	
# ISSUE-BE-02: Kompilasi & Injeksi Seeder 776 Desa Wisata & SSH Jateng

## 1. Konteks & Deskripsi Fitur
Menyediakan data awal riil (*seed data*) berbasis dataset publik resmi untuk menguji seluruh skenario fungsional sistem DEWI JATENG secara komprehensif, mencakup 7 perwakilan desa wisata kunci di Jawa Tengah, tarif resmi objek wisata, pagu bantuan keuangan sarpras Rp 100 Juta, standar satuan harga (SSH) acuan material konstruksi pemprov, dan sampel laporan aduan aktif yang telah diselesaikan Pokdarwis lengkap dengan foto hasil perbaikan (*Proof-of-Fix*).

## 2. Sumber Dataset Resmi
1. **JADESTA (Jejaring Desa Wisata) Kemenparekraf:** Koordinat spasial latitude/longitude dan profil Pokdarwis.
2. **Buku Profil Desa Wisata Jawa Tengah 2023 (Disporapar Jateng):** Status klasifikasi desa (Rintisan, Berkembang, Maju, Mandiri) dan kontak resmi.
3. **Open Data Jawa Tengah:** Alokasi Bantuan Keuangan Khusus Sarana Prasarana Desa Wisata.
4. **Keputusan Gubernur Jateng Standar Satuan Harga (SSH) Barang/Jasa:** Batas atas acuan harga material konstruksi di wilayah Karesidenan Semarang, Kedu, dan Banyumas.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| SQL Seeder Script | `docker/init-db.sql` | Injeksi data awal via container Docker initialization |
| JSON Sample Villages | `lib/data/seeders/villages-jateng-sample.json` | Dataset JSON 7 desa wisata Jawa Tengah |
| JSON SSH Reference | `lib/data/seeders/ssh-rates-jateng.json` | Dataset standar harga material konstruksi |
| Drizzle / Docker Seed | `docker/init-db.sql` | Skrip seeder terpadu PostgreSQL 16 OrbStack |

## 4. Rincian Kasus Uji Seeder (Demo Test Scenarios)
1. **Desa Wisata Getas (Kab. Semarang):**
   - Kasus Uji: Insiden aduan warga `LP-JTG-2026-0012` berupa pipa pengaman Curug Klenting Kuning yang berkarat patah.
   - Status: Selesai ditangani (`RESOLVED`) dengan bukti foto pemasangan 4 batang pipa galvanis baru dan penggantian semen cor pondasi tebing.
   - Trust Score: `90.00` (Hijau).
2. **Desa Wisata Candirejo (Kab. Magelang):**
   - Kasus Uji: Desa Mandiri berprestasi dengan kepatuhan LPJ bantuan sarpras Rp 100 Juta lengkap 100%, seluruh aduan tertangani tuntas.
   - Trust Score: `96.00` (Peringkat 1 Leaderboard Jateng).
3. **Desa Wisata Limbasari (Kab. Purbalingga):**
   - Kasus Uji: Desa Berkembang dengan alokasi bantuan Rp 100 Juta yang belum mengunggah dokumen LPJ resmi (`PENDING_UPLOAD`).
   - Trust Score: `45.00` (Merah / Kritis - radar Disporapar menandai peringatan audit).
4. **Desa Lainnya:**
   - Dieng Kulon (Banjarnegara), Karangbanjar (Purbalingga), Samiran (Boyolali), Lerep (Semarang).

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Seeder berhasil menginjeksi 7 perwakilan desa wisata dengan koordinat geografis presisi ke tabel `tourist_villages`.
- [x] AC-2: Nilai koordinat otomatis terproyeksikan ke kolom PostGIS `geom` dengan format `POINT(lon lat)`.
- [x] AC-3: Seeder tarif resmi (`official_tariffs`) terpasang untuk tiket masuk, parkir motor, parkir mobil, dan paket wisata.
- [x] AC-4: Seeder bantuan dana (`village_grants`) dan rincian belanja (`grant_expenses`) memuat data realisasi belanja modal dan sisa kas.
- [x] AC-5: Tabel referensi harga SSH (`ssh_reference_rates`) memuat harga standar semen, pasir pasang Muntilan, pipa galvanis, kawat bronjong, dan cat tembok.
- [x] AC-6: Kasus aduan `LP-JTG-2026-0012` berelasi sempurna ke `report_resolutions` dengan foto Before dan After yang valid.

## 6. Verifikasi Data Terinjeksi
```bash
# Hasil verifikasi query Node pg:
Status Data: { villages: '7', reports: '3', grants: '3' }
Point Getas: POINT(110.4285 -7.3698)
Point Candirejo: POINT(110.2294 -7.6189)
```
