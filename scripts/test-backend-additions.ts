// Self-check backend additions: multi-foto + SLA, CRUD pengeluaran, simpan pagu anggaran.
import { createIncidentReport, getReportByCode } from '../lib/services/reportService';
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from '../app/actions/expenseActions';
import { updateGrantAllocationAction } from '../app/actions/grantActions';
import { query } from '../lib/db';

const VILLAGE_ID = 'a0000000-0000-0000-0000-000000000004'; // Dieng Kulon
const FISCAL_YEAR = 2031; // tahun uji terpisah agar data seed tidak tersentuh

function assert(cond: any, msg: string) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
}

async function main() {
  console.log('--- SELF-CHECK: multi-foto + SLA + pengeluaran + pagu ---');

  // 1. Multi-foto + SLA pada laporan PUNGLI (harus 24 jam)
  const report = await createIncidentReport({
    title: 'Pungli Parkir Liar di Gerbang Wisata',
    description: 'Petugas tidak resmi memungut biaya parkir ganda tanpa karcis di pintu masuk.',
    category: 'PUNGLI',
    photoFiles: [
      { buffer: Buffer.from('FOTO_A'), name: 'bukti-a.jpg' },
      { buffer: Buffer.from('FOTO_B'), name: 'bukti-b.jpg' },
    ],
    villageId: VILLAGE_ID,
    latitude: -7.2052,
    longitude: 109.9048,
    isAnonymous: true,
  });

  const detail = await getReportByCode(report.reportCode);
  assert(detail, 'detail laporan harus ada');
  assert(detail!.photoBeforeUrls.length === 2, `harus 2 foto, dapat ${detail!.photoBeforeUrls.length}`);
  assert(detail!.photoBeforeUrl === detail!.photoBeforeUrls[0], 'foto utama = elemen pertama array');
  assert(detail!.deadlineAt, 'deadlineAt harus terisi');

  const deadlineMs = new Date(detail!.deadlineAt as string).getTime() - new Date(detail!.createdAt as string).getTime();
  const hours = Math.round(deadlineMs / 3600000);
  assert(hours === 24, `SLA PUNGLI harus 24 jam, dapat ${hours}`);
  console.log('  [ok] multi-foto + SLA PUNGLI 24 jam');

  // 2. Simpan pagu: tolak total < realisasi
  const grant = await updateGrantAllocationAction({
    villageId: VILLAGE_ID,
    fiscalYear: FISCAL_YEAR,
    totalAllocated: 100000000,
    apbdesAmount: 40000000,
    banprovAmount: 45000000,
    padesAmount: 15000000,
  });
  assert(grant.success && grant.data, 'simpan pagu harus sukses: ' + grant.error);
  assert(grant.data!.totalAllocated === 100000000, 'total = jumlah rincian');
  assert(grant.data!.apbdesAmount === 40000000, 'rincian APBDes tersimpan');
  assert(grant.data!.banprovAmount === 45000000, 'rincian Banprov tersimpan');
  assert(grant.data!.padesAmount === 15000000, 'rincian PADes tersimpan');

  const expense = await createExpenseAction({
    grantId: grant.data!.grantId,
    activityName: 'Semen PC Portland Tipe 1',
    category: 'MATERIAL_FISIK',
    volume: 10,
    unit: 'Sak',
    claimedUnitPrice: 72000,
  });
  assert(expense.success && expense.data, 'tambah pengeluaran harus sukses: ' + expense.error);

  const rejected = await updateGrantAllocationAction({
    villageId: VILLAGE_ID,
    fiscalYear: FISCAL_YEAR,
    totalAllocated: 1000,
  });
  assert(!rejected.success, 'pagu < realisasi harus ditolak');
  console.log('  [ok] tolak pagu di bawah realisasi');

  // 3. Ubah + hapus pengeluaran, total grant ikut sinkron
  const updated = await updateExpenseAction(expense.data!.id, {
    grantId: grant.data!.grantId,
    activityName: 'Semen PC Portland Tipe 1',
    category: 'MATERIAL_FISIK',
    volume: 20,
    unit: 'Sak',
    claimedUnitPrice: 70000,
  });
  assert(updated.success, 'ubah pengeluaran harus sukses: ' + updated.error);

  const afterUpdate = await query<{ total_realized: string }>(
    `SELECT total_realized FROM village_grants WHERE id = $1`,
    [grant.data!.grantId]
  );
  assert(parseInt(afterUpdate.rows[0].total_realized, 10) === 1400000, 'total_realized harus 1.400.000');

  const removed = await deleteExpenseAction(expense.data!.id);
  assert(removed.success, 'hapus pengeluaran harus sukses: ' + removed.error);

  const afterDelete = await query<{ total_realized: string; remaining_balance: string }>(
    `SELECT total_realized, remaining_balance FROM village_grants WHERE id = $1`,
    [grant.data!.grantId]
  );
  assert(parseInt(afterDelete.rows[0].total_realized, 10) === 0, 'total_realized kembali 0');
  assert(parseInt(afterDelete.rows[0].remaining_balance, 10) === 100000000, 'sisa saldo kembali penuh');
  console.log('  [ok] CRUD pengeluaran + sinkron total grant');

  // Bersihkan data uji
  await query(`DELETE FROM incident_reports WHERE report_code = $1`, [report.reportCode]);
  await query(`DELETE FROM village_grants WHERE id = $1`, [grant.data!.grantId]);

  console.log('ALL SELF-CHECKS PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('SELF-CHECK FAILED:', err);
  process.exit(1);
});
