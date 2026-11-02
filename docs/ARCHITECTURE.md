# 🏗️ ARCHITECTURE.md — Arsitektur Sistem Terpadu: DEWI JATENG

> **Platform Terpadu Transparansi Anggaran Kas Desa Wisata, Pengawasan Fasilitas Publik, dan Mitigasi Risiko Kepatuhan di Jawa Tengah**  
> **Kompetisi:** Web In Action (WIA) 2026 / Multimedia In Action (MIA) 2026, UPN "Veteran" Jakarta  
> **Tim Pengembang:** Tim sotodiensracing — Universitas Dian Nuswantoro (UDINUS), Semarang  
> - **Lead Frontend & System Analyst:** Muhammad Iqbal Junialdi (*Hustler & Frontend Developer*) — Fokus Antarmuka Pengguna, Layout, Motion & Integrasi Klien  
> - **Lead Backend & System Architecture:** Muhammad Ilham Maulana (*Hacker & Backend Developer*) — Fokus Basis Data, PostGIS, Server Actions & Route Handlers  
> - **Lead UI/UX & Product Designer:** Delvia Mareta Dealova (*Hipster & Product Designer*) — Fokus Design System, Prototype Figma MBG & Audit Interaksi

---

## 🏛️ 1. Ikhtisar Arsitektur & Prinsip Desain

Platform DEWI JATENG dibangun dengan arsitektur **Next.js 14/15 App Router (Fullstack)** yang memisahkan tanggung jawab secara tegas (*Separation of Concerns*) antara Frontend dan Backend:
1. **Next.js App Router & React Server Components (RSC):** Halaman publik dasar (Beranda statis, Transparansi, Edukasi) dirender di sisi server tanpa JavaScript klien berlebih, menjaga kecepatan First Contentful Paint (<1.2 detik).
2. **Interactive Motion Islands (`'use client'` + Framer Motion):** Elemen dinamis seperti counter angka bergerak, peta pin GPS Jawa Tengah, form aduan interaktif, slider Sebelum-Sesudah, dan modal inspeksi nota diisolasi sebagai Client Components beranotasi `'use client'`.
3. **Demarkasi Frontend & Backend Terstandarisasi:**
   - **Frontend (Iqbal):** Menangani antarmuka visual (`app/**/page.tsx`, `components/**`), micro-interactions Framer Motion, styling 1:1 Figma MBG, dan validasi form sisi klien.
   - **Backend (Ilham):** Menangani basis data PostgreSQL 16 + PostGIS 3.4 di Supabase, Row-Level Security (RLS), Route Handlers (`app/api/**/route.ts`), Server Actions untuk mutasi data kas & aduan, serta integrasi AI Vision/OCR.

---

## 🧩 2. C4 Architecture Model

### Level 1: System Context Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          Aktor Pengguna                                │
│  ┌─────────────────────────┐              ┌─────────────────────────┐  │
│  │   Wisatawan & Warga     │              │    Pengelola Pokdarwis  │  │
│  │   (Tanpa Login/Publik)  │              │    & Pemerintah Desa    │  │
│  └────────────┬────────────┘              └────────────┬────────────┘  │
└───────────────┼────────────────────────────────────────┼───────────────┘
                │ Akses Transparansi,                    │ Input Nota Kasir,
                │ Submit Laporan GPS                     │ Eksekusi Tiket Proof-of-Fix
                ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DEWI JATENG PLATFORM                            │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 14/15 App Router (Frontend Domain - Iqbal)              │  │
