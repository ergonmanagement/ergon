import { render, screen } from "@testing-library/react";
import CustomerDetailPage from "@/app/(app)/customers/[customerId]/page";

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
    const content = await CustomerDetailPage({
      params: { customerId: "c1" },
    } as any);
    render(content);

    expect(
      screen.getByTestId("customer-detail-client"),
    ).toHaveTextContent("c1");
  });
});

