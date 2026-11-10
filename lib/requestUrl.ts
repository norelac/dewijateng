import { headers } from 'next/headers';

/**
 * Base URL untuk tautan di email (verifikasi / reset / undangan).
 * Prioritas: env APP_URL, lalu header request.
 */
export async function getRequestBaseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');

  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto =
    h.get('x-forwarded-proto') ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
}
