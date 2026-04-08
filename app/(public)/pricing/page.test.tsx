import { render, screen } from "@testing-library/react";
import { PricingContent } from "@/app/(public)/pricing/page";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/app/(public)/pricing/_components/billing-cta", () => ({
  BillingCTA: () => (
    <div data-testid="billing-cta">BillingCTA</div>
  ),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Pricing page", () => {
  it("shows sign-up subscription CTA when logged out", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    });
    const ui = await PricingContent();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /Simple pricing for growing shops/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start subscription/i }),
    ).toHaveAttribute("href", "/auth/sign-up");
    expect(screen.queryByTestId("billing-cta")).not.toBeInTheDocument();
  });

  it("shows dashboard + billing CTA when logged in", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "u1" } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "u1" }, error: null }),
          }),
        }),
      }),
    });
    const ui = await PricingContent();
    render(ui);

    expect(screen.getByTestId("billing-cta")).toBeInTheDocument();
  });

  it("shows back to onboarding when logged in but not onboarded", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "u2" } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    const ui = await PricingContent();
    render(ui);

    expect(screen.queryByTestId("billing-cta")).not.toBeInTheDocument();
    expect(
      screen.getByText(/complete onboarding before starting your subscription/i),
    ).toBeInTheDocument();
  });
});

