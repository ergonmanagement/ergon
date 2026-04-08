"use client";

/**
 * useMarketing
 *
 * - Client-side hook to interact with the Marketing Edge Function.
 * - All AI and DB access happens in the Edge Function; this hook only
 *   invokes the function via Supabase.
 */

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MarketingChannel } from "@/lib/marketing/types";

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

const DEFAULT_PAGE_SIZE = 10;

export function useMarketing(initialFilter?: MarketingFilter) {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MarketingFilter>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ...initialFilter,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const hasInitialFilter = initialFilter !== undefined;
  const incomingChannel = initialFilter?.channel;
  const incomingPage = initialFilter?.page;
  const incomingPageSize = initialFilter?.pageSize;

  useEffect(() => {
    if (!hasInitialFilter) return;
    setFilter((prev) => {
      const next = {
        ...prev,
        channel: incomingChannel,
        page: incomingPage ?? prev.page,
        pageSize: incomingPageSize ?? prev.pageSize,
      };
      if (
        prev.channel === next.channel &&
        prev.page === next.page &&
        prev.pageSize === next.pageSize
      ) {
        return prev;
      }
      return next;
    });
  }, [
    hasInitialFilter,
    incomingChannel,
    incomingPage,
    incomingPageSize,
  ]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const params = new URLSearchParams();
      if (filter.channel) params.set("channel", filter.channel);
      const page = filter.page ?? 1;
      const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const { data, error: fnError } = await supabase.functions.invoke(
        "marketing",
        {
          method: "GET",
          headers: params.size
            ? { "X-Ergon-Query": params.toString() }
            : ({} as Record<string, string>),
        },
      );

      if (fnError || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          fnError?.message ??
          "Failed to load marketing assets.";
        setError(message);
        setLoading(false);
        return;
      }

      setAssets(((data as any)?.items ?? []) as MarketingAsset[]);
      setTotal((data as any)?.total ?? 0);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while loading marketing assets.");
      setLoading(false);
    }
  }, [
    filter.channel,
    filter.page,
    filter.pageSize,
    reloadToken,
  ]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  async function generateAsset(params: {
    channel: MarketingChannel;
    context: string;
  }): Promise<void> {
    setGenerating(true);
    setError(null);

    try {
      const supabase = createClient();
      const context =
        params.context.trim().length > 0 ? params.context.trim() : null;

      const { data, error: fnError } = await supabase.functions.invoke(
        "marketing",
        {
          method: "POST",
          body: {
            channel: params.channel,
            context,
          },
        },
      );

      if (fnError || (data && (data as any).error)) {
        const message =
          (data as any)?.error ??
          fnError?.message ??
          "Failed to generate marketing content.";
        setError(message);
        setGenerating(false);
        return;
      }

      setGenerating(false);
      setFilter((f) => ({ ...f, page: 1 }));
      setReloadToken((t) => t + 1);
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
    refetch: () => setReloadToken((t) => t + 1),
  };
}
