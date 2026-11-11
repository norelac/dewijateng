'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, query } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  getSession,
  hashPassword,
  isValidEmail,
  validateNewPassword,
  type SessionUser,
} from '@/lib/auth';
import { consumeAuthToken, issueAuthToken, peekAuthToken } from '@/lib/authTokens';
import { getRequestBaseUrl } from '@/lib/requestUrl';

// ==============================================================================
// DEWI JATENG - Akun pengelola desa wisata (Fase 3)
//
// Satu desa wisata hanya boleh punya satu akun pengelola utama. Aturan ini
// ditegakkan di sini karena `users.village_id` tidak punya unique index
// (lihat `lib/db/schema.ts`). Status akun diturunkan dari kolom yang sudah ada:
//
//   AKTIF              -> status = 'AKTIF'
//   MENUNGGU_AKTIVASI  -> status = 'NONAKTIF' dan email_verified_at IS NULL
//   NONAKTIF           -> status = 'NONAKTIF' dan email_verified_at terisi
//
// ponytail: kalau nanti butuh jejak audit penuh (siapa menonaktifkan, kapan,
// alasan), buat tabel `account_events`. Sekarang riwayat diturunkan dari
// created_at, auth_tokens, last_login_at, dan deactivated_at.
// ==============================================================================

export type VillageAccountStatus = 'AKTIF' | 'MENUNGGU_AKTIVASI' | 'NONAKTIF';

const ACCOUNT_STATUS_LABEL: Record<VillageAccountStatus, string> = {
  AKTIF: 'Aktif',
  MENUNGGU_AKTIVASI: 'Menunggu aktivasi',
  NONAKTIF: 'Nonaktif',
};

export interface VillageAccountRow {
  userId: string;
  villageId: string;
  villageName: string;
  villageSlug: string;
  regency: string;
  district: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: VillageAccountStatus;
  statusLabel: string;
  createdAt: string;
  activatedAt: string | null;
  deactivatedAt: string | null;
  lastLoginAt: string | null;
  /** Masa berlaku undangan aktivasi yang masih menggantung. */
  invitationExpiresAt: string | null;
  invitationSentAt: string | null;
}

export interface VillageAccountFilters {
  status?: VillageAccountStatus | 'SEMUA';
  q?: string;
  kabupaten?: string;
  page?: number;
  perPage?: number;
}

export interface VillageAccountListResult {
  rows: VillageAccountRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  counts: { SEMUA: number; AKTIF: number; MENUNGGU_AKTIVASI: number; NONAKTIF: number };
  kabupatenOptions: string[];
}

/** Ringkasan akun pengelola untuk kartu dashboard Disbudparekraf. */
export interface VillageAccountStats {
  total: number;
  aktif: number;
  menunggu: number;
  nonaktif: number;
  /** Kabupaten/kota yang sudah punya akun pengelola. */
  regencyCount: number;
  /** Seluruh desa wisata terdata (868 pad demo). */
  villageTotal: number;
  /** Seluruh kabupaten/kota pada data desa wisata (31 pad demo). */
  regencyTotal: number;
}

/**
 * Ekspresi SQL status turunan. Dipakai berulang di SELECT, WHERE, dan hitungan
 * tab supaya definisi "Menunggu aktivasi" hanya ada di satu tempat.
 */
const STATUS_EXPR = `CASE
  WHEN u.status = 'AKTIF' THEN 'AKTIF'
  WHEN u.email_verified_at IS NULL THEN 'MENUNGGU_AKTIVASI'
  ELSE 'NONAKTIF'
END`;

/** Pastikan pemanggil adalah admin Disbudparekraf. */
async function requireDisbudparekraf(): Promise<SessionUser> {
  let session: SessionUser | null = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  if (!session) {
    throw new Error('Sesi tidak ditemukan. Silakan masuk kembali.');
  }
  if (session.role !== 'disbudparekraf') {
    throw new Error('Akses ditolak: hanya admin Disbudparekraf yang dapat mengelola akun desa.');
  }
  return session;
}

