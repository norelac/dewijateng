// ==============================================================================
// DEWI JATENG - Auth Server Actions (masuk / keluar)
// ==============================================================================

'use server';

import { cookies } from 'next/headers';
import {
  createSessionToken,
  verifyPassword,
  isRole,
  ROLE_HOME,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const role = formData.get('role');
  const password = (formData.get('password') as string) || '';
  const next = (formData.get('next') as string) || '';

  if (!isRole(role)) {
    return { success: false, error: 'Peran tidak dikenali.' };
  }

  if (!verifyPassword(role, password)) {
    return { success: false, error: 'Kata sandi salah. Periksa kembali.' };
  }

  const token = createSessionToken(role);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });

  // Hanya izinkan jalur internal sebagai tujuan setelah masuk.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '';
  return { success: true, redirectTo: safeNext || ROLE_HOME[role] };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  cookies().delete(SESSION_COOKIE);
  return { success: true };
}
