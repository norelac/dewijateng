// ==============================================================================
// DEWI JATENG - Resolution Server Actions
// Server Actions ('use server') untuk penutupan tiket aduan Pokdarwis dengan Proof-of-Fix
// ==============================================================================

'use server';

import {
  resolveIncidentReport,
  type ResolveIncidentResult,
} from '@/lib/services/resolutionService';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Menyelesaikan laporan aduan fasilitas di Papan Kerja Pokdarwis
 * Memverifikasi integritas EXIF timestamp foto perbaikan, menyimpan ke storage,
 * mengubah status tiket menjadi RESOLVED, dan merefresh Trust Score desa.
 */
export async function resolveReportAction(
  formData: FormData
): Promise<ActionResponse<ResolveIncidentResult>> {
  try {
    const reportCode =
      (formData.get('report_code') as string) ||
      (formData.get('reportCode') as string) ||
      '';
    const actionSummary =
      (formData.get('action_summary') as string) ||
      (formData.get('actionSummary') as string) ||
      '';
    const officerName =
      (formData.get('officer_name') as string) ||
      (formData.get('officerName') as string) ||
      '';
    const photo =
      (formData.get('photo_after') as File | null) ||
      (formData.get('photo') as File | null);

    let photoBuffer: Buffer | undefined;
    let photoName: string | undefined;

    if (photo && photo.size > 0 && typeof photo.arrayBuffer === 'function') {
      const arrayBuffer = await photo.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
      photoName = photo.name;
    }

    const result = await resolveIncidentReport({
      reportCode,
      photoBuffer,
      photoName,
      actionSummary,
      officerName,
    });

    // Revalidasi jalur halaman Pokdarwis, pelacakan aduan publik, dan beranda
    try {
      revalidatePath('/pengelola');
      revalidatePath('/lapor');
      revalidatePath('/');
    } catch {
      // Abaikan jika dijalankan di luar context HTTP request Next.js (misal script pengujian)
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('[resolveReportAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat memproses resolusi tiket',
    };
  }
}
