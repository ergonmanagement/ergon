-- ---------------------------------------------------------------------------
-- Review Request Tracking
--
-- Adds status-tracking fields to jobs, an opt-out flag to customers, and
-- automation settings to companies. Also installs the BEFORE UPDATE trigger
-- that detects the first non-paid → paid transition and stamps
-- review_request_queued_at in the same transaction.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- jobs: tracking columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS review_request_queued_at   timestamptz,
  ADD COLUMN IF NOT EXISTS review_request_sent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS review_request_status      text
    CONSTRAINT review_request_status_chk
      CHECK (review_request_status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS review_request_error       text,
  ADD COLUMN IF NOT EXISTS review_request_retry_count integer NOT NULL DEFAULT 0;

-- Index so the worker query is fast (filters on these two columns every run).
CREATE INDEX IF NOT EXISTS jobs_review_request_eligible_idx
  ON public.jobs (review_request_status, review_request_queued_at)
  WHERE review_request_status = 'queued';

-- ---------------------------------------------------------------------------
-- customers: opt-out flag
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email_opted_out boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- companies: automation settings
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS review_automation_enabled  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_link                text,
  ADD COLUMN IF NOT EXISTS review_request_delay_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS review_email_template      text;

-- ---------------------------------------------------------------------------
-- Trigger function: detect non-paid → paid transition and queue once.
--
-- Uses BEFORE UPDATE so the queue timestamp is written in the same
-- transaction as the status change — no race window between the two writes.
--
-- Guards:
--   - OLD.status IS DISTINCT FROM 'paid'  handles NULL old status safely
--   - NEW.review_request_queued_at IS NULL prevents re-queuing if the row
--     is saved again while already paid
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_review_request_queued()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid'
     AND OLD.status IS DISTINCT FROM 'paid'
     AND NEW.review_request_queued_at IS NULL
  THEN
    NEW.review_request_queued_at := now();
    NEW.review_request_status    := 'queued';
  END IF;
  RETURN NEW;
END;
$$;

-- Fire only when status is modified, keeping overhead near zero for other updates.
DROP TRIGGER IF EXISTS jobs_review_request_queued_trigger ON public.jobs;
CREATE TRIGGER jobs_review_request_queued_trigger
  BEFORE UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_request_queued();
