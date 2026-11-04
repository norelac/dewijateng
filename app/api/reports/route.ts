// ==============================================================================
// DEWI JATENG - Public REST API: /api/reports
// Open Government Data API untuk pelaporan aduan masyarakat
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  createIncidentReport,
  listPublicReports,
} from '@/lib/services/reportService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports
 * Mengambil daftar aduan publik terbaru (Open Data Format)
 * Query Params: ?status=SUBMITTED|IN_PROGRESS|RESOLVED & village_id=uuid & limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const villageId = searchParams.get('village_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const reports = await listPublicReports({
      status,
      villageId,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error: any) {
    console.error('[API /api/reports GET error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data laporan aduan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Menerima pengiriman laporan aduan masyarakat melalui REST API (Multipart Form Data)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = (formData.get('title') as string) || '';
    const category = (formData.get('category') as string) || 'FASILITAS_RUSAK';
    const description = (formData.get('description') as string) || '';
    const villageId = (formData.get('village_id') as string) || undefined;
    const rawLat = formData.get('latitude') as string;
    const rawLng = formData.get('longitude') as string;
    const isAnonymous = formData.get('is_anonymous') === 'true';
    const reporterPhone = (formData.get('reporter_phone') as string) || undefined;
    const photo = formData.get('photo') as File | null;

    let photoBuffer: Buffer | undefined;
    let photoName: string | undefined;

    if (photo && photo.size > 0 && typeof photo.arrayBuffer === 'function') {
      const arrayBuffer = await photo.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
      photoName = photo.name;
    }

    const latitude = parseFloat(rawLat || '-6.9932');
    const longitude = parseFloat(rawLng || '110.4203');

    const result = await createIncidentReport({
      villageId,
      category,
      title,
      description,
      photoBuffer,
      photoName,
      latitude: isNaN(latitude) ? -6.9932 : latitude,
      longitude: isNaN(longitude) ? 110.4203 : longitude,
      isAnonymous,
      reporterPhone,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Laporan aduan berhasil didaftarkan ke sistem DEWI JATENG',
        data: {
          id: result.id,
          report_code: result.reportCode,
          status: result.status,
          village_id: result.villageId,
          tracking_url: result.trackingUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/reports POST error]:', error);
    const isValidationError =
      error.message?.includes('minimal') || error.message?.includes('valid');

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal mendaftarkan laporan aduan',
      },
      { status: isValidationError ? 422 : 500 }
    );
  }
}
