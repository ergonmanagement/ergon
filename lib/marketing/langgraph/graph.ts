/**
 * Marketing LangGraph-style orchestration.
 *
 * IMPORTANT:
 * - This module ONLY runs on the server (Edge Function).
 * - AI is ONLY used in the Marketing module.
 * - GenerateCopyNode is the ONLY place that calls OpenAI.
 * - AI never touches the database directly; DB access happens in
 *   LoadCompanyContextNode and PersistMarketingAssetNode using Supabase.
 *
 * The graph is a simple, linear pipeline that mirrors the nodes
 * defined in docs/lowLevelDesign.md:
 *
 * 1. LoadCompanyContextNode
 * 2. ValidateRequestNode
 * 3. AssemblePromptInputsNode
 * 4. GenerateCopyNode (OpenAI)
 * 5. PostProcessNode
 * 6. PersistMarketingAssetNode
 *
 * This file is imported by the `marketing` Edge Function.
 */

export type MarketingChannel = "social_post" | "email" | "sms" | "flyer";

export type MarketingGenerateParams = {
  supabase: any; // Supabase client from Edge Function (server-side only).
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

type CompanyContext = {
  name: string | null;
  service_type: string | null;
};

type PipelineState = {
  params: MarketingGenerateParams;
  company: CompanyContext;
  prompt: string;
  rawContent: string;
  asset: MarketingAsset | null;
};

/**
 * LoadCompanyContextNode
 *
 * - Reads company information from the database.
 * - Uses Supabase client passed from Edge Function.
 * - NO AI calls here.
 */
async function loadCompanyContext(state: PipelineState): Promise<PipelineState> {
  const { supabase, companyId } = state.params;

  const { data, error } = await supabase
    .from("companies")
    .select("name, service_type")
    .eq("id", companyId)
    .single();

  // In v1, we degrade gracefully: if context fails to load, we still
  // allow marketing copy generation using a generic company context.
  if (error) {
    return {
      ...state,
      company: {
        name: null,
        service_type: null,
      },
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

/**
 * ValidateRequestNode
 *
 * - Ensures the request complies with product constraints.
 * - Performs non-AI validation only (channel, context length).
 */
function validateRequest(state: PipelineState): PipelineState {
  const { channel, context } = state.params;

  if (
    channel !== "social_post" &&
    channel !== "email" &&
    channel !== "sms" &&
    channel !== "flyer"
  ) {
    throw new Error("Unsupported channel");
  }

  if (context && context.length > 2000) {
    throw new Error("Context too long");
  }

  return state;
}

/**
 * AssemblePromptInputsNode
 *
 * - Builds the prompt string sent to OpenAI.
 * - Combines company context + requested channel + user context.
 */
function assemblePromptInputs(state: PipelineState): PipelineState {
  const { channel, context } = state.params;
  const { name, service_type } = state.company;

  const baseDescription = [
    "You are an assistant that writes clear, professional marketing copy.",
    "The business is a local service business.",
    "Avoid emojis and slang.",
  ].join(" ");

  const companyDescriptionParts: string[] = [];
  if (name) companyDescriptionParts.push(`Company name: ${name}.`);
  if (service_type)
    companyDescriptionParts.push(`Service type: ${service_type}.`);

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

  const prompt = [
    baseDescription,
    companyDescriptionParts.join(" "),
    "",
    channelInstruction,
    contextInstruction,
    "Return ONLY the marketing copy. Do not add explanations or headings.",
  ].join("\n");

  return {
    ...state,
    prompt,
  };
}

/**
 * GenerateCopyNode
 *
 * - The ONLY place that calls OpenAI.
 * - Uses OPENAI_API_KEY from environment (server-only).
 * - Does not access the database.
 */
async function generateCopy(state: PipelineState): Promise<PipelineState> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const body = {
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You write professional, specific marketing copy for local service businesses. Avoid emojis.",
      },
      {
        role: "user",
        content: state.prompt,
      },
    ],
    temperature: 0.7,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${text}`);
  }

  const json = await response.json();
  const content =
    json.choices?.[0]?.message?.content ??
    "We could not generate content at this time.";

  return {
    ...state,
    rawContent: String(content),
  };
}

/**
 * PostProcessNode
 *
 * - Applies minimal normalization to the generated content.
 * - Ensures we strip leading/trailing whitespace.
 */
function postProcess(state: PipelineState): PipelineState {
  const trimmed = state.rawContent.trim();
  return {
    ...state,
    rawContent: trimmed,
  };
}

/**
 * PersistMarketingAssetNode
 *
 * - Writes the generated content into marketing_assets.
 * - Uses Supabase client provided by the Edge Function.
 */
async function persistMarketingAsset(
  state: PipelineState,
): Promise<PipelineState> {
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

/**
 * runMarketingGraph
 *
 * - Public entrypoint for the Marketing Edge Function.
 * - Executes the linear node pipeline end-to-end.
 */
export async function runMarketingGraph(
  params: MarketingGenerateParams,
): Promise<MarketingAsset> {
  let state: PipelineState = {
    params,
    company: { name: null, service_type: null },
    prompt: "",
    rawContent: "",
    asset: null,
  };

  state = await loadCompanyContext(state);
  state = validateRequest(state);
  state = assemblePromptInputs(state);
  state = await generateCopy(state);
  state = postProcess(state);
  state = await persistMarketingAsset(state);

  if (!state.asset) {
    throw new Error("Failed to persist marketing asset");
  }

  return state.asset;
}

