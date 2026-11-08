export type TicketStatus = 'Masuk' | 'Diverifikasi' | 'Diproses' | 'Selesai';

export interface DashboardTicket {
  id: string;
  code: string;
  title: string;
  date: string;
  status: TicketStatus;
  actionLabel: string;
  image: string;
  resolvedImage?: string;
  location: string;
  category: string;
  description: string;
  pelapor: string;
  updatedAt?: string;
}

export interface BudgetSource {
  name: string;
  percentage: number;
  amount: number;
  formattedAmount: string;
  color: string;
}

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
