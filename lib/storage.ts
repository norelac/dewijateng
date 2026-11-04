// ==============================================================================
// DEWI JATENG - Local Media & Document Storage Helper
// Pure Next.js / Node.js filesystem storage (Replaces Supabase Storage)
// ==============================================================================

import fs from 'fs/promises';
import path from 'path';

export type StorageBucket =
  | 'official-documents'
  | 'report-photos-before'
  | 'proof-of-fix';

const BASE_UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

/**
 * Menyimpan berkas buffer ke disk lokal di bawah public/uploads/<bucket>/
 * Mengembalikan URL publik yang dapat diakses browser: /uploads/<bucket>/<filename>
 */
export async function saveFileToStorage(
  bucket: StorageBucket,
  fileName: string,
  buffer: Buffer
): Promise<{ publicUrl: string; filePath: string }> {
  const bucketDir = path.join(BASE_UPLOAD_DIR, bucket);
  await fs.mkdir(bucketDir, { recursive: true });

  const sanitizedFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const targetPath = path.join(bucketDir, sanitizedFileName);

  await fs.writeFile(targetPath, buffer);

  const publicUrl = `/uploads/${bucket}/${sanitizedFileName}`;
  return { publicUrl, filePath: targetPath };
}

/**
 * Membaca berkas dari disk lokal
 */
export async function readFileFromStorage(
  bucket: StorageBucket,
  fileName: string
): Promise<Buffer> {
  const filePath = path.join(BASE_UPLOAD_DIR, bucket, fileName);
  return await fs.readFile(filePath);
}
