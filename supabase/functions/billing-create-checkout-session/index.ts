/**
 * Supabase Edge Function: billing-create-checkout-session
 *
 * Purpose:
 * - Create a Stripe Checkout Session for a subscription purchase.
 * - Attach the current company_id to the session metadata so the
 *   webhook can update companies.subscription_status.
 *
 * Request JSON schema:
 * {
 *   "success_url": string,
 *   "cancel_url": string
 * }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema (success):
 * {
 *   "url": string
 * }
 *
 * Error JSON schema:
 * {
 *   "error": string,
 *   "code": string
 * }
 *
 * IMPORTANT:
 * - Stripe logic must ONLY live in Billing endpoints.
 * - Never trust client-provided payment status; the webhook is the
 *   authority for updating subscription_status.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

type CheckoutRequest = {
  success_url: string;
  cancel_url: string;
};

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

async function resolveCompanyId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (error || !data?.company_id) {
    throw new Error("USER_COMPANY_NOT_FOUND");
  }

  return data.company_id as string;
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

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
  if (!stripeSecretKey || !stripePriceId) {
    return jsonResponse(
      { error: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

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

  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
      { status: 400 },
    );
  }

  if (!body.success_url || !body.cancel_url) {
    return jsonResponse(
      { error: "Missing success_url or cancel_url", code: "VALIDATION_MISSING_URLS" },
      { status: 400 },
    );
  }

  let companyId: string;
  try {
    companyId = await resolveCompanyId(supabase, user.id);
  } catch {
    return jsonResponse(
      { error: "User company not found", code: "USER_COMPANY_NOT_FOUND" },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      metadata: {
        company_id: companyId,
        user_id: user.id,
      },
    });

    if (!session.url) {
      return jsonResponse(
        { error: "Failed to create checkout session", code: "CHECKOUT_NO_URL" },
        { status: 500 },
      );
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return jsonResponse(
      { error: message, code: "CHECKOUT_SESSION_FAILED" },
      { status: 400 },
    );
  }
});
