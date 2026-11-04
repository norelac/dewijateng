import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { validatePhotoExif } from '@/lib/services/exifValidator';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';

/**
 * POST /api/pokdarwis/reports/[report_code]/resolve
 * Menyelesaikan laporan aduan fasilitas dengan bukti foto fisik (Proof-of-Fix)
 * Memvalidasi metadata EXIF timestamp foto perbaikan
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { report_code: string } }
) {
  try {
    const reportCode = params.report_code.toUpperCase().trim();

    // 1. Ambil data laporan
    const reportRes = await query<{
      id: string;
      village_id: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, village_id, status, created_at
       FROM incident_reports
       WHERE UPPER(report_code) = $1
       LIMIT 1`,
      [reportCode]
    );

    if (reportRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Laporan ${reportCode} tidak ditemukan` },
        { status: 404 }
      );
    }

    const report = reportRes.rows[0];

    // 2. Baca FormData
    const formData = await req.formData();
    const actionSummary = (formData.get('action_summary') as string) || '';
    const officerName = (formData.get('officer_name') as string) || '';
    const photoAfter = formData.get('photo_after') as File | null;

    if (!photoAfter || photoAfter.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Foto bukti fisik perbaikan (Proof-of-Fix) wajib dilampirkan',
        },
        { status: 422 }
      );
    }

    if (!actionSummary.trim() || actionSummary.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ringkasan tindakan teknis minimal 10 karakter',
        },
        { status: 422 }
      );
    }

    if (!officerName.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama petugas / teknisi pelaksana wajib dicantumkan',
        },
        { status: 422 }
      );
    }

    // 3. Konversi file ke buffer & validasi EXIF
    const arrayBuffer = await photoAfter.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const reportCreatedAt = new Date(report.created_at);

    const exifResult = await validatePhotoExif(buffer, reportCreatedAt);

    // Jika EXIF terbukti diambil sebelum laporan masuk (indikasi rekayasa arsip lama)
    if (exifResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: exifResult.error,
          details: {
            report_created_at: reportCreatedAt.toISOString(),
            photo_exif_date: exifResult.photoDate?.toISOString(),
          },
        },
        { status: 422 }
      );
    }

    // 4. Simpan foto ke disk local storage (bucket proof-of-fix)
    const savedFile = await saveFileToStorage('proof-of-fix', photoAfter.name, buffer);

    // 5. Simpan ke report_resolutions (UPSERT / ON CONFLICT)
    await query(
      `INSERT INTO report_resolutions (
         report_id,
         action_summary,
         photo_after_url,
         officer_name,
         exif_timestamp_verified,
         exif_photo_date,
         resolved_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (report_id) DO UPDATE SET
         action_summary = EXCLUDED.action_summary,
         photo_after_url = EXCLUDED.photo_after_url,
         officer_name = EXCLUDED.officer_name,
         exif_timestamp_verified = EXCLUDED.exif_timestamp_verified,
         exif_photo_date = EXCLUDED.exif_photo_date,
         resolved_at = NOW()`,
      [
        report.id,
        actionSummary,
        savedFile.publicUrl,
        officerName,
        exifResult.verified,
        exifResult.photoDate,
      ]
    );

    // 6. Update status incident_reports menjadi RESOLVED
    await query(
      `UPDATE incident_reports
       SET status = 'RESOLVED', updated_at = NOW()
       WHERE id = $1`,
      [report.id]
    );

    // 7. Rekalkulasi Trust Score desa
    const trustScoreResult = await calculateVillageTrustScore(report.village_id);

    return NextResponse.json({
      success: true,
      message: `Aduan ${reportCode} berhasil dinyatakan selesai dengan bukti perbaikan valid`,
      data: {
        report_code: reportCode,
        status: 'RESOLVED',
        photo_after_url: savedFile.publicUrl,
        exif_verified: exifResult.verified,
        exif_date: exifResult.photoDate,
        updated_trust_score: trustScoreResult.trustScore,
      },
    });
  } catch (error: any) {
    console.error('[API /api/pokdarwis/reports/resolve error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyelesaikan aduan', details: error.message },
      { status: 500 }
    );
  }
}
