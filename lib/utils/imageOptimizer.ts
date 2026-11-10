// ==============================================================================
// DEWI JATENG - Client-Side Image Optimizer & WebP Auto-Converter
// Mengonversi foto secara instan ke WebP di browser sebelum diunggah ke server.
// Mereduksi ukuran foto kamera HP (5-15MB) menjadi ~150-300KB (hemat bandwidth 90%+).
// ==============================================================================

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Mengonversi File gambar (JPEG, PNG, HEIC, dsb.) ke format WebP terkompresi.
 * Jika file bukan gambar atau browser tidak mendukung Canvas toBlob WebP, file asli dikembalikan.
 */
export async function convertImageToWebP(
  file: File,
  options?: ImageOptimizationOptions
): Promise<File> {
  // Hanya proses file gambar
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Jika sudah webp dan ukurannya sudah relatif kecil (< 400KB), tidak perlu re-encode
  if (file.type === 'image/webp' && file.size < 400 * 1024) {
    return file;
  }

  const maxWidth = options?.maxWidth || 1600;
  const maxHeight = options?.maxHeight || 1600;
  const quality = options?.quality ?? 0.82;

  return new Promise((resolve) => {
    // Cek apakah browser mendukung Canvas WebP export
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const isWebpSupported = testCanvas.toDataURL('image/webp').indexOf('image/webp') === 5;

    if (!isWebpSupported) {
      // Fallback jika browser lawas tidak mendukung export webp
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proporsional menjaga aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Gambar ke canvas dengan dimensi teroptimasi
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const cleanBase = file.name.replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${cleanBase}.webp`, {
              type: 'image/webp',
              lastModified: file.lastModified || Date.now(),
            });
            resolve(optimizedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
