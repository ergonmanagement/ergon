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

const MARKETING_DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const MARKETING_SMS_MAX_LENGTH = 160;

function assemblePrompt(params: {
  channel: MarketingChannel;
  context: string | null;
  companyName: string | null;
  companyService: string | null;
}): string {
  const { channel, context, companyName, companyService } = params;

  const base = [
    "You write clear, specific, professional marketing copy for local service businesses.",
    "Avoid emojis, fluff, and hype language.",
    "Return copy only.",
  ].join(" ");

  const channelInstruction =
    channel === "social_post"
      ? "Write one concise social post suitable for Facebook or Instagram."
      : channel === "email"
        ? "Write one concise marketing email body."
        : channel === "sms"
          ? "Write one SMS message with max 160 characters."
          : "Write copy suitable for a simple flyer.";

  const companyLine = [
    companyName ? `Company: ${companyName}.` : "",
    companyService ? `Service type: ${companyService}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const contextLine = context
    ? `User context: ${context}`
    : "No additional user context.";

  return [base, companyLine, channelInstruction, contextLine].join("\n");
}

function postProcess(channel: MarketingChannel, text: string): string {
  let out = text.trim();
  if (channel === "sms" && out.length > MARKETING_SMS_MAX_LENGTH) {
    out = `${out.slice(0, MARKETING_SMS_MAX_LENGTH - 1).trimEnd()}…`;
  }
  return out;
}

export async function runMarketingGraph(
  params: MarketingGenerateParams,
): Promise<MarketingAsset> {
  const { supabase, companyId, channel, context } = params;

  const { data: companyRow } = await supabase
    .from("companies")
    .select("name, service_type")
    .eq("id", companyId)
    .single();

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model =
    Deno.env.get("MARKETING_OPENAI_MODEL") ?? MARKETING_DEFAULT_OPENAI_MODEL;

  const prompt = assemblePrompt({
    channel,
    context,
    companyName: companyRow?.name ?? null,
    companyService: companyRow?.service_type ?? null,
  });

  const openAiResp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a professional marketing copywriter for local service companies.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!openAiResp.ok) {
    const text = await openAiResp.text();
    throw new Error(`OpenAI error: ${text}`);
  }

  const json = await openAiResp.json();
  const raw = String(
    json?.choices?.[0]?.message?.content ??
      "We could not generate content at this time.",
  );
  const content = postProcess(channel, raw);

  const { data: asset, error: insertError } = await supabase
    .from("marketing_assets")
    .insert({
      company_id: companyId,
      channel,
      context,
      content,
      status: "draft",
    })
    .select()
    .single();

  if (insertError || !asset) {
    throw new Error(insertError?.message ?? "Failed to persist marketing asset");
  }

  return asset as MarketingAsset;
}

