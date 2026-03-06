import { render, screen } from "@testing-library/react";
import MarketingPage from "@/app/(app)/marketing/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock("@/app/(app)/marketing/_components/marketing-client", () => ({
  MarketingClient: () => (
    <div data-testid="marketing-client">MarketingClient</div>
  ),
}));

describe("Marketing page", () => {
  it("renders MarketingClient", async () => {
    const content = await MarketingPage();
    render(content);

    expect(screen.getByTestId("marketing-client")).toBeInTheDocument();
    expect(screen.getByText("MarketingClient")).toBeInTheDocument();
  });
});

