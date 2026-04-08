"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export function PublicHeaderCta() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingState() {
      if (!user || pathname !== "/pricing") {
        if (isMounted) setHasCompletedOnboarding(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) return;
      setHasCompletedOnboarding(!error && Boolean(data?.id));
    }

    void loadOnboardingState();
    return () => {
      isMounted = false;
    };
  }, [user, pathname]);

  if (pathname !== "/pricing") return null;
  if (loading || !user) return null;

  if (!hasCompletedOnboarding) {
    return (
      <Link
        href="/auth/onboarding"
        className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-ergon-cream/90 hover:bg-white/10 transition-colors"
      >
        Continue onboarding
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-ergon-cream/90 hover:bg-white/10 transition-colors"
    >
      Go to dashboard
    </Link>
  );
}

