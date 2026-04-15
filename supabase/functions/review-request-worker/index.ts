/**
 * Supabase Edge Function: review-request-worker
 *
 * Runs on a cron schedule (every 15 minutes). For each job that has been
 * marked "paid" and whose review request delay has elapsed, this worker:
 *
 *   1. Atomically claims the job (queued → sending) to prevent duplicate sends.
 *   2. Runs guard checks — skips if any blocking condition is true.
 *   3. Sends a review request email via the Brevo (Sendinblue) API.
 *   4. Writes the final status (sent / failed / skipped) back to the job row.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   BREVO_API_KEY       — Brevo API key
 *   BREVO_FROM_EMAIL    — Verified sender address (e.g. noreply@yourdomain.com)
 *
 * Automatically injected by Supabase runtime:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EligibleJob = {
  id: string;
  customer_name: string;
  review_request_retry_count: number;
  // joined from customers
  customer_email: string | null;
  customer_email_opted_out: boolean;
  // joined from companies
  company_name: string;
  company_review_link: string | null;
  company_review_automation_enabled: boolean;
  company_review_email_template: string | null;
};

type ClaimResult = { claimed: boolean };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;

/**
 * Extract the first word of a full name as the "first name" for the greeting.
 * Falls back to the full name if it contains no spaces.
 */
function firstNameFrom(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

/**
 * Render the email body by substituting {{variables}} in the template.
 * Uses the company's custom template when set, otherwise the built-in default.
 */
function renderTemplate(
  template: string | null,
  vars: { customer_first_name: string; company_name: string; review_link: string },
): { subject: string; text: string } {
  const body = template ??
    `Hi {{customer_first_name}},

Thank you for choosing {{company_name}}! Your job has been completed and we'd love to hear your feedback.

Leave us a review here: {{review_link}}

It only takes a minute and means a lot to our team.

Thank you,
The {{company_name}} Team`;

  const rendered = body
    .replace(/\{\{customer_first_name\}\}/g, vars.customer_first_name)
    .replace(/\{\{company_name\}\}/g, vars.company_name)
    .replace(/\{\{review_link\}\}/g, vars.review_link);

  return {
    subject: `How did we do? Leave us a quick review`,
    text: rendered,
  };
}

/**
 * Attempt to atomically claim a job by flipping its status from 'queued' to
 * 'sending'. Returns { claimed: true } only if the UPDATE matched one row —
 * meaning no other worker instance raced ahead and claimed it first.
 */
async function claimJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
): Promise<ClaimResult> {
  const { data, error } = await supabase
    .from("jobs")
    .update({ review_request_status: "sending" })
    .eq("id", jobId)
    .eq("review_request_status", "queued")
    .select("id");

  if (error) {
    console.error(`[review-worker] claim error for job ${jobId}:`, error.message);
    return { claimed: false };
  }

  return { claimed: (data?.length ?? 0) > 0 };
}

/**
 * Write a terminal or retry outcome back to the job row.
 */
async function writeOutcome(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  outcome:
    | { type: "sent" }
    | { type: "skipped" }
    | { type: "retry"; errorMessage: string; newRetryCount: number }
    | { type: "failed"; errorMessage: string },
): Promise<void> {
  let patch: Record<string, unknown>;

  switch (outcome.type) {
    case "sent":
      patch = {
        review_request_status: "sent",
        review_request_sent_at: new Date().toISOString(),
        review_request_error: null,
      };
      break;
    case "skipped":
      patch = { review_request_status: "skipped" };
      break;
    case "retry":
      patch = {
        review_request_status: "queued",
        review_request_error: outcome.errorMessage,
        review_request_retry_count: outcome.newRetryCount,
      };
      break;
    case "failed":
      patch = {
        review_request_status: "failed",
        review_request_error: outcome.errorMessage,
      };
      break;
  }

  const { error } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", jobId);

  if (error) {
    console.error(`[review-worker] write outcome error for job ${jobId}:`, error.message);
  }
}

/**
 * Send an email via the Brevo (Sendinblue) REST API.
 * Returns null on success, or an error string on failure.
 */
