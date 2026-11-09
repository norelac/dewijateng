import crypto from 'crypto';

/**
 * DEWI JATENG - Privacy Hasher Helper
 * Mengenkripsi nomor telepon/WhatsApp pelapor secara searah (one-way SHA-256)
 * untuk melindungi privasi warga jika memilih opsi pelaporan anonim.
 */
export function hashReporterPhone(phone: string): string {
  if (!phone || !phone.trim()) {
    return '';
  }
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const salt = process.env.REPORTER_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('REPORTER_HASH_SALT wajib diatur di environment production');
    }
    // ponytail: salt dev-only; hapus setelah REPORTER_HASH_SALT diisi di .env.local
    return crypto.createHash('sha256').update(`${cleanPhone}:dewi-jateng-dev-salt`).digest('hex');
  }
  return crypto.createHash('sha256').update(`${cleanPhone}:${salt}`).digest('hex');
}
