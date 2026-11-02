# 📚 Dokumentasi Resmi Arsitektur & Spesifikasi: DEWI JATENG

Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah (*Tim sotodiensracing UDINUS, Web In Action / MIA 2026*).

---

## 🛠️ Tech Stack Resmi
- **Frontend Framework:** Next.js 14/15 (App Router, React Server Components, Client Components `'use client'`)
- **Interactive UI & Motion:** React 18 & Framer Motion 11
- **Styling:** Tailwind CSS 3.4 (Token 1:1 Figma MBG `#0D2453`, `#F7F9FC`, `#FFFFFF`, `#EBEBEB`)
- **Peta & GIS:** Leaflet.js & React-Leaflet
- **Backend & Database (Area Ilham):** Next.js Route Handlers (`app/api/**/route.ts`), Server Actions, Supabase (PostgreSQL 16 + PostGIS)
- **Frontend Lead:** Muhammad Iqbal Junialdi (*Hustler & Frontend Developer*)
- **Backend Lead:** Muhammad Ilham Maulana (*Hacker & System Architecture*)
- **UI/UX Lead:** Delvia Mareta Dealova (*Hipster & Product Designer*)

---

## 📑 Daftar Berkas Dokumentasi:

1. [**PRD.md**](PRD.md) — *Product Requirements Document v3.1*
   - Spesifikasi teknis produk, Next.js 14/15 App Router, React Server Components (RSC), Client Components `'use client'`, Framer Motion.
   - Sitemap resmi 5 Halaman: Beranda (`/`), Transparansi (`/transparansi`), Lapor (`/lapor`), Edukasi (`/edukasi`), dan Pengelola (`/pengelola`).
   - Kebutuhan fungsional & skenario penerimaan Gherkin.

2. [**BRD.md**](BRD.md) — *Business Requirements Document v3.1*
   - Ringkasan eksekutif tata kelola dan mandat Perda Jateng No. 2/2019.
   - Data empiris Disporapar Jateng 2023: 776 Desa Wisata & Rp87,5 Miliar Bantuan Keuangan (Bankeu).
   - Studi kasus The Geong Limpakuwus & urgensi keselamatan wahana K3.
   - Matriks KPI dan aturan validasi Proof-of-Fix.

3. [**DESIGN.md**](DESIGN.md) — *Design System & UI/UX Guidelines*
   - Design tokens presisi Figma MBG (node `82:3`):
     * Primary Navy `#0D2453`
     * Canvas `#F7F9FC`
     * Surface `#FFFFFF`
     * Border `#EBEBEB`
     * Muted `#767676`
     * Accent Blue `#3B82F6`
     * Status Green `#E6FFFA` & `#319795`
     * Alert Red `#EA4335`
   - Tipografi: *Plus Jakarta Sans*, *Inter*, *Montserrat*, dan *MonteCarlo* (cursive hero).
   - Inventaris komponen dan spesifikasi animasi Framer Motion spring physics.

4. [**ARCHITECTURE.md**](ARCHITECTURE.md) — *System Architecture Blueprint*
   - Diagram konteks C4 dan arsitektur Next.js 14/15 Fullstack.
   - Pola RSC (Server Components) vs Client Components (`'use client'`) untuk optimasi rendering.
   - Demarkasi jelas: Frontend (Iqbal) vs Backend/DB (Ilham).
   - Skema basis data PostgreSQL 16 & PostGIS 3.4 (kueri geofencing <500 meter).
   - Kontrak REST API / Next.js Route Handlers (`app/api/**/route.ts`).