function iso(value: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Pemetaan baris SQL -> VillageAccountRow (dipakai daftar akun & dashboard). */
function mapVillageAccountRow(row: any): VillageAccountRow {
  const derived = row.derived_status as VillageAccountStatus;
  return {
    userId: row.id,
    villageId: row.village_id,
    villageName: row.village_name,
    villageSlug: row.village_slug,
    regency: row.regency,
    district: row.district,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: derived,
    statusLabel: ACCOUNT_STATUS_LABEL[derived],
    createdAt: iso(row.created_at) ?? '',
    activatedAt: iso(row.activated_at),
    deactivatedAt: iso(row.deactivated_at),
    lastLoginAt: iso(row.last_login_at),
    invitationSentAt: iso(row.invitation_sent_at),
    invitationExpiresAt: iso(row.invitation_expires_at),
  };
}

/**
 * Ringkasan akun pengelola untuk dashboard Disbudparekraf.
 *
 * Sebelumnya kartu "Pengelolaan akun desa" memakai angka contoh statis
 * (48 desa / 42 aktif / 4 menunggu / 2 nonaktif). Sekarang dibaca dari
 * database supaya konsisten dengan layar "Akun desa wisata".
 */
export async function getVillageAccountStats(): Promise<{
  stats: VillageAccountStats;
  recent: VillageAccountRow[];
}> {
  await requireDisbudparekraf();

  const statsRes = await query<any>(
    `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'AKTIF')::int AS aktif,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'MENUNGGU_AKTIVASI')::int AS menunggu,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'NONAKTIF')::int AS nonaktif,
        COUNT(DISTINCT tv.regency)::int AS regency_count,
        (SELECT COUNT(*) FROM tourist_villages)::int AS village_total,
        (SELECT COUNT(DISTINCT regency) FROM tourist_villages)::int AS regency_total
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE u.role = 'desa'`
  );

  const recentRes = await query<any>(
    `SELECT u.id, u.village_id, u.full_name, u.email, u.phone, u.status,
            u.created_at, u.activated_at, u.deactivated_at, u.last_login_at,
            tv.name AS village_name, tv.slug AS village_slug,
            tv.regency, tv.district,
            (${STATUS_EXPR}) AS derived_status,
            inv.created_at AS invitation_sent_at,
            inv.expires_at AS invitation_expires_at
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
       LEFT JOIN LATERAL (
         SELECT t.created_at, t.expires_at
           FROM auth_tokens t
          WHERE t.user_id = u.id
            AND t.type = 'UNDANGAN_AKTIVASI'
            AND t.used_at IS NULL
          ORDER BY t.created_at DESC
          LIMIT 1
       ) inv ON true
      WHERE u.role = 'desa'
      ORDER BY u.created_at DESC
      LIMIT 4`
  );

  const s = statsRes.rows[0] ?? {};
  return {
    stats: {
      total: s.total ?? 0,
      aktif: s.aktif ?? 0,
      menunggu: s.menunggu ?? 0,
      nonaktif: s.nonaktif ?? 0,
      regencyCount: s.regency_count ?? 0,
      villageTotal: s.village_total ?? 0,
      regencyTotal: s.regency_total ?? 0,
    },
    recent: recentRes.rows.map(mapVillageAccountRow),
  };
}

// ------------------------------------------------------------------------------
// Daftar akun + filter
// ------------------------------------------------------------------------------

const DEFAULT_PER_PAGE = 6;

export async function listVillageAccounts(
  filters: VillageAccountFilters = {}
): Promise<VillageAccountListResult> {
  await requireDisbudparekraf();

  const status = filters.status ?? 'SEMUA';
  const q = (filters.q || '').trim();
  const kabupaten = (filters.kabupaten || '').trim();
  const perPage = Math.max(1, Math.min(50, filters.perPage ?? DEFAULT_PER_PAGE));
  const page = Math.max(1, filters.page ?? 1);

  const where: string[] = [`u.role = 'desa'`];
  const params: unknown[] = [];

  if (status !== 'SEMUA') {
    params.push(status);
    where.push(`(${STATUS_EXPR}) = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(
      `(lower(tv.name) LIKE $${params.length} OR lower(u.full_name) LIKE $${params.length} OR lower(COALESCE(u.email, '')) LIKE $${params.length})`
    );
  }
  if (kabupaten) {
    params.push(kabupaten);
    where.push(`tv.regency = $${params.length}`);
  }

  const whereSql = where.join(' AND ');

  const countRes = await query<any>(
    `SELECT COUNT(*)::int AS total
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE ${whereSql}`,
    params
  );
  const total = countRes.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * perPage;

  const rowsRes = await query<any>(
    `SELECT u.id, u.village_id, u.full_name, u.email, u.phone, u.status,
            u.created_at, u.activated_at, u.deactivated_at, u.last_login_at,
            tv.name AS village_name, tv.slug AS village_slug,
            tv.regency, tv.district,
            (${STATUS_EXPR}) AS derived_status,
            inv.created_at AS invitation_sent_at,
            inv.expires_at AS invitation_expires_at
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
       LEFT JOIN LATERAL (
         SELECT t.created_at, t.expires_at
           FROM auth_tokens t
          WHERE t.user_id = u.id
            AND t.type = 'UNDANGAN_AKTIVASI'
            AND t.used_at IS NULL
          ORDER BY t.created_at DESC
          LIMIT 1
       ) inv ON true
      WHERE ${whereSql}
      ORDER BY
        CASE (${STATUS_EXPR}) WHEN 'MENUNGGU_AKTIVASI' THEN 0 WHEN 'AKTIF' THEN 1 ELSE 2 END,
        tv.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, offset]
  );

  const countsRes = await query<any>(
    `SELECT
        COUNT(*)::int AS semua,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'AKTIF')::int AS aktif,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'MENUNGGU_AKTIVASI')::int AS menunggu,
        COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'NONAKTIF')::int AS nonaktif
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE u.role = 'desa'`
  );

  const kabRes = await query<any>(
    `SELECT DISTINCT tv.regency
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE u.role = 'desa'
      ORDER BY tv.regency ASC`
  );

  const rows: VillageAccountRow[] = rowsRes.rows.map(mapVillageAccountRow);

  const c = countsRes.rows[0] ?? {};
  return {
    rows,
    total,
    page: safePage,
    perPage,
    totalPages,
    counts: {
      SEMUA: c.semua ?? 0,
      AKTIF: c.aktif ?? 0,
      MENUNGGU_AKTIVASI: c.menunggu ?? 0,
      NONAKTIF: c.nonaktif ?? 0,
    },
    kabupatenOptions: kabRes.rows.map((r) => r.regency as string),
  };
}

// ------------------------------------------------------------------------------
// Detail akun + riwayat
// ------------------------------------------------------------------------------

export interface VillageAccountEvent {
  at: string;
  title: string;
  detail: string;
}

export interface VillageAccountDetail {
  account: VillageAccountRow;
  events: VillageAccountEvent[];
}

export async function getVillageAccountDetail(
  userId: string
): Promise<VillageAccountDetail | null> {
  await requireDisbudparekraf();

  const res = await query<any>(
    `SELECT u.id, u.village_id, u.full_name, u.email, u.phone, u.status,
            u.created_at, u.activated_at, u.deactivated_at, u.last_login_at,
            tv.name AS village_name, tv.slug AS village_slug,
            tv.regency, tv.district,
            (${STATUS_EXPR}) AS derived_status,
            inv.created_at AS invitation_sent_at,
            inv.expires_at AS invitation_expires_at
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
       LEFT JOIN LATERAL (
         SELECT t.created_at, t.expires_at
           FROM auth_tokens t
          WHERE t.user_id = u.id
            AND t.type = 'UNDANGAN_AKTIVASI'
            AND t.used_at IS NULL
          ORDER BY t.created_at DESC
          LIMIT 1
       ) inv ON true
      WHERE u.id = $1 AND u.role = 'desa'
      LIMIT 1`,
    [userId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  const derived = row.derived_status as VillageAccountStatus;

  const account: VillageAccountRow = {
    userId: row.id,
    villageId: row.village_id,
    villageName: row.village_name,
    villageSlug: row.village_slug,
    regency: row.regency,
    district: row.district,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: derived,
    statusLabel: ACCOUNT_STATUS_LABEL[derived],
    createdAt: iso(row.created_at) ?? '',
    activatedAt: iso(row.activated_at),
    deactivatedAt: iso(row.deactivated_at),
    lastLoginAt: iso(row.last_login_at),
    invitationSentAt: iso(row.invitation_sent_at),
    invitationExpiresAt: iso(row.invitation_expires_at),
  };

  // Riwayat diturunkan dari data yang sudah tersimpan.
  const tokenRes = await query<any>(
    `SELECT type, created_at, used_at, expires_at
       FROM auth_tokens
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20`,
    [userId]
  );

  const events: VillageAccountEvent[] = [];

  events.push({
    at: account.createdAt,
    title: 'Akun dibuat oleh Admin Disbudparekraf',
    detail: `Peran: pengelola desa ${account.villageName.replace(/^Desa Wisata\s+/i, '')}`,
  });

  for (const t of tokenRes.rows) {
    if (t.type === 'UNDANGAN_AKTIVASI') {
      events.push({
        at: iso(t.created_at) ?? '',
        title: 'Undangan aktivasi dikirim',
        detail: `Ke ${account.email || 'email pengelola'}`,
      });
    }
    if (t.type === 'RESET_SANDI') {
      events.push({
        at: iso(t.created_at) ?? '',
        title: 'Permintaan pemulihan kata sandi',
        detail: 'Tautan pemulihan dibuat dan dikirim ke email akun',
      });
    }
  }

  // Aktivasi dibaca dari `activated_at`, bukan `auth_tokens.used_at`: token
  // undangan lama juga ditandai terpakai saat undangan dikirim ulang, jadi
  // `used_at` tidak bisa dipakai sebagai bukti akun benar-benar diaktifkan.
  if (account.activatedAt) {
    events.push({
      at: account.activatedAt,
      title: 'Akun diaktifkan oleh pengelola',
      detail: 'Kata sandi ditetapkan sendiri oleh pengelola desa',
    });
  }

  if (account.lastLoginAt) {
    events.push({
      at: account.lastLoginAt,
      title: 'Masuk ke ruang pengelola desa',
      detail: 'Login berhasil dari aplikasi DEWI JATENG',
    });
  }
  if (account.deactivatedAt) {
    events.push({
      at: account.deactivatedAt,
      title: 'Akun dinonaktifkan oleh Disbudparekraf',
      detail: 'Pengelola tidak dapat masuk sampai akun diaktifkan kembali',
    });
  }

  events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return { account, events };
}

// ------------------------------------------------------------------------------
// Data untuk dropdown bertingkat (kabupaten -> kecamatan -> desa)
// ------------------------------------------------------------------------------

export interface VillageOption {
  id: string;
  name: string;
  district: string;
  regency: string;
  hasAccount: boolean;
}

export async function listRegenciesAction(): Promise<string[]> {
  await requireDisbudparekraf();
  const res = await query<any>(
    `SELECT DISTINCT regency FROM tourist_villages ORDER BY regency ASC`
  );
  return res.rows.map((r) => r.regency as string);
}

export async function listDistrictsAction(regency: string): Promise<string[]> {
  await requireDisbudparekraf();
  if (!regency) return [];
  const res = await query<any>(
    `SELECT DISTINCT district FROM tourist_villages WHERE regency = $1 ORDER BY district ASC`,
    [regency]
  );
  return res.rows.map((r) => r.district as string);
}

/**
 * Desa wisata pada satu kecamatan. Desa yang sudah punya akun tetap ditampilkan
 * tetapi ditandai `hasAccount` agar dropdown bisa menonaktifkannya.
 */
export async function listVillagesForAccountAction(
  regency: string,
  district: string
): Promise<VillageOption[]> {
  await requireDisbudparekraf();
  if (!regency || !district) return [];
  const res = await query<any>(
    `SELECT tv.id, tv.name, tv.district, tv.regency,
            EXISTS (
              SELECT 1 FROM users u WHERE u.village_id = tv.id AND u.role = 'desa'
            ) AS has_account
       FROM tourist_villages tv
      WHERE tv.regency = $1 AND tv.district = $2
      ORDER BY tv.name ASC`,
    [regency, district]
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    district: r.district,
    regency: r.regency,
    hasAccount: Boolean(r.has_account),
  }));
}

// ------------------------------------------------------------------------------
// Buat akun + kirim undangan aktivasi
// ------------------------------------------------------------------------------

export interface CreateVillageAccountInput {
  villageId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface VillageAccountActionResult {
  success: boolean;
  message?: string;
  /** Hanya terisi di mode demo (tanpa SMTP) agar tautan bisa diuji. */
  devLink?: string;
  userId?: string;
  expiresAt?: string;
}

/** Username internal unik dari slug desa. */
async function buildVillageUsername(slug: string): Promise<string> {
  const base =
    `desa-${slug}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'desa-wisata';

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Terbitkan token undangan lalu siapkan tautan aktivasi langsung. */
async function sendInvitation(
  userId: string,
  _email: string,
  _fullName: string,
  _villageName: string
): Promise<{ devLink?: string; expiresAt: Date }> {
  const { token, expiresAt } = await issueAuthToken(userId, 'UNDANGAN_AKTIVASI');
  const baseUrl = await getRequestBaseUrl();
  const actionUrl = `${baseUrl}/aktivasi?token=${token}`;

  return { devLink: actionUrl, expiresAt };
}

export async function createVillageAccountAction(
  input: CreateVillageAccountInput
): Promise<VillageAccountActionResult> {
  let session: SessionUser;
  try {
    session = await requireDisbudparekraf();
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const villageId = (input.villageId || '').trim();
  const fullName = (input.fullName || '').trim();
  const email = (input.email || '').trim().toLowerCase();
  const phone = (input.phone || '').trim();

  if (!villageId) return { success: false, message: 'Pilih desa wisata terlebih dahulu.' };
  if (!fullName) return { success: false, message: 'Nama lengkap pengelola wajib diisi.' };
  if (!isValidEmail(email)) return { success: false, message: 'Masukkan email pengelola yang valid.' };
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) {
    return { success: false, message: 'Masukkan nomor WhatsApp yang valid (contoh 081234567890).' };
  }

  // 1. Desa harus benar-benar terdaftar.
  const villageRes = await query<any>(
    `SELECT id, name, slug, regency, district FROM tourist_villages WHERE id = $1 LIMIT 1`,
    [villageId]
  );
  if (villageRes.rows.length === 0) {
    return { success: false, message: 'Desa wisata tidak ditemukan.' };
  }
  const village = villageRes.rows[0];

  // 2. Satu desa satu akun pengelola utama.
  const existingAccount = await query<any>(
    `SELECT id, email FROM users WHERE village_id = $1 AND role = 'desa' LIMIT 1`,
    [villageId]
  );
  if (existingAccount.rows.length > 0) {
    return {
      success: false,
      message: `${village.name} sudah memiliki akun pengelola (${existingAccount.rows[0].email || 'tanpa email'}). Satu desa hanya boleh punya satu akun utama.`,
    };
  }

  // 3. Email belum dipakai akun lain.
  const emailTaken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (emailTaken.length > 0) {
    return { success: false, message: 'Email tersebut sudah dipakai akun lain.' };
  }

  try {
    const username = await buildVillageUsername(village.slug);
    // Kata sandi sementara tidak pernah dipakai: akun NONAKTIF sampai pengelola
    // menetapkan kata sandinya sendiri lewat tautan undangan.
    const placeholderHash = hashPassword(
      `belum-aktif-${Math.random().toString(36).slice(2)}-${Date.now()}`
    );

    const [created] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash: placeholderHash,
        role: 'desa',
        villageId,
        fullName,
        phone,
        regency: village.regency,
        status: 'NONAKTIF',
        approvalStatus: 'DISETUJUI',
        emailVerifiedAt: null,
        activatedAt: null,
        mustChangePassword: false,
        createdBy: session.id,
      })
      .returning({ id: users.id });

    const { devLink, expiresAt } = await sendInvitation(
      created.id,
      email,
      fullName,
      village.name
    );

    revalidatePath('/disbudparekraf/akun');
    revalidatePath('/disbudparekraf');

    return {
      success: true,
      message: 'Akun dibuat dan undangan aktivasi dikirim.',
      userId: created.id,
      devLink,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (err: any) {
    console.error('[createVillageAccountAction]', err);
    return { success: false, message: 'Gagal membuat akun desa. Coba lagi.' };
  }
}

// ------------------------------------------------------------------------------
// Kirim ulang undangan
// ------------------------------------------------------------------------------

export async function resendInvitationAction(
  userId: string
): Promise<VillageAccountActionResult> {
  try {
    await requireDisbudparekraf();
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const res = await query<any>(
    `SELECT u.id, u.email, u.full_name, u.status, u.email_verified_at, tv.name AS village_name
       FROM users u
       JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE u.id = $1 AND u.role = 'desa'
      LIMIT 1`,
    [userId]
  );

  if (res.rows.length === 0) {
    return { success: false, message: 'Akun desa tidak ditemukan.' };
  }
  const row = res.rows[0];
  if (!row.email) {
    return { success: false, message: 'Akun ini tidak punya alamat email tujuan.' };
  }
  if (row.status === 'AKTIF') {
    return { success: false, message: 'Akun sudah aktif; undangan tidak diperlukan.' };
  }

  try {
    // issueAuthToken otomatis menghanguskan undangan lama yang belum terpakai.
    const { devLink, expiresAt } = await sendInvitation(
      row.id,
      row.email,
      row.full_name,
      row.village_name
    );

    revalidatePath('/disbudparekraf/akun');
    revalidatePath(`/disbudparekraf/akun/${userId}`);

    return {
      success: true,
      message: `Undangan baru dikirim ke ${row.email}.`,
      devLink,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (err: any) {
    console.error('[resendInvitationAction]', err);
    return { success: false, message: 'Gagal mengirim ulang undangan.' };
  }
}

// ------------------------------------------------------------------------------
// Aktifkan / nonaktifkan akun (bisa dibalik)
// ------------------------------------------------------------------------------

export async function setVillageAccountStatusAction(
  userId: string,
  next: 'AKTIF' | 'NONAKTIF'
): Promise<VillageAccountActionResult> {
  try {
    await requireDisbudparekraf();
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const res = await query<any>(
    `SELECT id, status, email_verified_at FROM users WHERE id = $1 AND role = 'desa' LIMIT 1`,
    [userId]
  );
  if (res.rows.length === 0) {
    return { success: false, message: 'Akun desa tidak ditemukan.' };
  }
  const row = res.rows[0];

  if (next === 'AKTIF' && !row.email_verified_at) {
    return {
      success: false,
      message: 'Akun belum pernah diaktivasi pengelola. Kirim ulang undangan terlebih dahulu.',
    };
  }

  try {
    if (next === 'NONAKTIF') {
      await query(
        `UPDATE users SET status = 'NONAKTIF', deactivated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [userId]
      );
    } else {
      await query(
        `UPDATE users SET status = 'AKTIF', deactivated_at = NULL WHERE id = $1`,
        [userId]
      );
    }

    revalidatePath('/disbudparekraf/akun');
    revalidatePath(`/disbudparekraf/akun/${userId}`);

    return {
      success: true,
      message: next === 'NONAKTIF' ? 'Akun dinonaktifkan.' : 'Akun diaktifkan kembali.',
    };
  } catch (err: any) {
    console.error('[setVillageAccountStatusAction]', err);
    return { success: false, message: 'Gagal mengubah status akun.' };
  }
}

