'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPublicReportsAction } from '@/app/actions/reportActions';
import { getSessionAction } from '@/app/actions/authActions';
import type { SessionUser } from '@/lib/auth';
import {
  mapIncidentToDashboardTicket,
  mapGrantToBudget,
  type TransparansiExpense,
  type TransparansiGrant,
} from './mapReports';
import { DashboardTicket, VillageBudgetData, INITIAL_BUDGET_DATA } from './types';

export interface TransparansiVillage {
  id: string;
  slug: string;
  name: string;
  regency: string;
  district: string;
  category: string;
  pokdarwis_name: string;
  trust_score: number;
}

/** Ambil tiket aduan riil dari DB via Server Action terikat ke session.villageId. */
export function useDashboardTickets() {
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  const reload = useCallback(async () => {
    try {
      const sess = await getSessionAction();
      setSession(sess);

      const filterParams: { limit: number; villageId?: string } = { limit: 100 };
      if (sess?.villageId) {
        filterParams.villageId = sess.villageId;
      } else if (sess?.role === 'desa') {
        // Cegah kebocoran tiket desa lain bagi akun pengelola desa
        filterParams.villageId = '00000000-0000-0000-0000-000000000000';
      }

      const res = await getPublicReportsAction(filterParams);
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data.map(mapIncidentToDashboardTicket));
        setIsLive(true);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('[useDashboardTickets]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tickets, loading, isLive, reload, session };
}

/**
 * Ambil data transparansi desa (village, grant, expenses) dari GET /api/transparansi.
 * Terikat ke session desa yang login, atau fallback ke candirejo-magelang jika belum login.
 */
export function useBudgetData(fiscalYear = 2026, villageSlug = 'candirejo-magelang') {
  const [budget, setBudget] = useState<VillageBudgetData>(INITIAL_BUDGET_DATA);
  const [village, setVillage] = useState<TransparansiVillage | null>(null);
  const [grant, setGrant] = useState<TransparansiGrant | null>(null);
  const [expenses, setExpenses] = useState<TransparansiExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  const reload = useCallback(async () => {
    try {
      const sess = await getSessionAction();
      setSession(sess);

      const url = sess?.villageId
        ? `/api/transparansi?fiscal_year=${fiscalYear}&village_id=${sess.villageId}`
        : `/api/transparansi?fiscal_year=${fiscalYear}&slug=${villageSlug}`;

      const r = await fetch(url);
      const json = await r.json();

      if (json?.success && json.data) {
        const g = json.data.grant;
        setVillage(json.data.village || null);
        setGrant(g || null);
        setExpenses(Array.isArray(json.data.expenses) ? json.data.expenses : []);
        if (g) {
          setBudget(mapGrantToBudget(g, json.data.expenses?.length || 0));
        } else {
          // Desa baru belum memiliki data usulan/realisasi anggaran
          setBudget({
            year: fiscalYear,
            dateStr: `Tahun Anggaran ${fiscalYear}`,
            apbdes: 0,
            banprov: 0,
            pades: 0,
            usedAmount: 0,
            usedActivitiesCount: 0,
            lastUpdatedStr: 'Belum ada usulan anggaran belanja',
          });
        }
        setIsLive(true);
      }
    } catch (err) {
      console.error('[useBudgetData]', err);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear, villageSlug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { budget, village, grant, expenses, loading, isLive, session, reload };
}
