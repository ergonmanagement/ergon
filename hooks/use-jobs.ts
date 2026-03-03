"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type JobStatus = "lead" | "scheduled" | "completed" | "paid";

export type Job = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  service_type: string;
  status: JobStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  address: string | null;
  price: number | null;
  notes: string | null;
  source: string | null;
};

export type JobsFilter = {
  status?: JobStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export function useJobs(initialFilter?: JobsFilter) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobsFilter>(initialFilter ?? {});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const params = new URLSearchParams();
        if (filter.status) params.set("status", filter.status);
        if (filter.from) params.set("from", filter.from);
        if (filter.to) params.set("to", filter.to);
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        const { data, error } = await supabase.functions.invoke("jobs", {
          method: "GET",
          headers: {
            ...(params.size
              ? { "X-Ergon-Query": params.toString() }
              : {}),
          } as Record<string, string>,
        });

        if (!isMounted) return;

        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load jobs.";
          setError(message);
          setLoading(false);
          return;
        }

        const items = (data as any)?.items ?? [];
        const totalCount = (data as any)?.total ?? 0;
        setJobs(items);
        setTotal(totalCount);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading jobs.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [filter.status, filter.from, filter.to, filter.page, filter.pageSize]);

  async function upsertJob(
    input: Omit<Job, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("jobs", {
        method: "POST",
        body: {
          id: input.id,
          customer_id: input.customer_id,
          customer_name: input.customer_name,
          service_type: input.service_type,
          status: input.status,
          scheduled_start: input.scheduled_start,
          scheduled_end: input.scheduled_end,
          address: input.address,
          price: input.price,
          notes: input.notes,
          source: input.source,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save job.";
        setError(message);
        setLoading(false);
        return;
      }

      // Refresh list after successful upsert
      setFilter((prev) => ({ ...prev }));
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving job.");
      setLoading(false);
    }
  }

  async function deleteJob(id: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const params = new URLSearchParams({ id });
      const { data, error } = await supabase.functions.invoke("jobs", {
        method: "DELETE",
        headers: {
          "X-Ergon-Query": params.toString(),
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to delete job.";
        setError(message);
        setLoading(false);
        return;
      }

      // Refresh list after delete
      setFilter((prev) => ({ ...prev }));
    } catch (err) {
      console.error(err);
      setError("Unexpected error while deleting job.");
      setLoading(false);
    }
  }

  return {
    jobs,
    total,
    loading,
    error,
    filter,
    setFilter,
    upsertJob,
    deleteJob,
  };
}