// ------------------------------------------------------------------------------
// Ubah informasi akun (nama pengelola, email, WhatsApp)
// ------------------------------------------------------------------------------

export interface UpdateVillageAccountInput {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
}

export async function updateVillageAccountAction(
  input: UpdateVillageAccountInput
): Promise<VillageAccountActionResult> {
  try {
    await requireDisbudparekraf();
  } catch (err: any) {
    return { success: false, message: err.message };
  }

  const fullName = (input.fullName || '').trim();
  const email = (input.email || '').trim().toLowerCase();
  const phone = (input.phone || '').trim();

  if (!fullName) return { success: false, message: 'Nama lengkap pengelola wajib diisi.' };
  if (!isValidEmail(email)) return { success: false, message: 'Masukkan email pengelola yang valid.' };
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) {
    return { success: false, message: 'Masukkan nomor WhatsApp yang valid.' };
  }

  const emailTaken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (emailTaken.length > 0 && emailTaken[0].id !== input.userId) {
    return { success: false, message: 'Email tersebut sudah dipakai akun lain.' };
  }

  try {
    await db
      .update(users)
      .set({ fullName, email, phone })
      .where(and(eq(users.id, input.userId), eq(users.role, 'desa')));

    revalidatePath('/disbudparekraf/akun');
    revalidatePath(`/disbudparekraf/akun/${input.userId}`);

    return { success: true, message: 'Informasi akun diperbarui.' };
  } catch (err: any) {
    console.error('[updateVillageAccountAction]', err);
    return { success: false, message: 'Gagal memperbarui informasi akun.' };
  }
}

