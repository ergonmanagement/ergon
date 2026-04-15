import { render, screen, fireEvent, act } from "@testing-library/react";
import { MarketingClient } from "./marketing-client";

const mockGenerateAsset = jest.fn();
const mockSetFilter = jest.fn();

jest.mock("@/hooks/use-marketing", () => ({
  useMarketing: () => ({
    assets: [
      {
        id: "a1",
        company_id: "c1",
        channel: "social_post",
        content: "Post body",
        context: "ctx",
        status: "draft",
        created_at: "2026-01-01T12:00:00.000Z",
      },
    ],
    total: 1,
    loading: false,
    generating: false,
    error: null,
    filter: { page: 1, pageSize: 10 },
    setFilter: mockSetFilter,
    generateAsset: mockGenerateAsset,
  }),
}));

describe("MarketingClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders generate and calls generateAsset on submit", async () => {
    mockGenerateAsset.mockResolvedValue(true);
    render(<MarketingClient />);

    fireEvent.click(screen.getByRole("button", { name: /generate marketing content/i }));
    await act(async () => {});

    expect(mockGenerateAsset).toHaveBeenCalledWith({
      channel: "social_post",
      context: "",
    });
  });

  it("copies latest content to clipboard", async () => {
    render(<MarketingClient />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Post body");
  });

  it("calls regenerate via generateAsset", async () => {
    mockGenerateAsset.mockResolvedValue(true);
    render(<MarketingClient />);

    fireEvent.click(screen.getByRole("button", { name: /^regenerate$/i }));
    await act(async () => {});

    expect(mockGenerateAsset).toHaveBeenCalledWith({
      channel: "social_post",
      context: "",
    });
  });

  it("clears optional context after successful generate", async () => {
    mockGenerateAsset.mockResolvedValue(true);
    render(<MarketingClient />);

    const textarea = screen.getByLabelText(/optional context/i);
    fireEvent.change(textarea, { target: { value: "Summer promo in Utah" } });
    expect(textarea).toHaveValue("Summer promo in Utah");

    fireEvent.click(screen.getByRole("button", { name: /generate marketing content/i }));
    await act(async () => {});

    expect(textarea).toHaveValue("");
  });
});
