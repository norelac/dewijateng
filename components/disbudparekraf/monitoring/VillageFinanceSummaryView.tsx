import React from 'react';
import Link from 'next/link';
import { periodeLabel, type VillageFinanceSummary } from '@/lib/finance';
import { formatRupiah, formatRupiahShort } from '@/lib/utils';
import FinanceSummaryCards from '@/components/disbudparekraf/monitoring/FinanceSummaryCards';
import CashflowChart from '@/components/disbudparekraf/monitoring/CashflowChart';
import { BuktiBadge } from '@/components/disbudparekraf/monitoring/KelengkapanBadge';

function tanggalPendek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(d);
}

/** Isi tab "Ringkasan" layar keuangan desa (Figma 422:665). */
export default function VillageFinanceSummaryView({ data }: { data: VillageFinanceSummary }) {
  const { village } = data;

  const cards = [
    {
      label: 'Pemasukan',
      value: formatRupiahShort(data.pemasukan),
      note: `${data.jumlahPemasukan} transaksi pemasukan`,
      variant: 'navy' as const,
    },
    {
      label: 'Pengeluaran',
      value: formatRupiahShort(data.pengeluaran),
      note: `${data.jumlahPengeluaran} transaksi pengeluaran`,
      variant: 'white' as const,
    },
    {
      label: 'Surplus periode',
      value: formatRupiahShort(data.surplus),
      note: 'Pemasukan − pengeluaran',
      variant: 'white' as const,
    },
    {
      label: 'Saldo akhir',
      value: formatRupiahShort(data.saldoAkhir),
      note: `Termasuk saldo awal ${formatRupiahShort(data.saldoAwal)}`,
      variant: 'white' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <FinanceSummaryCards cards={cards} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <CashflowChart
          className="lg:col-span-7"
          title={`Arus kas Desa ${village.shortName}`}
          subtitle={`Periode ${periodeLabel(data.periode)} · dalam juta rupiah`}
          buckets={data.cashflow}
        />

        {/* Perhitungan saldo */}
        <div className="lg:col-span-5 bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs flex flex-col">
          <h3 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Perhitungan saldo
          </h3>

          <div className="flex flex-col mt-4">
            {[
              ['Saldo awal', data.saldoAwal, false],
              ['+ Pemasukan', data.pemasukan, false],
              ['− Pengeluaran', data.pengeluaran, false],
              ['Saldo akhir', data.saldoAkhir, true],
            ].map(([label, value, bold]) => (
              <div
                key={String(label)}
                className={`flex items-center justify-between gap-4 py-3 ${
                  bold ? 'border-t-2 border-[#E6ECF5]' : 'border-b border-[#E6ECF5]'
                }`}
              >
                <span
                  className={`text-[13px] ${
                    bold ? 'font-semibold text-[#0D2453]' : 'text-[#64748B]'
                  }`}
                >
                  {String(label)}
                </span>
                <span
                  className={`text-[13px] ${
                    bold ? 'font-semibold text-[#0D2453]' : 'text-[#0D2453]'
                  }`}
                >
                  {formatRupiah(Number(value))}
                </span>
              </div>
            ))}
          </div>

          {data.jumlahTanpaBukti > 0 ? (
            <p className="mt-4 text-[12px] text-[#875B12]">
              {data.jumlahTanpaBukti} transaksi belum memiliki bukti.
            </p>
          ) : (
            <p className="mt-4 text-[12px] text-[#216B55]">
              Seluruh transaksi periode ini sudah memiliki bukti.
            </p>
          )}
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="bg-white border border-[#E6ECF5] rounded-[14px] p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#0D2453] text-[17px] font-semibold leading-[1.5]">
            Transaksi terbaru
          </h2>
          <p className="text-[#64748B] text-[12px] leading-[1.5]">
            {data.recent.length} transaksi terbaru dari total {data.jumlahTransaksi} transaksi
            periode ini
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-[#F7F9FC] text-[11px] font-medium text-[#64748B]">
                <th className="rounded-l-[6px] py-2 px-3 font-medium w-[12%]">Tanggal</th>
                <th className="py-2 px-3 font-medium">Transaksi</th>
                <th className="py-2 px-3 font-medium w-[14%]">Jenis</th>
                <th className="py-2 px-3 font-medium w-[16%]">Nominal</th>
                <th className="py-2 px-3 font-medium w-[12%]">Bukti</th>
                <th className="rounded-r-[6px] py-2 px-3 font-medium w-[14%]">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[12px] text-[#64748B]">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
              {data.recent.map((row) => {
                const jenis = row.type === 'PEMASUKAN' ? 'pemasukan' : 'pengeluaran';
                return (
                  <tr key={row.id} className="border-b border-[#E6ECF5] last:border-b-0">
                    <td className="py-3 px-3 text-[12px] text-[#64748B] whitespace-nowrap">
                      {tanggalPendek(row.transactionDate)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#0D2453] text-[13px] font-semibold leading-[1.5]">
                        {row.title}
                      </p>
                      <p className="text-[#64748B] text-[11px] leading-[1.5]">
                        {row.referenceCode}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#64748B]">
                      {row.type === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran'}
                    </td>
                    <td className="py-3 px-3 text-[12px] text-[#0D2453] whitespace-nowrap">
                      {formatRupiah(row.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <BuktiBadge hasProof={row.hasProof} />
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/disbudparekraf/monitoring/${village.slug}/${jenis}/${row.referenceCode}?periode=${data.periode}`}
                        className="inline-flex items-center justify-center h-[40px] px-4 rounded-[999px] border-2 border-[#E6ECF5] bg-white text-[12px] font-semibold text-[#0D2453] hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        Lihat detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[#64748B] text-[11px] mt-4">
          Seluruh pemasukan dan pengeluaran tersedia melalui tab di atas.
        </p>
      </div>

      <div className="bg-[#EDF3FC] rounded-[14px] px-6 py-[18px] flex flex-col gap-1">
        <p className="text-[#0D2453] text-[13px] font-semibold">
          Bukti belum lengkap? Hubungi {village.managerName} · {village.managerEmail || '—'}
        </p>
        <p className="text-[#64748B] text-[12px]">
          Data untuk pemantauan, bukan perubahan transaksi. Pencatatan dan perbaikan data dilakukan
          oleh pengelola desa.
        </p>
      </div>
    </div>
  );
}
