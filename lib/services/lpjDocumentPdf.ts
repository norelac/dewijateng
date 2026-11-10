import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * Dokumen LPJ desa wisata (PDF) yang dirender dari data database.
 *
 * Catatan penting: berkas ini adalah **rekonstruksi resmi dari data LPJ yang
 * tersimpan** (pagu, realisasi, sisa, dan rincian pos belanja), bukan hasil
 * pindaian dokumen bertanda tangan. Halaman pertama selalu memuat pernyataan
 * tersebut agar tidak disalahgunakan sebagai bukti hukum.
 *
 * ponytail: kalau nanti ada arsip PDF asli yang diunggah pengelola desa
 * (lihat `lib/storage.ts` -> bucket `official-documents`), arahkan URL
 * `village_grants.lpj_document_url` ke `/uploads/official-documents/...`
 * sehingga route ini tidak lagi dipakai untuk desa tersebut.
 */

export interface LpjDocumentExpense {
  activity_name: string;
  category: string;
  volume: number;
  unit: string;
  claimed_unit_price: number;
  amount_realized: number;
  ai_anomaly_flag: boolean;
  anomaly_note: string | null;
}

export interface LpjDocumentData {
  villageName: string;
  regency: string;
  district: string | null;
  fiscalYear: number;
  fundingSource: string;
  totalAllocated: number;
  totalRealized: number;
  remainingBalance: number;
  lpjStatus: string;
  uploadedAt: string | null;
  trustScore: number | null;
  expenses: LpjDocumentExpense[];
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;

const NAVY = rgb(0.051, 0.141, 0.325); // #0D2453
const GREY = rgb(0.392, 0.455, 0.545); // #64748B
const LINE = rgb(0.902, 0.925, 0.961); // #E6ECF5
const AMBER = rgb(0.529, 0.357, 0.071); // #875B12

/** pdf-lib memakai WinAnsi: ganti karakter di luar Latin-1 agar tidak melempar error. */
function latin(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00B7/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');
}

function rupiah(value: number): string {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

function tanggalIndo(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function statusLabel(status: string): string {
  switch (status) {
    case 'VERIFIED':
      return 'Disetujui (VERIFIED)';
    case 'REVISION':
      return 'Perlu Revisi (REVISION)';
    case 'SUBMITTED':
      return 'Menunggu Telaah (SUBMITTED)';
    case 'PENDING_UPLOAD':
      return 'Belum Mengunggah (PENDING_UPLOAD)';
    default:
      return status;
  }
}

/** Potong teks agar tidak melewati lebar kolom. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  let out = latin(text);
  if (font.widthOfTextAtSize(out, size) <= maxWidth) return out;
  while (out.length > 1 && font.widthOfTextAtSize(out + '...', size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '...';
}

export async function renderLpjPdf(
  data: LpjDocumentData
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(`LPJ ${data.villageName} TA ${data.fiscalYear}`);
  doc.setAuthor('DEWI JATENG - Disbudparekraf Provinsi Jawa Tengah');
  doc.setSubject('Laporan Pertanggungjawaban Bantuan Keuangan Desa Wisata');

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - MARGIN;

  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - MARGIN;
  };

  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 28) newPage();
  };

  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: typeof NAVY; x?: number; width?: number } = {}
  ) => {
    const size = opts.size ?? 10;
    const f = opts.bold ? bold : font;
    const x = opts.x ?? MARGIN;
    const width = opts.width ?? CONTENT_WIDTH;
    page.drawText(fit(value, f, size, width), {
      x,
      y,
      size,
      font: f,
      color: opts.color ?? NAVY,
    });
  };

  // ---------- Kop dokumen ----------
  text('PEMERINTAH PROVINSI JAWA TENGAH', { size: 12, bold: true });
  y -= 15;
  text('DINAS KEBUDAYAAN DAN PARIWISATA', { size: 10, color: GREY });
  y -= 12;
  text('Platform DEWI JATENG - Transparansi Anggaran Desa Wisata', {
    size: 8,
    color: GREY,
  });
  y -= 14;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4[0] - MARGIN, y },
    thickness: 1.5,
    color: NAVY,
  });
  y -= 30;

  text('LAPORAN PERTANGGUNGJAWABAN (LPJ)', { size: 16, bold: true });
  y -= 16;
  text('Bantuan Keuangan Sarpras Pariwisata Desa Wisata', { size: 9, color: GREY });
  y -= 28;

  // ---------- Identitas desa ----------
  text('IDENTITAS DESA WISATA', { size: 10, bold: true });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4[0] - MARGIN, y },
    thickness: 0.7,
    color: LINE,
  });
  y -= 16;

  const identity: [string, string][] = [
    ['Nama desa wisata', data.villageName],
    ['Kabupaten / Kota', data.regency],
    ['Kecamatan', data.district || '-'],
    ['Tahun anggaran', String(data.fiscalYear)],
    ['Sumber dana', data.fundingSource],
    ['Status LPJ', statusLabel(data.lpjStatus)],
    ['Tanggal unggah', tanggalIndo(data.uploadedAt)],
  ];

  for (const [label, value] of identity) {
    text(label, { size: 9, color: GREY, width: 150 });
    text(value, { size: 9, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  y -= 10;

  // ---------- Ringkasan keuangan ----------
  ensure(120);
  text('RINGKASAN KEUANGAN', { size: 10, bold: true });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4[0] - MARGIN, y },
    thickness: 0.7,
    color: LINE,
  });
  y -= 16;

  const summary: [string, string][] = [
    ['Pagu anggaran', rupiah(data.totalAllocated)],
    ['Total realisasi', rupiah(data.totalRealized)],
    ['Sisa saldo', rupiah(data.remainingBalance)],
    [
      'Serapan anggaran',
      data.totalAllocated > 0
        ? `${((data.totalRealized / data.totalAllocated) * 100).toFixed(2)}%`
        : '-',
    ],
  ];

  for (const [label, value] of summary) {
    text(label, { size: 9, color: GREY, width: 150 });
    text(value, { size: 9, bold: true, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  y -= 10;

  // ---------- Rincian pos belanja ----------
  ensure(90);
  text('RINCIAN POS BELANJA', { size: 10, bold: true });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4[0] - MARGIN, y },
    thickness: 0.7,
    color: LINE,
  });
  y -= 16;

  if (data.expenses.length === 0) {
    text('Belum ada rincian pos belanja yang tercatat untuk tahun anggaran ini.', {
      size: 9,
      color: GREY,
    });
    y -= 18;
  } else {
    // Lebar kolom: uraian | volume | harga satuan | realisasi
    const colUraian = CONTENT_WIDTH - 90 - 95 - 100;
    const colVolume = 90;
    const colHarga = 95;
    const colRealisasi = 100;

    text('Uraian kegiatan', { size: 8, bold: true, color: GREY, width: colUraian });
    text('Volume', { size: 8, bold: true, color: GREY, x: MARGIN + colUraian, width: colVolume });
    text('Harga satuan', {
      size: 8,
      bold: true,
      color: GREY,
      x: MARGIN + colUraian + colVolume,
      width: colHarga,
    });
    text('Realisasi', {
      size: 8,
      bold: true,
      color: GREY,
      x: MARGIN + colUraian + colVolume + colHarga,
      width: colRealisasi,
    });
    y -= 5;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4[0] - MARGIN, y },
      thickness: 0.7,
      color: LINE,
    });
    y -= 14;

    for (const item of data.expenses) {
      ensure(46);

      const uraianX = MARGIN;
      const volumeX = MARGIN + colUraian;
      const hargaX = MARGIN + colUraian + colVolume;
      const realisasiX = MARGIN + colUraian + colVolume + colHarga;

      text(item.activity_name, { size: 8.5, width: colUraian - 6 });
      text(`${item.volume} ${item.unit}`, {
        size: 8.5,
        x: volumeX,
        width: colVolume - 6,
        color: GREY,
      });
      text(rupiah(item.claimed_unit_price), {
        size: 8.5,
        x: hargaX,
        width: colHarga - 6,
        color: GREY,
      });
      text(rupiah(item.amount_realized), {
        size: 8.5,
        x: realisasiX,
        width: colRealisasi,
        bold: true,
      });
      y -= 13;

      if (item.ai_anomaly_flag) {
        ensure(30);
        text(
          'Catatan: indikasi anomali harga - ' +
            (item.anomaly_note || 'perlu verifikasi terhadap HSD MAS PETRUK 2026'),
          { size: 7.5, color: AMBER }
        );
        y -= 12;
      }

      page.drawLine({
        start: { x: MARGIN, y: y + 3 },
        end: { x: A4[0] - MARGIN, y: y + 3 },
        thickness: 0.4,
        color: LINE,
      });
      y -= 6;
    }
  }

  y -= 12;

  // ---------- Catatan keabsahan ----------
  ensure(110);
  page.drawRectangle({
    x: MARGIN,
    y: y - 74,
    width: CONTENT_WIDTH,
    height: 78,
    color: rgb(0.929, 0.953, 0.988), // #EDF3FC
    borderColor: LINE,
    borderWidth: 0.7,
  });
  y -= 16;
  text('CATATAN KEABSAHAN DOKUMEN', { size: 9, bold: true });
  y -= 14;
  text(
    'Dokumen ini dihasilkan otomatis oleh sistem DEWI JATENG dari data LPJ yang',
    { size: 8, color: GREY }
  );
  y -= 11;
  text(
    'tersimpan di basis data Pemerintah Provinsi Jawa Tengah pada saat berkas dibuka.',
    { size: 8, color: GREY }
  );
  y -= 11;
  text(
    'Dokumen ini bukan pindaian berkas LPJ bertanda tangan dan tidak menggantikan',
    { size: 8, color: GREY }
  );
  y -= 11;
  text('dokumen resmi yang disimpan pada arsip Disbudparekraf.', { size: 8, color: GREY });

  y -= 34;
  text(
    `Dicetak: ${tanggalIndo(new Date().toISOString())} - DEWI JATENG`,
    { size: 7.5, color: GREY }
  );

  // Salin ke Uint8Array ber-ArrayBuffer agar aman dipakai sebagai BlobPart/body respons.
  const saved = await doc.save();
  const out = new Uint8Array(new ArrayBuffer(saved.byteLength));
  out.set(saved);
  return out;
}
