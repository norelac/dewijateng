// ==============================================================================
// DEWI JATENG - Price Anomaly Checker & SSH Compliance Domain Service
// Algoritma audit kepatuhan harga belanja LPJ desa wisata vs Standar Satuan Harga (SSH) Pemprov Jateng
// ==============================================================================

import { query } from '@/lib/db';

export interface AnomalyEvaluation {
  isAnomaly: boolean;
  deviationPct: number;
  standardPrice: number | null;
  matchedItemName: string | null;
  standardUnit?: string | null;
  note: string;
}

export interface AnomalyCheckItem {
  activity_name: string;
  category?: string;
  volume?: number;
  unit?: string;
  claimed_unit_price: number;
  amount_realized?: number;
  regency?: string;
}

export interface AuditedExpenseItem {
  activity_name: string;
  category: string;
  volume: number;
  unit: string;
  claimed_unit_price: number;
  amount_realized: number;
  ssh_standard_price: number | null;
  matched_item_name: string | null;
  deviation_pct: number | null;
  ai_anomaly_flag: boolean;
  anomaly_note: string;
}

export interface BulkAnomalyAuditResult {
  total_items: number;
  anomalies_detected: number;
  items: AuditedExpenseItem[];
}

export interface SshCatalogItem {
  id: number | string;
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  standard_price: number;
  regency: string;
}

// In-memory cache katalog SSH untuk performa tinggi (< 50ms untuk puluhan pos belanja)
let sshCatalogCache: SshCatalogItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 menit TTL

/**
 * Mengambil katalog acuan SSH Pemprov Jateng dari cache memori atau database
 */
export async function getSshCatalog(): Promise<SshCatalogItem[]> {
  const now = Date.now();
  if (sshCatalogCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return sshCatalogCache;
  }

  try {
    const res = await query<{
      id: number;
      item_code: string;
      item_name: string;
      category: string;
      unit: string;
      standard_price: string;
      regency: string;
    }>(
      `SELECT id, item_code, item_name, category, unit, standard_price, regency
       FROM ssh_reference_rates
       ORDER BY id ASC`
    );

    sshCatalogCache = res.rows.map((row) => ({
      id: row.id,
      item_code: row.item_code,
      item_name: row.item_name,
      category: row.category,
      unit: row.unit,
      standard_price: parseFloat(row.standard_price) || 0,
      regency: row.regency,
    }));
    cacheTimestamp = now;

    return sshCatalogCache;
  } catch (err: any) {
    console.warn('[Price Anomaly Checker]: Database offline, memuat 1.061 HSD MAS PETRUK 2026 fallback JSON:', err?.message);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'hsd-maspetruk-1061.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const items = JSON.parse(raw);
        sshCatalogCache = items.map((item: any, idx: number) => ({
          id: idx + 1,
          item_code: item.item_code,
          item_name: item.item_name,
          category: item.category,
          unit: item.unit,
          standard_price: Number(item.standard_price) || 0,
          regency: item.regency,
        }));
        cacheTimestamp = now;
        return sshCatalogCache || [];
      }
    } catch (fsErr) {
      console.error('[Price Anomaly Checker]: Gagal memuat fallback JSON:', fsErr);
    }
    return sshCatalogCache || [];
  }
}

/**
 * Format angka ke representasi Rupiah Indonesia
 */
