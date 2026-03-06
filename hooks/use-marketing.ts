"use client";

/**
 * useMarketing
 *
 * - Client-side hook to interact with the Marketing Edge Function.
 * - Responsibilities:
 *   - List existing marketing assets for the current company.
 *   - Trigger generation of new marketing copy for a given channel/context.
 * - All AI and DB access happens in the Edge Function; this hook only
 *   invokes the function via Supabase.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MarketingChannel } from "@/lib/marketing/langgraph/graph";

export type MarketingAsset = {
  id: string;
  company_id: string;
  channel: MarketingChannel;
  content: string;
  context: string | null;
  status: string;
  created_at: string;
};

export type MarketingFilter = {
  channel?: MarketingChannel;
  page?: number;
  pageSize?: number;
};

export function useMarketing(initialFilter?: MarketingFilter) {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MarketingFilter>(initialFilter ?? {});

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const params = new URLSearchParams();
        if (filter.channel) params.set("channel", filter.channel);
        if (filter.page) params.set("page", String(filter.page));
        if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

        const { data, error } = await supabase.functions.invoke("marketing", {
          method: "GET",
          headers: params.size
            ? { "X-Ergon-Query": params.toString() }
            : ({} as Record<string, string>),
        });

        if (!isMounted) return;

        if (error || (data && (data as any).error)) {
          const message =
            (data as any)?.error ??
            error?.message ??
            "Failed to load marketing assets.";
          setError(message);
          setLoading(false);
          return;
        }

        setAssets(((data as any)?.items ?? []) as MarketingAsset[]);
        setTotal((data as any)?.total ?? 0);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Unexpected error while loading marketing assets.");
        setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [filter.channel, filter.page, filter.pageSize]);

  async function generateAsset(params: {
    channel: MarketingChannel;
    context: string;
  }): Promise<void> {
    setGenerating(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("marketing", {
        method: "POST",
        body: {
          channel: params.channel,
          context: params.context,
        },
      });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          error?.message ??
          "Failed to generate marketing content.";
        setError(message);
        setGenerating(false);
        return;
      }

      // Prepend the newly created asset to the list for a snappy UX.
      const asset = (data as any).asset as MarketingAsset | undefined;
      if (asset) {
        setAssets((prev) => [asset, ...prev]);
        setTotal((prev) => prev + 1);
      }

      setGenerating(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while generating marketing content.");
      setGenerating(false);
    }
  }

  return {
    assets,
    total,
    loading,
    generating,
    error,
    filter,
    setFilter,
    generateAsset,
  };
}

