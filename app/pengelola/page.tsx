import type { Metadata } from 'next';
import PengelolaTicketBoard from '@/components/PengelolaTicketBoard';
import {
  AlertTriangle,
  Upload,
  KeyRound
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal Pengelola & Disposisi Tiket - DEWI JATENG',
  description:
    'Dashboard operasional pengurus Pokdarwis dan BUMDes desa wisata Jawa Tengah untuk menindaklanjuti tiket aduan masyarakat dan menerbitkan bukti perbaikan Proof-of-Fix.',
};

export default function PengelolaPage() {
  return (
    <div>
      <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Mode Demo Juri WIA 2026: Terautentikasi Pokdarwis Binaan</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Portal Penugasan Lapangan &amp; Resolusi Tiket SLA
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl">
                Area kerja terpadu untuk merespons aduan wisatawan, mengunggah bukti nyata perbaikan (Proof-of-Fix), serta menjaga skor kepatuhan integritas desa wisata Anda.
              </p>
            </div>

            {/* Quick Info Tag */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right shrink-0">
              <div className="text-xs text-slate-400">Desa Binaan Login:</div>
              <div className="text-base font-bold text-white mt-0.5">Desa Wisata Limpakuwus</div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5">Kab. Banyumas • Terverifikasi BPD</div>
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
              <strong>Mandat Integritas Resolusi:</strong> Tiket dalam status <em>In Progress</em> wajib disertai unggahan foto kondisi fisik sesudah perbaikan (Foto After) dan deskripsi teknis sebelum sistem menandainya sebagai <em>Resolved</em>.
            </div>
          </div>
        </div>

        {/* Ticket Management Interactive Island */}
        <section>
          <PengelolaTicketBoard />
        </section>

        {/* Form Cepat Input Buku Kas Desa */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                Transparansi Keuangan Terbuka
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Pencatatan Cepat Mutasi Kas &amp; Faktur Nota Belanja
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Unggah nota belanja riil untuk otomatis dipindai oleh AI OCR dan dicocokkan dengan katalog Standar Satuan Harga (SSH) Pemprov Jateng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Kategori Pengeluaran</label>
              <select defaultValue="KESELAMATAN_K3" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800">
                <option value="KESELAMATAN_K3">KESELAMATAN_K3</option>
                <option value="MATERIAL">MATERIAL</option>
                <option value="UPAH_KERJA">UPAH_KERJA</option>
                <option value="OPERASIONAL">OPERASIONAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nominal Transaksi (Rp)</label>
              <input
                type="text"
                placeholder="Contoh: 15.000.000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nama Toko / Rekanan</label>
              <input
                type="text"
                placeholder="Contoh: TB Makmur Sentosa"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Nota &amp; Simpan Kas</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
