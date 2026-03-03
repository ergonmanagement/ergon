import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "@/hooks/use-onboarding";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockInvoke = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
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
      });
    });

    expect(mockInvoke).toHaveBeenCalledWith("onboarding", {
      body: {
        company_name: "Test Co",
        service_type: "Auto detailing",
        phone: "123-456-7890",
      },
    });
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

