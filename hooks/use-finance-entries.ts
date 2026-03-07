"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Type definitions for finance entries and related data structures

/** Type of finance entry - either income or expense */
export type FinanceEntryType = "revenue" | "expense";

/** Complete finance entry object as stored in database */
export type FinanceEntry = {
  id: string;                    // Unique identifier
  type: FinanceEntryType;        // Revenue or expense
  job_id: string | null;         // Optional link to a job
  title: string;                 // Description of the entry
  category: string | null;       // Optional categorization (e.g., "Materials", "Labor")
  amount: number;                // Monetary amount
  entry_date: string;            // Date of the transaction (ISO string)
  notes: string | null;          // Optional additional details
};

/** Filter parameters for querying finance entries */
export type FinanceFilter = {
  from: string;                  // Start date (ISO string)
  to: string;                    // End date (ISO string) 
  type?: FinanceEntryType;       // Optional type filter
};

/** Aggregated totals for financial summary */
export type FinanceTotals = {
  revenue: number;               // Total income
  expenses: number;              // Total expenses
  net: number;                   // Net profit (revenue - expenses)
};

/**
 * Custom hook for managing finance entries
 * 
 * Features:
 * - Fetches finance entries based on date range and type filters
 * - Calculates financial totals (revenue, expenses, net)
 * - Provides CRUD operations for finance entries
 * - Handles loading states and error management
 * - Automatically refetches when filters change
 * 
 * @param initialFilter - Initial filter parameters for the query
 */
export function useFinanceEntries(initialFilter: FinanceFilter) {
  // State management for finance data
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [totals, setTotals] = useState<FinanceTotals>({
    revenue: 0,
    expenses: 0,
    net: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FinanceFilter>(initialFilter);

  /**
   * Effect to load finance entries whenever filter parameters change
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
        params.set("from", filter.from);
        params.set("to", filter.to);
        if (filter.type) params.set("type", filter.type);

        // Call the finance Edge Function with query parameters in header
        // Using header instead of URL params for cleaner API design
        const { data, error } = await supabase.functions.invoke("finance", {
          method: "GET",
          headers: {
            "X-Ergon-Query": params.toString(),
          },
        });

        // Prevent state updates if component was unmounted during request
        if (!isMounted) return;

        // Handle API errors
        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load finance entries.";
          setError(message);
          setLoading(false);
          return;
        }

        // Extract entries and totals from response
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

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [filter.from, filter.to, filter.type]); // Dependency array - refetch when filters change

  /**
   * Create or update a finance entry
   * 
   * @param input - Finance entry data (with optional id for updates)
   * @throws Error if the operation fails
   */
  async function upsertEntry(
    input: Omit<FinanceEntry, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Send finance entry data to the Edge Function
      // The function will handle both create (no id) and update (with id) operations
      const { data, error } = await supabase.functions.invoke("finance", {
        method: "POST",
        body: {
          id: input.id,              // Optional - if present, updates existing entry
          type: input.type,          // Revenue or expense
          job_id: input.job_id,      // Optional link to a job
          title: input.title,        // Entry description
          category: input.category,  // Optional category for organization
          amount: input.amount,      // Monetary amount
          entry_date: input.entry_date, // Date of transaction
          notes: input.notes,        // Optional additional details
        },
      });

      // Handle API errors from the Edge Function
      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save finance entry.";
        setError(message);
        setLoading(false);
        return;
      }

      // Trigger data refresh by updating the filter state
      // This causes the useEffect to run again and fetch updated data
      setFilter((prev) => ({ ...prev }));
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving finance entry.");
      setLoading(false);
    }
  }

  /**
   * Returns the hook's public interface
   * 
   * @returns Object containing:
   * - entries: Array of finance entries matching current filter
   * - totals: Aggregated financial totals (revenue, expenses, net)
   * - loading: Boolean indicating if data is being fetched
   * - error: Error message string or null
   * - filter: Current filter parameters
   * - setFilter: Function to update filter parameters (triggers refetch)
   * - upsertEntry: Function to create or update finance entries
   */
  return {
    entries,      // Current finance entries
    totals,       // Calculated totals
    loading,      // Loading state
    error,        // Error state
    filter,       // Current filter
    setFilter,    // Update filter (triggers refetch)
    upsertEntry,  // Create/update entries
  };
}

