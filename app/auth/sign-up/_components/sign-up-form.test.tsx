import { render, screen, fireEvent } from "@testing-library/react";
import { SignUpForm } from "@/app/auth/sign-up/_components/sign-up-form";

const mockSignUp = jest.fn();
jest.mock("@/hooks/use-sign-up", () => ({
  useSignUp: () => ({
    signUp: mockSignUp,
    isLoading: false,
    error: null,
  }),
}));

describe("SignUpForm", () => {
  beforeEach(() => {
    mockSignUp.mockClear();
  });

  it("renders heading and all form fields", () => {
    render(<SignUpForm />);
    expect(
      screen.getByRole("heading", { name: "Create your account" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Repeat Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/auth/login"
    );
  });

  it("calls signUp with form values on submit", async () => {
    mockSignUp.mockResolvedValue(undefined);
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Repeat Password"), {
      target: { value: "password123" },
    });
    const form = screen.getByRole("button", { name: "Sign up" }).closest("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockSignUp).toHaveBeenCalledWith({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
      repeatPassword: "password123",
    });
  });
});
