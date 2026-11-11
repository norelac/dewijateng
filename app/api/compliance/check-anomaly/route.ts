import { NextRequest, NextResponse } from 'next/server';
import {
  checkExpenseAnomalies,
  type AnomalyCheckItem,
} from '@/lib/services/priceAnomalyChecker';

const MAX_ITEMS_PER_REQUEST = 100;

/**
 * GET /api/compliance/check-anomaly
 * Dokumentasi endpoint audit anomali harga SSH Jateng
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/compliance/check-anomaly',
    description:
      'Mengevaluasi pos belanja LPJ terhadap acuan Standar Satuan Harga (SSH) Pemprov Jateng. ' +
      'Mendeteksi potensi penggelembungan harga (mark-up) dengan ambang batas toleransi +40%.',
    request_body: {
      items: [
        {
          activity_name: '(wajib) Nama pos belanja / material, misal: Semen PC Portland',
          claimed_unit_price: '(wajib) Harga satuan klaim dalam Rupiah',
          category: '(opsional) Kategori: MATERIAL_FISIK | UPAH_TENAGA | KESELAMATAN_K3 | OPERASIONAL',
          volume: '(opsional) Jumlah/volume barang, default 1',
          unit: '(opsional) Satuan barang, misal: Sak, M3, Batang',
          regency: '(opsional) Kabupaten/Kota untuk pencocokan spesifik wilayah',
        },
      ],
    },
    threshold: 'Deviasi > +40% dari standar SSH = anomali (ai_anomaly_flag: true)',
    max_items_per_request: MAX_ITEMS_PER_REQUEST,
  });
}

/**
 * POST /api/compliance/check-anomaly
 * Mengevaluasi pos belanja LPJ terhadap acuan Standar Satuan Harga (SSH) Pemprov Jateng
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items;

    // Validasi: harus array dan tidak kosong
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar pos belanja kosong atau tidak valid. Kirim { "items": [...] }' },
        { status: 400 }
      );
    }

    // Validasi: batas maksimum item per request untuk menjaga performa < 500ms
    if (items.length > MAX_ITEMS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Jumlah pos belanja melebihi batas maksimum ${MAX_ITEMS_PER_REQUEST} item per permintaan`,
        },
        { status: 400 }
      );
    }

    // Validasi: setiap item wajib punya activity_name dan claimed_unit_price yang valid
    const validationErrors: string[] = [];
    const validatedItems: AnomalyCheckItem[] = items.map((item: any, idx: number) => {
      const activityName = (item.activity_name || '').trim();
      const claimedPrice = Number(item.claimed_unit_price);

      if (!activityName) {
        validationErrors.push(`Item #${idx + 1}: activity_name wajib diisi`);
      }
      if (!claimedPrice || claimedPrice <= 0) {
        validationErrors.push(`Item #${idx + 1}: claimed_unit_price harus bernilai positif`);
      }

      return {
        activity_name: activityName,
        category: item.category || undefined,
        volume: item.volume || undefined,
        unit: item.unit || undefined,
        claimed_unit_price: claimedPrice,
        amount_realized: item.amount_realized || undefined,
        regency: item.regency || undefined,
      };
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validasi gagal', details: validationErrors },
        { status: 422 }
      );
    }

    const auditResult = await checkExpenseAnomalies(validatedItems);

    return NextResponse.json({
      success: true,
      data: auditResult,
    });
  } catch (error: any) {
    console.error('[API /api/compliance/check-anomaly error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengevaluasi anomali harga' },
      { status: 500 }
    );
  }
}
