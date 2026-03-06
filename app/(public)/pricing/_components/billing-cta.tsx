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
        className="w-full inline-flex items-center justify-center rounded-md bg-[#86BBD8] text-[#131B41] text-sm font-semibold py-2 hover:bg-[#6ea7c6] disabled:opacity-60"
      >
        {loading ? "Redirecting to checkout..." : "Start subscription"}
      </button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="text-[11px] text-white/60 text-center">
        You&apos;ll be taken to Stripe to securely enter payment details.
      </p>
    </div>
  );
}

