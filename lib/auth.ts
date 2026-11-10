// ==============================================================================
// DEWI JATENG - Autentikasi Sesi & Peran (Demo-grade)
// Cookie HttpOnly bertanda tangan HMAC + kata sandi per peran dari env.
// Catatan: ini auth tingkat demo (satu kata sandi per peran). Tabel pengguna
// penuh + hash per akun adalah pengembangan lanjut.
// ==============================================================================

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type Role = 'PENGELOLA' | 'PEMBINA';

export interface Session {
  role: Role;
  issuedAt: number;
}

const COOKIE_NAME = 'dewi_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam

export const ROLE_LABELS: Record<Role, string> = {
  PENGELOLA: 'Pengelola & Balai Desa',
  PEMBINA: 'Pembina / Disbudparekraf',
};

/** Halaman beranda tiap peran setelah login. */
export const ROLE_HOME: Record<Role, string> = {
  PENGELOLA: '/pengelola',
  PEMBINA: '/disporapar',
};

function getSecret(): string {
  return process.env.AUTH_SECRET || 'dewi-jateng-dev-secret-change-me';
}

function getPassword(role: Role): string {
  if (role === 'PEMBINA') {
    return process.env.AUTH_PEMBINA || 'pembina2026';
  }
  return process.env.AUTH_PENGELOLA || 'pengelola2026';
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isRole(value: unknown): value is Role {
  return value === 'PENGELOLA' || value === 'PEMBINA';
}

/** Bandingkan kata sandi dengan konstan waktu. */
export function verifyPassword(role: Role, password: string): boolean {
  if (!password) return false;
  return safeEqual(password, getPassword(role));
}

export function createSessionToken(role: Role): string {
  const issuedAt = Date.now();
  const payload = `${role}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [role, issuedAtRaw, signature] = parts;
  const payload = `${role}.${issuedAtRaw}`;
  if (!safeEqual(signature, sign(payload))) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_TTL_MS) return null;
  if (!isRole(role)) return null;

  return { role, issuedAt };
}

/** Baca sesi dari cookie server-side. Null bila belum/tidak valid. */
export function getSession(): Session | null {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
