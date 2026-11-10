// ==============================================================================
// Migrasi Fase 4 (monitoring keuangan) - idempotent, aman dijalankan berulang.
//
// - `village_transactions`: transaksi pemasukan/pengeluaran desa wisata.
// - `village_opening_balances`: saldo awal per periode (YYYY-MM).
//
// Jalankan: npx tsx scripts/apply-finance-migration.ts
// ==============================================================================

import { pool } from '../lib/db';

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS village_transactions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
     type VARCHAR(12) CHECK (type IN ('PEMASUKAN', 'PENGELUARAN')) NOT NULL,
     reference_code VARCHAR(32) UNIQUE NOT NULL,
     title VARCHAR(200) NOT NULL,
     category VARCHAR(60) NOT NULL,
     transaction_date DATE NOT NULL,
     amount BIGINT NOT NULL CHECK (amount >= 0),
     payment_method VARCHAR(120),
     counterparty VARCHAR(200),
     note TEXT,
     proof_file_name VARCHAR(200),
     proof_file_size_kb INTEGER,
     proof_uploaded_by VARCHAR(120),
     recorded_by VARCHAR(120) NOT NULL,
     recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_village_transactions_village
     ON village_transactions(village_id, transaction_date)`,
  `CREATE INDEX IF NOT EXISTS idx_village_transactions_period
     ON village_transactions(transaction_date)`,
  `CREATE TABLE IF NOT EXISTS village_opening_balances (
     village_id UUID NOT NULL REFERENCES tourist_villages(id) ON DELETE CASCADE,
     period VARCHAR(7) NOT NULL,
     amount BIGINT NOT NULL DEFAULT 0,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
     PRIMARY KEY (village_id, period)
   )`,
];

async function run() {
  const client = await pool.connect();
  try {
    for (const sql of STATEMENTS) {
      await client.query(sql);
    }
    const cols = await client.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_name IN ('village_transactions', 'village_opening_balances')
        ORDER BY table_name`
    );
    console.log('OK. Migrasi keuangan desa selesai.');
    console.log('   Tabel:', cols.rows.map((r) => r.table_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});