async function sendViaBrevo(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": opts.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: opts.from },
        to: [{ email: opts.to }],
        subject: opts.subject,
        textContent: opts.text,
      }),
    });
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body?.message ?? "";
    } catch {
      // ignore parse failure
    }
    return `Brevo ${res.status}: ${detail || res.statusText}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const brevoApiKey = Deno.env.get("BREVO_API_KEY") ?? "";
  const brevoFrom = Deno.env.get("BREVO_FROM_EMAIL") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[review-worker] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response("Configuration error", { status: 500 });
  }

  if (!brevoApiKey || !brevoFrom) {
    console.error("[review-worker] Missing BREVO_API_KEY or BREVO_FROM_EMAIL — no emails can be sent");
    return new Response("Email configuration missing", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // -------------------------------------------------------------------------
  // Fetch eligible jobs: status='paid', review_request_status='queued',
  // delay elapsed, retry count below max. Joins customer email and company
  // settings in one query so we have everything we need before claiming.
  // -------------------------------------------------------------------------
  const { data: eligibleRows, error: fetchError } = await supabase
    .from("jobs")
    .select(`
      id,
      customer_name,
      review_request_retry_count,
      customers!inner (
        email,
        email_opted_out
      ),
      companies!inner (
        name,
        review_link,
        review_automation_enabled,
        review_email_template,
        review_request_delay_hours
      )
    `)
    .eq("status", "paid")
    .eq("review_request_status", "queued")
    .lt("review_request_retry_count", MAX_RETRIES)
    .lte(
      "review_request_queued_at",
      // Filter using a computed column expression is not available in the JS
      // client, so we use a raw filter referencing the delay column.
      // Supabase PostgREST supports `lte` with `now()` expressions via RPC,
      // but the safest cross-version approach is to fetch all queued rows and
      // apply the delay check in process after joining the company delay.
      // We use a wide window (now()) and do the delay check below.
      new Date().toISOString(),
    );

  if (fetchError) {
    console.error("[review-worker] Failed to fetch eligible jobs:", fetchError.message);
    return new Response("Fetch error", { status: 500 });
  }

  const rows = eligibleRows ?? [];
  console.log(`[review-worker] Fetched ${rows.length} candidate job(s)`);

  let sent = 0;
  let skipped = 0;
  let retried = 0;
  let failed = 0;

  for (const row of rows) {
    // PostgREST may return joined relations as an array or a single object
    // depending on the relationship cardinality. Normalise both cases.
    const customerRow = Array.isArray(row.customers)
      ? (row.customers as any[])[0]
      : (row.customers as any);
    const companyRow = Array.isArray(row.companies)
      ? (row.companies as any[])[0]
      : (row.companies as any);

    // Reshape joined data into a flat type for clarity.
    const job: EligibleJob = {
      id: row.id,
      customer_name: row.customer_name,
      review_request_retry_count: row.review_request_retry_count,
      customer_email: customerRow?.email ?? null,
      customer_email_opted_out: customerRow?.email_opted_out ?? false,
      company_name: companyRow?.name ?? "",
      company_review_link: companyRow?.review_link ?? null,
      company_review_automation_enabled: companyRow?.review_automation_enabled ?? false,
      company_review_email_template: companyRow?.review_email_template ?? null,
    };

    // Apply the per-company delay check that PostgREST can't express inline.
    const delayHours: number = companyRow?.review_request_delay_hours ?? 24;
    const queuedAt: string = (row as any).review_request_queued_at as string;

    if (queuedAt) {
      const eligibleAt = new Date(queuedAt).getTime() + delayHours * 60 * 60 * 1000;
      if (Date.now() < eligibleAt) {
        console.log(`[review-worker] Job ${job.id} — delay not elapsed (delayHours=${delayHours}, eligibleAt=${new Date(eligibleAt).toISOString()})`);
        continue;
      }
    }

    // -----------------------------------------------------------------------
    // Atomically claim the job. If another worker instance picked it up
    // between our SELECT and now, `claimed` will be false — move on.
    // -----------------------------------------------------------------------
    const { claimed } = await claimJob(supabase, job.id);
    if (!claimed) {
      console.log(`[review-worker] Job ${job.id} already claimed by another worker instance — skipping`);
      continue;
    }

    // -----------------------------------------------------------------------
    // Guard checks — any failing check writes 'skipped' and continues.
    // -----------------------------------------------------------------------
    const skipReasons: string[] = [];

    if (!job.company_review_automation_enabled) {
      skipReasons.push("review automation disabled for company");
    }
    if (!job.company_review_link) {
      skipReasons.push("company has no review_link configured");
    }
    if (!job.customer_email) {
      skipReasons.push("customer has no email address");
    }
    if (job.customer_email_opted_out) {
      skipReasons.push("customer is opted out of emails");
    }

    if (skipReasons.length > 0) {
      console.log(`[review-worker] Job ${job.id} skipped: ${skipReasons.join("; ")}`);
      await writeOutcome(supabase, job.id, { type: "skipped" });
      skipped++;
      continue;
    }

    // -----------------------------------------------------------------------
    // Render and send the email.
    // -----------------------------------------------------------------------
    const customerFirstName = firstNameFrom(job.customer_name);
    const { subject, text } = renderTemplate(job.company_review_email_template, {
      customer_first_name: customerFirstName,
      company_name: job.company_name,
      review_link: job.company_review_link!,
    });

    const sendError = await sendViaBrevo({
      apiKey: brevoApiKey,
      from: brevoFrom,
      to: job.customer_email!,
      subject,
      text,
    });

    if (sendError === null) {
      await writeOutcome(supabase, job.id, { type: "sent" });
      console.log(`[review-worker] Job ${job.id} — review request sent to ${job.customer_email}`);
      sent++;
    } else {
      const newRetryCount = job.review_request_retry_count + 1;
      if (newRetryCount >= MAX_RETRIES) {
        await writeOutcome(supabase, job.id, { type: "failed", errorMessage: sendError });
        console.error(`[review-worker] Job ${job.id} — permanently failed after ${newRetryCount} attempts: ${sendError}`);
        failed++;
      } else {
        await writeOutcome(supabase, job.id, {
          type: "retry",
          errorMessage: sendError,
          newRetryCount,
        });
        console.warn(`[review-worker] Job ${job.id} — send failed (attempt ${newRetryCount}/${MAX_RETRIES}): ${sendError}`);
        retried++;
      }
    }
  }

  const summary = { sent, skipped, retried, failed, total: rows.length };
  console.log("[review-worker] Run complete:", summary);

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
