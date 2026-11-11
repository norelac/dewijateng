import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Batas radius wajar kawasan desa wisata: 15 km (15.000 meter)
const MAX_RADIUS_METERS = 15000;

/**
 * GET /api/villages/nearest?lat=-6.9928&lng=110.3957
 * Mendeteksi desa wisata terdekat berdasarkan koordinat pengguna
 * menggunakan kalkulasi spasial PostGIS ST_Distance.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, message: 'Parameter lat dan lng wajib disertakan' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, message: 'Koordinat lat atau lng tidak valid' },
        { status: 400 }
      );
    }

    // 1. Query PostGIS mencari desa wisata terdekat
    const sqlText = `
      SELECT
        id, slug, name, regency, district, latitude, longitude,
        category, pokdarwis_name, contact_phone, trust_score,
        ROUND((ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography))::numeric, 0) as distance_meters,
        ROUND((ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0)::numeric, 2) as distance_km
      FROM tourist_villages
      WHERE geom IS NOT NULL
      ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1
    `;

    const result = await query(sqlText, [longitude, latitude]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data desa wisata tidak ditemukan' },
        { status: 404 }
      );
    }

    const village = result.rows[0];
    const distanceMeters = parseFloat(village.distance_meters || '0');
    const distanceKm = parseFloat(village.distance_km || '0');
    const isWithinRadius = distanceMeters <= MAX_RADIUS_METERS;

    return NextResponse.json({
      success: true,
      data: {
        village: {
          id: village.id,
          slug: village.slug,
          name: village.name,
          regency: village.regency,
          district: village.district,
          latitude: village.latitude,
          longitude: village.longitude,
          pokdarwisName: village.pokdarwis_name,
          trustScore: parseFloat(village.trust_score || '80'),
        },
        distanceMeters,
        distanceKm,
        isWithinRadius,
        maxRadiusKm: MAX_RADIUS_METERS / 1000,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/villages/nearest error]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendeteksi desa wisata terdekat' },
      { status: 500 }
    );
  }
}
