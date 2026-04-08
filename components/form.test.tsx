import { render, screen, fireEvent } from "@testing-library/react";
import {
  FormField,
  FormError,
  FormSubmitButton,
  FormDisplayField,
} from "@/components/form";

describe("FormField", () => {
  it("renders label and input with correct id", () => {
    render(
      <FormField
        label="Email"
        id="email"
        type="email"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "id",
      "email"
    );
  });

  it("renders labelAside when provided", () => {
    render(
      <FormField
        label="Password"
        id="password"
        type="password"
        value=""
        onChange={() => {}}
        labelAside={<a href="/forgot">Forgot?</a>}
      />
    );
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot?" })).toBeInTheDocument();
  });

  it("calls onChange when user types", () => {
    const handleChange = jest.fn();
    render(
      <FormField
        label="Email"
        id="email"
        type="email"
        value=""
        onChange={handleChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("FormError", () => {
  it("renders nothing when message and children are null/undefined", () => {
    const { container } = render(<FormError />);
    expect(container.firstChild).toBeNull();
  });

  it("renders message when provided", () => {
    render(<FormError message="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByText("Invalid email")).toHaveClass("text-destructive");
  });

  it("renders children when message is not provided", () => {
    render(<FormError>Something went wrong</FormError>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});

describe("FormSubmitButton", () => {
  it("renders submit button with children", () => {
    render(<FormSubmitButton>Submit</FormSubmitButton>);
    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("disables button when disabled prop is true", () => {
    render(<FormSubmitButton disabled>Submit</FormSubmitButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("FormDisplayField", () => {
  it("renders label and children", () => {
    render(
      <FormDisplayField label="Email">
        <span>user@example.com</span>
      </FormDisplayField>
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });
});
