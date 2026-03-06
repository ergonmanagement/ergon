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

  it("loads marketing assets", async () => {
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

    expect(mockInvoke).toHaveBeenCalledWith("marketing", expect.any(Object));
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
});

