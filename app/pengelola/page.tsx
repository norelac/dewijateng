import type { Metadata } from 'next';
import PengelolaTicketBoard from '@/components/PengelolaTicketBoard';
import BalaiDesaLpjUploader from '@/components/BalaiDesaLpjUploader';
import {
  AlertTriangle,
  Upload,
  KeyRound,
  Building2,
  ShieldCheck
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal Pengelola & Balai Desa - DEWI JATENG',
  description:
    'Dashboard operasional pengurus Pokdarwis dan Balai Desa wisata Jawa Tengah untuk menindaklanjuti tiket aduan masyarakat (Proof-of-Fix) dan mengunggah salinan LPJ Bantuan Keuangan Sarpras.',
};

export default function PengelolaPage() {
  return (
    <div>
      <div className="bg-gradient-to-b from-slate-900 via-[#0D2453] to-slate-900 text-white py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Portal Resmi Pengelola Desa Wisata &amp; Balai Desa</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Papan Kerja Pokdarwis &amp; Balai Desa
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl">
                Area kerja terpadu untuk merespons aduan wisatawan, mengunggah bukti nyata perbaikan (Proof-of-Fix), serta mengunggah salinan resmi LPJ Bantuan Keuangan Khusus Sarpras.
              </p>
            </div>

            {/* Quick Info Tag */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right shrink-0">
              <div className="text-xs text-slate-400">Status Akses:</div>
              <div className="text-base font-bold text-white mt-0.5">Pokdarwis &amp; Balai Desa</div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5">35 Kabupaten/Kota Jawa Tengah</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Action Guidance Box */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs leading-relaxed">
              <strong>Mandat Integritas Resolusi (Proof-of-Fix):</strong> Tiket aduan tidak dapat diselesaikan hanya dengan mengubah status teks; wajib disertai foto kondisi fisik sesudah perbaikan (Foto After) yang tervalidasi metadata waktu kameranya (EXIF).
            </div>
          </div>
        </div>

        {/* Ticket Management Interactive Island */}
        <section>
          <PengelolaTicketBoard />
        </section>

        {/* Alur Balai Desa: Unggah Dokumen Resmi LPJ */}
        <section>
          <BalaiDesaLpjUploader />
        </section>
      </div>
    </div>
  );
}
