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

  it("refetches the list after upsert so loading does not stay true", async () => {
    const emptyList = { data: { items: [], total: 0 }, error: null };
    const saved = { data: { id: "c1" }, error: null };
    const withCustomer = {
      data: {
        items: [
          {
            id: "c1",
            type: "prospect" as const,
            name: "New Person",
            company_id: null,
            company_name: null,
            email: null,
            phone: null,
            address: null,
            notes: null,
            source: null,
          },
        ],
        total: 1,
      },
      error: null,
    };

    mockInvoke
      .mockResolvedValueOnce(emptyList)
      .mockResolvedValueOnce(saved)
      .mockResolvedValueOnce(withCustomer);

    const { result } = renderHook(() => useCustomers());

    await act(async () => {});

    expect(result.current.customers).toHaveLength(0);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.upsertCustomer({
        type: "prospect",
        name: "New Person",
        email: null,
        phone: null,
        address: null,
        notes: null,
        source: null,
        company_id: null,
        company_name: null,
      });
    });

    expect(mockInvoke).toHaveBeenCalledTimes(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe("New Person");
  });
});

