'use server';

import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  hashPassword,
  verifyPassword,
  validateNewPassword,
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
  {
    password: string;
    role: 'desa' | 'disbudparekraf';
    fullName: string;
    villageId: string | null;
    email: string;
  }
> = {
  disbudparekraf: {
    password: 'disbudparekraf2026',
    role: 'disbudparekraf',
    fullName: 'Admin Eksekutif Disbudparekraf Jateng',
    villageId: null,
    email: 'disbudparekraf@jatengprov.go.id',
  },
  'desa-candirejo': {
    password: 'candirejo2026',
    role: 'desa',
    fullName: 'Pengelola Desa Wisata Candirejo',
    villageId: 'a0000000-0000-0000-0000-000000000002',
    email: 'desa-candirejo@jatengprov.go.id',
  },
};

export async function loginAction(
  _prevState: any,
  formData: FormData
): Promise<AuthActionResult> {
  // Satu field menerima email ATAU username (sesuai catatan desain:
  // "nama@instansi.go.id atau email pengelola").
  const identifier = String(
    formData.get('identifier') || formData.get('username') || formData.get('email') || ''
  )
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const remember = formData.get('remember') === 'on' || formData.get('remember') === 'true';

  if (!identifier || !password) {
    return { success: false, message: 'Email dan kata sandi wajib diisi' };
  }

  try {
    let sessionUser: SessionUser | null = null;
    let mustChange = false;

    // 1. Cari di PostgreSQL (email atau username).
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.email, identifier), eq(users.username, identifier)))
        .limit(1);

      if (foundUsers.length > 0) {
        const u = foundUsers[0];
        const valid = verifyPassword(password, u.passwordHash);
        if (valid) {
          // Gerbang status akun — urutan pesan mengikuti salinan desain.
          if (u.approvalStatus === 'DITOLAK') {
            return {
              success: false,
              message:
                'Pengajuan akses Anda ditolak. Hubungi pusat bantuan untuk informasi lanjutan.',
            };
          }
          if (!u.emailVerifiedAt) {
            return {
              success: false,
              message:
                'Email Anda belum terverifikasi. Buka tautan verifikasi yang kami kirim.',
              redirectTo: `/daftar/verifikasi?email=${encodeURIComponent(u.email || '')}`,
            };
          }
          if (u.approvalStatus === 'MENUNGGU') {
            return {
              success: false,
              message: 'Pengajuan Anda masih menunggu persetujuan administrator.',
              redirectTo: '/daftar/ditinjau',
            };
          }
          if (u.status !== 'AKTIF') {
            return {
              success: false,
              message: 'Akun Anda sedang dinonaktifkan. Hubungi Disbudparekraf.',
            };
          }

          sessionUser = {
            id: u.id,
            username: u.username,
            email: u.email,
            fullName: u.fullName,
            role: u.role as 'desa' | 'disbudparekraf',
            villageId: u.villageId,
            mustChangePassword: Boolean(u.mustChangePassword),
          };
          mustChange = Boolean(u.mustChangePassword);

          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, u.id));
        }
      }
    } catch (dbErr) {
      console.warn('[loginAction] Database query fallback:', dbErr);
    }

    // 2. Fallback file data/demo-users.json (akun yang baru diterbitkan).
    if (!sessionUser) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const usersFilePath = path.join(process.cwd(), 'data', 'demo-users.json');
        if (fs.existsSync(usersFilePath)) {
          const list: any[] = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
          const found = list.find(
            (u) =>
              u.username?.toLowerCase() === identifier ||
              u.email?.toLowerCase() === identifier
          );
          if (found) {
            if (found.status !== 'AKTIF') {
              return {
                success: false,
                message: 'Akun Anda sedang dinonaktifkan. Hubungi Disbudparekraf.',
              };
            }
            const isMatch =
              (found.password && found.password === password) ||
              (found.passwordHash && verifyPassword(password, found.passwordHash));

            if (isMatch) {
              sessionUser = {
                id: found.id,
                username: found.username,
                email: found.email ?? null,
                fullName: found.fullName,
                role: found.role,
                villageId: found.villageId,
                mustChangePassword: Boolean(found.mustChangePassword),
              };
              mustChange = Boolean(found.mustChangePassword);
            }
          }
        }
      } catch (fsErr) {
        console.warn('[loginAction] Fallback file read warning:', fsErr);
      }
    }

    // 3. Fallback akun demo statis.
    if (!sessionUser && FALLBACK_USERS[identifier]) {
      const fb = FALLBACK_USERS[identifier];
      if (fb.password === password) {
        sessionUser = {
          id:
            identifier === 'disbudparekraf'
              ? 'e0000000-0000-0000-0000-000000000001'
              : 'e0000000-0000-0000-0000-000000000002',
          username: identifier,
          email: fb.email,
          fullName: fb.fullName,
          role: fb.role,
          villageId: fb.villageId,
          mustChangePassword: false,
        };
      }
    }

    if (!sessionUser) {
      return { success: false, message: 'Email atau kata sandi tidak sesuai' };
    }

    try {
      await setSessionCookie(sessionUser, remember);
    } catch (cookieErr) {
      console.warn('[loginAction] setSessionCookie warning:', cookieErr);
    }

    const redirectTo =
      sessionUser.role === 'disbudparekraf' ? '/disbudparekraf' : '/pengelola';
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

  const check = validateNewPassword(newPassword);
  if (!check.valid) {
    return { success: false, message: check.message };
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
