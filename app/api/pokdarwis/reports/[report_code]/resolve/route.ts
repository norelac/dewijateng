import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getReportByCode } from '@/lib/services/reportService';
import { resolveIncidentReport } from '@/lib/services/resolutionService';

/**
 * POST /api/pokdarwis/reports/[report_code]/resolve
 * Endpoint untuk menyelesaikan laporan aduan fasilitas
 * dengan bukti foto fisik (Proof-of-Fix) dan validasi EXIF timestamp.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { report_code: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda harus masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const reportCode = params.report_code?.toUpperCase()?.trim();
    if (!reportCode) {
      return NextResponse.json(
        { success: false, error: 'Kode tiket laporan wajib disertakan' },
        { status: 400 }
      );
    }

    const existing = await getReportByCode(reportCode);
    if (existing && session.role === 'desa' && existing.villageId !== session.villageId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda hanya dapat menyelesaikan aduan desa Anda sendiri.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const actionSummary =
      (formData.get('action_summary') as string) ||
      (formData.get('actionSummary') as string) ||
      '';
    const officerName =
      (formData.get('officer_name') as string) ||
      (formData.get('officerName') as string) ||
      '';
    const photoAfter =
      (formData.get('photo_after') as File | null) ||
      (formData.get('photo') as File | null);

    let photoBuffer: Buffer | undefined;
    let photoName: string | undefined;

    if (photoAfter && photoAfter.size > 0 && typeof photoAfter.arrayBuffer === 'function') {
      const arrayBuffer = await photoAfter.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
      photoName = photoAfter.name;
    }

    const result = await resolveIncidentReport({
      reportCode,
      photoBuffer,
      photoName,
      actionSummary,
      officerName,
      actorVillageId: session.role === 'desa' ? session.villageId : null,
    });

    return NextResponse.json({
      success: true,
      message: `Aduan ${reportCode} berhasil dinyatakan selesai dengan bukti perbaikan valid`,
      data: {
        report_code: result.reportCode,
        status: result.status,
        photo_after_url: result.photoAfterUrl,
        exif_verified: result.exifVerified,
        exif_date: result.exifPhotoDate,
        updated_trust_score: result.updatedTrustScore,
      },
    });
  } catch (error: any) {
    console.error('[API /api/pokdarwis/reports/resolve error]:', error);
    const message = error.message || '';
    const statusCode = message.includes('tidak ditemukan')
      ? 404
      : message.includes('wajib') || message.includes('minimal') || message.includes('terdeteksi')
      ? 422
      : 500;
    const safeMessage =
      statusCode === 404
        ? 'Laporan tidak ditemukan'
        : statusCode === 422
        ? message
        : 'Gagal menyelesaikan aduan';

    return NextResponse.json(
      { success: false, error: safeMessage },
      { status: statusCode }
    );
  }
}
