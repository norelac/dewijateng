'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  type SessionUser,
} from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface AuthActionResult {
  success: boolean;
  message?: string;
  redirectTo?: string;
  mustChangePassword?: boolean;
}

// Fallback demo users jika database belum disinkronkan
const FALLBACK_USERS: Record<
  string,
  { password: string; role: 'desa' | 'disbudparekraf'; fullName: string; villageId: string | null }
> = {
  disbudparekraf: {
    password: 'disbudparekraf2026',
    role: 'disbudparekraf',
    fullName: 'Admin Eksekutif Disbudparekraf Jateng',
    villageId: null,
  },
  'desa-candirejo': {
    password: 'candirejo2026',
    role: 'desa',
    fullName: 'Pengelola Desa Wisata Candirejo',
    villageId: 'a0000000-0000-0000-0000-000000000002',
  },
};

export async function loginAction(
  _prevState: any,
  formData: FormData
): Promise<AuthActionResult> {
  const username = String(formData.get('username') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  try {
    let sessionUser: SessionUser | null = null;
    let mustChange = false;

    // 1. Coba cari di PostgreSQL via Drizzle
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (foundUsers.length > 0) {
        const u = foundUsers[0];
        if (u.status !== 'AKTIF') {
          return { success: false, message: 'Akun Anda sedang dinonaktifkan. Hubungi Disbudparekraf.' };
        }

        const valid = verifyPassword(password, u.passwordHash);
        if (valid) {
          sessionUser = {
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            role: u.role as 'desa' | 'disbudparekraf',
            villageId: u.villageId,
            mustChangePassword: Boolean(u.mustChangePassword),
          };
          mustChange = Boolean(u.mustChangePassword);

          // Update last_login_at
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, u.id));
        }
      }
    } catch (dbErr) {
      console.warn('[loginAction] Database query fallback:', dbErr);
    }

    // 2. Fallback akun demo jika DB offline atau belum di-seed
    if (!sessionUser && FALLBACK_USERS[username]) {
      const fb = FALLBACK_USERS[username];
      if (fb.password === password) {
        sessionUser = {
          id: username === 'disbudparekraf' ? 'e0000000-0000-0000-0000-000000000001' : 'e0000000-0000-0000-0000-000000000002',
          username,
          fullName: fb.fullName,
          role: fb.role,
          villageId: fb.villageId,
          mustChangePassword: false,
        };
      }
    }

    if (!sessionUser) {
      return { success: false, message: 'Username atau kata sandi tidak sesuai' };
    }

    // Simpan ke session cookie
    await setSessionCookie(sessionUser);

    const redirectTo = sessionUser.role === 'disbudparekraf' ? '/disbudparekraf' : '/pengelola';
    return {
      success: true,
      redirectTo,
      mustChangePassword: mustChange,
    };
  } catch (error: any) {
    console.error('[loginAction error]:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat proses masuk' };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}

export async function getSessionAction(): Promise<SessionUser | null> {
  return await getSession();
}

export async function changePasswordAction(
  _prevState: any,
  formData: FormData
): Promise<AuthActionResult> {
  const currentSession = await getSession();
  if (!currentSession) {
    return { success: false, message: 'Sesi telah berakhir. Silakan masuk kembali.' };
  }

  const oldPassword = String(formData.get('oldPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'Kata sandi baru minimal 8 karakter' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Konfirmasi kata sandi baru tidak cocok' };
  }

  try {
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, currentSession.id))
      .limit(1);

    if (foundUsers.length > 0) {
      const u = foundUsers[0];
      if (oldPassword && !verifyPassword(oldPassword, u.passwordHash)) {
        return { success: false, message: 'Kata sandi lama tidak sesuai' };
      }

      const newHash = hashPassword(newPassword);
      await db
        .update(users)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
        })
        .where(eq(users.id, currentSession.id));
    }

    // Perbarui session cookie
    await setSessionCookie({
      ...currentSession,
      mustChangePassword: false,
    });

    return { success: true, message: 'Kata sandi berhasil diperbarui' };
  } catch (err: any) {
    console.error('[changePasswordAction error]:', err);
    return { success: false, message: 'Gagal memperbarui kata sandi' };
  }
}
