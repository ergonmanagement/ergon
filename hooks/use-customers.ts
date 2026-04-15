"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Type definitions for customer data and filtering

/** Customer type - distinguishes between existing customers and potential prospects */
export type Customer = {
  id: string;                        // Unique identifier
  type: "customer" | "prospect";     // Customer status
  name: string;                      // Contact person name
  company_id: string | null;         // Link to companies table
  company_name: string | null;       // Company name for display
  email: string | null;             // Optional email address
  phone: string | null;             // Optional phone number
  address: string | null;           // Optional physical address
  notes: string | null;             // Optional notes about the customer
  source: string | null;            // Optional source of lead (referral, website, etc.)
  created_at?: string;              // When the record was created (ISO); present from API select "*"
};

/** Filter parameters for customer queries */
export type CustomersFilter = {
  type?: "customer" | "prospect";    // Filter by customer type
  search?: string;                   // Text search across name, email, phone
  page?: number;                     // Page number for pagination
  pageSize?: number;                 // Number of items per page
};

/**
 * Custom hook for managing customers and prospects
 * 
 * Features:
 * - Fetches paginated list of customers with filtering
 * - Supports text search across multiple fields
 * - Provides CRUD operations for customer data
 * - Handles loading states and error management
 * - Automatically refetches when filters change
 * 
 * @param initialFilter - Initial filter parameters for the query
 */
export function useCustomers(initialFilter?: CustomersFilter) {
  // State management for customer data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);                    // Total count for pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<CustomersFilter>(initialFilter ?? {});
  /** Bumps when the list should reload without any filter field changing (create/update). */
  const [listRefreshKey, setListRefreshKey] = useState(0);

  // Props like `type` / `search` from the parent must update `filter`; `useState(initialFilter)`
  // only uses the first render's value, so tabs and search would otherwise never refetch.
  const hasInitialFilter = initialFilter !== undefined;
  const incomingType = initialFilter?.type;
  const incomingSearch = initialFilter?.search;
  useEffect(() => {
    if (!hasInitialFilter) return;
    setFilter((prev) => {
      const next = { ...prev, type: incomingType, search: incomingSearch };
      if (prev.type === next.type && prev.search === next.search) return prev;
      return next;
    });
  }, [hasInitialFilter, incomingType, incomingSearch]);

  /**
   * Effect to load customers whenever filter parameters change
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
        if (filter.type) params.set("type", filter.type);
        if (filter.search) params.set("search", filter.search);
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        // Call the customers Edge Function with query parameters in header
        const { data, error } = await supabase.functions.invoke("customers", {
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
            "Failed to load customers.";
          setError(message);
          setLoading(false);
          return;
        }

        // Extract customers and total count from response
        const items = (data as any)?.items ?? [];
        const totalCount = (data as any)?.total ?? 0;
        setCustomers(items);
        setTotal(totalCount);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading customers.");
        setLoading(false);
      }
    }

    void load();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [filter.type, filter.search, filter.page, filter.pageSize, listRefreshKey]);

  /**
   * Create or update a customer record
   * 
   * @param input - Customer data (with optional id for updates)
   * @throws Error if the operation fails
   */
  async function upsertCustomer(
    input: Omit<Customer, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Send customer data to the Edge Function
      // The function handles both create (no id) and update (with id) operations
      const { data, error } = await supabase.functions.invoke("customers", {
        method: "POST",
        body: {
          id: input.id,              // Optional - if present, updates existing customer
          type: input.type,          // Customer or prospect
          name: input.name,          // Full name or company name
          email: input.email,        // Optional email address
          phone: input.phone,        // Optional phone number
          address: input.address,    // Optional physical address
          notes: input.notes,        // Optional notes
          source: input.source,      // Optional lead source
        },
      });

      // Handle API errors from the Edge Function
      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save customer.";
        setError(message);
        setLoading(false);
        return;
      }

      setListRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving customer.");
      setLoading(false);
    }
  }

  /**
   * Returns the hook's public interface
   * 
   * @returns Object containing:
   * - customers: Array of customers matching current filter
   * - total: Total count of customers (for pagination)
   * - loading: Boolean indicating if data is being fetched
   * - error: Error message string or null
   * - filter: Current filter parameters
   * - setFilter: Function to update filter parameters (triggers refetch)
   * - upsertCustomer: Function to create or update customer records
   */
  return {
    customers,      // Current customer list
    total,          // Total count for pagination
    loading,        // Loading state
    error,          // Error state
    filter,         // Current filter
    setFilter,      // Update filter (triggers refetch)
    upsertCustomer, // Create/update customers
  };
}

