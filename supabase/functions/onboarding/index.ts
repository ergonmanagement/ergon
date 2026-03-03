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

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header", code: "AUTH_MISSING" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  let body: OnboardingRequest;
  try {
    body = (await req.json()) as OnboardingRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { company_name, service_type, phone } = body;
  if (!company_name || !service_type || !phone) {
    return new Response(
      JSON.stringify({ error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", code: "AUTH_UNAUTHORIZED" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const { data, error } = await supabase.rpc("onboarding_create_company_and_owner", {
    p_user_id: user.id,
    p_email: user.email,
    p_company_name: company_name,
    p_service_type: service_type,
    p_phone: phone,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: "ONBOARDING_FAILED" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

