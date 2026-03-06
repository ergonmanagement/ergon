import { renderHook, act } from "@testing-library/react";
import { useFinanceEntries } from "@/hooks/use-finance-entries";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useFinanceEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const initialFilter = {
    from: "2025-01-01",
    to: "2025-01-31",
  };

  it("loads finance entries and totals", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        items: [
          {
            id: "1",
            type: "revenue",
            job_id: null,
            title: "Job payment",
            category: "Jobs",
            amount: 200,
            entry_date: "2025-01-10",
            notes: null,
          },
          {
            id: "2",
            type: "expense",
            job_id: null,
            title: "Supplies",
            category: "Materials",
            amount: 50,
            entry_date: "2025-01-11",
            notes: null,
          },
        ],
        totals: {
          revenue: 200,
          expenses: 50,
          net: 150,
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useFinanceEntries(initialFilter));

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith("finance", expect.any(Object));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.totals).toEqual({
      revenue: 200,
      expenses: 50,
      net: 150,
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error when list fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "FINANCE_LIST_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useFinanceEntries(initialFilter));

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });
});

