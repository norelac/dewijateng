---
type: project-issue
project_id: "Dewi-Jateng"
status: active
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - issue-tracker
  - master-index
  - frontend
  - backend
  - nextjs-14
  - postgis
  - open-government-data
---

# DEWI JATENG - Master Issue Tracker and Task Roadmap
## Repositori Target: `/Users/ilham/Documents/development/matics/dewijateng`
## Stack Utama: Next.js 14 App Router, PostgreSQL 16 + PostGIS 3.4 (OrbStack), Tailwind CSS 3.4

Pelacakan terpadu spesifikasi teknis dan tiket implementasi (*issues*) platform **DEWI JATENG** (*Platform Terpadu Transparansi LPJ Anggaran, Pengawasan Fasilitas Publik & Mitigasi Risiko Kepatuhan 1.000 Desa Wisata Jawa Tengah 2027*).

Struktur tiket disusun selaras dengan format pelacakan standar pada proyek `Dinacom`, mencakup rincian konteks, tabel berkas terdampak, aturan bisnis, kriteria keberterimaan (*acceptance criteria*), dan cuplikan teknis.

---

## 🗂️ Struktur Direktori Pelacakan (`06-Execution-and-Tracking/`)

```text
02-Projects/Dewi-Jateng/06-Execution-and-Tracking/
├── Dewi-Jateng - Issue-Tracker-Index.md                                 # Master Index Pelacakan Tiket (Berkas Ini)
│
├── Frontend Issues (Next.js 14 App Router & UI/UX)
│   ├── Dewi-Jateng - Issue-FE-01-Core-Root-Layout-and-Design-Tokens.md   # [FE-01] Layout Shell, Font, Navbar 4 Pilar & Footer
│   ├── Dewi-Jateng - Issue-FE-02-Halaman-Beranda-and-Form-Lapor.md       # [FE-02] Hero, Form Lapor Cepat, KPI & Mini Map
│   ├── Dewi-Jateng - Issue-FE-03-Halaman-Transparansi-Dokumen-LPJ.md     # [FE-03] Neraca Kas Bantuan, Tabel LPJ & Anomali SSH
│   ├── Dewi-Jateng - Issue-FE-04-Halaman-Telusuri-Aduan-Publik.md       # [FE-04] Lacak Tiket, Timeline & Proof-of-Fix Slider
│   ├── Dewi-Jateng - Issue-FE-05-Halaman-Edukasi-dan-Panduan.md         # [FE-05] Literasi UU KIP, K3 Wisata & Kontak Darurat
│   ├── Dewi-Jateng - Issue-FE-06-Portal-Balai-Desa-Unggah-LPJ.md         # [FE-06] Dropzone LPJ PDF & Pratinjau Ekstraksi Angka
│   ├── Dewi-Jateng - Issue-FE-07-Papan-Kerja-Pokdarwis-Proof-of-Fix.md   # [FE-07] Antrean Aduan & Modal Penyelesaian Bukti Fisik
│   └── Dewi-Jateng - Issue-FE-08-Peta-Kendali-Disporapar-Command-Center.md # [FE-08] Radar Spasial 35 Kab/Kota & Leaderboard Kepatuhan
│
├── Backend Infrastructure & Data Layer (PostgreSQL 16, PostGIS, Storage)
│   ├── Dewi-Jateng - Issue-BE-01-Skema-Database-PostgreSQL-PostGIS-RLS.md # [BE-01] DDL 7 Tabel, Ekstensi PostGIS, Trigger & RLS
│   ├── Dewi-Jateng - Issue-BE-02-Seeder-Data-Riil-776-Desa-dan-SSH-Jateng.md # [BE-02] Seeder 776 Desa, Standar Harga SSH & Kasus Uji
│   ├── Dewi-Jateng - Issue-BE-03-Konfigurasi-Storage-Bucket-dan-Policies.md # [BE-03] Local File Storage LPJ, Foto Aduan & Proof-of-Fix
│   └── Dewi-Jateng - Issue-BE-04-Route-Handler-Pelaporan-Aduan-Warga.md   # [BE-04] POST/GET Aduan & Generator Kode LP-JTG
│
└── AI Services, Validation & Compliance Engine
    ├── Dewi-Jateng - Issue-BE-05-Route-Handler-Proof-of-Fix-dan-Validator-EXIF.md # [BE-05] Verifikasi Metadata EXIF Timestamp Foto
    ├── Dewi-Jateng - Issue-BE-06-Route-Handler-Ekstraksi-LPJ-PDF-Multimodal-AI.md # [BE-06] Multimodal AI OCR Parser Dokumen LPJ
    ├── Dewi-Jateng - Issue-BE-07-Mesin-Pemeriksa-Deviasi-Harga-SSH-Jateng.md      # [BE-07] Audit Selisih Harga Material vs SSH Jateng
    └── Dewi-Jateng - Issue-BE-08-Kalkulator-Trust-Score-dan-API-Peta-Kendali.md  # [BE-08] Mesin Kalkulasi 50/50 & Agregasi Disporapar
```

