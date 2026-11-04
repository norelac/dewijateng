---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-05"
title: "Service Proof-of-Fix, Validator EXIF & Server Action Resolusi Tiket"
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
  - server-actions
---

# ISSUE-BE-05: Service Proof-of-Fix, Validator EXIF & Server Action Resolusi Tiket

## 1. Konteks & Deskripsi Fitur
Membangun arsitektur penutupan tiket aduan fasilitas oleh Pokdarwis yang mewajibkan pengunggahan foto fisik hasil perbaikan (*Proof-of-Fix*) dan memvalidasi keaslian metadata waktu pemotretan (*timestamp EXIF*) menggunakan library `exifr` guna memastikan foto yang diunggah adalah foto dokumentasi baru pasca-kejadian, bukan foto arsip lama rekayasa.

Mengikuti **Next.js 14 Best Practice**:
1. **Server Action Internal (`app/actions/resolutionActions.ts`):** Fungsi server yang dipanggil langsung oleh modal penutupan tiket di Papan Kerja Pokdarwis (`components/PengelolaTicketBoard.tsx`) tanpa fetch URL internal, langsung merefresh UI dengan `revalidatePath('/pengelola')` dan `revalidatePath('/lapor')`.
2. **Domain Service (`lib/services/exifValidator.ts` & `lib/services/resolutionService.ts`):** Logika verifikasi metadata EXIF temporal dan pembaruan transaksi database atomic.
3. **Dedicated Route Handler (`app/api/pokdarwis/reports/[report_code]/resolve/route.ts`):** Endpoint API untuk kebutuhan integrasi eksternal atau aplikasi mobile di masa depan.

## 2. Acuan Desain & Aturan Kepatuhan
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - System-Architecture]]
- Aturan Validasi Temporal:
  $$\text{Validasi Keaslian Waktu}: T_{\text{foto\_exif}} > T_{\text{laporan\_dibuat}}$$
  Jika tanggal pemotretan foto perbaikan terbukti lebih lampau daripada tanggal laporan masuk, sistem mendeteksi indikasi rekayasa arsip lama dan menolak penutupan status.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Server Action (Internal UI) | `app/actions/resolutionActions.ts` | Fungsi `'use server'` penutupan tiket langsung dari antarmuka Pokdarwis |
| Domain Resolution Service | `lib/services/resolutionService.ts` | Logika bisnis resolusi tiket, upload berkas, & atomic database transaction |
| EXIF Parser Service | `lib/services/exifValidator.ts` | Service pemindaian buffer gambar, ekstraksi tag `DateTimeOriginal` |
| Route Handler (API External) | `app/api/pokdarwis/reports/[report_code]/resolve/route.ts` | Endpoint handler penutupan aduan via REST API |
| Database Transaction | `lib/db.ts` | Atomic transaction insert ke `report_resolutions` & update `incident_reports` |

## 4. Alur Kerja Logika Validasi & Server Action

### A. Alur Server Action (`app/actions/resolutionActions.ts`)
```typescript
'use server';

import { resolveIncidentReport } from '@/lib/services/resolutionService';
import { revalidatePath } from 'next/cache';

export async function resolveReportAction(formData: FormData) {
  try {
    const reportCode = formData.get('report_code') as string;
    const photo = formData.get('photo_after') as File;
    const actionSummary = formData.get('action_summary') as string;
    const officerName = formData.get('officer_name') as string;

    const result = await resolveIncidentReport({
      reportCode,
      photoAfter: photo,
      actionSummary,
      officerName,
    });

    revalidatePath('/pengelola');
    revalidatePath('/lapor');
    revalidatePath('/');

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

### B. Evaluasi Kondisi EXIF
1. **Kondisi A (EXIF Ditemukan):**
   - Bandingkan waktu `DateTimeOriginal` dengan waktu `created_at` laporan.
   - Jika $T_{\text{foto}} > T_{\text{laporan}}$: Set `exif_timestamp_verified = true`, catat `exif_photo_date`.
   - Jika $T_{\text{foto}} \le T_{\text{laporan}}$: Tolak penutupan tiket dengan pesan: *"Foto yang diunggah terdeteksi diambil sebelum laporan masuk (indikasi foto arsip lama)"*.
2. **Kondisi B (EXIF Terhapus/Kompresi WhatsApp):**
   - Jika pengguna mengunggah foto via WhatsApp yang menghapus metadata, sistem tetap menerima foto, namun mencatat `exif_timestamp_verified = false` dan memberi catatan verifikasi manual (*soft flag*).
3. Berkas foto diunggah ke storage `public/uploads/proof-of-fix/`.
4. Simpan rekaman penyelesaian ke tabel `report_resolutions`.
5. Perbarui status laporan di `incident_reports` menjadi `RESOLVED`.
6. Picu fungsi rekalkulasi Trust Score desa secara real-time.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Pokdarwis dapat menyelesaikan laporan langsung dari UI Papan Kerja melalui Server Action.
- [ ] AC-2: Berkas foto hasil perbaikan tersimpan di storage lokal `public/uploads/proof-of-fix/`.
- [ ] AC-3: Foto dengan tanggal EXIF sebelum tanggal aduan dibuat ditolak dengan error validasi.
- [ ] AC-4: Foto dengan tanggal EXIF pasca aduan tercatat sebagai `exif_timestamp_verified = true`.
- [ ] AC-5: Foto tanpa metadata EXIF tetap diterima dengan flag informatif `exif_timestamp_verified = false`.
- [ ] AC-6: Status laporan di database berhasil berganti dari `IN_PROGRESS` menjadi `RESOLVED`.
- [ ] AC-7: UI Papan Kerja dan Linimasa Publik terupdate otomatis melalui `revalidatePath()`.
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
