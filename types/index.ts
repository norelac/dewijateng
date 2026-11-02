export type VillageCategory = 'RINTISAN' | 'BERKEMBANG' | 'MAJU' | 'MANDIRI';

export interface TouristVillage {
  id: string;
  slug: string;
  name: string;
  regency: string; // 35 Kab/Kota di Jawa Tengah
  district: string;
  category: VillageCategory;
  latitude: number;
  longitude: number;
  trustScore: number; // 0 - 100
  safetyStatus: 'CERTIFIED_ACTIVE' | 'UNDER_INSPECTION' | 'NEEDS_COMMISSIONING';
  pokdarwisContact?: string;
  budget: {
    fiscalYear: number;
    bankeuProvinsi: number;
    apbdesModal: number;
    padesWisata: number;
    totalRealized: number;
  };
}

export interface CashbookEntry {
  id: string;
  villageId: string;
  villageName: string;
  date: string;
  description: string;
  category: 'MATERIAL' | 'UPAH_KERJA' | 'KESELAMATAN_K3' | 'OPERASIONAL';
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  receiptUrl: string;
  ocrAudit: {
    status: 'WAJAR' | 'FLAG_ANOMALI_MARKUP' | 'PENDING_AUDIT';
    merchant: string;
    deviationPercentage: number;
    notes: string;
  };
}

export type ReportCategory = 'PUNGLI' | 'FASILITAS_RUSAK' | 'BAHAYA_K3' | 'KEBERSIHAN';
export type ReportStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';

export interface IncidentReport {
  id: string;
  ticketCode: string; // e.g. DWJ-BMY-202611-0012
  villageId: string;
  villageName: string;
  category: ReportCategory;
  title: string;
  description: string;
  photoBeforeUrl: string;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  status: ReportStatus;
  slaHours: number; // 24h Pungli, 168h Fisik/K3
  deadlineAt: string;
  createdAt: string;
  proofOfFix?: {
    photoAfterUrl: string;
    actionSummary: string;
    officerName: string;
    resolvedAt: string;
  };
}

export interface MacroStats {
  totalVillages: number;
  breakdown: {
    rintisan: number;
    berkembang: number;
    maju: number;
  };
  fiscal: {
    bankeuAllocated: number;
    bankeuRealized: number;
    supportedVillages: number;
  };
  averageTrustScore: number;
  slaComplianceRate: number;
  totalResolvedTickets: number;
}
