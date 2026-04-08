import { render, screen, fireEvent } from "@testing-library/react";
import { UpdatePasswordForm } from "@/app/auth/update-password/_components/update-password-form";

const mockUpdatePassword = jest.fn();
jest.mock("@/hooks/use-update-password", () => ({
  useUpdatePassword: () => ({
    updatePassword: mockUpdatePassword,
    isLoading: false,
    error: null,
  }),
}));

describe("UpdatePasswordForm", () => {
  beforeEach(() => {
    mockUpdatePassword.mockClear();
  });

  it("renders heading and password field", () => {
    render(<UpdatePasswordForm />);
    expect(
      screen.getByRole("heading", { name: "Set a new password" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter your new password below.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save new password" })
    ).toBeInTheDocument();
  });

  it("calls updatePassword with password on submit", async () => {
    mockUpdatePassword.mockResolvedValue(undefined);
    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "newpassword123" },
    });
    const form = screen
      .getByRole("button", { name: "Save new password" })
      .closest("form");
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockUpdatePassword).toHaveBeenCalledWith("newpassword123");
  });
});
