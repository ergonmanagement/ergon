/**
 * Full pipeline integration test (mocked Supabase + OpenAI — no tokens).
 */

import { runMarketingPipeline } from "./run";
import type { MarketingGenerateParams } from "../types";

describe("runMarketingPipeline", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "sk-test-key" };
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  function mockSupabase() {
    const companyRow = { name: "Test Co", service_type: "Windows" };
    const insertedAsset = {
      id: "asset-1",
      company_id: "c1",
      channel: "social_post",
      content: "AI generated body",
      context: null,
      status: "draft",
      created_at: "2026-01-01T00:00:00.000Z",
    };

    const from = jest.fn((table: string) => {
      if (table === "companies") {
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({ data: companyRow, error: null }),
            }),
          }),
        };
      }
      if (table === "marketing_assets") {
        return {
          insert: () => ({
            select: () => ({
              single: jest
                .fn()
                .mockResolvedValue({ data: insertedAsset, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    return { from };
  }

  it("runs all steps with one OpenAI call and persists the asset", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  AI generated body  " } }],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const supabase = mockSupabase();
    const params: MarketingGenerateParams = {
      supabase,
      userId: "u1",
      companyId: "c1",
      channel: "social_post",
      context: "Summer sale",
    };

    const asset = await runMarketingPipeline(params);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(String(init?.body)).toContain("gpt-4.1-mini");
    expect(String(init?.body)).toContain("Summer sale");

    expect(asset.id).toBe("asset-1");
    expect(asset.content).toBe("AI generated body");
    expect(supabase.from).toHaveBeenCalledWith("companies");
    expect(supabase.from).toHaveBeenCalledWith("marketing_assets");
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    global.fetch = jest.fn();

    const supabase = mockSupabase();
    await expect(
      runMarketingPipeline({
        supabase,
        userId: "u1",
        companyId: "c1",
        channel: "email",
        context: null,
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });
});
