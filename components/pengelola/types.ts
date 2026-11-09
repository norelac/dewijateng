export type TicketStatus = 'Masuk' | 'Diverifikasi' | 'Diproses' | 'Selesai';

export interface TimelineEvent {
  status: TicketStatus;
  date: string;
  title: string;
  description: string;
}

export interface DashboardTicket {
  id: string;
  code: string;
  title: string;
  date: string;
  fullDate?: string;
  status: TicketStatus;
  actionLabel: string;
  image: string;
  imageLabel?: string;
  imageSub?: string;
  resolvedImage?: string;
  resolvedImageLabel?: string;
  location: string;
  category: string;
  description: string;
  pelapor: string;
  notes?: string;
  timeline?: TimelineEvent[];
  updatedAt?: string;
}

export interface BudgetSource {
  name: string;
  percentage: number;
  amount: number;
  formattedAmount: string;
  color: string;
}

export interface VillageBudgetData {
  year: number;
  dateStr: string;
  apbdes: number;
  banprov: number;
  pades: number;
  usedAmount: number;
  usedActivitiesCount: number;
  lastUpdatedStr: string;
}

export const INITIAL_BUDGET_DATA: VillageBudgetData = {
  year: 2026,
  dateStr: '28 Oktober 2026',
  apbdes: 720000000,
  banprov: 300000000,
  pades: 180000000,
  usedAmount: 840000000,
  usedActivitiesCount: 4,
  lastUpdatedStr: '20 Okt 2026 · Bantuan Provinsi Rp300.000.000 dipublikasikan.',
};

export interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  amount: number;
  formattedAmount: string;
  hasReceipt: boolean;
  hasPhoto: boolean;
  status: 'Terpublikasi' | 'Draft';
  receiptUrl?: string;
  photoUrl?: string;
}

export interface ActivityItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  code?: string;
}

export type ActivityType = 'Semua' | 'Laporan' | 'Anggaran';

export interface ActivityHistoryEvent {
  id: string;
  date: string;
  type: 'Laporan' | 'Anggaran';
  title: string;
  subject: string;
  desc: string;
  actionLabel: string;
  actionTab: 'laporan' | 'anggaran';
  ticketId?: string;
}

export interface HandlingStage {
  date: string;
  label: string;
}

