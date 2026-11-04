---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "be_dewijateng"
issue_id: "BE-04"
title: "Route Handlers Pelaporan Aduan Warga & Generator Kode Tiket"
status: open
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - nextjs-api
  - civic-tech
  - routing
---

# ISSUE-BE-04: Route Handlers Pelaporan Aduan Warga & Generator Kode Tiket

## 1. Konteks & Deskripsi Fitur
Membangun backend Route Handlers di Next.js 14 App Router untuk menangani pengiriman formulir laporan aduan masyarakat yang dikirimkan langsung dari Beranda (`POST /api/reports`), melakukan sanitasi data, mengunggah foto ke storage, menghasilkan **Kode Pelaporan** unik terstandarisasi (`LP-JTG-2026-XXXX`), serta menyediakan endpoint pembacaan detail laporan untuk publik (`GET /api/reports/[report_code]`).

## 2. Acuan Desain & Arsitektur
- Dokumen Rujukan: [[Dewi-Jateng - API-Reference]] & [[Dewi-Jateng - Citizen-and-Tourist-UI-Flow]]
- Perlindungan Privasi Warga: Jika warga memilih opsi "Lapor secara Anonim", nomor telepon/WhatsApp pelapor WAJIB dienkripsi searah (*hash SHA-256 + secret salt*) sehingga identitas warga tidak tersimpan secara teks mentah (*plain text*) di database.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Create Report Route | `app/api/reports/route.ts` | Handler `POST` pendaftaran aduan dan `GET` daftar aduan publik |
| Detail Report Route | `app/api/reports/[report_code]/route.ts` | Handler `GET` detail aduan publik berdasarkan kode tiket |
| Report Code Generator | `lib/utils/reportCodeGenerator.ts` | Helper pembuat kode pelaporan format `LP-JTG-2026-XXXX` |
| Privacy Hash Helper | `lib/utils/cryptoHasher.ts` | Enkripsi nomor telepon satu arah dengan algoritma SHA-256 |

## 4. Spesifikasi Endpoint & Format Respon
1. **Endpoint `POST /api/reports`:**
   - Content-Type: `multipart/form-data`.
   - Field Input:
     - `village_id`: UUID valid desa wisata (FK).
     - `category`: `FASILITAS_RUSAK` | `PUNGLI` | `BAHAYA_K3` | `KEBERSIHAN`.
     - `title`: String singkat (min 5, max 150 karakter).
     - `description`: String rincian masalah (min 15 karakter).
     - `photo`: File gambar (JPEG, PNG, WebP, maks 10 MB).
     - `latitude`: Number float koordinat lintang.
     - `longitude`: Number float koordinat bujur.
     - `is_anonymous`: Boolean flag.
     - `reporter_phone`: String nomor telepon (opsional / di-hash jika anonim).
   - Logika Generator Kode Pelaporan:
     - Format: `LP-JTG-{TAHUN}-{URUT_4_DIGIT}` (contoh: `LP-JTG-2026-0045`).
     - Memeriksa keunikan kode di tabel `incident_reports` sebelum commit transaksi.
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
2. **Endpoint `GET /api/reports/[report_code]`:**
   - Parameter: `report_code` (path parameter case-insensitive).
   - Menghubungkan relasi tabel `incident_reports` dengan `tourist_villages` dan `report_resolutions`.
   - Jika status `RESOLVED`, sertakan rincian foto `photo_after_url`, nama teknisi, tanggal resolusi, dan status verifikasi EXIF.
   - Status Respon: `200 OK` atau `404 Not Found`.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Endpoint `POST /api/reports` berhasil menerima payload multipart dan menyimpannya ke database PostgreSQL.
- [ ] AC-2: Berkas foto awal tersimpan di storage dan URL foto tersimpan di kolom `photo_before_url`.
- [ ] AC-3: Generator kode menjamin keunikan kode tiket format `LP-JTG-2026-XXXX`.
- [ ] AC-4: Jika `is_anonymous = true`, kolom `reporter_contact_hash` menyimpan hash SHA-256 dan nomor asli tidak bocor.
- [ ] AC-5: Endpoint `GET /api/reports/[report_code]` mengembalikan data laporan beserta rincian desa wisata terkait.
- [ ] AC-6: Jika laporan sudah diselesaikan, objek `resolution` terlampir lengkap dengan URL foto perbaikan.
- [ ] AC-7: Request dengan data tidak lengkap ditolak dengan status HTTP 422 Unprocessable Entity.

## 6. Catatan Teknis Generator Kode
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
