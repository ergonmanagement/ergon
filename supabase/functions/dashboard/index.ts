/**
 * Supabase Edge Function: dashboard
 *
 * Purpose:
 * - Provide a single, aggregated payload for the main dashboard.
 * - All data is scoped to the current company via RLS and company_id.
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema (success):
 * {
 *   "today_schedule": {
 *     "events": CalendarEvent[],
 *     "jobs": Job[]
 *   },
 *   "upcoming_jobs": Job[],
 *   "new_prospects": Customer[],
 *   "finance_summary": {
 *     "revenue": number,
 *     "expenses": number,
 *     "net": number
 *   },
 *   "marketing_reminders": MarketingAsset[]
 * }
 *
 * Error JSON schema:
 * {
 *   "error": string,
 *   "code": string
 * }
 *
 * Notes:
 * - All queries rely on RLS; the Edge Function never accepts company_id
 *   from the client.
 * - Finance totals are calculated server-side here for the selected range.
 * - This function does not call OpenAI or Stripe; it only aggregates
 *   existing data for display.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ergon-query",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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
  if (req.method === "OPTIONS") {
    // CORS preflight support
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
      },
    });
  }

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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase: SupabaseClient = createClient(supabaseUrl, anonKey, {
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

  // Compute date ranges in UTC.
  const now = new Date();

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString();
  const todayEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  ).toISOString();

  const sevenDaysAgo = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 7,
      0,
      0,
      0,
      0,
    ),
  ).toISOString();

  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  ).toISOString();

  try {
    // Today's calendar_events
    const { data: todayEvents, error: todayEventsError } = await supabase
      .from("calendar_events")
      .select("*")
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .order("start_at", { ascending: true });

    if (todayEventsError) {
      throw new Error(todayEventsError.message);
    }

    // Today's jobs (based on scheduled_start)
    const { data: todayJobs, error: todayJobsError } = await supabase
      .from("jobs")
      .select("*")
      .gte("scheduled_start", todayStart)
      .lte("scheduled_start", todayEnd)
      .order("scheduled_start", { ascending: true });

    if (todayJobsError) {
      throw new Error(todayJobsError.message);
    }

    // Upcoming jobs (after today)
    const { data: upcomingJobs, error: upcomingJobsError } = await supabase
      .from("jobs")
      .select("*")
      .gt("scheduled_start", todayEnd)
      .order("scheduled_start", { ascending: true })
      .limit(10);

    if (upcomingJobsError) {
      throw new Error(upcomingJobsError.message);
    }

    // New prospects (customers created in last 7 days)
    const { data: newProspects, error: newProspectsError } = await supabase
      .from("customers")
      .select("*")
      .eq("type", "prospect")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (newProspectsError) {
      throw new Error(newProspectsError.message);
    }

    // Finance summary for current month (revenue, expenses, net)
    const { data: financeRows, error: financeError } = await supabase
      .from("finance_entries")
      .select("type, amount, entry_date")
      .gte("entry_date", monthStart)
      .lte("entry_date", todayEnd);

    if (financeError) {
      throw new Error(financeError.message);
    }

    const rows = (financeRows ?? []) as Array<{
      type: "revenue" | "expense";
      amount: number;
    }>;
    const revenue = rows
      .filter((r) => r.type === "revenue")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const expenses = rows
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // Recent marketing assets (for reminders)
    const { data: marketingAssets, error: marketingError } = await supabase
      .from("marketing_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (marketingError) {
      throw new Error(marketingError.message);
    }

    return jsonResponse({
      today_schedule: {
        events: todayEvents ?? [],
        jobs: todayJobs ?? [],
      },
      upcoming_jobs: upcomingJobs ?? [],
      new_prospects: newProspects ?? [],
      finance_summary: {
        revenue,
        expenses,
        net: revenue - expenses,
      },
      marketing_reminders: marketingAssets ?? [],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load dashboard.";
    return jsonResponse(
      { error: message, code: "DASHBOARD_LOAD_FAILED" },
      { status: 400 },
    );
  }
});
