import { NextRequest, NextResponse } from 'next/server';
import { matchAndCheckSSH } from '@/lib/services/priceAnomalyChecker';

/**
 * POST /api/compliance/check-anomaly
 * Mengevaluasi pos belanja LPJ terhadap acuan Standar Satuan Harga (SSH) Pemprov Jateng
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar pos belanja kosong atau tidak valid' },
        { status: 400 }
      );
    }

    const auditedItems = await Promise.all(
      items.map(async (item: any) => {
        const evaluation = await matchAndCheckSSH(
          item.activity_name || '',
          item.claimed_unit_price || 0,
          item.regency
        );

        return {
          activity_name: item.activity_name,
          category: item.category,
          volume: item.volume,
          unit: item.unit,
          claimed_unit_price: item.claimed_unit_price,
          amount_realized: (item.claimed_unit_price || 0) * (item.volume || 1),
          ssh_standard_price: evaluation.standardPrice,
          deviation_pct: evaluation.deviationPct,
          ai_anomaly_flag: evaluation.isAnomaly,
          anomaly_note: evaluation.note,
        };
      })
    );

    const totalAnomalies = auditedItems.filter((i) => i.ai_anomaly_flag).length;

    return NextResponse.json({
      success: true,
      data: {
        total_items: auditedItems.length,
        anomalies_detected: totalAnomalies,
        items: auditedItems,
      },
    });
  } catch (error: any) {
    console.error('[API /api/compliance/check-anomaly error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengevaluasi anomali harga', details: error.message },
      { status: 500 }
    );
  }
}
