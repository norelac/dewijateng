---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "ai_dewijateng"
issue_id: "BE-07"
title: "Mesin Pemeriksa Deviasi Harga Material vs SSH Pemprov Jateng"
status: open
priority: medium
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - price-anomaly
  - compliance-audit
  - ssh-jateng
---

# ISSUE-BE-07: Mesin Pemeriksa Deviasi Harga Material vs SSH Pemprov Jateng

## 1. Konteks & Deskripsi Fitur
Membangun algoritma audit kepatuhan otomatis (`lib/services/priceAnomalyChecker.ts`) dan endpoint evaluasi (`POST /api/compliance/check-anomaly`) untuk membandingkan harga satuan yang diklaim pada pos belanja LPJ desa wisata terhadap batas atas acuan Standar Satuan Harga (SSH) resmi Pemerintah Provinsi Jawa Tengah. Mesin ini mendeteksi potensi penggelembungan harga (*mark-up*) material secara transparan dan terukur matematis.

## 2. Acuan Desain & Formula Matematis
- Dokumen Rujukan: [[Dewi-Jateng - Business-Logic-and-Transparency-Rules]] & [[Dewi-Jateng - Datasets-and-Seeders-Guide]]
- Formula Persentase Deviasi:
  $$\text{Deviasi Harga (\%)} = \left( \frac{\text{Harga Satuan Klaim} - \text{Harga Standar SSH}}{\text{Harga Standar SSH}} \right) \times 100\%$$
- Ambang Batas Toleransi (*Threshold*):
  - **Normal / Wajar ($\le +40\%$):** Variasi harga masih dalam batas toleransi ongkos angkut pedesaan atau medan geografis pegunungan. Flag `ai_anomaly_flag = false`.
  - **Terindikasi Anomali ($> +40\%$):** Selisih harga dinilai tidak wajar melebihi batas atas standar pemprov. Flag `ai_anomaly_flag = true`, catat deviasi di `anomaly_note`.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| Anomaly Domain Service | `lib/services/priceAnomalyChecker.ts` | Algoritma fuzzy string matching & kalkulasi deviasi persentase |
| Internal Caller (Server Action) | `app/actions/lpjActions.ts` | Panggilan langsung audit harga saat pemrosesan dokumen LPJ |
| Internal Caller (Server Component) | `app/transparansi/page.tsx` | Penyajian status anomali pada tabel LPJ langsung dari basis data |
| Compliance Route (Public API) | `app/api/compliance/check-anomaly/route.ts` | Endpoint evaluasi pos belanja untuk audit pihak eksternal |
| Database Helper | `lib/db.ts` | Kueri pencarian acuan standar pada tabel `ssh_reference_rates` |

## 4. Spesifikasi Algoritma & Alur Eksekusi
1. Menerima array item pos belanja yang diekstrak dari LPJ: `[{ activity_name, category, claimed_unit_price, volume, unit }]`.
2. Melakukan pencarian referensi item terdekat pada tabel `ssh_reference_rates` menggunakan pencocokan kata kunci (*ILIKE / Levenshtein Distance*).
3. Jika item referensi ditemukan:
   - Hitung nilai deviasi persentase terhadap `standard_price`.
   - Jika $\text{Deviasi} > 40\%$:
     - Set `ai_anomaly_flag = true`.
     - Susun catatan audit: `"Harga klaim (Rp X) melebihi batas atas SSH Jateng (Rp Y) sebesar +Z%"`.
   - Jika $\text{Deviasi} \le 40\%$:
     - Set `ai_anomaly_flag = false`.
     - Set `anomaly_note = "Sesuai Standar Satuan Harga Jawa Tengah"`.
4. Jika item referensi tidak ditemukan (pos kegiatan spesifik lokal):
   - Set `ai_anomaly_flag = false`.
   - Set `anomaly_note = "Item kearifan lokal / belum terdaftar di katalog SSH standar"`.
5. Kembalikan array item yang telah diperkaya (*enriched*) dengan metrik audit kepatuhan.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [ ] AC-1: Algoritma berhasil mencocokkan pos belanja umum (Semen, Pipa Besi, Pasir Pasang, Cat Tembok) dengan database SSH Jawa Tengah.
- [ ] AC-2: Penghitungan deviasi harga matematis akurat hingga 2 angka di belakang koma.
- [ ] AC-3: Pos belanja dengan harga wajar ($\le +40\%$) tidak ditandai sebagai anomali (mencegah *false positive*).
- [ ] AC-4: Pos belanja yang terindikasi mark-up ($> +40\%$) berhasil ditandai `ai_anomaly_flag = true` dan memuat catatan selisih harga.
- [ ] AC-5: Item belanja unik desa yang tidak ada di standar pemprov diberi label informatif tanpa memblokir publikasi LPJ.
- [ ] AC-6: Performa kalkulasi cepat ($< 500\text{ ms}$ untuk dokumen dengan 50 pos belanja).

## 6. Catatan Teknis & Code Snippet
```typescript
export interface AnomalyCheckResult {
  activity_name: string;
  claimed_price: number;
  ssh_standard_price: number | null;
  deviation_pct: number | null;
  is_anomaly: boolean;
  note: string;
}

export function evaluatePriceAnomaly(
  claimedPrice: number,
  sshStandardPrice: number
): { isAnomaly: boolean; deviationPct: number; note: string } {
  const deviationPct = ((claimedPrice - sshStandardPrice) / sshStandardPrice) * 100;
  if (deviationPct > 40) {
    return {
      isAnomaly: true,
      deviationPct: Number(deviationPct.toFixed(2)),
      note: `Terdeteksi deviasi +${deviationPct.toFixed(1)}% di atas batas standar SSH Jateng`,
    };
  }
  return {
    isAnomaly: false,
    deviationPct: Number(deviationPct.toFixed(2)),
    note: 'Sesuai batas wajar Standar Satuan Harga',
  };
}
```
