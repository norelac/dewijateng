# 🎨 DESIGN.md — Design System & UI/UX Guidelines: DEWI JATENG

> **Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah**  
> **Kompetisi:** Web In Action (WIA) 2026 / Multimedia In Action (MIA) 2026, UPN "Veteran" Jakarta  
> **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)  
> **Lead Frontend:** Muhammad Iqbal Junialdi (*Hustler & Frontend Developer, Tim sotodiensracing UDINUS*)  
> **Lead UI/UX:** Delvia Mareta Dealova (*Hipster & Product Designer*)

---

## 🏛️ 1. Filosofi Desain & Karakter Visual

1. **Government-Grade Clean & Transparent:** Tampilan kredibel, bersih, dan akuntabel sesuai standar keterbukaan informasi publik Pemerintah Provinsi Jawa Tengah, tanpa kesan kaku atau birokratis.
2. **React Server Components (RSC) + Client Motion:** Layout dasar dan konten teks dirender di server. JavaScript dinamis hanya dimuat pada komponen interaktif yang membutuhkan Framer Motion (`'use client'`).
3. **Smooth Micro-Interactions (Framer Motion):** Transisi viewport-triggered counter, slider geser Sebelum-Sesudah, interaksi pin peta GPS, serta modal inspeksi nota kuitansi dirancang halus dengan spring physics.
4. **Fidelity 1:1 terhadap Figma MBG:** Struktur layout, dimensi kartu, palet warna, tipografi, dan elemen visual mengikuti rancangan Figma yang telah disetujui.

---

## 🎨 2. Design Tokens (Figma MBG Exact Palette)

### A. Palet Warna (Color Palette)

| Token Name | Hex Code | Tailwind Equivalent / Usage | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Navy** | `#0D2453` | `text-[#0D2453]` / `bg-[#0D2453]` | Judul utama, tombol CTA primer, teks navbar, ring donat APBDes 60%, footer dark background |
| **Page Canvas** | `#F7F9FC` | `bg-[#F7F9FC]` | Latar belakang keseluruhan halaman web (soft blue-gray canvas) |
| **Card Surface** | `#FFFFFF` | `bg-white` | Kontainer kartu, form panel, baris tabel, dan modal |
| **Border Neutral** | `#EBEBEB` | `border-[#EBEBEB]` | Garis pembatas kartu, separator antar section, divider tabel |
| **Input Surface** | `#F5F5F5` | `bg-[#F5F5F5]` | Input field, dropdown select, dan background form control |
| **Muted Text** | `#767676` | `text-[#767676]` | Teks sekunder, label pembantu, timestamp, dan teks status netral |
| **Brand Accent Blue** | `#3B82F6` | `text-[#3B82F6]` / `bg-[#3B82F6]` | Donut segment Bantuan Provinsi (25%), link hover, indikator peta |
| **Light Blue Accent** | `#93C5FD` / `#DCE7F5` | `bg-[#93C5FD]` / `bg-[#DCE7F5]` | Donut segment PADes (15%), progress bar track, header tabel |
| **Status Selesai (Green)**| `#E6FFFA` (bg) / `#319795` (text) | `bg-[#E6FFFA] text-[#319795]` | Badge status laporan *"Selesai"* dengan border `#B2F5EA` |
| **Alert / Warning** | `#EA4335` | `bg-[#EA4335]` / `text-[#EA4335]` | Pin aktif peta, alert bahaya fasilitas K3, indikator urgensi SLA |

### B. Tipografi (Typography)

| Role | Font Family | Tailwind Classes | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Body & Headings** | `Plus Jakarta Sans`, `Inter`, sans-serif | `font-sans text-[#0D2453]` | Navbar, isi tabel, kartu KPI, form aduan |
| **Hero Eyebrow (Cursive)** | `Playfair Display`, serif italic | `font-serif italic text-xl sm:text-2xl text-white/95` | Subtitle hero *"Desa Wisata Jawa Tengah"* |
| **Headline Display** | `Plus Jakarta Sans`, sans-serif | `text-4xl sm:text-5xl lg:text-6xl font-extrabold` | Judul hero *"Dari Laporan, Menjadi Perbaikan"* |
| **KPI Numbers** | `Plus Jakarta Sans`, sans-serif | `text-2xl sm:text-3xl font-extrabold text-[#0D2453]` | `Rp 185 Miliar`, `889`, `94,2%`, `< 24 Jam` |
| **Section Headings** | `Plus Jakarta Sans`, sans-serif | `text-xl sm:text-2xl font-bold text-[#0D2453]` | *"Transparansi Dana Desa"*, *"Buat Laporan"* |
| **Metadata & Labels** | `Inter`, sans-serif | `text-xs text-[#767676] font-medium` | Timestamp laporan, keterangan nota, pagination |

### C. Elevasi, Border Radius, & Spacing

- **Corner Radius:**
  * Tag / Badge: `rounded-full` (`9999px`)
  * Input & Dropdown: `rounded-xl` (`12px`)
  * Kartu KPI & Kontainer Form: `rounded-2xl` (`16px`)
  * Hero Banner & Section Utama: `rounded-3xl` (`24px`)
