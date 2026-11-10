// ==============================================================================
// DEWI JATENG - Village Grant Allocation Server Actions
// Simpan pagu anggaran bantuan keuangan desa wisata (total_allocated & sumber dana)
// ==============================================================================

'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GrantAllocationInput {
  villageId: string;
  fiscalYear: number;
  totalAllocated: number;
  fundingSource?: string;
  /** Rincian sumber dana. Bila ketiganya diisi, totalAllocated dihitung ulang dari jumlahnya. */
  apbdesAmount?: number;
  banprovAmount?: number;
  padesAmount?: number;
}

function toAmount(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

/**
 * Simpan pagu anggaran. Menolak bila pagu baru lebih kecil dari realisasi tersimpan,
 * agar sisa saldo tidak pernah negatif karena kesalahan input.
 */
export async function updateGrantAllocationAction(
  input: GrantAllocationInput
): Promise<
  ActionResponse<{
    grantId: string;
    villageId: string;
    fiscalYear: number;
    apbdesAmount: number;
    banprovAmount: number;
    padesAmount: number;
    totalAllocated: number;
    totalRealized: number;
    remainingBalance: number;
  }>
> {
  try {
    const villageId = (input.villageId || '').trim();
    const fiscalYear = Number(input.fiscalYear);

    const hasBreakdown =
      input.apbdesAmount != null ||
      input.banprovAmount != null ||
      input.padesAmount != null;

    const apbdesAmount = toAmount(input.apbdesAmount);
    const banprovAmount = toAmount(input.banprovAmount);
    const padesAmount = toAmount(input.padesAmount);

    // Bila rincian sumber dana dikirim, total dihitung dari jumlahnya agar konsisten.
    const totalAllocated = hasBreakdown
      ? apbdesAmount + banprovAmount + padesAmount
      : Number(input.totalAllocated);

    if (!villageId) {
      throw new Error('Desa wisata wajib dipilih');
    }
    if (!Number.isFinite(fiscalYear) || fiscalYear < 2000) {
      throw new Error('Tahun anggaran tidak valid');
    }
    if (!Number.isFinite(totalAllocated) || totalAllocated < 0) {
      throw new Error('Total pendanaan tidak boleh negatif');
    }

    const existing = await query<{
      id: string;
      total_realized: string;
      funding_source: string;
    }>(
      `SELECT id, total_realized, funding_source
       FROM village_grants
       WHERE village_id = $1 AND fiscal_year = $2
       LIMIT 1`,
      [villageId, fiscalYear]
    );

    const totalRealized = existing.rows.length > 0 ? parseInt(existing.rows[0].total_realized, 10) || 0 : 0;

    if (totalAllocated < totalRealized) {
      throw new Error(
        `Total pendanaan (Rp${totalAllocated.toLocaleString('id-ID')}) tidak boleh lebih kecil dari realisasi tersimpan (Rp${totalRealized.toLocaleString('id-ID')})`
      );
    }

    const fundingSource =
      (input.fundingSource || '').trim() ||
      existing.rows[0]?.funding_source ||
      `Bantuan Keuangan Pemprov Jateng TA ${fiscalYear}`;
    const remainingBalance = totalAllocated - totalRealized;

    const res = await query<{ id: string }>(
      `INSERT INTO village_grants (
         village_id, fiscal_year, funding_source,
         apbdes_amount, banprov_amount, pades_amount, total_allocated,
         total_realized, remaining_balance, lpj_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_UPLOAD')
       ON CONFLICT (village_id, fiscal_year) DO UPDATE SET
         funding_source = EXCLUDED.funding_source,
         apbdes_amount = EXCLUDED.apbdes_amount,
         banprov_amount = EXCLUDED.banprov_amount,
         pades_amount = EXCLUDED.pades_amount,
         total_allocated = EXCLUDED.total_allocated,
         remaining_balance = EXCLUDED.remaining_balance
       RETURNING id`,
      [
        villageId,
        fiscalYear,
        fundingSource,
        apbdesAmount,
        banprovAmount,
        padesAmount,
        totalAllocated,
        totalRealized,
        remainingBalance,
      ]
    );

    try {
      revalidatePath('/pengelola');
      revalidatePath('/pengelola/anggaran');
      revalidatePath('/transparansi');
      revalidatePath('/');
    } catch {
      // Abaikan di luar context request Next.js
    }

    return {
      success: true,
      data: {
        grantId: res.rows[0].id,
        villageId,
        fiscalYear,
        apbdesAmount,
        banprovAmount,
        padesAmount,
        totalAllocated,
        totalRealized,
        remainingBalance,
      },
    };
  } catch (error: any) {
    console.error('[updateGrantAllocationAction Error]:', error);
    return { success: false, error: error.message || 'Gagal menyimpan pagu anggaran' };
  }
}
