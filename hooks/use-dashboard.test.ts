import { renderHook, act } from "@testing-library/react";
import { useDashboard } from "@/hooks/use-dashboard";

const mockInvoke = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads dashboard data", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        today_schedule: { events: [], jobs: [] },
        upcoming_jobs: [],
        new_prospects: [],
        finance_summary: { revenue: 0, expenses: 0, net: 0 },
        marketing_reminders: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useDashboard());

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith("dashboard", expect.any(Object));
    expect(result.current.data?.finance_summary.net).toBe(0);
    expect(result.current.error).toBeNull();
  });
});

