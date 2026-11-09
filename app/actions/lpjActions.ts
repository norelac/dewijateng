// ==============================================================================
// DEWI JATENG - LPJ & Grant Server Actions
// Server Actions ('use server') untuk unggah dokumen LPJ resmi dan verifikasi pos belanja
// ==============================================================================

'use server';

import {
  saveLpjSubmission,
  getVillageLpjSummary,
  type SaveLpjResult,
} from '@/lib/services/lpjService';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Mengunggah salinan resmi berkas PDF LPJ Bantuan Keuangan Sarpras Balai Desa,
 * menjalankan ekstraksi pos belanja modal via AI Document Intelligence,
 * mengaudit harga terhadap batas SSH Jateng, dan memperbarui Trust Score desa.
 */
export async function processLpjUploadAction(
  formData: FormData
): Promise<ActionResponse<SaveLpjResult>> {
  try {
    const villageId =
      (formData.get('village_id') as string) ||
      (formData.get('villageId') as string) ||
      '';
    const fiscalYear = parseInt(
      (formData.get('fiscal_year') as string) ||
        (formData.get('fiscalYear') as string) ||
        '2026',
      10
    );
    const fundingSource =
      (formData.get('funding_source') as string) ||
      (formData.get('fundingSource') as string) ||
      '';
    const totalAllocated = parseInt(
      (formData.get('total_allocated') as string) ||
        (formData.get('totalAllocated') as string) ||
        '100000000',
      10
    );
    const file = formData.get('file') as File | null;

    if (!villageId) {
      return {
        success: false,
        error: 'Pilih desa wisata penerima alokasi dana terlebih dahulu',
      };
    }

    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'Berkas dokumen salinan PDF resmi LPJ wajib dilampirkan',
      };
    }

    // Validasi ukuran berkas (maksimal 25MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Ukuran berkas PDF melebihi batas maksimum 25MB',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const result = await saveLpjSubmission({
      villageId,
      fiscalYear,
      fundingSource,
      totalAllocated,
      pdfBuffer,
      fileName: file.name,
    });

    // Revalidasi jalur halaman portal aparatur, transparansi publik, dan beranda
    try {
      revalidatePath('/pengelola');
      revalidatePath('/transparansi');
      revalidatePath('/');
    } catch {
      // Abaikan jika dijalankan di luar context HTTP request Next.js (misal script test)
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('[processLpjUploadAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan sistem saat memproses berkas LPJ',
    };
  }
}

/**
 * Server Action: Mengambil ringkasan LPJ dana bantuan sarpras desa wisata
 */
export async function getVillageLpjDetailAction(
  villageId: string,
  fiscalYear: number = 2026
): Promise<ActionResponse<SaveLpjResult | null>> {
  try {
    if (!villageId || !villageId.trim()) {
      return { success: false, error: 'ID Desa Wisata tidak boleh kosong' };
    }

    const summary = await getVillageLpjSummary(villageId, fiscalYear);
    return { success: true, data: summary };
  } catch (error: any) {
    console.error('[getVillageLpjDetailAction Error]:', error);
    return {
      success: false,
      error: error.message || 'Gagal memuat ringkasan dokumen LPJ desa',
    };
  }
}
