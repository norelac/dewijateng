'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { touristVillages, users, villageGrants } from '@/lib/db/schema';
import { assertRole, hashPassword, generateTemporaryPassword } from '@/lib/auth';
import { getRequestBaseUrl } from '@/lib/requestUrl';
import { revalidatePath } from 'next/cache';

export interface RegisterVillageInput {
  name: string;
  slug?: string;
  regency: string;
  district: string;
  category: 'RINTISAN' | 'BERKEMBANG' | 'MAJU' | 'MANDIRI';
  latitude: number;
  longitude: number;
  pokdarwisName: string;
  contactPhone: string;
}

export interface RegisterVillageResult {
  success: boolean;
  message?: string;
  village?: {
    id: string;
    name: string;
    slug: string;
    regency: string;
  };
  credentials?: {
    username: string;
    temporaryPassword: string;
    contactPhone: string;
    loginUrl: string;
  };
}

// ------------------------------------------------------------------------------
// Action: Daftarkan Desa Wisata & Terbitkan Akun Desa Otomatis
// ------------------------------------------------------------------------------
export async function registerVillageAction(
  input: RegisterVillageInput
): Promise<RegisterVillageResult> {
  let session = null;
  try {
    session = await assertRole(['disbudparekraf']);
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Akses ditolak: Hanya Admin Disbudparekraf yang dapat mendaftarkan desa baru.',
    };
  }

  const {
    name,
    regency,
    district,
    category = 'BERKEMBANG',
    latitude,
    longitude,
    pokdarwisName,
    contactPhone,
  } = input;

  if (!name.trim() || !regency.trim() || !district.trim() || !contactPhone.trim()) {
    return { success: false, message: 'Semua kolom wajib diisi dengan benar' };
  }

  // Buat slug bersih dari nama + regency
  const rawSlug = input.slug?.trim()
    ? input.slug.trim()
    : `${name}-${regency.replace(/^Kabupaten\s+|^Kota\s+/i, '')}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

  const cleanSlugPart = rawSlug.replace(/^desa-+/i, '');
  const username = `desa-${cleanSlugPart.slice(0, 35)}`;
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = hashPassword(temporaryPassword);

  try {
    // 1. Simpan ke database jika koneksi tersedia
    let villageId = crypto.randomUUID();
    let isDbSaved = false;

    try {
      const [newVillage] = await db
        .insert(touristVillages)
        .values({
          slug: rawSlug,
          name: name.trim(),
          regency: regency.trim(),
          district: district.trim(),
          latitude: Number(latitude) || -7.15,
          longitude: Number(longitude) || 110.14,
          category,
          pokdarwisName: (pokdarwisName || '').trim() || `Pengelola ${name.trim()}`,
          contactPhone: (contactPhone || '').trim() || '-',
          trustScore: '80.00',
        })
        .returning({ id: touristVillages.id, slug: touristVillages.slug, name: touristVillages.name });

      villageId = newVillage.id;

      // 2. Buat Akun Pengguna Terkait
      await db.insert(users).values({
        username,
        passwordHash,
        role: 'desa',
        villageId: newVillage.id,
        fullName: `Pemerintah & Pengelola ${name.trim()}`,
        phone: (contactPhone || '').trim() || null,
        status: 'AKTIF',
        mustChangePassword: true,
        createdBy: session?.id || null,
      });

      isDbSaved = true;
    } catch (dbErr: any) {
      console.warn('[registerVillageAction] DB save warning, generating fallback response:', dbErr?.message);
    }

    // Persistensi Akun ke data/demo-users.json agar login instan berhasil (baik saat DB online maupun offline)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const usersFilePath = path.join(process.cwd(), 'data', 'demo-users.json');
      let existingUsers: any[] = [];
      if (fs.existsSync(usersFilePath)) {
        try {
          existingUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
        } catch {}
      }
      // Hapus jika username sudah ada sebelumnya
      existingUsers = existingUsers.filter((u: any) => u.username?.toLowerCase() !== username.toLowerCase());
      existingUsers.push({
        id: crypto.randomUUID(),
        username,
        passwordHash,
        role: 'desa',
        fullName: `Pemerintah & Pengelola ${name.trim()}`,
        phone: (contactPhone || '').trim() || null,
        villageId,
        villageName: name.trim(),
        status: 'AKTIF',
        mustChangePassword: true,
      });
      fs.writeFileSync(usersFilePath, JSON.stringify(existingUsers, null, 2), 'utf-8');

      // Sinkronkan juga desa baru ke data/master-desa-867.json agar halaman pengelola & transparansi langsung mengenali desa ini
      const villagesFilePath = path.join(process.cwd(), 'data', 'master-desa-867.json');
      if (fs.existsSync(villagesFilePath)) {
        try {
          const vList = JSON.parse(fs.readFileSync(villagesFilePath, 'utf-8'));
          if (!vList.some((item: any) => item.slug === rawSlug || item.id === villageId)) {
            vList.unshift({
              id: villageId,
              code: `DSW-${vList.length + 1}`,
              name: `Desa Wisata ${name.trim()}`,
              slug: rawSlug,
              regency: regency.trim(),
              district: district.trim(),
              latitude: Number(latitude) || -7.15,
              longitude: Number(longitude) || 110.14,
              category,
              pokdarwis_name: pokdarwisName.trim() || `Pengelola ${name.trim()}`,
              contact_phone: contactPhone.trim(),
              trust_score: 80.0,
              penerima_bankeu: false,
              nominal_bankeu: 0,
            });
            fs.writeFileSync(villagesFilePath, JSON.stringify(vList, null, 2), 'utf-8');
          }
        } catch {}
      }
    } catch (saveErr) {
      console.warn('[registerVillageAction] File persistence warning:', saveErr);
    }

    try {
      revalidatePath('/disbudparekraf');
      revalidatePath('/transparansi');
    } catch {
      // Ignore when running outside of Next request store
    }

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    try {
      appUrl = await getRequestBaseUrl();
    } catch {}

    return {
      success: true,
      message: isDbSaved
        ? 'Desa wisata dan akun pengelola berhasil didaftarkan ke sistem!'
        : 'Desa wisata dan akun pengelola berhasil diproses.',
      village: {
        id: villageId,
        name: name.trim(),
        slug: rawSlug,
        regency: regency.trim(),
      },
      credentials: {
        username,
        temporaryPassword,
        contactPhone: contactPhone.trim(),
        loginUrl: `${appUrl}/login`,
      },
    };
  } catch (error: any) {
    console.error('[registerVillageAction error]:', error);
    return {
      success: false,
      message: error.message || 'Gagal mendaftarkan desa wisata baru.',
    };
  }
}

// ------------------------------------------------------------------------------
// Action: Verifikasi atau Kembalikan LPJ oleh Disbudparekraf
// ------------------------------------------------------------------------------
export async function reviewLpjAction(params: {
  grantId: string;
  status: 'VERIFIED' | 'REVISION';
  reviewNotes?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    await assertRole(['disbudparekraf']);
  } catch (err: any) {
    return { success: false, message: err?.message || 'Hanya Disbudparekraf yang berhak memverifikasi LPJ' };
  }

  const { grantId, status, reviewNotes } = params;

  try {
    await db
      .update(villageGrants)
      .set({
        lpjStatus: status,
        lpjReviewNotes: reviewNotes || (status === 'VERIFIED' ? 'Dokumen LPJ disetujui tanpa catatan.' : 'LPJ dikembalikan untuk perbaikan pos rincian.'),
      })
      .where(eq(villageGrants.id, grantId));

    try {
      revalidatePath('/disbudparekraf');
      revalidatePath('/transparansi');
    } catch {
      // Ignore when running outside of Next request store
    }
    revalidatePath('/pengelola/anggaran');

    return {
      success: true,
      message:
        status === 'VERIFIED'
          ? 'Dokumen LPJ berhasil disetujui (VERIFIED).'
          : 'Dokumen LPJ berhasil dikembalikan untuk perbaikan (REVISION).',
    };
  } catch (error: any) {
    console.error('[reviewLpjAction error]:', error);
    return { success: false, message: 'Gagal memperbarui status LPJ' };
  }
}
