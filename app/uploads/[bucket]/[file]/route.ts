import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import {
  ALLOWED_BUCKETS,
  UPLOAD_CONTENT_TYPES,
  readStoredFile,
  type StorageBucket,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { bucket: string; file: string } }
) {
  const bucket = params.bucket || '';
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ success: false, error: 'Bucket tidak valid' }, { status: 404 });
  }

  let fileName: string;
  try {
    fileName = decodeURIComponent(params.file || '');
  } catch {
    return NextResponse.json({ success: false, error: 'Nama berkas tidak valid' }, { status: 400 });
  }

  if (
    !fileName ||
    fileName !== path.basename(fileName) ||
    fileName.includes('..') ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    /[\x00-\x1f]/.test(fileName)
  ) {
    return NextResponse.json({ success: false, error: 'Nama berkas tidak valid' }, { status: 400 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const expectedType = UPLOAD_CONTENT_TYPES[ext];
  if (!expectedType) {
    return NextResponse.json({ success: false, error: 'Format berkas tidak didukung' }, { status: 404 });
  }

  try {
    const stored = await readStoredFile(bucket as StorageBucket, fileName);
    if (!stored) {
      return NextResponse.json({ success: false, error: 'Berkas tidak ditemukan' }, { status: 404 });
    }

    const safeFileName = fileName.replace(/"/g, '');
    return new NextResponse(new Uint8Array(stored.buffer), {
      status: 200,
      headers: {
        'Content-Type': stored.contentType || expectedType,
        'Content-Length': String(stored.buffer.byteLength),
        'Content-Disposition': `inline; filename="${safeFileName}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[GET /uploads/[bucket]/[file] error]:', err);
    return NextResponse.json({ success: false, error: 'Gagal membaca berkas' }, { status: 500 });
  }
}
