/**
 * Supabase Edge Function: jobs
 * Handles job data queries with proper authentication
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
    // Query jobs with RLS
    const { data, error } = await supabase
      .from("jobs")
      .select("*, customers(name)")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse(
        { error: error.message, code: "JOBS_QUERY_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({
      jobs: data ?? []
    });
  } catch (err) {
    return jsonResponse(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
});
