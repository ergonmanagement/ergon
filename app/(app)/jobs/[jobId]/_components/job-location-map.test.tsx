import { render, screen, waitFor } from "@testing-library/react";
import { JobLocationMap } from "./job-location-map";

describe("JobLocationMap", () => {
  const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test_token";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("geocodes then shows static preview and Open in Maps link", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          features: [{ center: [-111.65, 40.23] }],
        }),
    });

    render(<JobLocationMap address="123 Main St, Provo UT" />);

    expect(screen.getByText("Loading map…")).toBeInTheDocument();

    await waitFor(
      () => {
        const img = screen.getByRole("img", {
          name: /map preview near 123 main st, provo ut/i,
        });
        expect(img).toHaveAttribute("src");
        expect(img.getAttribute("src")).toContain("api.mapbox.com");
        expect(img.getAttribute("src")).toContain("static/");
        expect(img.getAttribute("src")).toContain("-111.65");
        expect(img.getAttribute("src")).toContain("40.23");
      },
      { timeout: 5000 },
    );

    const link = screen.getByRole("link", { name: /open in maps/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20Provo%20UT",
    );
  });

  it("shows empty state when geocoder returns no features", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [] }),
    });

    render(<JobLocationMap address="zzznonexistent999" />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/could not be located on the map/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(
      screen.queryByRole("img", { name: /map preview/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open in maps/i })).toBeInTheDocument();
  });
});
