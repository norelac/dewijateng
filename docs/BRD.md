---
type: project-note
project_id: "DEWI-JATENG"
status: active
created: 2026-10-23
updated: 2026-11-02
tags:
  - dewi-jateng
  - brd
  - business-requirements
  - core-product
  - governance
  - fiscal-transparency
  - civic-reporting
  - proof-of-fix
  - nextjs-fullstack
---

# Business Requirements Document (BRD)
## Platform DEWI JATENG
### Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah

---

**Identifikasi Dokumen:**
- **Nama Proyek:** DEWI JATENG (*Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah*)
- **Nomor Dokumen:** BRD-DEWIJATENG-2026-V3.1
- **Versi:** 3.1 (Full Alignment: WIA 2026 Scope, Next.js 14/15 Fullstack Architecture, 5 Halaman Utama, Data Riil Disporapar Jateng & Kasus The Geong Limpakuwus)
- **Status:** Disetujui (Approved)
- **Klasifikasi:** Dokumen Spesifikasi Kebutuhan Bisnis dan Kebijakan Publik
- **Sasaran Pembaca:** Dinas Kepemudaan, Olahraga dan Pariwisata (Disporapar) Provinsi Jawa Tengah, Dinas Pemberdayaan Masyarakat, Desa, Kependudukan dan Pencatatan Sipil (Dispermadesdukcapil), Pemerintah Desa, Kelompok Sadar Wisata (Pokdarwis), Badan Permusyawaratan Desa (BPD), Dewan Juri Kompetisi Web In Action (WIA) 2026 / MIA 2026 UPN "Veteran" Jakarta, serta Tim Pengembang **sotodiensracing** (Universitas Dian Nuswantoro)
- **Struktur Tim Teknis:**
  * **Muhammad Iqbal Junialdi** — Hustler & Frontend Developer (Fokus: UI/UX, Next.js Pages, Framer Motion, Client Forms)
  * **Muhammad Ilham Maulana** — Hacker & Backend Developer (Fokus: PostgreSQL, PostGIS, Next.js Route Handlers, Server Actions, Supabase)
  * **Delvia Mareta Dealova** — Hipster & Product Designer (Fokus: Figma Design System MBG, User Flow, Visual Identity)
- **Dokumen Terkait:** Product Requirements Document (PRD-DEWIJATENG-2026-V3.1)

---

## 1. Ringkasan Eksekutif

### 1.1 Konteks Kebijakan & Urgensi Makro
Pemerintah Provinsi Jawa Tengah menetapkan target ambisius pengembangan **1.000 Desa Wisata pada tahun 2027** berdasarkan mandat Peraturan Daerah (Perda) Provinsi Jawa Tengah No. 2 Tahun 2019 tentang Pemberdayaan Desa Wisata. Program ini dirancang sebagai motor penggerak ekonomi kerakyatan berbasis pariwisata komunitas (*Community-Based Tourism*).

Berdasarkan data resmi Dinas Kepemudaan, Olahraga, dan Pariwisata (Disporapar) Provinsi Jawa Tengah (2023), saat ini telah tercatat **776 Desa Wisata**, dengan stratifikasi kematangan:
- **583 Desa Wisata Rintisan (75,1%)** — Masih dalam tahap embrio, fasilitas darurat, tata kelola swadaya rentan penyimpangan.
- **159 Desa Wisata Berkembang (20,5%)** — Telah memiliki arus kunjungan teratur namun tata kelola keuangan belum terstandardisasi.
- **34 Desa Wisata Maju (4,4%)** — Tata kelola stabil dan mandiri secara fiskal.

Sebagai stimulus akselerasi, Pemerintah Provinsi Jawa Tengah telah menyalurkan **Bantuan Keuangan (Bankeu) Khusus Sarana Prasarana Desa Wisata periode 2020–2023 sebesar Rp87,5 Miliar kepada 631 desa wisata**, dengan realisasi terserap sebesar **Rp83,1 Miliar di 592 desa wisata**. Namun, untuk tahun anggaran 2025, stimulus Bankeu ditiadakan untuk efisiensi fiskal daerah, menuntut desa wisata untuk mandiri, akuntabel, dan mengoptimalkan kontribusi Pendapatan Asli Desa (PADes).

