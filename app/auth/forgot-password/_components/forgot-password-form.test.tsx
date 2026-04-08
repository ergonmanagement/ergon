import { render, screen, fireEvent } from "@testing-library/react";
import { ForgotPasswordForm } from "@/app/auth/forgot-password/_components/forgot-password-form";

const mockSendResetEmail = jest.fn();
const mockUseForgotPassword = jest.fn();
jest.mock("@/hooks/use-forgot-password", () => ({
  useForgotPassword: () => mockUseForgotPassword(),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockSendResetEmail.mockClear();
    mockUseForgotPassword.mockReturnValue({
      sendResetEmail: mockSendResetEmail,
      isLoading: false,
      error: null,
      success: false,
    });
  });

  it("renders form when success is false", () => {
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("heading", { name: "Reset your password" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset email" })
    ).toBeInTheDocument();
  });

  it("shows success message when success is true", () => {
    mockUseForgotPassword.mockReturnValueOnce({
      sendResetEmail: mockSendResetEmail,
      isLoading: false,
      error: null,
      success: true,
    });
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("heading", { name: "Check your email" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/If you registered using your email and password/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("calls sendResetEmail with email on submit", async () => {
    mockSendResetEmail.mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    const form = screen
      .getByRole("button", { name: "Send reset email" })
      .closest("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockSendResetEmail).toHaveBeenCalledWith("user@example.com");
  });
});
