import { db, query } from '@/lib/db';
import { sshReferenceRates } from '@/lib/db/schema';
import { ilike, sql } from 'drizzle-orm';

export interface AnomalyEvaluation {
  isAnomaly: boolean;
  deviationPct: number;
  standardPrice: number | null;
  note: string;
}

/**
 * Evaluasi deviasi persentase harga klaim terhadap standar SSH
 * Threshold: > +40% dianggap anomali mark-up
 */
export function evaluatePriceDeviation(
  claimedPrice: number,
  sshStandardPrice: number
): AnomalyEvaluation {
  if (sshStandardPrice <= 0) {
    return {
      isAnomaly: false,
      deviationPct: 0,
      standardPrice: null,
      note: 'Standar harga belum ditentukan',
    };
  }

  const deviationPct = ((claimedPrice - sshStandardPrice) / sshStandardPrice) * 100;
  const roundedDev = Number(deviationPct.toFixed(2));

  if (deviationPct > 40) {
    return {
      isAnomaly: true,
      deviationPct: roundedDev,
      standardPrice: sshStandardPrice,
      note: `Terdeteksi deviasi +${roundedDev}% melebihi batas atas SSH Jateng (Rp ${sshStandardPrice.toLocaleString('id-ID')})`,
    };
  }

  return {
    isAnomaly: false,
    deviationPct: roundedDev,
    standardPrice: sshStandardPrice,
    note: `Sesuai batas wajar SSH Jateng (Rp ${sshStandardPrice.toLocaleString('id-ID')})`,
  };
}

/**
 * Mencocokkan nama pos belanja dengan katalog SSH Pemprov Jateng
 */
export async function matchAndCheckSSH(
  itemName: string,
  claimedUnitPrice: number,
  regency?: string
): Promise<AnomalyEvaluation> {
  try {
    // Cari kata kunci penting: misal "semen", "pipa", "pasir", "bronjong", "cat"
    const keywords = itemName
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['dan', 'untuk', 'yang', 'pada'].includes(w));

    let matchedRate: { standard_price: number; item_name: string } | null = null;

    for (const kw of keywords) {
      const res = await query<{ standard_price: string; item_name: string }>(
        `SELECT standard_price, item_name
         FROM ssh_reference_rates
         WHERE LOWER(item_name) LIKE $1
         LIMIT 1`,
        [`%${kw}%`]
      );
      if (res.rows.length > 0) {
        matchedRate = {
          standard_price: parseInt(res.rows[0].standard_price, 10),
          item_name: res.rows[0].item_name,
        };
        break;
      }
    }

    if (!matchedRate) {
      return {
        isAnomaly: false,
        deviationPct: 0,
        standardPrice: null,
        note: 'Item kearifan lokal / belum terdaftar di katalog SSH standar Jateng',
      };
    }

    return evaluatePriceDeviation(claimedUnitPrice, matchedRate.standard_price);
  } catch (error) {
    return {
      isAnomaly: false,
      deviationPct: 0,
      standardPrice: null,
      note: 'Gagal memeriksa katalog SSH',
    };
  }
}
