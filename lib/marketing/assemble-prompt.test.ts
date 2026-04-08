import { assembleMarketingPrompt } from "./assemble-prompt";

describe("assembleMarketingPrompt", () => {
  const company = { name: "Acme", service_type: "Detailing" };

  it("includes channel-specific instruction for social_post", () => {
    const p = assembleMarketingPrompt("social_post", null, company);
    expect(p).toContain("Facebook or Instagram");
    expect(p).toContain("Acme");
    expect(p).toContain("Detailing");
  });

  it("includes email instruction", () => {
    const p = assembleMarketingPrompt("email", null, company);
    expect(p).toContain("marketing email");
  });

  it("includes sms instruction", () => {
    const p = assembleMarketingPrompt("sms", null, company);
    expect(p).toContain("SMS");
  });

  it("includes flyer instruction", () => {
    const p = assembleMarketingPrompt("flyer", null, company);
    expect(p).toContain("flyer");
  });

  it("embeds user context when provided", () => {
    const p = assembleMarketingPrompt(
      "email",
      "Spring promo 20% off",
      { name: null, service_type: null },
    );
    expect(p).toContain("Spring promo");
    expect(p).toContain("User-provided context");
  });

  it("uses generic line when no context", () => {
    const p = assembleMarketingPrompt("email", null, {
      name: null,
      service_type: null,
    });
    expect(p).toContain("No additional user context");
  });
});
