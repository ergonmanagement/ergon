import { render, screen } from "@testing-library/react";
import SchedulePage from "@/app/(app)/schedule/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock("@/app/(app)/schedule/_components/schedule-client", () => ({
  ScheduleClient: () => (
    <div data-testid="schedule-client">ScheduleClient</div>
  ),
}));

describe("Schedule page", () => {
  it("renders ScheduleClient", async () => {
    const content = await SchedulePage();
    render(content);

    expect(screen.getByTestId("schedule-client")).toBeInTheDocument();
    expect(screen.getByText("ScheduleClient")).toBeInTheDocument();
  });
});

