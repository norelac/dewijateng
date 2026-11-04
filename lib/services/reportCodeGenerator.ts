import { db, query } from '@/lib/db';
import { incidentReports } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * DEWI JATENG - Generator Kode Pelaporan Unik
 * Menghasilkan kode tiket dengan format: LP-JTG-{TAHUN}-{URUT_4_DIGIT}
 * Contoh: LP-JTG-2026-0001, LP-JTG-2026-0012
 */
export async function generateReportCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `LP-JTG-${currentYear}-`;

  try {
    // Ambil nomor urut tertinggi untuk tahun berjalan
    const result = await query<{ max_code: string | null }>(
      `SELECT MAX(report_code) as max_code
       FROM incident_reports
       WHERE report_code LIKE $1`,
      [`${prefix}%`]
    );

    let nextNumber = 1;
    const maxCode = result.rows[0]?.max_code;

    if (maxCode) {
      const parts = maxCode.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    const paddedSeq = nextNumber.toString().padStart(4, '0');
    return `${prefix}${paddedSeq}`;
  } catch (error) {
    // Fallback jika query error
    const randomFallback = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomFallback}`;
  }
}
