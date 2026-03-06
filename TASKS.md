# Ergon Management MVP Tasks

> Check off each box as you complete it.  
> Source of truth: `docs/highLevelDesign.md`, `docs/lowLevelDesign.md`, `.cursor/rules/*`

---

## 1. Database & RLS

- [x] Define all enums (`subscription_status`, `user_role`, `customer_type`, `job_status`, `calendar_event_type`, `finance_entry_type`, `marketing_channel`)
- [x] Create `companies` table
- [x] Create `users` table linked to Supabase `auth.users`
- [x] Create `customers` table with indexes
- [x] Create `jobs` table with indexes
- [x] Create `job_photos` table and storage bucket
- [x] Create `calendar_events` table with indexes
- [x] Create `finance_entries` table with indexes
- [x] Create `marketing_assets` table with indexes
- [x] Enable RLS on all tenant tables
- [x] Add company-scoped RLS policies to all tenant tables

---

## 2. Auth & Onboarding

- [ ] Configure Supabase Auth (email/password)
- [x] Implement `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [x] Implement `lib/auth.ts` with `requireAuth` and helpers
- [x] Implement auth hooks: `useAuth`, `useLogin`, `useSignUp`, `useLogout`
- [x] Build `/auth/login` page
- [x] Build `/auth/onboarding` page and flow
- [x] Implement `onboarding` Edge Function
- [x] Wire onboarding flow to Edge Function and redirect to `/dashboard`

---

## 3. App Shell & Layout

- [x] Implement `AppShell` layout component (sidebar + header)
- [x] Implement desktop sidebar navigation (Dashboard, Schedule, Jobs, Customers, Marketing, Finance, Settings)
- [x] Implement mobile hamburger + drawer behavior
- [x] Enforce no horizontal scrolling on mobile
- [x] Implement `app/(app)/layout.tsx` using `requireAuth` and `AppShell`
- [x] Create placeholder pages for all authenticated routes

---

## 4. Jobs & Customers

- [x] Implement `customers/list` Edge Function
- [x] Implement `customers/upsert` Edge Function
- [x] Implement `hooks/useCustomers`
- [x] Build `/customers` list page (table + mobile cards)
- [x] Build `/customers/[customerId]` detail page
- [x] Implement `jobs/list` Edge Function
- [x] Implement `jobs/upsert` Edge Function
- [x] Implement `jobs/delete` Edge Function
- [x] Implement `jobs/create-photo-upload-url` Edge Function
- [x] Implement `hooks/useJobs`
- [x] Build `/jobs` list page
- [x] Build `/jobs/[jobId]` detail/edit page with photos

---

## 5. Schedule

- [x] Implement `schedule/list-events` Edge Function
- [x] Implement `schedule/upsert-event` Edge Function
- [x] Implement `hooks/useSchedule`
- [x] Build `/schedule` page with week view
- [x] Build `/schedule` page month view
- [ ] Wire creating jobs/events/tasks from schedule to backend

---

## 6. Finance

- [x] Implement `finance/list-entries` Edge Function with server-side totals
- [x] Implement `finance/upsert-entry` Edge Function
- [x] Implement `hooks/useFinanceEntries`
- [x] Build `/finance` page with filters and summary cards

---

## 7. Marketing (AI Only Here)

- [x] Implement LangGraph flow in `lib/marketing/langgraph/*`
- [x] Implement `marketing/generate-content` Edge Function
- [x] Implement `marketing/list-assets` Edge Function
- [x] Implement `hooks/useMarketing`
- [x] Build `/marketing` page (type selection, context form, results/history)
- [x] Verify no AI usage outside Marketing module

---

## 8. Billing (Stripe)

- [ ] Configure Stripe environment variables (server-only)
- [x] Implement `billing/create-checkout-session` Edge Function
- [x] Implement `billing/webhook` Edge Function with signature verification
- [x] Wire `/pricing` page to start checkout session
- [x] Surface subscription status in `/settings` page
- [ ] Enforce trial/active/canceled behavior in app (as per design)

---

## 9. Dashboard

- [x] Implement dashboard data aggregation using existing Edge Functions
- [x] Build `/dashboard` layout and cards:
- [x] Today’s Schedule
- [x] Upcoming Jobs
- [x] New Prospects
- [x] Finance Summary
- [x] Marketing Reminders

---

## 10. Polish, Validation & Comments

- [ ] Add Zod validation for all Edge Function inputs
- [x] Ensure consistent JSON error shape in all Edge Functions
- [x] Add required comments to all core logic and RLS policies
- [x] Audit for company_id scoping in all queries
- [x] Audit to confirm: AI only in Marketing; Stripe only in Billing
- [x] Final responsive UI pass (spacing, typography, cards, no horizontal scroll)


Testing
- [x] Decide and document test folder structure for backend and frontend.
- [ ] Seed script for test data (companies/users/jobs/etc.).
- [x] Add tests for at least 1 Edge Function per module.
- [ ] Add tests for at least 1 RLS policy per table.

Environments
- [x] Define and document local/staging/production environment mapping.
- [x] Document migration/deploy procedure for Supabase and Edge Functions.
- [x] Document Vercel deployment flow (branches → environments).

Logging & errors
- [x] Define error code naming conventions and document them.
- [x] Decide on minimum logging fields (user_id, company_id, function_name, error_code).
- [x] Document how frontend should display error messages based on code.