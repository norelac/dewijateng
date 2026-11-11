import { NextResponse } from 'next/server';
import { getLpjDocumentData } from '@/lib/services/lpjService';
import { renderLpjPdf } from '@/lib/services/lpjDocumentPdf';
import { getTransactionByReference } from '@/lib/services/financeService';
import { renderBuktiPdf } from '@/lib/services/financeDocumentPdf';
import { getExpenseEvidence, renderNotaSvg } from '@/lib/services/evidenceService';

export const dynamic = 'force-dynamic';

/**
 * GET /documents/lpj-<slug-desa>-<tahun>.pdf      -> dokumen LPJ desa wisata
 * GET /documents/bukti-<kode-referensi>.pdf       -> bukti transaksi keuangan desa
 * GET /documents/nota-<uuid-pos-belanja>.svg      -> nota kuitansi pos belanja
 *
 * Semua berkas dirender dari basis data (tidak ada ratusan berkas statis), jadi
 * isinya selalu sinkron. `?unduh=1` memaksa unduhan, tanpa parameter langsung
 * tampil di peramban.
 *
 * ponytail: kalau pengelola desa mengunggah PDF/dokumen asli, arahkan URL-nya ke
 * `/uploads/official-documents/...` dan route ini tidak terpakai lagi.
 */

const LPJ_PATTERN = /^lpj-(.+)-(\d{4})\.pdf$/;
const BUKTI_PATTERN = /^bukti-([A-Za-z]{2}-\d{4}-\d{4})\.pdf$/;
const NOTA_PATTERN = /^nota-([0-9a-f-]{36})\.svg$/i;

function pdfResponse(
  bytes: Uint8Array<ArrayBuffer>,
  filename: string,
  unduh: boolean
): NextResponse {
  const body = new Blob([bytes], { type: 'application/pdf' });
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${unduh ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { file: string } }
) {
  const file = decodeURIComponent(params.file || '');
  const unduh = new URL(request.url).searchParams.get('unduh') === '1';

  try {
    const lpjMatch = LPJ_PATTERN.exec(file);
    if (lpjMatch) {
      const [, slug, year] = lpjMatch;
      const data = await getLpjDocumentData(slug, parseInt(year, 10));
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Dokumen LPJ tidak ditemukan untuk desa dan tahun tersebut' },
          { status: 404 }
        );
      }
      return pdfResponse(await renderLpjPdf(data), file, unduh);
    }

    const buktiMatch = BUKTI_PATTERN.exec(file);
    if (buktiMatch) {
      const transaction = await getTransactionByReference(buktiMatch[1].toUpperCase());
      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'Bukti transaksi tidak ditemukan' },
          { status: 404 }
        );
      }
      return pdfResponse(await renderBuktiPdf(transaction), file, unduh);
    }

    const notaMatch = NOTA_PATTERN.exec(file);
    if (notaMatch) {
      const evidence = await getExpenseEvidence(notaMatch[1]);
      if (!evidence) {
        return NextResponse.json(
          { success: false, error: 'Nota belanja tidak ditemukan' },
          { status: 404 }
        );
      }
      return new NextResponse(renderNotaSvg(evidence), {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Disposition': `${unduh ? 'attachment' : 'inline'}; filename="${file}"`,
          'Cache-Control': 'public, max-age=300, must-revalidate',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Nama berkas dokumen tidak dikenali' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[GET /documents/[file] error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyiapkan dokumen' },
      { status: 500 }
    );
  }
}
