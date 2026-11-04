import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/db';
import { touristVillages } from '@/lib/db/schema';
import { desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/villages
 * Mengambil daftar desa wisata di Jawa Tengah
 * Query params opsional:
 * - regency: nama kabupaten (misal: "Kabupaten Magelang")
 * - lat, lng: koordinat pengguna untuk mencari desa terdekat via PostGIS
 * - limit: batas jumlah data (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regency = searchParams.get('regency');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Jika parameter koordinat diberikan, gunakan PostGIS ST_Distance
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        const result = await query(
          `SELECT
             id, slug, name, regency, district, latitude, longitude,
             category, pokdarwis_name, contact_phone, trust_score,
             ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 as distance_km
           FROM tourist_villages
           ${regency ? 'WHERE regency ILIKE $3' : ''}
           ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
           LIMIT $${regency ? '4' : '3'}`,
          regency ? [longitude, latitude, `%${regency}%`, limit] : [longitude, latitude, limit]
        );

        return NextResponse.json({
          success: true,
          count: result.rows.length,
          data: result.rows,
        });
      }
    }

    // Default query biasa
    let sqlText = `
      SELECT id, slug, name, regency, district, latitude, longitude,
             category, pokdarwis_name, contact_phone, trust_score
      FROM tourist_villages
    `;
    const params: any[] = [];

    if (regency) {
      sqlText += ` WHERE regency ILIKE $1`;
      params.push(`%${regency}%`);
    }

    sqlText += ` ORDER BY name ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sqlText, params);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('[API /api/villages error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data desa wisata', details: error.message },
      { status: 500 }
    );
  }
}
