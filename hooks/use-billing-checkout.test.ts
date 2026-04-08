import { renderHook, act } from "@testing-library/react";
import { useBillingCheckout } from "@/hooks/use-billing-checkout";

const mockInvoke = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useBillingCheckout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invokes billing-create-checkout-session", async () => {
    mockInvoke.mockResolvedValue({
      data: { url: "https://checkout" },
      error: null,
    });

    const { result } = renderHook(() => useBillingCheckout());

  // Avoid actually redirecting in tests
  const originalLocation = window.location;
  delete (window as any).location;
  (window as any).location = { href: "" };

    await act(async () => {
      await result.current.startCheckout();
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "billing-create-checkout-session",
      expect.any(Object),
    );

  // Restore location
  (window as any).location = originalLocation;
  });
});

