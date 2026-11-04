// ==============================================================================
// DEWI JATENG - Report Server Actions
// Server Actions ('use server') untuk mutasi & query aduan warga dari Client Components
// ==============================================================================

'use server';

import {
  createIncidentReport,
  getReportByCode,
  listPublicReports,
  type CreateReportDTO,
  type IncidentReportDetail,
} from '@/lib/services/reportService';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Mengirimkan laporan aduan warga langsung dari formulir antarmuka
 */
export async function submitReportAction(formData: FormData): Promise<
  ActionResponse<{
    id: string;
    reportCode: string;
    status: string;
    trackingUrl: string;
  }>
> {
  try {
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || 'FASILITAS_RUSAK';
    const villageId = (formData.get('village_id') as string) || undefined;
    const rawLat = formData.get('latitude') as string;
    const rawLng = formData.get('longitude') as string;
    const isAnonymous = formData.get('is_anonymous') === 'true';
    const reporterPhone = (formData.get('reporter_phone') as string) || undefined;
    const photo = formData.get('photo') as File | null;

    let photoBuffer: Buffer | undefined;
    let photoName: string | undefined;

    if (photo && photo.size > 0 && typeof photo.arrayBuffer === 'function') {
      const arrayBuffer = await photo.arrayBuffer();
      photoBuffer = Buffer.from(arrayBuffer);
      photoName = photo.name;
    }

    const latitude = parseFloat(rawLat || '-6.9932');
    const longitude = parseFloat(rawLng || '110.4203');

    const result = await createIncidentReport({
      villageId,
      category,
      title,
      description,
      photoBuffer,
      photoName,
      latitude: isNaN(latitude) ? -6.9932 : latitude,
      longitude: isNaN(longitude) ? 110.4203 : longitude,
      isAnonymous,
      reporterPhone,
    });

    // Revalidasi cache halaman utama & halaman pelacakan
    try {
      revalidatePath('/');
      revalidatePath('/lapor');
    } catch {
      // Abaikan jika dijalankan di luar request context Next.js (e.g. testing script)
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('[submitReportAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat memproses laporan aduan',
    };
  }
}

/**
 * Server Action: Mengambil detail satu laporan berdasarkan kode tiket
 */
export async function getReportDetailAction(
  reportCode: string
): Promise<ActionResponse<IncidentReportDetail | null>> {
  try {
    if (!reportCode || !reportCode.trim()) {
      return { success: false, error: 'Kode tiket tidak boleh kosong' };
    }
    const report = await getReportByCode(reportCode);
    if (!report) {
      return { success: false, error: `Laporan ${reportCode.trim()} tidak ditemukan` };
    }
    return { success: true, data: report };
  } catch (error: any) {
    console.error('[getReportDetailAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Gagal memuat detail laporan aduan',
    };
  }
}

/**
 * Server Action: Mengambil daftar laporan terbaru untuk katalog publik
 */
export async function getPublicReportsAction(filters?: {
  status?: string;
  villageId?: string;
  limit?: number;
}): Promise<ActionResponse<IncidentReportDetail[]>> {
  try {
    const list = await listPublicReports(filters);
    return { success: true, data: list };
  } catch (error: any) {
    console.error('[getPublicReportsAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Gagal memuat daftar laporan aduan',
    };
  }
}