---

## 🎨 1. Sub-Proyek: Frontend Web Application (`fe_dewijateng`)
### Acuan Desain: [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3) (Dibungkus Berbasis Figma Sections)

| Issue ID | GitHub Issue | Judul & Spesifikasi Teknis (Figma Sections) | Prioritas | Status | Berkas Target Utama |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **[[Dewi-Jateng - Issue-FE-01-Core-Root-Layout-and-Design-Tokens\|#FE-01]]** | [#1](https://github.com/norelac/dewijateng/issues/1) | **[Section 00] Design System & Foundations**<br>Primary Navy (`#0D2453`), Page Canvas (`#F7F9FC`), Card Surface (`#FFFFFF`), Border (`#EBEBEB`), Fonts (*Plus Jakarta Sans*, *Inter*, *MonteCarlo*), Floating Navbar 4 Pilar, dan Footer 4 Kolom. | Critical | Completed | `app/layout.tsx`<br>`components/Navbar.tsx`<br>`components/Footer.tsx`<br>`tailwind.config.mjs` |
| **[[Dewi-Jateng - Issue-FE-02-Halaman-Beranda-and-Form-Lapor\|#FE-02]]** | [#2](https://github.com/norelac/dewijateng/issues/2) | **[Section 01] Beranda & Form Lapor Cepat**<br>Hero Lanskap Terasering ("Dari Laporan, Menjadi Perbaikan"), 4 Animated KPI Counters (Rp185M, 889 desa, 94.2%, <24 jam), Form Lapor 2-Kolom (`#buat-laporan`), dan Live Feed Before-After. | Critical | Completed | `app/page.tsx`<br>`components/HeroMotion.tsx`<br>`components/HomeKpiCounters.tsx`<br>`components/HomeReportForm.tsx`<br>`components/HomeReportFeed.tsx` |
| **[[Dewi-Jateng - Issue-FE-03-Halaman-Transparansi-Dokumen-LPJ\|#FE-03]]** | [#3](https://github.com/norelac/dewijateng/issues/3) | **[Section 02] Transparansi Dana Desa & Dokumen LPJ**<br>Filter 35 Kab/Kota & Desa, Banner Total Pendanaan (Rp1,2M), SVG Donut Chart 3 Segmen (APBDes 60%, Bankeu 25%, PADes 15%), Card Dana Terpakai (70%), dan Tabel Belanja Modal berstatus audit SSH. | High | Completed | `app/transparansi/page.tsx`<br>`components/DonutBudgetChart.tsx`<br>`components/GrantBalanceCard.tsx`<br>`components/CashbookTable.tsx` |
| **[[Dewi-Jateng - Issue-FE-04-Halaman-Telusuri-Aduan-Publik\|#FE-04]]** | [#4](https://github.com/norelac/dewijateng/issues/4) | **[Section 03] Telusuri Aduan & Proof-of-Fix Slider**<br>Pencarian tiket `LP-JTG-2026-XXXX`, Stepper Milestone 3 Tahap, Draggable Comparison Slider Before-After bukti fisik, dan Kartu Validasi Metadata Kamera EXIF Timestamp. | High | Completed | `app/lapor/page.tsx`<br>`components/ReportSearchBox.tsx`<br>`components/ReportTimeline.tsx`<br>`components/ProofOfFixSlider.tsx` |
| **[[Dewi-Jateng - Issue-FE-05-Halaman-Edukasi-dan-Panduan\|#FE-05]]** | [#5](https://github.com/norelac/dewijateng/issues/5) | **[Section 04] Edukasi Hak Warga & Standar K3**<br>4 Modul Edukasi: Literasi UU KIP No. 14/2008 & APBDes, SOP 4-Tahap Respon Pokdarwis, Standar K3 Wahana Wisata (mitigasi jembatan kaca), dan Direktori Darurat Jateng Click-to-Call. | Medium | Completed | `app/edukasi/page.tsx` |
| **[[Dewi-Jateng - Issue-FE-06-Portal-Balai-Desa-Unggah-LPJ\|#FE-06]]** | [#6](https://github.com/norelac/dewijateng/issues/6) | **[Section 05] Portal Balai Desa - Unggah LPJ**<br>Antarmuka aparatur Balai Desa, dropzone unggah salinan resmi LPJ PDF Bantuan Keuangan Sarpras (maks 25MB), ekstraksi pos belanja modal, dan pencocokan otomatis batas SSH Jateng. | High | Completed | `components/BalaiDesaLpjUploader.tsx`<br>`app/pengelola/page.tsx` |
| **[[Dewi-Jateng - Issue-FE-07-Papan-Kerja-Pokdarwis-Proof-of-Fix\|#FE-07]]** | [#7](https://github.com/norelac/dewijateng/issues/7) | **[Section 06] Papan Kerja Pokdarwis - Proof-of-Fix**<br>Papan kerja operasional tiket aduan per desa (Semua, Perlu Tindakan, Dikerjakan, Selesai), modal penutupan tiket wajib unggah foto fisik perbaikan (*Proof-of-Fix*) ber-EXIF timestamp dan catatan teknis. | Critical | Completed | `components/PengelolaTicketBoard.tsx`<br>`app/pengelola/page.tsx` |
| **[[Dewi-Jateng - Issue-FE-08-Peta-Kendali-Disporapar-Command-Center\|#FE-08]]** | [#8](https://github.com/norelac/dewijateng/issues/8) | **[Section 07] Peta Kendali Disporapar - Command Center**<br>Executive Command Center: 4 Macro KPI bar target 1.000 desa 2027, Radar Semaphore 35 Kab/Kota (🟢 Patuh, 🟡 Perhatian, 🔴 Kritis) dengan pencarian instan, dan DSS Prioritas Hibah APBD 2027. | High | Completed | `app/disporapar/page.tsx`<br>`app/api/disporapar/overview/route.ts` |

---

## 🛠️ 2. Sub-Proyek: Backend Infrastructure & Data Layer (`be_dewijateng`)

| Issue ID | GitHub Issue | Judul & Spesifikasi Teknis | Prioritas | Status | Berkas Target Utama |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **[[Dewi-Jateng - Issue-BE-01-Skema-Database-PostgreSQL-PostGIS-RLS\|#BE-01]]** | [#9](https://github.com/norelac/dewijateng/issues/9) | **Skema Database Relasional PostgreSQL 16 & Spasial PostGIS 3.4**<br>DDL 7 tabel inti (`tourist_villages`, `official_tariffs`, `village_grants`, `grant_expenses`, `ssh_reference_rates`, `incident_reports`, `report_resolutions`), trigger koordinat ke geometry, indeks `GIST(geom)`. | Critical | Completed | `docker/init-db.sql`<br>`lib/db.ts`<br>`types/database.ts` |
| **[[Dewi-Jateng - Issue-BE-02-Seeder-Data-Riil-776-Desa-dan-SSH-Jateng\|#BE-02]]** | [#10](https://github.com/norelac/dewijateng/issues/10) | **Kompilasi & Injeksi Seeder 776 Desa Wisata & SSH Jateng**<br>Injeksi dataset riil JADESTA Kemenparekraf & Disporapar Jateng 2023, data pagu LPJ bantuan Rp 100jt, tarif resmi, sampel harga acuan SSH material konstruksi. | High | Completed | `docker/init-db.sql`<br>`lib/data/seeders/villages-jateng-sample.json` |
| **[[Dewi-Jateng - Issue-BE-03-Konfigurasi-Storage-Bucket-dan-Policies\|#BE-03]]** | [#11](https://github.com/norelac/dewijateng/issues/11) | **Konfigurasi Penyimpanan Berkas Lokal (`public/uploads`) & Validasi Akses**<br>3 Direktori terisolasi: `official-documents` (PDF LPJ maks 20MB), `reports` (foto kerusakan maks 10MB), dan `proof-of-fix` (foto perbaikan maks 10MB). | High | Completed | `lib/storage.ts`<br>`public/uploads/` |
| **[[Dewi-Jateng - Issue-BE-04-Route-Handler-Pelaporan-Aduan-Warga\|#BE-04]]** | [#12](https://github.com/norelac/dewijateng/issues/12) | **Service Pelaporan Aduan Warga, Server Action Form Lapor & Public REST API**<br>Server Action `submitReportAction` untuk form cepat Beranda, service `createIncidentReport`, generator kode tiket `LP-JTG-2026-XXXX`, hashing nomor pelapor, dan Public API `GET/POST /api/reports`. | Critical | Open | `app/actions/reportActions.ts`<br>`app/api/reports/route.ts`<br>`lib/services/reportService.ts` |

---

## 🤖 3. Sub-Proyek: AI Services, Verification & Compliance Engine (`ai_dewijateng`)

| Issue ID | GitHub Issue | Judul & Spesifikasi Teknis | Prioritas | Status | Berkas Target Utama |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **[[Dewi-Jateng - Issue-BE-05-Route-Handler-Proof-of-Fix-dan-Validator-EXIF\|#BE-05]]** | [#13](https://github.com/norelac/dewijateng/issues/13) | **Service Proof-of-Fix, Validator EXIF & Server Action Resolusi Tiket**<br>Server Action `resolveReportAction` pada Papan Pokdarwis, validasi temporal EXIF ($T_{\text{foto}} > T_{\text{laporan}}$), upload bukti ke `public/uploads/proof-of-fix`, dan API endpoint `/api/pokdarwis/reports/[code]/resolve`. | Critical | Completed | `app/actions/resolutionActions.ts`<br>`lib/services/exifValidator.ts`<br>`app/api/pokdarwis/reports/[report_code]/resolve/route.ts` |
| **[[Dewi-Jateng - Issue-BE-06-Route-Handler-Ekstraksi-LPJ-PDF-Multimodal-AI\|#BE-06]]** | [#14](https://github.com/norelac/dewijateng/issues/14) | **Service Ekstraksi LPJ AI Multimodal & Server Action Upload Dokumen**<br>Server Action `processLpjUploadAction` di Portal Balai Desa, service multimodal AI parser PDF menjadi JSON rincian anggaran terstruktur, dan Public API `POST /api/balai-desa/lpj/upload`. | High | Open | `app/actions/lpjActions.ts`<br>`lib/services/aiDocumentExtractor.ts`<br>`app/api/balai-desa/lpj/upload/route.ts` |
| **[[Dewi-Jateng - Issue-BE-07-Mesin-Pemeriksa-Deviasi-Harga-SSH-Jateng\|#BE-07]]** | [#15](https://github.com/norelac/dewijateng/issues/15) | **Mesin Pemeriksa Deviasi Harga Material vs SSH Pemprov Jateng**<br>Domain service audit harga belanja LPJ vs standar SSH Pemprov Jateng (flag jika selisih $> +40\%$), dipanggil langsung oleh Server Action LPJ dan Server Component Transparansi. | Medium | Open | `lib/services/priceAnomalyChecker.ts`<br>`app/api/compliance/check-anomaly/route.ts` |
| **[[Dewi-Jateng - Issue-BE-08-Kalkulator-Trust-Score-dan-API-Peta-Kendali\|#BE-08]]** | [#16](https://github.com/norelac/dewijateng/issues/16) | **Kalkulator Matematis Transparan Trust Score 50/50 & Agregasi Peta Kendali**<br>Formula $0.50 \times S_{\text{LPJ}} + 0.50 \times S_{\text{Aduan}}$, dipanggil langsung di Server Component `app/disporapar/page.tsx` tanpa jeda fetch HTTP, serta Public Open API `GET /api/disporapar/overview`. | High | Open | `lib/services/trustScoreCalculator.ts`<br>`app/disporapar/page.tsx`<br>`app/api/disporapar/overview/route.ts` |

---

## 🔗 Navigasi & Tautan Terkait
- Kembali ke Master Index Vault: [[Dewi-Jateng - Vault-Index]]
- Master Rancang UI/UX & Detail Per Halaman: [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]]
- Skema Database & Relasi Model: [[Dewi-Jateng - Database-Schema-and-Models]]
- Katalog Endpoint REST API: [[Dewi-Jateng - API-Reference]]
- Aturan Bisnis & Logika Transparansi: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]]
