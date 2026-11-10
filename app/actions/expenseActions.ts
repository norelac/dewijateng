// ==============================================================================
// DEWI JATENG - Grant Expense Server Actions
// CRUD pos belanja LPJ + audit anomali SSH + rekalkulasi Trust Score desa
// ==============================================================================

'use server';

import { pool, query } from '@/lib/db';
import { matchAndCheckSSH } from '@/lib/services/priceAnomalyChecker';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExpenseInput {
  grantId: string;
  activityName: string;
  category?: string;
  volume: number;
  unit?: string;
  claimedUnitPrice: number;
  budgetAllocated?: number;
  amountRealized?: number;
}

interface NormalizedExpense {
  activityName: string;
  category: string;
  volume: number;
  unit: string;
  claimedUnitPrice: number;
  budgetAllocated: number;
  amountRealized: number;
}

function normalizeInput(input: ExpenseInput): NormalizedExpense {
  const activityName = (input.activityName || '').trim();
  const volume = Number(input.volume);
  const claimedUnitPrice = Number(input.claimedUnitPrice);

  if (!input.grantId || !input.grantId.trim()) {
    throw new Error('ID bantuan (grantId) wajib disertakan');
  }
  if (activityName.length < 3) {
    throw new Error('Nama kegiatan minimal 3 karakter');
  }
  if (!Number.isFinite(volume) || volume <= 0) {
    throw new Error('Volume harus lebih besar dari 0');
  }
  if (!Number.isFinite(claimedUnitPrice) || claimedUnitPrice < 0) {
    throw new Error('Harga satuan tidak boleh negatif');
  }

  const computedAmount = Math.round(volume * claimedUnitPrice);
  const amountRealized =
    input.amountRealized != null && Number(input.amountRealized) >= 0
      ? Math.round(Number(input.amountRealized))
      : computedAmount;

  const budgetAllocated =
    input.budgetAllocated != null && Number(input.budgetAllocated) >= 0
      ? Math.round(Number(input.budgetAllocated))
      : amountRealized;

  return {
    activityName,
    category: (input.category || 'MATERIAL_FISIK').trim() || 'MATERIAL_FISIK',
    volume,
    unit: (input.unit || 'unit').trim() || 'unit',
    claimedUnitPrice: Math.round(claimedUnitPrice),
    budgetAllocated,
    amountRealized,
  };
}

/** Ambil desa & kabupaten dari grant agar pencocokan SSH memakai acuan yang tepat. */
async function loadGrantContext(grantId: string): Promise<{ villageId: string; regency: string }> {
  const res = await query<{ village_id: string; regency: string }>(
    `SELECT vg.village_id, tv.regency
     FROM village_grants vg
     JOIN tourist_villages tv ON tv.id = vg.village_id
     WHERE vg.id = $1
     LIMIT 1`,
    [grantId]
  );

  if (res.rows.length === 0) {
    throw new Error('Bantuan keuangan tidak ditemukan');
  }

  return { villageId: res.rows[0].village_id, regency: res.rows[0].regency };
}

/** Sinkronkan total_realized & remaining_balance grant dari seluruh pos belanja. */
async function syncGrantTotals(client: any, grantId: string): Promise<void> {
  await client.query(
    `UPDATE village_grants vg
     SET total_realized = COALESCE((
           SELECT SUM(ge.amount_realized) FROM grant_expenses ge WHERE ge.grant_id = vg.id
         ), 0),
         remaining_balance = vg.total_allocated - COALESCE((
           SELECT SUM(ge.amount_realized) FROM grant_expenses ge WHERE ge.grant_id = vg.id
         ), 0)
     WHERE vg.id = $1`,
    [grantId]
  );
}

async function recalcTrust(villageId: string): Promise<void> {
  try {
    await calculateVillageTrustScore(villageId);
  } catch (err) {
    console.warn(`[TrustScore Recalc Warning for village ${villageId}]:`, err);
  }
}

