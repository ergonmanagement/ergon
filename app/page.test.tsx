import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// TODO: Update this test to match the actual homepage content
describe("Home page", () => {
  it("renders the landing page", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /run your business with/i })
    ).toBeInTheDocument();
  });
});
