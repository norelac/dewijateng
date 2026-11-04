---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "be_dewijateng"
issue_id: "BE-03"
title: "Konfigurasi Media & Document Storage Lokal (public/uploads)"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - storage
  - local-storage
  - security
---

# ISSUE-BE-03: Konfigurasi Media & Document Storage Lokal (public/uploads)

## 1. Konteks & Deskripsi Fitur
Menyediakan dan mengonfigurasi layanan penyimpanan berkas media dan dokumen (`lib/storage.ts` di bawah direktori `public/uploads`) untuk mendukung kebutuhan penyimpanan dokumen resmi LPJ Balai Desa (PDF), foto kerusakan fasilitas dari warga pelapor (*Before*), serta foto hasil perbaikan fisik dari Pokdarwis (*After / Proof-of-Fix*), lengkap dengan sanitasi nama berkas, validasi tipe MIME, dan kuota ukuran berkas tanpa ketergantungan vendor Supabase.

## 2. Acuan Arsitektur & Berkas Terkait
- Dokumen Rujukan: [[Dewi-Jateng - System-Architecture]] & [[Dewi-Jateng - User-Roles-and-Access-Control]]
- Pembagian Domain Berkas:
  - Berkas Dokumen Resmi Hukum: Disimpan di `public/uploads/official-documents`.
  - Berkas Foto Aduan Publik: Disimpan di `public/uploads/report-photos-before`.
  - Berkas Bukti Foto Perbaikan: Disimpan di `public/uploads/proof-of-fix`.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Storage Helper | `lib/storage.ts` | Service helper `saveFileToStorage()` dan `readFileFromStorage()` berbasis fs/promises |
| Environment Var | `.env.local` | Variabel `UPLOAD_DIR=./public/uploads` |
| Public Static Route | `public/uploads/*` | Direktori berkas statis yang langsung dapat diakses browser via `/uploads/...` |

## 4. Spesifikasi 3 Bucket Penyimpanan
1. **Bucket `official-documents`:**
   - Kegunaan: Menyimpan pindaian dokumen fisik LPJ Bantuan Keuangan resmi berstempel basah.
   - Format Diizinkan: `application/pdf`.
   - Batas Ukuran Maksimal: $20\text{ MB}$.
   - Hak Akses: *Public Read* (warga dapat mengunduh berkas di halaman Transparansi), *Restricted Write* (hanya Balai Desa / Server Admin).
2. **Bucket `report-photos-before`:**
   - Kegunaan: Menyimpan foto kondisi fasilitas rusak yang dilaporkan oleh wisatawan/warga.
   - Format Diizinkan: `image/jpeg`, `image/png`, `image/webp`.
   - Batas Ukuran Maksimal: $10\text{ MB}$.
   - Hak Akses: *Public Read*, *Public Write via API Route*.
3. **Bucket `proof-of-fix`:**
   - Kegunaan: Menyimpan foto fisik hasil perbaikan fasilitas dari Pokdarwis.
   - Format Diizinkan: `image/jpeg`, `image/png`, `image/webp` (Wajib mempertahankan metadata EXIF kamera asli).
   - Batas Ukuran Maksimal: $10\text{ MB}$.
   - Hak Akses: *Public Read*, *Restricted Write* (khusus peran Pokdarwis / API penutupan aduan).

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Ketiga direktori bucket (`official-documents`, `report-photos-before`, `proof-of-fix`) terbuat dengan benar di bawah `public/uploads/`.
- [x] AC-2: Upload berkas di luar tipe MIME yang diizinkan (misal berkas `.exe`, `.bat`, `.docx`) ditolak secara ketat.
- [x] AC-3: Berkas yang melebihi batas ukuran maksimal ditolak dengan status HTTP 413 Payload Too Large.
- [x] AC-4: URL berkas publik dapat diakses langsung oleh browser via `/uploads/<bucket>/<filename>` untuk kebutuhan render elemen `<img>` dan tombol unduh PDF.
- [x] AC-5: Penamaan berkas di storage menerapkan timestamp dan regex sanitasi `Date.now()-filename` untuk mencegah penumpukan nama berkas duplikat (*file collision*).

## 6. Catatan Teknis
```typescript
// Helper upload berkas di lib/storage.ts
export async function saveFileToStorage(
  bucket: StorageBucket,
  fileName: string,
  buffer: Buffer
): Promise<{ publicUrl: string; filePath: string }>

export async function readFileFromStorage(
  bucket: StorageBucket,
  fileName: string
): Promise<Buffer>
```
