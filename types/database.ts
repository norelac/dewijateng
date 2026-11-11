// ==============================================================================
// DEWI JATENG - Database Schema Types & Supabase Definitions
// Issue: [BE-01] Skema Database PostgreSQL 16, PostGIS 3.4, & Kebijakan Supabase RLS
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// --- ENUMS ---
export type VillageClassification = 'RINTISAN' | 'BERKEMBANG' | 'MAJU' | 'MANDIRI';
export type LpjStatus = 'PENDING_UPLOAD' | 'SUBMITTED' | 'VERIFIED' | 'REVISION';
export type UserRole = 'desa' | 'disbudparekraf';
export type ExpenseCategory = 'MATERIAL_FISIK' | 'UPAH_TENAGA' | 'KESELAMATAN_K3' | 'OPERASIONAL';
export type ReportCategory = 'FASILITAS_RUSAK' | 'PUNGLI' | 'BAHAYA_K3' | 'KEBERSIHAN';
export type ReportStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED';

// --- ROW INTERFACES ---
export interface TouristVillageRow {
  id: string;
  slug: string;
  name: string;
  regency: string;
  district: string;
  latitude: number;
  longitude: number;
  geom?: string | null;
  category: VillageClassification;
  pokdarwis_name: string;
  contact_phone: string;
  trust_score: number;
  created_at: string;
  updated_at: string;
}

export interface VillageGrantRow {
  id: string;
  village_id: string;
  fiscal_year: number;
  funding_source: string;
  total_allocated: number;
  total_realized: number;
  remaining_balance: number;
  lpj_document_url: string | null;
  lpj_status: LpjStatus;
  lpj_review_notes?: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  village_id: string | null;
  full_name: string;
  phone: string | null;
  status: 'AKTIF' | 'NONAKTIF';
  must_change_password: boolean;
  last_login_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GrantExpenseRow {
  id: string;
  grant_id: string;
  activity_name: string;
  category: ExpenseCategory;
  volume: number;
  unit: string;
  claimed_unit_price: number;
  budget_allocated: number;
  amount_realized: number;
  remaining_amount: number;
  ai_anomaly_flag: boolean;
  anomaly_note: string | null;
  created_at: string;
}

export interface SshReferenceRateRow {
  id: number;
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  standard_price: number;
  regency: string;
  effective_year: number;
  created_at: string;
}

export interface IncidentReportRow {
  id: string;
  report_code: string;
  village_id: string;
  category: ReportCategory;
  title: string;
  description: string;
  photo_before_url: string;
  latitude: number;
  longitude: number;
  geom?: string | null;
  is_anonymous: boolean;
  reporter_contact_hash: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface ReportResolutionRow {
  id: number;
  report_id: string;
  action_summary: string;
  photo_after_url: string;
  officer_name: string;
  exif_timestamp_verified: boolean;
  exif_photo_date: string | null;
  resolved_at: string;
}

// --- SUPABASE DATABASE SCHEMA DEFINITION ---
export interface Database {
  public: {
    Tables: {
      tourist_villages: {
        Row: TouristVillageRow;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          regency: string;
          district: string;
          latitude: number;
          longitude: number;
          geom?: string | null;
          category: VillageClassification;
          pokdarwis_name: string;
          contact_phone: string;
          trust_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          slug: string;
          name: string;
          regency: string;
          district: string;
          latitude: number;
          longitude: number;
          geom: string | null;
          category: VillageClassification;
          pokdarwis_name: string;
          contact_phone: string;
          trust_score: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      village_grants: {
        Row: VillageGrantRow;
        Insert: {
          id?: string;
          village_id: string;
          fiscal_year: number;
          funding_source: string;
          total_allocated: number;
          total_realized?: number;
          remaining_balance?: number;
          lpj_document_url?: string | null;
          lpj_status?: LpjStatus;
          uploaded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          village_id: string;
          fiscal_year: number;
          funding_source: string;
          total_allocated: number;
          total_realized: number;
          remaining_balance: number;
          lpj_document_url: string | null;
          lpj_status: LpjStatus;
          uploaded_at: string | null;
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'village_grants_village_id_fkey';
            columns: ['village_id'];
            referencedRelation: 'tourist_villages';
            referencedColumns: ['id'];
          }
        ];
      };
      grant_expenses: {
        Row: GrantExpenseRow;
        Insert: {
          id?: string;
          grant_id: string;
          activity_name: string;
          category: ExpenseCategory;
          volume?: number;
          unit?: string;
          claimed_unit_price?: number;
          budget_allocated: number;
          amount_realized: number;
          remaining_amount: number;
          ai_anomaly_flag?: boolean;
          anomaly_note?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          grant_id: string;
          activity_name: string;
          category: ExpenseCategory;
          volume: number;
          unit: string;
          claimed_unit_price: number;
          budget_allocated: number;
          amount_realized: number;
          remaining_amount: number;
          ai_anomaly_flag: boolean;
          anomaly_note: string | null;
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'grant_expenses_grant_id_fkey';
            columns: ['grant_id'];
            referencedRelation: 'village_grants';
            referencedColumns: ['id'];
          }
        ];
      };
      ssh_reference_rates: {
        Row: SshReferenceRateRow;
        Insert: {
          id?: number;
          item_code: string;
          item_name: string;
          category: string;
          unit: string;
          standard_price: number;
          regency?: string;
          effective_year?: number;
          created_at?: string;
        };
        Update: Partial<{
          id: number;
          item_code: string;
          item_name: string;
          category: string;
          unit: string;
          standard_price: number;
          regency: string;
          effective_year: number;
          created_at: string;
        }>;
        Relationships: [];
      };
      incident_reports: {
        Row: IncidentReportRow;
        Insert: {
          id?: string;
          report_code: string;
          village_id: string;
          category: ReportCategory;
          title: string;
          description: string;
          photo_before_url: string;
          latitude: number;
          longitude: number;
          geom?: string | null;
          is_anonymous?: boolean;
          reporter_contact_hash?: string | null;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          report_code: string;
          village_id: string;
          category: ReportCategory;
          title: string;
          description: string;
          photo_before_url: string;
          latitude: number;
          longitude: number;
          geom: string | null;
          is_anonymous: boolean;
          reporter_contact_hash: string | null;
          status: ReportStatus;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'incident_reports_village_id_fkey';
            columns: ['village_id'];
            referencedRelation: 'tourist_villages';
            referencedColumns: ['id'];
          }
        ];
      };
      report_resolutions: {
        Row: ReportResolutionRow;
        Insert: {
          id?: number;
          report_id: string;
          action_summary: string;
          photo_after_url: string;
          officer_name: string;
          exif_timestamp_verified?: boolean;
          exif_photo_date?: string | null;
          resolved_at?: string;
        };
        Update: Partial<{
          id: number;
          report_id: string;
          action_summary: string;
          photo_after_url: string;
          officer_name: string;
          exif_timestamp_verified: boolean;
          exif_photo_date: string | null;
          resolved_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'report_resolutions_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'incident_reports';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      update_geom_point: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      village_classification: VillageClassification;
      lpj_status: LpjStatus;
      expense_category: ExpenseCategory;
      report_category: ReportCategory;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
