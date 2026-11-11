import { query } from '@/lib/db';

/**
 * Bukti belanja desa wisata.
 *
 * Skema `grant_expenses` sengaja tidak menyimpan kolom unggahan nota/foto
 * (lihat catatan di docker/seed-demo-full.sql). Supaya halaman Transparansi
 * tetap punya bukti yang bisa dibuka, nota dirender dari baris basis data dan
 * foto fisik dipetakan dari jenis kegiatan. Tidak ada berkas statis per pos.
 *
 * ponytail: begitu pengelola desa mengunggah nota/foto asli, simpan URL-nya di
 * kolom baru `receipt_url`/`photo_url` dan hentikan penurunan otomatis di sini.
 */

export interface ExpenseEvidence {
  id: string;
  activityName: string;
  category: string;
  volume: number;
  unit: string;
  unitPrice: number;
  amountRealized: number;
  budgetAllocated: number;
  remainingAmount: number;
  anomalyFlag: boolean;
  anomalyNote: string | null;
  createdAt: string | null;
  villageName: string;
  regency: string;
  fiscalYear: number;
  fundingSource: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isExpenseId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function getExpenseEvidence(
  expenseId: string
): Promise<ExpenseEvidence | null> {
  if (!isExpenseId(expenseId)) return null;

  const res = await query<any>(
    `SELECT ge.id, ge.activity_name, ge.category, ge.volume, ge.unit,
            ge.claimed_unit_price, ge.amount_realized, ge.budget_allocated,
            ge.remaining_amount, ge.ai_anomaly_flag, ge.anomaly_note, ge.created_at,
            tv.name AS village_name, tv.regency,
            vg.fiscal_year, vg.funding_source
       FROM grant_expenses ge
       JOIN village_grants vg ON vg.id = ge.grant_id
       JOIN tourist_villages tv ON tv.id = vg.village_id
      WHERE ge.id = $1
      LIMIT 1`,
    [expenseId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    id: row.id,
    activityName: row.activity_name,
    category: row.category,
    volume: parseFloat(row.volume),
    unit: row.unit,
    unitPrice: parseInt(row.claimed_unit_price, 10),
    amountRealized: parseInt(row.amount_realized, 10),
    budgetAllocated: parseInt(row.budget_allocated, 10),
    remainingAmount: parseInt(row.remaining_amount, 10),
    anomalyFlag: Boolean(row.ai_anomaly_flag),
    anomalyNote: row.anomaly_note,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    villageName: row.village_name,
    regency: row.regency,
    fiscalYear: row.fiscal_year,
    fundingSource: row.funding_source,
  };
}

/** Foto fisik contoh: dipilih dari jenis kegiatan, bukan dari id acak. */
export function derivePhotoUrl(
  activityName: string,
  category: string
): string {
  const name = activityName.toLowerCase();

  if (/parkir|kanstin|paving/.test(name)) return '/img/figma/aduan-parkir.png';
  if (/sampah|kebersihan|gazebo|taman/.test(name)) return '/img/figma/aduan-sampah.png';
  if (/toilet|sanitasi|air|wastafel|pipa/.test(name)) return '/img/figma/aduan-wastafel.png';
  if (/curug|jalur|pejalan|pagar|gazebo/.test(name)) return '/img/figma/curug-sesudah.png';

  switch (category) {
    case 'MATERIAL_FISIK':
      return '/img/figma/curug-sesudah.png';
    case 'KESELAMATAN_K3':
      return '/img/figma/aduan-wastafel.png';
    case 'OPERASIONAL':
      return '/img/figma/aduan-sampah.png';
    case 'UPAH_TENAGA':
      return '/img/figma/aduan-parkir.png';
    default:
      return '/img/figma/curug-sesudah.png';
  }
}

export function receiptUrlFor(expenseId: string): string {
  return `/documents/nota-${expenseId}.svg`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value || 0))}`;
}

function tanggalIndo(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Render nota kuitansi sebagai SVG dari data basis data. */
export function renderNotaSvg(data: ExpenseEvidence): string {
  const width = 520;
  const pad = 32;
  const inner = width - pad * 2;

  const lines = [
    ['Uraian', data.activityName],
    ['Volume', `${new Intl.NumberFormat('id-ID').format(data.volume)} ${data.unit}`],
    ['Harga satuan', rupiah(data.unitPrice)],
    ['Pagu pos', rupiah(data.budgetAllocated)],
    ['Sisa pos', rupiah(data.remainingAmount)],
    ['Sumber dana', data.fundingSource],
    ['Kategori', data.category.replace(/_/g, ' ')],
  ];

  const rowsTop = 250;
  const rowGap = 40;
  const rowsEnd = rowsTop + lines.length * rowGap;
  const anomalyHeight = data.anomalyNote ? 66 : 0;
  const totalBoxTop = rowsEnd + anomalyHeight + 24;
  const height = totalBoxTop + 168;

  let y = rowsTop;
  const rowSvg = lines
    .map(([label, value]) => {
      const clipped = value.length > 46 ? `${value.slice(0, 46)}…` : value;
      const svg = `
    <text x="${pad}" y="${y}" font-size="13" fill="#64748B">${escapeXml(label)}</text>
    <text x="${pad + inner}" y="${y}" font-size="13" fill="#0D2453" text-anchor="end" font-weight="600">${escapeXml(clipped)}</text>
    <line x1="${pad}" y1="${y + 10}" x2="${pad + inner}" y2="${y + 10}" stroke="#E6ECF5" stroke-width="1" />`;
      y += rowGap;
      return svg;
    })
    .join('');

  const anomaly = data.anomalyNote
    ? `<g>
    <rect x="${pad}" y="${rowsEnd + 6}" width="${inner}" height="52" rx="8" fill="#FEF2F2" stroke="#FECACA" />
    <text x="${pad + 14}" y="${rowsEnd + 28}" font-size="11" font-weight="700" fill="#991B1B">CATATAN ANOMALI</text>
    <text x="${pad + 14}" y="${rowsEnd + 45}" font-size="11" fill="#991B1B">${escapeXml(
      data.anomalyNote.length > 58
        ? `${data.anomalyNote.slice(0, 58)}…`
        : data.anomalyNote
    )}</text>
  </g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Nota kuitansi ${escapeXml(
    data.activityName
  )}">
  <rect width="${width}" height="${height}" fill="#F7F9FC" />
  <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="16" fill="#FFFFFF" stroke="#E6ECF5" />
  <text x="${pad}" y="56" font-size="12" font-weight="700" fill="#0D2453" letter-spacing="2">NOTA KUITANSI BELANJA DESA</text>
  <text x="${pad}" y="82" font-size="11" fill="#64748B">DEWI JATENG · Transparansi Dana Desa Wisata</text>
  <line x1="${pad}" y1="98" x2="${pad + inner}" y2="98" stroke="#0D2453" stroke-width="2" />

  <text x="${pad}" y="128" font-size="11" fill="#64748B">Desa</text>
  <text x="${pad}" y="150" font-size="16" font-weight="700" fill="#0D2453">${escapeXml(data.villageName)}</text>
  <text x="${pad}" y="170" font-size="11" fill="#64748B">${escapeXml(data.regency)} · Tahun Anggaran ${data.fiscalYear}</text>

  <text x="${pad + inner}" y="128" font-size="11" fill="#64748B" text-anchor="end">Tanggal</text>
  <text x="${pad + inner}" y="150" font-size="13" font-weight="600" fill="#0D2453" text-anchor="end">${tanggalIndo(
    data.createdAt
  )}</text>
  <text x="${pad + inner}" y="170" font-size="11" fill="#64748B" text-anchor="end">No. ${escapeXml(
    data.id.slice(0, 8).toUpperCase()
  )}</text>

  <line x1="${pad}" y1="190" x2="${pad + inner}" y2="190" stroke="#E6ECF5" stroke-width="1" />
  ${rowSvg}
  ${anomaly}

  <rect x="${pad}" y="${totalBoxTop}" width="${inner}" height="64" rx="10" fill="#0D2453" />
  <text x="${pad + 16}" y="${totalBoxTop + 26}" font-size="11" fill="#CBD5E1">JUMLAH DIBAYARKAN</text>
  <text x="${pad + inner - 16}" y="${totalBoxTop + 46}" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="end">${rupiah(
    data.amountRealized
  )}</text>

  <text x="${pad}" y="${height - 60}" font-size="10" fill="#94A3B8">Dokumen demo — dirender otomatis dari basis data DEWI JATENG.</text>
  <text x="${pad}" y="${height - 44}" font-size="10" fill="#94A3B8">Bukan bukti pembayaran resmi.</text>
  <text x="${pad + inner}" y="${height - 52}" font-size="10" font-weight="700" fill="#0D2453" text-anchor="end">DEWI JATENG</text>
</svg>`;
}
