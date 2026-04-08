import { postProcessMarketingCopy } from "./post-process";
import { MARKETING_SMS_MAX_LENGTH } from "./constants";

describe("postProcessMarketingCopy", () => {
  it("trims whitespace for all channels", () => {
    expect(postProcessMarketingCopy("email", "  hello  ")).toBe("hello");
  });

  it("truncates SMS with ellipsis when over limit", () => {
    const long = "x".repeat(MARKETING_SMS_MAX_LENGTH + 50);
    const out = postProcessMarketingCopy("sms", long);
    expect(out.length).toBeLessThanOrEqual(MARKETING_SMS_MAX_LENGTH);
    expect(out.endsWith("…")).toBe(true);
  });

  it("does not truncate non-SMS", () => {
    const long = "x".repeat(500);
    expect(postProcessMarketingCopy("email", long)).toBe(long);
  });
});
