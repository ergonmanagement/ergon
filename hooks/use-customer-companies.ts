"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Type definitions for customer company data and filtering

/** Customer company representing businesses that are your customers */
export type CustomerCompany = {
    id: string;                        // Unique identifier
    name: string;                      // Company name (e.g., "ABC Landscaping")
    service_type: string | null;      // Type of business
    phone: string | null;             // Company phone number
    email: string | null;             // Company email address
    address: string | null;           // Company physical address
    notes: string | null;             // Optional notes about the company
};

/** Filter parameters for customer company queries */
export type CustomerCompaniesFilter = {
    search?: string;                   // Text search across name, service_type
    page?: number;                     // Page number for pagination
    pageSize?: number;                 // Number of items per page
};

/**
 * Custom hook for managing customer companies (businesses that are your customers)
 * 
 * Features:
 * - Fetches paginated list of customer companies with filtering
 * - Supports text search across multiple fields
 * - Provides CRUD operations for customer company data
 * - Handles loading states and error management
 * - Automatically refetches when filters change
 * 
 * @param initialFilter - Initial filter parameters for the query
 */
export function useCustomerCompanies(initialFilter?: CustomerCompaniesFilter) {
    // State management for customer company data
    const [customerCompanies, setCustomerCompanies] = useState<CustomerCompany[]>([]);
    const [total, setTotal] = useState(0);                    // Total count for pagination
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState<CustomerCompaniesFilter>(initialFilter ?? {});

    /**
     * Effect to load customer companies whenever filter parameters change
     */
    useEffect(() => {
        fetchCustomerCompanies();
    }, [filter]);

    /**
     * Fetch customer companies from the server
     * Uses Edge Function for secure, server-side data access
     */
    async function fetchCustomerCompanies(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Call the customer-companies Edge Function with current filter
            const { data, error } = await supabase.functions.invoke("customer-companies", {
                method: "GET",
                body: {
                    search: filter.search,
                    page: filter.page ?? 1,
                    pageSize: filter.pageSize ?? 20,
                },
            });

            if (error) {
                throw new Error(error.message || "Failed to fetch customer companies");
            }

            // Update state with fetched data
            setCustomerCompanies(data.customerCompanies || []);
            setTotal(data.total || 0);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            setCustomerCompanies([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Create or update a customer company
     * 
     * @param input - Customer company data (with optional id for updates)
     * @throws Error if the operation fails
     */
    async function upsertCustomerCompany(
        input: Omit<CustomerCompany, "id"> & { id?: string },
    ): Promise<void> {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Send customer company data to the Edge Function
            // The function handles both create (no id) and update (with id) operations
            const { data, error } = await supabase.functions.invoke("customer-companies", {
                method: "POST",
                body: {
                    id: input.id,                          // Optional - if present, updates existing company
                    name: input.name,                      // Company name
                    service_type: input.service_type,      // Type of business
                    phone: input.phone,                    // Company phone
                    email: input.email,                    // Company email
                    address: input.address,                // Company address
                    notes: input.notes,                    // Optional notes
                },
            });

            if (error) {
                throw new Error(error.message || "Failed to save customer company");
            }

            // Refresh the list after successful update
            await fetchCustomerCompanies();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            throw err; // Re-throw so calling code can handle the error
        } finally {
            setLoading(false);
        }
    }

    /**
     * Delete a customer company
     * 
     * @param id - ID of the customer company to delete
     * @throws Error if the operation fails
     */
    async function deleteCustomerCompany(id: string): Promise<void> {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error } = await supabase.functions.invoke("customer-companies", {
                method: "DELETE",
                body: { id },
            });

            if (error) {
                throw new Error(error.message || "Failed to delete customer company");
            }

            // Refresh the list after successful deletion
            await fetchCustomerCompanies();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            throw err; // Re-throw so calling code can handle the error
        } finally {
            setLoading(false);
        }
    }

    /**
     * Update filter parameters and trigger data refresh
     * 
     * @param newFilter - New filter parameters
     */
    function updateFilter(newFilter: Partial<CustomerCompaniesFilter>): void {
        setFilter((prev) => ({ ...prev, ...newFilter }));
    }

    /**
     * Reset pagination to first page (useful after changing search/filter)
     */
    function resetPagination(): void {
        updateFilter({ page: 1 });
    }

    // Return the hook interface
    return {
        // Data
        customerCompanies, // Array of customer company objects
        total,            // Total count for pagination

        // State
        loading,          // Loading indicator
        error,            // Error message (null if no error)
        filter,           // Current filter parameters

        // Actions
        fetchCustomerCompanies,    // Refresh data manually
        upsertCustomerCompany,     // Create/update customer companies
        deleteCustomerCompany,     // Delete customer companies
        updateFilter,              // Update filter parameters
        resetPagination,           // Reset to page 1
    };
}