Ketiadaan sistem pemantauan real-time yang terdesentralisasi memicu dua anomali kritis:
1. **Asimetri Informasi Alokasi Anggaran:** Publik dan warga desa tidak mengetahui rincian belanja fisik dari dana Bankeu dan APBDes, memicu kerawanan markup dan belanja fiktif.
2. **Krisis Keselamatan dan Kepatuhan K3:** Pembangunan wahana ekstrim atau fasilitas publik desa wisata seringkali mengabaikan uji kelayakan standar keselamatan (*commissioning*).

Tragedi pecahnya jembatan kaca **"The Geong" di Hutan Pinus Limpakuwus, Kabupaten Banyumas pada 25 Oktober 2023** (1 korban tewas, 3 luka-luka) menjadi lonceng peringatan nasional: wahana dibangun tanpa izin uji kelaikan, tanpa SOP K3, kaca bekas setebal hanya 1,2 cm (di bawah standar minimal 2,5 cm tempered-laminated), serta nihil audit berkala dari otoritas terkait.

Mengangkat tema kompetisi WIA 2026: **"From Visionaries to Architects of Change - Powering Public Transparency"**, platform **DEWI JATENG** hadir mentransformasi paradigma pengawasan dari manual-reaktif menjadi digital-preventif berbasis partisipasi publik terverifikasi (*Closed-Loop Civic Reporting & Proof-of-Fix*).

---

## 2. Pernyataan Masalah Empiris Lapangan

1. **Kotak Hitam Anggaran Desa Wisata (Budget Black Box):**
   Miliaran rupiah dana Bankeu dan APBDes terserap ke desa wisata rintisan, namun nota belanja riil (material semen, besi, kayu, pengadaan alat pengaman) tidak pernah dipublikasikan secara transparan baris demi baris kepada publik.
2. **Ketiadaan Kanal Aduan Khusus Bergaransi SLA:**
   Laporan wisatawan dan warga lokal terkait wahana retak, fasilitas rusak, atau pungutan liar parkir/tiket berceceran di media sosial tanpa kejelasan pihak penanggung jawab dan tanpa batas waktu penyelesaian yang mengikat.
3. **Penyelesaian Aduan Kosong (No Accountability Loop):**
   Ketika pengelola mengklaim laporan telah "selesai ditindaklanjuti", tidak ada mekanisme pembuktian fisik autentik apakah perbaikan benar-benar dilakukan sesuai standar keselamatan.
4. **Nihilnya Peringkat Kepatuhan Obyektif (Dynamic Trust Index):**
   Pemerintah Provinsi dan Dinas Pariwisata Kabupaten kesulitan memetakan desa wisata berisiko tinggi (*high-risk compliance*) akibat tidak adanya agregasi indikator serapan anggaran dan riwayat aduan publik.

---

## 3. Ruang Lingkup Sistem & Struktur Solusi (5 Halaman Utama)

Platform **DEWI JATENG** membatasi ruang lingkup pada 5 halaman web terintegrasi tanpa fitur komersial tiket/booking, guna memastikan fokus 100% pada transparansi anggaran dan keselamatan publik:

```text
DEWI JATENG (5 Halaman Terpadu - Next.js 14/15 App Router)
├── 1.0 Beranda (app/page.tsx)                -> Hero transparansi, KPI 776 Desa, Form Aduan Cepat, Feed Proof-of-Fix
├── 2.0 Transparansi (app/transparansi/page.tsx) -> Filter 35 Kab/Kota, Visualisasi Sumber Dana, Bar Serapan, Buku Kas & Modal Nota
├── 3.0 Lapor Aduan (app/lapor/page.tsx)        -> Peta Koordinat GPS Leaflet, Upload Bukti, Timer SLA Dinamis (24 Jam / 7 Hari)
├── 4.0 Edukasi & Panduan (app/edukasi/page.tsx)-> Panduan UU KIP No. 14/2008 & Perda Jateng No. 2/2019, SOP Penanganan Bahaya
└── 5.0 Portal Pengelola (app/pengelola/page.tsx)-> Verifikasi Nota Belanja, Disposisi Tiket Aduan, Wajib Upload Bukti Perbaikan
```

