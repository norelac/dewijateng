import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/disporapar/overview
 * Menyediakan data agregasi statistik makro 35 Kabupaten/Kota Jawa Tengah
 * untuk Command Center Disporapar Pemprov Jateng
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Metrik Makro (Macro Metrics)
    const villageStatRes = await query<{
      total_villages: string;
      avg_trust_score: string;
    }>(
      `SELECT
         COUNT(*) as total_villages,
         COALESCE(AVG(trust_score), 80.00) as avg_trust_score
       FROM tourist_villages`
    );

    const grantStatRes = await query<{
      total_grants: string;
      verified_grants: string;
      total_allocated_sum: string;
      total_realized_sum: string;
    }>(
      `SELECT
         COUNT(*) as total_grants,
         COUNT(CASE WHEN lpj_status IN ('VERIFIED', 'SUBMITTED') THEN 1 END) as verified_grants,
         COALESCE(SUM(total_allocated), 0) as total_allocated_sum,
         COALESCE(SUM(total_realized), 0) as total_realized_sum
       FROM village_grants`
    );

    const reportStatRes = await query<{
      total_reports: string;
      resolved_reports: string;
    }>(
      `SELECT
         COUNT(*) as total_reports,
         COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_reports
       FROM incident_reports`
    );

    const totalVillages = parseInt(villageStatRes.rows[0]?.total_villages || '0', 10);
    const avgTrustScore = Number(parseFloat(villageStatRes.rows[0]?.avg_trust_score || '80.00').toFixed(2));

    const totalGrants = parseInt(grantStatRes.rows[0]?.total_grants || '0', 10);
    const verifiedGrants = parseInt(grantStatRes.rows[0]?.verified_grants || '0', 10);
    const lpjComplianceRate = totalGrants > 0 ? Number(((verifiedGrants / totalGrants) * 100).toFixed(1)) : 100.0;

    const totalReports = parseInt(reportStatRes.rows[0]?.total_reports || '0', 10);
    const resolvedReports = parseInt(reportStatRes.rows[0]?.resolved_reports || '0', 10);
    const resolutionRate = totalReports > 0 ? Number(((resolvedReports / totalReports) * 100).toFixed(1)) : 100.0;

    // 2. Status per Kabupaten/Kota (Regency Status)
    const regencyRes = await query<{
      regency: string;
      total_villages: string;
      avg_score: string;
    }>(
      `SELECT
         regency,
         COUNT(*) as total_villages,
         COALESCE(AVG(trust_score), 80.00) as avg_score
       FROM tourist_villages
       GROUP BY regency
       ORDER BY avg_score DESC`
    );

    const regencyStatus = regencyRes.rows.map((r) => {
      const score = Number(parseFloat(r.avg_score).toFixed(1));
      let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      if (score < 60) status = 'RED';
      else if (score < 80) status = 'YELLOW';

      return {
        regency: r.regency,
        total_villages: parseInt(r.total_villages, 10),
        average_score: score,
        status,
      };
    });

    // 3. Rekomendasi Prioritas Bantuan Dana 2027 (Grant Priorities)
    const priorityRes = await query<{
      id: string;
      name: string;
      regency: string;
      trust_score: string;
      category: string;
    }>(
      `SELECT id, name, regency, trust_score, category
       FROM tourist_villages
       ORDER BY trust_score DESC
       LIMIT 5`
    );

    const grantPriorities = priorityRes.rows.map((v) => ({
      village_id: v.id,
      name: v.name,
      regency: v.regency,
      category: v.category,
      trust_score: parseFloat(v.trust_score),
      recommendation:
        parseFloat(v.trust_score) >= 90
          ? 'PRIORITAS_UTAMA_HIBAH_2027'
          : 'DIPERTIMBANGKAN_HIBAH_2027',
    }));

    return NextResponse.json({
      success: true,
      data: {
        macro_metrics: {
          total_villages: totalVillages,
          lpj_compliance_rate: lpjComplianceRate,
          total_complaints: totalReports,
          resolved_complaints: resolvedReports,
          resolution_rate: resolutionRate,
          average_trust_score: avgTrustScore,
          total_allocated_sum: parseInt(grantStatRes.rows[0]?.total_allocated_sum || '0', 10),
          total_realized_sum: parseInt(grantStatRes.rows[0]?.total_realized_sum || '0', 10),
        },
        regency_status: regencyStatus,
        grant_priorities: grantPriorities,
      },
    });
  } catch (error: any) {
    console.error('[API /api/disporapar/overview error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data ringkasan Disporapar', details: error.message },
      { status: 500 }
    );
  }
}
