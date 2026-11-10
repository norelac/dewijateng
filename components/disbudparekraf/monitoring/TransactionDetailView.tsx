import React from 'react';
import type { TransactionDetail } from '@/lib/finance';
import { periodeLabel, proofUrl, tanggalPanjang } from '@/lib/finance';
import { formatRupiah } from '@/lib/utils';
import KelengkapanBadge from '@/components/disbudparekraf/monitoring/KelengkapanBadge';

function waktuIndo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
  const jam = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(d)
    .replace(':', '.');
  return `${tanggal} · ${jam} WIB`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-1 sm:gap-4 py-2.5 border-b border-[#E6ECF5] last:border-b-0">
      <span className="text-[12px] text-[#64748B]">{label}</span>
      <span className="text-[13px] text-[#0D2453] font-medium">{value}</span>
    </div>
  );
}

/** Detail satu transaksi keuangan desa (Figma 422:848 / 422:909). */
export default function TransactionDetailView({ tx }: { tx: TransactionDetail }) {
  const pemasukan = tx.type === 'PEMASUKAN';
  const docs = proofUrl(tx.referenceCode);
  const { village } = tx;

  const rincian: [string, string][] = [
    ['Nomor referensi', tx.referenceCode],
    ['Desa wisata', `${village.shortName} · ${village.district.replace(/^Kecamatan\s+/i, '')}, ${village.regency.replace(/^(Kabupaten|Kota)\s+/i, '')}`],
    ['Tanggal transaksi', tanggalPanjang(tx.transactionDate)],
    ['Kategori', tx.category],
    ['Metode pembayaran', tx.paymentMethod || '—'],
    [pemasukan ? 'Sumber penerimaan' : 'Penerima pembayaran', tx.counterparty || '—'],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Rincian transaksi */}
        <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0D2453] text-[19px] font-semibold leading-[1.5]">{tx.title}</h2>
            <p className="text-[#64748B] text-[12px] leading-[1.5]">
              Rincian yang dicatat pengelola desa
            </p>
          </div>

          <div className="mt-4">
            {rincian.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </div>

          {tx.note && (
            <p className="mt-4 text-[12px] text-[#64748B]">Catatan: {tx.note}</p>
          )}
        </div>

        {/* Bukti transaksi */}
        <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
              Bukti transaksi
            </h2>
            <p className="text-[#64748B] text-[12px] leading-[1.5]">
              {tx.hasProof ? 'Bukti dokumen tersedia' : 'Belum ada bukti yang diunggah'}
            </p>
          </div>

          {tx.hasProof ? (
            <>
              {/* Pratinjau bergaya dokumen, mengikuti desain; berkas asli dapat diunduh. */}
              <div className="mt-4 rounded-[10px] border border-[#E6ECF5] bg-[#F7F9FC] p-6 flex justify-center">
                <div className="bg-white border border-[#E6ECF5] w-full max-w-[420px] p-6 flex flex-col gap-3">
                  <span className="text-[9px] tracking-[0.12em] text-[#94A3B8]">
                    DOKUMEN CONTOH
                  </span>
                  <span className="text-[15px] font-bold text-[#0D2453]">
                    {pemasukan ? 'REKAP PENERIMAAN' : 'BUKTI PEMBAYARAN'}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {village.name}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {tx.referenceCode} · {tanggalPanjang(tx.transactionDate)}
                  </span>

                  <div className="border-t border-[#E6ECF5] pt-2 flex items-center justify-between text-[10px] text-[#64748B]">
                    <span>Uraian</span>
                    <span>Jumlah</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-[11px] text-[#0D2453]">
                    <span>{tx.note || tx.title}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>

                  <div className="border-t border-[#E6ECF5] pt-2 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#0D2453]">
                      Total {pemasukan ? 'penerimaan' : 'pembayaran'}
                    </span>
                    <span className="font-semibold text-[#0D2453]">
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>

                  <span className="text-[9px] italic text-[#94A3B8]">
                    Ilustrasi dokumen untuk rancangan antarmuka, bukan bukti transaksi nyata.
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[13px] font-semibold text-[#0D2453] break-all">
                {tx.proofFileName || `bukti-${tx.referenceCode}.pdf`}
              </p>
              <p className="text-[11px] text-[#64748B]">
                PDF{tx.proofFileSizeKb ? ` · ${tx.proofFileSizeKb} KB` : ''}
                {tx.proofUploadedBy ? ` · Diunggah oleh ${tx.proofUploadedBy}` : ''}
              </p>

              <div className="flex items-center gap-3 mt-4">
                <a
                  href={`${docs}${docs.includes('?') ? '&' : '?'}unduh=1`}
                  className="h-[40px] px-6 inline-flex items-center justify-center rounded-[999px] bg-[#0D2453] text-white text-[12px] font-semibold hover:bg-[#163B80] transition-colors"
                >
                  Unduh bukti
                </a>
                <a
                  href={docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[40px] px-6 inline-flex items-center justify-center rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors"
                >
                  Buka dokumen
                </a>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-[#E6ECF5] bg-[#FCF1DC] px-4 py-6 text-center">
              <p className="text-[#875B12] text-[13px] font-semibold">Bukti belum diunggah</p>
              <p className="text-[#875B12] text-[12px] mt-1">
                Pengelola desa perlu melengkapi dokumen transaksi {tx.referenceCode}.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Nilai transaksi */}
        <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
          <span className="text-[12px] text-[#64748B]">
            Nilai {pemasukan ? 'pemasukan' : 'pengeluaran'}
          </span>
          <p className="text-[32px] font-semibold text-[#0D2453] leading-[1.2] tracking-[-0.8px] mt-1">
            {formatRupiah(tx.amount)}
          </p>
          <div className="mt-3">
            <KelengkapanBadge
              value={tx.hasProof ? 'LENGKAP' : 'PERLU_BUKTI'}
              label={tx.hasProof ? 'Bukti lengkap' : 'Perlu bukti'}
            />
          </div>

          <div className="h-px bg-[#E6ECF5] my-4" />

          <span className="text-[12px] text-[#64748B]">Dicatat oleh</span>
          <p className="text-[13px] font-semibold text-[#0D2453] mt-1">
            {tx.recordedBy} · Pengelola {village.shortName}
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-3">
            Periode laporan: {periodeLabel(tx.transactionDate.slice(0, 7))}
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-3 leading-[1.5]">
            Status bukti menunjukkan ketersediaan dokumen, bukan hasil audit dinas.
          </p>
        </div>

        {/* Riwayat pencatatan */}
        <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
          <h3 className="text-[17px] font-semibold text-[#0D2453] leading-[1.5]">
            Riwayat pencatatan
          </h3>
          <p className="text-[11px] text-[#94A3B8] mt-4">{waktuIndo(tx.recordedAt)}</p>
          <p className="text-[13px] font-semibold text-[#0D2453] mt-1">
            Transaksi dan bukti dicatat
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">
            Oleh {tx.recordedBy}, pengelola desa.
          </p>
          <div className="h-px bg-[#E6ECF5] my-4" />
          <p className="text-[12px] text-[#64748B]">Tidak ada perubahan setelah pencatatan.</p>
          <p className="text-[11px] text-[#94A3B8] mt-3">
            Riwayat ditampilkan untuk penelusuran data.
          </p>
        </div>

        {/* Akses pemantauan dinas */}
        <div className="bg-[#EDF3FC] border border-[#D8E4F5] rounded-[14px] p-6">
          <h3 className="text-[17px] font-semibold text-[#0D2453] leading-[1.5]">
            Akses pemantauan dinas
          </h3>
          <p className="text-[12px] text-[#64748B] mt-3 leading-[1.5]">
            Dinas dapat membaca rincian dan mengunduh bukti. Perubahan transaksi dilakukan oleh
            pengelola desa.
          </p>
          <p className="text-[13px] font-semibold text-[#0D2453] mt-4">Perlu klarifikasi?</p>
          <p className="text-[12px] text-[#0D2453] mt-1">{village.managerName}</p>
          <p className="text-[11px] text-[#64748B] break-all">{village.managerEmail || '—'}</p>
        </div>
      </div>
    </div>
  );
}