// ------------------------------------------------------------------------------
// Aktivasi akun oleh pengelola desa (halaman publik /aktivasi)
// ------------------------------------------------------------------------------

export interface ActivationPreview {
  valid: boolean;
  email?: string;
  fullName?: string;
  villageName?: string;
  expiresAt?: string;
  message?: string;
}

export async function checkActivationToken(token: string): Promise<ActivationPreview> {
  if (!token) {
    return { valid: false, message: 'Tautan aktivasi tidak lengkap.' };
  }

  const peek = await peekAuthToken(token, 'UNDANGAN_AKTIVASI');
  if (!peek) {
    return {
      valid: false,
      message: 'Tautan aktivasi tidak berlaku lagi. Minta Disbudparekraf mengirim ulang undangan.',
    };
  }

  const res = await query<any>(
    `SELECT u.email, u.full_name, u.status, tv.name AS village_name
       FROM users u
       LEFT JOIN tourist_villages tv ON tv.id = u.village_id
      WHERE u.id = $1
      LIMIT 1`,
    [peek.userId]
  );

  if (res.rows.length === 0) {
    return { valid: false, message: 'Akun pada tautan ini tidak ditemukan.' };
  }
  const row = res.rows[0];

  return {
    valid: true,
    email: row.email,
    fullName: row.full_name,
    villageName: row.village_name,
    expiresAt: peek.expiresAt.toISOString(),
  };
}

