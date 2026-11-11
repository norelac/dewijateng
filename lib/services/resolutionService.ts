// ==============================================================================
// DEWI JATENG - Proof-of-Fix & Incident Resolution Domain Service
// Logika bisnis penyelesaian aduan warga, validasi EXIF, dan rekalkulasi Trust Score
// ==============================================================================

import { query } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { validatePhotoExif, type ExifValidationResult } from '@/lib/services/exifValidator';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';

export interface ResolveIncidentInput {
  reportCode: string;
  photoBuffer?: Buffer;
  photoName?: string;
  photoFallbackUrl?: string;
  actionSummary: string;
  officerName: string;
  actorVillageId?: string | null;
}

export interface ResolveIncidentResult {
  id: string;
  reportCode: string;
  status: 'RESOLVED';
  photoAfterUrl: string;
  actionSummary: string;
  officerName: string;
  exifVerified: boolean;
  exifPhotoDate: Date | null;
  resolvedAt: Date;
  updatedTrustScore: number;
}

/**
 * Menyelesaikan laporan aduan fasilitas dengan bukti fisik (Proof-of-Fix).
 * Memverifikasi integritas EXIF timestamp, menyimpan foto ke bucket proof-of-fix,
 * memperbarui status laporan menjadi RESOLVED, dan merefresh Trust Score desa wisata.
 */
export async function resolveIncidentReport(
  input: ResolveIncidentInput
): Promise<ResolveIncidentResult> {
  const reportCode = input.reportCode?.toUpperCase()?.trim();
  const actionSummary = input.actionSummary?.trim() || '';
  const officerName = input.officerName?.trim() || '';

  if (!reportCode) {
    throw new Error('Kode tiket laporan wajib disertakan');
  }

  if (!actionSummary || actionSummary.length < 10) {
    throw new Error('Ringkasan tindakan teknis minimal 10 karakter');
  }

  if (!officerName || officerName.length < 3) {
    throw new Error('Nama petugas / teknisi pelaksana minimal 3 karakter');
  }

  // 1. Ambil data laporan aduan dari database
  const reportRes = await query<{
    id: string;
    village_id: string;
    status: string;
    created_at: string;
  }>(
    `SELECT id, village_id, status, created_at
     FROM incident_reports
     WHERE UPPER(report_code) = $1
     LIMIT 1`,
    [reportCode]
  );

  if (reportRes.rows.length === 0) {
    throw new Error(`Laporan dengan kode tiket ${reportCode} tidak ditemukan`);
  }

  const report = reportRes.rows[0];

  if (input.actorVillageId && report.village_id !== input.actorVillageId) {
    throw new Error('Akses ditolak: Anda hanya dapat menyelesaikan laporan untuk desa Anda sendiri.');
  }

  const reportCreatedAt = new Date(report.created_at);

  // 2. Evaluasi bukti foto fisik & verifikasi EXIF
  let photoAfterUrl = input.photoFallbackUrl || '';
  let exifVerified = false;
  let exifPhotoDate: Date | null = null;

  if (input.photoBuffer && input.photoBuffer.length > 0) {
    const exifResult: ExifValidationResult = await validatePhotoExif(
      input.photoBuffer,
      reportCreatedAt
    );

    // Jika EXIF mendeteksi foto diambil sebelum laporan dibuat (indikasi arsip lama)
    if (exifResult.error) {
      throw new Error(exifResult.error);
    }

    exifVerified = exifResult.verified;
    exifPhotoDate = exifResult.photoDate;

    // Simpan foto bukti perbaikan ke storage lokal
    const fileName = input.photoName || 'bukti-perbaikan.jpg';
    const saved = await saveFileToStorage('proof-of-fix', fileName, input.photoBuffer);
    photoAfterUrl = saved.publicUrl;
  } else if (!photoAfterUrl) {
    throw new Error('Foto bukti fisik perbaikan (Proof-of-Fix) wajib dilampirkan');
  }

  // 3. Simpan catatan perbaikan ke tabel report_resolutions (UPSERT atomic)
  const resolutionRes = await query<{ id: number; resolved_at: string }>(
    `INSERT INTO report_resolutions (
       report_id,
       action_summary,
       photo_after_url,
       officer_name,
       exif_timestamp_verified,
       exif_photo_date,
       resolved_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (report_id) DO UPDATE SET
       action_summary = EXCLUDED.action_summary,
       photo_after_url = EXCLUDED.photo_after_url,
       officer_name = EXCLUDED.officer_name,
       exif_timestamp_verified = EXCLUDED.exif_timestamp_verified,
       exif_photo_date = EXCLUDED.exif_photo_date,
       resolved_at = NOW()
     RETURNING id, resolved_at`,
    [
      report.id,
      actionSummary,
      photoAfterUrl,
      officerName,
      exifVerified,
      exifPhotoDate,
    ]
  );

  const resolutionRow = resolutionRes.rows[0];

  // 4. Update status incident_reports menjadi RESOLVED
  await query(
    `UPDATE incident_reports
     SET status = 'RESOLVED', updated_at = NOW()
     WHERE id = $1`,
    [report.id]
  );

  // 5. Rekalkulasi Trust Score desa secara real-time
  const trustScoreBreakdown = await calculateVillageTrustScore(report.village_id);

  return {
    id: report.id,
    reportCode,
    status: 'RESOLVED',
    photoAfterUrl,
    actionSummary,
    officerName,
    exifVerified,
    exifPhotoDate,
    resolvedAt: new Date(resolutionRow.resolved_at),
    updatedTrustScore: trustScoreBreakdown.trustScore,
  };
}
