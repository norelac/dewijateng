// ==============================================================================
// DEWI JATENG - Token Autentikasi (verifikasi email, undangan aktivasi, reset sandi)
// Token asli hanya muncul sekali di tautan; database menyimpan hash SHA-256.
// ==============================================================================

import crypto from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { authTokens } from '@/lib/db/schema';

export type AuthTokenType = 'VERIFIKASI_EMAIL' | 'UNDANGAN_AKTIVASI' | 'RESET_SANDI';

/** Masa berlaku token (menit), mengikuti salinan desain Figma. */
export const TOKEN_TTL_MINUTES: Record<AuthTokenType, number> = {
  VERIFIKASI_EMAIL: 24 * 60, // 24 jam
  UNDANGAN_AKTIVASI: 24 * 60, // 24 jam
  RESET_SANDI: 30, // 30 menit
};

export interface IssuedToken {
  /** Token mentah untuk ditempel ke tautan. Jangan disimpan di database. */
  token: string;
  expiresAt: Date;
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Terbitkan token baru untuk seorang pengguna. Token lama bertipe sama yang
 * belum terpakai otomatis hangus agar tautan lama tidak bisa dipakai ulang.
 */
export async function issueAuthToken(
  userId: string,
  type: AuthTokenType
): Promise<IssuedToken> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60 * 1000);

  // Hanguskan token sejenis yang masih menggantung.
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt)
      )
    );

  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return { token: rawToken, expiresAt };
}

export interface ConsumedToken {
  userId: string;
}

/**
 * Validasi token lalu tandai terpakai (sekali pakai).
 * Mengembalikan null jika token tidak dikenal, sudah dipakai, atau kedaluwarsa.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType
): Promise<ConsumedToken | null> {
  if (!rawToken) return null;

  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(rawToken)),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const record = rows[0];
  if (record.expiresAt.getTime() < Date.now()) return null;

  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(eq(authTokens.id, record.id));

  return { userId: record.userId };
}

/** Cek token tanpa menghanguskannya — dipakai untuk menampilkan/menyembunyikan form. */
export async function peekAuthToken(
  rawToken: string,
  type: AuthTokenType
): Promise<{ userId: string; expiresAt: Date } | null> {
  if (!rawToken) return null;

  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(rawToken)),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  if (rows[0].expiresAt.getTime() < Date.now()) return null;

  return { userId: rows[0].userId, expiresAt: rows[0].expiresAt };
}
