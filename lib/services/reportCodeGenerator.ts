import { query } from '@/lib/db';

/**
 * DEWI JATENG - Generator Kode Pelaporan Unik (Thread-Safe & Atomic)
 * Menghasilkan kode tiket dengan format: LP-JTG-{TAHUN}-{URUT_4_DIGIT}
 * Contoh: LP-JTG-2026-0001, LP-JTG-2026-0012
 *
 * Menggunakan PostgreSQL sequence asli per tahun anggaran untuk mencegah
 * race condition ketika banyak warga mengirim aduan pada milidetik yang sama.
 */
export async function generateReportCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const seqName = `seq_report_code_${currentYear}`;
  const prefix = `LP-JTG-${currentYear}-`;

  try {
    // Memastikan sequence untuk tahun berjalan tersedia dan selalu disinkronkan dengan data terbaru
    await query(`
      DO $$
      DECLARE
        max_existing_seq BIGINT;
        current_seq_val BIGINT;
      BEGIN
        -- Buat sequence jika belum ada
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = '${seqName}') THEN
          CREATE SEQUENCE ${seqName} START 1;
        END IF;

        -- Ambil nomor urut tertinggi yang sudah ada di tabel
        SELECT COALESCE(MAX(SUBSTRING(report_code FROM '(\\d+)$')::bigint), 0)
        INTO max_existing_seq
        FROM incident_reports
        WHERE report_code LIKE 'LP-JTG-${currentYear}-%';

        -- Ambil nilai sequence saat ini
        SELECT last_value INTO current_seq_val FROM ${seqName};

        -- Sinkronkan: gunakan nilai terbesar antara MAX di tabel vs sequence saat ini
        -- Tambah 1 untuk nomor berikutnya
        PERFORM setval(
          '${seqName}',
          GREATEST(max_existing_seq, current_seq_val) + 1,
          false
        );
      END $$;
    `);

    const res = await query<{ nextval: string }>(
      `SELECT nextval('${seqName}') AS nextval`
    );

    const seq = parseInt(res.rows[0].nextval, 10).toString().padStart(4, '0');
    return `${prefix}${seq}`;
  } catch (error) {
    console.warn('[ReportCodeGenerator] Sequence warning, fallback to MAX query / random:', error);
    try {
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
    } catch {
      const randomFallback = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${randomFallback}`;
    }
  }
}
