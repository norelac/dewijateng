'use server';

import { and, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { assertRole, hashPassword, isSecureCookie, isValidEmail, validateNewPassword } from '@/lib/auth';
import { issueAuthToken, consumeAuthToken, peekAuthToken } from '@/lib/authTokens';
import { getRequestBaseUrl } from '@/lib/requestUrl';

export interface RegistrationResult {
  success: boolean;
  message?: string;
  redirectTo?: string;
  /** Hanya terisi di mode demo (tanpa SMTP) agar tautan bisa diuji. */
  devLink?: string;
}

/** Ubah nama/email menjadi username internal yang unik. */
async function buildUniqueUsername(base: string): Promise<string> {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'akun-dinas';

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function registerAdminAction(
  _prevState: any,
  formData: FormData
): Promise<RegistrationResult> {
  const fullName = String(formData.get('fullName') || '').trim();
  const nip = String(formData.get('nip') || '').trim();
  const institution = String(formData.get('institution') || '').trim();
  const regency = String(formData.get('regency') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const whatsapp = String(formData.get('whatsapp') || '').trim();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');
  const agreed = formData.get('agree') === 'on' || formData.get('agree') === 'true';

  const required: Array<[string, string]> = [
    [fullName, 'Nama lengkap wajib diisi.'],
    [nip, 'NIP wajib diisi.'],
    [institution, 'Nama instansi wajib diisi.'],
    [regency, 'Wilayah tugas wajib dipilih.'],
    [email, 'Email dinas wajib diisi.'],
    [whatsapp, 'Nomor WhatsApp wajib diisi.'],
  ];
  for (const [value, message] of required) {
    if (!value) return { success: false, message };
  }

  if (!isValidEmail(email)) {
    return { success: false, message: 'Format email dinas tidak valid.' };
  }
  if (!/^0\d{8,13}$/.test(whatsapp.replace(/[\s-]/g, ''))) {
    return { success: false, message: 'Nomor WhatsApp harus diawali 0 dan berupa angka.' };
  }

  const check = validateNewPassword(password);
  if (!check.valid) return { success: false, message: check.message };
  if (password !== confirmPassword) {
    return { success: false, message: 'Ulangi kata sandi tidak cocok.' };
  }
  if (!agreed) {
    return {
      success: false,
      message: 'Anda harus menyetujui ketentuan penggunaan dan kebijakan privasi.',
    };
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return {
        success: false,
        message: 'Email ini sudah terdaftar. Gunakan email lain atau masuk.',
      };
    }

    const username = await buildUniqueUsername(email.split('@')[0]);
    const inserted = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash: hashPassword(password),
        role: 'disbudparekraf',
        villageId: null,
        fullName,
        phone: whatsapp,
        nip,
        institution,
        regency,
        // Pendaftaran mandiri langsung masuk antrean peninjauan dinas tanpa perantara SMTP
        status: 'NONAKTIF',
        approvalStatus: 'MENUNGGU',
        emailVerifiedAt: new Date(),
        mustChangePassword: false,
      })
      .returning({ id: users.id, email: users.email });

    return {
      success: true,
      message: 'Pendaftaran berhasil diterima. Pengajuan Anda sedang dalam proses peninjauan administrator.',
      redirectTo: '/daftar/ditinjau',
    };
  } catch (err: any) {
    console.error('[registerAdminAction error]:', err);
    return { success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' };
  }
}

/** Verifikasi email lewat tautan bertoken. Dipakai halaman /daftar/verifikasi. */
export async function verifyEmailAction(
  rawToken: string
): Promise<{ success: boolean; message?: string }> {
  if (!rawToken) return { success: false, message: 'Tautan verifikasi tidak lengkap.' };

  try {
    const consumed = await consumeAuthToken(rawToken, 'VERIFIKASI_EMAIL');
    if (!consumed) {
      return {
        success: false,
        message: 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.',
      };
    }

    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), status: 'NONAKTIF' })
      .where(eq(users.id, consumed.userId));

    // Simpan penanda sementara (2 jam) agar layar "sedang ditinjau" bisa
    // menampilkan identitas pengajuan tanpa membocorkan data lewat URL.
    try {
      const { cookies } = await import('next/headers');
      cookies().set('dewi_pending', consumed.userId, {
        httpOnly: true,
        secure: isSecureCookie(),
        sameSite: 'lax',
        path: '/',
        maxAge: 2 * 60 * 60,
      });
    } catch (cookieErr) {
      console.warn('[verifyEmailAction] gagal set cookie pending:', cookieErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[verifyEmailAction error]:', err);
    return { success: false, message: 'Gagal memverifikasi email.' };
  }
}

