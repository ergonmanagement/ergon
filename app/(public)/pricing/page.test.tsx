import { render, screen } from "@testing-library/react";
import PricingPage from "@/app/(public)/pricing/page";

jest.mock("@/app/(public)/pricing/_components/billing-cta", () => ({
  BillingCTA: () => (
    <div data-testid="billing-cta">BillingCTA</div>
  ),
}));

describe("Pricing page", () => {
  it("renders pricing information and billing CTA", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("heading", {
        name: /Simple pricing for growing shops/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("billing-cta")).toBeInTheDocument();
  });
});

