/**
 * Supabase Edge Function: onboarding
 *
 * Request JSON schema:
 * {
 *   "company_name": string,
 *   "service_type": string,
 *   "phone": string
 * }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth)
 *
 * Response JSON schema (success):
 * {
 *   "company": {
 *     "id": string,
 *     "name": string,
 *     "subscription_status": "trial" | "active" | "canceled",
 *     "trial_ends_at": string | null
 *   },
 *   "user": {
 *     "id": string,
 *     "company_id": string,
     *     "email": string,
     *     "role": string
 *   }
 * }
 *
 * Error JSON schema:
 * {
 *   "error": string,
 *   "code": string
 * }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type OnboardingRequest = {
  company_name: string;
  service_type: string;
  phone: string;
};

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

  if (req.method !== "POST") {
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

  // Create client for user authentication using anon key  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const userSupabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Verify user authentication
  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse(
      { error: "Unauthorized", code: "AUTH_UNAUTHORIZED" },
      { status: 401 },
    );
  }

  // Create service role client for database operations (bypasses RLS)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

  let body: OnboardingRequest;
  try {
    body = (await req.json()) as OnboardingRequest;
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
      { status: 400 },
    );
  }

  const { company_name, service_type, phone } = body;
  if (!company_name || !service_type || !phone) {
    return jsonResponse(
      { error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const { data, error } = await adminSupabase.rpc("onboarding_create_company_and_owner", {
    p_user_id: user.id,
    p_email: user.email,
    p_company_name: company_name,
    p_service_type: service_type,
    p_phone: phone,
  });

  if (error) {
    return jsonResponse(
      { error: error.message, code: "ONBOARDING_FAILED" },
      { status: 400 },
    );
  }

  return jsonResponse(data);
});

