import type { MarketingChannel } from "./types";
import { MARKETING_SMS_MAX_LENGTH } from "./constants";

/**
 * PostProcessNode — trim whitespace; hard-cap SMS length (LLD / product).
 */
export function postProcessMarketingCopy(
  channel: MarketingChannel,
  raw: string,
): string {
  let out = raw.trim();
  if (channel === "sms" && out.length > MARKETING_SMS_MAX_LENGTH) {
    out = `${out.slice(0, MARKETING_SMS_MAX_LENGTH - 1).trimEnd()}…`;
  }
  return out;
}
