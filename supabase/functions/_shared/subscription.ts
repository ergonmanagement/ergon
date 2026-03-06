/**
 * Shared subscription check for Supabase Edge Functions.
 *
 * Use before allowing write operations (POST, PUT, PATCH, DELETE).
 * Exempt: onboarding, billing-create-checkout-session.
 *
 * Import from: "../_shared/subscription.ts" (or "../../_shared/subscription.ts").
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 400,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Checks if the user's company has an active subscription.
 * Returns a Response to return to the client if subscription is canceled;
 * returns null if the company may proceed with write operations.
 *
 * @param supabase - Supabase client with user's JWT (auth context)
 * @param userId - auth.uid() from the authenticated user
 * @returns Response to return (block write) or null (allow write)
 */
export async function enforceActiveSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Response | null> {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (userError || !userRow?.company_id) {
    return jsonResponse(
      { error: "User company not found", code: "USER_COMPANY_NOT_FOUND" },
      { status: 400 },
    );
  }

  const { data: companyRow, error: companyError } = await supabase
    .from("companies")
    .select("subscription_status")
    .eq("id", userRow.company_id)
    .single();

  if (companyError || !companyRow) {
    return jsonResponse(
      { error: "Company not found", code: "COMPANY_NOT_FOUND" },
      { status: 400 },
    );
  }

  if (companyRow.subscription_status === "canceled") {
    return jsonResponse(
      { error: "Subscription is canceled", code: "SUBSCRIPTION_CANCELED" },
      { status: 403 },
    );
  }

  return null;
}
