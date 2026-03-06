"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { BillingCTA } from "@/app/(public)/pricing/_components/billing-cta";

export function SettingsClient() {
  const { company, loading, error } = useSubscription();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Account settings</h1>
          <p className="text-sm text-white/70">
            Company information and subscription status.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Company</h2>
          {loading && (
            <p className="text-sm text-white/70">Loading company...</p>
          )}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {!loading && company && (
            <div className="space-y-1">
              <p className="text-sm text-white/80">{company.name}</p>
              <p className="text-xs text-white/60">
                Subscription:{" "}
                <span className="capitalize">
                  {company.subscription_status}
                </span>
              </p>
              {company.trial_ends_at && (
                <p className="text-xs text-white/60">
                  Trial ends:{" "}
                  {new Date(company.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-3">
          <h2 className="text-sm font-semibold">Billing</h2>
          <BillingCTA />
          <p className="text-[11px] text-white/60">
            Billing is handled securely by Stripe. You can cancel any time.
          </p>
        </div>
      </section>

      <section className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
        <h2 className="text-sm font-semibold">Security</h2>
        <p className="text-sm text-white/70">
          To change your password or manage your login, use the auth pages
          under{" "}
          <Link href="/auth/login" className="text-[#86BBD8] hover:underline">
            /auth
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