export async function activateVillageAccountAction(
  token: string,
  password: string,
  confirmPassword: string
): Promise<VillageAccountActionResult> {
  if (!token) {
    return { success: false, message: 'Tautan aktivasi tidak lengkap.' };
  }

  const check = validateNewPassword(password);
  if (!check.valid) return { success: false, message: check.message };
  if (password !== confirmPassword) {
    return { success: false, message: 'Konfirmasi kata sandi tidak cocok.' };
  }

  const consumed = await consumeAuthToken(token, 'UNDANGAN_AKTIVASI');
  if (!consumed) {
    return {
      success: false,
      message: 'Tautan aktivasi tidak berlaku lagi. Minta Disbudparekraf mengirim ulang undangan.',
    };
  }

  try {
    await db
      .update(users)
      .set({
        passwordHash: hashPassword(password),
        status: 'AKTIF',
        emailVerifiedAt: new Date(),
        activatedAt: new Date(),
        deactivatedAt: null,
        mustChangePassword: false,
      })
      .where(eq(users.id, consumed.userId));

    return {
      success: true,
      message: 'Akun berhasil diaktifkan. Silakan masuk dengan email dan kata sandi baru Anda.',
    };
  } catch (err: any) {
    console.error('[activateVillageAccountAction]', err);
    return { success: false, message: 'Gagal mengaktifkan akun. Coba lagi.' };
  }
}
