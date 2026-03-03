/**
 * Supabase Edge Function: jobs-photos
 *
 * Purpose:
 * - Generate a signed upload URL for a private job photo.
 * - Insert a job_photos row tied to the current company and job.
 *
 * Request JSON schema:
 * {
 *   "job_id": string,
 *   "content_type": string
 * }
 *
 * Auth requirement:
 * - Supabase JWT required (user must be signed in via Supabase Auth).
 *
 * Response JSON schema (success):
 * {
 *   "upload_url": string,
 *   "photo": {
 *     "id": string,
 *     "storage_path": string
 *   }
 * }
 *
 * Error JSON schema:
 * { "error": string, "code": string }
 *
 * Company scoping:
 * - Validates that the job belongs to the current company via RLS.
 * - Uses a private "job_photos" bucket; clients only use signed URLs.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type JobPhotoRequest = {
  job_id: string;
  content_type: string;
};

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "Missing or invalid Authorization header", code: "AUTH_MISSING" },
      { status: 401 },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
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

  let body: JobPhotoRequest;
  try {
    body = (await req.json()) as JobPhotoRequest;
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body", code: "VALIDATION_INVALID_JSON" },
      { status: 400 },
    );
  }

  if (!body.job_id || !body.content_type) {
    return jsonResponse(
      { error: "Missing required fields", code: "VALIDATION_MISSING_FIELDS" },
      { status: 400 },
    );
  }

  // Validate that the job exists and belongs to the current company via RLS.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", body.job_id)
    .single();

  if (jobError || !job) {
    return jsonResponse(
      { error: "Job not found or not accessible", code: "JOB_NOT_FOUND" },
      { status: 404 },
    );
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}`;

  const { data: signed, error: signedError } = await supabase.storage
    .from("job_photos")
    .createSignedUploadUrl(objectPath);

  if (signedError || !signed) {
    return jsonResponse(
      { error: signedError?.message ?? "Failed to create signed URL", code: "SIGNED_URL_FAILED" },
      { status: 400 },
    );
  }

  const { data: photo, error: photoError } = await supabase
    .from("job_photos")
    .insert({
      job_id: body.job_id,
      storage_path: objectPath,
    })
    .select()
    .single();

  if (photoError || !photo) {
    return jsonResponse(
      { error: photoError?.message ?? "Failed to create job photo record", code: "JOB_PHOTO_INSERT_FAILED" },
      { status: 400 },
    );
  }

  return jsonResponse({
    upload_url: signed.signedUrl,
    photo: {
      id: photo.id,
      storage_path: photo.storage_path,
    },
  });
});

