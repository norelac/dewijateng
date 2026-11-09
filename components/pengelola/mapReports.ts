import type { IncidentReportDetail } from '@/lib/services/reportService';
import type {
  ActivityHistoryEvent,
  DashboardTicket,
  ExpenseItem,
  HandlingStage,
  TimelineEvent,
  TicketStatus,
  VillageBudgetData,
} from './types';

const CATEGORY_LABELS: Record<string, string> = {
  FASILITAS_RUSAK: 'Fasilitas & Sanitasi',
  PUNGLI: 'Pungutan Liar',
  BAHAYA_K3: 'Keselamatan (K3)',
  KEBERSIHAN: 'Kebersihan & Lingkungan',
};

const FALLBACK_IMG = '/img/figma/aduan-curug-sebelum.png';

/** Enum BE (SUBMITTED/IN_PROGRESS/RESOLVED) → status UI pengelola. */
export function mapReportStatus(status: string): TicketStatus {
  if (status === 'RESOLVED') return 'Selesai';
  if (status === 'IN_PROGRESS') return 'Diproses';
  return 'Masuk';
}

export function actionLabelFor(status: TicketStatus): string {
  if (status === 'Selesai') return 'Lihat bukti fisik';
  if (status === 'Diproses') return 'Perbarui progres';
  if (status === 'Diverifikasi') return 'Mulai penanganan';
  return 'Verifikasi laporan';
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

function fmt(value: string | Date, opts: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', opts);
}

export function mapIncidentToDashboardTicket(r: IncidentReportDetail): DashboardTicket {
  const status = mapReportStatus(r.status);
  const location =
    [r.village?.name, r.village?.regency].filter(Boolean).join(', ') || 'Jawa Tengah';

  const timeline: TimelineEvent[] = [];
  if (r.resolution) {
    timeline.push({
      status: 'Selesai',
      date: fmt(r.resolution.resolvedAt || r.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' }),
      title: 'Penanganan laporan selesai',
      description: r.resolution.actionSummary || 'Dokumentasi perbaikan tersedia.',
    });
  }
  timeline.push({
    status: 'Masuk',
    date: fmt(r.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }),
    title: 'Laporan diterima',
    description: 'Menunggu pemeriksaan dan verifikasi pengelola desa.',
  });

  return {
    id: r.id,
    code: r.reportCode,
    title: r.title,
    date: fmt(r.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }),
    fullDate: `Diterima ${fmt(r.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    status,
    actionLabel: actionLabelFor(status),
    image: r.photoBeforeUrl || FALLBACK_IMG,
    imageLabel: 'Foto kondisi awal',
    imageSub: 'Lampiran laporan warga',
    resolvedImage: r.resolution?.photoAfterUrl || undefined,
    resolvedImageLabel: r.resolution?.photoAfterUrl ? 'Sesudah penanganan' : undefined,
    location,
    category: CATEGORY_LABELS[r.category] || r.category,
    description: r.description,
    pelapor: r.isAnonymous ? 'Anonim (Warga/Wisatawan)' : 'Warga terverifikasi',
    notes: r.resolution?.actionSummary || undefined,
    timeline,
    updatedAt: fmt(r.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

export interface TransparansiGrant {
  fiscal_year: number;
  funding_source: string;
  total_allocated: number;
  total_realized: number;
  lpj_document_url?: string | null;
  uploaded_at?: string;
}

/**
 * Map respons /api/transparansi → VillageBudgetData.
 * ponytail: API tidak memecah APBDes/Banprov/PADes; seluruh alokasi grant
 * dipetakan ke Bantuan Provinsi. Pecah saat BE menyediakan rincian per sumber.
 */
export function mapGrantToBudget(
  grant: TransparansiGrant,
  expensesCount: number
): VillageBudgetData {
  const updated = grant.uploaded_at ? toDate(grant.uploaded_at) : new Date();
  const dateStr = isNaN(updated.getTime())
    ? 'Periode berjalan'
    : fmt(updated, { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    year: grant.fiscal_year,
    dateStr,
    apbdes: 0,
    banprov: grant.total_allocated,
    pades: 0,
    usedAmount: grant.total_realized,
    usedActivitiesCount: expensesCount,
    lastUpdatedStr: `${grant.funding_source || 'Bantuan Keuangan'} · ${dateStr}`,
  };
}

export interface TransparansiExpense {
  id: string;
  activity_name: string;
  category?: string | null;
  volume?: number | string | null;
  unit?: string | null;
  budget_allocated?: number | string | null;
  amount_realized?: number | string | null;
  ai_anomaly_flag?: boolean | null;
  created_at?: string | null;
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MATERIAL_FISIK: 'Material fisik',
  OPERASIONAL: 'Operasional',
  UPAH_TENAGA: 'Upah tenaga',
  KESELAMATAN_K3: 'Keselamatan (K3)',
  PERALATAN: 'Peralatan',
  LAINNYA: 'Lainnya',
};

function prettyCategory(value?: string | null): string | null {
  if (!value) return null;
  if (EXPENSE_CATEGORY_LABELS[value]) return EXPENSE_CATEGORY_LABELS[value];
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return isNaN(n) ? 0 : n;
}

/**
 * Map pos belanja grant_expenses → ExpenseItem.
 * ponytail: tidak ada kolom URL nota/foto per pos; tautan nota memakai LPJ grant.
 * Tambah kolom bukti per pos di BE saat tersedia.
 */
export function mapGrantExpenseToExpenseItem(
  exp: TransparansiExpense,
  receiptUrl?: string
): ExpenseItem {
  const amount = toNumber(exp.amount_realized) || toNumber(exp.budget_allocated);
  const date = exp.created_at
    ? fmt(exp.created_at, { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';
  const subtitle = [prettyCategory(exp.category), exp.volume ? `${exp.volume} ${exp.unit || ''}`.trim() : null]
    .filter(Boolean)
    .join(' · ');

  return {
    id: exp.id,
    date,
    title: exp.activity_name || 'Pos belanja',
    subtitle: subtitle || 'Pos belanja modal',
    amount,
    formattedAmount: new Intl.NumberFormat('id-ID').format(amount),
    hasReceipt: Boolean(receiptUrl),
    hasPhoto: false,
    status: 'Terpublikasi',
    receiptUrl,
    photoUrl: undefined,
  };
}

/** Bangun feed aktivitas turunan dari tiket aduan (+ grant bila ada). */
export function buildActivityEvents(
  tickets: DashboardTicket[],
  grant?: TransparansiGrant | null
): ActivityHistoryEvent[] {
  const events: ActivityHistoryEvent[] = tickets.map((t) => ({
    id: `lap-${t.id}`,
    date: t.date,
    type: 'Laporan',
    title:
      t.status === 'Selesai'
        ? 'Penanganan laporan selesai'
        : t.status === 'Diproses'
        ? 'Penanganan laporan dimulai'
        : 'Laporan baru diterima',
    subject: `${t.title} · ${t.code}`,
    desc:
      t.status === 'Selesai'
        ? 'Dokumentasi perbaikan tersedia.'
        : t.status === 'Diproses'
        ? 'Sedang ditangani pengelola desa.'
        : 'Menunggu verifikasi pengelola desa.',
    actionLabel: 'Lihat detail laporan →',
    actionTab: 'laporan',
    ticketId: t.id,
  }));

  if (grant) {
    const d = grant.uploaded_at ? toDate(grant.uploaded_at) : new Date();
    const date = isNaN(d.getTime())
      ? '-'
      : fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });
    events.push({
      id: `ang-${grant.fiscal_year}-${grant.funding_source || 'grant'}`,
      date,
      type: 'Anggaran',
      title: 'Ringkasan anggaran dipublikasikan',
      subject: `${grant.funding_source || 'Bantuan Keuangan'} · Rp${new Intl.NumberFormat('id-ID').format(grant.total_allocated || 0)}`,
      desc: 'Realisasi belanja dan dokumen LPJ diperbarui.',
      actionLabel: 'Lihat anggaran →',
      actionTab: 'anggaran',
    });
  }

  return events;
}

/** Bangun jejak tahapan penanganan dari timeline tiket selesai. */
export function mapTicketToHandlingStages(ticket: DashboardTicket): HandlingStage[] {
  const timeline = ticket.timeline || [];
  if (timeline.length === 0) {
    return [{ date: ticket.date, label: ticket.status }];
  }
  return [...timeline].reverse().map((ev) => ({
    date: ev.date,
    label: ev.status,
  }));
}
