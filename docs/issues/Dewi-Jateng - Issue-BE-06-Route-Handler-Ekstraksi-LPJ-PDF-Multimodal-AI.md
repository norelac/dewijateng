---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-06"
title: "Route Handler Ekstraksi LPJ PDF (Multimodal AI Table Extractor)"
status: open
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - ai-ocr
  - document-intelligence
  - pdf-extractor
---

# ISSUE-BE-06: Route Handler Ekstraksi LPJ PDF (Multimodal AI Table Extractor)

## 1. Konteks & Deskripsi Fitur
Membangun Route Handler di Next.js App Router (`POST /api/balai-desa/lpj/upload`) yang menerima berkas resmi Laporan Pertanggungjawaban (LPJ) bantuan sarana prasarana desa wisata dalam format PDF, memproses halaman dokumen menggunakan mesin AI Multimodal / PDF Vision OCR, serta menghasilkan struktur JSON terstruktur yang merinci total pagu bantuan, total realisasi belanja modal, sisa kas, dan baris tabel rincian belanja per pos kegiatan.

## 2. Acuan Desain & Arsitektur
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - System-Architecture]]
- Transformasi Digital Dokumen: Mengubah berkas statis PDF bertanda tangan Kepala Desa menjadi data relasional dinamis yang siap diaudit publik dan dianalisis anomali harganya.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| LPJ Upload Handler | `app/api/balai-desa/lpj/upload/route.ts` | Endpoint multipart upload berkas PDF LPJ resmi |
| Multimodal AI Parser | `lib/services/aiDocumentExtractor.ts` | Service ekstraksi tabel belanja & angka anggaran dari dokumen PDF |
| PDF Storage Manager | `lib/storage.ts` | Penyimpanan berkas asli PDF ke bucket `official-documents` |

## 4. Spesifikasi Kontrak Luaran AI (JSON Schema)
AI Multimodal dipandu dengan *system prompt* ketat untuk menghasilkan JSON dengan skema berikut:
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
    },
    {
      "activity_name": "Semen Portland Komposit (PCC) 50kg",
      "category": "MATERIAL_FISIK",
      "volume": 200,
      "unit": "sak",
      "claimed_unit_price": 68000,
      "amount_realized": 13600000
    },
    {
      "activity_name": "Upah Tukang Las Konstruksi Pengaman Curug",
      "category": "UPAH_TENAGA",
      "volume": 20,
      "unit": "HOK",
      "claimed_unit_price": 140000,
      "amount_realized": 2800000
    }
  ]
}
```

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Endpoint menerima berkas PDF hingga ukuran 20 MB melalui `FormData`.
- [ ] AC-2: Berkas asli PDF berhasil disimpan di storage bucket `official-documents`.
- [ ] AC-3: AI Service berhasil mengekstrak nilai total pagu dan total belanja tanpa halusinasi format numerik.
- [ ] AC-4: Setiap pos belanja terkategori secara tepat ke salah satu dari: `MATERIAL_FISIK`, `UPAH_TENAGA`, `KESELAMATAN_K3`, atau `OPERASIONAL`.
- [ ] AC-5: Integritas matematis terpenuhi: $\sum \text{amount\_realized} = \text{total\_realized}$ dan $\text{remaining\_balance} = \text{total\_allocated} - \text{total\_realized}$.
- [ ] AC-6: Endpoint mengembalikan hasil ekstraksi JSON ke frontend untuk diperiksa oleh operator Balai Desa sebelum commit permanen.
- [ ] AC-7: Penanganan error tangguh (*graceful error handling*) jika berkas PDF buram atau tidak terbaca.

## 6. Catatan Teknis & Prompt AI Service
```typescript
// Konfigurasi prompt Multimodal AI pada lib/services/aiDocumentExtractor.ts
const SYSTEM_PROMPT = `Anda adalah auditor keuangan digital bersertifikasi. Ekstrak tabel rincian belanja modal dari dokumen Laporan Pertanggungjawaban (LPJ) terlampir. Hasilkan format JSON murni tanpa markdown pembungkus. Konversi seluruh angka rupiah menjadi integer bulat.`;
```