- **Bayangan (Shadows):**
  * Kartu Konten: `shadow-xs` / `shadow-sm` dengan border halus `#EBEBEB`
  * Floating Navbar: `shadow-sm backdrop-blur-md`
  * Modal Pop-up: `shadow-2xl`
- **Grid & Max Width:**
  * Container: `max-w-7xl mx-auto px-4 sm:px-6`
  * Form Grid: 2 kolom simetris (`grid-cols-1 lg:grid-cols-2 gap-8`)
  * Feed Grid: 12 kolom (`lg:col-span-6` untuk Before/After, `lg:col-span-6` untuk Catatan Desa)

---

## 🧩 3. Inventaris Komponen (Component Inventory)

### A. Layout Global
1. **Floating Navbar (`Navbar.tsx`):**
   - Kartu melayang putih (`bg-white rounded-2xl border border-[#EBEBEB]`).
   - Logo perisai emas-hijau + branding `DEWI JATENG`.
   - Menu: *Beranda*, *Jelajah Desa Wisata*, *Lapor*, *Transparansi Dana*, *Edukasi & Panduan*.
   - Aksi: Tombol `+ Buat Laporan` (solid navy `#0D2453`) & tombol `Masuk` (pill border).
2. **Footer 4-Kolom (`Footer.tsx`):**
   - Dark Navy background (`#0D2453`) dengan teks putih dan slate-300.
   - Kolom 1: Profil Pemprov Jateng & kontak resmi.
   - Kolom 2: Navigasi cepat.
   - Kolom 3: Layanan publik.
   - Kolom 4: Media sosial resmi.
   - Baris bawah: Hak cipta 2024–2026 Pemprov Jateng + link legalitas.

### B. Halaman Beranda (`app/page.tsx`)
1. **Hero Banner:** Lanskap sawah berundak pegunungan, vignette gelap, teks kaligrafi *"Desa Wisata Jawa Tengah"*, judul *"Dari Laporan, Menjadi Perbaikan"*, dual CTA pill.
2. **Animated KPI Counters (`HomeKpiCounters.tsx` - `'use client'`):**
   - `Rp 185 Miliar` — Total Dana Desa
   - `889` — Desa Wisata
   - `94,2%` — Tingkat Penyelesaian Laporan
   - `< 24 Jam` — Rata-rata Respon oleh Dinas
   - Didukung animasi counter `useInView` dari 0 ke target angka.
3. **Form Aduan Interaktif (`HomeReportForm.tsx` - `'use client'`):**
   - Dropdown judul aduan umum.
   - Input alamat sinkron otomatis dengan klik pin pada peta interaktif Jawa Tengah.
   - Peta visual Jateng dengan pin interaktif (Desa Candirejo, Limpakuwus, Getas, Berjo, Dieng Kulon).
   - Dropzone unggah foto/video bukti dengan chips nama file.
   - Checkbox laporan anonim / privat.
   - Modal konfirmasi dengan nomor tiket unik otomatis (`LP-JTG-2026-XXXX`).
4. **Feed Laporan & Catatan Desa (`HomeReportFeed.tsx` - `'use client'`):**
   - Filter pills kategori (Semua, Akses & Jalan, Fasilitas & Sanitasi).
   - Mode ganda: Tampilan berdampingan (*Side-by-side*) atau slider geser (*Before/After drag slider*).
   - Lightbox modal untuk perbesaran foto resolusi tinggi.
   - Kartu Catatan Dari Desa dengan linimasa pendanaan dan tautan transparansi terkait.

### C. Halaman Transparansi Dana (`app/transparansi/page.tsx`)
1. **Filter Bar Card:** Dropdown bertingkat (Kabupaten Magelang, Desa Candirejo, Tahun Anggaran 2026) + tombol Tampilkan navy.
2. **Banner Desa Candirejo:** Navy card dengan info lokasi dan **Total Pendanaan: Rp 1.200.000.000**.
3. **Donut Chart Sumber Pendanaan:**
   - SVG native ring tanpa pustaka eksternal (`stroke-dasharray` circumference 389.56).
   - Komposisi: APBDes 60% (Rp 720 jt), Bantuan Provinsi 25% (Rp 300 jt), PADes Wisata 15% (Rp 180 jt).
   - Teks tengah: `Rp 1,2 Miliar`.
4. **Card Dana Terpakai:** Indikator persentase besar **70%**, bar progres serapan, serta ringkasan dana terpakai (Rp 840 jt) vs sisa saldo kas (Rp 360 jt).
5. **Tabel Laporan Pengeluaran:**
   - Header tabel soft blue (`#DCE7F5`).
   - 4 baris data belanja riil (jalur pejalan kaki, area parkir, kebersihan, pemeliharaan toilet).
   - Thumbnail ganda pada tiap baris: box `NOTA KUITANSI` + foto fisik fasilitas dengan link perbesaran `↗`.
   - Footer tabel total pengeluaran `840.000.000 (70%)`.
   - Bar navigasi halaman dengan nomor aktif `12` bergaris bawah biru.

---

## ⚡ 4. Spesifikasi Animasi Framer Motion

```typescript
// Konfigurasi Spring Physics Standar
export const springSmooth = {
  type: "spring",
  stiffness: 260,
  damping: 24
};

// Modal Fade & Zoom
export const modalMotion = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } }
};
```
