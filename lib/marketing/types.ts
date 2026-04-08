/**
 * Shared marketing types (Edge + Next client type imports only).
 */

export type MarketingChannel = "social_post" | "email" | "sms" | "flyer";

export const MARKETING_CHANNELS: readonly MarketingChannel[] = [
  "social_post",
  "email",
  "sms",
  "flyer",
] as const;

export type MarketingAsset = {
  id: string;
  company_id: string;
  channel: MarketingChannel;
  content: string;
  context: string | null;
  status: string;
  created_at: string;
};

export type CompanyMarketingContext = {
  name: string | null;
  service_type: string | null;
};

/** Inputs for the marketing pipeline (Edge Function injects supabase client). */
export type MarketingGenerateParams = {
  supabase: any;
  userId: string;
  companyId: string;
  channel: MarketingChannel;
  context: string | null;
};
