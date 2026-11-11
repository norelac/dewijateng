// ==============================================================================
// DEWI JATENG - Village Grant & LPJ Domain Service
// Logika bisnis penyimpanan dokumen LPJ resmi, audit pos belanja, dan rekalkulasi Trust Score
// ==============================================================================

import { pool, query } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { matchAndCheckSSH } from '@/lib/services/priceAnomalyChecker';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';
import {
  extractLpjFromPdf,
  type ExtractedLpjExpenseItem,
} from '@/lib/services/aiDocumentExtractor';

export interface SaveLpjInput {
  villageId: string;
  fiscalYear?: number;
  fundingSource?: string;
  totalAllocated?: number;
  pdfBuffer?: Buffer;
  fileName?: string;
  pdfFallbackUrl?: string;
  itemsOverride?: ExtractedLpjExpenseItem[];
}

export interface EnrichedExpenseItem extends ExtractedLpjExpenseItem {
  id?: string;
  ai_anomaly_flag: boolean;
  anomaly_note: string;
}

export interface SaveLpjResult {
  grantId: string;
  villageId: string;
  villageName: string;
  villageRegency: string;
  fiscalYear: number;
  fundingSource: string;
  totalAllocated: number;
  totalRealized: number;
  remainingBalance: number;
  lpjDocumentUrl: string;
  lpjStatus: string;
  expensesCount: number;
  anomaliesCount: number;
  updatedTrustScore: number;
  expenses: EnrichedExpenseItem[];
}

/**
 * Menyimpan pengajuan LPJ resmi dari Balai Desa, menjalankan ekstraksi pos belanja modal,
 * mencocokkan harga klaim dengan katalog SSH Pemprov Jateng, dan memperbarui Trust Score desa.
 */
