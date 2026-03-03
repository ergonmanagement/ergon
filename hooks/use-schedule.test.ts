import { renderHook, act } from "@testing-library/react";
import { useSchedule } from "@/hooks/use-schedule";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const initialFilter = {
    from: "2025-01-01T00:00:00.000Z",
    to: "2025-01-07T23:59:59.999Z",
  };

  it("loads events on mount", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        items: [
          {
            id: "1",
            type: "event",
            title: "Job for Alice",
            start_at: "2025-01-02T10:00:00.000Z",
            end_at: "2025-01-02T12:00:00.000Z",
            location: null,
            notes: null,
          },
        ],
        total: 1,
      },
      error: null,
    });

    const { result } = renderHook(() => useSchedule(initialFilter));

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith("schedule", expect.any(Object));
    expect(result.current.events).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error when list fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "SCHEDULE_LIST_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useSchedule(initialFilter));

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });
});

