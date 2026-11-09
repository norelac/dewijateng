'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPublicReportsAction } from '@/app/actions/reportActions';
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

/** Ambil tiket aduan riil dari DB via Server Action (pola sama dengan app/lapor). */
export function useDashboardTickets() {
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await getPublicReportsAction({ limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data.map(mapIncidentToDashboardTicket));
        setIsLive(true);
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

  return { tickets, loading, isLive, reload };
}

/**
 * Ambil data transparansi desa (village, grant, expenses) dari GET /api/transparansi.
 * ponytail: tanpa sesi/auth, default desa = candirejo-magelang; ganti ke sesi setelah auth ada.
 */
export function useBudgetData(fiscalYear = 2026, villageSlug = 'candirejo-magelang') {
  const [budget, setBudget] = useState<VillageBudgetData>(INITIAL_BUDGET_DATA);
  const [village, setVillage] = useState<TransparansiVillage | null>(null);
  const [grant, setGrant] = useState<TransparansiGrant | null>(null);
  const [expenses, setExpenses] = useState<TransparansiExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transparansi?fiscal_year=${fiscalYear}&slug=${villageSlug}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success && json.data) {
          const g = json.data.grant;
          setVillage(json.data.village || null);
          setGrant(g || null);
          setExpenses(Array.isArray(json.data.expenses) ? json.data.expenses : []);
          if (g) setBudget(mapGrantToBudget(g, json.data.expenses?.length || 0));
          setIsLive(true);
        }
      })
      .catch((err) => console.error('[useBudgetData]', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fiscalYear, villageSlug]);

  return { budget, village, grant, expenses, loading, isLive };
}
