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
    passwordHash: string;
    role: 'desa' | 'disbudparekraf';
    fullName: string;
    villageId: string | null;
    email: string;
  }
> = {
  disbudparekraf: {
    passwordHash:
      'pbkdf2$10000$e58dc314ed70c131ce69c379f86cfca4$d4790cd40500033c292632e0bcbb1ab0854a28362ec38e8e057973ad04017be9f60b95b59b5fadef51ae68c525538e8063f836ead832b171a6fc872099915123',
    role: 'disbudparekraf',
    fullName: 'Admin Eksekutif Disbudparekraf Jateng',
    villageId: null,
    email: 'disbudparekraf@jatengprov.go.id',
  },
  'desa-candirejo': {
    passwordHash:
      'pbkdf2$10000$6fde02819f2067cf107e71e76012f7e8$7bb40e4812a5d17613f1b0d77fe0b210c3f8958482047a562530f3ab627422c6041ca0c6fd56b197d3f4e1d33b501752c38481fce43d4250575f1b15e0fc9c75',
    role: 'desa',
    fullName: 'Pengelola Desa Wisata Candirejo',
    villageId: 'a0000000-0000-0000-0000-000000000002',
    email: 'desa-candirejo@jatengprov.go.id',
  },
};

type LoginPeran = 'desa' | 'admin';

/**
 * Halaman masuk punya dua "porch": Disbudparekraf (admin) dan pengelola desa.
 * Jika kredensial valid tetapi peran akun tidak sesuai porch yang dibuka,
 * tolak masuk dengan pesan yang jelas (bukan diam-diam mendarat di dashboard lain).
 */
function peranMismatchMessage(role: string, peran: LoginPeran): string | null {
  if (peran === 'desa' && role !== 'desa') {
    return 'Akun ini terdaftar sebagai admin dinas. Silakan masuk lewat halaman Disbudparekraf.';
  }
  if (peran === 'admin' && role !== 'disbudparekraf') {
    return 'Akun ini terdaftar sebagai pengelola desa. Silakan masuk lewat halaman pengelola desa.';
  }
  return null;
}

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
  const peran: LoginPeran = formData.get('peran') === 'desa' ? 'desa' : 'admin';

  if (!identifier || !password) {
    return { success: false, message: 'Nama pengguna (username) dan kata sandi wajib diisi' };
  }

  try {
    let sessionUser: SessionUser | null = null;
    let mustChange = false;
    let dbUserId: string | null = null;

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
            // Akun pengelola desa dibuat + diundang oleh Disbudparekraf (bukan
            // pendaftaran mandiri), jadi pesannya soal undangan, bukan verifikasi.
            if (u.role === 'desa') {
              return {
                success: false,
                message:
                  'Akun Anda belum diaktifkan. Buka tautan undangan aktivasi pada email, ' +
                  'atau minta Disbudparekraf mengirim ulang undangan.',
              };
            }
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
          dbUserId = u.id;
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
              Boolean(found.passwordHash) && verifyPassword(password, found.passwordHash);

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
      if (verifyPassword(password, fb.passwordHash)) {
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
      return { success: false, message: 'Nama pengguna (username) atau kata sandi tidak sesuai' };
    }

    const mismatch = peranMismatchMessage(sessionUser.role, peran);
    if (mismatch) {
      return { success: false, message: mismatch };
    }

    if (dbUserId) {
      try {
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, dbUserId));
      } catch (touchErr) {
        console.warn('[loginAction] lastLoginAt warning:', touchErr);
      }
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

  if (!oldPassword) {
    return { success: false, message: 'Kata sandi saat ini wajib diisi' };
  }

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
      if (!verifyPassword(oldPassword, u.passwordHash)) {
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
    } else if (FALLBACK_USERS[currentSession.username]) {
      if (!verifyPassword(oldPassword, FALLBACK_USERS[currentSession.username].passwordHash)) {
        return { success: false, message: 'Kata sandi lama tidak sesuai' };
      }
    } else {
      return { success: false, message: 'Akun tidak ditemukan untuk perubahan kata sandi' };
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
