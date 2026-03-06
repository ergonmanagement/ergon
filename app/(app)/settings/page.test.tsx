import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";

jest.mock("@/lib/auth", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ email: "user@example.com" })),
}));

jest.mock(
  "@/app/(app)/settings/_components/settings-client",
  () => ({
    SettingsClient: () => (
      <div data-testid="settings-client">SettingsClient</div>
    ),
  }),
);

describe("Settings page", () => {
  it("renders SettingsClient", async () => {
    const content = await SettingsPage();
    render(content);

    expect(screen.getByTestId("settings-client")).toBeInTheDocument();
  });
});

