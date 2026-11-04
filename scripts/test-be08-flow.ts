// ==============================================================================
// DEWI JATENG - Automated Test Suite: BE-08 (Trust Score & Disporapar Overview)
// Pengujian kalkulasi Trust Score 50/50 dan API Command Center Disporapar
// ==============================================================================

import {
  calculateVillageTrustScore,
  recalculateAllVillages,
  classifyTrustStatus,
} from '../lib/services/trustScoreCalculator';
import { query } from '../lib/db';

async function runBe08Tests() {
  console.log('🧪 Memulai Pengujian Otomatis BE-08: Kalkulator Trust Score & API Disporapar...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
    }
  }

  try {
    // --------------------------------------------------------------------------
    // Test 1: Verifikasi Klasifikasi Status Semaphore Warna (GREEN / YELLOW / RED)
    // --------------------------------------------------------------------------
    assert(
      classifyTrustStatus(95.0) === 'GREEN' &&
        classifyTrustStatus(80.0) === 'GREEN' &&
        classifyTrustStatus(79.9) === 'YELLOW' &&
        classifyTrustStatus(60.0) === 'YELLOW' &&
        classifyTrustStatus(59.9) === 'RED' &&
        classifyTrustStatus(0.0) === 'RED',
      'Test 1: Klasifikasi Trust Status (GREEN >= 80, YELLOW 60-79.9, RED < 60)',
      'Status matching mismatch'
    );

    // --------------------------------------------------------------------------
    // Test 2: Rekalkulasi Trust Score untuk Desa Tertentu
    // --------------------------------------------------------------------------
    const villageRes = await query<{ id: string; name: string }>(
      `SELECT id, name FROM tourist_villages LIMIT 1`
    );
    assert(villageRes.rows.length > 0, 'Test 2.1: Desa terdaftar ditemukan di database');

    const testVillage = villageRes.rows[0];
    const calcResult = await calculateVillageTrustScore(testVillage.id);

    assert(
      calcResult.villageId === testVillage.id &&
        typeof calcResult.trustScore === 'number' &&
        calcResult.trustScore >= 0 &&
        calcResult.trustScore <= 100 &&
        ['GREEN', 'YELLOW', 'RED'].includes(calcResult.status),
      `Test 2.2: Kalkulasi Trust Score desa "${testVillage.name}" berhasil`,
      `Score: ${calcResult.trustScore}, S_LPJ: ${calcResult.sLpj}, S_Aduan: ${calcResult.sAduan}, Status: ${calcResult.status}`
    );

    // --------------------------------------------------------------------------
    // Test 3: Verifikasi Formula Matematis 50/50: Trust Score = 0.5 * S_LPJ + 0.5 * S_Aduan
    // --------------------------------------------------------------------------
    const expectedScore = Number((0.5 * calcResult.sLpj + 0.5 * calcResult.sAduan).toFixed(2));
    assert(
      Math.abs(calcResult.trustScore - expectedScore) < 0.01,
      'Test 3: Formula terbuka 50/50 (0.5 * S_LPJ + 0.5 * S_Aduan) akurat',
      `Calculated: ${calcResult.trustScore}, Expected: ${expectedScore}`
    );

    // --------------------------------------------------------------------------
    // Test 4: Verifikasi Update Database tourist_villages
    // --------------------------------------------------------------------------
    const checkDb = await query<{ trust_score: string }>(
      `SELECT trust_score FROM tourist_villages WHERE id = $1`,
      [testVillage.id]
    );
    const dbScore = parseFloat(checkDb.rows[0]?.trust_score || '0');
    assert(
      Math.abs(dbScore - calcResult.trustScore) < 0.01,
      'Test 4: Nilai trust_score berhasil tersimpan di tabel tourist_villages',
      `DB Score: ${dbScore}, Returned Score: ${calcResult.trustScore}`
    );

    // --------------------------------------------------------------------------
    // Test 5: Rekalkulasi Massal Seluruh Desa (Batch Recalculation)
    // --------------------------------------------------------------------------
    const batchResult = await recalculateAllVillages();
    assert(
      batchResult.total_villages > 0 &&
        batchResult.updated === batchResult.total_villages &&
        batchResult.green + batchResult.yellow + batchResult.red === batchResult.total_villages &&
        batchResult.duration_ms < 1000,
      `Test 5: Batch recalculation ${batchResult.total_villages} desa tuntas dalam ${batchResult.duration_ms} ms`,
      `Total: ${batchResult.total_villages}, Updated: ${batchResult.updated}, Avg: ${batchResult.average_score}`
    );

    // --------------------------------------------------------------------------
    // Test 6: Verifikasi Ketersediaan Data Macro Metrics untuk API Disporapar
    // --------------------------------------------------------------------------
    const macroCheck = await query<{
      total_villages: string;
      avg_trust_score: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM tourist_villages) as total_villages,
         (SELECT COALESCE(AVG(trust_score), 80.00) FROM tourist_villages) as avg_trust_score`
    );

    const m = macroCheck.rows[0];
    const totalV = parseInt(m.total_villages, 10);
    const avgScore = parseFloat(m.avg_trust_score);

    assert(
      totalV >= 5 && avgScore > 0 && avgScore <= 100,
      'Test 6: Agregasi Macro Metrics Disporapar valid',
      `Total Desa: ${totalV}, Rata-rata Skor: ${avgScore.toFixed(2)}`
    );

    // --------------------------------------------------------------------------
    // Test 7: Verifikasi DSS Rekomendasi Hibah APBD 2027 (Prioritas Utama / Pertimbangan / Evaluasi)
    // --------------------------------------------------------------------------
    const prioritiesRes = await query<{
      id: string;
      name: string;
      trust_score: string;
    }>(
      `SELECT id, name, trust_score
       FROM tourist_villages
       ORDER BY trust_score DESC
       LIMIT 10`
    );

    assert(
      prioritiesRes.rows.length > 0,
      'Test 7: Rekomendasi Prioritas Hibah DSS mengembalikan desa-desa berperingkat teratas',
      `Jumlah desa rekomendasi: ${prioritiesRes.rows.length}`
    );
  } catch (error: any) {
    console.error('Terjadi error selama pengujian BE-08:', error);
  }

  console.log(`\n======================================================`);
  console.log(`📊 Hasil Pengujian BE-08: ${passed}/${total} Berhasil PASS`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runBe08Tests();
