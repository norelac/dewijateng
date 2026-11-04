import exifr from 'exifr';

export interface ExifValidationResult {
  verified: boolean;
  photoDate: Date | null;
  error?: string;
}

/**
 * DEWI JATENG - Validator Metadata EXIF Timestamp (Proof-of-Fix)
 * Memindai tag waktu pengambilan foto asli (DateTimeOriginal / CreateDate)
 * untuk memastikan foto bukti perbaikan diambil setelah insiden dilaporkan.
 */
export async function validatePhotoExif(
  buffer: Buffer,
  reportCreatedAt: Date
): Promise<ExifValidationResult> {
  try {
    const metadata = await exifr.parse(buffer, [
      'DateTimeOriginal',
      'CreateDate',
      'ModifyDate',
      'latitude',
      'longitude',
    ]);

    const photoDateRaw = metadata?.DateTimeOriginal || metadata?.CreateDate;

    if (!photoDateRaw) {
      // EXIF hilang / dihapus kompresi aplikasi chat (soft verification)
      return {
        verified: false,
        photoDate: null,
      };
    }

    const photoDate = new Date(photoDateRaw);
    if (isNaN(photoDate.getTime())) {
      return {
        verified: false,
        photoDate: null,
      };
    }

    // Bandingkan waktu foto dengan waktu laporan
    if (photoDate.getTime() < reportCreatedAt.getTime()) {
      return {
        verified: false,
        photoDate,
        error: 'Foto terdeteksi diambil sebelum laporan aduan dibuat (indikasi arsip lama)',
      };
    }

    return {
      verified: true,
      photoDate,
    };
  } catch (err) {
    // File tanpa EXIF atau format tidak terbaca
    return {
      verified: false,
      photoDate: null,
    };
  }
}
