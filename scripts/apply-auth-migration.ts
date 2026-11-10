// ==============================================================================
// Migrasi Fase 1 (autentikasi) — idempotent, aman dijalankan berulang.
// Menambah kolom profil & persetujuan pada tabel users, tabel auth_tokens,
// serta mengisi email/status verifikasi akun demo yang sudah ada.
//
// Jalankan: npx tsx scripts/apply-auth-migration.ts
// ==============================================================================

import { pool } from '../lib/db';

const STATEMENTS: string[] = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS nip VARCHAR(30)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS institution VARCHAR(150)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS regency VARCHAR(100)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'DISETUJUI'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE`,
  `UPDATE users SET approval_status = 'DISETUJUI' WHERE approval_status IS NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE TABLE IF NOT EXISTS auth_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) CHECK (type IN ('VERIFIKASI_EMAIL', 'UNDANGAN_AKTIVASI', 'RESET_SANDI')) NOT NULL,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash)`,
  // Email + status verifikasi akun demo (sesuai docker/seed-demo.sql).
  `UPDATE users SET email = 'disbudparekraf@jatengprov.go.id',
      approval_status = 'DISETUJUI', email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
    WHERE username = 'disbudparekraf' AND email IS NULL`,
  `UPDATE users SET email = 'desa-candirejo@jatengprov.go.id',
      approval_status = 'DISETUJUI', email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
    WHERE username = 'desa-candirejo' AND email IS NULL`,
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
    console.log('✅ Migrasi autentikasi selesai.');
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
