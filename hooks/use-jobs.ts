"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Type definitions for job data and status management

/** Job status representing the lifecycle of a service job */
export type JobStatus = "lead" | "scheduled" | "completed" | "paid";

/** Complete job object as stored in database */
export type Job = {
  id: string;                        // Unique identifier
  customer_id: string | null;        // Link to customer record (optional for leads)
  customer_name: string;             // Customer name for display
  service_type: string;              // Type of service to be performed
  status: JobStatus;                 // Current job status
  scheduled_start: string | null;    // Scheduled start date/time (ISO string)
  scheduled_end: string | null;      // Scheduled end date/time (ISO string)
  address: string | null;            // Job location address
  price: number | null;              // Job price (null for leads/quotes)
  notes: string | null;              // Optional job notes
  source: string | null;             // Optional source of lead
  created_at?: string;               // Row creation time (ISO string); present from API select "*"
  company_name?: string | null;      // Set by DB trigger; not sent on upsert
};

/** Filter parameters for job queries */
export type JobsFilter = {
  status?: JobStatus;                // Filter by job status
  from?: string;                     // Start date filter (ISO string)
  to?: string;                       // End date filter (ISO string) 
  page?: number;                     // Page number for pagination
  pageSize?: number;                 // Number of items per page
};

/**
 * Custom hook for managing jobs and service appointments
 * 
 * Features:
 * - Fetches paginated list of jobs with filtering by status and date range
 * - Supports job status progression (lead → scheduled → completed → paid)
 * - Provides CRUD operations for job data
 * - Handles loading states and error management
 * - Automatically refetches when filters change
 * 
 * @param initialFilter - Initial filter parameters for the query
 */
export function useJobs(initialFilter?: JobsFilter) {
  // State management for job data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);                    // Total count for pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobsFilter>(initialFilter ?? {});
  /** Bumps when the list should reload without any filter field changing (create/update/delete). */
  const [listRefreshKey, setListRefreshKey] = useState(0);

  // Keep internal filter in sync with incoming props.
  const hasInitialFilter = initialFilter !== undefined;
  const incomingStatus = initialFilter?.status;
  const incomingFrom = initialFilter?.from;
  const incomingTo = initialFilter?.to;
  const incomingPage = initialFilter?.page;
  const incomingPageSize = initialFilter?.pageSize;
  useEffect(() => {
    if (!hasInitialFilter) return;
    setFilter((prev) => {
      const next = {
        ...prev,
        status: incomingStatus,
        from: incomingFrom,
        to: incomingTo,
        page: incomingPage,
        pageSize: incomingPageSize,
      };
      if (
        prev.status === next.status &&
        prev.from === next.from &&
        prev.to === next.to &&
        prev.page === next.page &&
        prev.pageSize === next.pageSize
      ) {
        return prev;
      }
      return next;
    });
  }, [
    hasInitialFilter,
    incomingStatus,
    incomingFrom,
    incomingTo,
    incomingPage,
    incomingPageSize,
  ]);

  /**
   * Effect to load jobs whenever filter parameters change
   * Uses cleanup function to prevent state updates on unmounted components
   */
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Build query parameters for the Edge Function
        const params = new URLSearchParams();
        if (filter.status) params.set("status", filter.status);
        if (filter.from) params.set("from", filter.from);
        if (filter.to) params.set("to", filter.to);
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        // Call the jobs Edge Function with query parameters in header
        const { data, error } = await supabase.functions.invoke("jobs", {
          method: "GET",
          headers: {
            // Only include header if we have parameters to send
            ...(params.size
              ? { "X-Ergon-Query": params.toString() }
              : {}),
          } as Record<string, string>,
        });

        // Prevent state updates if component was unmounted during request
        if (!isMounted) return;

        // Handle API errors
        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load jobs.";
          setError(message);
          setLoading(false);
          return;
        }

        // Extract jobs and total count from response
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

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [
    filter.status,
    filter.from,
    filter.to,
    filter.page,
    filter.pageSize,
    listRefreshKey,
  ]);

  /**
   * Create or update a job record
   * 
   * @param input - Job data (with optional id for updates)
   * @throws Error if the operation fails
   */
  async function upsertJob(
    input: Omit<Job, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Send job data to the Edge Function
      // The function handles both create (no id) and update (with id) operations
      const { data, error } = await supabase.functions.invoke("jobs", {
        method: "POST",
        body: {
          id: input.id,                          // Optional - if present, updates existing job
          customer_id: input.customer_id,        // Link to customer record
          customer_name: input.customer_name,    // Customer name for display
          service_type: input.service_type,      // Type of service
          status: input.status,                  // Current job status
          scheduled_start: input.scheduled_start, // Start date/time
          scheduled_end: input.scheduled_end,    // End date/time
          address: input.address,                // Job location
          price: input.price,                    // Job price
          notes: input.notes,                    // Optional notes
          source: input.source,                  // Optional lead source
        },
      });

      // Handle API errors from the Edge Function
      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save job.";
        setError(message);
        setLoading(false);
        return;
      }

      setListRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving job.");
      setLoading(false);
    }
  }

  /**
   * Delete a job record
   * 
   * @param id - The job ID to delete
   * @throws Error if the operation fails
   */
  async function deleteJob(id: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Send delete request to the Edge Function with job ID
      const params = new URLSearchParams({ id });
      const { data, error } = await supabase.functions.invoke("jobs", {
        method: "DELETE",
        headers: {
          "X-Ergon-Query": params.toString(),
        },
      });

      // Handle API errors from the Edge Function
      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to delete job.";
        setError(message);
        setLoading(false);
        return;
      }

      setListRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while deleting job.");
      setLoading(false);
    }
  }

  /**
   * Returns the hook's public interface
   * 
   * @returns Object containing:
   * - jobs: Array of jobs matching current filter
   * - total: Total count of jobs (for pagination)
   * - loading: Boolean indicating if data is being fetched
   * - error: Error message string or null
   * - filter: Current filter parameters
   * - setFilter: Function to update filter parameters (triggers refetch)
   * - upsertJob: Function to create or update job records
   * - deleteJob: Function to delete job records
   */
  return {
    jobs,         // Current job list
    total,        // Total count for pagination
    loading,      // Loading state
    error,        // Error state
    filter,       // Current filter
    setFilter,    // Update filter (triggers refetch)
    upsertJob,    // Create/update jobs
    deleteJob,    // Delete jobs
  };
}

