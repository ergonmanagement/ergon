import { render, screen } from "@testing-library/react";
import ProfilePage from "@/app/(app)/profile/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "1", email: "user@example.com" },
    loading: false,
  }),
}));

jest.mock("@/hooks/use-profile", () => ({
  useProfile: () => ({
    profile: {
      profile_picture_url: null,
      first_name: "John",
      last_name: "Doe",
      created_at: "2025-01-01T00:00:00Z",
    },
    loading: false,
    error: null,
    saveProfileNames: jest.fn().mockResolvedValue({ error: null }),
  }),
}));

jest.mock("@/app/(app)/profile/_components/profile-image-upload", () => ({
  ProfileImageUpload: () => <div data-testid="profile-image-upload">Upload</div>,
}));

jest.mock("@/components/form", () => ({
  FormDisplayField: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`field-${label}`}>
      <span>{label}</span>
      {children}
    </div>
  ),
}));

describe("Profile page", () => {
  it("renders profile heading and user content when authenticated", () => {
    render(<ProfilePage />);
    expect(
      screen.getByRole("heading", { name: "Profile" })
    ).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("profile-image-upload")).toBeInTheDocument();
  });

  it("renders profile data from useProfile in editable fields", () => {
    render(<ProfilePage />);
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save personal info" }),
    ).toBeInTheDocument();
  });
});
