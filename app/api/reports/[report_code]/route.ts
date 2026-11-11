// ==============================================================================
// DEWI JATENG - Public REST API: /api/reports/[report_code]
// Mengambil detail satu laporan aduan masyarakat berdasarkan kode tiket unik
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getReportByCode, markReportInProgress } from '@/lib/services/reportService';
import { getSession } from '@/lib/auth';

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

/**
 * PATCH /api/reports/[report_code]
 * Mengubah status tiket aduan menjadi IN_PROGRESS ketika pengelola mulai menangani kerusakan
 */
export async function PATCH(
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

    const body = await req.json().catch(() => ({}));
    const newStatus = (body.status || '').toUpperCase().trim();

    if (newStatus !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          success: false,
          error: "Status tidak didukung via PATCH. Hanya status 'IN_PROGRESS' yang didukung (gunakan /resolve untuk penutupan tiket dengan bukti).",
        },
        { status: 400 }
      );
    }

    const updated = await markReportInProgress(reportCode);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: `Laporan ${reportCode} tidak dapat diubah menjadi IN_PROGRESS (tidak ditemukan atau status saat ini bukan SUBMITTED)`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status laporan ${reportCode} berhasil diperbarui menjadi IN_PROGRESS`,
      data: { report_code: reportCode, status: 'IN_PROGRESS' },
    });
  } catch (error: any) {
    console.error('[API PATCH /api/reports/[report_code] error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui status laporan aduan',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
