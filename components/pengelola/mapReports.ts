import type { IncidentReportDetail } from '@/lib/services/reportService';
import type {
  DashboardTicket,
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
