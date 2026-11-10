import { NextResponse } from 'next/server';
import { getLpjDocumentData } from '@/lib/services/lpjService';
import { renderLpjPdf } from '@/lib/services/lpjDocumentPdf';

export const dynamic = 'force-dynamic';

/**
 * GET /documents/lpj-<slug-desa>-<tahun>.pdf
 *
 * Menyajikan dokumen LPJ desa wisata sebagai PDF. Isi berkas dirender dari data
 * `village_grants` + `grant_expenses`, jadi selalu sinkron dengan basis data dan
 * tidak perlu menyimpan ratusan berkas statis.
 *
 * ponytail: kalau pengelola desa mengunggah PDF asli, `lpj_document_url` akan
 * menunjuk `/uploads/official-documents/...` dan route ini tidak terpakai lagi.
 */

const FILE_PATTERN = /^lpj-(.+)-(\d{4})\.pdf$/;

export async function GET(
  _req: Request,
  { params }: { params: { file: string } }
) {
  const file = decodeURIComponent(params.file || '');
  const match = FILE_PATTERN.exec(file);

  if (!match) {
    return NextResponse.json(
      { success: false, error: 'Nama berkas LPJ tidak dikenali' },
      { status: 404 }
    );
  }

  const [, slug, year] = match;
  const fiscalYear = parseInt(year, 10);

  try {
    const data = await getLpjDocumentData(slug, fiscalYear);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Dokumen LPJ tidak ditemukan untuk desa dan tahun tersebut' },
        { status: 404 }
      );
    }

    const pdf = await renderLpjPdf(data);
    const body = new Blob([pdf], { type: 'application/pdf' });

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${file}"`,
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[GET /documents/[file] error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyiapkan dokumen LPJ' },
      { status: 500 }
    );
  }
}
