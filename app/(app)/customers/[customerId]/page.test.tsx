import { render, screen } from "@testing-library/react";
import { CustomerDetailContent } from "@/app/(app)/customers/[customerId]/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock(
  "@/app/(app)/customers/[customerId]/_components/customer-detail-client",
  () => ({
    CustomerDetailClient: ({ customerId }: { customerId: string }) => (
      <div data-testid="customer-detail-client">{customerId}</div>
    ),
  }),
);

describe("CustomerDetail page", () => {
  it("renders CustomerDetailClient with id", async () => {
    const ui = await CustomerDetailContent({ customerId: "c1" });
    render(ui);

    expect(screen.getByTestId("customer-detail-client")).toHaveTextContent(
      "c1",
    );
  });
});
