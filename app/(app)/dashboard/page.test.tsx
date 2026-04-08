import { render, screen } from "@testing-library/react";
import { DashboardContent } from "@/app/(app)/dashboard/page";

const mockUser = { email: "user@example.com" };

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock("@/app/(app)/dashboard/_components/dashboard-client", () => ({
  DashboardClient: () => (
    <div data-testid="dashboard-client">DashboardClient</div>
  ),
}));

describe("Dashboard page", () => {
  it("renders heading and welcome message with user email", async () => {
    const ui = await DashboardContent();
    render(ui);

    expect(
      screen.getByRole("heading", { name: /Dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome back, user@example\.com/)
    ).toBeInTheDocument();
  });

  it("renders DashboardClient", async () => {
    const ui = await DashboardContent();
    render(ui);

    expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
  });
});
