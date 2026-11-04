import { createIncidentReport, getReportByCode, listPublicReports } from '../lib/services/reportService';
import { submitReportAction, getReportDetailAction } from '../app/actions/reportActions';
import { query } from '../lib/db';

async function main() {
  console.log('--- 🧪 STARTING BE-04 INTEGRATION TEST ---');

  // 1. Test createIncidentReport via Service Layer
  console.log('\n[1/4] Testing createIncidentReport (Domain Service)...');
  const dummyPhotoBuffer = Buffer.from('FAKE_IMAGE_DATA_FOR_TESTING');

  const reportResult = await createIncidentReport({
    title: 'Uji Pagar Pengaman Roboh Pasca Longsor',
    description: 'Pagar bambu pengaman tebing wisata ambrol sepanjang 5 meter akibat hujan deras semalam.',
    category: 'BAHAYA_K3',
    photoBuffer: dummyPhotoBuffer,
    photoName: 'test-pagar-roboh.jpg',
    latitude: -7.6186, // Dekat Candirejo Magelang
    longitude: 110.2317,
    isAnonymous: true,
    reporterPhone: '081234567890',
  });

  console.log('✅ Report Created Successfully:');
  console.log('   ID:', reportResult.id);
  console.log('   Report Code:', reportResult.reportCode);
  console.log('   Status:', reportResult.status);
  console.log('   Village ID:', reportResult.villageId);
  console.log('   Tracking URL:', reportResult.trackingUrl);

  if (!reportResult.reportCode.startsWith('LP-JTG-2026-')) {
    throw new Error('❌ Report code format invalid: ' + reportResult.reportCode);
  }

  // Check DB directly for privacy hash and photo URL
  const checkDb = await query(
    'SELECT photo_before_url, is_anonymous, reporter_contact_hash FROM incident_reports WHERE id = $1',
    [reportResult.id]
  );
  const row = checkDb.rows[0];
  console.log('   Photo URL in DB:', row.photo_before_url);
  console.log('   Is Anonymous:', row.is_anonymous);
  console.log('   Contact Hash:', row.reporter_contact_hash);

  if (!row.reporter_contact_hash || row.reporter_contact_hash === '081234567890') {
    throw new Error('❌ Phone number was not securely hashed!');
  }
  console.log('✅ Privacy Hasher verified: Plain text phone is NOT stored in DB.');

  // 2. Test getReportByCode
  console.log('\n[2/4] Testing getReportByCode...');
  const fetched = await getReportByCode(reportResult.reportCode);
  if (!fetched) {
    throw new Error('❌ Failed to fetch report by code: ' + reportResult.reportCode);
  }
  console.log('✅ Fetched report detail:');
  console.log('   Title:', fetched.title);
  console.log('   Village:', fetched.village?.name, '—', fetched.village?.regency);
  console.log('   Category:', fetched.category);

  // 3. Test listPublicReports
  console.log('\n[3/4] Testing listPublicReports...');
  const publicList = await listPublicReports({ limit: 5 });
  console.log(`✅ Fetched ${publicList.length} public reports. Newest is: ${publicList[0]?.reportCode}`);

  // 4. Test Server Action (submitReportAction)
  console.log('\n[4/4] Testing submitReportAction (Server Action)...');
  const formData = new FormData();
  formData.append('title', 'Lampu Penerangan Jalan Setapak Mati');
  formData.append('description', 'Sepanjang 200 meter jalan setapak menuju gardu pandang gelap total.');
  formData.append('category', 'FASILITAS_RUSAK');
  formData.append('latitude', '-7.2062'); // Dekat Dieng Kulon
  formData.append('longitude', '109.9042');
  formData.append('is_anonymous', 'true');
  formData.append('reporter_phone', '089876543210');

  const actionRes = await submitReportAction(formData);
  console.log('✅ Server Action Response:');
  console.log('   Success:', actionRes.success);
  console.log('   Report Code:', actionRes.data?.reportCode);
  console.log('   Tracking URL:', actionRes.data?.trackingUrl);

  if (!actionRes.success || !actionRes.data?.reportCode) {
    throw new Error('❌ submitReportAction failed: ' + actionRes.error);
  }

  // 5. Test getReportDetailAction
  const actionDetail = await getReportDetailAction(actionRes.data.reportCode);
  console.log('✅ getReportDetailAction Response:');
  console.log('   Success:', actionDetail.success);
  console.log('   Title:', actionDetail.data?.title);
  console.log('   Village:', actionDetail.data?.village?.name);

  console.log('\n🎉 --- ALL BE-04 TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
