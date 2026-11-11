import { db, query } from '@/lib/db';
import { touristVillages, villageGrants, incidentReports } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface TrustScoreBreakdown {
  villageId: string;
  sLpj: number;
  sAduan: number;
  trustScore: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

export interface BatchRecalcResult {
  total_villages: number;
  updated: number;
  green: number;
  yellow: number;
  red: number;
  average_score: number;
  duration_ms: number;
}

/**
 * Menentukan predikat klasifikasi warna berdasarkan nilai Trust Score.
 * - GREEN (Patuh): skor >= 80.00
 * - YELLOW (Perhatian): skor 60.00 - 79.99
 * - RED (Kritis): skor < 60.00
 */
export function classifyTrustStatus(score: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (score < 60) return 'RED';
  if (score < 80) return 'YELLOW';
  return 'GREEN';
}

/**
 * DEWI JATENG - Kalkulator Trust Score Terbuka (Formula 50/50)
 * Trust Score = (0.50 * S_LPJ) + (0.50 * S_Aduan)
 *
 * S_LPJ: 100 jika LPJ bantuan diverifikasi/diunggah, 0 jika mangkrak (PENDING_UPLOAD)
 * S_Aduan: (Aduan RESOLVED / Total Aduan) * 100. Default 80.0 jika belum ada aduan.
 */
export async function calculateVillageTrustScore(
  villageId: string
): Promise<TrustScoreBreakdown> {
  // 1. Cek Kepatuhan Finansial LPJ & Anomali Belanja AI
  const lpjRes = await query<{ total_grants: string; verified_grants: string }>(
    `SELECT
       COUNT(*) as total_grants,
       COUNT(CASE WHEN lpj_status IN ('VERIFIED', 'SUBMITTED') THEN 1 END) as verified_grants
     FROM village_grants
     WHERE village_id = $1`,
    [villageId]
  );

  const totalGrants = parseInt(lpjRes.rows[0]?.total_grants || '0', 10);
  const verifiedGrants = parseInt(lpjRes.rows[0]?.verified_grants || '0', 10);

  let sLpj = 80.0; // Default jika desa belum menerima bantuan khusus
  if (totalGrants > 0) {
    sLpj = (verifiedGrants / totalGrants) * 100.0;

    // Evaluasi penalti jika terdapat anomali harga belanja (AI Anomaly Flag)
    const anomalyRes = await query<{ total_expenses: string; anomaly_expenses: string }>(
      `SELECT
         COUNT(ge.id) as total_expenses,
         COUNT(CASE WHEN ge.ai_anomaly_flag = true THEN 1 END) as anomaly_expenses
       FROM grant_expenses ge
       JOIN village_grants vg ON vg.id = ge.grant_id
       WHERE vg.village_id = $1`,
      [villageId]
    );

    const totalExpenses = parseInt(anomalyRes.rows[0]?.total_expenses || '0', 10);
    const anomalyExpenses = parseInt(anomalyRes.rows[0]?.anomaly_expenses || '0', 10);

    if (totalExpenses > 0 && anomalyExpenses > 0) {
      // Penalti proporsional hingga 35 poin terhadap kepatuhan anggaran
      const penaltyRate = anomalyExpenses / totalExpenses;
      const penalty = penaltyRate * 35.0;
      sLpj = Math.max(0, sLpj - penalty);
    }
  }

  // 2. Cek Responsivitas Aduan Warga
  const aduanRes = await query<{ total_reports: string; resolved_reports: string }>(
    `SELECT
       COUNT(*) as total_reports,
       COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_reports
     FROM incident_reports
     WHERE village_id = $1`,
    [villageId]
  );

  const totalReports = parseInt(aduanRes.rows[0]?.total_reports || '0', 10);
  const resolvedReports = parseInt(aduanRes.rows[0]?.resolved_reports || '0', 10);

  let sAduan = 80.0; // Insentif awal bagi desa tanpa keluhan/insiden
  if (totalReports > 0) {
    sAduan = (resolvedReports / totalReports) * 100.0;
  }

  // 3. Formula Terbuka 50/50
  const finalScore = Number((0.5 * sLpj + 0.5 * sAduan).toFixed(2));

  // 4. Update kolom trust_score di database
  await query(
    `UPDATE tourist_villages
     SET trust_score = $1, updated_at = NOW()
     WHERE id = $2`,
    [finalScore, villageId]
  );

  return {
    villageId,
    sLpj: Number(sLpj.toFixed(2)),
    sAduan: Number(sAduan.toFixed(2)),
    trustScore: finalScore,
    status: classifyTrustStatus(finalScore),
  };
}

/**
 * Rekalkulasi massal Trust Score seluruh desa wisata terdaftar.
 * Digunakan untuk keperluan maintenance, cron job, atau refresh setelah migrasi data.
 *
 * Menggunakan satu query SQL UPDATE ... FROM terpadu dengan ekspresi kondisional (CTE)
 * untuk mengeliminasi masalah N+1 query.
 */
export async function recalculateAllVillages(): Promise<BatchRecalcResult> {
  const startTime = Date.now();

  const updateRes = await query<{ id: string; trust_score: string }>(
    `WITH aggregated AS (
       SELECT
         tv.id,
         COALESCE(g.total_grants, 0) as total_grants,
         COALESCE(g.verified_grants, 0) as verified_grants,
         COALESCE(e.total_expenses, 0) as total_expenses,
         COALESCE(e.anomaly_expenses, 0) as anomaly_expenses,
         COALESCE(r.total_reports, 0) as total_reports,
         COALESCE(r.resolved_reports, 0) as resolved_reports
       FROM tourist_villages tv
       LEFT JOIN (
         SELECT village_id, COUNT(*) as total_grants,
                COUNT(CASE WHEN lpj_status IN ('VERIFIED', 'SUBMITTED') THEN 1 END) as verified_grants
         FROM village_grants GROUP BY village_id
       ) g ON g.village_id = tv.id
       LEFT JOIN (
         SELECT vg.village_id,
                COUNT(ge.id) as total_expenses,
                COUNT(CASE WHEN ge.ai_anomaly_flag = true THEN 1 END) as anomaly_expenses
         FROM grant_expenses ge
         JOIN village_grants vg ON vg.id = ge.grant_id
         GROUP BY vg.village_id
       ) e ON e.village_id = tv.id
       LEFT JOIN (
         SELECT village_id, COUNT(*) as total_reports,
                COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_reports
         FROM incident_reports GROUP BY village_id
       ) r ON r.village_id = tv.id
     ),
     scores AS (
       SELECT
         id,
         ROUND(
           (0.50 * (
             CASE
               WHEN total_grants > 0 THEN
                 GREATEST(0, ((verified_grants::numeric / total_grants) * 100) - (CASE WHEN total_expenses > 0 THEN (anomaly_expenses::numeric / total_expenses) * 35 ELSE 0 END))
               ELSE 80.00
             END
           ) +
            0.50 * (CASE WHEN total_reports > 0 THEN (resolved_reports::numeric / total_reports) * 100 ELSE 80.00 END))::numeric,
           2
         ) as calculated_score
       FROM aggregated
     )
     UPDATE tourist_villages tv
     SET trust_score = s.calculated_score, updated_at = NOW()
     FROM scores s
     WHERE tv.id = s.id
     RETURNING tv.id, tv.trust_score`
  );

  let green = 0;
  let yellow = 0;
  let red = 0;
  let scoreSum = 0;

  for (const r of updateRes.rows) {
    const val = parseFloat(r.trust_score);
    scoreSum += val;
    if (val >= 80) green++;
    else if (val >= 60) yellow++;
    else red++;
  }

  return {
    total_villages: updateRes.rows.length,
    updated: updateRes.rows.length,
    green,
    yellow,
    red,
    average_score: updateRes.rows.length > 0 ? Number((scoreSum / updateRes.rows.length).toFixed(2)) : 80.0,
    duration_ms: Date.now() - startTime,
  };
}