│  │  - Server Components (app/page.tsx, app/transparansi/page.tsx)   │  │
│  │  - Client Components ('use client' + Framer Motion)              │  │
│  │    * HomeKpiCounters (Viewport animated counter)                 │  │
│  │    * HomeReportForm (Peta Pin GPS + Dropzone Upload)             │  │
│  │    * HomeReportFeed (Before-After Drag Slider & Lightbox)        │  │
│  │    * Donut & Bar Visualizer (Alokasi Dana Desa)                  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Fetch Data / Server Actions      │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │  Next.js API & Server Layer (Backend Domain - Ilham)             │  │
│  │  - Route Handlers (app/api/villages/route.ts, etc.)              │  │
│  │  - Server Actions (createReportAction, resolveTicketAction)      │  │
│  │  - AI Service (Vision OCR vs Standar Satuan Harga Jateng)        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ PostgreSQL 16 │              │  PostGIS 3.4  │              │   AI Engine   │
│ & Supabase RLS│              │  Geofencing   │              │ OCR & EXIF    │
│ (Buku Kas &   │              │  (Radius <500m│              │ (Audit Nota & │
│ Tiket Aduan)  │              │   Validasi)   │              │ Foto Perbaikan│
└───────────────┘              └───────────────┘              └───────────────┘
```

---

## ⚡ 3. Strategi Rendering Next.js (RSC vs Client Components)

| Halaman & Rute | File Komponen | Tipe Komponen | Tanggung Jawab & Logika |
| :--- | :--- | :--- | :--- |
| **Beranda (`/`)** | `app/page.tsx` | Server Component (RSC) | Layout dasar, metadata SEO, pemanggilan data awal. |
| **Beranda (`/`)** | `components/HomeKpiCounters.tsx` | Client Component (`'use client'`) | Animasi viewport-triggered counter Framer Motion. |
| **Beranda (`/`)** | `components/HomeReportForm.tsx` | Client Component (`'use client'`) | Interaksi peta pin Jateng, state input, modal tiket. |
| **Beranda (`/`)** | `components/HomeReportFeed.tsx` | Client Component (`'use client'`) | Slider komparasi Before/After, lightbox modal zoom. |
| **Transparansi (`/transparansi`)** | `app/transparansi/page.tsx` | Server Component (RSC) | Server-rendered SVG Donut, query buku kas. |
| **Lapor (`/lapor`)** | `app/lapor/page.tsx` | Client Component (`'use client'`) | Integrasi Leaflet.js GPS map, dropzone foto & suara. |
| **Edukasi (`/edukasi`)** | `app/edukasi/page.tsx` | Server Component (RSC) | 100% static reading page panduan UU KIP & SOP K3. |
| **Pengelola (`/pengelola`)** | `app/pengelola/page.tsx` | Client/SSR Protected | Papan kanban tiket SLA dan form upload bukti fisik. |

---

## 🗄️ 4. Skema Basis Data & Tanggung Jawab Backend (Ilham)

*(Dikelola secara independen oleh Muhammad Ilham Maulana)*

### Diagram Relasi Entitas (ERD)

```text
┌──────────────────────┐         1:N         ┌──────────────────────┐
│       villages       ├────────────────────►│    village_budgets   │
│  id (UUID PK)        │                     │  id (UUID PK)        │
│  name (VARCHAR)      │                     │  village_id (FK)     │
│  regency (VARCHAR)   │                     │  fiscal_year (INT)   │
│  geom (GEOMETRY Point│                     │  bankeu_prov (BIGINT)│
│  trust_score (NUMERIC│                     │  apbdes (BIGINT)     │
└──────────┬───────────┘                     │  pades (BIGINT)      │
           │                                 └──────────────────────┘
           │ 1:N
           ├────────────────────────────────►┌──────────────────────┐
           │                                 │   cashbook_entries   │
           │                                 │  id (UUID PK)        │
           │                                 │  village_id (FK)     │
           │                                 │  amount (BIGINT)     │
           │                                 │  receipt_url (TEXT)  │
           │                                 │  ocr_status (VARCHAR)│
           │                                 └──────────────────────┘
           │
           │ 1:N
           └────────────────────────────────►┌──────────────────────┐
                                             │       reports        │
                                             │  id (UUID PK)        │
                                             │  ticket_code (UNIQUE)│
                                             │  category (VARCHAR)  │
                                             │  sla_deadline (TS)   │
                                             │  status (VARCHAR)    │
                                             └──────────┬───────────┘
                                                        │ 1:1
                                                        ▼
                                             ┌──────────────────────┐
                                             │    proof_of_fixes    │
                                             │  id (UUID PK)        │
                                             │  report_id (FK)      │
                                             │  after_photo_url     │
                                             │  verified_at (TS)    │
                                             └──────────────────────┘
```

---

## 🔌 5. Kontrak Data API Endpoints (Next.js Route Handlers)

Frontend (Iqbal) mengonsumsi endpoint yang disediakan oleh Backend (Ilham):

1. **`GET /api/villages/stats`:** Mengembalikan metrik agregat Jawa Tengah (Total desa, dana terserap, persentase SLA).
2. **`GET /api/transparansi?villageId=...`:** Mengembalikan buku kas, distribusi donat anggaran, dan daftar nota kuitansi.
3. **`POST /api/reports`:** Endpoint submit aduan warga dengan kalkulasi SLA otomatis (24 Jam Pungli / 7 Hari Fisik).
4. **`POST /api/pengelola/resolve-report`:** Endpoint penutupan tiket aduan dengan validasi wajib foto bukti fisik (*Proof-of-Fix*).
