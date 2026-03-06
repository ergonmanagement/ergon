/**
 * Supabase Edge Function: customers
 *
 * Query parameters / request JSON:
 * - For list (GET):
 *   - query params:
 *     - type?: "customer" | "prospect"
 *     - search?: string
 *     - page?: number
 *     - pageSize?: number
 *
 * - For upsert (POST):
 *   - body JSON:
 *     {
 *       "id"?: string,
 *       "type": "customer" | "prospect",
 *       "name": string,
 *       "email"?: string,
 *       "phone"?: string,
 *       "address"?: string,
 *       "notes"?: string,
 *       "source"?: string
 *     }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema:
 * - GET success:
 *   {
 *     "items": Customer[],
 *     "total": number
 *   }
 *
 * - POST success:
 *   {
 *     "customer": Customer
 *   }
 *
 * Error JSON schema:
 * {
 *   "error": string,
 *   "code": string
 * }
 *
 * Notes:
 * - Company scoping is enforced via RLS (company_id policies) and auth.uid() → users.company_id.
 * - This function never accepts company_id from the client.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { CustomerUpsertBody } from "../_shared/schemas.ts";
import { enforceActiveSubscription } from "../_shared/subscription.ts";

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

  if (method === "GET") {
    const headerQuery = req.headers.get("X-Ergon-Query");
    const searchParams = headerQuery
      ? new URLSearchParams(headerQuery)
      : new URL(req.url).searchParams;

    const type = searchParams.get("type") as "customer" | "prospect" | null;
    const search = searchParams.get("search");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const offset = (Number.isFinite(page) && page > 0 ? page - 1 : 0) * limit;

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type === "customer" || type === "prospect") {
      query = query.eq("type", type);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse(
        { error: error.message, code: "CUSTOMERS_LIST_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({
      items: data ?? [],
      total: count ?? 0,
    });
  }

  if (method === "POST") {
    const subCheck = await enforceActiveSubscription(supabase, user.id);
    if (subCheck) return subCheck;

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsed = CustomerUpsertBody.safeParse(json);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Invalid request body", code: "VALIDATION_INVALID_BODY" },
        { status: 400 },
      );
    }

    const body = parsed.data;

    const payload: Record<string, unknown> = {
      type: body.type,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
      source: body.source ?? null,
    };

    let result;
    if (body.id) {
      result = await supabase
        .from("customers")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
    } else {
      result = await supabase.from("customers").insert(payload).select().single();
    }

    if (result.error) {
      return jsonResponse(
        { error: result.error.message, code: "CUSTOMERS_UPSERT_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({ customer: result.data });
  }

  return jsonResponse(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 },
  );
});

