---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-06"
title: "Service Ekstraksi LPJ AI Multimodal & Server Action Upload Dokumen"
status: completed
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - ai-ocr
  - document-intelligence
  - pdf-extractor
  - server-actions
---

# ISSUE-BE-06: Service Ekstraksi LPJ AI Multimodal & Server Action Upload Dokumen

## 1. Konteks & Deskripsi Fitur
Membangun modul ekstraksi digital dokumen resmi Laporan Pertanggungjawaban (LPJ) bantuan keuangan desa wisata dalam format PDF menggunakan AI Multimodal / PDF Vision OCR, serta menyediakannya melalui **Next.js 14 Best Practice**:
1. **Server Action Internal (`app/actions/lpjActions.ts`):** Dipanggil langsung oleh komponen antarmuka Portal Balai Desa (`components/BalaiDesaLpjUploader.tsx`), menyimpan berkas ke `public/uploads/official-documents`, memicu parser AI, dan mengembalikan data tabel hasil ekstraksi untuk verifikasi aparatur sebelum publikasi.
2. **AI Document Service (`lib/services/aiDocumentExtractor.ts`):** Menangani interaksi AI multimodal untuk membedah halaman PDF menjadi JSON terstruktur (pagu, realisasi, sisa kas, dan pos rincian belanja).
3. **Public API Route (`app/api/balai-desa/lpj/upload/route.ts`):** Endpoint REST API alternatif untuk upload dokumen secara terprogram.

## 2. Acuan Desain & Arsitektur
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - System-Architecture]]
- Transformasi Digital Dokumen: Mengubah berkas statis PDF bertanda tangan Kepala Desa menjadi data relasional dinamis yang siap diaudit publik dan dianalisis anomali harganya.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Server Action (Internal UI) | `app/actions/lpjActions.ts` | Fungsi `'use server'` upload PDF & integrasi ekstraksi AI |
| Multimodal AI Parser | `lib/services/aiDocumentExtractor.ts` | Service ekstraksi tabel belanja & angka anggaran dari dokumen PDF |
| PDF Storage Manager | `lib/storage.ts` | Penyimpanan berkas asli PDF ke bucket `official-documents` |
| Route Handler (Public/REST API) | `app/api/balai-desa/lpj/upload/route.ts` | Endpoint multipart upload berkas PDF LPJ resmi via API |

## 4. Alur Kerja Server Action & Spesifikasi Kontrak Luaran AI

### A. Alur Server Action (`app/actions/lpjActions.ts`)
```typescript
'use server';

import { saveFileToStorage } from '@/lib/storage';
import { extractLpjFromPdf } from '@/lib/services/aiDocumentExtractor';
import { checkExpenseAnomalies } from '@/lib/services/priceAnomalyChecker';

export async function processLpjUploadAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const villageId = formData.get('village_id') as string;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicUrl } = await saveFileToStorage('official-documents', file.name, buffer);

    // Ekstraksi AI Multimodal
    const extractedData = await extractLpjFromPdf(buffer, villageId);

    // Audit awal anomali harga SSH
    const auditedItems = await checkExpenseAnomalies(extractedData.items);

    return {
      success: true,
      data: {
        ...extractedData,
        documentUrl: publicUrl,
        items: auditedItems,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

### B. Spesifikasi Kontrak Luaran AI (JSON Schema)
```json
{
  "village_id": "uuid-string",
  "fiscal_year": 2026,
  "funding_source": "Bantuan Keuangan Khusus Provinsi Jawa Tengah TA 2026",
  "total_allocated": 100000000,
  "total_realized": 92500000,
  "remaining_balance": 7500000,
  "items": [
    {
      "activity_name": "Pipa Besi Galvanis 2 Inci Tebal 2mm (Panjang 6m)",
      "category": "MATERIAL_FISIK",
      "volume": 45,
      "unit": "batang",
      "claimed_unit_price": 285000,
      "amount_realized": 12825000
    }
  ]
}
```

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Balai Desa dapat mengunggah berkas LPJ resmi (PDF maks 25MB) langsung via Server Action (`processLpjUploadAction`).
- [x] AC-2: Berkas PDF fisik tersimpan aman di `public/uploads/official-documents/`.
- [x] AC-3: Mesin AI Multimodal mampu mengekstraksi angka Pagu, Realisasi, Sisa Kas, dan baris rincian belanja modal.
- [x] AC-4: Setiap pos belanja terkategori secara tepat (`MATERIAL_FISIK`, `UPAH_TENAGA`, `KESELAMATAN_K3`, `OPERASIONAL`).
- [x] AC-5: Integritas matematis neraca kas terpenuhi: $\sum \text{amount\_realized} = \text{total\_realized}$ dan $\text{remaining\_balance} = \text{total\_allocated} - \text{total\_realized}$.
- [x] AC-6: Hasil ekstraksi langsung diaudit terhadap katalog SSH Jawa Tengah sebelum disimpan secara atomik.
- [x] AC-7: Halaman Transparansi (`/transparansi`) dan portal pengelola otomatis merefleksikan data LPJ baru melalui `revalidatePath()`.
- [x] AC-8: Rekalkulasi Trust Score desa dipicu secara otomatis pasca pengunggahan LPJ resmi.

## 6. Catatan Teknis & Prompt AI Service
```typescript
// Konfigurasi prompt Multimodal AI pada lib/services/aiDocumentExtractor.ts
const SYSTEM_PROMPT = `Anda adalah auditor keuangan digital bersertifikasi. Ekstrak tabel rincian belanja modal dari dokumen Laporan Pertanggungjawaban (LPJ) terlampir. Hasilkan format JSON murni tanpa markdown pembungkus. Konversi seluruh angka rupiah menjadi integer bulat.`;
```
