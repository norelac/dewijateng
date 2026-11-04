---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-05"
title: "Route Handler Proof-of-Fix & Validator Metadata EXIF Timestamp"
status: open
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - ai-validator
  - exif-metadata
  - proof-of-fix
---

# ISSUE-BE-05: Route Handler Proof-of-Fix & Validator Metadata EXIF Timestamp

## 1. Konteks & Deskripsi Fitur
Membangun Route Handler di Next.js App Router untuk proses penutupan tiket aduan fasilitas oleh Pokdarwis (`POST /api/pokdarwis/reports/[report_code]/resolve`). Endpoint ini mewajibkan pengunggahan foto fisik hasil perbaikan (*Proof-of-Fix*) dan memvalidasi keaslian metadata waktu pemotretan (*timestamp EXIF*) menggunakan library `exifr` guna memastikan foto yang diunggah adalah foto dokumentasi baru pasca-kejadian, bukan foto arsip lama rekayasa.

## 2. Acuan Desain & Aturan Kepatuhan
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - System-Architecture]]
- Aturan Validasi Temporal:
  $$\text{Validasi Keaslian Waktu}: T_{\text{foto\_exif}} > T_{\text{laporan\_dibuat}}$$
  Jika tanggal pemotretan foto perbaikan terbukti lebih lampau daripada tanggal laporan masuk, sistem mendeteksi indikasi rekayasa arsip lama dan menolak penutupan status.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Resolve Route Handler | `app/api/pokdarwis/reports/[report_code]/resolve/route.ts` | Endpoint handler penutupan aduan dengan bukti fisik |
| EXIF Parser Service | `lib/services/exifValidator.ts` | Service pemindaian buffer gambar, ekstraksi tag `DateTimeOriginal` |
| Database Transaction | `lib/db.ts` | Atomic transaction insert ke `report_resolutions` & update `incident_reports` |

## 4. Alur Kerja Logika Validasi
1. Handler menerima berkas `photo_after`, string `action_summary`, dan string `officer_name`.
2. Mengambil data laporan dari database berdasarkan `report_code` untuk membaca `created_at`.
3. Membaca binary buffer dari berkas foto perbaikan menggunakan `exifr.parse(buffer, ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'latitude', 'longitude'])`.
4. Evaluasi Kondisi EXIF:
   - **Kondisi A (EXIF Ditemukan):**
     - Bandingkan waktu `DateTimeOriginal` dengan waktu `created_at` laporan.
     - Jika $T_{\text{foto}} > T_{\text{laporan}}$: Set `exif_timestamp_verified = true`, catat `exif_photo_date`.
     - Jika $T_{\text{foto}} \le T_{\text{laporan}}$: Tolak request dengan HTTP `422 Unprocessable Entity` dan pesan: *"Foto yang diunggah terdeteksi diambil sebelum laporan masuk (indikasi foto arsip lama)"*.
   - **Kondisi B (EXIF Terhapus/Kompresi WhatsApp):**
     - Jika pengguna mengunggah foto via WhatsApp yang menghapus metadata, sistem tetap menerima foto, namun mencatat `exif_timestamp_verified = false` dan memberi catatan verifikasi manual (*soft flag*).
5. Berkas foto diunggah ke bucket storage `proof-of-fix`.
6. Simpan rekaman penyelesaian ke tabel `report_resolutions`.
7. Perbarui status laporan di `incident_reports` menjadi `RESOLVED`.
8. Picu fungsi rekalkulasi Trust Score desa secara real-time.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Endpoint menolak penutupan aduan jika tidak ada berkas foto hasil perbaikan yang dilampirkan.
- [ ] AC-2: Berkas foto hasil perbaikan tersimpan di storage bucket `proof-of-fix`.
- [ ] AC-3: Foto dengan tanggal EXIF sebelum tanggal aduan dibuat ditolak dengan error 422.
- [ ] AC-4: Foto dengan tanggal EXIF pasca aduan tercatat sebagai `exif_timestamp_verified = true`.
- [ ] AC-5: Foto tanpa metadata EXIF tetap diterima dengan flag `exif_timestamp_verified = false`.
- [ ] AC-6: Status laporan di database berhasil berganti dari `IN_PROGRESS` menjadi `RESOLVED`.
- [ ] AC-7: Seluruh perubahan dibungkus dalam Database Transaction; rollback jika terjadi kegagalan storage atau query.

## 6. Catatan Teknis & Code Snippet
```typescript
import exifr from 'exifr';

export async function validatePhotoExif(
  buffer: Buffer,
  reportCreatedAt: Date
): Promise<{ verified: boolean; photoDate: Date | null; error?: string }> {
  try {
    const metadata = await exifr.parse(buffer, ['DateTimeOriginal', 'CreateDate']);
    const photoDate = metadata?.DateTimeOriginal || metadata?.CreateDate;
    if (!photoDate) {
      return { verified: false, photoDate: null }; // EXIF stripped
    }
    const dateObj = new Date(photoDate);
    if (dateObj.getTime() < reportCreatedAt.getTime()) {
      return {
        verified: false,
        photoDate: dateObj,
        error: 'Foto terdeteksi diambil sebelum laporan aduan dibuat',
      };
    }
    return { verified: true, photoDate: dateObj };
  } catch {
    return { verified: false, photoDate: null };
  }
}
```