/** Kirim ulang email verifikasi berdasarkan alamat email. */
export async function resendVerificationAction(
  _prevState: any,
  formData: FormData
): Promise<RegistrationResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { success: false, message: 'Masukkan email yang valid.' };
  }

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Jawaban seragam agar tidak membocorkan keberadaan akun.
    if (rows.length === 0 || rows[0].emailVerifiedAt) {
      return {
        success: true,
        message: 'Jika email terdaftar, tautan verifikasi baru sudah dikirim.',
      };
    }

    const { token } = await issueAuthToken(rows[0].id, 'VERIFIKASI_EMAIL');
    const baseUrl = await getRequestBaseUrl();
    const verifyUrl = `${baseUrl}/daftar/verifikasi?token=${token}`;

    return {
      success: true,
      message: 'Tautan verifikasi baru berhasil dibuat.',
      devLink: verifyUrl,
    };
  } catch (err: any) {
    console.error('[resendVerificationAction error]:', err);
    return { success: false, message: 'Gagal mengirim ulang email verifikasi.' };
  }
}

/** Cek apakah token verifikasi masih sah (untuk halaman verifikasi). */
export async function checkVerificationToken(
  rawToken: string
): Promise<{ valid: boolean; email?: string | null }> {
  const peek = await peekAuthToken(rawToken, 'VERIFIKASI_EMAIL');
  if (!peek) return { valid: false };

  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, peek.userId))
    .limit(1);
  return { valid: true, email: rows[0]?.email ?? null };
}

export interface PendingAccount {
  id: string;
  fullName: string;
  email: string | null;
  institution: string | null;
  regency: string | null;
  nip: string | null;
  createdAt: string;
  emailVerified: boolean;
  approvalStatus: string;
}

/** Daftar akun yang menunggu persetujuan administrator. */
export async function listPendingAccountsAction(): Promise<PendingAccount[]> {
  await assertRole(['disbudparekraf']);
  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'disbudparekraf'),
        or(eq(users.approvalStatus, 'MENUNGGU'), eq(users.approvalStatus, 'DITOLAK'))
      )
    );

  return rows.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    institution: u.institution,
    regency: u.regency,
    nip: u.nip,
    createdAt: u.createdAt.toISOString(),
    emailVerified: Boolean(u.emailVerifiedAt),
    approvalStatus: u.approvalStatus,
  }));
}

export async function decideAccountAction(
  userId: string,
  decision: 'SETUJUI' | 'TOLAK'
): Promise<RegistrationResult> {
  try {
    await assertRole(['disbudparekraf']);
    if (decision === 'SETUJUI') {
      await db
        .update(users)
        .set({ approvalStatus: 'DISETUJUI', status: 'AKTIF', activatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.role, 'disbudparekraf')));
      return { success: true, message: 'Akun disetujui dan sudah bisa dipakai.' };
    }

    await db
      .update(users)
      .set({ approvalStatus: 'DITOLAK', status: 'NONAKTIF' })
      .where(and(eq(users.id, userId), eq(users.role, 'disbudparekraf')));
    return { success: true, message: 'Pengajuan akun ditolak.' };
  } catch (err: any) {
    console.error('[decideAccountAction error]:', err);
    return { success: false, message: err?.message || 'Gagal memproses keputusan akun.' };
  }
}
