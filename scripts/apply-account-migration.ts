// ==============================================================================
// Migrasi Fase 3 (akun desa wisata) — idempotent, aman dijalankan berulang.
//
// - `users.deactivated_at` untuk mencatat kapan akun dinonaktifkan dinas,
//   sekaligus membedakan "Nonaktif" dari "Menunggu aktivasi".
// - Backfill `activated_at` untuk akun desa yang sudah aktif sebelum kolom ini
//   dipakai sebagai penanda aktivasi (mis. desa-candirejo).
//
// Jalankan: npx tsx scripts/apply-account-migration.ts
// ==============================================================================

import { pool } from '../lib/db';

const STATEMENTS: string[] = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE`,
  `UPDATE users SET activated_at = COALESCE(activated_at, email_verified_at, created_at)
     WHERE role = 'desa' AND status = 'AKTIF' AND activated_at IS NULL`,
];

async function run() {
  const client = await pool.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
    }
    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );
    console.log('✅ Migrasi akun desa selesai.');
    console.log('   Kolom users:', cols.rows.map((r) => r.column_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('❌ Migrasi gagal:', err);
  process.exit(1);
});
