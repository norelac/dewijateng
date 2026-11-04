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
  const salt = process.env.REPORTER_HASH_SALT || 'dewi-jateng-secret-salt-2026';
  return crypto.createHash('sha256').update(`${cleanPhone}:${salt}`).digest('hex');
}
