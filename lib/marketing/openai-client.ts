export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompleteChatParams = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  /** Inject for tests (defaults to global fetch). */
  fetchImpl?: typeof fetch;
};

/**
 * Single OpenAI Chat Completions call (GenerateCopyNode — LLD §7).
 * No database access.
 */
export async function completeOpenAIChat(
  params: CompleteChatParams,
): Promise<string> {
  const { apiKey, model, messages, temperature = 0.7, fetchImpl = fetch } =
    params;

  const body = {
    model,
    messages,
    temperature,
  };

  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
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

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content =
    json.choices?.[0]?.message?.content ??
    "We could not generate content at this time.";
  return String(content);
}
