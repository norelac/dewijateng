---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-08"
title: "Kalkulator Matematis Transparan Trust Score 50/50 & API Agregasi"
status: open
priority: high
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - trust-score
  - decision-support
  - aggregation
---

# ISSUE-BE-08: Kalkulator Matematis Transparan Trust Score 50/50 & API Agregasi

## 1. Konteks & Deskripsi Fitur
Membangun modul kalkulator indeks kepatuhan (*Trust Score*) berbasis formula berbobot transparan 50/50 (`lib/services/trustScoreCalculator.ts`), endpoint pembaruan skor (`POST /api/compliance/trust-score`), serta API penyedia data agregasi spasial 35 Kabupaten/Kota untuk layar pantau Peta Kendali Disporapar Pemprov Jateng (`GET /api/disporapar/overview`).

## 2. Acuan Desain & Formula Matematis Transparan
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - Product-Requirements-Document-PRD]]
- Prinsip Keterbukaan: Formula tidak menggunakan *black-box AI*, melainkan rumus deterministik terbuka yang adil bagi pengelola desa:
  $$\text{Trust Score} = (0.50 \times S_{\text{LPJ}}) + (0.50 \times S_{\text{Aduan}})$$
- Parameter Komponen:
  1. **Komponen Kepatuhan Finansial LPJ ($S_{\text{LPJ}}$):**
     - $S_{\text{LPJ}} = 100$ jika dokumen LPJ resmi tahun anggaran aktif telah diunggah dan terbit.
     - $S_{\text{LPJ}} = 0$ jika desa menerima bantuan namun LPJ belum diunggah (*pending*).
  2. **Komponen Responsivitas Layanan & Aduan ($S_{\text{Aduan}}$):**
     $$S_{\text{Aduan}} = \left( \frac{\text{Aduan Selesai Berbukti (\textit{RESOLVED})}}{\text{Total Aduan Masuk}} \right) \times 100$$
     *(Catatan: Jika sebuah desa belum pernah menerima aduan sama sekali, nilai $S_{\text{Aduan}}$ diberikan nilai awal default $80.00$ sebagai insentif pemeliharaan sarana).*
- Predikat Klasifikasi Warna:
  - **Hijau (Patuh):** Skor $\ge 80.00$.
  - **Kuning (Perhatian):** Skor $60.00 - 79.99$.
  - **Merah (Kritis):** Skor $< 60.00$.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Calculator Engine | `lib/services/trustScoreCalculator.ts` | Algoritma kalkulasi nilai $S_{\text{LPJ}}$, $S_{\text{Aduan}}$, dan Trust Score |
| Recalculate Route | `app/api/compliance/trust-score/route.ts` | Endpoint trigger rekalkulasi skor desa pasca-unggah LPJ / penyelesaian aduan |
| Overview Aggregator | `app/api/disporapar/overview/route.ts` | Route handler penyedia agregasi statistik 35 Kabupaten/Kota untuk Command Center |
| Database Helper | `lib/db.ts` | Kueri agregasi SQL performa tinggi |

## 4. Spesifikasi Endpoint & Format Respon
1. **Endpoint `GET /api/disporapar/overview`:**
   - Menyajikan data makro kepatuhan seluruh Jawa Tengah:
   ```json
   {
     "success": true,
     "data": {
       "macro_metrics": {
         "total_villages": 776,
         "lpj_compliance_rate": 88.5,
         "total_complaints": 312,
         "resolved_complaints": 284,
         "resolution_rate": 91.0,
         "average_trust_score": 83.4
       },
       "regency_status": [
         {
           "regency": "Kabupaten Semarang",
           "total_villages": 42,
           "average_score": 88.2,
           "status": "GREEN"
         },
         {
           "regency": "Kabupaten Purbalingga",
           "total_villages": 28,
           "average_score": 67.5,
           "status": "YELLOW"
         }
       ],
       "grant_priorities": [
         {
           "village_id": "uuid-candirejo",
           "name": "Desa Wisata Candirejo",
           "regency": "Kabupaten Magelang",
           "trust_score": 96.0,
           "recommendation": "PRIORITAS_UTAMA_HIBAH_2027"
         }
       ]
     }
   }
   ```
2. **Kueri Agregasi SQL Efisien:**
   - Menghitung rasio aduan dan status LPJ menggunakan agregasi kondisional (`COUNT(CASE WHEN...)`) dalam 1 kali round-trip query.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Formula matematis 50/50 menghasilkan nilai Trust Score antara 0 hingga 100 secara akurat.
- [ ] AC-2: Desa tanpa aduan mendapatkan nilai default $S_{\text{Aduan}} = 80.00$.
- [ ] AC-3: Rekalkulasi otomatis terpanggil setiap kali LPJ diverifikasi atau aduan berstatus `RESOLVED`.
- [ ] AC-4: Kolom `trust_score` pada tabel `tourist_villages` diperbarui dengan nilai terbaru.
- [ ] AC-5: Endpoint `GET /api/disporapar/overview` merespons dalam waktu $< 250\text{ ms}$.
- [ ] AC-6: Klasifikasi warna wilayah (Hijau, Kuning, Merah) sesuai dengan ambang batas batas yang telah ditetapkan.
- [ ] AC-7: Panel rekomendasi hibah menyaring desa-desa dengan skor tertinggi secara tepat.

## 6. Catatan Teknis
```typescript
export async function calculateVillageTrustScore(villageId: string): Promise<number> {
  // 1. Cek Kepatuhan LPJ
  const lpjRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM village_grants 
     WHERE village_id = $1 AND lpj_status = 'VERIFIED'`,
    [villageId]
  );
  const sLpj = parseInt(lpjRes.rows[0].count, 10) > 0 ? 100 : 0;

  // 2. Cek Rasio Aduan Selesai
  const aduanRes = await query<{ total: string; resolved: string }>(
    `SELECT 
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved
     FROM incident_reports WHERE village_id = $1`,
    [villageId]
  );
  const total = parseInt(aduanRes.rows[0].total, 10);
  const resolved = parseInt(aduanRes.rows[0].resolved, 10);
  const sAduan = total === 0 ? 80.0 : (resolved / total) * 100;

  // 3. Formula 50/50
  const trustScore = Number((0.5 * sLpj + 0.5 * sAduan).toFixed(2));

  // 4. Update ke database
  await query(`UPDATE tourist_villages SET trust_score = $1, updated_at = NOW() WHERE id = $2`, [
    trustScore,
    villageId,
  ]);

  return trustScore;
}
```
