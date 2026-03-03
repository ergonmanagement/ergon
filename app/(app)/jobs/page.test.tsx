import { render, screen } from "@testing-library/react";
import JobsPage from "@/app/(app)/jobs/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock("@/app/(app)/jobs/_components/jobs-client", () => ({
  JobsClient: () => <div data-testid="jobs-client">JobsClient</div>,
}));

describe("Jobs page", () => {
  it("renders JobsClient", async () => {
    const content = await JobsPage();
    render(content);

    expect(screen.getByTestId("jobs-client")).toBeInTheDocument();
    expect(screen.getByText("JobsClient")).toBeInTheDocument();
  });
});

