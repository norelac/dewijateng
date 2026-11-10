// ==============================================================================
// DEWI JATENG - Local Media & Document Storage Helper
// Pure Next.js / Node.js filesystem storage (Replaces Supabase Storage)
// ==============================================================================

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export type StorageBucket =
  | 'official-documents'
  | 'report-photos-before'
  | 'proof-of-fix';

const BASE_UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

const ALLOWED_EXTENSIONS: Record<StorageBucket, string[]> = {
  'official-documents': ['.pdf'],
  'report-photos-before': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  'proof-of-fix': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
};

const MAX_FILE_SIZES: Record<StorageBucket, number> = {
  'official-documents': 25 * 1024 * 1024, // 25 MB
  'report-photos-before': 15 * 1024 * 1024, // 15 MB
  'proof-of-fix': 15 * 1024 * 1024, // 15 MB
};

/**
 * Menyimpan berkas buffer ke disk lokal di bawah public/uploads/<bucket>/
 * Memvalidasi whitelist ekstensi dan batas maksimum ukuran berkas di tingkat service layer.
 * Mengembalikan URL publik yang dapat diakses browser: /uploads/<bucket>/<filename>
 */
export async function saveFileToStorage(
  bucket: StorageBucket,
  fileName: string,
  buffer: Buffer
): Promise<{ publicUrl: string; filePath: string }> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Berkas kosong tidak dapat disimpan');
  }

  const ext = path.extname(fileName).toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[bucket] || [];

  if (!allowed.includes(ext)) {
    throw new Error(
      `Format berkas ${ext || '(tanpa ekstensi)'} tidak diizinkan untuk kategori ${bucket}. Diizinkan: ${allowed.join(', ')}`
    );
  }

  const maxSize = MAX_FILE_SIZES[bucket] || 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error(
      `Ukuran berkas melampaui batas maksimum ${maxSize / (1024 * 1024)}MB`
    );
  }

  const bucketDir = path.join(BASE_UPLOAD_DIR, bucket);
  await fs.mkdir(bucketDir, { recursive: true });

  let finalBuffer = buffer;
  let finalExt = ext;

  // Auto-convert & compress ke format WebP untuk seluruh foto aduan & bukti lapangan
  if (bucket === 'report-photos-before' || bucket === 'proof-of-fix') {
    try {
      finalBuffer = await sharp(buffer)
        .rotate() // Auto-orient berdasarkan EXIF kamera HP
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      finalExt = '.webp';
    } catch (sharpErr) {
      console.warn('[saveFileToStorage] Warning auto-convert WebP via sharp, fallback ke format asli:', sharpErr);
    }
  }

  const rawBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedFileName = `${Date.now()}-${rawBaseName}${finalExt}`;
  const targetPath = path.join(bucketDir, sanitizedFileName);

  await fs.writeFile(targetPath, finalBuffer);

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
