import { NextRequest, NextResponse } from 'next/server';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';

/**
 * POST /api/compliance/trust-score
 * Memicu rekalkulasi Trust Score sebuah desa wisata secara deterministik 50/50
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const villageId = body.village_id;

    if (!villageId) {
      return NextResponse.json(
        { success: false, error: 'village_id wajib disertakan' },
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
      { success: false, error: 'Gagal merehitung Trust Score', details: error.message },
      { status: 500 }
    );
  }
}
