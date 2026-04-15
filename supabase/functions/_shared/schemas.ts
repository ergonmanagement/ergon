/**
 * Shared Zod validation schemas for Supabase Edge Functions.
 *
 * Import from: "../_shared/schemas.ts" (or "../../_shared/schemas.ts" depending on depth).
 * Do not use @/ imports — Edge Functions run in Deno, not Next.js.
 */

import { z } from "https://esm.sh/zod@3.23.8";

// --- Customers ---

export const CustomerUpsertBody = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["customer", "prospect"]),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type CustomerUpsertBodyType = z.infer<typeof CustomerUpsertBody>;

// --- Jobs ---

export const JobUpsertBody = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1),
  service_type: z.string().min(1),
  status: z.enum(["lead", "scheduled", "completed", "paid"]),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type JobUpsertBodyType = z.infer<typeof JobUpsertBody>;

// --- Schedule (calendar_events) ---

const scheduleColorKey = z.enum([
  "sky",
  "emerald",
  "amber",
  "rose",
  "violet",
  "slate",
]);

export const ScheduleUpsertBody = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["event", "task"]),
  title: z.string().min(1),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  category: z.string().max(200).nullable().optional(),
  color_key: z.union([scheduleColorKey, z.null()]).optional(),
  customer_id: z.string().uuid().nullable().optional(),
});

export type ScheduleUpsertBodyType = z.infer<typeof ScheduleUpsertBody>;

// --- Finance ---

export const FinanceUpsertBody = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["revenue", "expense"]),
  job_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  category: z.string().nullable().optional(),
  amount: z.number().positive(),
  entry_date: z.string().min(1),
  notes: z.string().nullable().optional(),
});

export type FinanceUpsertBodyType = z.infer<typeof FinanceUpsertBody>;

// --- Marketing ---

export const MarketingGenerateBody = z.object({
  channel: z.enum(["social_post", "email", "sms", "flyer"]),
  context: z.string().max(2000).nullable().optional(),
});

export type MarketingGenerateBodyType = z.infer<typeof MarketingGenerateBody>;

// --- Jobs Photos ---

export const JobPhotoRequest = z.object({
  job_id: z.string().uuid(),
  content_type: z.string().min(1),
});

export type JobPhotoRequestType = z.infer<typeof JobPhotoRequest>;

// --- Onboarding ---

export const OnboardingBody = z.object({
  company_name: z.string().min(1),
  service_type: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().nullable().optional(),
  employees_count: z.number().int().nonnegative().nullable().optional(),
  years_in_business: z.number().int().nonnegative().nullable().optional(),
  estimated_revenue: z.number().nonnegative().nullable().optional(),
  referral_source: z.string().nullable().optional(),
});

export type OnboardingBodyType = z.infer<typeof OnboardingBody>;

// --- Billing Checkout ---

export const CheckoutRequest = z.object({
  success_url: z.string().url(),
  cancel_url: z.string().url(),
});

export type CheckoutRequestType = z.infer<typeof CheckoutRequest>;
