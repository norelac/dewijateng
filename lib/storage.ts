// ==============================================================================
// DEWI JATENG - Media & Document Storage Helper
// Hybrid storage: local filesystem (dev/VPS) + PostgreSQL BYTEA fallback (Vercel)
// ==============================================================================

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { query } from '@/lib/db';

export type StorageBucket =
  | 'official-documents'
  | 'report-photos-before'
  | 'proof-of-fix';

export const ALLOWED_BUCKETS = new Set<string>([
  'official-documents',
  'report-photos-before',
  'proof-of-fix',
]);

export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const BASE_UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);

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

let uploadedFilesTablePromise: Promise<void> | null = null;

async function ensureUploadedFilesTable(): Promise<void> {
  if (!uploadedFilesTablePromise) {
    uploadedFilesTablePromise = query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        bucket VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        size_bytes INTEGER NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (bucket, file_name)
      )
    `)
      .then(() => undefined)
      .catch(async (err) => {
        uploadedFilesTablePromise = null;
        try {
          await query(`SELECT 1 FROM uploaded_files LIMIT 0`);
          return;
        } catch {
          throw err;
        }
      });
  }
  return uploadedFilesTablePromise;
}

async function saveFileToDatabase(
  bucket: StorageBucket,
  fileName: string,
  contentType: string,
  buffer: Buffer
): Promise<void> {
  await ensureUploadedFilesTable();
  await query(
    `INSERT INTO uploaded_files (bucket, file_name, content_type, size_bytes, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (bucket, file_name) DO UPDATE SET
       content_type = EXCLUDED.content_type,
       size_bytes = EXCLUDED.size_bytes,
       data = EXCLUDED.data,
       created_at = NOW()`,
    [bucket, fileName, contentType, buffer.byteLength, buffer]
  );
}

/**
 * Menyimpan berkas buffer ke disk lokal (dev/VPS) atau ke tabel PostgreSQL `uploaded_files`
 * saat berjalan di filesystem serverless read-only (mis. Vercel /var/task).
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

  const rawBaseName =
    path
      .basename(fileName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'berkas';
  const sanitizedFileName = `${Date.now()}-${rawBaseName}${finalExt}`;
  const publicUrl = `/uploads/${bucket}/${sanitizedFileName}`;
  const contentType = UPLOAD_CONTENT_TYPES[finalExt] || 'application/octet-stream';

  if (IS_SERVERLESS) {
    await saveFileToDatabase(bucket, sanitizedFileName, contentType, finalBuffer);
    return { publicUrl, filePath: `db://uploaded_files/${bucket}/${sanitizedFileName}` };
  }

  const bucketDir = path.join(BASE_UPLOAD_DIR, bucket);
  const targetPath = path.join(bucketDir, sanitizedFileName);

  try {
    await fs.mkdir(bucketDir, { recursive: true });
    await fs.writeFile(targetPath, finalBuffer);
    return { publicUrl, filePath: targetPath };
  } catch (fsErr: any) {
    // Fallback otomatis ke PostgreSQL jika filesystem lokal ternyata read-only
    if (
      fsErr?.code === 'ENOENT' ||
      fsErr?.code === 'EROFS' ||
      fsErr?.code === 'EACCES' ||
      fsErr?.code === 'EPERM'
    ) {
      await saveFileToDatabase(bucket, sanitizedFileName, contentType, finalBuffer);
      return { publicUrl, filePath: `db://uploaded_files/${bucket}/${sanitizedFileName}` };
    }
    throw fsErr;
  }
}

/**
 * Membaca berkas dari disk lokal atau fallback tabel PostgreSQL `uploaded_files`.
 */
export async function readStoredFile(
  bucket: StorageBucket,
  fileName: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const ext = path.extname(fileName).toLowerCase();
  const fallbackContentType = UPLOAD_CONTENT_TYPES[ext] || 'application/octet-stream';

  const bucketDir = path.resolve(BASE_UPLOAD_DIR, bucket);
  const targetPath = path.resolve(bucketDir, fileName);

  if (targetPath.startsWith(bucketDir + path.sep)) {
    try {
      const buffer = await fs.readFile(targetPath);
      return { buffer, contentType: fallbackContentType };
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  try {
    const res = await query<{ data: Buffer; content_type: string }>(
      `SELECT data, content_type
       FROM uploaded_files
       WHERE bucket = $1 AND file_name = $2
       LIMIT 1`,
      [bucket, fileName]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      buffer: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data),
      contentType: row.content_type || fallbackContentType,
    };
  } catch (dbErr: any) {
    // Jika tabel belum pernah dibuat (belum ada upload serverless), berkas memang belum ada
    if (dbErr?.code === '42P01') {
      return null;
    }
    throw dbErr;
  }
}

/**
 * Membaca berkas dari disk lokal / DB storage
 */
export async function readFileFromStorage(
  bucket: StorageBucket,
  fileName: string
): Promise<Buffer> {
  const stored = await readStoredFile(bucket, fileName);
  if (!stored) {
    const err = new Error(`ENOENT: berkas ${bucket}/${fileName} tidak ditemukan`) as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    throw err;
  }
  return stored.buffer;
}
