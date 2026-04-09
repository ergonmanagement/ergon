/**
 * Supabase Edge Function: marketing
 *
 * Purpose:
 * - Generate marketing copy using OpenAI via a LangGraph-style pipeline.
 * - Persist generated content into marketing_assets.
 * - List existing marketing_assets for the current company.
 *
 * HTTP interface:
 *
 * - POST /functions/v1/marketing
 *   Request JSON body:
 *   {
 *     "channel": "social_post" | "email" | "sms" | "flyer",
 *     "context"?: string
 *   }
 *
 *   Response JSON (success):
 *   {
 *     "asset": {
 *       "id": string,
 *       "company_id": string,
 *       "channel": string,
 *       "content": string,
 *       "context": string | null,
 *       "status": string,
 *       "created_at": string
 *     }
 *   }
 *
 * - GET /functions/v1/marketing
 *   Query (via URL or X-Ergon-Query header):
 *   - channel?: "social_post" | "email" | "sms" | "flyer"
 *   - page?: number
 *   - pageSize?: number
 *
 *   Response JSON (success):
 *   {
 *     "items": MarketingAsset[],
 *     "total": number
 *   }
 *
 * Error JSON schema (for both verbs):
 * {
 *   "error": string,
 *   "code": string
 * }
 *
 * Security and architecture notes:
 * - Auth:
 *   - Supabase JWT is required for all operations.
 *   - auth.getUser() is used to resolve the current user id.
 * - Company scoping:
 *   - The Edge Function looks up the user's company_id from public.users.
 *   - All reads/writes rely on RLS (company_id policies) and never accept
 *     company_id from the client.
 * - AI:
 *   - AI is ONLY used here (Marketing module).
 *   - OpenAI is called exclusively from stepGenerateCopy in
 *     lib/marketing/pipeline/steps.ts (wired by LangGraph in graph.ts).
 *   - AI never touches the database directly.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { MarketingGenerateBody } from "../_shared/schemas.ts";
import { enforceActiveSubscription } from "../_shared/subscription.ts";

type MarketingChannel = "social_post" | "email" | "sms" | "flyer";

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

async function resolveCompanyId(
  supabase: SupabaseClient,
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
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...corsHeaders,
      },
    });
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

  let companyId: string;
  try {
    companyId = await resolveCompanyId(supabase, user.id);
  } catch {
    return jsonResponse(
      { error: "User company not found", code: "USER_COMPANY_NOT_FOUND" },
      { status: 400 },
    );
  }

  // List marketing assets
  if (method === "GET") {
    const headerQuery = req.headers.get("X-Ergon-Query");
    const searchParams = headerQuery
      ? new URLSearchParams(headerQuery)
      : new URL(req.url).searchParams;

    const channel = searchParams.get("channel") as MarketingChannel | null;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    const offset = (Number.isFinite(page) && page > 0 ? page - 1 : 0) * limit;

    let query = supabase
      .from("marketing_assets")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (channel) {
      query = query.eq("channel", channel);
    }

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse(
        { error: error.message, code: "MARKETING_LIST_FAILED" },
        { status: 400 },
      );
    }

    return jsonResponse({
      items: data ?? [],
      total: count ?? 0,
    });
  }

  // Generate new marketing content
  if (method === "POST") {
    const subCheck = await enforceActiveSubscription(supabase, user.id);
    if (subCheck) return subCheck;

    let jsonBody: unknown;
    try {
      jsonBody = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsed = MarketingGenerateBody.safeParse(jsonBody);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Invalid request body", code: "VALIDATION_INVALID_BODY" },
        { status: 400 },
      );
    }

    const { channel, context } = parsed.data;

    console.log(
      JSON.stringify({
        event: "marketing_generate_start",
        userId: user.id,
        companyId,
        channel,
      }),
    );

    try {
      // Lazy-load the graph only for POST generation to keep OPTIONS healthy.
      const { runMarketingGraph } = await import("./graph.ts");

      const asset = await runMarketingGraph({
        supabase,
        userId: user.id,
        companyId,
        channel: channel as MarketingChannel,
        context: context ?? null,
      });

      console.log(
        JSON.stringify({
          event: "marketing_generate_ok",
          userId: user.id,
          companyId,
          assetId: asset.id,
        }),
      );

      return jsonResponse({ asset });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate marketing copy.";
      console.log(
        JSON.stringify({
          event: "marketing_generate_fail",
          userId: user.id,
          companyId,
          error: message,
        }),
      );
      return jsonResponse(
        { error: message, code: "MARKETING_GENERATE_FAILED" },
        { status: 400 },
      );
    }
  }

  return jsonResponse(
    { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405 },
  );
});
