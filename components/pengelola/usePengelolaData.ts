'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPublicReportsAction } from '@/app/actions/reportActions';
import { mapIncidentToDashboardTicket, mapGrantToBudget } from './mapReports';
import { DashboardTicket, VillageBudgetData, INITIAL_BUDGET_DATA } from './types';

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

/** Ambil ringkasan anggaran dari GET /api/transparansi; fallback ke data contoh. */
export function useBudgetData(fiscalYear = 2026) {
  const [budget, setBudget] = useState<VillageBudgetData>(INITIAL_BUDGET_DATA);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transparansi?fiscal_year=${fiscalYear}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const grant = json?.data?.grant;
        if (json?.success && grant) {
          setBudget(mapGrantToBudget(grant, json.data.expenses?.length || 0));
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
  }, [fiscalYear]);

  return { budget, loading, isLive };
}
