import { renderHook, act } from "@testing-library/react";
import { useSignUp } from "@/hooks/use-sign-up";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: (params: unknown) => mockSignUp(params),
    },
  }),
}));

describe("useSignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets error when passwords do not match", async () => {
    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "user@example.com",
        password: "password123",
        repeatPassword: "different",
        firstName: "John",
        lastName: "Doe",
      });
    });

    expect(result.current.error).toBe("Passwords do not match");
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp and router.push on success", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "user@example.com",
        password: "password123",
        repeatPassword: "password123",
        firstName: "John",
        lastName: "Doe",
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        password: "password123",
        options: expect.objectContaining({
          data: { first_name: "John", last_name: "Doe" },
        }),
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/auth/onboarding");
  });
});
