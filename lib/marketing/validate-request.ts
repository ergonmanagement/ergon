import type { MarketingChannel } from "./types";
import { MARKETING_CHANNELS } from "./types";
import { MARKETING_MAX_CONTEXT_LENGTH } from "./constants";

export function isMarketingChannel(value: string): value is MarketingChannel {
  return (MARKETING_CHANNELS as readonly string[]).includes(value);
}

/**
 * Non-AI validation: channel enum and context length.
 * Returns an error message or null if valid.
 */
export function validateMarketingRequest(
  channel: string,
  context: string | null | undefined,
): string | null {
  if (!isMarketingChannel(channel)) {
    return "Unsupported channel";
  }
  if (context != null && context.length > MARKETING_MAX_CONTEXT_LENGTH) {
    return "Context too long";
  }
  return null;
}
