/**
 * Supabase Edge Function: finance
 *
 * Query parameters / request JSON:
 * - For list (GET):
 *   - query params (from URL or X-Ergon-Query header):
 *     - from: ISO date string
 *     - to: ISO date string
 *     - type?: "revenue" | "expense"
 *
 * - For upsert (POST):
 *   - body JSON:
 *     {
 *       "id"?: string,
 *       "type": "revenue" | "expense",
 *       "job_id"?: string,
 *       "title": string,
 *       "category"?: string,
 *       "amount": number,
 *       "entry_date": string,
 *       "notes"?: string
 *     }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema:
 * - GET success:
 *   {
 *     "items": FinanceEntry[],
 *     "totals": {
 *       "revenue": number,
 *       "expenses": number,
 *       "net": number
 *     }
 *   }
 *
 * - POST success:
 *   { "entry": FinanceEntry }
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

type FinanceEntryType = "revenue" | "expense";

type UpsertFinanceEntryRequest = {
  id?: string;
  type: FinanceEntryType;
  job_id?: string;
  title: string;
  category?: string;
  amount: number;
  entry_date: string;
  notes?: string;
};

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
  const method = req.method.toUpperCase();

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

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type") as FinanceEntryType | null;

    if (!from || !to) {
      return jsonResponse(
        { error: "from and to are required", code: "VALIDATION_MISSING_RANGE" },
        { status: 400 },
      );
    }

    let baseQuery = supabase
      .from("finance_entries")
      .select("*", { count: "exact" })
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: false });

    if (type === "revenue" || type === "expense") {
      baseQuery = baseQuery.eq("type", type);
    }

    const { data, error, count } = await baseQuery;

    if (error) {
      return jsonResponse(
        { error: error.message, code: "FINANCE_LIST_FAILED" },
        { status: 400 },
      );
    }

    const items = (data ?? []) as Array<{ type: FinanceEntryType; amount: number }>;
    const revenueTotal = items
      .filter((e) => e.type === "revenue")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const expenseTotal = items
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return jsonResponse({
      items: data ?? [],
      totals: {
        revenue: revenueTotal,
        expenses: expenseTotal,
        net: revenueTotal - expenseTotal,
      },
      total: count ?? 0,
    });
  }

  if (method === "POST") {
    let body: UpsertFinanceEntryRequest;
    try {
      body = (await req.json()) as UpsertFinanceEntryRequest;
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
        { status: 400 },
      );
    }

    if (
      !body.type ||
      !body.title ||
      typeof body.amount !== "number" ||
      !body.entry_date
    ) {
      return jsonResponse(
        { error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" },
        { status: 400 },
      );
    }

    if (body.amount <= 0) {
      return jsonResponse(
        { error: "Amount must be positive", code: "VALIDATION_AMOUNT_POSITIVE" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      type: body.type,
      job_id: body.job_id ?? null,
      title: body.title,
      category: body.category ?? null,
      amount: body.amount,
      entry_date: body.entry_date,
      notes: body.notes ?? null,
    };

    let result;
    if (body.id) {
      result = await supabase
        .from("finance_entries")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("finance_entries")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return jsonResponse(
        { error: result.error.message, code: "FINANCE_UPSERT_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({ entry: result.data });
  }

  return jsonResponse(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 },
  );
});

