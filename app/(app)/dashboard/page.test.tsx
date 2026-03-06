import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

const mockUser = { email: "user@example.com" };

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock("@/app/dashboard/_components/dashboard-menu", () => ({
  DashboardMenu: () => <div data-testid="dashboard-menu">Menu</div>,
}));

jest.mock("@/app/dashboard/_components/dashboard-client", () => ({
  DashboardClient: () => (
    <div data-testid="dashboard-client">DashboardClient</div>
  ),
}));

describe("Dashboard page", () => {
  it("renders heading and welcome message with user email", async () => {
    const content = await DashboardPage();
    render(content);

    expect(
      screen.getByRole("heading", { name: /Dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Welcome, user@example\.com/)).toBeInTheDocument();
  });

  it("renders dashboard menu", async () => {
    const content = await DashboardPage();
    render(content);

    expect(screen.getByTestId("dashboard-menu")).toBeInTheDocument();
  });

  it("renders DashboardClient", async () => {
    const content = await DashboardPage();
    render(content);

    expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
  });
});
