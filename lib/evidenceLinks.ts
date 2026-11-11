// ==============================================================================
// Tautan bukti belanja desa (fungsi murni, aman untuk komponen klien).
//
// Dipisahkan dari `lib/services/evidenceService.ts` karena berkas itu mengimpor
// `@/lib/db`; komponen `'use client'` tidak boleh menarik driver basis data ke
// bundel peramban.
// ==============================================================================

/**
 * Foto fisik pendukung pos belanja. `grant_expenses` belum menyimpan kolom
 * unggahan, jadi foto dipetakan dari jenis kegiatan. Deterministik: kegiatan
 * yang sama selalu memakai foto yang sama.
 */
export function derivePhotoUrl(activityName: string, category: string): string {
  const name = (activityName || '').toLowerCase();

  if (/parkir|kanstin|paving/.test(name)) return '/img/figma/aduan-parkir.png';
  if (/sampah|kebersihan|gazebo|taman/.test(name)) return '/img/figma/aduan-sampah.png';
  if (/toilet|sanitasi|air|wastafel|pipa/.test(name)) return '/img/figma/aduan-wastafel.png';
  if (/curug|jalur|pejalan|pagar|gazebo/.test(name)) return '/img/figma/curug-sesudah.png';

  switch (category) {
    case 'MATERIAL_FISIK':
      return '/img/figma/curug-sesudah.png';
    case 'KESELAMATAN_K3':
      return '/img/figma/aduan-wastafel.png';
    case 'OPERASIONAL':
      return '/img/figma/aduan-sampah.png';
    case 'UPAH_TENAGA':
      return '/img/figma/aduan-parkir.png';
    default:
      return '/img/figma/curug-sesudah.png';
  }
}

/** Nota kuitansi dirender dari baris basis data, bukan berkas statis. */
export function receiptUrlFor(expenseId: string): string {
  return `/documents/nota-${expenseId}.svg`;
}
