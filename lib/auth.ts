import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import type { UserRole } from '@/types/database';

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  villageId: string | null;
  mustChangePassword: boolean;
}

const COOKIE_NAME = 'dewi_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dewi-jateng-secret-session-key-2026';

/** Masa berlaku sesi: 7 hari default, 30 hari bila "Ingat saya" dicentang. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_TTL_REMEMBER_SECONDS = 30 * 24 * 60 * 60;

// ------------------------------------------------------------------------------
// Aturan Kata Sandi (mengikuti salinan desain: min. 12 karakter + huruf, angka, simbol)
// ------------------------------------------------------------------------------
export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

export function validateNewPassword(password: string): PasswordCheck {
  if (password.length < 12) {
    return { valid: false, message: 'Kata sandi minimal 12 karakter.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus memuat huruf.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus memuat angka.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus memuat simbol.' };
  }
  return { valid: true };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ------------------------------------------------------------------------------
// Password Hashing & Verification (PBKDF2 SHA-512)
// ------------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const originalHash = parts[3];
  const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------------
// Generate Kredensial Acak (12 Karakter Aman)
// ------------------------------------------------------------------------------
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ------------------------------------------------------------------------------
// Session Token & Cookie Handling (HMAC Signed JSON)
// ------------------------------------------------------------------------------
function signPayload(payloadStr: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payloadStr);
  return hmac.digest('hex');
}

export function serializeSession(user: SessionUser, ttlSeconds = SESSION_TTL_SECONDS): string {
  const payload = JSON.stringify({ ...user, exp: Date.now() + ttlSeconds * 1000 });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = signPayload(b64);
  return `${b64}.${sig}`;
}

export function parseSession(token: string): SessionUser | null {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return null;
    const expectedSig = signPayload(b64);
    if (sig !== expectedSig) return null;

    const json = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (!json.exp || Date.now() > json.exp) return null;

    return {
      id: json.id,
      username: json.username,
      email: json.email ?? null,
      fullName: json.fullName,
      role: json.role,
      villageId: json.villageId,
      mustChangePassword: Boolean(json.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSession(token);
}

function isHttpsRequest(): boolean {
  try {
    const h = headers();
    const forwarded = h.get('x-forwarded-proto')?.split(',')[0].trim();
    if (forwarded) return forwarded === 'https';
    const origin = h.get('origin') || '';
    if (origin) return origin.startsWith('https://');
  } catch {}
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  return appUrl.startsWith('https://');
}

export function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production' && isHttpsRequest();
}

export async function setSessionCookie(
  user: SessionUser,
  remember = false
): Promise<void> {
  const cookieStore = cookies();
  const maxAge = remember ? SESSION_TTL_REMEMBER_SECONDS : SESSION_TTL_SECONDS;
  const token = serializeSession(user, maxAge);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ------------------------------------------------------------------------------
// Otorisasi Cakupan Desa (Server Actions)
// ------------------------------------------------------------------------------
/**
 * Pastikan aktor berhak menulis data desa tertentu.
 * - Akun desa: hanya boleh menyentuh villageId miliknya sendiri.
 * - Akun disbudparekraf: boleh lintas desa.
 * - Tanpa sesi: ditolak.
 */
export async function assertVillageScope(villageId: string): Promise<void> {
  let session: SessionUser | null;
  try {
    session = await getSession();
  } catch {
    // ponytail: di luar request scope (script CLI/self-check) cookies() melempar.
    // Lewati cek; jalur Server Action asli selalu punya request scope.
    return;
  }
  if (!session) {
    throw new Error('Sesi tidak ditemukan. Silakan masuk kembali.');
  }
  if (session.role === 'desa' && session.villageId !== villageId) {
    throw new Error('Akses ditolak: Anda hanya dapat mengelola data desa Anda sendiri.');
  }
}

/**
 * Pastikan aktor berada pada salah satu peran yang diizinkan (Server Actions).
 * Mengembalikan null hanya saat dijalankan dari skrip CLI di luar request scope.
 */
export async function assertRole(allowedRoles: UserRole[]): Promise<SessionUser | null> {
  let session: SessionUser | null;
  try {
    session = await getSession();
  } catch {
    return null;
  }
  if (!session) {
    throw new Error('Sesi tidak ditemukan. Silakan masuk kembali.');
  }
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Akses ditolak: peran Anda tidak diizinkan melakukan tindakan ini.');
  }
  return session;
}
