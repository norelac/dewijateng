import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getFinanceRecap,
  getVillageFinance,
  listTransactions,
  periodeLabel,
  KELENGKAPAN_LABEL,
  type Kelengkapan,
  type TransactionType,
} from '@/lib/services/financeService';

export const dynamic = 'force-dynamic';

/**
 * GET /disbudparekraf/monitoring/export?scope=rekap|laporan|pemasukan|pengeluaran
 *
 * Mengunduh data monitoring keuangan sebagai CSV (dibuka Excel). Semua ekspor
 * memakai satu rute agar tidak ada halaman tambahan: outputnya berkas, bukan UI.
 */

const SCOPES = ['rekap', 'laporan', 'pemasukan', 'pengeluaran'] as const;
type Scope = (typeof SCOPES)[number];

/** Nilai CSV: kutip bila mengandung pemisah, kutip, atau baris baru. */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: unknown[][]): string {
  // BOM agar Excel membaca UTF-8 dengan benar.
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

function csvResponse(body: string, filename: string): NextResponse {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak ditemukan' }, { status: 401 });
  }
  if (session.role !== 'disbudparekraf') {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  const sp = new URL(request.url).searchParams;
  const scope = (sp.get('scope') || 'rekap') as Scope;
  const desa = sp.get('desa') || '';

  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ success: false, error: 'Jenis ekspor tidak dikenali' }, { status: 400 });
  }

  try {
    if (scope === 'rekap') {
      const kelengkapan = (sp.get('kelengkapan') || 'SEMUA').toUpperCase() as Kelengkapan | 'SEMUA';
      const recap = await getFinanceRecap({
        periode: sp.get('periode') || undefined,
        wilayah: sp.get('wilayah') || undefined,
        desa,
        kelengkapan: ['LENGKAP', 'PERLU_BUKTI', 'BELUM_LAPOR'].includes(kelengkapan)
          ? kelengkapan
          : 'SEMUA',
        perPage: 1000,
      });

      const rows: unknown[][] = [
        [`Rekap keuangan desa wisata - ${periodeLabel(recap.active.periode)}`],
        ['Desa wisata', 'Kabupaten/Kota', 'Pemasukan', 'Pengeluaran', 'Saldo awal', 'Saldo akhir', 'Kelengkapan'],
        ...recap.rows.map((row) => [
          row.shortName,
          row.regency,
          row.pemasukan,
          row.pengeluaran,
          row.saldoAwal,
          row.saldoAkhir,
          KELENGKAPAN_LABEL[row.kelengkapan],
        ]),
        [
          `Total ${recap.filteredTotals.desaMelapor} desa melapor`,
          '',
          recap.filteredTotals.pemasukan,
          recap.filteredTotals.pengeluaran,
          recap.filteredTotals.saldoAwal,
          recap.filteredTotals.saldoAkhir,
          '',
        ],
      ];
      return csvResponse(
        toCsv(rows),
        `rekap-keuangan-${recap.active.periode}.csv`
      );
    }

    if (!desa) {
      return NextResponse.json({ success: false, error: 'Parameter desa wajib diisi' }, { status: 400 });
    }

    if (scope === 'laporan') {
      const data = await getVillageFinance(desa, sp.get('periode') || undefined);
      if (!data) {
        return NextResponse.json({ success: false, error: 'Desa tidak ditemukan' }, { status: 404 });
      }

      const list = await listTransactions({
        slug: desa,
        type: 'PEMASUKAN',
        periode: data.periode,
        perPage: 1000,
      });
      const listOut = await listTransactions({
        slug: desa,
        type: 'PENGELUARAN',
        periode: data.periode,
        perPage: 1000,
      });

      const rows: unknown[][] = [
        [`Laporan keuangan ${data.village.name} - ${periodeLabel(data.periode)}`],
        ['Pemasukan', data.pemasukan],
        ['Pengeluaran', data.pengeluaran],
        ['Surplus periode', data.surplus],
        ['Saldo awal', data.saldoAwal],
        ['Saldo akhir', data.saldoAkhir],
        ['Jumlah transaksi', data.jumlahTransaksi],
        ['Bukti belum lengkap', data.jumlahTanpaBukti],
        [],
        ['Jenis', 'Tanggal', 'Kode referensi', 'Kategori', 'Transaksi', 'Nominal', 'Bukti'],
        ...[...(list?.rows ?? []), ...(listOut?.rows ?? [])].map((row) => [
          row.type === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran',
          row.transactionDate,
          row.referenceCode,
          row.category,
          row.title,
          row.amount,
          row.hasProof ? 'Lengkap' : 'Perlu bukti',
        ]),
      ];
      return csvResponse(toCsv(rows), `laporan-${desa}-${data.periode}.csv`);
    }

    const type: TransactionType = scope === 'pemasukan' ? 'PEMASUKAN' : 'PENGELUARAN';
    const data = await listTransactions({
      slug: desa,
      type,
      periode: sp.get('periode') || undefined,
      q: sp.get('q') || undefined,
      kategori: sp.get('kategori') || undefined,
      bukti:
        sp.get('bukti') === 'LENGKAP' || sp.get('bukti') === 'PERLU_BUKTI'
          ? (sp.get('bukti') as 'LENGKAP' | 'PERLU_BUKTI')
          : 'SEMUA',
      perPage: 1000,
    });
    if (!data) {
      return NextResponse.json({ success: false, error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const rows: unknown[][] = [
      [`Daftar ${scope} ${data.village.name} - ${periodeLabel(data.periode)}`],
      ['Tanggal', 'Kategori', 'Kode referensi', 'Transaksi', 'Nominal', 'Bukti'],
      ...data.rows.map((row) => [
        row.transactionDate,
        row.category,
        row.referenceCode,
        row.title,
        row.amount,
        row.hasProof ? 'Lengkap' : 'Perlu bukti',
      ]),
      [`Total ${data.total} transaksi ${scope}`, '', '', '', data.totalAmount, ''],
    ];
    return csvResponse(toCsv(rows), `${scope}-${desa}-${data.periode}.csv`);
  } catch (error) {
    console.error('[GET /disbudparekraf/monitoring/export error]:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyiapkan berkas ekspor' }, { status: 500 });
  }
}