### 3.1 Rincian Modul Per Halaman

#### Modul 1: Beranda Akuntabilitas Publik (`/`)
- **Hero Akuntabilitas:** Menampilkan ringkasan komitmen keterbukaan tata kelola desa wisata Jawa Tengah.
- **KPI Metrik Makro:** Menampilkan agregat data riil Jawa Tengah (776 desa wisata: 583 rintisan, 159 berkembang, 34 maju; total dana bantuan terserap; indeks kepatuhan rata-rata; total aduan selesai).
- **Quick Report Form:** Widget pelaporan instan langsung di beranda untuk mempercepat pelaporan bahaya.
- **Feed Proof-of-Fix:** Galeri interaktif komparasi foto Before-After perbaikan fasilitas yang telah tervalidasi.

#### Modul 2: Portal Transparansi Dana Desa Wisata (`/transparansi`)
- **Filter Wilayah 35 Kabupaten/Kota:** Navigasi data spesifik hingga tingkat desa di Jawa Tengah.
- **Visualisasi Komposisi Anggaran:** Grafik perbandingan sumber pendanaan: APBDes, Bantuan Keuangan (Bankeu) Pemprov, dan PADes Wisata.
- **Bar Progress Serapan Anggaran:** Pemantauan persentase realisasi fisik vs keuangan.
- **Buku Kas Terbuka Baris-demi-Baris:** Tabel transaksi belanja terbuka dengan tanggal, deskripsi pekerjaan, penerima pembayaran, dan nominal.
- **Modal Inspeksi Nota Riil:** Pop-up preview foto fisik nota/kuitansi material toko yang diaudit dengan verifikasi OCR Standar Satuan Harga (SSH) Pemprov Jateng.

#### Modul 3: Sistem Pelaporan Aduan Partisipatif (`/lapor`)
- **Formulir Terstandarisasi:** Kategori spesifik (Pungli Parkir/Tiket, Kerusakan Fasilitas, Bahaya Keselamatan K3, Sanitasi & Kebersihan).
- **Peta Geolokasi Interaktif:** Integrasi Leaflet.js & OpenStreetMap untuk penentuan titik koordinat kejadian secara presisi.
- **Unggah Bukti Foto/Video:** Upload berkas bukti lapangan dengan ekstraksi metadata lokasi.
- **Dynamic SLA Countdown Badge:**
  * **24 Jam:** Batas penyelesaian untuk aduan Pungutan Liar (Pungli) dan getok tarif.
  * **168 Jam (7 Hari):** Batas penyelesaian untuk perbaikan fasilitas fisik dan bahaya K3.
- **Proteksi Whistleblower:** Opsi lapor anonim demi keamanan pelapor.

#### Modul 4: Pusat Edukasi & Regulasi (`/edukasi`)
- **Kompilasi Hak Keterbukaan Informasi:** Ringkasan hak warga berdasarkan UU KIP No. 14 Tahun 2008 dalam mengakses penggunaan dana desa.
- **Panduan Perda Jateng No. 2 Tahun 2019:** Edukasi klasifikasi desa wisata dan kewajiban standar tata kelola.
- **Standard Operating Procedure (SOP) K3:** Pedoman mitigasi bencana dan keselamatan wahana wisata alam/buatan guna mencegah insiden seperti The Geong.
- **Alur Penyelesaian Tiket (Flowchart):** Panduan transparan alur penanganan tiket dari input hingga penyelesaian.

#### Modul 5: Portal Pengelola & Auditor (`/pengelola`)
- **Buku Kasir & Verifikasi Nota Belanja:** Pengunggahan dan verifikasi nota pengeluaran kas operasional dan modal.
- **Papan Disposisi Tiket SLA:** Tabel eskalasi tiket berurutan berdasarkan sisa waktu countdown (indikator warna Hijau, Kuning, Merah Darurat).
- **Gerbang Validasi Proof-of-Fix:** Status tiket terkunci pada status *In Progress* dan sistem menolak status *Resolved* kecuali pengelola mengunggah foto fisik hasil perbaikan (*After*) beserta catatan perbaikan dan nama petugas penanggung jawab.

---

## 4. Sasaran Bisnis & Matriks Indikator Kinerja Utama (KPI)

