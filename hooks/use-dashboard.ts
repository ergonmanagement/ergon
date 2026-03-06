"use client";

/**
 * useDashboard
 *
 * - Client-side hook that calls the dashboard Edge Function.
 * - Returns the aggregated dashboard payload:
 *   - today_schedule (events + jobs)
 *   - upcoming_jobs
 *   - new_prospects
 *   - finance_summary
 *   - marketing_reminders
 * - All heavy lifting and scoping happens in the Edge Function; this
 *   hook only invokes it via Supabase.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type DashboardFinanceSummary = {
  revenue: number;
  expenses: number;
  net: number;
};

export type DashboardPayload = {
  today_schedule: {
    events: any[];
    jobs: any[];
  };
  upcoming_jobs: any[];
  new_prospects: any[];
  finance_summary: DashboardFinanceSummary;
  marketing_reminders: any[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        
        // Temporary: Load mock data instead of calling Edge Function
        console.log('Loading dashboard with mock data (Edge Function bypassed)');
        
        // Mock dashboard data
        const mockData: DashboardPayload = {
          today_schedule: {
            events: [],
            jobs: []
          },
          upcoming_jobs: [],
          new_prospects: [],
          finance_summary: {
            revenue: 15750,
            expenses: 4200,
            net: 11550
          },
          marketing_reminders: []
        };

        if (!isMounted) return;
        setData(mockData);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading dashboard.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

