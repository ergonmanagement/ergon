"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CalendarEventType = "event" | "task";

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  start_at: string;
  end_at: string;
  location: string | null;
  notes: string | null;
  category: string | null;
  color_key: string | null;
  customer_id: string | null;
};

export type ScheduleFilter = {
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
};

export function useSchedule(initialFilter: ScheduleFilter) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScheduleFilter>(initialFilter);
  const [refetchNonce, setRefetchNonce] = useState(0);

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
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        const { data, error } = await supabase.functions.invoke("schedule", {
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
            "Failed to load schedule.";
          setError(message);
          setLoading(false);
          return;
        }

        const raw = (data as any)?.items ?? [];
        const items: CalendarEvent[] = raw.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          type: row.type as CalendarEventType,
          title: row.title as string,
          start_at: row.start_at as string,
          end_at: row.end_at as string,
          location: (row.location as string | null) ?? null,
          notes: (row.notes as string | null) ?? null,
          category: (row.category as string | null) ?? null,
          color_key: (row.color_key as string | null) ?? null,
          customer_id: (row.customer_id as string | null) ?? null,
        }));
        const totalCount = (data as any)?.total ?? 0;
        setEvents(items);
        setTotal(totalCount);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading schedule.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [filter.from, filter.to, filter.page, filter.pageSize, refetchNonce]);

  async function upsertEvent(
    input: Omit<CalendarEvent, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("schedule", {
        method: "POST",
        body: {
          id: input.id,
          type: input.type,
          title: input.title,
          start_at: input.start_at,
          end_at: input.end_at,
          location: input.location,
          notes: input.notes,
          category: input.category,
          color_key: input.color_key,
          customer_id: input.customer_id,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save event.";
        setError(message);
        setLoading(false);
        return;
      }

      setRefetchNonce((n) => n + 1);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving event.");
      setLoading(false);
    }
  }

  return {
    events,
    total,
    loading,
    error,
    filter,
    setFilter,
    upsertEvent,
  };
}
