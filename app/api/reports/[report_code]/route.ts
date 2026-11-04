import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/reports/[report_code]
 * Mengambil detail laporan aduan berdasarkan kode tiket unik (case-insensitive)
 * Menggabungkan relasi ke tourist_villages dan report_resolutions (Proof-of-Fix)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { report_code: string } }
) {
  try {
    const reportCode = params.report_code.toUpperCase().trim();

    const sqlText = `
      SELECT
        r.id,
        r.report_code,
        r.village_id,
        v.name as village_name,
        v.regency as village_regency,
        v.district as village_district,
        v.pokdarwis_name,
        v.contact_phone,
        v.trust_score,
        r.category,
        r.title,
        r.description,
        r.photo_before_url,
        r.latitude,
        r.longitude,
        r.is_anonymous,
        r.status,
        r.created_at,
        r.updated_at,
        res.id as resolution_id,
        res.action_summary,
        res.photo_after_url,
        res.officer_name,
        res.exif_timestamp_verified,
        res.exif_photo_date,
        res.resolved_at
      FROM incident_reports r
      LEFT JOIN tourist_villages v ON r.village_id = v.id
      LEFT JOIN report_resolutions res ON r.id = res.report_id
      WHERE UPPER(r.report_code) = $1
      LIMIT 1
    `;

    const result = await query(sqlText, [reportCode]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Laporan dengan kode ${reportCode} tidak ditemukan`,
        },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    const data = {
      id: row.id,
      report_code: row.report_code,
      village: {
        id: row.village_id,
        name: row.village_name,
        regency: row.village_regency,
        district: row.village_district,
        pokdarwis_name: row.pokdarwis_name,
        contact_phone: row.contact_phone,
        trust_score: parseFloat(row.trust_score || '0'),
      },
      category: row.category,
      title: row.title,
      description: row.description,
      photo_before_url: row.photo_before_url,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      is_anonymous: row.is_anonymous,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      resolution: row.resolution_id
        ? {
            action_summary: row.action_summary,
            photo_after_url: row.photo_after_url,
            officer_name: row.officer_name,
            exif_timestamp_verified: row.exif_timestamp_verified,
            exif_photo_date: row.exif_photo_date,
            resolved_at: row.resolved_at,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API /api/reports/[report_code] error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail laporan', details: error.message },
      { status: 500 }
    );
  }
}
