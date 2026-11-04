---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "be_dewijateng"
issue_id: "BE-04"
title: "Service Pelaporan Aduan Warga, Server Action Form Lapor & Public REST API"
status: completed
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - nextjs-14
  - server-actions
  - route-handlers
  - civic-tech
---

# ISSUE-BE-04: Service Pelaporan Aduan Warga, Server Action Form Lapor & Public REST API

## 1. Konteks & Deskripsi Fitur
Membangun arsitektur penanganan laporan aduan masyarakat pada Next.js 14 App Router yang menerapkan **Next.js 14 Best Practice**:
1. **Server Action Internal (`app/actions/reportActions.ts`):** Menangani mutasi form lapor langsung dari komponen UI Beranda (`HomeReportForm.tsx`) tanpa overhead *round-trip* HTTP fetch internal, dengan integrasi langsung `revalidatePath('/')`.
2. **Core Domain Service (`lib/services/reportService.ts`):** Mengisolasi logika bisnis validasi, sanitasi, penyimpanan foto ke `public/uploads/report-photos-before`, enkripsi nomor WhatsApp pelapor, dan pembuatan **Kode Pelaporan** unik (`LP-JTG-2026-XXXX`).
3. **Public Open Data API (`app/api/reports/route.ts` & `[report_code]/route.ts`):** Endpoint REST API standar untuk kebutuhan keterbukaan data (*Open Government Data*), integrasi pihak ketiga, atau pelacakan programmatic.

## 2. Acuan Desain & Arsitektur
- Dokumen Rujukan: [[Dewi-Jateng - API-Reference]], [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]], & [[Dewi-Jateng - Citizen-and-Tourist-UI-Flow]]
- Prinsip Efisiensi Monolit (Next.js vs Laravel):
  - Halaman internal (`/`, `/lapor`) membaca data laporan langsung melalui kueri Drizzle ORM di **Server Component** (tanpa fetch internal).
  - Form pengiriman laporan menggunakan **Server Action** ber-tipe aman.
  - Endpoint REST API difungsikan khusus sebagai konsumsi eksternal (*Open Data*).
- Perlindungan Privasi Warga: Jika warga memilih opsi "Lapor secara Anonim", nomor telepon/WhatsApp pelapor WAJIB dienkripsi searah (*hash SHA-256 + secret salt*) sehingga identitas warga tidak tersimpan secara teks mentah (*plain text*) di database.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Server Action (Internal UI) | `app/actions/reportActions.ts` | Fungsi `'use server'` untuk mutasi form aduan langsung dari frontend |
| Core Domain Service | `lib/services/reportService.ts` | Business logic pembuatan aduan, transaksi database Drizzle, & validasi |
| Public API Collection Route | `app/api/reports/route.ts` | Handler `POST` dan `GET` publik untuk integrasi eksternal |
| Public API Detail Route | `app/api/reports/[report_code]/route.ts` | Handler `GET` detail aduan publik berdasarkan kode tiket |
| Report Code Generator | `lib/services/reportCodeGenerator.ts` | Helper pembuat kode pelaporan format `LP-JTG-2026-XXXX` |
| Privacy Hash Helper | `lib/services/cryptoHasher.ts` | Enkripsi nomor telepon satu arah dengan algoritma SHA-256 |

## 4. Spesifikasi Alur Eksekusi & Data Flow

### A. Alur Server Action Internal (`app/actions/reportActions.ts`)
```typescript
'use server';

import { createIncidentReport } from '@/lib/services/reportService';
import { revalidatePath } from 'next/cache';

export async function submitReportAction(formData: FormData) {
  try {
    const report = await createIncidentReport({
      villageId: formData.get('village_id') as string,
      category: formData.get('category') as any,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      photo: formData.get('photo') as File,
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      isAnonymous: formData.get('is_anonymous') === 'true',
      reporterPhone: formData.get('reporter_phone') as string,
    });

    revalidatePath('/');
    revalidatePath('/lapor');

    return { success: true, reportCode: report.report_code };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

### B. Spesifikasi Endpoint Public API (`POST /api/reports`)
- Content-Type: `multipart/form-data`.
- Field Input: `village_id`, `category`, `title`, `description`, `photo`, `latitude`, `longitude`, `is_anonymous`, `reporter_phone`.
- Status Respon: `201 Created`
  ```json
  {
    "success": true,
    "message": "Laporan aduan berhasil didaftarkan",
    "data": {
      "report_code": "LP-JTG-2026-0045",
      "status": "SUBMITTED",
      "tracking_url": "/lapor?code=LP-JTG-2026-0045"
    }
  }
  ```

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Komponen Beranda (`HomeReportForm.tsx`) dapat mengirim aduan melalui Server Action tanpa perlu membuat fetch request manual.
- [x] AC-2: Berkas foto awal tersimpan di storage lokal `public/uploads/report-photos-before/`.
- [x] AC-3: Generator kode menjamin keunikan kode tiket format `LP-JTG-2026-XXXX`.
- [x] AC-4: Jika `is_anonymous = true`, nomor telepon pelapor di-hash SHA-256 dan nomor mentah tidak disimpan.
- [x] AC-5: Halaman Beranda dan Pelacakan ter-refresh otomatis secara reaktif melalui `revalidatePath()`.
- [x] AC-6: Public REST API `GET /api/reports` dan `POST /api/reports` tetap berfungsi penuh untuk integrasi sistem luar (*Open Data*).
- [x] AC-7: Validasi input mengembalikan pesan error yang jelas jika data wajib (foto, koordinat, desa) tidak lengkap.
```typescript
export async function generateReportCode(): Promise<string> {
  const year = new Date().getFullYear();
  const res = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM incident_reports WHERE report_code LIKE $1`,
    [`LP-JTG-${year}-%`]
  );
  const nextSeq = (parseInt(res.rows[0].count, 10) + 1).toString().padStart(4, '0');
  return `LP-JTG-${year}-${nextSeq}`;
}
```
