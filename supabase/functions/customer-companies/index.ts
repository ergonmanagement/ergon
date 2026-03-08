/**
 * Supabase Edge Function: customer-companies
 *
 * Query parameters / request JSON:
 * - For list (GET):
 *   - body JSON:
 *     {
 *       "search"?: string,
 *       "page"?: number,
 *       "pageSize"?: number
 *     }
 *
 * - For upsert (POST):
 *   - body JSON:
 *     {
 *       "id"?: string,
 *       "name": string,
 *       "service_type"?: string,
 *       "phone"?: string,
 *       "email"?: string,
 *       "address"?: string,
 *       "notes"?: string
 *     }
 *
 * - For delete (DELETE):
 *   - body JSON:
 *     {
 *       "id": string
 *     }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema:
 * - GET success:
 *   { "customerCompanies": CustomerCompany[], "total": number }
 * - POST success:
 *   { "customerCompany": CustomerCompany }
 * - DELETE success:
 *   { "success": true }
 *
 * Error JSON schema:
 * { "error": string, "code": string }
 *
 * Company scoping:
 * - Enforced via RLS and auth.uid() → users.company_id.
 * - This function never accepts company_id from the client.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type SupabaseClient = ReturnType<typeof createClient>;

// Type definitions for customer company data
interface CustomerCompany {
    id: string;
    name: string;
    service_type: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface CustomerCompanyInput {
    id?: string;
    name: string;
    service_type?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

interface ListRequest {
    search?: string;
    page?: number;
    pageSize?: number;
}

interface DeleteRequest {
    id: string;
}

const corsHeaders: HeadersInit = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-ergon-query",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
}

function errorResponse(error: string, code: string, status = 400) {
    console.error(`[${code}] ${error}`);
    return jsonResponse({ error, code }, { status });
}

function getSupabaseClient(req: Request): SupabaseClient {
    return createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
            global: {
                headers: { Authorization: req.headers.get("Authorization")! },
            },
        }
    );
}

async function getCurrentUserCompanyId(supabase: SupabaseClient): Promise<string | null> {
    const { data, error } = await supabase.rpc("current_user_company_id");
    if (error) {
        console.error("Failed to get current user company:", error);
        return null;
    }
    return data;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create authenticated Supabase client
        const supabase = getSupabaseClient(req);

        // Get current user's company ID for security scoping
        const companyId = await getCurrentUserCompanyId(supabase);
        if (!companyId) {
            return errorResponse("User company not found", "INVALID_COMPANY", 403);
        }

        switch (req.method) {
            case "GET":
                return await handleList(req, supabase, companyId);
            case "POST":
                return await handleUpsert(req, supabase, companyId);
            case "DELETE":
                return await handleDelete(req, supabase, companyId);
            default:
                return errorResponse(`Method ${req.method} not allowed`, "METHOD_NOT_ALLOWED", 405);
        }
    } catch (error) {
        console.error("Edge function error:", error);
        return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
    }
});

/**
 * Handle GET requests - list customer companies with optional filtering
 */
async function handleList(req: Request, supabase: SupabaseClient, companyId: string): Promise<Response> {
    try {
        const body = await req.json() as ListRequest;
        const { search, page = 1, pageSize = 20 } = body;

        // Build query with company scoping
        let query = supabase
            .from("customer_companies")
            .select("*", { count: "exact" })
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        // Add search filter if provided
        if (search && search.trim()) {
            query = query.or(`name.ilike.%${search}%,service_type.ilike.%${search}%`);
        }

        // Add pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error("Database error:", error);
            return errorResponse("Failed to fetch customer companies", "DATABASE_ERROR", 500);
        }

        return jsonResponse({
            customerCompanies: data || [],
            total: count || 0,
        });
    } catch (error) {
        console.error("Error in handleList:", error);
        return errorResponse("Failed to process request", "REQUEST_ERROR", 400);
    }
}

/**
 * Handle POST requests - create or update customer companies
 */
async function handleUpsert(req: Request, supabase: SupabaseClient, companyId: string): Promise<Response> {
    try {
        const body = await req.json() as CustomerCompanyInput;
        const { id, name, service_type, phone, email, address, notes } = body;

        if (!name || !name.trim()) {
            return errorResponse("Company name is required", "VALIDATION_ERROR", 400);
        }

        const customerCompanyData = {
            company_id: companyId,
            name: name.trim(),
            service_type: service_type?.trim() || null,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            notes: notes?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        let result;
        if (id) {
            // Update existing customer company
            const { data, error } = await supabase
                .from("customer_companies")
                .update(customerCompanyData)
                .eq("id", id)
                .eq("company_id", companyId) // Ensure user can only update their own company's data
                .select()
                .single();

            if (error) {
                console.error("Update error:", error);
                return errorResponse("Failed to update customer company", "DATABASE_ERROR", 500);
            }
            result = data;
        } else {
            // Create new customer company
            const { data, error } = await supabase
                .from("customer_companies")
                .insert({
                    ...customerCompanyData,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("Insert error:", error);
                return errorResponse("Failed to create customer company", "DATABASE_ERROR", 500);
            }
            result = data;
        }

        return jsonResponse({ customerCompany: result });
    } catch (error) {
        console.error("Error in handleUpsert:", error);
        return errorResponse("Failed to process request", "REQUEST_ERROR", 400);
    }
}

/**
 * Handle DELETE requests - delete customer companies
 */
async function handleDelete(req: Request, supabase: SupabaseClient, companyId: string): Promise<Response> {
    try {
        const body = await req.json() as DeleteRequest;
        const { id } = body;

        if (!id) {
            return errorResponse("Customer company ID is required", "VALIDATION_ERROR", 400);
        }

        const { error } = await supabase
            .from("customer_companies")
            .delete()
            .eq("id", id)
            .eq("company_id", companyId); // Ensure user can only delete their own company's data

        if (error) {
            console.error("Delete error:", error);
            return errorResponse("Failed to delete customer company", "DATABASE_ERROR", 500);
        }

        return jsonResponse({ success: true });
    } catch (error) {
        console.error("Error in handleDelete:", error);
        return errorResponse("Failed to process request", "REQUEST_ERROR", 400);
    }
}
