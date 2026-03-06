/**
 * Supabase Edge Function: customer-profile
 *
 * Purpose:
 * - Return a single customer's profile, job history, and revenue total.
 *
 * Request:
 * - GET with customer id supplied via:
 *   - X-Ergon-Query header: "customer_id=<uuid>"
 *   - or query param: ?customer_id=<uuid>
 *
 * Response JSON schema (success):
 * {
 *   "customer": Customer,
 *   "jobs": Job[],
 *   "revenue_total": number
 * }
 *
 * Error JSON schema:
 * { "error": string, "code": string }
 *
 * Company scoping:
 * - Enforced via RLS on customers/jobs/finance_entries.
 * - This function never accepts company_id from the client.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

serve(async (req: Request) => {
  if (req.method !== "GET") {
    return jsonResponse(
      { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
      { status: 405 },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "Missing or invalid Authorization header", code: "AUTH_MISSING" },
      { status: 401 },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
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

  const headerQuery = req.headers.get("X-Ergon-Query");
  const searchParams = headerQuery
    ? new URLSearchParams(headerQuery)
    : new URL(req.url).searchParams;

  const customerId = searchParams.get("customer_id");
  if (!customerId) {
    return jsonResponse(
      { error: "customer_id is required", code: "VALIDATION_MISSING_ID" },
      { status: 400 },
    );
  }

  // Load customer (RLS ensures same company).
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    return jsonResponse(
      { error: "Customer not found", code: "CUSTOMER_NOT_FOUND" },
      { status: 404 },
    );
  }

  // Load jobs for this customer.
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", customerId)
    .order("scheduled_start", { ascending: true, nullsLast: true });

  if (jobsError) {
    return jsonResponse(
      { error: jobsError.message, code: "CUSTOMER_JOBS_FAILED" },
      { status: 400 },
    );
  }

  const jobIds = (jobs ?? []).map((j: { id: string }) => j.id);

  let revenueTotal = 0;
  if (jobIds.length > 0) {
    const { data: financeRows, error: financeError } = await supabase
      .from("finance_entries")
      .select("type, amount, job_id")
      .eq("type", "revenue")
      .in("job_id", jobIds);

    if (financeError) {
      return jsonResponse(
        { error: financeError.message, code: "CUSTOMER_REVENUE_FAILED" },
        { status: 400 },
      );
    }

    revenueTotal = (financeRows ?? []).reduce(
      (sum: number, row: { amount: number }) => sum + Number(row.amount || 0),
      0,
    );
  }

  return jsonResponse({
    customer,
    jobs: jobs ?? [],
    revenue_total: revenueTotal,
  });
});

