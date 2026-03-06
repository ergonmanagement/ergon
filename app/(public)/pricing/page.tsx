import Link from "next/link";
import { BillingCTA } from "./_components/billing-cta";

export default function PricingPage() {
  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Simple pricing for growing shops</h1>
        <p className="text-sm text-white/70">
          One plan with everything you need to organize jobs, customers,
          schedule, finance, and marketing.
        </p>
      </div>

      <section className="border border-white/10 rounded-2xl p-6 bg-white/5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Ergon Management</h2>
            <p className="text-xs text-white/70">
              Unlimited jobs, customers, and finance tracking.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">$49</p>
            <p className="text-xs text-white/70">per month, per company</p>
          </div>
        </div>
        <ul className="text-sm text-white/80 space-y-1">
          <li>• Organized jobs, customers, and schedule</li>
          <li>• Simple revenue and expense tracking</li>
          <li>• Built-in marketing content generation</li>
          <li>• Multi-tenant, secure architecture</li>
        </ul>
        <BillingCTA />
      </section>

      <p className="text-xs text-center text-white/60">
        Already subscribed?{" "}
        <Link href="/settings" className="text-[#86BBD8] hover:underline">
          Manage your subscription
        </Link>
        .
      </p>
    </div>
  );
}

