import { renderHook, act } from "@testing-library/react";
import { useMarketing } from "@/hooks/use-marketing";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useMarketing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads marketing assets with pagination query", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        items: [
          {
            id: "1",
            company_id: "c1",
            channel: "social_post",
            content: "Test content",
            context: null,
            status: "draft",
            created_at: "2025-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
      },
      error: null,
    });

    const { result } = renderHook(() => useMarketing());

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith(
      "marketing",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Ergon-Query": expect.stringMatching(/page=1/),
        }),
      }),
    );
    expect(mockInvoke.mock.calls[0][1].headers["X-Ergon-Query"]).toMatch(
      /pageSize=10/,
    );
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error when list fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "MARKETING_LIST_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useMarketing());

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });

  it("generates asset and refetches list", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { items: [], total: 0 },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          asset: {
            id: "new-1",
            company_id: "c1",
            channel: "email",
            content: "Hello",
            context: null,
            status: "draft",
            created_at: "2026-01-02T00:00:00.000Z",
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: "new-1",
              company_id: "c1",
              channel: "email",
              content: "Hello",
              context: null,
              status: "draft",
              created_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          total: 1,
        },
        error: null,
      });

    const { result } = renderHook(() => useMarketing());

    await act(async () => {});

    await act(async () => {
      await result.current.generateAsset({
        channel: "email",
        context: "",
      });
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "marketing",
      expect.objectContaining({
        method: "POST",
        body: { channel: "email", context: null },
      }),
    );
    const getCalls = mockInvoke.mock.calls.filter((c) => c[1]?.method === "GET");
    expect(getCalls.length).toBeGreaterThanOrEqual(2);
    expect(result.current.assets[0]?.id).toBe("new-1");
    expect(result.current.filter.page).toBe(1);
  });

  it("sets error on generate failure", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { items: [], total: 0 },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { error: "bad", code: "MARKETING_GENERATE_FAILED" },
        error: null,
      });

    const { result } = renderHook(() => useMarketing());

    await act(async () => {});

    await act(async () => {
      await result.current.generateAsset({
        channel: "sms",
        context: "x",
      });
    });

    expect(result.current.error).toBe("bad");
  });
});
