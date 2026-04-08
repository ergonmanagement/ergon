import {
  isMarketingChannel,
  validateMarketingRequest,
} from "./validate-request";
import { MARKETING_MAX_CONTEXT_LENGTH } from "./constants";

describe("validateMarketingRequest", () => {
  it("accepts valid channel and null context", () => {
    expect(validateMarketingRequest("social_post", null)).toBeNull();
  });

  it("rejects invalid channel", () => {
    expect(validateMarketingRequest("blog", null)).toBe("Unsupported channel");
  });

  it("rejects context over max length", () => {
    const long = "a".repeat(MARKETING_MAX_CONTEXT_LENGTH + 1);
    expect(validateMarketingRequest("email", long)).toBe("Context too long");
  });

  it("accepts context at max length", () => {
    const ok = "a".repeat(MARKETING_MAX_CONTEXT_LENGTH);
    expect(validateMarketingRequest("email", ok)).toBeNull();
  });
});

describe("isMarketingChannel", () => {
  it("narrows type for known channels", () => {
    expect(isMarketingChannel("sms")).toBe(true);
    expect(isMarketingChannel("flyer")).toBe(true);
    expect(isMarketingChannel("unknown")).toBe(false);
  });
});
