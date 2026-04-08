import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "@/hooks/use-onboarding";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { access_token: "t" } }, error: null }),
    },
    functions: {
      invoke: (name: string, options: unknown) => mockInvoke(name, options),
    },
  }),
}));

describe("useOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invokes onboarding Edge Function and navigates to dashboard on success", async () => {
    mockInvoke.mockResolvedValue({ data: { company: {}, user: {} }, error: null });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.completeOnboarding({
        companyName: "Test Co",
        serviceType: "Auto detailing",
        phone: "123-456-7890",
        address: null,
        employees_count: 7,
        years_in_business: null,
        estimated_revenue: 100000,
        referral_source: "Google search",
      });
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "onboarding",
      expect.objectContaining({
        body: {
          company_name: "Test Co",
          service_type: "Auto detailing",
          phone: "123-456-7890",
          address: null,
          employees_count: 7,
          years_in_business: null,
          estimated_revenue: 100000,
          referral_source: "Google search",
        },
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
  });

  it("sets error when Edge Function returns error", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Something went wrong", code: "ONBOARDING_FAILED" },
      error: null,
    });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.completeOnboarding({
        companyName: "Test Co",
        serviceType: "Auto detailing",
        phone: "123-456-7890",
      });
    });

    expect(result.current.error).toBe("Something went wrong");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
