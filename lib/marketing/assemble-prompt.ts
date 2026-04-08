import type { CompanyMarketingContext, MarketingChannel } from "./types";

/**
 * AssemblePromptInputsNode — builds the user message sent to OpenAI (LLD §7).
 */
export function assembleMarketingPrompt(
  channel: MarketingChannel,
  context: string | null,
  company: CompanyMarketingContext,
): string {
  const baseDescription = [
    "You are an assistant that writes clear, professional marketing copy.",
    "The business is a local service business.",
    "Avoid emojis and slang.",
  ].join(" ");

  const companyDescriptionParts: string[] = [];
  if (company.name) companyDescriptionParts.push(`Company name: ${company.name}.`);
  if (company.service_type) {
    companyDescriptionParts.push(`Service type: ${company.service_type}.`);
  }

  const channelInstruction =
    channel === "social_post"
      ? "Write a short social media post suitable for Facebook or Instagram."
      : channel === "email"
        ? "Write a concise marketing email."
        : channel === "sms"
          ? "Write a very short SMS message (max 160 characters)."
          : "Write copy suitable for a printable flyer.";

  const contextInstruction = context
    ? `User-provided context:\n${context}\n`
    : "No additional user context was provided. Focus on general value, clarity, and professionalism.\n";

  return [
    baseDescription,
    companyDescriptionParts.join(" "),
    "",
    channelInstruction,
    contextInstruction,
    "Return ONLY the marketing copy. Do not add explanations or headings.",
  ].join("\n");
}
