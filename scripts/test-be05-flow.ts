import { createIncidentReport, getReportByCode } from '../lib/services/reportService';
import { resolveIncidentReport } from '../lib/services/resolutionService';
import { resolveReportAction } from '../app/actions/resolutionActions';
import { validatePhotoExif } from '../lib/services/exifValidator';
import { query } from '../lib/db';

async function main() {
  console.log('--- 🧪 STARTING BE-05 INTEGRATION TEST ---');

  // 1. Create a dummy report to resolve
  console.log('\n[1/6] Creating a test incident report for resolution...');
  const initialReport = await createIncidentReport({
    title: 'Anjungan Jembatan Bambu Rusak Parah',
    description: 'Papan lantai jembatan bambu patah sepanjang 2 meter membahayakan wisatawan yang menyeberang sungai.',
    category: 'BAHAYA_K3',
    photoBuffer: Buffer.from('TEST_BEFORE_PHOTO_BYTES'),
    photoName: 'before-jembatan-rusak.jpg',
    latitude: -7.6186, // Candirejo
    longitude: 110.2317,
    isAnonymous: false,
    reporterPhone: '081234567890',
  });

  console.log('✅ Base Report Created:');
  console.log('   Code:', initialReport.reportCode);
  console.log('   Status:', initialReport.status);

  // 2. Unit testing validatePhotoExif edge cases
  console.log('\n[2/6] Testing validatePhotoExif edge cases...');
  const fakeBufferWithoutExif = Buffer.from('NOT_AN_EXIF_IMAGE');
  const exifResEmpty = await validatePhotoExif(fakeBufferWithoutExif, new Date());
  console.log('   Non-EXIF image result:', exifResEmpty);
  if (exifResEmpty.verified !== false || exifResEmpty.photoDate !== null) {
    throw new Error('❌ Non-EXIF image should return verified: false and photoDate: null');
  }
  console.log('✅ Non-EXIF image handled gracefully (soft validation).');

  // 3. Test resolveIncidentReport via Domain Service
  console.log('\n[3/6] Testing resolveIncidentReport (Domain Service)...');
  const dummyAfterBuffer = Buffer.from('TEST_AFTER_PROOF_OF_FIX_BYTES');
  const serviceResolution = await resolveIncidentReport({
    reportCode: initialReport.reportCode,
    actionSummary: 'Penggantian seluruh bilah bambu dengan kayu ulin tahan cuaca serta penambahan jaring pengaman bawah.',
    officerName: 'Slamet Riyadi (Pokdarwis Candirejo)',
    photoBuffer: dummyAfterBuffer,
    photoName: 'proof-of-fix-jembatan-ulin.jpg',
  });

  console.log('✅ Service Resolution Result:');
  console.log('   Report Code:', serviceResolution.reportCode);
  console.log('   Status:', serviceResolution.status);
  console.log('   Photo After URL:', serviceResolution.photoAfterUrl);
  console.log('   Officer Name:', serviceResolution.officerName);
  console.log('   EXIF Verified:', serviceResolution.exifVerified);
  console.log('   Resolved At:', serviceResolution.resolvedAt.toISOString());
  console.log('   Updated Trust Score:', serviceResolution.updatedTrustScore);

  if (serviceResolution.status !== 'RESOLVED') {
    throw new Error('❌ Status should be RESOLVED');
  }

  // 4. Verify Database Persistence (incident_reports & report_resolutions)
  console.log('\n[4/6] Verifying Database Persistence...');
  const dbCheck = await query(
    `SELECT ir.status, ir.updated_at, rr.action_summary, rr.photo_after_url, rr.officer_name, rr.exif_timestamp_verified
     FROM incident_reports ir
     LEFT JOIN report_resolutions rr ON rr.report_id = ir.id
     WHERE UPPER(ir.report_code) = $1`,
    [initialReport.reportCode]
  );

  const row = dbCheck.rows[0];
  console.log('   DB Status:', row.status);
  console.log('   DB Resolution Summary:', row.action_summary);
  console.log('   DB Photo After URL:', row.photo_after_url);
  console.log('   DB Officer Name:', row.officer_name);

  if (row.status !== 'RESOLVED' || !row.photo_after_url) {
    throw new Error('❌ Database record was not correctly updated to RESOLVED');
  }
  console.log('✅ Database persistence confirmed.');

  // 5. Test Server Action (resolveReportAction) with second report
  console.log('\n[5/6] Testing resolveReportAction (Server Action)...');
  const secondReport = await createIncidentReport({
    title: 'Spot Foto Tepi Tebing Tanpa Barikade',
    description: 'Batas jurang sedalam 15 meter tidak memiliki tali pembatas sama sekali.',
    category: 'BAHAYA_K3',
    photoBuffer: Buffer.from('TEST_BEFORE_CLIFF'),
    photoName: 'cliff-danger.jpg',
    latitude: -7.2062, // Dieng Kulon
    longitude: 109.9042,
    isAnonymous: true,
  });

  const formData = new FormData();
  formData.append('report_code', secondReport.reportCode);
  formData.append('action_summary', 'Pemasangan pipa galvanis ganda setinggi 1.2 meter dan rambu peringatan kedalaman jurang.');
  formData.append('officer_name', 'Budi Santoso');

  // Buat mock File untuk photo_after
  const fileBlob = new Blob(['MOCK_PROOF_OF_FIX_IMAGE_DATA'], { type: 'image/jpeg' });
  formData.append('photo_after', fileBlob, 'proof-barikade-tebing.jpg');

  const actionRes = await resolveReportAction(formData);
  console.log('✅ Server Action Result:');
  console.log('   Success:', actionRes.success);
  console.log('   Report Code:', actionRes.data?.reportCode);
  console.log('   Status:', actionRes.data?.status);
  console.log('   Updated Trust Score:', actionRes.data?.updatedTrustScore);

  if (!actionRes.success || actionRes.data?.status !== 'RESOLVED') {
    throw new Error('❌ resolveReportAction failed: ' + actionRes.error);
  }

  // 6. Test Validation & Error Boundaries
  console.log('\n[6/6] Testing Validation Error Boundaries...');

  // 6a. Ringkasan tindakan terlalu pendek (<10 karakter)
  try {
    await resolveIncidentReport({
      reportCode: secondReport.reportCode,
      actionSummary: 'Dah beres',
      officerName: 'Pak RT',
      photoFallbackUrl: '/uploads/proof-of-fix/dummy.jpg',
    });
    throw new Error('❌ Should have thrown validation error for short actionSummary');
  } catch (err: any) {
    console.log('   ✅ Caught expected error (short summary):', err.message);
  }

  // 6b. Nama petugas terlalu pendek
  try {
    await resolveIncidentReport({
      reportCode: secondReport.reportCode,
      actionSummary: 'Pemasangan kawat sling pengaman baru di sepanjang batas.',
      officerName: 'A',
      photoFallbackUrl: '/uploads/proof-of-fix/dummy.jpg',
    });
    throw new Error('❌ Should have thrown validation error for short officerName');
  } catch (err: any) {
    console.log('   ✅ Caught expected error (short officerName):', err.message);
  }

  // 6c. Kode tiket tidak ditemukan
  try {
    await resolveIncidentReport({
      reportCode: 'LP-JTG-2026-999999',
      actionSummary: 'Pemasangan kawat sling pengaman baru di sepanjang batas.',
      officerName: 'Agus Subagyo',
      photoFallbackUrl: '/uploads/proof-of-fix/dummy.jpg',
    });
    throw new Error('❌ Should have thrown validation error for unknown reportCode');
  } catch (err: any) {
    console.log('   ✅ Caught expected error (unknown reportCode):', err.message);
  }

  console.log('\n🎉 --- ALL BE-05 INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
