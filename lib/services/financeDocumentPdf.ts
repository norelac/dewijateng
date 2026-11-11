import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * Bukti transaksi keuangan desa (PDF) yang dirender dari database.
 *
 * Berkas ini rekonstruksi data transaksi yang dicatat pengelola desa, bukan
 * pindaian dokumen bertanda tangan. Karena itu setiap halaman memuat
 * pernyataan keabsahan di bagian bawah.
 */

export interface BuktiTransactionData {
  referenceCode: string;
  type: 'PEMASUKAN' | 'PENGELUARAN';
  title: string;
  category: string;
  transactionDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: string | null;
  counterparty: string | null;
  note: string | null;
  villageName: string;
  regency: string;
  district: string;
  managerName: string;
  managerEmail: string | null;
  recordedBy: string;
  recordedAt: string;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;

const NAVY = rgb(0.051, 0.141, 0.325); // #0D2453
const GREY = rgb(0.392, 0.455, 0.545); // #64748B
const LINE = rgb(0.902, 0.925, 0.961); // #E6ECF5
const GREEN = rgb(0.129, 0.42, 0.333); // #216B55

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

function tanggalIndo(value: string): string {
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function jamIndo(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  let out = latin(text);
  if (font.widthOfTextAtSize(out, size) <= maxWidth) return out;
  while (out.length > 1 && font.widthOfTextAtSize(out + '...', size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '...';
}

export async function renderBuktiPdf(
  data: BuktiTransactionData
): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const isIncome = data.type === 'PEMASUKAN';
  const judul = isIncome ? 'BUKTI PENERIMAAN' : 'BUKTI PEMBAYARAN';

  doc.setTitle(`${judul} ${data.referenceCode}`);
  doc.setAuthor('DEWI JATENG - Disbudparekraf Provinsi Jawa Tengah');
  doc.setSubject(
    `Bukti transaksi ${isIncome ? 'pemasukan' : 'pengeluaran'} ${data.villageName}`
  );

  const page: PDFPage = doc.addPage(A4);
  let y = A4[1] - MARGIN;

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

  const rule = (thickness = 0.7, color = LINE) => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4[0] - MARGIN, y },
      thickness,
      color,
    });
  };

  // ---------- Kop ----------
  text('PEMERINTAH PROVINSI JAWA TENGAH', { size: 12, bold: true });
  y -= 15;
  text('DINAS KEBUDAYAAN DAN PARIWISATA', { size: 10, color: GREY });
  y -= 12;
  text('Platform DEWI JATENG - Transparansi Keuangan Desa Wisata', {
    size: 8,
    color: GREY,
  });
  y -= 14;
  rule(1.5, NAVY);
  y -= 30;

  text(judul, { size: 16, bold: true });
  y -= 16;
  text(`${data.referenceCode} - ${data.villageName}`, { size: 9, color: GREY });
  y -= 28;

  // ---------- Identitas desa ----------
  text('IDENTITAS DESA WISATA', { size: 10, bold: true });
  y -= 6;
  rule();
  y -= 16;

  const identity: [string, string][] = [
    ['Nama desa wisata', data.villageName],
    ['Kabupaten / Kota', data.regency],
    ['Kecamatan', data.district],
    ['Pengelola', data.managerName],
    ['Kontak pengelola', data.managerEmail || '-'],
  ];
  for (const [label, value] of identity) {
    text(label, { size: 9, color: GREY, width: 150 });
    text(value, { size: 9, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  y -= 10;

  // ---------- Rincian transaksi ----------
  text('RINCIAN TRANSAKSI', { size: 10, bold: true });
  y -= 6;
  rule();
  y -= 16;

  const detail: [string, string][] = [
    ['Nomor referensi', data.referenceCode],
    ['Tanggal transaksi', tanggalIndo(data.transactionDate)],
    ['Kategori', data.category],
    ['Uraian', data.title],
    ['Metode pembayaran', data.paymentMethod || '-'],
    [isIncome ? 'Sumber penerimaan' : 'Penerima pembayaran', data.counterparty || '-'],
  ];
  for (const [label, value] of detail) {
    text(label, { size: 9, color: GREY, width: 150 });
    text(value, { size: 9, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  if (data.note) {
    y -= 2;
    text('Catatan', { size: 9, color: GREY, width: 150 });
    text(data.note, { size: 9, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  y -= 14;

  // ---------- Total ----------
  page.drawRectangle({
    x: MARGIN,
    y: y - 34,
    width: CONTENT_WIDTH,
    height: 44,
    color: rgb(0.929, 0.953, 0.988), // #EDF3FC
    borderColor: LINE,
    borderWidth: 0.7,
  });
  y -= 4;
  text(isIncome ? 'TOTAL PENERIMAAN' : 'TOTAL PEMBAYARAN', { size: 9, bold: true, color: GREY });
  y -= 18;
  text(rupiah(data.amount), { size: 15, bold: true, color: isIncome ? GREEN : NAVY });
  y -= 40;

  // ---------- Pencatatan ----------
  text('PENCATATAN', { size: 10, bold: true });
  y -= 6;
  rule();
  y -= 16;
  const meta: [string, string][] = [
    ['Dicatat oleh', data.recordedBy],
    ['Waktu pencatatan', `${tanggalIndo(data.recordedAt)} ${jamIndo(data.recordedAt)} WIB`],
    ['Status bukti', 'Tersedia (dokumen ini)'],
  ];
  for (const [label, value] of meta) {
    text(label, { size: 9, color: GREY, width: 150 });
    text(value, { size: 9, x: MARGIN + 160, width: CONTENT_WIDTH - 160 });
    y -= 15;
  }

  // ---------- Catatan keabsahan ----------
  y = Math.min(y, MARGIN + 110);
  page.drawRectangle({
    x: MARGIN,
    y: y - 62,
    width: CONTENT_WIDTH,
    height: 66,
    color: rgb(0.969, 0.976, 0.988), // #F7F9FC
    borderColor: LINE,
    borderWidth: 0.7,
  });
  y -= 16;
  text('CATATAN KEABSAHAN DOKUMEN', { size: 9, bold: true });
  y -= 14;
  text(
    'Dokumen ini dihasilkan otomatis oleh sistem DEWI JATENG dari data transaksi',
    { size: 8, color: GREY }
  );
  y -= 11;
  text(
    'yang dicatat pengelola desa wisata. Dokumen ini bukan pindaian bukti transaksi',
    { size: 8, color: GREY }
  );
  y -= 11;
  text('bertanda tangan dan tidak menggantikan arsip resmi desa.', { size: 8, color: GREY });

  y -= 30;
  text(`Dicetak: ${tanggalIndo(new Date().toISOString())} - DEWI JATENG`, {
    size: 7.5,
    color: GREY,
  });

  const saved = await doc.save();
  const out = new Uint8Array(new ArrayBuffer(saved.byteLength));
  out.set(saved);
  return out;
}
