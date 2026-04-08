"use client";

import { useState } from "react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { useMarketing } from "@/hooks/use-marketing";
import type { MarketingChannel } from "@/lib/marketing/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RefreshCw } from "lucide-react";

const CHANNEL_OPTIONS: { value: MarketingChannel; label: string }[] = [
  { value: "social_post", label: "Social Post" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "flyer", label: "Flyer" },
];

const HISTORY_CHANNEL_OPTIONS: { value: "all" | MarketingChannel; label: string }[] =
  [{ value: "all", label: "All types" }, ...CHANNEL_OPTIONS];

export function MarketingClient() {
  const [channel, setChannel] = useState<MarketingChannel>("social_post");
  const [context, setContext] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    assets,
    total,
    loading,
    generating,
    error,
    filter,
    setFilter,
    generateAsset,
  } = useMarketing();

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateAsset({ channel, context });
  }

  async function handleRegenerate() {
    await generateAsset({ channel, context });
  }

  async function copyContent(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  const latest = assets[0];

  function setHistoryChannel(value: string) {
    const next =
      value === "all"
        ? { ...filter, channel: undefined, page: 1 }
        : {
            ...filter,
            channel: value as MarketingChannel,
            page: 1,
          };
    setFilter(next);
  }

  const historyChannelValue =
    filter.channel === undefined ? "all" : filter.channel;

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Marketing"
        description={
          <span className="block max-w-2xl">
            Generate draft marketing content. AI is used only in this module.
          </span>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 ergon-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Generate content</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannel(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    channel === opt.value
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="marketing-context"
                className="text-sm font-medium text-foreground"
              >
                Optional context
              </label>
              <textarea
                id="marketing-context"
                className="w-full rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground p-3 min-h-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe the offer, target customer, season, or any details you want reflected in the copy."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {context.length}/2000 characters
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={generating} size="default">
                {generating ? "Generating…" : "Generate marketing content"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={generating}
                onClick={handleRegenerate}
                className="gap-2"
              >
                <RefreshCw size={16} aria-hidden />
                Regenerate
              </Button>
            </div>
          </form>
        </div>
        <div className="ergon-card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Latest result</h2>
          {loading && (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          )}
          {!loading && !latest && (
            <p className="text-sm text-muted-foreground">
              No marketing content generated yet.
            </p>
          )}
          {!loading && latest && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {latest.channel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(latest.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => void copyContent(latest.content, latest.id)}
                >
                  <Copy size={14} aria-hidden />
                  {copiedId === latest.id ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {latest.content}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">History</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground sr-only" htmlFor="history-channel">
              Filter by type
            </label>
            <Select
              value={historyChannelValue}
              onValueChange={setHistoryChannel}
            >
              <SelectTrigger id="history-channel" className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {HISTORY_CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground tabular-nums">
              {total} {total === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading history…</p>
        )}

        {!loading && assets.length === 0 && (
          <p className="text-sm text-muted-foreground">
            When you generate content, it will appear here for reuse later.
          </p>
        )}

        {!loading && assets.length > 0 && (
          <>
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              {assets.map((asset) => (
                <article
                  key={asset.id}
                  className="ergon-card p-4 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {asset.channel}
                      </span>
                      <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {new Date(asset.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1 h-8"
                      onClick={() => void copyContent(asset.content, asset.id)}
                    >
                      <Copy size={14} aria-hidden />
                      {copiedId === asset.id ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  {asset.context && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      Context: {asset.context}
                    </p>
                  )}
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-[12]">
                    {asset.content}
                  </p>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() =>
                      setFilter({ ...filter, page: page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setFilter({ ...filter, page: page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
