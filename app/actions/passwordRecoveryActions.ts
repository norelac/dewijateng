'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, isValidEmail, validateNewPassword } from '@/lib/auth';
import { issueAuthToken, consumeAuthToken, peekAuthToken } from '@/lib/authTokens';
import { getRequestBaseUrl } from '@/lib/requestUrl';

export interface PasswordRecoveryResult {
  success: boolean;
  message?: string;
  redirectTo?: string;
  /** Hanya terisi di mode demo (tanpa SMTP) agar tautan bisa diuji. */
  devLink?: string;
}

/**
 * Minta tautan pemulihan. Jawaban selalu seragam agar keberadaan akun
 * tidak bisa ditebak dari halaman ini.
 */
export async function requestPasswordResetAction(
  _prevState: any,
  formData: FormData
): Promise<PasswordRecoveryResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { success: false, message: 'Masukkan email yang valid.' };
  }

  const genericMessage =
    'Jika email terdaftar, tautan pemulihan kata sandi akan dikirim.';

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let devLink: string | undefined;
    if (rows.length > 0 && rows[0].status === 'AKTIF') {
      const { token } = await issueAuthToken(rows[0].id, 'RESET_SANDI');
      const baseUrl = await getRequestBaseUrl();
      devLink = `${baseUrl}/reset-sandi?token=${token}`;
    }

    return {
      success: true,
      message: genericMessage,
      redirectTo: `/lupa-kata-sandi/terkirim?email=${encodeURIComponent(email)}`,
      devLink,
    };
  } catch (err: any) {
    console.error('[requestPasswordResetAction error]:', err);
    return { success: false, message: 'Gagal memproses permintaan pemulihan.' };
  }
}

/** Cek token reset tanpa menghanguskannya — dipakai /reset-sandi untuk validasi awal. */
export async function checkResetToken(
  rawToken: string
): Promise<{ valid: boolean; email?: string | null }> {
  const peek = await peekAuthToken(rawToken, 'RESET_SANDI');
  if (!peek) return { valid: false };

  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, peek.userId))
    .limit(1);
  return { valid: true, email: rows[0]?.email ?? null };
}

export async function resetPasswordAction(
  _prevState: any,
  formData: FormData
): Promise<PasswordRecoveryResult> {
  const rawToken = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  const check = validateNewPassword(password);
  if (!check.valid) return { success: false, message: check.message };
  if (password !== confirmPassword) {
    return { success: false, message: 'Ulangi kata sandi baru tidak cocok.' };
  }

  try {
    const consumed = await consumeAuthToken(rawToken, 'RESET_SANDI');
    if (!consumed) {
      return {
        success: false,
        message: 'Tautan pemulihan tidak valid atau sudah kedaluwarsa.',
      };
    }

    await db
      .update(users)
      .set({
        passwordHash: hashPassword(password),
        mustChangePassword: false,
      })
      .where(eq(users.id, consumed.userId));

    return { success: true, redirectTo: '/reset-sandi/berhasil' };
  } catch (err: any) {
    console.error('[resetPasswordAction error]:', err);
    return { success: false, message: 'Gagal menyimpan kata sandi baru.' };
  }
}
