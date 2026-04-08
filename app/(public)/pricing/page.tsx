import Link from "next/link";
import { BillingCTA } from "./_components/billing-cta";

export default function PricingPage() {
  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ergon-cream">
          Simple pricing for growing shops
        </h1>
        <p className="text-sm text-ergon-cream/70 leading-relaxed">
          One plan with everything you need to organize jobs, customers,
          schedule, finance, and marketing.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card text-card-foreground shadow-lg p-8 space-y-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Ergon Management
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Unlimited jobs, customers, and finance tracking.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-semibold text-foreground tabular-nums">
              $49
            </p>
            <p className="text-xs text-muted-foreground">/ month / company</p>
          </div>
        </div>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            <span>Organized jobs, customers, and schedule</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            <span>Simple revenue and expense tracking</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            <span>Built-in marketing content generation</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            <span>Multi-tenant, secure architecture</span>
          </li>
        </ul>
        <BillingCTA />
      </section>

      <p className="text-xs text-center text-ergon-cream/60">
        Already subscribed?{" "}
        <Link
          href="/settings"
          className="text-ergon-primary hover:text-ergon-cream underline-offset-2 hover:underline font-medium"
        >
          Manage your subscription
        </Link>
        .
      </p>
    </div>
  );
}

