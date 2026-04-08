import { completeOpenAIChat } from "./openai-client";

describe("completeOpenAIChat", () => {
  it("returns message content on 200", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Generated copy" } }],
      }),
    });

    const out = await completeOpenAIChat({
      apiKey: "sk-test",
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "hi" },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(out).toBe("Generated copy");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("api.openai.com");
    expect(init?.method).toBe("POST");
    const parsed = JSON.parse((init?.body as string) ?? "{}");
    expect(parsed.model).toBe("gpt-4.1-mini");
    expect(parsed.messages).toHaveLength(2);
  });

  it("throws on non-ok response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => "rate limit",
    });

    await expect(
      completeOpenAIChat({
        apiKey: "sk-test",
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: "x" }],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/OpenAI error/);
  });

  it("uses fallback text when choices missing", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const out = await completeOpenAIChat({
      apiKey: "sk-test",
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: "x" }],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(out).toContain("could not generate");
  });
});
