import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardMenu } from "@/app/dashboard/_components/dashboard-menu";

describe("DashboardMenu", () => {
  it("renders Menu button", () => {
    render(<DashboardMenu />);
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("opens dropdown when Menu is clicked", () => {
    render(<DashboardMenu />);
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile"
    );
  });

  it("closes dropdown when Profile link is clicked", () => {
    render(<DashboardMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Profile" }));
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <DashboardMenu />
        <div data-testid="outside">Outside</div>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });
});
