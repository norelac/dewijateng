import fs from 'fs';
import path from 'path';
import { pool } from '../lib/db';

async function runSeed() {
  console.log('🚀 Memulai proses seeding data riil ke PostgreSQL...\n');
  let client;
  try {
    client = await pool.connect();
    console.log('🔌 Berhasil terhubung ke database PostgreSQL!\n');

    // 1. Seed 867 Desa & Hibah
    const villagesSqlPath = path.join(process.cwd(), 'docker', 'seed-villages-867.sql');
    if (fs.existsSync(villagesSqlPath)) {
      console.log('📦 Mengimpor 867 desa wisata & 107 penerima bankeu...');
      const sql1 = fs.readFileSync(villagesSqlPath, 'utf-8');
      await client.query(sql1);
      console.log('✅ 867 Desa Wisata & Hibah Bankeu berhasil di-seed!\n');
    }

    // 2. Seed 1.061 HSD Mas Petruk 2026
    const hsdSqlPath = path.join(process.cwd(), 'docker', 'seed-hsd-2026.sql');
    if (fs.existsSync(hsdSqlPath)) {
      console.log('📦 Mengimpor 1.061 HSD MAS PETRUK 2026 acuan harga...');
      const sql2 = fs.readFileSync(hsdSqlPath, 'utf-8');
      await client.query(sql2);
      console.log('✅ 1.061 HSD Acuan Harga berhasil di-seed!\n');
    }

    // 3. Seed Demo Users & Initial Reports
    const demoSqlPath = path.join(process.cwd(), 'docker', 'seed-demo.sql');
    if (fs.existsSync(demoSqlPath)) {
      console.log('📦 Mengonfigurasi akun pengguna (Disbudparekraf & Candirejo) serta laporan contoh...');
      const sql3 = fs.readFileSync(demoSqlPath, 'utf-8');
      await client.query(sql3);
      console.log('✅ Akun demo dan laporan awal berhasil di-seed!\n');
    }

    // 4. Update PostGIS Geometries
    console.log('🗺️  Memperbarui geometri koordinat PostGIS...');
    try {
      await client.query('UPDATE tourist_villages SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE geom IS NULL;');
      console.log('✅ Koordinat spasial PostGIS selesai dimutakhirkan!\n');
    } catch (geomErr: any) {
      console.warn('⚠️  PostGIS warning (melewati update spasial):', geomErr.message);
    }

    console.log('🎉 SELURUH SEED DATASET RIIL JAWA TENGAH BERHASIL MASUK KE DATABASE!');
  } catch (err: any) {
    console.error('❌ Gagal terhubung atau menjalankan seed database:', err.message);
    console.log('\n💡 Catatan: Pastikan container database PostgreSQL aktif:');
    console.log('   docker compose up -d\n');
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runSeed();
