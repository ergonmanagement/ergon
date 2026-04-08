/**
 * Marketing pipeline nodes (LLD §7). Single source for LangGraph + linear runner + tests.
 */

import { assembleMarketingPrompt } from "../assemble-prompt";
import { MARKETING_DEFAULT_OPENAI_MODEL } from "../constants";
import { completeOpenAIChat } from "../openai-client";
import { postProcessMarketingCopy } from "../post-process";
import { validateMarketingRequest } from "../validate-request";
import type { MarketingAsset } from "../types";
import type { MarketingPipelineState } from "./state";

export function getEnv(key: string): string | undefined {
  const DenoRef = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } })
    .Deno;
  if (DenoRef?.env?.get) {
    return DenoRef.env.get(key);
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export async function stepLoadCompanyContext(
  state: MarketingPipelineState,
): Promise<MarketingPipelineState> {
  const { supabase, companyId } = state.params;

  const { data, error } = await supabase
    .from("companies")
    .select("name, service_type")
    .eq("id", companyId)
    .single();

  if (error) {
    return {
      ...state,
      company: { name: null, service_type: null },
    };
  }

  return {
    ...state,
    company: {
      name: data?.name ?? null,
      service_type: data?.service_type ?? null,
    },
  };
}

export function stepValidateRequest(state: MarketingPipelineState): void {
  const { channel, context } = state.params;
  const err = validateMarketingRequest(channel, context);
  if (err) {
    throw new Error(err);
  }
}

export function stepAssemblePrompt(
  state: MarketingPipelineState,
): MarketingPipelineState {
  const { channel, context } = state.params;
  const prompt = assembleMarketingPrompt(
    channel,
    context,
    state.company,
  );
  return { ...state, prompt };
}

export async function stepGenerateCopy(
  state: MarketingPipelineState,
): Promise<MarketingPipelineState> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const model =
    getEnv("MARKETING_OPENAI_MODEL") ?? MARKETING_DEFAULT_OPENAI_MODEL;

  const rawContent = await completeOpenAIChat({
    apiKey,
    model,
    messages: [
      {
        role: "system",
        content:
          "You write professional, specific marketing copy for local service businesses. Avoid emojis.",
      },
      { role: "user", content: state.prompt },
    ],
    temperature: 0.7,
  });

  return { ...state, rawContent };
}

export function stepPostProcess(
  state: MarketingPipelineState,
): MarketingPipelineState {
  const channel = state.params.channel;
  const rawContent = postProcessMarketingCopy(channel, state.rawContent);
  return { ...state, rawContent };
}

export async function stepPersist(
  state: MarketingPipelineState,
): Promise<MarketingPipelineState> {
  const { supabase, channel, context, companyId } = state.params;

  const { data, error } = await supabase
    .from("marketing_assets")
    .insert({
      company_id: companyId,
      channel,
      context,
      content: state.rawContent,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...state,
    asset: data as MarketingAsset,
  };
}
