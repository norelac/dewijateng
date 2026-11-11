import { NextRequest, NextResponse } from 'next/server';
import { saveLpjSubmission } from '@/lib/services/lpjService';
import { getSession } from '@/lib/auth';

/**
 * POST /api/balai-desa/lpj/upload
 * REST API Endpoint untuk menerima berkas PDF resmi LPJ
 * bantuan sarpras, mengekstrak pos belanja, mengaudit terhadap katalog SSH Jateng,
 * dan merefresh Trust Score desa wisata. Dilindungi autentikasi sesi per desa / dinas.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Sesi tidak ditemukan. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      );
    }
    const formData = await req.formData();
    const villageId =
      (formData.get('village_id') as string) ||
      (formData.get('villageId') as string) ||
      '';
    const fiscalYear = parseInt(
      (formData.get('fiscal_year') as string) ||
        (formData.get('fiscalYear') as string) ||
        '2026',
      10
    );
    const fundingSource =
      (formData.get('funding_source') as string) ||
      (formData.get('fundingSource') as string) ||
      '';
    const totalAllocated = parseInt(
      (formData.get('total_allocated') as string) ||
        (formData.get('totalAllocated') as string) ||
        '100000000',
      10
    );
    const file = formData.get('file') as File | null;

    if (!villageId) {
      return NextResponse.json(
        { success: false, error: 'village_id wajib disertakan' },
        { status: 422 }
      );
    }

    if (session.role === 'desa' && session.villageId !== villageId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda hanya dapat mengunggah LPJ untuk desa Anda sendiri.' },
        { status: 403 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Berkas dokumen PDF LPJ resmi wajib dilampirkan' },
        { status: 422 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas PDF melebihi batas 25 MB' },
        { status: 413 }
      );
    }

    let itemsOverride: any[] | undefined;
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const result = await saveLpjSubmission({
      villageId,
      fiscalYear,
      fundingSource,
      totalAllocated,
      pdfBuffer,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Dokumen LPJ berhasil diunggah dan pos belanja modal berhasil diekstrak',
      data: {
        grant_id: result.grantId,
        village_id: result.villageId,
        village_name: result.villageName,
        lpj_document_url: result.lpjDocumentUrl,
        total_allocated: result.totalAllocated,
        total_realized: result.totalRealized,
        remaining_balance: result.remainingBalance,
        total_expenses: result.expensesCount,
        anomalies_detected: result.anomaliesCount,
        updated_trust_score: result.updatedTrustScore,
        expenses: result.expenses,
      },
    });
  } catch (error: any) {
    console.error('[API /api/balai-desa/lpj/upload error]:', error);
    const message = error.message || '';
    const statusCode = message.includes('tidak terdaftar')
      ? 404
      : message.includes('wajib') || message.includes('bukan format')
      ? 422
      : 500;
    const safeMessage =
      statusCode === 404
        ? 'Desa wisata tidak terdaftar'
        : statusCode === 422
        ? message
        : 'Gagal mengunggah dan mengekstrak dokumen LPJ';

    return NextResponse.json(
      { success: false, error: safeMessage },
      { status: statusCode }
    );
  }
}
