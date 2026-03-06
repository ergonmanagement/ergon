/**
 * Supabase Edge Function: marketing
 * Handles marketing data queries with proper authentication
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ergon-query",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
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

  try {
    // Basic marketing stats - simplified for now
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query recent customers for marketing metrics
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (customersError) {
      return jsonResponse(
        { error: customersError.message, code: "MARKETING_QUERY_FAILED" },
        { status: 400 },
      );
    }

    // Query recent jobs for conversion metrics
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, created_at, status")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (jobsError) {
      return jsonResponse(
        { error: jobsError.message, code: "MARKETING_QUERY_FAILED" },
        { status: 400 },
      );
    }

    const newCustomers = customers?.length || 0;
    const newJobs = jobs?.length || 0;
    const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;

    return jsonResponse({
      metrics: {
        newCustomers,
        newJobs,
        completedJobs,
        conversionRate: newCustomers > 0 ? (completedJobs / newCustomers) * 100 : 0
      },
      customers: customers ?? [],
      jobs: jobs ?? []
    });
  } catch (err) {
    return jsonResponse(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
});