export async function saveLpjSubmission(input: SaveLpjInput): Promise<SaveLpjResult> {
  const villageId = input.villageId?.trim();
  const fiscalYear = input.fiscalYear || 2026;
  const fundingSource =
    input.fundingSource?.trim() ||
    'Bantuan Keuangan Khusus Sarpras Pemprov Jateng TA ' + fiscalYear;
  const totalAllocated = Number(input.totalAllocated) || 100000000;

  if (!villageId) {
    throw new Error('ID Desa Wisata (villageId) wajib disertakan');
  }

  // 1. Validasi Keberadaan Desa Wisata
  const villageRes = await query<{ id: string; name: string; regency: string }>(
    `SELECT id, name, regency FROM tourist_villages WHERE id = $1 LIMIT 1`,
    [villageId]
  );

  if (villageRes.rows.length === 0) {
    throw new Error(`Desa wisata dengan ID ${villageId} tidak terdaftar di sistem`);
  }

  const village = villageRes.rows[0];

  // 2. Evaluasi Dokumen PDF & Ekstraksi AI
  let lpjDocumentUrl = input.pdfFallbackUrl || '';
  let rawExpenses: ExtractedLpjExpenseItem[] = input.itemsOverride || [];

  if (input.pdfBuffer && input.pdfBuffer.length > 0) {
    // Ekstraksi data angka & pos belanja dari PDF
    const extractionResult = await extractLpjFromPdf(input.pdfBuffer, villageId, {
      fiscalYear,
      fundingSource,
      totalAllocated,
      itemsOverride: input.itemsOverride,
    });

    rawExpenses = extractionResult.items;

    // Simpan berkas fisik PDF ke local storage bucket
    const fileName = input.fileName || `LPJ-${village.name.replace(/\s+/g, '-')}-${fiscalYear}.pdf`;
    const saved = await saveFileToStorage('official-documents', fileName, input.pdfBuffer);
    lpjDocumentUrl = saved.publicUrl;
  } else if (!lpjDocumentUrl && rawExpenses.length === 0) {
    throw new Error('Dokumen fisik PDF LPJ atau rincian pos belanja wajib disertakan');
  }

  // 3. Audit Silang Pos Belanja Modal terhadap Katalog SSH Pemprov Jateng
  let calculatedTotalRealized = 0;
  let anomaliesCount = 0;

  const enrichedExpenses: EnrichedExpenseItem[] = await Promise.all(
    rawExpenses.map(async (item) => {
      const volume = Number(item.volume) > 0 ? Number(item.volume) : 1;
      const claimedPrice = Number(item.claimed_unit_price) || 0;
      const amountRealized =
        Number(item.amount_realized) > 0 ? Number(item.amount_realized) : claimedPrice * volume;

      calculatedTotalRealized += amountRealized;

      // Pencocokan harga dengan standar satuan harga (aktifkan AI semantic matching)
      const sshEval = await matchAndCheckSSH(item.activity_name, claimedPrice, {
        regency: village.regency,
        useLlmSemantic: true,
      });
      if (sshEval.isAnomaly) {
        anomaliesCount++;
      }

      return {
        activity_name: item.activity_name,
        category: item.category,
        volume,
        unit: item.unit || 'unit',
        claimed_unit_price: claimedPrice,
        amount_realized: amountRealized,
        ai_anomaly_flag: sshEval.isAnomaly,
        anomaly_note: sshEval.note,
      };
    })
  );

  const remainingBalance = Math.max(0, totalAllocated - calculatedTotalRealized);

  // 4. Atomic UPSERT ke tabel village_grants & grant_expenses dalam transaksi ACID terpadu
  const client = await pool.connect();
  let grantId: string;

  try {
    await client.query('BEGIN');

    const grantRes = await client.query<{ id: string }>(
      `INSERT INTO village_grants (
         village_id, fiscal_year, funding_source, total_allocated,
         total_realized, remaining_balance, lpj_document_url,
         lpj_status, uploaded_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED', NOW())
       ON CONFLICT (village_id, fiscal_year) DO UPDATE SET
         funding_source = EXCLUDED.funding_source,
         total_allocated = EXCLUDED.total_allocated,
         total_realized = EXCLUDED.total_realized,
         remaining_balance = EXCLUDED.remaining_balance,
         lpj_document_url = EXCLUDED.lpj_document_url,
         lpj_status = 'SUBMITTED',
         uploaded_at = NOW()
       RETURNING id`,
      [
        villageId,
        fiscalYear,
        fundingSource,
        totalAllocated,
        calculatedTotalRealized,
        remainingBalance,
        lpjDocumentUrl,
      ]
    );

    grantId = grantRes.rows[0].id;

    // 5. Simpan Rincian Pos Belanja ke grant_expenses & sinkronisasi ke village_transactions
    await client.query(`DELETE FROM grant_expenses WHERE grant_id = $1`, [grantId]);

    for (const exp of enrichedExpenses) {
      const expRes = await client.query<{ id: string }>(
        `INSERT INTO grant_expenses (
           grant_id, activity_name, category, volume, unit,
           claimed_unit_price, budget_allocated, amount_realized,
           remaining_amount, ai_anomaly_flag, anomaly_note
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
         RETURNING id`,
        [
          grantId,
          exp.activity_name,
          exp.category,
          exp.volume,
          exp.unit,
          exp.claimed_unit_price,
          exp.amount_realized,
          exp.amount_realized,
          exp.ai_anomaly_flag,
          exp.anomaly_note,
        ]
      );

      const expenseId = expRes.rows[0].id;
      const refCode = `EXP-${expenseId.slice(0, 8).toUpperCase()}`;

      await client.query(
        `INSERT INTO village_transactions (
           village_id, type, reference_code, title, category,
           transaction_date, amount, payment_method, counterparty,
           note, recorded_by, recorded_at
         ) VALUES ($1, 'PENGELUARAN', $2, $3, $4, CURRENT_DATE, $5, 'TRANSFER', 'Penyedia Desa', $6, 'Pengelola LPJ', NOW())
         ON CONFLICT (reference_code) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           amount = EXCLUDED.amount,
           note = EXCLUDED.note`,
        [
          villageId,
          refCode,
          exp.activity_name,
          exp.category,
          exp.amount_realized,
          exp.anomaly_note,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // 6. Picu Rekalkulasi Trust Score Desa Wisata
  const trustScoreResult = await calculateVillageTrustScore(villageId);

  return {
    grantId,
    villageId,
    villageName: village.name,
    villageRegency: village.regency,
    fiscalYear,
    fundingSource,
    totalAllocated,
    totalRealized: calculatedTotalRealized,
    remainingBalance,
    lpjDocumentUrl,
    lpjStatus: 'SUBMITTED',
    expensesCount: enrichedExpenses.length,
    anomaliesCount,
    updatedTrustScore: trustScoreResult.trustScore,
    expenses: enrichedExpenses,
  };
}

/**
 * Mengambil ringkasan LPJ dana bantuan sarpras desa wisata
 */
export async function getVillageLpjSummary(
  villageId: string,
  fiscalYear: number = 2026
): Promise<SaveLpjResult | null> {
  const grantRes = await query<any>(
    `SELECT vg.*, tv.name as village_name, tv.regency as village_regency, tv.trust_score
     FROM village_grants vg
     JOIN tourist_villages tv ON tv.id = vg.village_id
     WHERE vg.village_id = $1 AND vg.fiscal_year = $2
     LIMIT 1`,
    [villageId, fiscalYear]
  );

  if (grantRes.rows.length === 0) {
    return null;
  }

  const g = grantRes.rows[0];

  const expRes = await query<any>(
    `SELECT id, activity_name, category, volume, unit, claimed_unit_price,
            amount_realized, ai_anomaly_flag, anomaly_note
     FROM grant_expenses
     WHERE grant_id = $1
     ORDER BY id ASC`,
    [g.id]
  );

  const expenses: EnrichedExpenseItem[] = expRes.rows.map((row) => ({
    id: row.id,
    activity_name: row.activity_name,
    category: row.category,
    volume: parseFloat(row.volume),
    unit: row.unit,
    claimed_unit_price: parseInt(row.claimed_unit_price, 10),
    amount_realized: parseInt(row.amount_realized, 10),
    ai_anomaly_flag: row.ai_anomaly_flag,
    anomaly_note: row.anomaly_note,
  }));

  const anomaliesCount = expenses.filter((e) => e.ai_anomaly_flag).length;

  return {
    grantId: g.id,
    villageId: g.village_id,
    villageName: g.village_name,
    villageRegency: g.village_regency,
    fiscalYear: g.fiscal_year,
    fundingSource: g.funding_source,
    totalAllocated: parseInt(g.total_allocated, 10),
    totalRealized: parseInt(g.total_realized, 10),
    remainingBalance: parseInt(g.remaining_balance, 10),
    lpjDocumentUrl: g.lpj_document_url,
    lpjStatus: g.lpj_status,
    expensesCount: expenses.length,
    anomaliesCount,
    updatedTrustScore: parseFloat(g.trust_score || '0'),
    expenses,
  };
}

// ------------------------------------------------------------------------------
// Antrean verifikasi LPJ (dipakai layar Disbudparekraf -> Aktivitas)
// ------------------------------------------------------------------------------

export interface LpjQueueItem {
  grantId: string;
  villageName: string;
  regency: string;
  fiscalYear: number;
  totalAllocated: number;
  totalRealized: number;
  lpjStatus: 'PENDING_UPLOAD' | 'SUBMITTED' | 'VERIFIED' | 'REVISION';
  lpjDocumentUrl: string | null;
  uploadedAt: string | null;
  lpjReviewNotes: string | null;
  hasAnomaly: boolean;
}

/**
 * Ambil antrean LPJ yang benar-benar ada di database.
 * Urutan: yang butuh tindakan lebih dulu (SUBMITTED -> REVISION -> VERIFIED),
 * lalu yang paling baru diunggah.
 */
export async function listLpjQueue(
  fiscalYear: number = 2026,
  limit: number = 12
): Promise<LpjQueueItem[]> {
  const res = await query<any>(
    `SELECT vg.id, vg.fiscal_year, vg.total_allocated, vg.total_realized,
            vg.lpj_document_url, vg.lpj_status, vg.uploaded_at, vg.lpj_review_notes,
            tv.name AS village_name, tv.regency,
            COALESCE(anom.cnt, 0) AS anomaly_count
       FROM village_grants vg
       JOIN tourist_villages tv ON tv.id = vg.village_id
       LEFT JOIN (
         SELECT grant_id, COUNT(*) AS cnt
           FROM grant_expenses
          WHERE ai_anomaly_flag = true
          GROUP BY grant_id
       ) anom ON anom.grant_id = vg.id
      WHERE vg.fiscal_year = $1
        AND vg.lpj_document_url IS NOT NULL
      ORDER BY CASE vg.lpj_status
                 WHEN 'SUBMITTED' THEN 0
                 WHEN 'REVISION' THEN 1
                 WHEN 'VERIFIED' THEN 2
                 ELSE 3
               END,
               vg.uploaded_at DESC NULLS LAST
      LIMIT $2`,
    [fiscalYear, limit]
  );

  return res.rows.map((row) => ({
    grantId: row.id,
    villageName: row.village_name,
    regency: row.regency,
    fiscalYear: row.fiscal_year,
    totalAllocated: parseInt(row.total_allocated, 10),
    totalRealized: parseInt(row.total_realized, 10),
    lpjStatus: row.lpj_status,
    lpjDocumentUrl: row.lpj_document_url,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null,
    lpjReviewNotes: row.lpj_review_notes,
    hasAnomaly: parseInt(row.anomaly_count, 10) > 0,
  }));
}

/**
 * Data lengkap satu grant untuk dirender menjadi berkas PDF LPJ.
 * `slug` adalah slug desa wisata pada tabel `tourist_villages`.
 */
export async function getLpjDocumentData(
  slug: string,
  fiscalYear: number = 2026
): Promise<import('@/lib/services/lpjDocumentPdf').LpjDocumentData | null> {
  const grantRes = await query<any>(
    `SELECT vg.id, vg.fiscal_year, vg.funding_source, vg.total_allocated,
            vg.total_realized, vg.remaining_balance, vg.lpj_status, vg.uploaded_at,
            tv.name AS village_name, tv.regency, tv.district, tv.trust_score
       FROM village_grants vg
       JOIN tourist_villages tv ON tv.id = vg.village_id
      WHERE tv.slug = $1 AND vg.fiscal_year = $2
      LIMIT 1`,
    [slug, fiscalYear]
  );

  if (grantRes.rows.length === 0) return null;
  const g = grantRes.rows[0];

  const expRes = await query<any>(
    `SELECT activity_name, category, volume, unit, claimed_unit_price,
            amount_realized, ai_anomaly_flag, anomaly_note
       FROM grant_expenses
      WHERE grant_id = $1
      ORDER BY id ASC`,
    [g.id]
  );

  return {
    villageName: g.village_name,
    regency: g.regency,
    district: g.district,
    fiscalYear: g.fiscal_year,
    fundingSource: g.funding_source,
    totalAllocated: parseInt(g.total_allocated, 10),
    totalRealized: parseInt(g.total_realized, 10),
    remainingBalance: parseInt(g.remaining_balance, 10),
    lpjStatus: g.lpj_status,
    uploadedAt: g.uploaded_at ? new Date(g.uploaded_at).toISOString() : null,
    trustScore: g.trust_score ? parseFloat(g.trust_score) : null,
    expenses: expRes.rows.map((row) => ({
      activity_name: row.activity_name,
      category: row.category,
      volume: parseFloat(row.volume),
      unit: row.unit,
      claimed_unit_price: parseInt(row.claimed_unit_price, 10),
      amount_realized: parseInt(row.amount_realized, 10),
      ai_anomaly_flag: row.ai_anomaly_flag,
      anomaly_note: row.anomaly_note,
    })),
  };
}
