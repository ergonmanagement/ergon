import { render, screen } from "@testing-library/react";
import { HomeContent } from "@/app/page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getClaims: async () => ({ data: { claims: null } }),
    },
  })),
}));

describe("Home page", () => {
  it("renders the landing page for signed-out visitors", async () => {
    const ui = await HomeContent();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /run your business with clarity/i,
      }),
    ).toBeInTheDocument();
  });
});
