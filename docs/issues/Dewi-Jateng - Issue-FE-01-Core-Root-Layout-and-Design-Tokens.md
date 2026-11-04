---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "fe_dewijateng"
issue_id: "FE-01"
title: "Core Root Layout, Google Fonts, & Design System Tokens"
status: completed
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - frontend
  - nextjs-14
  - tailwind
  - layout
  - design-system
  - figma-section-00
---

# ISSUE-FE-01: Core Root Layout, Google Fonts, & Design System Tokens

## 1. Deskripsi Fitur & Konteks
Membangun kerangka dasar antarmuka (*Root Layout*) aplikasi Next.js 14 App Router (`/Users/ilham/Documents/development/matics/dewijateng`), memuat tipografi resmi (*Plus Jakarta Sans*, *Inter*, dan aksen kursif *Playfair Display / MonteCarlo*), palet warna presisi 1:1 Figma (*Primary Navy `#0D2453`*, *Page Canvas `#F7F9FC`*, *Card Surface `#FFFFFF`*, *Border Neutral `#EBEBEB`*), serta navigasi mengambang (*Floating Navbar*) 4 pilar utama yang responsif.

## 2. Acuan Desain & Figma Section
- **Figma Source:** [Figma Canvas MBG — Node 82:3](https://www.figma.com/design/D5iJU5yMqtgWZsni1KsVpc/MBG?node-id=82-3)
- **Figma Section:** `[Section 00] Design System & Foundations`
- **Dokumen Rujukan:** [[Dewi-Jateng - Master-UIUX-Specification-and-Page-Requirements]] & `docs/DESIGN.md`
- **Tema Visual (Figma MBG Exact Palette):**
  - **Page Canvas:** `#F7F9FC` (Latar belakang keseluruhan halaman web — soft blue-gray canvas)
  - **Primary Navy:** `#0D2453` (Judul utama, tombol CTA primer, teks navbar, ring donat APBDes 60%, footer background)
  - **Card Surface:** `#FFFFFF` (Kontainer kartu, form panel, baris tabel, dan modal)
  - **Border Neutral:** `#EBEBEB` (Garis pembatas kartu, separator antar section, divider tabel)
  - **Input Surface:** `#F5F5F5` (Input field, dropdown select, dan background form control)
  - **Muted Text:** `#767676` (Teks sekunder, label pembantu, timestamp, dan teks status netral)
  - **Brand Accent Blue:** `#3B82F6` (Donut segment Bantuan Provinsi 25%, link hover)
  - **Light Blue Accent:** `#93C5FD` / `#DCE7F5` (Donut segment PADes 15%, header tabel)
  - **Status Selesai (Green):** `#E6FFFA` (bg) / `#319795` (text), border `#B2F5EA`
  - **Alert / Warning:** `#EA4335` (Pin aktif peta, alert bahaya fasilitas K3)

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Root Layout | `app/layout.tsx` | Layout shell HTML, deklarasi font Plus Jakarta Sans & Inter, container 7xl, background `#F7F9FC` |
| Global CSS | `app/globals.css` | Import font, reset CSS, utility tokens, dan custom styling |
| Tailwind Config | `tailwind.config.mjs` | Konfigurasi token warna brand (`#0D2453`, `#F7F9FC`, `#EBEBEB`), font family, dan breakpoint |
| Floating Navbar | `components/Navbar.tsx` | Floating white card (`rounded-[20px]`, border `#E6ECF5`, shadow) 4 pilar rute, logo Pemprov Jateng, tombol `+ Buat Laporan` & `Portal Pengelola` |
| Global Footer | `components/Footer.tsx` | Footer 4-kolom navy (`#0D2453`) dengan tautan navigasi, layanan, kontak resmi Pemprov Jateng, dan copyright |

## 4. Spesifikasi Fungsional & Styling
1. **Tipografi Presisi:**
   - Font primer teks isi & heading: `Plus Jakarta Sans` & `Inter` (`latin`).
   - Font dekoratif hero eyebrow: Serif kursif (`Playfair Display` / `font-cursive`).
2. **Floating Navbar 4 Pilar:**
   - Desain kartu melayang putih terpusat (`max-w-7xl mx-auto`, `bg-white rounded-[20px] border border-[#E6ECF5]`).
   - Sisi Kiri: Logo resmi Pemprov Jateng + teks `DEWI JATENG` bold navy.
   - Tengah (4 Pilar):
     - Rute 1: `Beranda` (`/`)
     - Rute 2: `Transparansi Dana` (`/transparansi`)
     - Rute 3: `Telusuri Aduan` (`/lapor`)
     - Rute 4: `Edukasi & Panduan` (`/edukasi`)
     - State Aktif: Garis bawah tebal biru navy (`border-b-2 border-[#0D2453]`).
   - Sisi Kanan:
     - Tombol `+ Buat Laporan`: Pill navy `#0D2453` teks putih, aksi smooth scroll ke `#buat-laporan`.
     - Tombol `Portal Pengelola`: Pill outline putih border navy untuk akses Pokdarwis & Balai Desa (`/pengelola`).
3. **Footer 4 Kolom (`Footer.tsx`):**
   - Background `#0D2453` teks putih dan slate-300.
   - Kolom 1: Profil DEWI JATENG, alamat Jateng, email, dan kontak telepon resmi.
   - Kolom 2: Navigasi (Beranda, Jelajah Desa Wisata, Lapor, Transparansi Dana, Edukasi & Panduan, Portal Pengelola, Command Center Disporapar).
   - Kolom 3: Layanan (Telusur Aduan, Buat Laporan, Statistik, Peta Situs).
   - Kolom 4: Media Sosial (Instagram, YouTube, Twitter / X, Facebook).
   - Baris Bawah: Copyright 2024–2026 Pemprov Jateng dan tautan legalitas.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Canvas latar belakang seluruh halaman menggunakan warna soft `#F7F9FC` dengan kontras bersih terhadap kontainer kartu `#FFFFFF`.
- [x] AC-2: Floating Navbar melayang dengan radius `rounded-[20px]`, bayangan `shadow-[0_4px_20px_rgba(0,0,0,0.06)]`, dan logo Pemprov Jateng.
- [x] AC-3: Seluruh 4 menu pilar navigasi aktif dan memiliki penanda active state berupa border bawah navy yang presisi.
- [x] AC-4: Tombol `+ Buat Laporan` mengarahkan pengguna secara presisi ke form aduan di Beranda (`/#buat-laporan`).
- [x] AC-5: Tombol `Portal Pengelola` mengarahkan pengurus Pokdarwis dan Balai Desa ke halaman `/pengelola`.
- [x] AC-6: Seluruh shell navigasi responsif pada viewport mobile (`375px`), tablet (`768px`), dan desktop (`1280px+`).
- [x] AC-7: Footer 4 kolom memuat tautan navigasi lengkap dan rujukan resmi Pemprov Jateng tanpa broken link.

## 6. Catatan Desain Figma
```typescript
// Token Warna Figma MBG (tailwind.config.mjs)
theme: {
  extend: {
    colors: {
      brand: {
        navy: '#0D2453',
        canvas: '#F7F9FC',
        surface: '#FFFFFF',
        border: '#EBEBEB',
        muted: '#767676',
        accent: '#3B82F6',
        success: '#319795',
        successBg: '#E6FFFA',
      }
    }
  }
}
```
