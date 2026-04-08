"use client";

import { useBillingCheckout } from "@/hooks/use-billing-checkout";

export function BillingCTA() {
  const { startCheckout, loading, error } = useBillingCheckout();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? "Redirecting to checkout..." : "Start subscription"}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground text-center">
        You&apos;ll be taken to Stripe to securely enter payment details.
      </p>
    </div>
  );
}

