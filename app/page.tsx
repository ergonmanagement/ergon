import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function HomeContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="w-full max-w-5xl">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            Multi-tenant • RLS-secured • Built for service businesses
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Run your business with clarity.
          </h1>
          <p className="text-base text-white/75 sm:text-lg">
            Customers, jobs, schedule, finance, and marketing—organized in one
            place. Start a free trial in minutes.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/onboarding"
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-[#131B41] hover:bg-white/90"
            >
              Start free trial
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
          <div className="text-xs text-white/60">
            No credit card required to start. Billing comes later.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#131B41]/30 p-4">
              <div className="text-sm font-semibold">Schedule</div>
              <div className="mt-1 text-sm text-white/70">
                Week + month view with fast edits.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#131B41]/30 p-4">
              <div className="text-sm font-semibold">Jobs</div>
              <div className="mt-1 text-sm text-white/70">
                Track leads to paid work, end-to-end.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#131B41]/30 p-4">
              <div className="text-sm font-semibold">Customers</div>
              <div className="mt-1 text-sm text-white/70">
                Prospects, notes, and contact info.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#131B41]/30 p-4">
              <div className="text-sm font-semibold">Finance</div>
              <div className="mt-1 text-sm text-white/70">
                Revenue/expense totals, server-calculated.
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-[#131B41]/30 p-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold">See pricing</div>
              <div className="text-sm text-white/70">
                Simple, single-tier subscription.
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
            >
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
