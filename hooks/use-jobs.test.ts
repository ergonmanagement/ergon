import { renderHook, act } from "@testing-library/react";
import { useJobs } from "@/hooks/use-jobs";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useJobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads jobs list on mount", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        items: [
          {
            id: "1",
            customer_id: null,
            customer_name: "Alice",
            service_type: "Detail",
            status: "lead",
            scheduled_start: null,
            scheduled_end: null,
            address: null,
            price: null,
            notes: null,
            source: null,
          },
        ],
        total: 1,
      },
      error: null,
    });

    const { result } = renderHook(() => useJobs());

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith("jobs", expect.any(Object));
    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error when list fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "JOBS_LIST_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useJobs());

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });
});

