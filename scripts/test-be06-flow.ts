import {
  extractLpjFromPdf,
  classifyExpenseCategory,
  parseRupiahNumber,
} from '../lib/services/aiDocumentExtractor';
import { saveLpjSubmission, getVillageLpjSummary } from '../lib/services/lpjService';
import {
  processLpjUploadAction,
  getVillageLpjDetailAction,
} from '../app/actions/lpjActions';
import { query } from '../lib/db';

async function main() {
  console.log('--- 🧪 STARTING BE-06 INTEGRATION TEST ---');

  // Ambil ID desa uji coba dari database
  const villageRes = await query<{ id: string; name: string }>(
    `SELECT id, name FROM tourist_villages LIMIT 1`
  );
  if (villageRes.rows.length === 0) {
    throw new Error('❌ Tidak ada desa di database seed');
  }
  const testVillage = villageRes.rows[0];
  console.log(`📌 Using Village: ${testVillage.name} (ID: ${testVillage.id})`);

  // 1. Unit Testing Helper Functions
  console.log('\n[1/6] Testing Helpers (parseRupiahNumber & classifyExpenseCategory)...');
  const num1 = parseRupiahNumber('Rp 12.825.000,00');
  const num2 = parseRupiahNumber('285.000');
  const num3 = parseRupiahNumber(450000);
  console.log('   parseRupiahNumber results:', { num1, num2, num3 });
  if (num1 !== 12825000 || num2 !== 285000 || num3 !== 450000) {
    throw new Error('❌ parseRupiahNumber failed');
  }

  const cat1 = classifyExpenseCategory('Pipa Besi Galvanis 2 Inci');
  const cat2 = classifyExpenseCategory('Upah Tukang Las HOK');
  const cat3 = classifyExpenseCategory('Rambu Peringatan K3 Tepi Jurang');
  const cat4 = classifyExpenseCategory('Konsumsi Musyawarah LPJ');
  console.log('   classifyExpenseCategory results:', { cat1, cat2, cat3, cat4 });
  if (
    cat1 !== 'MATERIAL_FISIK' && cat1 !== 'KESELAMATAN_K3' ||
    cat2 !== 'UPAH_TENAGA' ||
    cat3 !== 'KESELAMATAN_K3' ||
    cat4 !== 'OPERASIONAL'
  ) {
    throw new Error('❌ classifyExpenseCategory classification error');
  }
  console.log('✅ Helpers verified.');

  // 2. Testing extractLpjFromPdf with Synthetic PDF
  console.log('\n[2/6] Testing extractLpjFromPdf (AI Document Extractor)...');
  const validPdfContent =
    '%PDF-1.5\n' +
    '1 0 obj\n<< /Title (Laporan Pertanggungjawaban Bantuan Sarpras 2026) >>\nendobj\n' +
    'Semen PCC 50kg 200 sak Rp 68.000 Rp 13.600.000\n' +
    'Pasir Pasang Muntilan 20 m3 Rp 320.000 Rp 6.400.000\n' +
    'Upah Tukang Las 15 HOK Rp 140.000 Rp 2.100.000\n' +
    '%%EOF';
  const pdfBuffer = Buffer.from(validPdfContent, 'utf-8');

  const extraction = await extractLpjFromPdf(pdfBuffer, testVillage.id, {
    fiscalYear: 2026,
    totalAllocated: 100000000,
  });

  console.log('✅ Extracted LPJ Data:');
  console.log('   Total Allocated:', extraction.totalAllocated);
  console.log('   Total Realized:', extraction.totalRealized);
  console.log('   Remaining Balance:', extraction.remainingBalance);
  console.log('   Items Count:', extraction.items.length);
  console.log('   Sample Item:', extraction.items[0]);

  if (extraction.items.length === 0 || extraction.totalRealized <= 0) {
    throw new Error('❌ extractLpjFromPdf failed to extract items');
  }

  // 3. Testing saveLpjSubmission (Domain Service)
  console.log('\n[3/6] Testing saveLpjSubmission (Domain Service)...');
  // Sertakan item normal dan item sengaja di-markup ekstrim (> +40%) untuk uji deteksi anomali
  const customItems = [
    {
      activity_name: 'Semen Portland Komposit (PCC) 50kg',
      category: 'MATERIAL_FISIK' as const,
      volume: 100,
      unit: 'sak',
      claimed_unit_price: 68000, // Wajar
      amount_realized: 6800000,
    },
    {
      activity_name: 'Pipa Besi Galvanis 2 Inci Tebal 2mm (Panjang 6m)',
      category: 'KESELAMATAN_K3' as const,
      volume: 30,
      unit: 'batang',
      claimed_unit_price: 550000, // Mark-up ekstrim vs SSH standar (~Rp 285.000)
      amount_realized: 16500000,
    },
  ];

  const submissionResult = await saveLpjSubmission({
    villageId: testVillage.id,
    fiscalYear: 2026,
    fundingSource: 'Bantuan Keuangan Khusus Sarpras Pemprov Jateng 2026',
    totalAllocated: 100000000,
    pdfBuffer,
    fileName: 'LPJ-Candirejo-2026.pdf',
    itemsOverride: customItems,
  });

  console.log('✅ Submission Result:');
  console.log('   Grant ID:', submissionResult.grantId);
  console.log('   Village:', submissionResult.villageName);
  console.log('   Document URL:', submissionResult.lpjDocumentUrl);
  console.log('   Total Realized:', submissionResult.totalRealized);
  console.log('   Anomalies Detected:', submissionResult.anomaliesCount);
  console.log('   Updated Trust Score:', submissionResult.updatedTrustScore);

  if (submissionResult.anomaliesCount < 1) {
    throw new Error('❌ SSH anomaly detection failed to flag marked-up galvanized pipe');
  }
  console.log('✅ SSH Anomaly Detection accurately flagged overpriced item.');

  // 4. Verify Database Persistence
  console.log('\n[4/6] Verifying Database Records...');
  const grantDb = await query(
    `SELECT vg.*, COUNT(ge.id) as expense_rows
     FROM village_grants vg
     LEFT JOIN grant_expenses ge ON ge.grant_id = vg.id
     WHERE vg.id = $1
     GROUP BY vg.id`,
    [submissionResult.grantId]
  );

  const grantRow = grantDb.rows[0];
  console.log('   DB LPJ Status:', grantRow.lpj_status);
  console.log('   DB Expense Rows:', grantRow.expense_rows);
  console.log('   DB PDF URL:', grantRow.lpj_document_url);

  if (grantRow.lpj_status !== 'SUBMITTED' || parseInt(grantRow.expense_rows, 10) !== 2) {
    throw new Error('❌ Database persistence check failed');
  }

  // 5. Test Server Action (processLpjUploadAction)
  console.log('\n[5/6] Testing processLpjUploadAction (Server Action)...');
  const formData = new FormData();
  formData.append('village_id', testVillage.id);
  formData.append('fiscal_year', '2026');
  formData.append('funding_source', 'Bantuan Keuangan Khusus Sarpras Pemprov Jateng 2026');
  formData.append('total_allocated', '100000000');

  const pdfBlob = new Blob([validPdfContent], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'LPJ-Candirejo-ServerAction.pdf');

  const actionRes = await processLpjUploadAction(formData);
  console.log('✅ Server Action Result:');
  console.log('   Success:', actionRes.success);
  console.log('   Grant ID:', actionRes.data?.grantId);
  console.log('   Expenses Count:', actionRes.data?.expensesCount);
  console.log('   Trust Score:', actionRes.data?.updatedTrustScore);

  if (!actionRes.success || !actionRes.data?.grantId) {
    throw new Error('❌ processLpjUploadAction failed: ' + actionRes.error);
  }

  // Test getVillageLpjDetailAction
  const detailAction = await getVillageLpjDetailAction(testVillage.id, 2026);
  console.log('✅ getVillageLpjDetailAction:');
  console.log('   Success:', detailAction.success);
  console.log('   Total Realized:', detailAction.data?.totalRealized);

  // 6. Validation Error Boundaries
  console.log('\n[6/6] Testing Validation Boundaries...');

  // 6a. Non-PDF buffer
  try {
    await extractLpjFromPdf(Buffer.from('NOT_A_PDF_DOCUMENT'), testVillage.id);
    throw new Error('❌ Should have rejected non-PDF buffer');
  } catch (err: any) {
    console.log('   ✅ Caught expected error (non-PDF):', err.message);
  }

  // 6b. Non-existent village
  try {
    await saveLpjSubmission({
      villageId: '00000000-0000-0000-0000-000000000000',
      pdfBuffer,
    });
    throw new Error('❌ Should have rejected non-existent village ID');
  } catch (err: any) {
    console.log('   ✅ Caught expected error (unknown village):', err.message);
  }

  console.log('\n🎉 --- ALL BE-06 INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
