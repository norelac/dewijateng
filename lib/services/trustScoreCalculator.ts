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

  let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  if (finalScore < 60) {
    status = 'RED';
  } else if (finalScore < 80) {
    status = 'YELLOW';
  }

  return {
    villageId,
    sLpj,
    sAduan,
    trustScore: finalScore,
    status,
  };
}
