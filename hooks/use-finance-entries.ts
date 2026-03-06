"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type FinanceEntryType = "revenue" | "expense";

export type FinanceEntry = {
  id: string;
  type: FinanceEntryType;
  job_id: string | null;
  title: string;
  category: string | null;
  amount: number;
  entry_date: string;
  notes: string | null;
};

export type FinanceFilter = {
  from: string;
  to: string;
  type?: FinanceEntryType;
};

export type FinanceTotals = {
  revenue: number;
  expenses: number;
  net: number;
};

export function useFinanceEntries(initialFilter: FinanceFilter) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [totals, setTotals] = useState<FinanceTotals>({
    revenue: 0,
    expenses: 0,
    net: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FinanceFilter>(initialFilter);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const params = new URLSearchParams();
        params.set("from", filter.from);
        params.set("to", filter.to);
        if (filter.type) params.set("type", filter.type);

        const { data, error } = await supabase.functions.invoke("finance", {
          method: "GET",
          headers: {
            "X-Ergon-Query": params.toString(),
          },
        });

        if (!isMounted) return;

        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load finance entries.";
          setError(message);
          setLoading(false);
          return;
        }

        const items = (data as any)?.items ?? [];
        const t = (data as any)?.totals ?? {
          revenue: 0,
          expenses: 0,
          net: 0,
        };
        setEntries(items);
        setTotals(t);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading finance entries.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [filter.from, filter.to, filter.type]);

  async function upsertEntry(
    input: Omit<FinanceEntry, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("finance", {
        method: "POST",
        body: {
          id: input.id,
          type: input.type,
          job_id: input.job_id,
          title: input.title,
          category: input.category,
          amount: input.amount,
          entry_date: input.entry_date,
          notes: input.notes,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save finance entry.";
        setError(message);
        setLoading(false);
        return;
      }

      setFilter((prev) => ({ ...prev }));
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving finance entry.");
      setLoading(false);
    }
  }

  return {
    entries,
    totals,
    loading,
    error,
    filter,
    setFilter,
    upsertEntry,
  };
}

