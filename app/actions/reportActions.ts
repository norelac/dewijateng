// ==============================================================================
// DEWI JATENG - Report Server Actions
// Server Actions ('use server') untuk mutasi & query aduan warga dari Client Components
// ==============================================================================

'use server';

import {
  createIncidentReport,
  getReportByCode,
  listPublicReports,
  markReportInProgress,
  type CreateReportDTO,
  type IncidentReportDetail,
} from '@/lib/services/reportService';
import { getSession } from '@/lib/auth';
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

    // Dukungan banyak lampiran: field 'photo' boleh dikirim berulang (maks 3).
    const rawPhotoEntries = formData.getAll('photo');
    const photoFiles: { buffer: Buffer; name: string }[] = [];

    for (const entry of rawPhotoEntries) {
      if (
        entry &&
        typeof entry !== 'string' &&
        (entry as File).size > 0 &&
        typeof (entry as File).arrayBuffer === 'function'
      ) {
        const file = entry as File;
        const arrayBuffer = await file.arrayBuffer();
        photoFiles.push({ buffer: Buffer.from(arrayBuffer), name: file.name });
      }
    }

    const latitude = parseFloat(rawLat || '-6.9932');
    const longitude = parseFloat(rawLng || '110.4203');

    const result = await createIncidentReport({
      villageId,
      category,
      title,
      description,
      photoFiles: photoFiles.length > 0 ? photoFiles : undefined,
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

/**
 * Server Action: Menandai tiket aduan sedang dikerjakan (IN_PROGRESS) oleh Pokdarwis
 */
export async function markReportInProgressAction(
  reportCode: string
): Promise<ActionResponse<{ success: boolean; reportCode: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Akses ditolak: Anda harus masuk terlebih dahulu.' };
    }

    if (!reportCode || !reportCode.trim()) {
      return { success: false, error: 'Kode tiket tidak boleh kosong' };
    }
    const cleanCode = reportCode.toUpperCase().trim();
    const updated = await markReportInProgress(cleanCode);
    if (!updated) {
      return {
        success: false,
        error: `Laporan ${cleanCode} tidak dapat diubah ke IN_PROGRESS (laporan tidak ditemukan atau status bukan SUBMITTED)`,
      };
    }

    try {
      revalidatePath('/pengelola');
      revalidatePath('/lapor');
      revalidatePath('/');
    } catch {
      // Abaikan di luar context request Next.js
    }

    return {
      success: true,
      data: { success: true, reportCode: cleanCode },
    };
  } catch (error: any) {
    console.error('[markReportInProgressAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Gagal memperbarui status laporan menjadi IN_PROGRESS',
    };
  }
}

