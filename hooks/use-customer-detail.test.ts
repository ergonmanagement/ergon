import { renderHook, act } from "@testing-library/react";
import { useCustomerDetail } from "@/hooks/use-customer-detail";

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useCustomerDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads customer profile", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        customer: {
          id: "c1",
          type: "customer",
          name: "Alice",
          email: "alice@example.com",
          phone: null,
          address: null,
          notes: null,
          source: null,
        },
        jobs: [],
        revenue_total: 0,
      },
      error: null,
    });

    const { result } = renderHook(() => useCustomerDetail("c1"));

    await act(async () => {});

    expect(mockInvoke).toHaveBeenCalledWith(
      "customer-profile",
      expect.any(Object),
    );
    expect(result.current.data?.customer.name).toBe("Alice");
    expect(result.current.error).toBeNull();
  });

  it("sets error when profile fails", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Failed", code: "CUSTOMER_PROFILE_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useCustomerDetail("c1"));

    await act(async () => {});

    expect(result.current.error).toBe("Failed");
  });
});

