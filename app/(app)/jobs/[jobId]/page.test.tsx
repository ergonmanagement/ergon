import { render, screen } from "@testing-library/react";
import JobDetailPage from "@/app/(app)/jobs/[jobId]/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock(
  "@/app/(app)/jobs/[jobId]/_components/job-detail-client",
  () => ({
    JobDetailClient: ({ jobId }: { jobId: string }) => (
      <div data-testid="job-detail-client">{jobId}</div>
    ),
  }),
);

describe("JobDetail page", () => {
  it("renders JobDetailClient with id", async () => {
    const content = await JobDetailPage({
      params: { jobId: "j1" },
    } as any);
    render(content);

    expect(screen.getByTestId("job-detail-client")).toHaveTextContent("j1");
  });
});

