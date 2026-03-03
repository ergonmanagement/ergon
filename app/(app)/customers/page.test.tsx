import { render, screen } from "@testing-library/react";
import CustomersPage from "@/app/(app)/customers/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock("@/app/(app)/customers/_components/customers-client", () => ({
  CustomersClient: () => (
    <div data-testid="customers-client">CustomersClient</div>
  ),
}));

describe("Customers page", () => {
  it("renders CustomersClient", async () => {
    const content = await CustomersPage();
    render(content);

    expect(screen.getByTestId("customers-client")).toBeInTheDocument();
    expect(screen.getByText("CustomersClient")).toBeInTheDocument();
  });
});

