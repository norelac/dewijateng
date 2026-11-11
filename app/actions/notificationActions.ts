'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  tone: 'info' | 'warning' | 'success';
  href: string;
  time: string;
}

function tanggalPendek(input: unknown): string {
  if (!input) return '';
  const d = new Date(input as string);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Notifikasi untuk lonceng header, diturunkan langsung dari basis data sesuai
 * peran pengguna: pengelola desa hanya melihat desanya, Disbudparekraf melihat
 * antrean provinsi. Tidak ada tabel notifikasi terpisah — belum perlu.
 */
export async function getNotificationsAction(): Promise<AppNotification[]> {
  const session = await getSession();
  if (!session) return [];

  if (session.role === 'disbudparekraf') {
    const [pendingLpj, needReview, revisi, latestReports] = await Promise.all([
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM village_grants WHERE lpj_status = 'SUBMITTED'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM incident_reports WHERE status = 'SUBMITTED'`
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM village_grants WHERE lpj_status = 'REVISION'`
      ),
      query<any>(
        `SELECT r.report_code, r.title, r.created_at, tv.name AS village_name
           FROM incident_reports r
           JOIN tourist_villages tv ON tv.id = r.village_id
          WHERE r.status = 'SUBMITTED'
          ORDER BY r.created_at DESC
          LIMIT 3`
      ),
    ]);

    const items: AppNotification[] = [];

    const lpjCount = Number(pendingLpj.rows[0]?.c || 0);
    if (lpjCount > 0) {
      items.push({
        id: 'lpj-submitted',
        title: `${lpjCount} LPJ menunggu verifikasi`,
        description: 'Dokumen LPJ desa wisata siap diperiksa pada menu Aktivitas.',
        tone: 'warning',
        href: '/disbudparekraf/aktivitas',
        time: 'Perlu tindakan',
      });
    }

    const revisiCount = Number(revisi.rows[0]?.c || 0);
    if (revisiCount > 0) {
      items.push({
        id: 'lpj-revision',
        title: `${revisiCount} LPJ perlu revisi`,
        description: 'Dokumen dikembalikan ke desa untuk dilengkapi.',
        tone: 'info',
        href: '/disbudparekraf/aktivitas',
        time: 'Perlu tindakan',
      });
    }

    const reviewCount = Number(needReview.rows[0]?.c || 0);
    if (reviewCount > 0) {
      items.push({
        id: 'reports-submitted',
        title: `${reviewCount} aduan warga belum diverifikasi`,
        description: 'Antrean laporan masuk dari seluruh desa wisata.',
        tone: 'warning',
        href: '/disbudparekraf',
        time: 'Perlu tindakan',
      });
    }

    for (const row of latestReports.rows) {
      items.push({
        id: `report-${row.report_code}`,
        title: row.title,
        description: `${row.village_name} · ${row.report_code}`,
        tone: 'info',
        href: '/disbudparekraf',
        time: tanggalPendek(row.created_at),
      });
    }

    return items.slice(0, 8);
  }

  // Peran pengelola desa
  if (!session.villageId) return [];

  const [reports, grants, anomalies] = await Promise.all([
    query<any>(
      `SELECT report_code, title, status, created_at
         FROM incident_reports
        WHERE village_id = $1 AND status <> 'RESOLVED'
        ORDER BY created_at DESC
        LIMIT 4`,
      [session.villageId]
    ),
    query<any>(
      `SELECT fiscal_year, lpj_status
         FROM village_grants
        WHERE village_id = $1
        ORDER BY fiscal_year DESC
        LIMIT 2`,
      [session.villageId]
    ),
    query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
         FROM grant_expenses ge
         JOIN village_grants vg ON vg.id = ge.grant_id
        WHERE vg.village_id = $1 AND ge.ai_anomaly_flag = true`,
      [session.villageId]
    ),
  ]);

  const items: AppNotification[] = [];

  const anomalyCount = Number(anomalies.rows[0]?.c || 0);
  if (anomalyCount > 0) {
    items.push({
      id: 'grant-anomaly',
      title: `${anomalyCount} pos belanja ditandai anomali`,
      description: 'Periksa harga klaim terhadap acuan SSH pada buku kas.',
      tone: 'warning',
      href: '/pengelola/pengeluaran',
      time: 'Perlu tindakan',
    });
  }

  for (const g of grants.rows) {
    if (g.lpj_status === 'REVISION') {
      items.push({
        id: `grant-revision-${g.fiscal_year}`,
        title: `LPJ TA ${g.fiscal_year} perlu revisi`,
        description: 'Dokumen dikembalikan Dinas untuk dilengkapi.',
        tone: 'warning',
        href: `/pengelola/anggaran?tahun=${g.fiscal_year}`,
        time: 'Perlu tindakan',
      });
    } else if (g.lpj_status === 'PENDING_UPLOAD') {
      items.push({
        id: `grant-pending-${g.fiscal_year}`,
        title: `LPJ TA ${g.fiscal_year} belum diunggah`,
        description: 'Unggah berkas LPJ agar anggaran terverifikasi.',
        tone: 'info',
        href: '/pengelola/lpj',
        time: 'Perlu tindakan',
      });
    } else if (g.lpj_status === 'SUBMITTED') {
      items.push({
        id: `grant-submitted-${g.fiscal_year}`,
        title: `LPJ TA ${g.fiscal_year} menunggu verifikasi`,
        description: 'Dokumen sudah dikirim dan sedang diperiksa Dinas.',
        tone: 'info',
        href: `/pengelola/anggaran?tahun=${g.fiscal_year}`,
        time: 'Diproses Dinas',
      });
    } else if (g.lpj_status === 'VERIFIED') {
      items.push({
        id: `grant-verified-${g.fiscal_year}`,
        title: `LPJ TA ${g.fiscal_year} terverifikasi`,
        description: 'Anggaran desa sudah diverifikasi Dinas.',
        tone: 'success',
        href: `/pengelola/anggaran?tahun=${g.fiscal_year}`,
        time: 'Selesai',
      });
    }
  }

  for (const r of reports.rows) {
    items.push({
      id: `report-${r.report_code}`,
      title: r.title,
      description: `${r.report_code} · ${
        r.status === 'SUBMITTED' ? 'menunggu verifikasi' : 'sedang ditangani'
      }`,
      tone: r.status === 'SUBMITTED' ? 'warning' : 'info',
      href: '/pengelola/laporan',
      time: tanggalPendek(r.created_at),
    });
  }

  return items.slice(0, 8);
}
