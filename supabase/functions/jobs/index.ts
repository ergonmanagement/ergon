/**
 * Supabase Edge Function: jobs
 *
 * Query parameters / request JSON:
 * - For list (GET):
 *   - query params:
 *     - status?: "lead" | "scheduled" | "completed" | "paid"
 *     - from?: ISO datetime string
 *     - to?: ISO datetime string
 *     - page?: number
 *     - pageSize?: number
 *
 * - For upsert (POST):
 *   - body JSON:
 *     {
 *       "id"?: string,
 *       "customer_id"?: string,
 *       "customer_name": string,
 *       "service_type": string,
 *       "status": "lead" | "scheduled" | "completed" | "paid",
 *       "scheduled_start"?: string,
 *       "scheduled_end"?: string,
 *       "address"?: string,
 *       "price"?: number,
 *       "notes"?: string,
 *       "source"?: string
 *     }
 *
 * - For delete (DELETE):
 *   - query params:
 *     - id: string
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema:
 * - GET success:
 *   { "items": Job[], "total": number }
 * - POST success:
 *   { "job": Job }
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ergon-query",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
};

type JobStatus = "lead" | "scheduled" | "completed" | "paid";

type UpsertJobRequest = {
  id?: string;
  customer_id?: string;
  customer_name: string;
  service_type: string;
  status: JobStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  address?: string;
  price?: number;
  notes?: string;
  source?: string;
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

serve(async (req: Request) => {
  const method = req.method.toUpperCase();

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "Missing or invalid Authorization header", code: "AUTH_MISSING" },
      { status: 401 },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse(
      { error: "Unauthorized", code: "AUTH_UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (method === "GET") {
    const headerQuery = req.headers.get("X-Ergon-Query");
    const searchParams = headerQuery
      ? new URLSearchParams(headerQuery)
      : new URL(req.url).searchParams;

    const status = searchParams.get("status") as JobStatus | null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const offset = (Number.isFinite(page) && page > 0 ? page - 1 : 0) * limit;

    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .order("scheduled_start", { ascending: true, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("scheduled_start", from);
    }
    if (to) {
      query = query.lte("scheduled_start", to);
    }

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse(
        { error: error.message, code: "JOBS_LIST_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({
      items: data ?? [],
      total: count ?? 0,
    });
  }

  if (method === "POST") {
    let body: UpsertJobRequest;
    try {
      body = (await req.json()) as UpsertJobRequest;
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
        { status: 400 },
      );
    }

    if (!body.customer_name || !body.service_type || !body.status) {
      return jsonResponse(
        { error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      customer_id: body.customer_id ?? null,
      customer_name: body.customer_name,
      service_type: body.service_type,
      status: body.status,
      scheduled_start: body.scheduled_start ?? null,
      scheduled_end: body.scheduled_end ?? null,
      address: body.address ?? null,
      price: body.price ?? null,
      notes: body.notes ?? null,
      source: body.source ?? null,
    };

    let result;
    if (body.id) {
      result = await supabase
        .from("jobs")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
    } else {
      result = await supabase.from("jobs").insert(payload).select().single();
    }

    if (result.error) {
      return jsonResponse(
        { error: result.error.message, code: "JOBS_UPSERT_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({ job: result.data });
  }

  if (method === "DELETE") {
    const headerQuery = req.headers.get("X-Ergon-Query");
    const searchParams = headerQuery
      ? new URLSearchParams(headerQuery)
      : new URL(req.url).searchParams;

    const id = searchParams.get("id");
    if (!id) {
      return jsonResponse(
        { error: "Missing id", code: "VALIDATION_MISSING_ID" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      return jsonResponse(
        { error: error.message, code: "JOBS_DELETE_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 },
  );
});

