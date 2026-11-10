import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transparansi
 * Mengambil data transparansi anggaran dana desa wisata, dokumen LPJ, dan rincian belanja modal
 * Query params:
 * - village_id: UUID desa wisata
 * - slug: slug desa wisata (misal: "desa-wisata-candirejo")
 * - fiscal_year: tahun anggaran (default 2026)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const villageId = searchParams.get('village_id');
    const slug = searchParams.get('slug');
    const fiscalYear = parseInt(searchParams.get('fiscal_year') || '2026', 10);

    // Cari desa wisata
    let villageSql = `
      SELECT id, slug, name, regency, district, category, pokdarwis_name, contact_phone, trust_score
      FROM tourist_villages
      WHERE 1=1
    `;
    const villageParams: any[] = [];

    if (villageId) {
      villageParams.push(villageId);
      villageSql += ` AND id = $${villageParams.length}`;
    } else if (slug) {
      villageParams.push(slug);
      villageSql += ` AND slug = $${villageParams.length}`;
    } else {
      // Default: ambil desa pertama (misal Candirejo atau Getas)
      villageSql += ` ORDER BY trust_score DESC LIMIT 1`;
    }

    const villageRes = await query(villageSql, villageParams);

    if (villageRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Desa wisata tidak ditemukan' },
        { status: 404 }
      );
    }

    const village = villageRes.rows[0];

    // Ambil data bantuan keuangan (village_grants)
    const grantRes = await query(
      `SELECT
         id, fiscal_year, funding_source,
         apbdes_amount, banprov_amount, pades_amount,
         total_allocated, total_realized,
         remaining_balance, lpj_document_url, lpj_status, uploaded_at, created_at
       FROM village_grants
       WHERE village_id = $1 AND fiscal_year = $2
       LIMIT 1`,
      [village.id, fiscalYear]
    );

    let grant = grantRes.rows[0] || null;
    let expenses: any[] = [];

    if (grant) {
      // Ambil rincian pos belanja (grant_expenses)
      const expRes = await query(
        `SELECT
           id, activity_name, category, volume, unit, claimed_unit_price,
           budget_allocated, amount_realized, remaining_amount,
           ai_anomaly_flag, anomaly_note, created_at
         FROM grant_expenses
         WHERE grant_id = $1
         ORDER BY created_at ASC`,
        [grant.id]
      );
      expenses = expRes.rows;
    }

    // Ambil juga tarif resmi desa
    const tariffsRes = await query(
      `SELECT id, item_name, tariff_type, price, is_active
       FROM official_tariffs
       WHERE village_id = $1 AND is_active = true
       ORDER BY tariff_type ASC`,
      [village.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        village: {
          id: village.id,
          slug: village.slug,
          name: village.name,
          regency: village.regency,
          district: village.district,
          category: village.category,
          pokdarwis_name: village.pokdarwis_name,
          trust_score: parseFloat(village.trust_score || '0'),
        },
        grant: grant
          ? {
              id: grant.id,
              fiscal_year: grant.fiscal_year,
              funding_source: grant.funding_source,
              apbdes_amount: parseInt(grant.apbdes_amount || '0', 10),
              banprov_amount: parseInt(grant.banprov_amount || '0', 10),
              pades_amount: parseInt(grant.pades_amount || '0', 10),
              total_allocated: parseInt(grant.total_allocated, 10),
              total_realized: parseInt(grant.total_realized, 10),
              remaining_balance: parseInt(grant.remaining_balance, 10),
              lpj_document_url: grant.lpj_document_url,
              lpj_status: grant.lpj_status,
              uploaded_at: grant.uploaded_at,
            }
          : null,
        expenses: expenses.map((exp) => ({
          id: exp.id,
          activity_name: exp.activity_name,
          category: exp.category,
          volume: parseFloat(exp.volume),
          unit: exp.unit,
          claimed_unit_price: parseInt(exp.claimed_unit_price, 10),
          budget_allocated: parseInt(exp.budget_allocated, 10),
          amount_realized: parseInt(exp.amount_realized, 10),
          remaining_amount: parseInt(exp.remaining_amount, 10),
          ai_anomaly_flag: exp.ai_anomaly_flag,
          anomaly_note: exp.anomaly_note,
          created_at: exp.created_at,
        })),
        tariffs: tariffsRes.rows.map((t) => ({
          id: t.id,
          item_name: t.item_name,
          tariff_type: t.tariff_type,
          price: t.price,
        })),
      },
    });
  } catch (error: any) {
    console.error('[API /api/transparansi error]:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data transparansi' },
      { status: 500 }
    );
  }
}
