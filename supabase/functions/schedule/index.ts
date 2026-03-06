/**
 * Supabase Edge Function: schedule
 *
 * Query parameters / request JSON:
 * - For list (GET):
 *   - query params (from URL or X-Ergon-Query header):
 *     - from: ISO datetime string
 *     - to: ISO datetime string
 *     - page?: number
 *     - pageSize?: number
 *
 * - For upsert (POST):
 *   - body JSON:
 *     {
 *       "id"?: string,
 *       "type": "event" | "task",
 *       "title": string,
 *       "start_at": string,
 *       "end_at": string,
 *       "location"?: string,
 *       "notes"?: string
 *     }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema:
 * - GET success:
 *   { "items": CalendarEvent[], "total": number }
 * - POST success:
 *   { "event": CalendarEvent }
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

type CalendarEventType = "event" | "task";

type UpsertEventRequest = {
  id?: string;
  type: CalendarEventType;
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  notes?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ergon-query',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
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

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "100");
    const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 100;
    const offset = (Number.isFinite(page) && page > 0 ? page - 1 : 0) * limit;

    let query = supabase
      .from("calendar_events")
      .select("*", { count: "exact" })
      .order("start_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (from) {
      query = query.gte("start_at", from);
    }
    if (to) {
      query = query.lte("start_at", to);
    }

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse(
        { error: error.message, code: "SCHEDULE_LIST_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({
      items: data ?? [],
      total: count ?? 0,
    });
  }

  if (method === "POST") {
    let body: UpsertEventRequest;
    try {
      body = (await req.json()) as UpsertEventRequest;
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
        { status: 400 },
      );
    }

    if (!body.type || !body.title || !body.start_at || !body.end_at) {
      return jsonResponse(
        { error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      type: body.type,
      title: body.title,
      start_at: body.start_at,
      end_at: body.end_at,
      location: body.location ?? null,
      notes: body.notes ?? null,
    };

    let result;
    if (body.id) {
      result = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("calendar_events")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return jsonResponse(
        { error: result.error.message, code: "SCHEDULE_UPSERT_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({ event: result.data });
  }

  return jsonResponse(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 },
  );
});

