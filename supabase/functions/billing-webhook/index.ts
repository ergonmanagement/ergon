/**
 * Supabase Edge Function: billing-webhook
 *
 * Purpose:
 * - Handle Stripe webhook events related to billing.
 * - Update companies.subscription_status based on subscription lifecycle.
 *
 * Endpoint:
 * - POST /functions/v1/billing-webhook
 *
 * Auth:
 * - No Supabase JWT; Stripe signs the request.
 * - STRIPE_WEBHOOK_SECRET is used to verify the signature.
 *
 * Expected events:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 *
 * Error JSON schema (for invalid requests):
 * {
 *   "error": string,
 *   "code": string
 * }
 *
 * NOTE:
 * - This endpoint must NEVER trust client-side payment status.
 * - companies.subscription_status is only changed here.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

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
  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
      { status: 405 },
    );
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecretKey || !webhookSecret) {
    return jsonResponse(
      { error: "Stripe webhook not configured", code: "STRIPE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return jsonResponse(
      { error: "Missing Stripe signature", code: "STRIPE_SIGNATURE_MISSING" },
      { status: 400 },
    );
  }

  // Webhook body must be raw text for signature verification.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid Stripe webhook signature";
    return jsonResponse(
      { error: message, code: "STRIPE_SIGNATURE_INVALID" },
      { status: 400 },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  async function setStatus(companyId: string, status: string) {
    await supabase
      .from("companies")
      .update({ subscription_status: status })
      .eq("id", companyId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = (session.metadata?.company_id as string | undefined) ??
          "";
        if (companyId) {
          await setStatus(companyId, "active");
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId =
          (subscription.metadata?.company_id as string | undefined) ?? "";
        if (!companyId) {
          break;
        }

        const stripeStatus = subscription.status;
        let newStatus: "trial" | "active" | "canceled" = "active";

        if (stripeStatus === "active" || stripeStatus === "trialing") {
          newStatus = "active";
        } else if (
          stripeStatus === "canceled" ||
          stripeStatus === "unpaid" ||
          stripeStatus === "incomplete_expired"
        ) {
          newStatus = "canceled";
        }

        await setStatus(companyId, newStatus);
        break;
      }
      default:
        // For unhandled event types, acknowledge without side effects.
        break;
    }

    return jsonResponse({ received: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process webhook.";
    return jsonResponse(
      { error: message, code: "WEBHOOK_PROCESSING_FAILED" },
      { status: 500 },
    );
  }
});

