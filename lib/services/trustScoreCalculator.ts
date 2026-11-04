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
  // 1. Cek Kepatuhan Finansial LPJ
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
 * Menggunakan single SQL query dengan subquery agregasi untuk menghitung
 * S_LPJ dan S_Aduan sekaligus, lalu batch UPDATE dalam 1 transaksi.
 */
export async function recalculateAllVillages(): Promise<BatchRecalcResult> {
  const startTime = Date.now();

  // Single query: hitung S_LPJ dan S_Aduan untuk seluruh desa sekaligus
  const calcRes = await query<{
    id: string;
    total_grants: string;
    verified_grants: string;
    total_reports: string;
    resolved_reports: string;
  }>(
    `SELECT
       tv.id,
       COALESCE(g.total_grants, 0) as total_grants,
       COALESCE(g.verified_grants, 0) as verified_grants,
       COALESCE(r.total_reports, 0) as total_reports,
       COALESCE(r.resolved_reports, 0) as resolved_reports
     FROM tourist_villages tv
     LEFT JOIN (
       SELECT village_id,
              COUNT(*) as total_grants,
              COUNT(CASE WHEN lpj_status IN ('VERIFIED', 'SUBMITTED') THEN 1 END) as verified_grants
       FROM village_grants GROUP BY village_id
     ) g ON g.village_id = tv.id
     LEFT JOIN (
       SELECT village_id,
              COUNT(*) as total_reports,
              COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_reports
       FROM incident_reports GROUP BY village_id
     ) r ON r.village_id = tv.id`
  );

  let updated = 0;
  let green = 0;
  let yellow = 0;
  let red = 0;
  let scoreSum = 0;

  // Batch update per desa
  for (const row of calcRes.rows) {
    const tg = parseInt(row.total_grants, 10);
    const vg = parseInt(row.verified_grants, 10);
    const tr = parseInt(row.total_reports, 10);
    const rr = parseInt(row.resolved_reports, 10);

    const sLpj = tg > 0 ? (vg / tg) * 100.0 : 80.0;
    const sAduan = tr > 0 ? (rr / tr) * 100.0 : 80.0;
    const score = Number((0.5 * sLpj + 0.5 * sAduan).toFixed(2));

    await query(
      `UPDATE tourist_villages SET trust_score = $1, updated_at = NOW() WHERE id = $2`,
      [score, row.id]
    );

    const status = classifyTrustStatus(score);
    if (status === 'GREEN') green++;
    else if (status === 'YELLOW') yellow++;
    else red++;

    scoreSum += score;
    updated++;
  }

  return {
    total_villages: calcRes.rows.length,
    updated,
    green,
    yellow,
    red,
    average_score: updated > 0 ? Number((scoreSum / updated).toFixed(2)) : 80.0,
    duration_ms: Date.now() - startTime,
  };
}
