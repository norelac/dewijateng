import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/db';
import { incidentReports, touristVillages } from '@/lib/db/schema';
import { saveFileToStorage } from '@/lib/storage';
import { generateReportCode } from '@/lib/services/reportCodeGenerator';
import { hashReporterPhone } from '@/lib/services/cryptoHasher';
import { calculateVillageTrustScore } from '@/lib/services/trustScoreCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports
 * Mengambil daftar aduan publik terbaru
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const villageId = searchParams.get('village_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let sqlText = `
      SELECT
        r.id,
        r.report_code,
        r.village_id,
        v.name as village_name,
        v.regency as village_regency,
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
        res.action_summary as resolution_summary,
        res.photo_after_url as resolution_photo_after,
        res.officer_name as resolution_officer,
        res.exif_timestamp_verified,
        res.exif_photo_date,
        res.resolved_at
      FROM incident_reports r
      LEFT JOIN tourist_villages v ON r.village_id = v.id
      LEFT JOIN report_resolutions res ON r.id = res.report_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sqlText += ` AND r.status = $${params.length}`;
    }

    if (villageId) {
      params.push(villageId);
      sqlText += ` AND r.village_id = $${params.length}`;
    }

    sqlText += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sqlText, params);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[API /api/reports GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data laporan', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Menerima pengiriman formulir laporan aduan masyarakat (Multipart Form Data)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = (formData.get('title') as string) || '';
    const category = (formData.get('category') as string) || 'FASILITAS_RUSAK';
    const description = (formData.get('description') as string) || '';
    let villageId = (formData.get('village_id') as string) || '';
    const rawLat = formData.get('latitude') as string;
    const rawLng = formData.get('longitude') as string;
    const isAnonymous = formData.get('is_anonymous') === 'false' ? false : true;
    const reporterPhone = (formData.get('reporter_phone') as string) || '';
    const photo = formData.get('photo') as File | null;

    // Validasi field wajib
    if (!title.trim() || title.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Judul laporan minimal 5 karakter' },
        { status: 422 }
      );
    }

    if (!description.trim() || description.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Rincian deskripsi aduan minimal 10 karakter' },
        { status: 422 }
      );
    }

    const latitude = parseFloat(rawLat || '-6.9928');
    const longitude = parseFloat(rawLng || '110.3957');

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Koordinat lokasi tidak valid' },
        { status: 422 }
      );
    }

    // Jika village_id kosong, temukan desa terdekat menggunakan koordinat PostGIS
    if (!villageId) {
      const nearestRes = await query<{ id: string }>(
        `SELECT id FROM tourist_villages
         ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
         LIMIT 1`,
        [longitude, latitude]
      );
      if (nearestRes.rows.length > 0) {
        villageId = nearestRes.rows[0].id;
      } else {
        // Fallback ke desa pertama jika tabel kosong
        const anyVillage = await query<{ id: string }>(`SELECT id FROM tourist_villages LIMIT 1`);
        if (anyVillage.rows.length > 0) {
          villageId = anyVillage.rows[0].id;
        } else {
          return NextResponse.json(
            { success: false, error: 'Tidak ada data desa wisata di sistem' },
            { status: 422 }
          );
        }
      }
    }

    // Simpan foto ke local storage
    let photoBeforeUrl = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'; // fallback
    if (photo && photo.size > 0) {
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const saved = await saveFileToStorage('report-photos-before', photo.name, buffer);
      photoBeforeUrl = saved.publicUrl;
    }

    // Hash nomor kontak jika anonim
    const contactHash = isAnonymous && reporterPhone ? hashReporterPhone(reporterPhone) : (reporterPhone || null);

    // Generate kode pelaporan unik LP-JTG-2026-XXXX
    const reportCode = await generateReportCode();

    // Insert ke tabel incident_reports
    const insertRes = await query<{ id: string; report_code: string; status: string }>(
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
         $1, $2, $3, $4, $5, $6, $7, $8,
         ST_SetSRID(ST_MakePoint($8, $7), 4326),
         $9, $10, 'SUBMITTED'
       )
       RETURNING id, report_code, status`,
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

    // Rekalkulasi Trust Score desa
    calculateVillageTrustScore(villageId).catch((err) =>
      console.error('[TrustScore Calc Error after report insert]:', err)
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Laporan aduan berhasil didaftarkan ke sistem DEWI JATENG',
        data: {
          id: newReport.id,
          report_code: newReport.report_code,
          status: newReport.status,
          tracking_url: `/lapor?code=${newReport.report_code}`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/reports POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendaftarkan laporan aduan', details: error.message },
      { status: 500 }
    );
  }
}
