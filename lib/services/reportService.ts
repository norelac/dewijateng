// ==============================================================================
// DEWI JATENG - Incident Report Domain Service
// Logika bisnis inti pelaporan aduan masyarakat terpadu (RSC, Server Actions, & REST)
// ==============================================================================

import { query } from '@/lib/db';
import { saveFileToStorage } from '@/lib/storage';
import { generateReportCode } from '@/lib/services/reportCodeGenerator';
import { hashReporterPhone } from '@/lib/services/cryptoHasher';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';

export interface CreateReportDTO {
  villageId?: string;
  category: 'FASILITAS_RUSAK' | 'PUNGLI' | 'BAHAYA_K3' | 'KEBERSIHAN' | string;
  title: string;
  description: string;
  photoBuffer?: Buffer;
  photoName?: string;
  photoFallbackUrl?: string;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  reporterPhone?: string;
}

export interface ReportVillageInfo {
  id: string;
  name: string;
  regency: string;
  district?: string;
  pokdarwisName?: string;
  contactPhone?: string;
  trustScore?: number;
}

export interface ReportResolutionInfo {
  id?: number;
  actionSummary: string;
  photoAfterUrl: string;
  officerName: string;
  exifTimestampVerified: boolean;
  exifPhotoDate?: string | Date | null;
  resolvedAt?: string | Date;
}

export interface IncidentReportDetail {
  id: string;
  reportCode: string;
  villageId: string;
  village?: ReportVillageInfo;
  category: string;
  title: string;
  description: string;
  photoBeforeUrl: string;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  resolution?: ReportResolutionInfo | null;
}

export interface ListReportsFilter {
  status?: string;
  villageId?: string;
  limit?: number;
}

const DEFAULT_FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80';

/**
 * Membuat aduan masyarakat baru dengan validasi, PostGIS nearest village lookup,
 * penyimpanan foto fisik, hashing kontak pelapor, dan rekalkulasi Trust Score desa.
 */
export async function createIncidentReport(input: CreateReportDTO): Promise<{
  id: string;
  reportCode: string;
  status: string;
  villageId: string;
  trackingUrl: string;
}> {
  const title = input.title?.trim() || '';
  const description = input.description?.trim() || '';
  const category = input.category || 'FASILITAS_RUSAK';
  let villageId = input.villageId?.trim() || '';
  const latitude = typeof input.latitude === 'number' && !isNaN(input.latitude) ? input.latitude : -6.9932;
  const longitude = typeof input.longitude === 'number' && !isNaN(input.longitude) ? input.longitude : 110.4203;
  const isAnonymous = Boolean(input.isAnonymous);
  const reporterPhone = input.reporterPhone?.trim() || '';

  // 1. Validasi input wajib
  if (!title || title.length < 5) {
    throw new Error('Judul laporan minimal 5 karakter');
  }

  if (!description || description.length < 10) {
    throw new Error('Rincian deskripsi aduan minimal 10 karakter');
  }

  // 2. Jika villageId tidak disertakan, cari desa terdekat via operator spasial PostGIS (<->)
  if (!villageId) {
    const nearestRes = await query<{ id: string }>(
      `SELECT id FROM tourist_villages
       ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1::double precision, $2::double precision), 4326)
       LIMIT 1`,
      [longitude, latitude]
    );

    if (nearestRes.rows.length > 0) {
      villageId = nearestRes.rows[0].id;
    } else {
      // Fallback ke sembarang desa wisata jika tabel ada isinya
      const anyVillage = await query<{ id: string }>(`SELECT id FROM tourist_villages LIMIT 1`);
      if (anyVillage.rows.length > 0) {
        villageId = anyVillage.rows[0].id;
      } else {
        throw new Error('Tidak ada data desa wisata terdaftar di sistem');
      }
    }
  }

  // 3. Simpan foto ke disk storage lokal
  let photoBeforeUrl = input.photoFallbackUrl || DEFAULT_FALLBACK_PHOTO;
  if (input.photoBuffer && input.photoBuffer.length > 0) {
    const fileName = input.photoName || 'bukti-aduan.jpg';
    const saved = await saveFileToStorage('report-photos-before', fileName, input.photoBuffer);
    photoBeforeUrl = saved.publicUrl;
  }

  // 4. Enkripsi hash satu arah nomor WhatsApp pelapor jika opsi anonim dipilih
  const contactHash =
    isAnonymous && reporterPhone
      ? hashReporterPhone(reporterPhone)
      : (reporterPhone || null);

  // 5. Terbitkan kode tiket unik standar: LP-JTG-{TAHUN}-{URUT}
  const reportCode = await generateReportCode();

  // 6. Simpan baris laporan ke basis data PostgreSQL dengan Point spasial
  const insertRes = await query<{ id: string; report_code: string; status: string; village_id: string }>(
    `INSERT INTO incident_reports (
       report_code,
       village_id,
       category,
       title,
       description,
       photo_before_url,
       latitude,
       longitude,
       geom,
       is_anonymous,
       reporter_contact_hash,
       status
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7::double precision,
       $8::double precision,
       ST_SetSRID(ST_MakePoint($8::double precision, $7::double precision), 4326),
       $9, $10, 'SUBMITTED'
     )
     RETURNING id, report_code, status, village_id`,
    [
      reportCode,
      villageId,
      category,
      title,
      description,
      photoBeforeUrl,
      latitude,
      longitude,
      isAnonymous,
      contactHash,
    ]
  );

  const newReport = insertRes.rows[0];

  // 7. Picu rekalkulasi Trust Score desa wisata secara asynchronous
  calculateVillageTrustScore(villageId).catch((err) =>
    console.error(`[TrustScore Recalc Warning for village ${villageId}]:`, err)
  );

  return {
    id: newReport.id,
    reportCode: newReport.report_code,
    status: newReport.status,
    villageId: newReport.village_id,
    trackingUrl: `/lapor?code=${newReport.report_code}`,
  };
}

