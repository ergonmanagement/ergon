import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/app/auth/login/_components/login-form";

const mockLogin = jest.fn();
jest.mock("@/hooks/use-login", () => ({
  useLogin: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it("renders heading and form fields", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/auth/forgot-password"
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/auth/sign-up"
    );
  });

  it("calls login with email and password on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    const form = screen.getByRole("button", { name: "Login" }).closest("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockLogin).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });
});