function formatRupiahId(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Evaluasi deviasi persentase harga klaim terhadap standar SSH
 * Threshold: > +40% dianggap anomali penggelembungan harga (mark-up)
 */
export function evaluatePriceDeviation(
  claimedPrice: number,
  sshStandardPrice: number,
  matchedItemName?: string,
  unit?: string
): AnomalyEvaluation {
  if (sshStandardPrice <= 0) {
    return {
      isAnomaly: false,
      deviationPct: 0,
      standardPrice: null,
      matchedItemName: matchedItemName || null,
      standardUnit: unit || null,
      note: 'Standar harga belum ditentukan di katalog',
    };
  }

  const deviation = ((claimedPrice - sshStandardPrice) / sshStandardPrice) * 100;
  const deviationPct = Number(deviation.toFixed(2));
  const itemNameStr = matchedItemName ? ` (${matchedItemName})` : '';

  if (deviationPct > 40) {
    return {
      isAnomaly: true,
      deviationPct,
      standardPrice: sshStandardPrice,
      matchedItemName: matchedItemName || null,
      standardUnit: unit || null,
      note: `Terdeteksi deviasi +${deviationPct}% melebihi batas atas SSH Jateng ${formatRupiahId(sshStandardPrice)}${itemNameStr}`,
    };
  }

  return {
    isAnomaly: false,
    deviationPct,
    standardPrice: sshStandardPrice,
    matchedItemName: matchedItemName || null,
    standardUnit: unit || null,
    note:
      deviationPct > 0
        ? `Sesuai batas wajar SSH Jateng (Deviasi +${deviationPct}%, toleransi maks +40%)`
        : `Sesuai batas wajar Standar Satuan Harga (Di bawah batas ${formatRupiahId(sshStandardPrice)})`,
  };
}

/**
 * Mencari kecocokan semantik item katalog SSH menggunakan AI LLM jika pencarian kata kunci nihil
 */
async function matchWithLlmSemantic(
  itemName: string,
  catalog: SshCatalogItem[]
): Promise<SshCatalogItem | null> {
  const baseUrl = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gemini-2.5-flash';

  if (!baseUrl || !apiKey || catalog.length === 0) {
    return null;
  }

  try {
    // Best practice hemat token: Saring ke top-25 kandidat yang relevan (bukan seluruh 1.000+ item)
    const itemWords = itemName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    const candidateMatches = catalog.filter((c) => {
      const cLower = c.item_name.toLowerCase();
      return itemWords.some((w) => cLower.includes(w));
    });

    const candidates = (candidateMatches.length > 0 ? candidateMatches : catalog).slice(0, 25);

    const catalogOptions = candidates
      .map((c) => `- [${c.item_code}] ${c.item_name} (Satuan: ${c.unit}, Standar: ${formatRupiahId(c.standard_price)})`)
      .join('\n');

    const promptSystem = `Anda adalah asisten auditor pengadaan barang dan jasa Pemerintah Provinsi Jawa Tengah.
Tugas Anda adalah mencocokkan nama pos belanja/material dari desa ke salah satu item resmi dari katalog Standar Satuan Harga (SSH) Pemprov Jateng.
Jika ada item yang setara secara fungsi atau material, kembalikan item_code-nya.
Jika sama sekali tidak ada yang relevan (misal jasa lokal khusus, makanan tradisional, dsb.), kembalikan null.

Format output JSON murni:
{
  "matched_item_code": "SSH-XXX-XXX" | null,
  "confidence": 0.0 - 1.0
}`;

    const promptUser = `Nama pos belanja yang diklaim: "${itemName}"

Daftar katalog referensi SSH:
${catalogOptions}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: promptSystem },
          { role: 'user', content: promptUser },
        ],
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.matched_item_code && (parsed.confidence === undefined || parsed.confidence >= 0.6)) {
      const found = catalog.find((c) => c.item_code === parsed.matched_item_code);
      return found || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Mencocokkan nama pos belanja dengan katalog SSH Pemprov Jateng
 * Menggunakan perpaduan Fuzzy Token Matching dan LLM Semantic Matcher
 */
export async function matchAndCheckSSH(
  itemName: string,
  claimedUnitPrice: number,
  options?: { regency?: string; useLlmSemantic?: boolean } | string
): Promise<AnomalyEvaluation> {
  const regency = typeof options === 'string' ? options : options?.regency;
  const useLlmSemantic = typeof options === 'object' ? options?.useLlmSemantic ?? false : false;

  const cleanName = (itemName || '').trim();
  if (!cleanName || claimedUnitPrice <= 0) {
    return {
      isAnomaly: false,
      deviationPct: 0,
      standardPrice: null,
      matchedItemName: null,
      note: 'Item tidak memiliki rincian harga yang valid',
    };
  }

  const catalog = await getSshCatalog();
  if (catalog.length === 0) {
    return {
      isAnomaly: false,
      deviationPct: 0,
      standardPrice: null,
      matchedItemName: null,
      note: 'Katalog acuan SSH belum tersedia',
    };
  }

  // 1. Ekstraksi kata kunci penting (abaikan stopwords umum)
  const lowerName = cleanName.toLowerCase();
  const stopwords = new Set([
    'dan', 'untuk', 'yang', 'pada', 'dengan', 'dari', 'ke', 'di', 'pos', 'biaya', 'pembelian',
    'pengadaan', 'pekerjaan', 'pembuatan', 'renovasi', 'desa', 'wisata', 'ta', '2026', 'grade'
  ]);

  const tokens = lowerName
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  // 2. Scoring kecocokan terhadap item di katalog
  let bestCandidate: SshCatalogItem | null = null;
  let highestScore = 0;

  for (const item of catalog) {
    const itemLower = item.item_name.toLowerCase();
    let score = 0;

    // A. Exact phrase match
    if (lowerName.includes(itemLower) || itemLower.includes(lowerName)) {
      score += 50;
    }

    // B. Token overlap scoring
    for (const token of tokens) {
      if (itemLower.includes(token)) {
        // Berikan bobot lebih untuk kata kunci material spesifik
        if (['semen', 'pipa', 'besi', 'galvanis', 'hollow', 'pasir', 'batu', 'split', 'cat', 'las', 'tukang', 'rambu', 'kawat', 'kayu', 'balok', 'bata', 'genteng', 'paku', 'mandor', 'beton'].includes(token)) {
          score += 15;
        } else {
          score += 5;
        }
      }
    }

    // C. Prioritas harga spesifik wilayah/kabupaten jika cocok (+25 poin)
    if (regency && item.regency && (item.regency.toLowerCase().includes(regency.toLowerCase()) || regency.toLowerCase().includes(item.regency.toLowerCase()))) {
      score += 25;
    }

    if (score > highestScore) {
      highestScore = score;
      bestCandidate = item;
    }
  }

  // 3. Jika skor token mencukupi (minimal 10), gunakan hasil pencocokan lokal tercepat
  if (bestCandidate && highestScore >= 10) {
    return evaluatePriceDeviation(claimedUnitPrice, bestCandidate.standard_price, bestCandidate.item_name, bestCandidate.unit);
  }

  // 4. Jika diizinkan secara eksplisit dan token lokal rendah, coba manfaatkan AI LLM Semantic Matcher
  if (useLlmSemantic) {
    const llmMatch = await matchWithLlmSemantic(cleanName, catalog);
    if (llmMatch) {
      return evaluatePriceDeviation(claimedUnitPrice, llmMatch.standard_price, llmMatch.item_name, llmMatch.unit);
    }
  }

  // 5. Jika tidak ditemukan padanan di katalog SSH (kearifan lokal / barang unik pedesaan)
  return {
    isAnomaly: false,
    deviationPct: 0,
    standardPrice: null,
    matchedItemName: null,
    note: 'Item kearifan lokal / belum terdaftar di katalog SSH standar Jateng',
  };
}

/**
 * Melakukan audit anomali harga secara massal terhadap sekumpulan pos belanja LPJ
 */
export async function checkExpenseAnomalies(items: AnomalyCheckItem[]): Promise<BulkAnomalyAuditResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      total_items: 0,
      anomalies_detected: 0,
      items: [],
    };
  }

  const auditedItems: AuditedExpenseItem[] = await Promise.all(
    items.map(async (item) => {
      const volume = Number(item.volume) > 0 ? Number(item.volume) : 1;
      const claimedPrice = Number(item.claimed_unit_price) || 0;
      const amountRealized =
        Number(item.amount_realized) > 0 ? Number(item.amount_realized) : Math.round(volume * claimedPrice);

      const evaluation = await matchAndCheckSSH(item.activity_name, claimedPrice, {
        regency: item.regency,
        useLlmSemantic: true,
      });

      return {
        activity_name: item.activity_name,
        category: item.category || 'MATERIAL_FISIK',
        volume,
        unit: item.unit || 'unit',
        claimed_unit_price: claimedPrice,
        amount_realized: amountRealized,
        ssh_standard_price: evaluation.standardPrice,
        matched_item_name: evaluation.matchedItemName,
        deviation_pct: evaluation.deviationPct,
        ai_anomaly_flag: evaluation.isAnomaly,
        anomaly_note: evaluation.note,
      };
    })
  );

  const anomaliesDetected = auditedItems.filter((i) => i.ai_anomaly_flag).length;

  return {
    total_items: auditedItems.length,
    anomalies_detected: anomaliesDetected,
    items: auditedItems,
  };
}
