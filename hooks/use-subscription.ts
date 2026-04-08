"use client";

/**
 * useSubscription
 *
 * - Client-side hook to read the current company's subscription status.
 * - Reads from the public.users and public.companies tables under RLS.
 * - NEVER touches Stripe directly (Stripe logic lives only in Billing
 *   Edge Functions).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionStatus = "trial" | "active" | "canceled";

export type CompanySubscription = {
  id: string;
  name: string;
  service_type: string;
  phone: string;
  address: string | null;
  subscription_status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

const COMPANY_SELECT =
  "id, name, service_type, phone, address, subscription_status, trial_started_at, trial_ends_at";

type LoadResult =
  | { ok: true; company: CompanySubscription }
  | { ok: false; error: string };

async function loadCompanySubscription(): Promise<LoadResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated." };
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (userError || !userRow?.company_id) {
      return { ok: false, error: "Could not resolve company." };
    }

    const companyId = userRow.company_id as string;

    const { data: companyRow, error: companyError } = await supabase
      .from("companies")
      .select(COMPANY_SELECT)
      .eq("id", companyId)
      .single();

    if (companyError || !companyRow) {
      return { ok: false, error: "Could not load company subscription." };
    }

    return { ok: true, company: companyRow as CompanySubscription };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Unexpected error while loading subscription." };
  }
}

export function useSubscription() {
  const [company, setCompany] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      const result = await loadCompanySubscription();
      if (!isMounted) return;
      if (result.ok) {
        setCompany(result.company);
        setError(null);
      } else {
        setCompany(null);
        setError(result.error);
      }
      setLoading(false);
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshCompany(): Promise<void> {
    setLoading(true);
    setError(null);
    const result = await loadCompanySubscription();
    if (result.ok) {
      setCompany(result.company);
      setError(null);
    } else {
      setCompany(null);
      setError(result.error);
    }
    setLoading(false);
  }

  async function updateCompanyProfile(input: {
    name: string;
    service_type: string;
    phone: string;
    address: string | null;
  }): Promise<{ error: string | null }> {
    if (!company?.id) {
      return { error: "Company not loaded." };
    }
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: upErr } = await supabase
        .from("companies")
        .update({
          name: input.name.trim(),
          service_type: input.service_type.trim(),
          phone: input.phone.trim(),
          address: input.address?.trim() ? input.address.trim() : null,
        })
        .eq("id", company.id)
        .select(COMPANY_SELECT)
        .single();

      if (upErr || !data) {
        const message = upErr?.message ?? "Could not update company.";
        setError(message);
        return { error: message };
      }
      setCompany(data as CompanySubscription);
      return { error: null };
    } catch (err) {
      console.error(err);
      const message = "Unexpected error while updating company.";
      setError(message);
      return { error: message };
    }
  }

  return { company, loading, error, refreshCompany, updateCompanyProfile };
}
