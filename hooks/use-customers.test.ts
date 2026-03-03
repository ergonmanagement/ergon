import { renderHook, act } from "@testing-library/react";
import { useCustomers } from "@/hooks/use-customers";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useCustomers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads customers list on mount", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        items: [{ id: "1", type: "customer", name: "Alice", email: null, phone: null, address: null, notes: null, source: null }],
        total: 1,
      },
      error: null,
    });

    const { result } = renderHook(() => useCustomers());

    // Let the effect run
    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith("customers", expect.any(Object));
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error when list fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "CUSTOMERS_LIST_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useCustomers());

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });
});