function revalidateAll(): void {
  try {
    revalidatePath('/pengelola');
    revalidatePath('/pengelola/pengeluaran');
    revalidatePath('/transparansi');
    revalidatePath('/');
  } catch {
    // Abaikan di luar context request Next.js
  }
}

/** Tambah pos belanja baru. */
export async function createExpenseAction(input: ExpenseInput): Promise<ActionResponse<{ id: string }>> {
  try {
    const data = normalizeInput(input);
    const { villageId, regency } = await loadGrantContext(input.grantId);

    const evaluation = await matchAndCheckSSH(data.activityName, data.claimedUnitPrice, regency);

    const client = await pool.connect();
    let id = '';
    try {
      await client.query('BEGIN');
      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO grant_expenses (
           grant_id, activity_name, category, volume, unit,
           claimed_unit_price, budget_allocated, amount_realized,
           remaining_amount, ai_anomaly_flag, anomaly_note
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          input.grantId,
          data.activityName,
          data.category,
          data.volume,
          data.unit,
          data.claimedUnitPrice,
          data.budgetAllocated,
          data.amountRealized,
          Math.max(0, data.budgetAllocated - data.amountRealized),
          evaluation.isAnomaly,
          evaluation.note,
        ]
      );
      id = insertRes.rows[0].id;
      await syncGrantTotals(client, input.grantId);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await recalcTrust(villageId);
    revalidateAll();

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error('[createExpenseAction Error]:', error);
    return { success: false, error: error.message || 'Gagal menambah pengeluaran' };
  }
}

/** Ubah pos belanja yang sudah ada. */
export async function updateExpenseAction(
  expenseId: string,
  input: ExpenseInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!expenseId || !expenseId.trim()) {
      throw new Error('ID pengeluaran wajib disertakan');
    }
    const data = normalizeInput(input);
    const { villageId, regency } = await loadGrantContext(input.grantId);

    const evaluation = await matchAndCheckSSH(data.activityName, data.claimedUnitPrice, regency);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updateRes = await client.query(
        `UPDATE grant_expenses
         SET grant_id = $2, activity_name = $3, category = $4, volume = $5, unit = $6,
             claimed_unit_price = $7, budget_allocated = $8, amount_realized = $9,
             remaining_amount = $10, ai_anomaly_flag = $11, anomaly_note = $12
         WHERE id = $1
         RETURNING id`,
        [
          expenseId,
          input.grantId,
          data.activityName,
          data.category,
          data.volume,
          data.unit,
          data.claimedUnitPrice,
          data.budgetAllocated,
          data.amountRealized,
          Math.max(0, data.budgetAllocated - data.amountRealized),
          evaluation.isAnomaly,
          evaluation.note,
        ]
      );
      if (updateRes.rows.length === 0) {
        throw new Error('Pos belanja tidak ditemukan');
      }
      await syncGrantTotals(client, input.grantId);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await recalcTrust(villageId);
    revalidateAll();

    return { success: true, data: { id: expenseId } };
  } catch (error: any) {
    console.error('[updateExpenseAction Error]:', error);
    return { success: false, error: error.message || 'Gagal mengubah pengeluaran' };
  }
}

/** Hapus pos belanja. */
export async function deleteExpenseAction(expenseId: string): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!expenseId || !expenseId.trim()) {
      throw new Error('ID pengeluaran wajib disertakan');
    }

    const ownerRes = await query<{ grant_id: string }>(
      `SELECT grant_id FROM grant_expenses WHERE id = $1 LIMIT 1`,
      [expenseId]
    );
    if (ownerRes.rows.length === 0) {
      throw new Error('Pos belanja tidak ditemukan');
    }
    const grantId = ownerRes.rows[0].grant_id;
    const { villageId } = await loadGrantContext(grantId);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM grant_expenses WHERE id = $1`, [expenseId]);
      await syncGrantTotals(client, grantId);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await recalcTrust(villageId);
    revalidateAll();

    return { success: true, data: { id: expenseId } };
  } catch (error: any) {
    console.error('[deleteExpenseAction Error]:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengeluaran' };
  }
}
