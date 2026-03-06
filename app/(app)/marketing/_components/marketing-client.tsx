"use client";

import { useState } from "react";
import { useMarketing } from "@/hooks/use-marketing";
import type { MarketingChannel } from "@/lib/marketing/langgraph/graph";

const CHANNEL_OPTIONS: { value: MarketingChannel; label: string }[] = [
  { value: "social_post", label: "Social Post" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "flyer", label: "Flyer" },
];

export function MarketingClient() {
  const [channel, setChannel] = useState<MarketingChannel>("social_post");
  const [context, setContext] = useState("");
  const { assets, loading, generating, error, generateAsset } = useMarketing();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateAsset({ channel, context });
  }

  const latest = assets[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-white/70">
            Generate draft marketing content. AI is used only here.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-white/10 rounded-lg p-3 bg-white/5 space-y-3">
          <h2 className="text-sm font-semibold">Generate content</h2>
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannel(opt.value)}
                  className={`px-3 py-1 rounded-md text-xs border border-white/20 ${
                    channel === opt.value
                      ? "bg-white/20 text-white"
                      : "text-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="marketing-context"
                className="text-xs text-white/80"
              >
                Optional context
              </label>
              <textarea
                id="marketing-context"
                className="w-full rounded-md border border-white/20 bg-transparent text-sm p-2 min-h-24"
                placeholder="Describe the offer, target customer, season, or any details you want reflected in the copy."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-xs disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate content"}
            </button>
          </form>
        </div>
        <div className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-2">
          <h2 className="text-sm font-semibold">Latest result</h2>
          {loading && (
            <p className="text-sm text-white/70">Loading history...</p>
          )}
          {!loading && !latest && (
            <p className="text-sm text-white/70">
              No marketing content generated yet.
            </p>
          )}
          {!loading && latest && (
            <div className="space-y-1">
              <p className="text-xs text-white/60 uppercase">
                {latest.channel}
              </p>
              <p className="text-xs text-white/60">
                {new Date(latest.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap">
                {latest.content}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">History</h2>
        {loading && (
          <p className="text-sm text-white/70">Loading history...</p>
        )}
        {!loading && assets.length === 0 && (
          <p className="text-sm text-white/70">
            When you generate content, it will appear here for reuse later.
          </p>
        )}
        {!loading && assets.length > 0 && (
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="border border-white/10 rounded-lg p-3 bg-white/5 space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-white/60">
                    {asset.channel}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
                {asset.context && (
                  <p className="text-[11px] text-white/60">
                    Context: {asset.context}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">
                  {asset.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