| Kode KPI | Indikator Kinerja Utama | Baseline Eksisting (Kondisi Lapangan) | Target DEWI JATENG |
| :--- | :--- | :--- | :--- |
| **KPI-01** | Transparansi Nota Belanja Modal Desa | 0% (Nota disimpan rapat di laci pengurus) | **100% Transaksi Kas Terlampir Foto Nota Riil** |
| **KPI-02** | Waktu Tanggap Aduan Pungutan Liar | Diabaikan / Berhari-hari di media sosial | **< 24 Jam (Closed-Loop SLA Enforced)** |
| **KPI-03** | Waktu Penyelesaian Fasilitas Rusak / Bahaya K3 | > 30 hari / Dibiarkan hingga timbul korban | **Maksimal 7 Hari Kalender (Wajib Proof-of-Fix)** |
| **KPI-04** | Validitas Penyelesaian Aduan | 0% bukti fisik (Klaim sepihak pengelola) | **100% Status Resolved Wajib Foto Before-After** |
| **KPI-05** | Cakupan Data Pemetaan Desa Wisata | Terfragmentasi di dokumen PDF dinas | **100% dari 776 Desa Wisata Jateng Terpetakan Digital** |
| **KPI-06** | Audit Kesesuaian Harga Belanja | Manual sampling oleh inspektorat | **Deteksi Otomatis Anomali Markup vs SSH Jateng** |

---

## 5. Matriks Stakeholder & Nilai Manfaat

| Peran Pemangku Kepentingan | Hak & Wewenang Sistem | Nilai Manfaat yang Diterima |
| :--- | :--- | :--- |
| **Wisatawan & Publik** | • Menelusuri transparansi dana desa wisata.<br>• Melaporkan pungli dan kerusakan fasilitas via GPS.<br>• Memantau countdown timer SLA aduan. | Kepastian tarif resmi, wahana bergaransi aman, saluran aduan terpercaya dan ditindaklanjuti cepat. |
| **Warga Desa & BPD** | • Memeriksa buku kas terbuka dan foto nota riil belanja.<br>• Melakukan verifikasi audit partisipatif di lapangan.<br>• Whistleblower pelaporan indikasi penyelewengan. | Akuntabilitas pemanfaatan dana Bankeu/APBDes, mencegah korupsi pengurus, menjamin keselamatan desa. |
| **Pengelola Pokdarwis / BUMDes** | • Input pengeluaran kas dan upload nota pembelian.<br>• Menerima notifikasi tiket aduan berdasar batas SLA.<br>• Mengunggah bukti foto perbaikan (*Proof-of-Fix*). | Kredibilitas dan kepercayaan wisatawan meningkat, kepatuhan tata kelola terjamin, terhindar dari sanksi hukum. |
| **Disporapar & Pemprov Jateng** | • Dashboard pengawasan agregat 776 desa wisata.<br>• Evaluasi Dynamic Trust Score berbasis kepatuhan.<br>• Penapisan otomatis desa penerima bantuan fiskal. | Pengawasan efektif tanpa perlu inspeksi fisik ke seluruh desa, mitigasi dini risiko bencana/kegagalan wahana. |

---

## 6. Batasan Regulasi & Aturan Kepatuhan

1. **UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik (KIP):**
   Anggaran pemerintah desa dan bantuan keuangan provinsi merupakan informasi publik terbuka yang wajib dapat diakses secara berkala dan serta-merta.
2. **Peraturan Daerah Provinsi Jawa Tengah No. 2 Tahun 2019:**
   Pengembangan desa wisata wajib mengedepankan pemberdayaan warga lokal, pelestarian lingkungan, dan akuntabilitas tata kelola.
3. **Standar K3 Pariwisata & Mitigasi Risiko Wahana (Pasca Kasus The Geong Banyumas):**
   Fasilitas wisata berisiko tinggi wajib memiliki sertifikasi kelaikan fungsi dan prosedur operasional standar tanggap darurat yang dipublikasikan.
4. **Prinsip Validasi Proof-of-Fix Mutlak:**
   Sistem tidak mengizinkan penutupan tiket aduan apapun tanpa bukti foto autentik hasil perbaikan nyata di lapangan.
