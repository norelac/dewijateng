// ==============================================================================
// DEWI JATENG - Public REST API: /api/reports/[report_code]
// Mengambil detail satu laporan aduan masyarakat berdasarkan kode tiket unik
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getReportByCode } from '@/lib/services/reportService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { report_code: string } }
) {
  try {
    const reportCode = params.report_code?.toUpperCase()?.trim();

    if (!reportCode) {
      return NextResponse.json(
        { success: false, error: 'Kode tiket laporan wajib disertakan' },
        { status: 400 }
      );
    }

    const report = await getReportByCode(reportCode);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: `Laporan dengan kode ${reportCode} tidak ditemukan`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[API /api/reports/[report_code] error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil detail laporan aduan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
