import { render, screen } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

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
  }),
}));

jest.mock("@/app/dashboard/_components/dashboard-menu", () => ({
  DashboardMenu: () => <div data-testid="dashboard-menu">Menu</div>,
}));

jest.mock("@/app/profile/_components/profile-image-upload", () => ({
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
    expect(screen.getByTestId("dashboard-menu")).toBeInTheDocument();
  });

  it("renders profile data from useProfile", () => {
    render(<ProfilePage />);
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
  });
});
