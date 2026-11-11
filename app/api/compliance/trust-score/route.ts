import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  calculateVillageTrustScore,
  recalculateAllVillages,
} from '@/lib/services/trustScoreCalculator';

/**
 * GET /api/compliance/trust-score
 * Dokumentasi endpoint rekalkulasi Trust Score
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/compliance/trust-score',
    description:
      'Memicu rekalkulasi Trust Score sebuah desa wisata secara deterministik 50/50. ' +
      'Formula: Trust Score = (0.50 * S_LPJ) + (0.50 * S_Aduan). ' +
      'S_LPJ = kepatuhan unggah LPJ bantuan. S_Aduan = rasio aduan RESOLVED.',
    request_body: {
      village_id: '(wajib jika bukan batch) UUID desa wisata yang akan direkalkulasi',
      batch: '(opsional) boolean, true = rekalkulasi seluruh desa sekaligus',
    },
    classification: {
      GREEN: 'Skor >= 80.00 (Patuh)',
      YELLOW: 'Skor 60.00 - 79.99 (Perhatian)',
      RED: 'Skor < 60.00 (Kritis)',
    },
  });
}

/**
 * POST /api/compliance/trust-score
 * Memicu rekalkulasi Trust Score sebuah desa wisata atau seluruh desa (batch mode)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak ditemukan. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }
    if (session.role !== 'disbudparekraf') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: hanya Disbudparekraf yang dapat memicu rekalkulasi Trust Score.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Batch mode: rekalkulasi seluruh desa wisata (hanya Disbudparekraf)
    if (body.batch === true) {
      const result = await recalculateAllVillages();
      return NextResponse.json({
        success: true,
        message: `Trust score ${result.updated} desa wisata berhasil direkalkulasi dalam ${result.duration_ms}ms`,
        data: result,
      });
    }

    // Single village mode
    const villageId = body.village_id;

    if (!villageId) {
      return NextResponse.json(
        { success: false, error: 'village_id wajib disertakan, atau kirim { "batch": true } untuk rekalkulasi massal' },
        { status: 400 }
      );
    }

    const result = await calculateVillageTrustScore(villageId);

    return NextResponse.json({
      success: true,
      message: 'Trust score berhasil direkalkulasi',
      data: result,
    });
  } catch (error: any) {
    console.error('[API /api/compliance/trust-score error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal merehitung Trust Score' },
      { status: 500 }
    );
  }
}
