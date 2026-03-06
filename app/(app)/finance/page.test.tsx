import { render, screen } from "@testing-library/react";
import FinancePage from "@/app/(app)/finance/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock("@/app/(app)/finance/_components/finance-client", () => ({
  FinanceClient: () => (
    <div data-testid="finance-client">FinanceClient</div>
  ),
}));

describe("Finance page", () => {
  it("renders FinanceClient", async () => {
    const content = await FinancePage();
    render(content);

    expect(screen.getByTestId("finance-client")).toBeInTheDocument();
    expect(screen.getByText("FinanceClient")).toBeInTheDocument();
  });
});