/**
 * Mengambil detail lengkap satu aduan berdasarkan kode tiket unik
 */
export async function getReportByCode(reportCode: string): Promise<IncidentReportDetail | null> {
  const cleanCode = reportCode.toUpperCase().trim();

  const sqlText = `
    SELECT
      r.id,
      r.report_code,
      r.village_id,
      v.name as village_name,
      v.regency as village_regency,
      v.district as village_district,
      v.pokdarwis_name,
      v.contact_phone,
      v.trust_score,
      r.category,
      r.title,
      r.description,
      r.photo_before_url,
      r.latitude,
      r.longitude,
      r.is_anonymous,
      r.status,
      r.created_at,
      r.updated_at,
      res.id as resolution_id,
      res.action_summary,
      res.photo_after_url,
      res.officer_name,
      res.exif_timestamp_verified,
      res.exif_photo_date,
      res.resolved_at
    FROM incident_reports r
    LEFT JOIN tourist_villages v ON r.village_id = v.id
    LEFT JOIN report_resolutions res ON r.id = res.report_id
    WHERE UPPER(r.report_code) = $1
    LIMIT 1
  `;

  const result = await query(sqlText, [cleanCode]);
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    reportCode: row.report_code,
    villageId: row.village_id,
    village: row.village_id
      ? {
          id: row.village_id,
          name: row.village_name || 'Desa Wisata',
          regency: row.village_regency || 'Jawa Tengah',
          district: row.village_district,
          pokdarwisName: row.pokdarwis_name,
          contactPhone: row.contact_phone,
          trustScore: parseFloat(row.trust_score || '0'),
        }
      : undefined,
    category: row.category,
    title: row.title,
    description: row.description,
    photoBeforeUrl: row.photo_before_url,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    isAnonymous: row.is_anonymous,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolution: row.resolution_id
      ? {
          id: row.resolution_id,
          actionSummary: row.action_summary,
          photoAfterUrl: row.photo_after_url,
          officerName: row.officer_name,
          exifTimestampVerified: row.exif_timestamp_verified,
          exifPhotoDate: row.exif_photo_date,
          resolvedAt: row.resolved_at,
        }
      : null,
  };
}

/**
 * Mengambil daftar aduan publik dengan filter status, desa wisata, dan batas kuota
 */
export async function listPublicReports(
  filters: ListReportsFilter = {}
): Promise<IncidentReportDetail[]> {
  const limit = Math.min(Math.max(filters.limit || 20, 1), 100);

  let sqlText = `
    SELECT
      r.id,
      r.report_code,
      r.village_id,
      v.name as village_name,
      v.regency as village_regency,
      v.district as village_district,
      v.pokdarwis_name,
      v.contact_phone,
      v.trust_score,
      r.category,
      r.title,
      r.description,
      r.photo_before_url,
      r.latitude,
      r.longitude,
      r.is_anonymous,
      r.status,
      r.created_at,
      r.updated_at,
      res.id as resolution_id,
      res.action_summary,
      res.photo_after_url,
      res.officer_name,
      res.exif_timestamp_verified,
      res.exif_photo_date,
      res.resolved_at
    FROM incident_reports r
    LEFT JOIN tourist_villages v ON r.village_id = v.id
    LEFT JOIN report_resolutions res ON r.id = res.report_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters.status) {
    params.push(filters.status);
    sqlText += ` AND r.status = $${params.length}`;
  }

  if (filters.villageId) {
    params.push(filters.villageId);
    sqlText += ` AND r.village_id = $${params.length}`;
  }

  sqlText += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query(sqlText, params);

  return result.rows.map((row) => ({
    id: row.id,
    reportCode: row.report_code,
    villageId: row.village_id,
    village: row.village_id
      ? {
          id: row.village_id,
          name: row.village_name || 'Desa Wisata',
          regency: row.village_regency || 'Jawa Tengah',
          district: row.village_district,
          pokdarwisName: row.pokdarwis_name,
          contactPhone: row.contact_phone,
          trustScore: parseFloat(row.trust_score || '0'),
        }
      : undefined,
    category: row.category,
    title: row.title,
    description: row.description,
    photoBeforeUrl: row.photo_before_url,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    isAnonymous: row.is_anonymous,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolution: row.resolution_id
      ? {
          id: row.resolution_id,
          actionSummary: row.action_summary,
          photoAfterUrl: row.photo_after_url,
          officerName: row.officer_name,
          exifTimestampVerified: row.exif_timestamp_verified,
          exifPhotoDate: row.exif_photo_date,
          resolvedAt: row.resolved_at,
        }
      : null,
  }));
}
