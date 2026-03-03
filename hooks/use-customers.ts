"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Customer = {
  id: string;
  type: "customer" | "prospect";
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
};

export type CustomersFilter = {
  type?: "customer" | "prospect";
  search?: string;
  page?: number;
  pageSize?: number;
};

export function useCustomers(initialFilter?: CustomersFilter) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<CustomersFilter>(initialFilter ?? {});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const params = new URLSearchParams();
        if (filter.type) params.set("type", filter.type);
        if (filter.search) params.set("search", filter.search);
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        const { data, error } = await supabase.functions.invoke("customers", {
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
            "Failed to load customers.";
          setError(message);
          setLoading(false);
          return;
        }

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

    return () => {
      isMounted = false;
    };
  }, [filter.type, filter.search, filter.page, filter.pageSize]);

  async function upsertCustomer(
    input: Omit<Customer, "id"> & { id?: string },
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("customers", {
        method: "POST",
        body: {
          id: input.id,
          type: input.type,
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          notes: input.notes,
          source: input.source,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to save customer.";
        setError(message);
        setLoading(false);
        return;
      }

      // Refresh list after successful upsert
      setFilter((prev) => ({ ...prev }));
    } catch (err) {
      console.error(err);
      setError("Unexpected error while saving customer.");
      setLoading(false);
    }
  }

  return {
    customers,
    total,
    loading,
    error,
    filter,
    setFilter,
    upsertCustomer,
  };
}

