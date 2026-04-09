// @ts-nocheck
/**
 * Marketing LangGraph orchestration (LLD §7), self-contained for Supabase Edge.
 */

import {
  Annotation,
  END,
  START,
  StateGraph,
} from "https://esm.sh/@langchain/langgraph@1.2.8";

export type MarketingChannel = "social_post" | "email" | "sms" | "flyer";

export type MarketingGenerateParams = {
  supabase: any;
  userId: string;
  companyId: string;
  channel: MarketingChannel;
  context: string | null;
};

export type MarketingAsset = {
  id: string;
  company_id: string;
  channel: MarketingChannel;
  content: string;
  context: string | null;
  status: string;
  created_at: string;
};

type CompanyMarketingContext = {
  name: string | null;
  service_type: string | null;
};

type MarketingPipelineState = {
  params: MarketingGenerateParams;
  company: CompanyMarketingContext;
  prompt: string;
  rawContent: string;
  asset: MarketingAsset | null;
};

const MARKETING_MAX_CONTEXT_LENGTH = 2000;
const MARKETING_SMS_MAX_LENGTH = 160;
const MARKETING_DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

declare const Deno:
  | { env: { get(key: string): string | undefined } }
  | undefined;

function getEnv(key: string): string | undefined {
  if (typeof Deno !== "undefined" && Deno?.env?.get) {
    return Deno.env.get(key);
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

function initialPipelineState(
  params: MarketingGenerateParams,
): MarketingPipelineState {
  return {
    params,
    company: { name: null, service_type: null },
    prompt: "",
    rawContent: "",
    asset: null,
  };
}

function validateMarketingRequest(
  channel: string,
  context: string | null | undefined,
): string | null {
  if (
    channel !== "social_post" &&
    channel !== "email" &&
    channel !== "sms" &&
    channel !== "flyer"
  ) {
    return "Unsupported channel";
  }
  if (context != null && context.length > MARKETING_MAX_CONTEXT_LENGTH) {
    return "Context too long";
  }
  return null;
}

function assembleMarketingPrompt(
  channel: MarketingChannel,
  context: string | null,
  company: CompanyMarketingContext,
): string {
  const baseDescription = [
    "You are an assistant that writes clear, professional marketing copy.",
    "The business is a local service business.",
    "Avoid emojis and slang.",
  ].join(" ");

  const companyDescriptionParts: string[] = [];
  if (company.name) companyDescriptionParts.push(`Company name: ${company.name}.`);
  if (company.service_type) {
    companyDescriptionParts.push(`Service type: ${company.service_type}.`);
  }

  const channelInstruction =
    channel === "social_post"
      ? "Write a short social media post suitable for Facebook or Instagram."
      : channel === "email"
        ? "Write a concise marketing email."
        : channel === "sms"
          ? "Write a very short SMS message (max 160 characters)."
          : "Write copy suitable for a printable flyer.";

  const contextInstruction = context
    ? `User-provided context:\n${context}\n`
    : "No additional user context was provided. Focus on general value, clarity, and professionalism.\n";

  return [
    baseDescription,
    companyDescriptionParts.join(" "),
    "",
    channelInstruction,
    contextInstruction,
    "Return ONLY the marketing copy. Do not add explanations or headings.",
  ].join("\n");
}

function postProcessMarketingCopy(channel: MarketingChannel, raw: string): string {
  let out = raw.trim();
  if (channel === "sms" && out.length > MARKETING_SMS_MAX_LENGTH) {
    out = `${out.slice(0, MARKETING_SMS_MAX_LENGTH - 1).trimEnd()}…`;
  }
  return out;
}

async function completeOpenAIChat(params: {
  apiKey: string;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
}): Promise<string> {
  const { apiKey, model, messages, temperature = 0.7 } = params;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${text}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content =
    json.choices?.[0]?.message?.content ??
    "We could not generate content at this time.";
  return String(content);
}

const MarketingState = Annotation.Root({
  pipeline: Annotation<MarketingPipelineState>({
    reducer: (_previous, next) => next,
  }),
});

async function nodeLoadCompanyContext(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
  const { supabase, companyId } = state.pipeline.params;
  const { data, error } = await supabase
    .from("companies")
    .select("name, service_type")
    .eq("id", companyId)
    .single();

  const pipeline: MarketingPipelineState = {
    ...state.pipeline,
    company: error
      ? { name: null, service_type: null }
      : {
          name: data?.name ?? null,
          service_type: data?.service_type ?? null,
        },
  };
  return { pipeline };
}

function nodeValidateRequest(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  const { channel, context } = state.pipeline.params;
  const err = validateMarketingRequest(channel, context);
  if (err) throw new Error(err);
  return {};
}

function nodeAssemblePrompt(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  const { channel, context } = state.pipeline.params;
  const prompt = assembleMarketingPrompt(channel, context, state.pipeline.company);
  const pipeline = { ...state.pipeline, prompt };
  return { pipeline };
}

async function nodeGenerateCopy(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
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
      { role: "user", content: state.pipeline.prompt },
    ],
    temperature: 0.7,
  });
  const pipeline = { ...state.pipeline, rawContent };
  return { pipeline };
}

function nodePostProcess(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  const rawContent = postProcessMarketingCopy(
    state.pipeline.params.channel,
    state.pipeline.rawContent,
  );
  const pipeline = { ...state.pipeline, rawContent };
  return { pipeline };
}

async function nodePersist(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
  const { supabase, channel, context, companyId } = state.pipeline.params;
  const { data, error } = await supabase
    .from("marketing_assets")
    .insert({
      company_id: companyId,
      channel,
      context,
      content: state.pipeline.rawContent,
      status: "draft",
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message);
  }
  const pipeline = {
    ...state.pipeline,
    asset: data as MarketingAsset,
  };
  return { pipeline };
}

function buildMarketingGraph() {
  const graph = new StateGraph(MarketingState)
    .addNode("loadCompanyContext", nodeLoadCompanyContext)
    .addNode("validateRequest", nodeValidateRequest)
    .addNode("assemblePrompt", nodeAssemblePrompt)
    .addNode("generateCopy", nodeGenerateCopy)
    .addNode("postProcess", nodePostProcess)
    .addNode("persist", nodePersist)
    .addEdge(START, "loadCompanyContext")
    .addEdge("loadCompanyContext", "validateRequest")
    .addEdge("validateRequest", "assemblePrompt")
    .addEdge("assemblePrompt", "generateCopy")
    .addEdge("generateCopy", "postProcess")
    .addEdge("postProcess", "persist")
    .addEdge("persist", END);

  return graph.compile();
}

const compiledGraph = buildMarketingGraph();

/**
 * Public entry for the Edge Function: runs the LangGraph pipeline.
 */
export async function runMarketingGraph(
  params: MarketingGenerateParams,
): Promise<MarketingAsset> {
  const initial = initialPipelineState(params);

  const result = await compiledGraph.invoke({
    pipeline: initial,
  });

  const asset = result.pipeline.asset;
  if (!asset) {
    throw new Error("Failed to persist marketing asset");
  }

  return asset;
}
